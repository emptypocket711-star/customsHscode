#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.error import HTTPError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

SCRIPT_DIR = Path(__file__).resolve().parent
ROOT = SCRIPT_DIR.parents[0]
sys.path.insert(0, str(SCRIPT_DIR))

from generate_customs_excel_seed import copy_block  # noqa: E402

OUTPUT = ROOT / "supabase/seed/generated/uk_trade_tariff_api_seed.sql"
SOURCE_NAME = "GOV.UK Trade Tariff API"
SOURCE_VERSION = os.getenv("UK_TRADE_TARIFF_SOURCE_VERSION", "hmrc-trade-tariff-api-20260523")
API_ROOT = "https://www.trade-tariff.service.gov.uk/uk/api"
BASE_URL = f"{API_ROOT}/commodities"
GOVUK_VAT_RATES_URL = "https://www.gov.uk/vat-rates"
DEFAULT_CODES = [
    "3304990000",
    "3004900000",
    "1905903000",
    "1905904500",
    "8507600000",
    "8516500000",
    "8528724000",
    "9018900000",
]


def checksum(*parts: str) -> str:
    return hashlib.sha256("|".join(parts).encode("utf-8")).hexdigest()


def plain_html(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = re.sub(r"<br\s*/?>", " ", value, flags=re.IGNORECASE)
    cleaned = re.sub(r"<[^>]+>", "", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned)
    cleaned = cleaned.replace("&nbsp;", " ").strip()
    return cleaned or None


def truncate_text(value: str | None, limit: int = 700) -> str | None:
    cleaned = plain_html(value)
    if not cleaned:
        return None
    if len(cleaned) <= limit:
        return cleaned
    return f"{cleaned[:limit].rstrip()}..."


def iso_date(value: str | None) -> str | None:
    if not value:
        return None
    return value[:10]


def fetch_commodity(code: str) -> dict[str, Any] | None:
    request = Request(f"{BASE_URL}/{code}", headers={"Accept": "application/json", "User-Agent": "customs-ai-codex-harness"})
    try:
        with urlopen(request, timeout=30) as response:
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as error:
        if error.code == 404:
            print(f"skip {code}: commodity endpoint not found", file=sys.stderr)
            return None
        raise


def fetch_json(path: str, query: dict[str, str] | None = None) -> dict[str, Any]:
    url = f"{API_ROOT}/{path}"
    if query:
        url = f"{url}?{urlencode(query)}"
    request = Request(url, headers={"Accept": "application/json", "User-Agent": "customs-ai-codex-harness"})
    with urlopen(request, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


def candidate_codes_from_subheading(subheading_id: str) -> list[str]:
    payload = fetch_json(f"subheadings/{subheading_id}")
    codes: list[str] = []
    for item in payload.get("included", []):
        if item.get("type") != "commodity":
            continue
        attributes = item.get("attributes", {})
        if attributes.get("declarable") is not True:
            continue
        code = attributes.get("goods_nomenclature_item_id")
        if code:
            codes.append(str(code))
    return codes


def resolve_commodity_codes(code: str) -> list[str]:
    payload = fetch_commodity(code)
    if payload:
        return [str(payload["data"]["attributes"]["goods_nomenclature_item_id"])]

    search = fetch_json("search", {"q": code})
    entry = search.get("data", {}).get("attributes", {}).get("entry", {})
    endpoint = entry.get("endpoint")
    entry_id = entry.get("id")
    if endpoint == "commodities" and entry_id:
        return [str(entry_id).split("-")[0]]
    if endpoint == "subheadings" and entry_id:
        return candidate_codes_from_subheading(str(entry_id))
    return []


def included_map(payload: dict[str, Any], item_type: str) -> dict[str, dict[str, Any]]:
    return {
        str(item["id"]): item
        for item in payload.get("included", [])
        if item.get("type") == item_type
    }


def relation_id(item: dict[str, Any], name: str) -> str | None:
    data = item.get("relationships", {}).get(name, {}).get("data")
    if not data:
        return None
    if isinstance(data, list):
        return str(data[0]["id"]) if data else None
    return str(data["id"])


def relation_ids(item: dict[str, Any], name: str) -> list[str]:
    data = item.get("relationships", {}).get(name, {}).get("data") or []
    if isinstance(data, list):
        return [str(row["id"]) for row in data]
    return [str(data["id"])]


def duty_rate_text(measure: dict[str, Any], duty_expressions: dict[str, dict[str, Any]], components: dict[str, dict[str, Any]]) -> str | None:
    duty_expression_id = relation_id(measure, "duty_expression")
    if duty_expression_id and duty_expression_id in duty_expressions:
        base = plain_html(duty_expressions[duty_expression_id].get("attributes", {}).get("base"))
        if base:
            return base

    rates: list[str] = []
    for component_id in relation_ids(measure, "measure_components"):
        component = components.get(component_id)
        if not component:
            continue
        amount = component.get("attributes", {}).get("duty_amount")
        if amount is None:
            continue
        rates.append(f"{amount:g}%")
    return " + ".join(rates) if rates else None


def condition_details(measure: dict[str, Any], conditions: dict[str, dict[str, Any]]) -> tuple[list[str], list[str], list[str]]:
    detail_lines: list[str] = []
    document_labels: list[str] = []
    negative_actions: list[str] = []

    for condition_id in relation_ids(measure, "measure_conditions"):
        condition = conditions.get(condition_id)
        if not condition:
            continue
        attributes = condition.get("attributes", {})
        document_code = attributes.get("document_code") or ""
        requirement = truncate_text(attributes.get("requirement") or attributes.get("certificate_description"), 280)
        action = plain_html(attributes.get("action"))
        condition_class = attributes.get("measure_condition_class")
        guidance = truncate_text(attributes.get("guidance_cds"), 420)

        pieces = []
        if document_code:
            pieces.append(f"문서코드 {document_code}")
        if condition_class:
            pieces.append(f"구분 {condition_class}")
        if action:
            pieces.append(f"조치 {action}")
        if requirement:
            pieces.append(requirement)
        if guidance:
            pieces.append(f"CDS 안내: {guidance}")

        if pieces:
            detail_lines.append(" / ".join(pieces))
        if document_code and requirement:
            document_labels.append(f"{document_code}: {requirement}")
        elif document_code:
            document_labels.append(document_code)
        if action and "not allowed" in action.lower():
            negative_actions.append(action)

    return detail_lines, document_labels, negative_actions


def main() -> None:
    codes = [code.strip() for code in os.getenv("UK_TRADE_TARIFF_CODES", ",".join(DEFAULT_CODES)).split(",") if code.strip()]
    retrieved_at = datetime.now(timezone.utc).isoformat()
    tariff_rows: list[list[object | None]] = []
    tax_rows: list[list[object | None]] = []
    requirement_rows: list[list[object | None]] = []
    seen_taxes: set[tuple[str, str, str, str, str]] = set()
    requirement_rows_by_key: dict[tuple[str, str, str, str, str], list[object | None]] = {}
    requirement_geographies_by_key: dict[tuple[str, str, str, str, str], set[str]] = {}

    resolved_codes: list[str] = []
    for code in codes:
        candidates = resolve_commodity_codes(code)
        if not candidates:
            print(f"skip {code}: no commodity candidates", file=sys.stderr)
        resolved_codes.extend(candidates)

    for code in sorted(set(resolved_codes)):
        payload = fetch_commodity(code)
        if not payload:
            continue

        data = payload["data"]
        attributes = data["attributes"]
        included = payload.get("included", [])
        measures = [item for item in included if item.get("type") == "measure"]
        measure_types = included_map(payload, "measure_type")
        geographies = included_map(payload, "geographical_area")
        duty_expressions = included_map(payload, "duty_expression")
        components = included_map(payload, "measure_component")
        conditions = included_map(payload, "measure_condition")

        commodity_code = attributes["goods_nomenclature_item_id"]
        description = plain_html(
            attributes.get("description_plain") or attributes.get("formatted_description") or attributes.get("description")
        )
        source_url = f"{BASE_URL}/{commodity_code}"
        effective_from = iso_date(attributes.get("validity_start_date")) or "2021-01-01"
        effective_to = iso_date(attributes.get("validity_end_date"))

        base_rate = None
        agreement_rates: dict[str, str] = {}

        for measure in measures:
            measure_type_id = relation_id(measure, "measure_type")
            measure_type = measure_types.get(measure_type_id or "", {})
            measure_type_description = measure_type.get("attributes", {}).get("description") or ""
            measure_type_series = measure_type.get("attributes", {}).get("measure_type_series_id") or ""
            geography_id = relation_id(measure, "geographical_area")
            geography = geographies.get(geography_id or "", {})
            geography_description = geography.get("attributes", {}).get("description") or geography_id or "All countries"
            rate = duty_rate_text(measure, duty_expressions, components)

            if measure_type_id == "103" and not base_rate:
                base_rate = rate or "0%"
            elif measure_type_id == "142" and rate:
                agreement_rates[f"{measure_type_description} - {geography_description}"] = rate

            if measure_type_id == "305":
                vat_rate = rate or payload.get("meta", {}).get("duty_calculator", {}).get("applicable_vat_options", {}).get("VAT")
                tax_key = ("GBR", commodity_code, "vat", "수입 VAT", vat_rate or "")
                if tax_key not in seen_taxes:
                    seen_taxes.add(tax_key)
                    measure_effective_from = iso_date(measure.get("attributes", {}).get("effective_start_date"))
                    measure_effective_to = iso_date(measure.get("attributes", {}).get("effective_end_date"))
                    period = " ~ ".join([measure_effective_from or effective_from, measure_effective_to or ""])
                    basis = f"UK Trade Tariff VAT measure: {measure_type_description} ({period.strip()} 적용)"
                    tax_rows.append([
                        "GBR", commodity_code, "vat", "수입 VAT", vat_rate, basis,
                        SOURCE_NAME, source_url, f"{SOURCE_VERSION}:vat", effective_from, effective_to,
                        None, retrieved_at, "staged", checksum("GBR", commodity_code, "vat", vat_rate or "", SOURCE_VERSION)
                    ])

            if measure_type_series == "B" and measure.get("attributes", {}).get("import") is True:
                requirement_name = f"영국 {measure_type_description}"
                details, document_labels, negative_actions = condition_details(measure, conditions)
                required_documents = [
                    "수입신고서",
                    "송장",
                    "포장명세서",
                    "운송서류",
                    *document_labels,
                ] or ["수입신고서", "송장", "포장명세서", "운송서류"]
                summary_parts = [
                    f"UK Trade Tariff import measure: {measure_type_description}.",
                    "원산지/용도/제품 조건에 따라 증빙 또는 허가가 필요할 수 있다.",
                ]
                if negative_actions:
                    summary_parts.append("조건 미충족 시 수입이 제한 또는 불허될 수 있다.")
                if details:
                    summary_parts.append("조건: " + " | ".join(details[:4]))
                requirement_key = (
                    "GBR",
                    commodity_code,
                    "uk_import_control",
                    requirement_name,
                    "HM Revenue & Customs / relevant UK competent authority",
                )
                geographies_for_requirement = requirement_geographies_by_key.setdefault(requirement_key, set())
                geographies_for_requirement.add(geography_description)
                if requirement_key not in requirement_rows_by_key:
                    requirement_rows_by_key[requirement_key] = [
                        "GBR", commodity_code, "uk_import_control", requirement_name,
                        "HM Revenue & Customs / relevant UK competent authority", measure_type_description,
                        " ".join(summary_parts),
                        json.dumps(list(dict.fromkeys(required_documents)), ensure_ascii=False),
                        "",
                        SOURCE_NAME, source_url, f"{SOURCE_VERSION}:import-controls", effective_from, effective_to,
                        None, retrieved_at, "staged", checksum("GBR", commodity_code, measure_type_id or "", SOURCE_VERSION)
                    ]

        tariff_rows.append([
            "GBR", 2026, commodity_code, description, description, None, base_rate or "0%",
            json.dumps(agreement_rates, ensure_ascii=False, sort_keys=True), SOURCE_NAME, source_url,
            SOURCE_VERSION, effective_from, effective_to, None, retrieved_at, "staged",
            checksum("GBR", commodity_code, SOURCE_VERSION)
        ])

    for key, row in requirement_rows_by_key.items():
        geographies = sorted(requirement_geographies_by_key.get(key, set()))
        row[8] = f"적용 지리범위: {', '.join(geographies)}" if geographies else None
        requirement_rows.append(row)

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT.open("w", encoding="utf-8") as output:
        output.write("-- Generated by scripts/generate_uk_trade_tariff_seed.py\n")
        output.write("begin;\n")
        output.write(f"delete from public.export_destination_tariff_rates where country_code = 'GBR' and source_version = '{SOURCE_VERSION}';\n")
        output.write(f"delete from public.export_destination_internal_taxes where country_code = 'GBR' and source_version like '{SOURCE_VERSION}%';\n")
        output.write(f"delete from public.export_destination_import_requirements where country_code = 'GBR' and source_version like '{SOURCE_VERSION}%';\n")
        output.write(copy_block("public.export_destination_tariff_rates", [
            "country_code", "tariff_year", "destination_hs_code", "original_name", "english_name", "korean_name", "base_rate_text",
            "agreement_rates", "source_name", "source_url", "source_version", "effective_from", "effective_to",
            "published_at", "retrieved_at", "status", "checksum"
        ], tariff_rows))
        output.write(copy_block("public.export_destination_internal_taxes", [
            "country_code", "destination_hs_code", "tax_type", "tax_name", "rate_text", "basis", "source_name", "source_url",
            "source_version", "effective_from", "effective_to", "published_at", "retrieved_at", "status", "checksum"
        ], tax_rows))
        output.write(f"""
insert into public.export_destination_internal_taxes (
  country_code,
  destination_hs_code,
  tax_type,
  tax_name,
  rate_text,
  basis,
  notes,
  source_name,
  source_url,
  source_version,
  effective_from,
  effective_to,
  published_at,
  retrieved_at,
  status,
  checksum
)
select
  'GBR',
  tariff.destination_hs_code,
  'vat',
  '수입 VAT',
  '20%',
  '영국 VAT 표준세율 후보',
  'GOV.UK VAT rates 기준 표준세율은 20%이며 대부분의 goods and services에 적용됩니다. Trade Tariff API에서 품목별 VAT measure가 수집된 경우 해당 행을 우선 표시하고, reduced/zero/exempt 품목은 품목별 확인이 필요합니다.',
  'GOV.UK VAT rates',
  '{GOVUK_VAT_RATES_URL}',
  '{SOURCE_VERSION}:vat-standard-20-fallback',
  date '2026-01-01',
  null::date,
  null::timestamptz,
  now(),
  'staged'::public.legal_record_status,
  encode(digest('GBR|vat-standard-20|' || tariff.destination_hs_code || '|{SOURCE_VERSION}', 'sha256'), 'hex')
from (
  select distinct destination_hs_code
  from public.export_destination_tariff_rates
  where country_code in ('GBR', 'GB')
    and (
      source_version = '{SOURCE_VERSION}'
      or source_version like 'customs-country-tariff-20251231:%'
    )
    and destination_hs_code ~ '^[0-9]{{4,10}}$'
) tariff
where not exists (
  select 1
  from public.export_destination_internal_taxes existing
  where existing.country_code in ('GBR', 'GB')
    and existing.destination_hs_code = tariff.destination_hs_code
    and existing.tax_type = 'vat'
    and existing.source_version like '{SOURCE_VERSION}%'
)
on conflict (country_code, destination_hs_code, tax_type, tax_name, coalesce(rate_text, ''), source_version)
do update set
  basis = excluded.basis,
  notes = excluded.notes,
  source_name = excluded.source_name,
  source_url = excluded.source_url,
  effective_from = excluded.effective_from,
  effective_to = excluded.effective_to,
  published_at = excluded.published_at,
  retrieved_at = excluded.retrieved_at,
  status = excluded.status,
  checksum = excluded.checksum;
""")
        output.write(copy_block("public.export_destination_import_requirements", [
            "country_code", "destination_hs_code", "requirement_type", "requirement_name", "agency", "legal_basis", "procedure_summary",
            "required_documents", "notes", "source_name", "source_url", "source_version", "effective_from", "effective_to",
            "published_at", "retrieved_at", "status", "checksum"
        ], requirement_rows))
        output.write("commit;\n")

    print(f"wrote {OUTPUT.relative_to(ROOT)} ({len(tariff_rows)} tariffs, {len(tax_rows)} taxes, {len(requirement_rows)} requirements)")


if __name__ == "__main__":
    main()
