#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "supabase/seed/generated/australia_import_data_seed.sql"

SOURCE_VERSION = "australia-import-data-20260523"
GST_SOURCE_URL = "https://www.abf.gov.au/importing-exporting-and-manufacturing/importing/cost-of-importing-goods/gst-and-other-taxes"
BICON_SOURCE_URL = "https://www.agriculture.gov.au/biosecurity-trade/import/online-services/bicon"
BICON_PERMIT_SOURCE_URL = "https://www.agriculture.gov.au/biosecurity-trade/import/online-services/bicon/bicon-permit"
AICIS_SOURCE_URL = "https://www.industrialchemicals.gov.au/business/getting-started-registration-importing-and-manufacturing/basics-importing-and-manufacturing-chemicals"
THERAPEUTIC_GOODS_SOURCE_URL = "https://www.tga.gov.au/resources/resource/guidance/personal-importation-scheme"

REQUIREMENTS = [
    {
        "condition": "destination_hs_code like '02%' or destination_hs_code like '03%' or destination_hs_code like '04%' or destination_hs_code like '07%' or destination_hs_code like '08%' or destination_hs_code like '09%' or destination_hs_code like '10%' or destination_hs_code like '11%' or destination_hs_code like '12%' or destination_hs_code like '15%' or destination_hs_code like '16%' or destination_hs_code like '17%' or destination_hs_code like '18%' or destination_hs_code like '19%' or destination_hs_code like '20%' or destination_hs_code like '21%' or destination_hs_code like '22%'",
        "type": "biosecurity_food",
        "name": "호주 식품·농수산물 BICON 수입조건 확인",
        "agency": "Department of Agriculture, Fisheries and Forestry / Australian Border Force",
        "basis": "Biosecurity Import Conditions system (BICON) / Imported Food Control Act",
        "summary": "식품, 농수산물, 동식물성 원료가 포함된 물품은 BICON 품목별 수입조건, 수입허가, 검역검사, 처리증명, 식품검사 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "성분표", "제조공정 설명", "위생증명서 또는 식물검역증명서(해당 시)", "처리/훈증증명서(해당 시)"],
        "notes": "가공상태, 원재료의 동식물성 여부, 포장재, 목적 용도, 수입 전 허가 필요 여부를 BICON에서 확인합니다.",
        "source_name": "Australian BICON / DAFF import permit guidance",
        "source_url": BICON_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '06%' or destination_hs_code like '12%' or destination_hs_code like '14%' or destination_hs_code like '44%' or destination_hs_code like '45%' or destination_hs_code like '46%' or destination_hs_code like '94%'",
        "type": "biosecurity_plant_wood",
        "name": "호주 식물·목재류 BICON 검역조건 확인",
        "agency": "Department of Agriculture, Fisheries and Forestry / Australian Border Force",
        "basis": "Biosecurity Import Conditions system (BICON) / Biosecurity Act",
        "summary": "식물, 씨앗, 목재, 목재포장재, 식물성 원료 제품은 수입허가, 식물검역증명서, 훈증·열처리, 병해충 검사 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "학명/수종 정보", "식물검역증명서(해당 시)", "훈증 또는 열처리 증명서(해당 시)"],
        "notes": "건조·가공 정도, 수종, bark 포함 여부, 포장재 여부, 원산국과 선적국 조건에 따라 수입조건이 달라질 수 있습니다.",
        "source_name": "Australian BICON / DAFF import permit guidance",
        "source_url": BICON_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '01%' or destination_hs_code like '02%' or destination_hs_code like '03%' or destination_hs_code like '04%' or destination_hs_code like '05%' or destination_hs_code like '41%' or destination_hs_code like '42%' or destination_hs_code like '43%' or destination_hs_code like '51%'",
        "type": "biosecurity_animal",
        "name": "호주 동물·동물성 제품 BICON 검역조건 확인",
        "agency": "Department of Agriculture, Fisheries and Forestry / Australian Border Force",
        "basis": "Biosecurity Import Conditions system (BICON) / Biosecurity Act",
        "summary": "동물, 수산물, 축산물, 가죽, 모피, 양모 등 동물성 원료 제품은 BICON 수입조건, 수입허가, 위생증명서, 검역검사 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "원재료/종 정보", "위생증명서(해당 시)", "가공·처리 증명자료(해당 시)"],
        "notes": "동물종, 원산국, 가공상태, 멸균·무두질 여부, 식품용/비식품용에 따라 조건이 달라질 수 있습니다.",
        "source_name": "Australian BICON / DAFF import permit guidance",
        "source_url": BICON_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '28%' or destination_hs_code like '29%' or destination_hs_code like '32%' or destination_hs_code like '33%' or destination_hs_code like '34%' or destination_hs_code like '38%'",
        "type": "industrial_chemicals",
        "name": "호주 산업화학물질 AICIS 등록·분류 확인",
        "agency": "Australian Industrial Chemicals Introduction Scheme / Australian Border Force",
        "basis": "Australian Industrial Chemicals Introduction Scheme (AICIS)",
        "summary": "화학물질, 혼합물, 화장품·세정제·도료·접착제 원료성 제품은 AICIS 사업자 등록, Inventory 등재, 도입 분류, 평가증명 대상 가능성이 있습니다.",
        "documents": ["CAS 번호", "SDS", "성분비", "용도 설명", "AICIS 등록/분류 자료(해당 시)"],
        "notes": "의약품, 농약, 식품첨가물 등 다른 제도 대상은 AICIS 범위에서 제외되거나 별도 규제가 우선될 수 있습니다.",
        "source_name": "Australian Industrial Chemicals Introduction Scheme",
        "source_url": AICIS_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '30%' or destination_hs_code like '3006%' or destination_hs_code like '9018%' or destination_hs_code like '9021%' or destination_hs_code like '9022%'",
        "type": "therapeutic_goods",
        "name": "호주 치료제·의료기기 TGA 수입규제 확인",
        "agency": "Therapeutic Goods Administration / Australian Border Force",
        "basis": "Therapeutic Goods Act / TGA import guidance",
        "summary": "의약품, 치료제, 의료기기성 제품은 ARTG 등재, 수입자 책임, 개인수입 예외, 처방·허가 요건 확인 대상 가능성이 있습니다.",
        "documents": ["제품 사양서", "용도 설명", "성분/모델 정보", "ARTG 또는 TGA 관련 자료(해당 시)", "처방/의사소견 자료(해당 시)"],
        "notes": "의료 목적 표시, 효능 주장, 멸균 여부, 인체 사용 목적 여부에 따라 TGA 적용 가능성이 달라질 수 있습니다.",
        "source_name": "Therapeutic Goods Administration import guidance",
        "source_url": THERAPEUTIC_GOODS_SOURCE_URL,
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
  'AUS',
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
  encode(digest('AUS|' || heading.destination_hs_code || '|' || {sql(requirement["type"])} || '|' || {sql(requirement["name"])} || '|' || {sql(SOURCE_VERSION)}, 'sha256'), 'hex')
from (
  select distinct left(destination_hs_code, 4) as destination_hs_code
  from public.export_destination_tariff_rates
  where country_code = 'AUS'
    and source_version = 'customs-country-tariff-20251231:AUS'
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

    output = f"""-- Generated by scripts/generate_australia_import_data_seed.py

begin;

delete from public.export_destination_internal_taxes
where country_code = 'AUS'
  and source_version like '{SOURCE_VERSION}%';

delete from public.export_destination_import_requirements
where country_code = 'AUS'
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
  'AUS',
  tariff.destination_hs_code,
  'gst',
  '수입 GST',
  '10%',
  '호주 수입 GST 표준세율 후보',
  'ABF 안내 기준으로 대부분의 수입물품에는 GST가 부과될 수 있습니다. GST-free, 저가물품, TRADEX, 와인세, 고급자동차세 등 예외·추가세는 품목과 거래조건별 확인이 필요합니다.',
  'Australian Border Force GST and other taxes',
  {sql(GST_SOURCE_URL)},
  {sql(SOURCE_VERSION + ':gst')},
  date '2026-01-01',
  null::date,
  null::timestamptz,
  now(),
  'staged'::public.legal_record_status,
  encode(digest('AUS|gst|' || tariff.destination_hs_code || '|' || {sql(SOURCE_VERSION)}, 'sha256'), 'hex')
from (
  select distinct destination_hs_code
  from public.export_destination_tariff_rates
  where country_code = 'AUS'
    and source_version = 'customs-country-tariff-20251231:AUS'
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
