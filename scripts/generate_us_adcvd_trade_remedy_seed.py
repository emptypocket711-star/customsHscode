#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import hashlib
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable

SCRIPT_DIR = Path(__file__).resolve().parent
ROOT = SCRIPT_DIR.parents[0]
sys.path.insert(0, str(SCRIPT_DIR))

from generate_customs_excel_seed import copy_block, iter_xlsx_rows, rows_as_dicts, sha256_file  # noqa: E402

OUTPUT = ROOT / "supabase/seed/generated/us_adcvd_trade_remedy_cases_seed.sql"
SOURCE_NAME = "CBP ACE ES-105 Active AD/CVD Case Report"
SOURCE_URL = "https://www.cbp.gov/trade/priority-issues/adcvd/data"

ISO2_TO_ISO3 = {
    "BD": "BGD",
    "BR": "BRA",
    "CA": "CAN",
    "CN": "CHN",
    "DE": "DEU",
    "GB": "GBR",
    "HK": "HKG",
    "ID": "IDN",
    "IN": "IND",
    "IT": "ITA",
    "JP": "JPN",
    "KR": "KOR",
    "MX": "MEX",
    "MY": "MYS",
    "RU": "RUS",
    "TH": "THA",
    "TR": "TUR",
    "TW": "TWN",
    "US": "USA",
    "VN": "VNM",
}

ALIASES = {
    "case_number": [
        "case number",
        "case no",
        "case",
        "ad/cvd case number",
        "ad cvd case number",
        "case_number",
    ],
    "destination_hs_code": [
        "tariff number",
        "hts",
        "hts number",
        "htsno",
        "hs number",
        "tariff_number",
    ],
    "origin_country_code": [
        "iso country code",
        "country code",
        "country",
        "origin country",
        "iso",
    ],
    "case_title": [
        "short description",
        "case description",
        "description",
        "product description",
        "case title",
    ],
    "remedy_type": [
        "case type",
        "type",
        "ad/cvd",
        "proceeding type",
    ],
    "rate_text": [
        "rate",
        "cash deposit rate",
        "duty rate",
        "ad/cvd rate",
    ],
    "producer_exporter": [
        "company",
        "producer",
        "exporter",
        "manufacturer",
        "producer/exporter",
    ],
    "scope_summary": [
        "scope",
        "scope summary",
        "scope description",
    ],
}


def normalized_header(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", value.strip().lower()).strip()


def normalize_hs_code(value: str | None) -> str:
    return re.sub(r"[^0-9]", "", value or "")


def normalize_origin_country(value: str | None) -> str | None:
    cleaned = re.sub(r"[^A-Za-z]", "", value or "").upper()
    if not cleaned:
        return None
    if len(cleaned) == 2:
        return ISO2_TO_ISO3.get(cleaned, cleaned)
    return cleaned


def checksum(*parts: str) -> str:
    return hashlib.sha256("|".join(parts).encode("utf-8")).hexdigest()


def read_csv_rows(path: Path) -> Iterable[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as file:
        yield from csv.DictReader(file)


def read_input_rows(path: Path) -> Iterable[dict[str, str]]:
    if path.suffix.lower() == ".csv":
        yield from read_csv_rows(path)
        return
    if path.suffix.lower() == ".xlsx":
        yield from rows_as_dicts(iter_xlsx_rows(path))
        return
    raise ValueError(f"Unsupported AD/CVD input file type: {path.suffix}. Use CSV or XLSX.")


def value_for(row: dict[str, str], field: str) -> str:
    by_normalized_header = {normalized_header(header): value for header, value in row.items()}
    for alias in ALIASES[field]:
        value = by_normalized_header.get(normalized_header(alias), "")
        if value and value.strip():
            return value.strip()
    return ""


def infer_remedy_type(case_number: str, raw_type: str) -> str:
    text = raw_type.strip().upper()
    if text in {"AD", "A", "ANTI-DUMPING", "ANTIDUMPING"}:
        return "AD"
    if text in {"CVD", "CV", "C", "COUNTERVAILING"}:
        return "CVD"
    prefix = case_number.strip().upper()[:1]
    if prefix == "A":
        return "AD"
    if prefix == "C":
        return "CVD"
    return "AD/CVD"


def seed_rows(path: Path, source_version: str, effective_from: str, retrieved_at: str) -> list[list[object | None]]:
    rows: list[list[object | None]] = []
    seen: set[tuple[str, str, str, str, str | None, str | None]] = set()
    file_checksum = sha256_file(path)

    for row in read_input_rows(path):
        case_number = value_for(row, "case_number").replace("-", "").upper()
        destination_hs_code = normalize_hs_code(value_for(row, "destination_hs_code"))
        origin_country_code = normalize_origin_country(value_for(row, "origin_country_code"))
        case_title = value_for(row, "case_title")

        if not case_number or len(destination_hs_code) < 4 or not case_title:
            continue

        remedy_type = infer_remedy_type(case_number, value_for(row, "remedy_type"))
        rate_text = value_for(row, "rate_text") or None
        producer_exporter = value_for(row, "producer_exporter") or None
        scope_summary = value_for(row, "scope_summary") or (
            "CBP active case report의 HTS 번호는 편의상 참조값입니다. 실제 적용 여부는 AD/CVD order scope, 원산지, 생산자/수출자 및 Commerce/CBP 지시에 따라 확인해야 합니다."
        )
        legal_basis = "CBP ACE AD/CVD active case reference"
        notes = f"Source file checksum: {file_checksum}. HTS number is a convenience reference; case scope controls applicability."
        key = ("USA", destination_hs_code, remedy_type, case_number, origin_country_code, producer_exporter)
        if key in seen:
            continue
        seen.add(key)
        rows.append([
            "USA",
            destination_hs_code,
            remedy_type,
            case_number,
            case_title,
            origin_country_code,
            producer_exporter,
            rate_text,
            scope_summary,
            legal_basis,
            notes,
            SOURCE_NAME,
            SOURCE_URL,
            source_version,
            effective_from,
            None,
            None,
            retrieved_at,
            "staged",
            checksum("USA", destination_hs_code, remedy_type, case_number, origin_country_code or "", producer_exporter or "", source_version),
        ])

    return rows


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate seed SQL for U.S. CBP AD/CVD trade remedy case candidates.")
    parser.add_argument("input_file", type=Path, help="CBP ACE ES-105 active AD/CVD case report in CSV or XLSX format.")
    parser.add_argument("--source-version", default=f"us-cbp-adcvd-active-cases-{datetime.now(timezone.utc).date().isoformat().replace('-', '')}")
    parser.add_argument("--effective-from", default=datetime.now(timezone.utc).date().isoformat())
    parser.add_argument("--output", type=Path, default=OUTPUT)
    args = parser.parse_args()

    if not args.input_file.exists():
        raise FileNotFoundError(args.input_file)

    retrieved_at = datetime.now(timezone.utc).isoformat()
    rows = seed_rows(args.input_file, args.source_version, args.effective_from, retrieved_at)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("w", encoding="utf-8") as output:
        output.write("-- Generated by scripts/generate_us_adcvd_trade_remedy_seed.py\n")
        output.write("begin;\n")
        output.write(f"delete from public.export_destination_trade_remedy_cases where country_code = 'USA' and source_version = '{args.source_version}';\n")
        output.write(copy_block("public.export_destination_trade_remedy_cases", [
            "country_code", "destination_hs_code", "remedy_type", "case_number", "case_title", "origin_country_code",
            "producer_exporter", "rate_text", "scope_summary", "legal_basis", "notes", "source_name", "source_url",
            "source_version", "effective_from", "effective_to", "published_at", "retrieved_at", "status", "checksum",
        ], rows))
        output.write("commit;\n")

    try:
        display_path = args.output.relative_to(ROOT)
    except ValueError:
        display_path = args.output
    print(f"wrote {display_path} ({len(rows)} trade remedy rows)")


if __name__ == "__main__":
    main()
