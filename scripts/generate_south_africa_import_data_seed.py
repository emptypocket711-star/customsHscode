#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "supabase/seed/generated/south_africa_import_data_seed.sql"

SOURCE_VERSION = "south-africa-import-data-20260524"
SARS_TARIFF_SOURCE_URL = "https://www.sars.gov.za/customs-and-excise/tariff/"
SARS_VAT_SOURCE_URL = "https://www.sars.gov.za/customs-and-excise/duties-and-taxes/duties-and-taxes-for-importers/"
SARS_RESTRICTED_SOURCE_URL = "https://www.sars.gov.za/customs-and-excise/prohibited-restricted-and-counterfeit-goods/"
ITAC_SOURCE_URL = "https://itac.org.za/import-control/"
GOV_IMPORT_PERMIT_SOURCE_URL = "https://www.gov.za/services/import/import-permit-general-goods"
NRCS_SOURCE_URL = "https://www.nrcs.org.za/"
SAHPRA_MEDICAL_SOURCE_URL = "https://www.sahpra.org.za/importation-of-medical-products-border-control/"
SAHPRA_COSMETICS_SOURCE_URL = "https://www.sahpra.org.za/document/foodstuffs-cosmetics-and-disinfectants-act-1972-act-no-54-of-1972-as-amended/"
AGRI_ANIMAL_SOURCE_URL = "https://www.gov.za/services/import/import-animals-and-animal-products"
AGRI_FOOD_SOURCE_URL = "https://www.dlrrd.gov.za/"

REQUIREMENTS = [
    {
        "condition": "destination_hs_code like '01%' or destination_hs_code like '02%' or destination_hs_code like '03%' or destination_hs_code like '04%' or destination_hs_code like '05%' or destination_hs_code like '41%' or destination_hs_code like '42%' or destination_hs_code like '43%' or destination_hs_code like '51%'",
        "type": "agriculture_animal_veterinary_permit",
        "name": "남아공 동물·동물성 제품 수의검역 확인",
        "agency": "Department of Agriculture, Land Reform and Rural Development / SARS",
        "basis": "South African veterinary import permit and agricultural border-control requirements",
        "summary": "동물, 동물성 제품, 수산물, 가죽·모피·양모 등은 수의 수입허가, 위생증명서, 검역, 원산국 질병상황 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "B/L 또는 AWB", "포장명세서", "동물종/원재료 정보", "수의검역증명서(해당 시)", "수입허가서(해당 시)"],
        "notes": "식용/비식용, 동물종, 가공상태, 원산국별 질병상황에 따라 허가와 증명서 조건이 달라질 수 있습니다.",
        "source_name": "Import animals and animal products",
        "source_url": AGRI_ANIMAL_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '06%' or destination_hs_code like '07%' or destination_hs_code like '08%' or destination_hs_code like '09%' or destination_hs_code like '10%' or destination_hs_code like '11%' or destination_hs_code like '12%' or destination_hs_code like '14%' or destination_hs_code like '15%' or destination_hs_code like '16%' or destination_hs_code like '17%' or destination_hs_code like '18%' or destination_hs_code like '19%' or destination_hs_code like '20%' or destination_hs_code like '21%' or destination_hs_code like '22%'",
        "type": "agriculture_food_plant_import_control",
        "name": "남아공 식품·농산물·식물검역 확인",
        "agency": "Department of Agriculture, Land Reform and Rural Development / SARS",
        "basis": "Agricultural, food import/export standards and phytosanitary import controls",
        "summary": "식품, 농산물, 곡물, 과실, 종자, 식물성 원료는 수입허가, 식물검역증명서, 위생·식품기준, 항만검사 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "성분표", "제품 라벨", "식물검역증명서(해당 시)", "수입허가서(해당 시)"],
        "notes": "재식용 여부, 식용 여부, 가공상태, 병해충 조건, 식품첨가물·라벨 기준에 따라 요구자료가 달라질 수 있습니다.",
        "source_name": "Department of Agriculture Land Reform and Rural Development",
        "source_url": AGRI_FOOD_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '30%' or destination_hs_code like '9018%' or destination_hs_code like '9021%' or destination_hs_code like '9022%'",
        "type": "sahpra_health_product_import_control",
        "name": "남아공 의약품·의료기기 SAHPRA 확인",
        "agency": "South African Health Products Regulatory Authority / SARS",
        "basis": "SAHPRA importation of medical products border-control process",
        "summary": "의약품, 예정물질, 의료기기, 진단기기는 SAHPRA 등록·허가, 수입자 라이선스, 항만 반출승인 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "제품 사양서", "용도 설명", "SAHPRA 등록 또는 허가자료(해당 시)", "라벨/사용설명서"],
        "notes": "의료 목적 표시, 제품 등급, 등록제품 여부, 개인/상업 수입 구분에 따라 요구사항이 달라질 수 있습니다.",
        "source_name": "SAHPRA importation of medical products border control",
        "source_url": SAHPRA_MEDICAL_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '3304%'",
        "type": "cosmetics_fcd_act_control",
        "name": "남아공 화장품 안전·표시 기준 확인",
        "agency": "Department of Health / SAHPRA / SARS",
        "basis": "Foodstuffs, Cosmetics and Disinfectants Act, 1972",
        "summary": "화장품은 식품·화장품·소독제 법령상 안전성, 성분, 표시, 품질기준 확인 대상 가능성이 있습니다. 치료·의약품성 효능 표시가 있으면 SAHPRA 검토 대상이 될 수 있습니다.",
        "documents": ["상업송장", "포장명세서", "전성분표", "제품 라벨", "제품 사양서", "안전성 자료(해당 시)"],
        "notes": "자외선차단, 살균·치료 효능, 제한성분, 라벨 언어와 표시사항에 따라 추가 확인이 필요할 수 있습니다.",
        "source_name": "Foodstuffs Cosmetics and Disinfectants Act",
        "source_url": SAHPRA_COSMETICS_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '25%' or destination_hs_code like '27%' or destination_hs_code like '28%' or destination_hs_code like '29%' or destination_hs_code like '32%' or destination_hs_code like '33%' or destination_hs_code like '34%' or destination_hs_code like '35%' or destination_hs_code like '38%' or destination_hs_code like '39%' or destination_hs_code like '40%' or destination_hs_code like '68%' or destination_hs_code like '72%' or destination_hs_code like '73%' or destination_hs_code like '84%' or destination_hs_code like '85%' or destination_hs_code like '87%' or destination_hs_code like '90%' or destination_hs_code like '94%' or destination_hs_code like '95%'",
        "type": "nrcs_compulsory_specification_control",
        "name": "남아공 NRCS 강제규격·적합성 확인",
        "agency": "National Regulator for Compulsory Specifications / SARS",
        "basis": "NRCS compulsory specifications for regulated imported products",
        "summary": "전기전자, 자동차·부품, 화학·기계·재료, 건축자재, 일부 식품·소비재는 NRCS 강제규격, Letter of Authority, 적합성 확인 대상 가능성이 있습니다.",
        "documents": ["제품 사양서", "모델명/규격", "시험성적서", "적합성 인증서(해당 시)", "NRCS LOA 자료(해당 시)", "라벨/마킹 자료"],
        "notes": "강제규격 대상 여부는 HS뿐 아니라 제품명, 모델, 전기정격, 용도, 해당 VC/SANS 기준에 따라 달라질 수 있습니다.",
        "source_name": "National Regulator for Compulsory Specifications",
        "source_url": NRCS_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '26%' or destination_hs_code like '27%' or destination_hs_code like '38%' or destination_hs_code like '39%' or destination_hs_code like '40%' or destination_hs_code like '47%' or destination_hs_code like '72%' or destination_hs_code like '73%' or destination_hs_code like '74%' or destination_hs_code like '75%' or destination_hs_code like '76%' or destination_hs_code like '78%' or destination_hs_code like '79%' or destination_hs_code like '80%' or destination_hs_code like '81%' or destination_hs_code like '84%' or destination_hs_code like '85%' or destination_hs_code like '87%' or destination_hs_code like '93%'",
        "type": "itac_import_permit_control",
        "name": "남아공 ITAC 수입허가 확인",
        "agency": "International Trade Administration Commission / SARS",
        "basis": "South African import control and general import permit requirements",
        "summary": "통제물품, 중고·재생품, 폐기물·스크랩, 일부 광물·금속·기계·차량·무기류는 ITAC 수입허가 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "제품 상태 자료", "용도 설명", "ITAC 수입허가서(해당 시)", "관할기관 보완자료(해당 시)"],
        "notes": "신품/중고, 폐기물·스크랩 여부, 수량, 용도, 다른 기관 동의 필요 여부에 따라 허가가 달라질 수 있습니다.",
        "source_name": "ITAC import control",
        "source_url": ITAC_SOURCE_URL,
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
  'ZAF',
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
  encode(digest('ZAF|' || heading.destination_hs_code || '|' || {sql(requirement["type"])} || '|' || {sql(requirement["name"])} || '|' || {sql(SOURCE_VERSION)}, 'sha256'), 'hex')
from (
  select distinct left(destination_hs_code, 4) as destination_hs_code
  from public.export_destination_tariff_rates
  where country_code = 'ZAF'
    and source_version = 'customs-country-tariff-20251231:ZAF'
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

    output = f"""-- Generated by scripts/generate_south_africa_import_data_seed.py

begin;

delete from public.export_destination_internal_taxes
where country_code = 'ZAF'
  and source_version like '{SOURCE_VERSION}%';

delete from public.export_destination_import_requirements
where country_code = 'ZAF'
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
  'ZAF',
  tariff.destination_hs_code,
  'vat',
  '수입 VAT',
  '15%',
  '남아프리카공화국 수입 VAT 표준세율 후보',
  'SARS 안내 기준 수입물품에는 VAT 15%가 적용될 수 있습니다. 면세, zero-rated goods, ad valorem excise 및 품목별 예외는 별도 확인이 필요합니다.',
  'SARS duties and taxes for importers',
  {sql(SARS_VAT_SOURCE_URL)},
  {sql(SOURCE_VERSION + ':vat')},
  date '2026-01-01',
  null::date,
  null::timestamptz,
  now(),
  'staged'::public.legal_record_status,
  encode(digest('ZAF|vat|' || tariff.destination_hs_code || '|' || {sql(SOURCE_VERSION)}, 'sha256'), 'hex')
from (
  select distinct destination_hs_code
  from public.export_destination_tariff_rates
  where country_code = 'ZAF'
    and source_version = 'customs-country-tariff-20251231:ZAF'
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
