#!/usr/bin/env python3
"""Generate Supabase seed SQL for Customs MYC API029 requirements.

Requires a Customs OpenAPI key:

  CUSTOMS_API_SERVICE_KEY=... python3 scripts/generate_customs_confirmation_seed.py --limit 10

The script calls API029 `retrieveCcctLworCd` with HSK 10 digits and `imexTp=2`
for import requirements, then writes staged rows for
`customs_confirmation_requirements`.
"""

from __future__ import annotations

import argparse
import hashlib
import os
import sys
import time
import urllib.parse
import urllib.request
from urllib.error import HTTPError, URLError
from datetime import datetime, timezone
from pathlib import Path
from xml.etree import ElementTree as ET

SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR))

from generate_customs_excel_seed import copy_block, iter_xlsx_rows, rows_as_dicts, sha256_file  # noqa: E402

DEFAULT_ENDPOINT = "https://unipass.customs.go.kr:38010/ext/rest/ccctLworCdQry/retrieveCcctLworCd"
SOURCE_NAME = "관세청 세관장확인대상 법령코드 조회"
SOURCE_VERSION = "myc-openapi-api029-v1.0"


def load_dotenv(path: Path) -> None:
    if not path.exists():
        return

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def normalize_hsk(value: str) -> str:
    return "".join(char for char in value if char.isdigit())


def yyyymmdd_to_date(value: str) -> str | None:
    value = value.strip()
    if len(value) == 8 and value.isdigit():
        return f"{value[:4]}-{value[4:6]}-{value[6:8]}"
    return None


def local_name(tag: str) -> str:
    return tag.rsplit("}", 1)[-1]


def child_text(element: ET.Element, name: str) -> str:
    for child in element:
        if local_name(child.tag) == name:
            return (child.text or "").strip()
    return ""


def parse_api029_xml(raw_text: str) -> list[dict[str, str | None]]:
    root = ET.fromstring(raw_text)
    rows: list[dict[str, str | None]] = []
    for element in root.iter():
        if local_name(element.tag).lower() != "ccctlworcdqryrsltvo":
            continue
        rows.append({
            "hsk_code": child_text(element, "hsSgn"),
            "direction": "import" if child_text(element, "imexTp") != "1" else "export",
            "law_code": child_text(element, "dcerCfrmLworCd") or None,
            "related_law": child_text(element, "dcerCfrmLworNm"),
            "agency_code": child_text(element, "reqApreIttCd") or None,
            "agency": child_text(element, "reqApreIttNm") or None,
            "requirement_document_name": child_text(element, "reqCfrmIstmNm"),
            "effective_from": yyyymmdd_to_date(child_text(element, "aplyStrtDt")),
            "effective_to": yyyymmdd_to_date(child_text(element, "aplyEndDt")),
        })
    return rows


def hsk_codes_from_excel(path: Path, limit: int | None, only_hsk: list[str], hsk_prefixes: list[str]) -> list[str]:
    if only_hsk:
        return [normalize_hsk(value) for value in only_hsk if normalize_hsk(value)]

    prefixes = [normalize_hsk(value) for value in hsk_prefixes if normalize_hsk(value)]
    codes: list[str] = []
    seen: set[str] = set()
    for row in rows_as_dicts(iter_xlsx_rows(path)):
        hsk = normalize_hsk(row.get("HS부호", ""))
        if len(hsk) < 10 or hsk in seen:
            continue
        if prefixes and not any(hsk.startswith(prefix) for prefix in prefixes):
            continue
        seen.add(hsk)
        codes.append(hsk)
        if limit is not None and len(codes) >= limit:
            break
    return codes


def build_url(endpoint: str, service_key: str, hsk_code: str, direction: str) -> str:
    query = urllib.parse.urlencode({
        "crkyCn": service_key,
        "hsSgn": hsk_code,
        "imexTp": "2" if direction == "import" else "1",
    })
    return f"{endpoint}?{query}"


def redacted_url(url: str) -> str:
    parsed = urllib.parse.urlsplit(url)
    pairs = urllib.parse.parse_qsl(parsed.query, keep_blank_values=True)
    redacted = urllib.parse.urlencode([(key, "[redacted]" if key == "crkyCn" else value) for key, value in pairs])
    return urllib.parse.urlunsplit((parsed.scheme, parsed.netloc, parsed.path, redacted, parsed.fragment))


def fetch_requirement_rows(
    endpoint: str,
    service_key: str,
    hsk_code: str,
    direction: str,
    retries: int,
    retry_sleep_seconds: float,
) -> tuple[str, str, list[dict[str, str | None]]]:
    url = build_url(endpoint, service_key, hsk_code, direction)
    last_error: Exception | None = None

    for attempt in range(retries + 1):
        try:
            with urllib.request.urlopen(url, timeout=30) as response:
                raw = response.read().decode("utf-8", errors="replace")
            return raw, redacted_url(url), parse_api029_xml(raw)
        except (HTTPError, URLError, TimeoutError) as error:
            last_error = error
            if attempt >= retries:
                break
            time.sleep(retry_sleep_seconds * (attempt + 1))

    raise RuntimeError(f"API029 request failed for {hsk_code}: {last_error}") from last_error


def seed_rows(args: argparse.Namespace, retrieved_at: str) -> list[list[object]]:
    load_dotenv(Path(".env.local"))
    key = args.service_key or os.environ.get("CUSTOMS_API_SERVICE_KEY") or os.environ.get("PUBLIC_DATA_SERVICE_KEY")
    if not key:
        raise SystemExit("CUSTOMS_API_SERVICE_KEY 또는 PUBLIC_DATA_SERVICE_KEY가 필요합니다.")

    output: list[list[object]] = []
    hsk_codes = hsk_codes_from_excel(args.hs_file, args.limit, args.hsk, args.hsk_prefix)
    for index, hsk_code in enumerate(hsk_codes, start=1):
        if args.progress_every and (index == 1 or index % args.progress_every == 0 or index == len(hsk_codes)):
            print(f"API029 {index}/{len(hsk_codes)} {hsk_code}", file=sys.stderr)
        raw, source_url, rows = fetch_requirement_rows(args.endpoint, key, hsk_code, args.direction, args.retries, args.retry_sleep_seconds)
        checksum = hashlib.sha256(raw.encode("utf-8")).hexdigest()
        for row in rows:
            if row["direction"] != args.direction:
                continue
            if not row["requirement_document_name"] or not row["related_law"]:
                continue
            output.append([
                row["hsk_code"] or hsk_code,
                row["direction"],
                row["requirement_document_name"],
                row["related_law"],
                row["law_code"],
                row["agency_code"],
                row["agency"],
                SOURCE_NAME,
                source_url,
                SOURCE_VERSION,
                row["effective_from"] or args.effective_from,
                row["effective_to"] or args.effective_to,
                None,
                retrieved_at,
                "staged",
                checksum,
            ])
        if args.sleep_seconds > 0 and index < (args.limit or index + 1):
            time.sleep(args.sleep_seconds)
    return output


def write_seed(args: argparse.Namespace) -> None:
    retrieved_at = datetime.now(timezone.utc).isoformat()
    rows = seed_rows(args, retrieved_at)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("w", encoding="utf-8") as out:
        out.write("-- Generated by scripts/generate_customs_confirmation_seed.py\n")
        out.write("begin;\n")
        out.write(f"delete from public.customs_confirmation_requirements where source_version = '{SOURCE_VERSION}';\n")
        out.write(copy_block("public.customs_confirmation_requirements", [
            "hsk_code",
            "direction",
            "requirement_document_name",
            "related_law",
            "law_code",
            "agency_code",
            "agency",
            "source_name",
            "source_url",
            "source_version",
            "effective_from",
            "effective_to",
            "published_at",
            "retrieved_at",
            "status",
            "checksum",
        ], rows))
        out.write("commit;\n")
    print(f"wrote {args.output} ({len(rows)} rows)")


def main() -> None:
    parser = argparse.ArgumentParser()
    downloads = Path.home() / "Downloads"
    parser.add_argument("--hs-file", type=Path, default=downloads / "관세청_HS부호_20260101.xlsx")
    parser.add_argument("--endpoint", default=DEFAULT_ENDPOINT)
    parser.add_argument("--service-key")
    parser.add_argument("--direction", choices=["import", "export"], default="import")
    parser.add_argument("--hsk", action="append", default=[], help="Specific HSK code to query. Can be repeated.")
    parser.add_argument("--hsk-prefix", action="append", default=[], help="Query HSK codes from the HS master file that start with this prefix. Can be repeated.")
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--sleep-seconds", type=float, default=0.05)
    parser.add_argument("--retries", type=int, default=3)
    parser.add_argument("--retry-sleep-seconds", type=float, default=2.0)
    parser.add_argument("--progress-every", type=int, default=250)
    parser.add_argument("--effective-from", default="2026-01-01")
    parser.add_argument("--effective-to", default=None)
    parser.add_argument("--output", type=Path, default=Path("supabase/seed/generated/customs_confirmation_requirements_seed.sql"))
    args = parser.parse_args()
    write_seed(args)


if __name__ == "__main__":
    main()
