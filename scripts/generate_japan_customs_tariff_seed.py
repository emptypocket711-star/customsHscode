#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
import os
import re
import sys
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

SCRIPT_DIR = Path(__file__).resolve().parent
ROOT = SCRIPT_DIR.parents[0]
sys.path.insert(0, str(SCRIPT_DIR))

from generate_customs_excel_seed import copy_block  # noqa: E402

OUTPUT = Path(os.getenv("JAPAN_CUSTOMS_TARIFF_OUTPUT", ROOT / "supabase/seed/generated/japan_customs_tariff_seed.sql"))
SOURCE_NAME = "Japan Customs Tariff Schedule"
SOURCE_VERSION = os.getenv("JAPAN_CUSTOMS_TARIFF_SOURCE_VERSION", "japan-customs-tariff-20260401")
BASE_URL = "https://www.customs.go.jp/english/tariff/2026_04_01/data"
DEFAULT_CHAPTERS = [str(chapter).zfill(2) for chapter in range(1, 98) if chapter != 77]


class TableParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.in_tr = False
        self.in_cell = False
        self.rows: list[list[str]] = []
        self.row: list[str] = []
        self.cell: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag == "tr":
            self.in_tr = True
            self.row = []
        if self.in_tr and tag in {"td", "th"}:
            self.in_cell = True
            self.cell = []

    def handle_data(self, data: str) -> None:
        if self.in_cell:
            self.cell.append(data)

    def handle_endtag(self, tag: str) -> None:
        if self.in_tr and tag in {"td", "th"}:
            self.row.append(" ".join("".join(self.cell).split()))
            self.in_cell = False
        if tag == "tr" and self.in_tr:
            self.rows.append(self.row)
            self.in_tr = False


def checksum(*parts: str) -> str:
    return hashlib.sha256("|".join(parts).encode("utf-8")).hexdigest()


def normalize_code(value: str) -> str:
    return re.sub(r"[^0-9]", "", value)


def clean_rate(value: str | None) -> str | None:
    cleaned = re.sub(r"\s+", " ", value or "").strip()
    if not cleaned or cleaned in {"-", "－"}:
        return None
    return cleaned


def fetch_chapter(chapter: str) -> tuple[str, list[list[str]]]:
    chapter = chapter.zfill(2)
    url = f"{BASE_URL}/e_{chapter}.htm"
    request = Request(url, headers={"User-Agent": "customs-ai-codex-harness"})
    raw = urlopen(request, timeout=45).read()
    text = raw.decode("shift_jis", errors="replace")
    parser = TableParser()
    parser.feed(text)
    return url, parser.rows


def find_header_row(rows: list[list[str]]) -> int:
    for index, row in enumerate(rows):
        if row[:3] == ["H.S.code", "", "General"]:
            return index
    raise RuntimeError("Could not find Japan tariff table header row.")


def row_description(row: list[str]) -> str | None:
    return row[2] if len(row) > 2 and row[2].strip() else None


def build_agreement_rates(headers: list[str], row: list[str]) -> dict[str, str]:
    rates: dict[str, str] = {}
    for index, header in enumerate(headers[4:29], start=4):
        if not header:
            continue
        rate = clean_rate(row[index] if index < len(row) else None)
        if rate:
            rates[header] = rate
    return rates


def parse_chapter_rows(url: str, rows: list[list[str]], retrieved_at: str) -> list[list[object | None]]:
    header_index = find_header_row(rows)
    headers = rows[header_index]
    parsed_rows: list[list[object | None]] = []
    current_hs = ""
    inherited_description = ""

    for row in rows[header_index + 1:]:
        if len(row) < 6:
            continue

        hs_code = normalize_code(row[0])
        stat_code = normalize_code(row[1])
        description = row_description(row)

        if hs_code:
            current_hs = hs_code
        if description and hs_code and len(hs_code) <= 4:
            inherited_description = description

        if not current_hs or not stat_code:
            continue

        destination_code = f"{current_hs}{stat_code}"
        general = clean_rate(row[3] if len(row) > 3 else None)
        agreement_rates = build_agreement_rates(headers, row)
        if not general and not agreement_rates:
            continue

        name = description or inherited_description or None
        parsed_rows.append([
            "JPN",
            202604,
            destination_code,
            name,
            name,
            None,
            None,
            general,
            json.dumps(agreement_rates, ensure_ascii=False, sort_keys=True),
            SOURCE_NAME,
            url,
            SOURCE_VERSION,
            "2026-04-01",
            None,
            None,
            retrieved_at,
            "staged",
            checksum("JPN", destination_code, SOURCE_VERSION),
        ])

    return parsed_rows


def display_path(path: Path) -> str:
    try:
        return str(path.relative_to(ROOT))
    except ValueError:
        return str(path)


def main() -> None:
    chapters = [chapter.strip().zfill(2) for chapter in os.getenv("JAPAN_CUSTOMS_TARIFF_CHAPTERS", ",".join(DEFAULT_CHAPTERS)).split(",") if chapter.strip()]
    retrieved_at = datetime.now(timezone.utc).isoformat()
    rows: list[list[object | None]] = []

    for index, chapter in enumerate(chapters, start=1):
        print(f"fetching Japan Customs tariff chapter {chapter} ({index}/{len(chapters)})", file=sys.stderr)
        try:
            url, chapter_rows = fetch_chapter(chapter)
        except HTTPError as error:
            if error.code == 404:
                print(f"skipping missing Japan Customs tariff chapter {chapter}", file=sys.stderr)
                continue
            raise
        rows.extend(parse_chapter_rows(url, chapter_rows, retrieved_at))

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT.open("w", encoding="utf-8") as output:
        output.write("-- Generated by scripts/generate_japan_customs_tariff_seed.py\n")
        output.write("begin;\n")
        output.write(f"delete from public.export_destination_tariff_rates where country_code = 'JPN' and source_version = '{SOURCE_VERSION}';\n")
        output.write(copy_block("public.export_destination_tariff_rates", [
            "country_code", "tariff_year", "destination_hs_code", "original_name", "english_name", "korean_name", "unit", "base_rate_text",
            "agreement_rates", "source_name", "source_url", "source_version", "effective_from", "effective_to",
            "published_at", "retrieved_at", "status", "checksum",
        ], rows))
        output.write("commit;\n")

    print(f"wrote {display_path(OUTPUT)} ({len(rows)} rows)")


if __name__ == "__main__":
    main()
