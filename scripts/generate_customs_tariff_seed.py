#!/usr/bin/env python3
"""Generate Supabase seed SQL for Customs MYC API030 tariff rates.

Requires a Customs OpenAPI key:

  CUSTOMS_API_SERVICE_KEY=... python3 scripts/generate_customs_tariff_seed.py --hsk 3304101000

The script calls API030 `retrieveTrrt` with HSK 10 digits and writes staged rows
for `tariff_rates`.
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
from xml.etree import ElementTree as ET

SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR))

from generate_customs_excel_seed import copy_block, iter_xlsx_rows, numeric_or_none, rows_as_dicts  # noqa: E402

DEFAULT_ENDPOINT = "https://unipass.customs.go.kr:38010/ext/rest/trrtQry/retrieveTrrt"
SOURCE_NAME = "관세청 관세율 조회"
SOURCE_VERSION = "myc-openapi-api030-v1.0"


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


def parse_api030_xml(raw_text: str) -> list[dict[str, str | None]]:
    root = ET.fromstring(raw_text)
    rows: list[dict[str, str | None]] = []
    for element in root.iter():
        if local_name(element.tag).lower() != "trrtqryrsltvo":
            continue
        rows.append({
            "hsk_code": child_text(element, "hsSgn"),
            "rate_type": child_text(element, "trrtTpcd"),
            "rate_name": child_text(element, "trrtTpNm") or None,
            "duty_rate": numeric_or_none(child_text(element, "trrt")),
            "unit_duty": numeric_or_none(child_text(element, "prutXamt")),
            "base_price": numeric_or_none(child_text(element, "basePrc")),
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


def build_url(endpoint: str, service_key: str, hsk_code: str, tariff_type_code: str | None) -> str:
    query = {
        "crkyCn": service_key,
        "hsSgn": hsk_code,
    }
    if tariff_type_code:
        query["trrtTpcd"] = tariff_type_code
    return f"{endpoint}?{urllib.parse.urlencode(query)}"


def redacted_url(url: str) -> str:
    parsed = urllib.parse.urlsplit(url)
    pairs = urllib.parse.parse_qsl(parsed.query, keep_blank_values=True)
    redacted = urllib.parse.urlencode([(key, "[redacted]" if key == "crkyCn" else value) for key, value in pairs])
    return urllib.parse.urlunsplit((parsed.scheme, parsed.netloc, parsed.path, redacted, parsed.fragment))


def fetch_tariff_rows(endpoint: str, service_key: str, hsk_code: str, tariff_type_code: str | None) -> tuple[str, str, list[dict[str, str | None]]]:
    url = build_url(endpoint, service_key, hsk_code, tariff_type_code)
    with urllib.request.urlopen(url, timeout=30) as response:
        raw = response.read().decode("utf-8", errors="replace")
    return raw, redacted_url(url), parse_api030_xml(raw)


def seed_rows(args: argparse.Namespace, retrieved_at: str) -> list[list[object]]:
    key = args.service_key or os.environ.get("CUSTOMS_API_TARIFF_RATE_SERVICE_KEY") or os.environ.get("CUSTOMS_API_SERVICE_KEY") or os.environ.get("PUBLIC_DATA_SERVICE_KEY")
    if not key:
        raise SystemExit("CUSTOMS_API_TARIFF_RATE_SERVICE_KEY 또는 CUSTOMS_API_SERVICE_KEY가 필요합니다.")

    output: list[list[object]] = []
    for index, hsk_code in enumerate(hsk_codes_from_excel(args.hs_file, args.limit, args.hsk, args.hsk_prefix), start=1):
        raw, source_url, rows = fetch_tariff_rows(args.endpoint, key, hsk_code, args.tariff_type_code)
        checksum = hashlib.sha256(raw.encode("utf-8")).hexdigest()
        for row in rows:
            if not row["hsk_code"] or not row["rate_type"]:
                continue
            output.append([
                row["hsk_code"] or hsk_code,
                row["rate_type"],
                row["duty_rate"],
                row["unit_duty"],
                row["rate_name"],
                None,
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
        out.write("-- Generated by scripts/generate_customs_tariff_seed.py\n")
        out.write("begin;\n")
        out.write(f"delete from public.tariff_rates where source_version = '{SOURCE_VERSION}';\n")
        out.write(copy_block("public.tariff_rates", [
            "hsk_code",
            "rate_type",
            "duty_rate",
            "unit_duty",
            "country_group",
            "usage_rate_type",
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
    parser.add_argument("--tariff-type-code", help="Optional API030 trrtTpcd filter, e.g. A or C.")
    parser.add_argument("--hsk", action="append", default=[], help="Specific HSK code to query. Can be repeated.")
    parser.add_argument("--hsk-prefix", action="append", default=[], help="Query HSK codes from the HS master file that start with this prefix. Can be repeated.")
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--sleep-seconds", type=float, default=0.05)
    parser.add_argument("--effective-from", default="2026-01-01")
    parser.add_argument("--effective-to", default=None)
    parser.add_argument("--output", type=Path, default=Path("supabase/seed/generated/customs_tariff_rates_api030_seed.sql"))
    args = parser.parse_args()
    write_seed(args)


if __name__ == "__main__":
    main()
