#!/usr/bin/env python3
"""Generate Supabase seed SQL from official Customs Excel downloads.

This script intentionally uses only Python stdlib so the repository does not
need an XLSX dependency. It reads .xlsx files as zipped XML and emits SQL with
PostgreSQL COPY blocks.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
import re
import sys
import zipfile
from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Iterable
from xml.etree import ElementTree as ET

DATASET_CHOICES = ("all", "hs", "standard", "domestic-tariff", "country-tariff")

NS = {
    "a": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
}


@dataclass(frozen=True)
class SourceFile:
    path: Path
    source_name: str
    source_url: str
    source_version: str
    effective_from: str
    effective_to: str | None


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as file:
      for chunk in iter(lambda: file.read(1024 * 1024), b""):
          digest.update(chunk)
    return digest.hexdigest()


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def excel_serial_to_date(value: str) -> str | None:
    if not value:
        return None
    if re.fullmatch(r"\d{8}", value):
        return f"{value[:4]}-{value[4:6]}-{value[6:8]}"
    if re.fullmatch(r"\d+(\.\d+)?", value):
        serial = int(float(value))
        return (date(1899, 12, 30) + timedelta(days=serial)).isoformat()
    return value


def sql(value: str | int | None) -> str:
    if value is None:
        return "null"
    if isinstance(value, int):
        return str(value)
    return "'" + value.replace("'", "''") + "'"


def copy_escape(value: object) -> str:
    if value is None or value == "":
        return "\\N"
    text = str(value)
    return (
        text.replace("\\", "\\\\")
        .replace("\t", "\\t")
        .replace("\n", "\\n")
        .replace("\r", "\\r")
    )


def copy_block(table: str, columns: list[str], rows: Iterable[list[object]]) -> str:
    output = [f"COPY {table} ({', '.join(columns)}) FROM stdin WITH (FORMAT text, DELIMITER E'\\t', NULL '\\N');"]
    count = 0
    for row in rows:
        output.append("\t".join(copy_escape(value) for value in row))
        count += 1
    output.append("\\.")
    output.append(f"-- {table}: {count} rows")
    return "\n".join(output) + "\n"


def shared_strings(zip_file: zipfile.ZipFile) -> list[str]:
    if "xl/sharedStrings.xml" not in zip_file.namelist():
        return []
    root = ET.fromstring(zip_file.read("xl/sharedStrings.xml"))
    return [
        "".join(text.text or "" for text in item.findall(".//a:t", NS))
        for item in root.findall("a:si", NS)
    ]


def first_sheet_path(zip_file: zipfile.ZipFile) -> str:
    workbook = ET.fromstring(zip_file.read("xl/workbook.xml"))
    rels = ET.fromstring(zip_file.read("xl/_rels/workbook.xml.rels"))
    relmap = {rel.get("Id"): rel.get("Target") for rel in rels}
    sheet = workbook.find("a:sheets/a:sheet", NS)
    if sheet is None:
        raise ValueError("Workbook has no sheets")
    target = relmap[sheet.get("{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id")]
    return "xl/" + target.lstrip("/") if not target.startswith("xl/") else target


def cell_value(cell: ET.Element, strings: list[str]) -> str:
    cell_type = cell.get("t")
    if cell_type == "s":
        value = cell.find("a:v", NS)
        return strings[int(value.text)] if value is not None and value.text else ""
    if cell_type == "inlineStr":
        return "".join(text.text or "" for text in cell.findall(".//a:t", NS)).strip()
    value = cell.find("a:v", NS)
    return (value.text or "").strip() if value is not None else ""


def cell_column_index(cell_ref: str | None) -> int:
    if not cell_ref:
        return 0
    letters = "".join(char for char in cell_ref if char.isalpha()).upper()
    index = 0
    for letter in letters:
        index = index * 26 + (ord(letter) - ord("A") + 1)
    return max(0, index - 1)


def iter_xlsx_rows_from_bytes(data: bytes) -> Iterable[list[str]]:
    with zipfile.ZipFile(io.BytesIO(data)) as zip_file:
        strings = shared_strings(zip_file)
        sheet_path = first_sheet_path(zip_file)
        with zip_file.open(sheet_path) as sheet:
            for _, row in ET.iterparse(sheet, events=("end",)):
                if row.tag.endswith("row"):
                    values: list[str] = []
                    for cell in row.findall("a:c", NS):
                        column_index = cell_column_index(cell.get("r"))
                        while len(values) < column_index:
                            values.append("")
                        values.append(cell_value(cell, strings))
                    yield values
                    row.clear()


def iter_xlsx_rows(path: Path) -> Iterable[list[str]]:
    with path.open("rb") as file:
        yield from iter_xlsx_rows_from_bytes(file.read())


def rows_as_dicts(rows: Iterable[list[str]]) -> Iterable[dict[str, str]]:
    iterator = iter(rows)
    headers = next(iterator)
    for row in iterator:
        padded = row + [""] * max(0, len(headers) - len(row))
        yield {header: padded[index] if index < len(padded) else "" for index, header in enumerate(headers)}


def hsk_rows(source: SourceFile, checksum: str, retrieved_at: str, limit: int | None) -> Iterable[list[object]]:
    for index, row in enumerate(rows_as_dicts(iter_xlsx_rows(source.path))):
        if limit is not None and index >= limit:
            break
        hsk = row.get("HS부호", "").strip()
        if not hsk:
            continue
        effective_from = excel_serial_to_date(row.get("적용시작일자", "")) or source.effective_from
        effective_to = excel_serial_to_date(row.get("적용종료일자", "")) or source.effective_to
        yield [
            hsk,
            hsk[:6],
            row.get("한글품목명", ""),
            row.get("영문품목명", "") or None,
            row.get("수입성질코드", "") or None,
            row.get("수출성질코드", "") or None,
            row.get("수량단위코드", "") or None,
            row.get("중량단위코드", "") or None,
            source.source_name,
            source.source_url,
            source.source_version,
            effective_from,
            effective_to,
            None,
            retrieved_at,
            "staged",
            checksum,
        ]


def standard_name_rows(source: SourceFile, checksum: str, retrieved_at: str, limit: int | None) -> Iterable[list[object]]:
    for index, row in enumerate(rows_as_dicts(iter_xlsx_rows(source.path))):
        if limit is not None and index >= limit:
            break
        hsk = row.get("HS부호", "").strip()
        name = row.get("표준품명_한글", "").strip()
        if not hsk or not name:
            continue
        yield [
            hsk,
            name,
            row.get("표준품명_영문", "") or None,
            row.get("필수규격_한글", "") or None,
            row.get("필수규격_영문", "") or None,
            row.get("규격값", "") or None,
            row.get("세부분류내용", "") or None,
            source.source_name,
            source.source_url,
            source.source_version,
            excel_serial_to_date(row.get("시작일자", "")) or source.effective_from,
            excel_serial_to_date(row.get("만료일자", "")) or source.effective_to,
            None,
            retrieved_at,
            "staged",
            checksum,
        ]


def numeric_or_none(value: str) -> str | None:
    value = value.strip()
    if not value:
        return None
    return value if re.fullmatch(r"-?\d+(\.\d+)?", value) else None


def domestic_tariff_rows(source: SourceFile, checksum: str, retrieved_at: str, limit: int | None) -> Iterable[list[object]]:
    count = 0
    with zipfile.ZipFile(source.path) as zip_file:
        workbook = ET.fromstring(zip_file.read("xl/workbook.xml"))
        rels = ET.fromstring(zip_file.read("xl/_rels/workbook.xml.rels"))
        relmap = {rel.get("Id"): rel.get("Target") for rel in rels}
        for sheet in workbook.findall("a:sheets/a:sheet", NS):
            if limit is not None and count >= limit:
                break
            target = relmap[sheet.get("{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id")]
            sheet_path = "xl/" + target.lstrip("/") if not target.startswith("xl/") else target
            strings = shared_strings(zip_file)
            sheet_bytes = zip_file.read(sheet_path)
            for row_index, row in enumerate(rows_as_dicts(iter_xlsx_rows_from_bytes(_sheet_to_workbook_bytes(zip_file, sheet_path, sheet_bytes, strings)))):
                if limit is not None and count >= limit:
                    break
                hsk = row.get("품목번호", "").strip()
                if not hsk:
                    continue
                count += 1
                yield [
                    hsk,
                    row.get("관세율구분", ""),
                    numeric_or_none(row.get("관세율", "")),
                    numeric_or_none(row.get("단위당세액", "")),
                    row.get("적용국가구분", "") or None,
                    row.get("용도세율구분", "") or None,
                    source.source_name,
                    source.source_url,
                    source.source_version,
                    excel_serial_to_date(row.get("적용개시일", "")) or source.effective_from,
                    excel_serial_to_date(row.get("적용만료일", "")) or source.effective_to,
                    None,
                    retrieved_at,
                    "staged",
                    checksum,
                ]


def _sheet_to_workbook_bytes(zip_file: zipfile.ZipFile, sheet_path: str, sheet_bytes: bytes, strings: list[str]) -> bytes:
    # Repackage one sheet as a minimal XLSX-like archive so row parsing can be reused.
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w") as out:
        out.writestr("xl/worksheets/sheet1.xml", sheet_bytes)
        out.writestr("xl/workbook.xml", '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="sheet1" sheetId="1" r:id="rId1"/></sheets></workbook>')
        out.writestr("xl/_rels/workbook.xml.rels", '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>')
        if strings:
            shared = '<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' + "".join(f"<si><t>{_xml_escape(value)}</t></si>" for value in strings) + "</sst>"
            out.writestr("xl/sharedStrings.xml", shared)
    return buffer.getvalue()


def _xml_escape(value: str) -> str:
    return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def country_tariff_rows(source: SourceFile, checksum: str, retrieved_at: str, limit: int | None) -> Iterable[list[object]]:
    count = 0
    with zipfile.ZipFile(source.path) as outer:
        for name in outer.namelist():
            if limit is not None and count >= limit:
                break
            if not name.lower().endswith(".xlsx"):
                continue
            file_checksum = sha256_bytes(outer.read(name))
            for row in rows_as_dicts(iter_xlsx_rows_from_bytes(outer.read(name))):
                if limit is not None and count >= limit:
                    break
                country = row.get("국가코드", "").strip()
                hs = row.get("세번", "").strip()
                if not country or not hs:
                    continue
                known = {"순번", "년도", "국가코드", "세번", "원문품명", "영문품명", "한글품명", "단위", "기본세율", "Normal Tariff\n기본세율"}
                agreement_rates = {key: value for key, value in row.items() if key and key not in known and value.strip()}
                base_rate = row.get("기본세율", "") or row.get("Normal Tariff\n기본세율", "")
                count += 1
                source_version = f"{source.source_version}:{country}"
                yield [
                    country,
                    int(row.get("년도", "2025") or "2025"),
                    hs,
                    row.get("원문품명", "") or None,
                    row.get("영문품명", "") or None,
                    row.get("한글품명", "") or None,
                    row.get("단위", "") or None,
                    base_rate or None,
                    json.dumps(agreement_rates, ensure_ascii=False, sort_keys=True),
                    source.source_name,
                    source.source_url,
                    source_version,
                    source.effective_from,
                    source.effective_to,
                    None,
                    retrieved_at,
                    "staged",
                    f"{checksum}:{file_checksum}",
                ]


def write_seed(args: argparse.Namespace) -> None:
    retrieved_at = datetime.now(timezone.utc).isoformat()
    hs = SourceFile(args.hs_file, "관세청 HS부호", "file:///Downloads/관세청_HS부호_20260101.xlsx", "customs-hs-20260101", "2026-01-01", "2026-12-31")
    standard = SourceFile(args.standard_file, "관세청 표준품명", "file:///Downloads/관세청_표준품명_20260101.xlsx", "customs-standard-product-20260101", "2026-01-01", None)
    tariff = SourceFile(args.tariff_file, "관세청 품목번호별 관세율표", "file:///Downloads/관세청_품목번호별 관세율표_20260211.xlsx", "customs-domestic-tariff-20260211", "2026-01-01", "2026-12-31")
    country_tariff = SourceFile(args.country_tariff_zip, "관세청 국가별 관세율표", "file:///Downloads/관세청_국가별 관세율표_20251231.zip", "customs-country-tariff-20251231", "2025-01-01", None)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("w", encoding="utf-8") as out:
        out.write("-- Generated by scripts/generate_customs_excel_seed.py\n")
        out.write(f"-- Dataset: {args.only}\n")
        out.write("begin;\n")

        if args.only in ("all", "hs"):
            out.write("create temp table tmp_hs_master (like public.hs_master including defaults);\n")
            out.write(copy_block("tmp_hs_master", [
                "hsk_code", "hs6", "korean_name", "english_name", "import_nature_code", "export_nature_code",
                "quantity_unit", "weight_unit", "source_name", "source_url", "source_version", "effective_from",
                "effective_to", "published_at", "retrieved_at", "status", "checksum"
            ], hsk_rows(hs, sha256_file(hs.path), retrieved_at, args.limit)))
            out.write("insert into public.hs_master (hsk_code, hs6, korean_name, english_name, import_nature_code, export_nature_code, quantity_unit, weight_unit, source_name, source_url, source_version, effective_from, effective_to, published_at, retrieved_at, status, checksum)\n")
            out.write("select hsk_code, hs6, korean_name, english_name, import_nature_code, export_nature_code, quantity_unit, weight_unit, source_name, source_url, source_version, effective_from, effective_to, published_at, retrieved_at, status, checksum from tmp_hs_master\n")
            out.write("on conflict (hsk_code) do update set hs6=excluded.hs6, korean_name=excluded.korean_name, english_name=excluded.english_name, import_nature_code=excluded.import_nature_code, export_nature_code=excluded.export_nature_code, quantity_unit=excluded.quantity_unit, weight_unit=excluded.weight_unit, source_name=excluded.source_name, source_url=excluded.source_url, source_version=excluded.source_version, effective_from=excluded.effective_from, effective_to=excluded.effective_to, retrieved_at=excluded.retrieved_at, status=excluded.status, checksum=excluded.checksum;\n")

        if args.only in ("all", "standard"):
            out.write(f"delete from public.standard_product_names where source_version = {sql(standard.source_version)};\n")
            out.write(copy_block("public.standard_product_names", [
                "hsk_code", "standard_name_kr", "standard_name_en", "required_spec_kr", "required_spec_en",
                "spec_value", "detailed_classification", "source_name", "source_url", "source_version",
                "effective_from", "effective_to", "published_at", "retrieved_at", "status", "checksum"
            ], standard_name_rows(standard, sha256_file(standard.path), retrieved_at, args.limit)))

        if args.only in ("all", "domestic-tariff"):
            out.write(f"delete from public.tariff_rates where source_version = {sql(tariff.source_version)};\n")
            out.write(copy_block("public.tariff_rates", [
                "hsk_code", "rate_type", "duty_rate", "unit_duty", "country_group", "usage_rate_type",
                "source_name", "source_url", "source_version", "effective_from", "effective_to",
                "published_at", "retrieved_at", "status", "checksum"
            ], domestic_tariff_rows(tariff, sha256_file(tariff.path), retrieved_at, args.limit)))

        if args.only in ("all", "country-tariff"):
            out.write(f"delete from public.export_destination_tariff_rates where source_version like {sql(country_tariff.source_version + ':%')};\n")
            out.write(copy_block("public.export_destination_tariff_rates", [
                "country_code", "tariff_year", "destination_hs_code", "original_name", "english_name",
                "korean_name", "unit", "base_rate_text", "agreement_rates", "source_name", "source_url",
                "source_version", "effective_from", "effective_to", "published_at", "retrieved_at",
                "status", "checksum"
            ], country_tariff_rows(country_tariff, sha256_file(country_tariff.path), retrieved_at, args.limit)))
        out.write("commit;\n")


def main() -> None:
    parser = argparse.ArgumentParser()
    downloads = Path.home() / "Downloads"
    parser.add_argument("--hs-file", type=Path, default=downloads / "관세청_HS부호_20260101.xlsx")
    parser.add_argument("--standard-file", type=Path, default=downloads / "관세청_표준품명_20260101.xlsx")
    parser.add_argument("--tariff-file", type=Path, default=downloads / "관세청_품목번호별 관세율표_20260211.xlsx")
    parser.add_argument("--country-tariff-zip", type=Path, default=downloads / "관세청_국가별 관세율표_20251231.zip")
    parser.add_argument("--output", type=Path, default=Path("supabase/seed/generated/customs_official_excel_seed.sql"))
    parser.add_argument("--only", choices=DATASET_CHOICES, default="all", help="Generate one dataset instead of the full official source seed")
    parser.add_argument("--limit", type=int, default=None, help="Optional per-source row limit for smoke testing")
    args = parser.parse_args()
    write_seed(args)
    print(f"wrote {args.output}")


if __name__ == "__main__":
    main()
