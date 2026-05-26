#!/usr/bin/env python3
"""Generate Supabase seed SQL for Customs MYC API005 shed/bonded-area info."""

from __future__ import annotations

import argparse
import hashlib
import os
import re
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from xml.etree import ElementTree as ET

SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR))

from generate_customs_excel_seed import copy_block  # noqa: E402

DEFAULT_SHED_ENDPOINT = "https://unipass.customs.go.kr:38010/ext/rest/shedInfoQry/retrieveShedInfo"
DEFAULT_STATS_ENDPOINT = "https://unipass.customs.go.kr:38010/ext/rest/statsSgnQry/retrieveStatsSgnBrkd"
SOURCE_NAME = "관세청 장치장정보조회"
SOURCE_VERSION = "myc-openapi-api005-v1.0"


def local_name(tag: str) -> str:
    return tag.rsplit("}", 1)[-1]


def child_text(element: ET.Element, name: str) -> str:
    for child in element:
        if local_name(child.tag).lower() == name.lower():
            return (child.text or "").strip()
    return ""


def redacted_url(url: str) -> str:
    parsed = urllib.parse.urlsplit(url)
    pairs = urllib.parse.parse_qsl(parsed.query, keep_blank_values=True)
    redacted = urllib.parse.urlencode([(key, "[redacted]" if key == "crkyCn" else value) for key, value in pairs])
    return urllib.parse.urlunsplit((parsed.scheme, parsed.netloc, parsed.path, redacted, parsed.fragment))


def fetch_text(endpoint: str, params: dict[str, str], timeout: int) -> tuple[str, str]:
    url = f"{endpoint}?{urllib.parse.urlencode(params)}"
    with urllib.request.urlopen(url, timeout=timeout) as response:
        raw = response.read().decode("utf-8", errors="replace")
    return raw, redacted_url(url)


def parse_customs_office_codes(raw_text: str) -> list[str]:
    root = ET.fromstring(raw_text)
    codes: list[str] = []
    seen: set[str] = set()
    for element in root.iter():
        if local_name(element.tag) != "statsSgnQryVo2":
            continue
        code = child_text(element, "cdValtVal")
        if not re.fullmatch(r"\d{3}", code):
            continue
        if code in {"000", "001", "002", "003", "004"}:
            continue
        if code not in seen:
            codes.append(code)
            seen.add(code)
    return codes


def fetch_customs_office_codes(args: argparse.Namespace) -> list[str]:
    if args.customs_code:
        return args.customs_code

    stats_key = args.stats_service_key or os.environ.get("CUSTOMS_API_STATS_CODE_SERVICE_KEY")
    if not stats_key:
        raise SystemExit("--customs-code 또는 CUSTOMS_API_STATS_CODE_SERVICE_KEY가 필요합니다.")

    raw, _ = fetch_text(args.stats_endpoint, {"crkyCn": stats_key, "statsSgnTp": "A09"}, args.timeout)
    codes = parse_customs_office_codes(raw)
    if not codes:
        raise SystemExit("API019 A09에서 세관코드를 찾지 못했습니다.")
    return codes


def infer_facility_type(name: str, address: str, unloading_place_bonded_area_yn: str) -> tuple[str, str]:
    flag = unloading_place_bonded_area_yn.upper()
    if flag == "Y":
        return "cy", "unloading_place_flag"
    if flag == "N":
        return "cfs", "unloading_place_flag"

    text = f"{name} {address}".upper()
    if "CFS" in text:
        return "cfs", "auto_name_rule"
    if "CY" in text:
        return "cy", "auto_name_rule"
    if "터미널" in text or "TERMINAL" in text:
        return "terminal", "auto_name_rule"
    if "공항" in text or "AIRPORT" in text:
        return "airport", "auto_name_rule"
    if "보세창고" in text or "창고" in text or "WAREHOUSE" in text:
        return "bonded_warehouse", "auto_name_rule"
    if name or address:
        return "other", "auto_name_rule"
    return "unknown", "unclassified"


def parse_shed_rows(raw_text: str, customs_office_code: str, source_url: str, retrieved_at: str) -> list[list[object]]:
    root = ET.fromstring(raw_text)
    rows: list[list[object]] = []
    checksum = hashlib.sha256(raw_text.encode("utf-8")).hexdigest()

    for element in root.iter():
        if local_name(element.tag) != "shedInfoQryRsltVo":
            continue

        shed_code = child_text(element, "snarSgn")
        shed_name = child_text(element, "snarNm")
        shed_address = child_text(element, "snarAddr")
        unloading_place_bonded_area_yn = child_text(element, "ldunPlcSnarYn")
        raw_xml = ET.tostring(element, encoding="unicode")
        if not shed_code:
            continue
        facility_type, facility_type_source = infer_facility_type(shed_name, shed_address, unloading_place_bonded_area_yn)

        rows.append([
            shed_code,
            customs_office_code,
            shed_name or None,
            shed_address or None,
            child_text(element, "snartelno") or None,
            child_text(element, "pnltLvyTrgtYn") or None,
            child_text(element, "adtxColtPridYn") or None,
            unloading_place_bonded_area_yn or None,
            facility_type,
            facility_type_source,
            raw_xml,
            SOURCE_NAME,
            source_url,
            SOURCE_VERSION,
            "2026-05-27",
            None,
            retrieved_at,
            retrieved_at,
            "published",
            checksum,
        ])
    return rows


def collect_rows(args: argparse.Namespace) -> list[list[object]]:
    key = args.service_key or os.environ.get("CUSTOMS_API_SHED_INFO_SERVICE_KEY")
    if not key:
        raise SystemExit("CUSTOMS_API_SHED_INFO_SERVICE_KEY가 필요합니다.")

    retrieved_at = datetime.now(timezone.utc).isoformat()
    rows: list[list[object]] = []
    seen: set[str] = set()
    for code in fetch_customs_office_codes(args):
        raw, source_url = fetch_text(args.endpoint, {"crkyCn": key, "jrsdCstmCd": code}, args.timeout)
        for row in parse_shed_rows(raw, code, source_url, retrieved_at):
            shed_code = str(row[0])
            if shed_code in seen:
                continue
            rows.append(row)
            seen.add(shed_code)
        print(f"fetched customs office {code}: total {len(rows)} rows", file=sys.stderr)
    return rows


def write_seed(args: argparse.Namespace) -> None:
    rows = collect_rows(args)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("w", encoding="utf-8") as out:
        out.write("-- Generated by scripts/generate_customs_shed_info_seed.py\n")
        out.write("begin;\n")
        out.write(f"delete from public.customs_shed_info where source_version = '{SOURCE_VERSION}';\n")
        out.write(copy_block("public.customs_shed_info", [
            "shed_code",
            "customs_office_code",
            "shed_name",
            "shed_address",
            "telephone",
            "penalty_target_yn",
            "additional_tax_collection_period_yn",
            "unloading_place_bonded_area_yn",
            "facility_type",
            "facility_type_source",
            "raw_xml",
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
    parser.add_argument("--endpoint", default=DEFAULT_SHED_ENDPOINT)
    parser.add_argument("--stats-endpoint", default=DEFAULT_STATS_ENDPOINT)
    parser.add_argument("--service-key")
    parser.add_argument("--stats-service-key")
    parser.add_argument("--customs-code", action="append")
    parser.add_argument("--timeout", type=int, default=30)
    parser.add_argument("--output", type=Path, default=Path("supabase/seed/generated/customs_shed_info_api005_seed.sql"))
    args = parser.parse_args()
    write_seed(args)


if __name__ == "__main__":
    main()
