#!/usr/bin/env python3
"""Generate Supabase seed SQL for Customs MYC API018 HS code search rows.

This script stores API018 responses in `customs_hs_code_search_items` so user
lookups can query our DB instead of calling Customs API018 at request time.

Examples:

  CUSTOMS_API_HS_CODE_SERVICE_KEY=... python3 scripts/generate_customs_hs_code_search_seed.py --hsk-prefix 3304
  CUSTOMS_API_HS_CODE_SERVICE_KEY=... python3 scripts/generate_customs_hs_code_search_seed.py --query "프린터" --query "버섯"
"""

from __future__ import annotations

import argparse
import hashlib
import os
import sys
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from xml.etree import ElementTree as ET

SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR))

from generate_customs_excel_seed import copy_block, iter_xlsx_rows, rows_as_dicts  # noqa: E402

DEFAULT_ENDPOINT = "https://unipass.customs.go.kr:38010/ext/rest/hsSgnQry/searchHsSgn"
SOURCE_NAME = "관세청 HS부호검색"
SOURCE_VERSION_PREFIX = "myc-openapi-api018-v1.0"


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


def local_name(tag: str) -> str:
    return tag.rsplit("}", 1)[-1]


def child_text(element: ET.Element, name: str) -> str:
    for child in element:
        if local_name(child.tag) == name:
            return (child.text or "").strip()
    return ""


def sql(value: object) -> str:
    if value is None:
        return "null"
    return "'" + str(value).replace("'", "''") + "'"


def redacted_url(url: str) -> str:
    parsed = urllib.parse.urlsplit(url)
    pairs = urllib.parse.parse_qsl(parsed.query, keep_blank_values=True)
    redacted = urllib.parse.urlencode([(key, "[redacted]" if key == "crkyCn" else value) for key, value in pairs])
    return urllib.parse.urlunsplit((parsed.scheme, parsed.netloc, parsed.path, redacted, parsed.fragment))


def parse_api018_xml(raw_text: str) -> list[dict[str, str]]:
    root = ET.fromstring(raw_text)
    rows: list[dict[str, str]] = []

    for element in root.iter():
        if local_name(element.tag) != "hsSgnSrchRsltVo":
            continue

        hsk_code = child_text(element, "hsSgn")
        korean_name = child_text(element, "korePrnm")
        english_name = child_text(element, "englPrnm")
        if not hsk_code and not korean_name and not english_name:
            continue

        rows.append({
            "hsk_code": normalize_hsk(hsk_code),
            "hs6": normalize_hsk(hsk_code)[:6],
            "korean_name": korean_name,
            "english_name": english_name,
            "quantity_unit": child_text(element, "qtyUt"),
            "weight_unit": child_text(element, "wghtUt"),
            "rate_text": child_text(element, "txrt"),
            "rate_type_code": child_text(element, "txtpSgn"),
        })

    return [row for row in rows if row["hsk_code"] or row["korean_name"] or row["english_name"]]


def hsk_codes_from_excel(path: Path, limit: int | None, only_hsk: list[str], hsk_prefixes: list[str]) -> list[str]:
    if only_hsk:
        return [normalize_hsk(value) for value in only_hsk if normalize_hsk(value)]

    prefixes = [normalize_hsk(value) for value in hsk_prefixes if normalize_hsk(value)]
    if not path.exists():
        if prefixes:
            return prefixes
        return []

    codes: list[str] = []
    seen: set[str] = set()
    for row in rows_as_dicts(iter_xlsx_rows(path)):
        hsk = normalize_hsk(row.get("HS부호", ""))
        if len(hsk) < 4 or hsk in seen:
            continue
        if prefixes and not any(hsk.startswith(prefix) for prefix in prefixes):
            continue
        seen.add(hsk)
        codes.append(hsk)
        if limit is not None and len(codes) >= limit:
            break
    return codes


def build_url(endpoint: str, service_key: str, *, hsk_code: str | None = None, product_name: str | None = None, language: str = "ko") -> str:
    query = {
        "crkyCn": service_key,
        "koenTp": "2" if language == "en" else "1",
    }
    if hsk_code:
        query["hsSgn"] = hsk_code
    if product_name:
        query["prnm"] = product_name
    return f"{endpoint}?{urllib.parse.urlencode(query)}"


def fetch_rows(
    endpoint: str,
    service_key: str,
    *,
    hsk_code: str | None,
    product_name: str | None,
    language: str,
    retries: int,
    retry_sleep_seconds: float,
) -> tuple[str, str, list[dict[str, str]]]:
    url = build_url(endpoint, service_key, hsk_code=hsk_code, product_name=product_name, language=language)
    last_error: Exception | None = None

    for attempt in range(retries + 1):
        try:
            with urllib.request.urlopen(url, timeout=30) as response:
                raw = response.read().decode("utf-8", errors="replace")
            return raw, redacted_url(url), parse_api018_xml(raw)
        except (HTTPError, URLError, TimeoutError, ET.ParseError) as error:
            last_error = error
            if attempt >= retries:
                break
            time.sleep(retry_sleep_seconds * (attempt + 1))

    raise RuntimeError(f"API018 request failed: {redacted_url(url)}: {last_error}") from last_error


def seed_rows(args: argparse.Namespace, retrieved_at: str) -> tuple[list[list[object]], list[str]]:
    load_dotenv(Path(".env.local"))
    key = (
        args.service_key
        or os.environ.get("CUSTOMS_API_HS_CODE_SERVICE_KEY")
        or os.environ.get("CUSTOMS_API_SERVICE_KEY")
        or os.environ.get("PUBLIC_DATA_SERVICE_KEY")
    )
    if not key:
        raise SystemExit("CUSTOMS_API_HS_CODE_SERVICE_KEY 또는 CUSTOMS_API_SERVICE_KEY가 필요합니다.")

    source_version = args.source_version or f"{SOURCE_VERSION_PREFIX}:{retrieved_at[:7]}"
    output: list[list[object]] = []
    raw_checksums: list[str] = []
    seen: set[tuple[str, str, str, str]] = set()
    requests: list[tuple[str | None, str | None, str]] = []

    for hsk in hsk_codes_from_excel(args.hs_file, args.limit, args.hsk, args.hsk_prefix):
        requests.append((hsk, None, "ko"))

    for query in args.query:
        requests.append((None, query, args.language))

    if not requests:
        raise SystemExit("조회할 --hsk, --hsk-prefix, --query 중 하나가 필요합니다.")

    for index, (hsk_code, product_name, language) in enumerate(requests, start=1):
        if args.progress_every and (index == 1 or index % args.progress_every == 0 or index == len(requests)):
            label = hsk_code or product_name or "-"
            print(f"API018 {index}/{len(requests)} {label}", file=sys.stderr)

        raw, source_url, rows = fetch_rows(
            args.endpoint,
            key,
            hsk_code=hsk_code,
            product_name=product_name,
            language=language,
            retries=args.retries,
            retry_sleep_seconds=args.retry_sleep_seconds,
        )
        raw_checksums.append(hashlib.sha256(raw.encode("utf-8")).hexdigest())

        for row in rows:
            hsk = row["hsk_code"]
            if not hsk:
                continue
            identity = (hsk, row["korean_name"], row["english_name"], source_version)
            if identity in seen:
                continue
            seen.add(identity)
            row_checksum = hashlib.sha256("|".join([
                hsk,
                row["korean_name"],
                row["english_name"],
                row["quantity_unit"],
                row["weight_unit"],
                row["rate_text"],
                row["rate_type_code"],
                source_version,
            ]).encode("utf-8")).hexdigest()
            output.append([
                hsk,
                row["hs6"],
                row["korean_name"] or None,
                row["english_name"] or None,
                row["quantity_unit"] or None,
                row["weight_unit"] or None,
                row["rate_text"] or None,
                row["rate_type_code"] or None,
                SOURCE_NAME,
                source_url,
                source_version,
                args.effective_from,
                args.effective_to,
                None,
                retrieved_at,
                "staged",
                row_checksum,
            ])

        if args.sleep_seconds > 0 and index < len(requests):
            time.sleep(args.sleep_seconds)

    return output, raw_checksums


def write_seed(args: argparse.Namespace) -> None:
    retrieved_at = datetime.now(timezone.utc).isoformat()
    rows, raw_checksums = seed_rows(args, retrieved_at)
    source_version = args.source_version or f"{SOURCE_VERSION_PREFIX}:{retrieved_at[:7]}"
    snapshot_checksum = hashlib.sha256("|".join(sorted(raw_checksums)).encode("utf-8")).hexdigest()
    args.output.parent.mkdir(parents=True, exist_ok=True)

    with args.output.open("w", encoding="utf-8") as out:
        out.write("-- Generated by scripts/generate_customs_hs_code_search_seed.py\n")
        out.write("begin;\n")
        out.write("insert into public.legal_source_snapshots (\n")
        out.write("  source_type, source_name, source_url, source_version, retrieved_at, effective_from, effective_to, checksum, status\n")
        out.write(")\n")
        out.write("select ")
        out.write(", ".join([
            sql("customs_hs_code_search_items"),
            sql(SOURCE_NAME),
            sql(args.endpoint),
            sql(source_version),
            sql(retrieved_at),
            sql(args.effective_from),
            sql(args.effective_to),
            sql(snapshot_checksum),
            sql("parsed"),
        ]))
        out.write("\nwhere not exists (\n")
        out.write("  select 1 from public.legal_source_snapshots\n")
        out.write(f"  where source_type = 'customs_hs_code_search_items' and source_version = {sql(source_version)} and checksum = {sql(snapshot_checksum)}\n")
        out.write(");\n")
        out.write("create temp table tmp_customs_hs_code_search_items (like public.customs_hs_code_search_items including defaults);\n")
        out.write(copy_block("tmp_customs_hs_code_search_items", [
            "hsk_code",
            "hs6",
            "korean_name",
            "english_name",
            "quantity_unit",
            "weight_unit",
            "rate_text",
            "rate_type_code",
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
        out.write("insert into public.customs_hs_code_search_items (\n")
        out.write("  hsk_code, hs6, korean_name, english_name, quantity_unit, weight_unit, rate_text, rate_type_code,\n")
        out.write("  source_name, source_url, source_version, effective_from, effective_to, published_at, retrieved_at, status, checksum\n")
        out.write(")\n")
        out.write("select hsk_code, hs6, korean_name, english_name, quantity_unit, weight_unit, rate_text, rate_type_code,\n")
        out.write("  source_name, source_url, source_version, effective_from, effective_to, published_at, retrieved_at, status, checksum\n")
        out.write("from tmp_customs_hs_code_search_items\n")
        out.write(
            "on conflict (hsk_code, korean_name, english_name, source_version) do update set\n"
            "  hs6 = excluded.hs6,\n"
            "  quantity_unit = excluded.quantity_unit,\n"
            "  weight_unit = excluded.weight_unit,\n"
            "  rate_text = excluded.rate_text,\n"
            "  rate_type_code = excluded.rate_type_code,\n"
            "  source_name = excluded.source_name,\n"
            "  source_url = excluded.source_url,\n"
            "  effective_from = excluded.effective_from,\n"
            "  effective_to = excluded.effective_to,\n"
            "  retrieved_at = excluded.retrieved_at,\n"
            "  status = excluded.status,\n"
            "  checksum = excluded.checksum;\n"
        )
        out.write("commit;\n")

    print(f"wrote {args.output} ({len(rows)} rows, source_version={source_version})")


def main() -> None:
    load_dotenv(Path(".env.local"))
    parser = argparse.ArgumentParser()
    downloads = Path.home() / "Downloads"
    parser.add_argument("--hs-file", type=Path, default=downloads / "관세청_HS부호_20260101.xlsx")
    parser.add_argument("--endpoint", default=os.environ.get("CUSTOMS_API_HS_CODE_URL", DEFAULT_ENDPOINT))
    parser.add_argument("--service-key")
    parser.add_argument("--hsk", action="append", default=[], help="Specific HSK code to query. Can be repeated.")
    parser.add_argument("--hsk-prefix", action="append", default=[], help="Query HSK codes from the HS master file that start with this prefix. Can be repeated.")
    parser.add_argument("--query", action="append", default=[], help="Product name query to collect. Can be repeated.")
    parser.add_argument("--language", choices=["ko", "en"], default="ko")
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--sleep-seconds", type=float, default=0.05)
    parser.add_argument("--retries", type=int, default=3)
    parser.add_argument("--retry-sleep-seconds", type=float, default=2.0)
    parser.add_argument("--progress-every", type=int, default=250)
    parser.add_argument("--source-version")
    parser.add_argument("--effective-from", default="2026-01-01")
    parser.add_argument("--effective-to", default=None)
    parser.add_argument("--output", type=Path, default=Path("supabase/seed/generated/customs_hs_code_search_api018_seed.sql"))
    args = parser.parse_args()
    write_seed(args)


if __name__ == "__main__":
    main()
