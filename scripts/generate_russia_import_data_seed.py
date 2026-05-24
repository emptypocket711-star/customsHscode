#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "supabase/seed/generated/russia_import_data_seed.sql"

SOURCE_VERSION = "russia-import-data-20260524"
FTS_TARIFF_SOURCE_URL = "https://customs.gov.ru/"
FNS_VAT_SOURCE_URL = "https://www.nalog.gov.ru/new2026/"
EEC_TECH_REG_SOURCE_URL = "https://eec.eaeunion.org/en/comission/department/deptexreg/tr/"
ROSPOTREBNADZOR_SOURCE_URL = "https://www.rospotrebnadzor.ru/"
ROSSELKHOZNADZOR_SOURCE_URL = "https://fsvps.gov.ru/"
ROSZDRAVNADZOR_SOURCE_URL = "https://roszdravnadzor.gov.ru/en/medproducts/import"
EAEU_TARIFF_SOURCE_URL = "https://eec.eaeunion.org/en/"

REDUCED_VAT_CONDITION = (
    "destination_hs_code like '01%' or destination_hs_code like '02%' or destination_hs_code like '03%' "
    "or destination_hs_code like '04%' or destination_hs_code like '07%' or destination_hs_code like '08%' "
    "or destination_hs_code like '09%' or destination_hs_code like '10%' or destination_hs_code like '11%' "
    "or destination_hs_code like '12%' or destination_hs_code like '15%' or destination_hs_code like '16%' "
    "or destination_hs_code like '17%' or destination_hs_code like '18%' or destination_hs_code like '19%' "
    "or destination_hs_code like '20%' or destination_hs_code like '21%' or destination_hs_code like '30%'"
)

REQUIREMENTS = [
    {
        "condition": "destination_hs_code like '01%' or destination_hs_code like '02%' or destination_hs_code like '03%' or destination_hs_code like '04%' or destination_hs_code like '05%' or destination_hs_code like '41%' or destination_hs_code like '42%' or destination_hs_code like '43%' or destination_hs_code like '51%'",
        "type": "rosselkhoznadzor_veterinary_control",
        "name": "러시아 동물·동물성 제품 수의검역 확인",
        "agency": "Rosselkhoznadzor / Federal Customs Service",
        "basis": "Russian veterinary and phytosanitary supervision for animal-origin imports",
        "summary": "동물, 축산물, 수산물, 동물성 원료, 가죽·모피·양모 등은 Rosselkhoznadzor 수의검역, 수입허가, 위생증명서, 승인 사업장 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "B/L 또는 AWB", "포장명세서", "동물종/원재료 정보", "위생증명서(해당 시)", "수입허가 또는 승인사업장 자료(해당 시)"],
        "notes": "동물종, 식용/비식품용, 원산국 질병상황, EAEU 수의증명서 양식과 일시적 수입제한 여부를 함께 확인합니다.",
        "source_name": "Rosselkhoznadzor",
        "source_url": ROSSELKHOZNADZOR_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '06%' or destination_hs_code like '07%' or destination_hs_code like '08%' or destination_hs_code like '09%' or destination_hs_code like '10%' or destination_hs_code like '11%' or destination_hs_code like '12%' or destination_hs_code like '14%' or destination_hs_code like '44%' or destination_hs_code like '45%' or destination_hs_code like '46%'",
        "type": "rosselkhoznadzor_phytosanitary_control",
        "name": "러시아 식물·농산물 검역 확인",
        "agency": "Rosselkhoznadzor / Federal Customs Service",
        "basis": "Russian phytosanitary quarantine controls for regulated plant products",
        "summary": "식물, 종자, 곡물, 과실, 식물성 원료, 목재·목재포장재는 식물검역증명서, 수입허가, 검역검사, 일시적 수입제한 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "학명/수종 정보", "식물검역증명서(해당 시)", "훈증 또는 처리증명서(해당 시)", "수입허가 자료(해당 시)"],
        "notes": "재식용 여부, 병해충 조건, 원산국별 제한, 목재포장재 포함 여부에 따라 요구사항이 달라질 수 있습니다.",
        "source_name": "Rosselkhoznadzor",
        "source_url": ROSSELKHOZNADZOR_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '15%' or destination_hs_code like '16%' or destination_hs_code like '17%' or destination_hs_code like '18%' or destination_hs_code like '19%' or destination_hs_code like '20%' or destination_hs_code like '21%' or destination_hs_code like '22%' or destination_hs_code like '33%' or destination_hs_code like '34%' or destination_hs_code like '38%'",
        "type": "rospotrebnadzor_sanitary_consumer_control",
        "name": "러시아 위생·소비자보호·표시 기준 확인",
        "agency": "Rospotrebnadzor / Federal Customs Service",
        "basis": "Russian sanitary, consumer protection and EAEU product circulation controls",
        "summary": "식품, 음료, 화장품, 생활화학제품, 소독제류는 Rospotrebnadzor 위생요건, EAEU 기술규정, 국가등록, 라벨·성분 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "성분표", "제품 라벨", "EAC 적합성자료(해당 시)", "국가등록증 또는 위생자료(해당 시)"],
        "notes": "식품 유형, 기능성·의약품성 표시, 제한성분, 러시아어/EAEU 표시사항, Chestny ZNAK 표시 대상 여부를 함께 확인합니다.",
        "source_name": "Rospotrebnadzor",
        "source_url": ROSPOTREBNADZOR_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '30%' or destination_hs_code like '9018%' or destination_hs_code like '9021%' or destination_hs_code like '9022%'",
        "type": "roszdravnadzor_medical_product_control",
        "name": "러시아 의약품·의료기기 Roszdravnadzor 확인",
        "agency": "Roszdravnadzor / Federal Customs Service",
        "basis": "Russian medical products and medical-device import control",
        "summary": "의약품, 의료기기, 진단기기성 제품은 등록, 수입허가, Roszdravnadzor 반입승인, EAEU 의료기기 규정 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "제품 사양서", "용도 설명", "등록증 또는 허가자료(해당 시)", "라벨/사용설명서"],
        "notes": "의료 목적 표시, 등록제품 여부, 연구·전시·등록용 샘플 여부, EAEU 의료기기 전환규정에 따라 요구사항이 달라질 수 있습니다.",
        "source_name": "Roszdravnadzor medical products import",
        "source_url": ROSZDRAVNADZOR_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '25%' or destination_hs_code like '27%' or destination_hs_code like '28%' or destination_hs_code like '29%' or destination_hs_code like '32%' or destination_hs_code like '33%' or destination_hs_code like '34%' or destination_hs_code like '35%' or destination_hs_code like '38%' or destination_hs_code like '39%' or destination_hs_code like '40%' or destination_hs_code like '68%' or destination_hs_code like '72%' or destination_hs_code like '73%' or destination_hs_code like '84%' or destination_hs_code like '85%' or destination_hs_code like '87%' or destination_hs_code like '90%' or destination_hs_code like '94%' or destination_hs_code like '95%'",
        "type": "eaeu_technical_regulation_conformity",
        "name": "EAEU 기술규정·EAC 적합성 확인",
        "agency": "Eurasian Economic Commission / Russian accredited bodies / Federal Customs Service",
        "basis": "EAEU technical regulations and mandatory conformity assessment",
        "summary": "전기전자, 기계, 차량·부품, 소비재, 화학제품, 건축자재, 장난감 등은 EAEU 기술규정, EAC 인증·선언, 시험성적서, 러시아어 표시 확인 대상 가능성이 있습니다.",
        "documents": ["제품 사양서", "모델명/규격", "시험성적서", "EAC 인증서 또는 적합성 선언(해당 시)", "라벨/마킹 자료", "사용설명서"],
        "notes": "대상 기술규정은 HS뿐 아니라 제품명, 용도, 전기정격, 재질, 사용연령, 모델 구성에 따라 달라질 수 있습니다.",
        "source_name": "EAEU technical regulations",
        "source_url": EEC_TECH_REG_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '84%' or destination_hs_code like '85%' or destination_hs_code like '87%' or destination_hs_code like '88%' or destination_hs_code like '89%' or destination_hs_code like '90%' or destination_hs_code like '93%'",
        "type": "russia_import_restriction_sanctions_check",
        "name": "러시아 수입통제·제재·이중용도 확인",
        "agency": "Federal Customs Service / competent Russian authorities",
        "basis": "Russian import control, EAEU non-tariff regulation and sanctions-related restrictions",
        "summary": "기계·전자·운송·정밀기기·무기 관련 품목은 러시아/EAEU 비관세조치, 수입허가, 이중용도·제재 관련 제한 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "제품 사양서", "최종사용자 정보", "용도 설명", "허가 또는 비대상 확인자료(해당 시)"],
        "notes": "러시아향 거래는 목적국 수입규정뿐 아니라 한국 수출통제, 제재, 금융·물류 제한을 별도로 확인해야 합니다.",
        "source_name": "Federal Customs Service of Russia",
        "source_url": FTS_TARIFF_SOURCE_URL,
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
  'RUS',
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
  encode(digest('RUS|' || heading.destination_hs_code || '|' || {sql(requirement["type"])} || '|' || {sql(requirement["name"])} || '|' || {sql(SOURCE_VERSION)}, 'sha256'), 'hex')
from (
  select distinct left(destination_hs_code, 4) as destination_hs_code
  from public.export_destination_tariff_rates
  where country_code = 'RUS'
    and source_version = 'customs-country-tariff-20251231:RUS'
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

    output = f"""-- Generated by scripts/generate_russia_import_data_seed.py

begin;

delete from public.export_destination_internal_taxes
where country_code = 'RUS'
  and source_version like '{SOURCE_VERSION}%';

delete from public.export_destination_import_requirements
where country_code = 'RUS'
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
  'RUS',
  tariff.destination_hs_code,
  'vat',
  '수입 VAT',
  '10%',
  '러시아 수입 VAT 10% 후보',
  '러시아 FNS 2026 안내 기준 기본 VAT는 22%이나 일부 사회적으로 중요한 식품·의약품 등에는 10%가 유지됩니다. 실제 10% 대상은 러시아 세법상 세부 목록 확인이 필요합니다.',
  'Federal Tax Service Russia 2026 VAT changes',
  {sql(FNS_VAT_SOURCE_URL)},
  {sql(SOURCE_VERSION + ':vat')},
  date '2026-01-01',
  null::date,
  null::timestamptz,
  now(),
  'staged'::public.legal_record_status,
  encode(digest('RUS|vat10|' || tariff.destination_hs_code || '|' || {sql(SOURCE_VERSION)}, 'sha256'), 'hex')
from (
  select distinct destination_hs_code
  from public.export_destination_tariff_rates
  where country_code = 'RUS'
    and source_version = 'customs-country-tariff-20251231:RUS'
    and ({REDUCED_VAT_CONDITION})
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
  'RUS',
  tariff.destination_hs_code,
  'vat',
  '수입 VAT',
  '22%',
  '러시아 수입 VAT 기본세율 후보',
  '러시아 FNS 안내 기준 2026년 1월 1일부터 기본 VAT 세율은 22%입니다. 일부 품목은 10%, 면세 또는 특례가 적용될 수 있어 세부 목록 확인이 필요합니다.',
  'Federal Tax Service Russia 2026 VAT changes',
  {sql(FNS_VAT_SOURCE_URL)},
  {sql(SOURCE_VERSION + ':vat')},
  date '2026-01-01',
  null::date,
  null::timestamptz,
  now(),
  'staged'::public.legal_record_status,
  encode(digest('RUS|vat22|' || tariff.destination_hs_code || '|' || {sql(SOURCE_VERSION)}, 'sha256'), 'hex')
from (
  select distinct destination_hs_code
  from public.export_destination_tariff_rates
  where country_code = 'RUS'
    and source_version = 'customs-country-tariff-20251231:RUS'
    and not ({REDUCED_VAT_CONDITION})
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
