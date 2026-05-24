#!/usr/bin/env python3
"""Generate internal_tax_law_rules seed SQL from CSV/XLSX mapping files.

The input file can use Korean or English headers. Supported logical columns:

- tax_type / 세목코드
- tax_name / 세목명
- law_name / 법령명
- article_ref / 조문
- rule_type / 룰유형
- hsk_pattern / HS패턴
- keyword_terms / 키워드
- rate_text / 세율
- rate_formula / 계산식
- tax_base_type / 과세표준
- condition_text / 조건
- source_url / 출처URL
- effective_from / 시행일
- effective_to / 종료일
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import sys
from datetime import datetime, timezone
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR))

from generate_customs_excel_seed import copy_block, iter_xlsx_rows, rows_as_dicts  # noqa: E402

DEFAULT_SOURCE_NAME = "내국세 법령 매핑 자료"
DEFAULT_SOURCE_VERSION = "internal-tax-law-rules-manual"
DEFAULT_EFFECTIVE_FROM = "2026-01-01"
VALID_RULE_TYPES = {"hsk_exact", "hs6", "hs4", "keyword_condition", "statistical_code", "manual_review"}

HEADER_ALIASES = {
    "tax_type": ["tax_type", "세목코드", "세목구분", "세금코드"],
    "tax_name": ["tax_name", "세목명", "세금명", "내국세명"],
    "law_name": ["law_name", "법령명", "법률명"],
    "article_ref": ["article_ref", "조문", "조항", "별표"],
    "rule_type": ["rule_type", "룰유형", "매칭유형", "규칙유형"],
    "hsk_pattern": ["hsk_pattern", "hs_pattern", "HS패턴", "HS", "HSK", "HS CODE", "HSCODE"],
    "keyword_terms": ["keyword_terms", "키워드", "품명키워드", "검색어"],
    "rate_text": ["rate_text", "세율", "세율문구"],
    "rate_formula": ["rate_formula", "계산식", "산식"],
    "tax_base_type": ["tax_base_type", "과세표준", "과세표준유형", "기준금액"],
    "condition_text": ["condition_text", "조건", "적용조건", "비고"],
    "source_url": ["source_url", "출처URL", "URL", "링크"],
    "effective_from": ["effective_from", "시행일", "적용시작일", "시작일"],
    "effective_to": ["effective_to", "종료일", "적용종료일", "만료일"],
}


def file_checksum(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as file:
        for chunk in iter(lambda: file.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def normalize_header(value: str) -> str:
    return value.replace(" ", "").replace("_", "").replace("-", "").lower()


def alias_value(row: dict[str, str], logical_name: str) -> str:
    lookup = {normalize_header(key): value for key, value in row.items()}
    for alias in HEADER_ALIASES[logical_name]:
        value = lookup.get(normalize_header(alias))
        if value is not None:
            return value.strip()
    return ""


def normalize_hsk_pattern(value: str) -> str | None:
    digits = "".join(char for char in value if char.isdigit())
    if not digits:
        return None
    if len(digits) in {4, 6, 10}:
        return digits
    return digits[:10]


def infer_rule_type(rule_type: str, hsk_pattern: str | None, keyword_terms: list[str]) -> str:
    normalized = rule_type.strip()
    if normalized in VALID_RULE_TYPES:
        return normalized
    if hsk_pattern and len(hsk_pattern) == 10:
        return "hsk_exact"
    if hsk_pattern and len(hsk_pattern) == 6:
        return "hs6"
    if hsk_pattern and len(hsk_pattern) == 4:
        return "hs4"
    if keyword_terms:
        return "keyword_condition"
    return "manual_review"


def keyword_terms(value: str) -> list[str]:
    return [term.strip() for term in value.replace(";", ",").replace("/", ",").split(",") if term.strip()]


def normalize_tax_base_type(value: str, tax_name: str) -> str:
    normalized = value.replace(" ", "").replace("_", "").replace("-", "").lower()
    aliases = {
        "taxablevalue": "taxable_value",
        "과세가격": "taxable_value",
        "customsduty": "customs_duty",
        "관세": "customs_duty",
        "관세액": "customs_duty",
        "taxablevaluepluscustomsduty": "taxable_value_plus_customs_duty",
        "과세가격관세": "taxable_value_plus_customs_duty",
        "previousinternaltax": "previous_internal_tax_total",
        "previousinternaltaxtotal": "previous_internal_tax_total",
        "앞선내국세": "previous_internal_tax_total",
        "전단계내국세": "previous_internal_tax_total",
        "taxablevaluepluscustomsdutypluspreviousinternaltax": "taxable_value_plus_customs_duty_plus_previous_internal_tax",
        "과세가격관세앞선내국세": "taxable_value_plus_customs_duty_plus_previous_internal_tax",
    }
    if normalized in aliases:
        return aliases[normalized]
    if "교육세" in tax_name or "농어촌특별세" in tax_name:
        return "previous_internal_tax_total"
    return "taxable_value"


def sql_array(values: list[str]) -> str:
    if not values:
        return "{}"
    return "{" + ",".join(value.replace("\\", "\\\\").replace('"', '\\"') for value in values) + "}"


def iter_csv_dicts(path: Path):
    with path.open("r", encoding="utf-8-sig", newline="") as file:
        yield from csv.DictReader(file)


def iter_input_dicts(path: Path):
    suffix = path.suffix.lower()
    if suffix == ".csv":
        yield from iter_csv_dicts(path)
        return
    if suffix == ".xlsx":
        yield from rows_as_dicts(iter_xlsx_rows(path))
        return
    raise SystemExit("지원 파일 형식은 .csv 또는 .xlsx 입니다.")


def rule_rows(
    path: Path,
    source_name: str,
    source_version: str,
    default_source_url: str,
    default_effective_from: str,
    default_effective_to: str | None,
    status: str,
    limit: int | None,
):
    retrieved_at = datetime.now(timezone.utc).isoformat()
    checksum = file_checksum(path)

    for index, row in enumerate(iter_input_dicts(path)):
        if limit is not None and index >= limit:
            break

        terms = keyword_terms(alias_value(row, "keyword_terms"))
        hsk_pattern = normalize_hsk_pattern(alias_value(row, "hsk_pattern"))
        rule_type = infer_rule_type(alias_value(row, "rule_type"), hsk_pattern, terms)
        tax_name = alias_value(row, "tax_name")
        law_name = alias_value(row, "law_name")

        if not tax_name or not law_name:
            continue

        stable_key = "|".join([
            source_version,
            alias_value(row, "tax_type") or tax_name,
            rule_type,
            hsk_pattern or "",
            ",".join(terms),
            tax_name,
        ])

        yield [
            alias_value(row, "tax_type") or "manual_internal_tax",
            tax_name,
            law_name,
            alias_value(row, "article_ref") or None,
            rule_type,
            hsk_pattern,
            sql_array(terms),
            alias_value(row, "rate_text") or None,
            alias_value(row, "rate_formula") or None,
            normalize_tax_base_type(alias_value(row, "tax_base_type"), tax_name),
            alias_value(row, "condition_text") or None,
            source_name,
            alias_value(row, "source_url") or default_source_url,
            source_version,
            alias_value(row, "effective_from") or default_effective_from,
            alias_value(row, "effective_to") or default_effective_to,
            None if status != "published" else retrieved_at,
            retrieved_at,
            status,
            hashlib.sha256(stable_key.encode("utf-8")).hexdigest() + ":" + checksum,
        ]


def build_sql(args: argparse.Namespace) -> str:
    rows = list(rule_rows(
        path=args.input,
        source_name=args.source_name,
        source_version=args.source_version,
        default_source_url=args.source_url,
        default_effective_from=args.effective_from,
        default_effective_to=args.effective_to,
        status=args.status,
        limit=args.limit,
    ))
    columns = [
        "tax_type",
        "tax_name",
        "law_name",
        "article_ref",
        "rule_type",
        "hsk_pattern",
        "keyword_terms",
        "rate_text",
        "rate_formula",
        "tax_base_type",
        "condition_text",
        "source_name",
        "source_url",
        "source_version",
        "effective_from",
        "effective_to",
        "published_at",
        "retrieved_at",
        "status",
        "checksum",
    ]

    return "\n".join([
        f"delete from public.internal_tax_law_rules where source_version = '{args.source_version.replace("'", "''")}';",
        copy_block("public.internal_tax_law_rules", columns, rows),
        "",
    ])


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate internal_tax_law_rules seed SQL from CSV/XLSX.")
    parser.add_argument("input", type=Path)
    parser.add_argument("--output", type=Path, default=Path("supabase/seed/generated/internal_tax_law_rules_seed.sql"))
    parser.add_argument("--source-name", default=DEFAULT_SOURCE_NAME)
    parser.add_argument("--source-url", default="manual://internal-tax-law-rules")
    parser.add_argument("--source-version", default=DEFAULT_SOURCE_VERSION)
    parser.add_argument("--effective-from", default=DEFAULT_EFFECTIVE_FROM)
    parser.add_argument("--effective-to")
    parser.add_argument("--status", choices=["draft", "staged", "reviewed", "published", "rejected", "archived"], default="staged")
    parser.add_argument("--limit", type=int)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    sql = build_sql(args)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(sql, encoding="utf-8")
    print(f"Wrote {args.output}")


if __name__ == "__main__":
    main()
