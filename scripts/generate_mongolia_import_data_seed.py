#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "supabase/seed/generated/mongolia_import_data_seed.sql"

SOURCE_VERSION = "mongolia-import-data-20260524"
INVEST_MONGOLIA_TAX_SOURCE_URL = "https://investmongolia.gov.mn/taxation/"
MONGOLIA_CUSTOMS_TARIFF_LAW_URL = "https://www.wipo.int/wipolex/edocs/lexdocs/laws/en/mn/mn020en.html"
MONGOLIA_CUSTOMS_LAW_URL = "https://www.vertic.org/media/National%20Legislation/Mongolia/MN_Customs_Law.pdf"
MEDICINES_LAW_URL = "https://legalinfo.mn/en/edtl/16760184774901"
AGRI_SOURCE_URL = "https://mofa.gov.mn/"

REQUIREMENTS = [
    {
        "condition": "destination_hs_code like '01%' or destination_hs_code like '02%' or destination_hs_code like '03%' or destination_hs_code like '04%' or destination_hs_code like '05%' or destination_hs_code like '41%' or destination_hs_code like '42%' or destination_hs_code like '43%' or destination_hs_code like '51%'",
        "type": "animal_veterinary_import_control",
        "name": "몽골 동물·동물성 제품 검역 확인",
        "agency": "Ministry of Food, Agriculture and Light Industry / Mongolian Customs",
        "basis": "Mongolian agricultural and veterinary import controls",
        "summary": "동물, 축산물, 수산물, 동물성 원료, 가죽·모피·양모 등은 수의검역, 수입허가, 위생증명서 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "B/L 또는 AWB", "포장명세서", "동물종/원재료 정보", "위생증명서(해당 시)", "검역 또는 수입허가 자료(해당 시)"],
        "notes": "동물종, 식용/비식품용, 원산국 질병상황, 가공상태에 따라 요구사항이 달라질 수 있습니다.",
        "source_name": "Mongolia agricultural import controls",
        "source_url": AGRI_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '06%' or destination_hs_code like '07%' or destination_hs_code like '08%' or destination_hs_code like '09%' or destination_hs_code like '10%' or destination_hs_code like '11%' or destination_hs_code like '12%' or destination_hs_code like '14%' or destination_hs_code like '15%' or destination_hs_code like '16%' or destination_hs_code like '17%' or destination_hs_code like '18%' or destination_hs_code like '19%' or destination_hs_code like '20%' or destination_hs_code like '21%' or destination_hs_code like '22%'",
        "type": "food_plant_import_control",
        "name": "몽골 식품·농산물·식물검역 확인",
        "agency": "Ministry of Food, Agriculture and Light Industry / Mongolian Customs",
        "basis": "Mongolian food, agricultural and phytosanitary border controls",
        "summary": "식품, 농산물, 식물, 종자, 곡물, 음료는 수입허가, 위생·식물검역증명서, 식품 기준·라벨 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "성분표", "제품 라벨", "위생증명서(해당 시)", "식물검역증명서(해당 시)"],
        "notes": "재식용 여부, 가공상태, 식품첨가물, 원산국별 검역조건에 따라 추가자료가 필요할 수 있습니다.",
        "source_name": "Mongolia agricultural import controls",
        "source_url": AGRI_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '30%' or destination_hs_code like '9018%' or destination_hs_code like '9021%' or destination_hs_code like '9022%'",
        "type": "medicine_medical_device_import_control",
        "name": "몽골 의약품·의료기기 허가 확인",
        "agency": "Ministry of Health / Mongolian Customs",
        "basis": "Law of Mongolia on Medicines and Medical Devices",
        "summary": "의약품, 진단키트, 의료기기, 생물학적 제제는 등록, 특수허가, 수입허가, 품질확인 자료 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "제품 사양서", "용도 설명", "등록 또는 수입허가 자료(해당 시)", "라벨/사용설명서"],
        "notes": "의약품·진단키트·의료기기 구분, 인체/동물용, 등록제품 여부와 수입자 자격에 따라 요구사항이 달라질 수 있습니다.",
        "source_name": "Law of Mongolia on Medicines and Medical Devices",
        "source_url": MEDICINES_LAW_URL,
    },
    {
        "condition": "destination_hs_code like '3304%'",
        "type": "cosmetics_label_safety_control",
        "name": "몽골 화장품 표시·안전 기준 확인",
        "agency": "Mongolian Customs / competent health and standards authorities",
        "basis": "Mongolian customs, consumer and health product controls",
        "summary": "화장품은 성분, 라벨, 안전성, 의약품성 효능 표시 여부 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "전성분표", "제품 라벨", "제품 사양서", "안전성 자료(해당 시)"],
        "notes": "의약품성 효능, 자외선차단·기능성 표시, 제한성분, 몽골어 표시 필요 여부를 함께 확인합니다.",
        "source_name": "Mongolia customs law",
        "source_url": MONGOLIA_CUSTOMS_LAW_URL,
    },
]


def sql(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def doc_array(documents: list[str]) -> str:
    return ", ".join(sql(document) for document in documents)


def main() -> None:
    requirement_sql = "\n".join(
        f"""
insert into public.export_destination_import_requirements (
  country_code,
  destination_hs_code,
  requirement_type,
  requirement_name,
  agency,
  legal_basis,
  procedure_summary,
  required_documents,
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
  'MNG',
  heading.destination_hs_code,
  {sql(requirement["type"])},
  {sql(requirement["name"])},
  {sql(requirement["agency"])},
  {sql(requirement["basis"])},
  {sql(requirement["summary"])},
  jsonb_build_array({doc_array(requirement["documents"])}),
  {sql(requirement["notes"])},
  {sql(requirement["source_name"])},
  {sql(requirement["source_url"])},
  {sql(SOURCE_VERSION + ':import-requirements')},
  date '2026-01-01',
  null::date,
  null::timestamptz,
  now(),
  'staged'::public.legal_record_status,
  encode(digest('MNG|' || heading.destination_hs_code || '|' || {sql(requirement["type"])} || '|' || {sql(requirement["name"])} || '|' || {sql(SOURCE_VERSION)}, 'sha256'), 'hex')
from (
  select distinct left(destination_hs_code, 4) as destination_hs_code
  from public.export_destination_tariff_rates
  where country_code = 'MNG'
    and source_version = 'customs-country-tariff-20251231:MNG'
    and ({requirement["condition"]})
) heading
on conflict (country_code, destination_hs_code, requirement_type, requirement_name, coalesce(agency, ''), source_version)
do update set
  legal_basis = excluded.legal_basis,
  procedure_summary = excluded.procedure_summary,
  required_documents = excluded.required_documents,
  notes = excluded.notes,
  source_name = excluded.source_name,
  source_url = excluded.source_url,
  effective_from = excluded.effective_from,
  effective_to = excluded.effective_to,
  published_at = excluded.published_at,
  retrieved_at = excluded.retrieved_at,
  status = excluded.status,
  checksum = excluded.checksum;
"""
        for requirement in REQUIREMENTS
    )

    output = f"""-- Generated by scripts/generate_mongolia_import_data_seed.py

begin;

delete from public.export_destination_internal_taxes
where country_code = 'MNG'
  and source_version like '{SOURCE_VERSION}%';

delete from public.export_destination_import_requirements
where country_code = 'MNG'
  and source_version like '{SOURCE_VERSION}%';

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
  'MNG',
  tariff.destination_hs_code,
  'vat',
  '수입 VAT',
  '10%',
  '몽골 수입 VAT 표준세율 후보',
  'Invest Mongolia taxation 안내 기준 수입 goods, works and services에는 VAT 10%가 적용될 수 있습니다. 면세, 영세율, 특별소비세와 품목별 예외는 별도 확인이 필요합니다.',
  'Invest Mongolia taxation',
  {sql(INVEST_MONGOLIA_TAX_SOURCE_URL)},
  {sql(SOURCE_VERSION + ':vat')},
  date '2026-01-01',
  null::date,
  null::timestamptz,
  now(),
  'staged'::public.legal_record_status,
  encode(digest('MNG|vat|' || tariff.destination_hs_code || '|' || {sql(SOURCE_VERSION)}, 'sha256'), 'hex')
from (
  select distinct destination_hs_code
  from public.export_destination_tariff_rates
  where country_code = 'MNG'
    and source_version = 'customs-country-tariff-20251231:MNG'
) tariff
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

{requirement_sql}

commit;
"""

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(output, encoding="utf-8")
    print(f"wrote {OUTPUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
