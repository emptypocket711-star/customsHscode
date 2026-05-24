#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

SCRIPT_DIR = Path(__file__).resolve().parent
ROOT = SCRIPT_DIR.parents[0]
sys.path.insert(0, str(SCRIPT_DIR))

from generate_customs_excel_seed import copy_block  # noqa: E402

SOURCE_NAME = "中华人民共和国进出口税则（2026）"
SOURCE_URL = "https://gss.mof.gov.cn/gzdt/zhengcefabu/202512/P020251231607833453633.pdf"
SOURCE_VERSION = "china-import-export-tariff-2026"


def require_fitz() -> Any:
    try:
        import fitz  # type: ignore

        return fitz
    except ImportError as error:
        raise SystemExit(
            "PyMuPDF is required for PDF extraction. Run: python3 -m venv .venv-pdf && "
            ". .venv-pdf/bin/activate && pip install pymupdf"
        ) from error


def normalize_code(value: str) -> str:
    return re.sub(r"[^0-9]", "", value)


def percent(value: str) -> str:
    value = value.strip()
    if not value:
        return value
    if "%" in value or "元" in value or "千克" in value or "升" in value:
        return value
    return f"{value}%"


def clean_cell(value: str) -> str:
    return re.sub(r"\s+", "", value).strip("，,")


def line_cells(words: list[tuple]) -> dict[str, str]:
    cells: dict[str, list[str]] = {
        "serial": [],
        "code": [],
        "name": [],
        "mfn": [],
        "agreement_rate": [],
        "agreement_text": [],
        "preferential": [],
        "ordinary": [],
    }
    for word in sorted(words, key=lambda item: item[0]):
        x = word[0]
        text = word[4]
        if x < 60:
            cells["serial"].append(text)
        elif x < 100:
            cells["code"].append(text)
        elif x < 220:
            cells["name"].append(text)
        elif x < 278:
            cells["mfn"].append(text)
        elif x < 303:
            cells["agreement_rate"].append(text)
        elif x < 468:
            cells["agreement_text"].append(text)
        elif x < 512:
            cells["preferential"].append(text)
        else:
            cells["ordinary"].append(text)

    return {key: clean_cell("".join(value)) for key, value in cells.items()}


def page_lines(page: Any) -> list[dict[str, Any]]:
    lines: list[dict[str, Any]] = []
    words = sorted(page.get_text("words"), key=lambda item: (item[1], item[0]))
    for word in words:
        y = word[1]
        if y < 75 or y > 765:
            continue
        for line in lines:
            if abs(line["y"] - y) < 3:
                line["words"].append(word)
                line["y"] = (line["y"] + y) / 2
                break
        else:
            lines.append({"y": y, "words": [word]})

    return [{"y": line["y"], "cells": line_cells(line["words"])} for line in sorted(lines, key=lambda item: item["y"])]


def is_row_start(cells: dict[str, str]) -> bool:
    return bool(re.fullmatch(r"\d+", cells["serial"]) and re.fullmatch(r"\d{4}\.\d{4}", cells["code"]))


def split_policy_codes(value: str) -> list[str]:
    raw_parts = [part.strip() for part in re.split(r"[,，]", value) if part.strip()]
    output: list[str] = []
    for part in raw_parts:
        if part in {"澳", "盟", "韩", "新西兰", "东盟R", "澳R", "日R", "韩R"}:
            output.append(part)
            continue
        output.append(part)
    return output


def agreement_label(raw: str) -> str:
    compact = raw.replace(" ", "")
    if "韩RKRR" in compact or compact in {"韩R", "KRR", "KR R"}:
        return "대한민국_RCEP"
    if "韩KR" in compact or compact == "KR":
        return "대한민국"
    if "亚太AP" in compact:
        return "아시아태평양무역협정"
    return compact


def add_rate_group(target: dict[str, str], rate: str, codes: str, prefix: str = "") -> None:
    if not rate or not codes:
        return
    for code in split_policy_codes(codes):
        label = agreement_label(code)
        if not label:
            continue
        key = f"{prefix}{label}" if prefix else label
        target[key] = percent(rate)


def parse_row(lines: list[dict[str, Any]]) -> dict[str, Any] | None:
    first = lines[0]["cells"]
    code = normalize_code(first["code"])
    if len(code) != 8:
        return None

    name_parts: list[str] = []
    agreement_rates: dict[str, str] = {}
    current_agreement_rate = ""
    current_agreement_codes: list[str] = []
    preferential_rate = ""
    preferential_codes: list[str] = []
    name_open = True

    mfn = first["mfn"]
    ordinary = first["ordinary"]

    for index, line in enumerate(lines):
        cells = line["cells"]
        if index > 0 and cells["agreement_rate"]:
            name_open = False
        if cells["name"] and name_open:
            name_parts.append(cells["name"])

        if cells["agreement_rate"]:
            if current_agreement_rate and current_agreement_codes:
                add_rate_group(agreement_rates, current_agreement_rate, "".join(current_agreement_codes))
            current_agreement_rate = cells["agreement_rate"]
            current_agreement_codes = []
        if cells["agreement_text"]:
            current_agreement_codes.append(cells["agreement_text"])

        pref = cells["preferential"]
        if pref:
            match = re.match(r"^([△]?[0-9.]+)(.*)$", pref)
            if match:
                if preferential_rate and preferential_codes:
                    add_rate_group(agreement_rates, preferential_rate, "".join(preferential_codes), "특혜_")
                preferential_rate = match.group(1)
                preferential_codes = [match.group(2)]
            else:
                preferential_codes.append(pref)

    if current_agreement_rate and current_agreement_codes:
        add_rate_group(agreement_rates, current_agreement_rate, "".join(current_agreement_codes))
    if preferential_rate and preferential_codes:
        add_rate_group(agreement_rates, preferential_rate, "".join(preferential_codes), "특혜_")

    if mfn:
        agreement_rates["최혜국"] = percent(mfn)
    if ordinary:
        agreement_rates["일반"] = percent(ordinary)

    original_name = "".join(name_parts)
    return {
        "code": code,
        "original_name": original_name,
        "base_rate_text": percent(ordinary) if ordinary else None,
        "agreement_rates": agreement_rates,
    }


def extract_rows(pdf_path: Path, max_pages: int | None = None) -> list[dict[str, Any]]:
    fitz = require_fitz()
    doc = fitz.open(pdf_path)
    rows: list[dict[str, Any]] = []

    # Page 1488 is the export tariff cover. The import tariff table appears before it.
    end_page = min(doc.page_count, 1487)
    if max_pages is not None:
        end_page = min(end_page, max_pages)

    for page_index in range(10, end_page):
        lines = page_lines(doc[page_index])
        start_indexes = [index for index, line in enumerate(lines) if is_row_start(line["cells"])]
        for position, start_index in enumerate(start_indexes):
            end_index = start_indexes[position + 1] if position + 1 < len(start_indexes) else len(lines)
            parsed = parse_row(lines[start_index:end_index])
            if parsed:
                rows.append(parsed)

    deduped = {row["code"]: row for row in rows}
    return [deduped[code] for code in sorted(deduped)]


def checksum_for_row(row: dict[str, Any]) -> str:
    raw = json.dumps(row, ensure_ascii=False, sort_keys=True)
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def write_seed(args: argparse.Namespace) -> None:
    retrieved_at = datetime.now(timezone.utc).isoformat()
    rows = extract_rows(args.pdf, args.max_pages)
    seed_rows: list[list[object]] = []
    for row in rows:
        seed_rows.append([
            "CHN",
            2026,
            row["code"],
            row["original_name"],
            None,
            row["original_name"],
            None,
            row["base_rate_text"],
            json.dumps(row["agreement_rates"], ensure_ascii=False, sort_keys=True),
            SOURCE_NAME,
            SOURCE_URL,
            SOURCE_VERSION,
            "2026-01-01",
            None,
            None,
            retrieved_at,
            "staged",
            checksum_for_row(row),
        ])

    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("w", encoding="utf-8") as output:
        output.write("-- Generated by scripts/generate_china_2026_tariff_seed.py\n")
        output.write("begin;\n")
        output.write(f"delete from public.export_destination_tariff_rates where country_code = 'CHN' and source_version = '{SOURCE_VERSION}';\n")
        output.write(copy_block("public.export_destination_tariff_rates", [
            "country_code",
            "tariff_year",
            "destination_hs_code",
            "original_name",
            "english_name",
            "korean_name",
            "unit",
            "base_rate_text",
            "agreement_rates",
            "source_name",
            "source_url",
            "source_version",
            "effective_from",
            "effective_to",
            "published_at",
            "retrieved_at",
            "status",
            "checksum",
        ], seed_rows))
        output.write("commit;\n")

    print(f"wrote {args.output} ({len(seed_rows)} rows)")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--pdf", type=Path, default=ROOT / "data/external/china/china-import-export-tariff-2026.pdf")
    parser.add_argument("--output", type=Path, default=ROOT / "supabase/seed/generated/china_2026_import_tariff_seed.sql")
    parser.add_argument("--max-pages", type=int, default=None)
    args = parser.parse_args()
    write_seed(args)


if __name__ == "__main__":
    main()
