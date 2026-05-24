#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "supabase/seed/generated/laos_import_data_seed.sql"

SOURCE_VERSION = "laos-import-data-20260523"
LAO_TRADE_PORTAL_SOURCE_URL = "https://www.laotradeportal.gov.la/"
LAO_TRADE_PORTAL_IMPORTS_SOURCE_URL = "https://www.laotradeportal.gov.la/en-gb/site/display/10"
LAO_TRADE_PORTAL_COMMODITY_SOURCE_URL = "https://www.laotradeportal.gov.la/en-gb/site/listcommodity"
LAO_VAT_SOURCE_URL = "https://www.laotradeportal.gov.la/en-gb/site/display/589"
LAO_FOOD_DRUG_SOURCE_URL = "https://fdd.gov.la/"
LAO_STANDARDS_SOURCE_URL = "https://dsm.gov.la/"
LAO_AGRICULTURE_SOURCE_URL = "https://www.maf.gov.la/"
LAO_TELECOM_SOURCE_URL = "https://mpt.gov.la/"

REQUIREMENTS = [
    {
        "condition": "destination_hs_code like '02%' or destination_hs_code like '03%' or destination_hs_code like '04%' or destination_hs_code like '07%' or destination_hs_code like '08%' or destination_hs_code like '09%' or destination_hs_code like '10%' or destination_hs_code like '11%' or destination_hs_code like '12%' or destination_hs_code like '15%' or destination_hs_code like '16%' or destination_hs_code like '17%' or destination_hs_code like '18%' or destination_hs_code like '19%' or destination_hs_code like '20%' or destination_hs_code like '21%' or destination_hs_code like '22%'",
        "type": "food_import_health_control",
        "name": "라오스 식품 수입허가·위생확인",
        "agency": "Food and Drug Department / Lao Customs",
        "basis": "Lao Trade Portal food import and sanitary requirements",
        "summary": "식품, 식품원료, 식품첨가물, 음료, 식품접촉 포장재는 수입허가, 위생증명, 라벨, 성분 및 유통기한 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "성분표", "제품 라벨", "위생증명서 또는 자유판매증명서(해당 시)", "수입허가 자료(해당 시)"],
        "notes": "제품 유형, 성분, 포장 상태, 용도, 수입자 등록 및 Lao Trade Portal 상품별 조치에 따라 조건이 달라질 수 있습니다.",
        "source_name": "Lao PDR Trade Portal commodity search",
        "source_url": LAO_TRADE_PORTAL_COMMODITY_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '01%' or destination_hs_code like '02%' or destination_hs_code like '03%' or destination_hs_code like '04%' or destination_hs_code like '05%' or destination_hs_code like '41%' or destination_hs_code like '42%' or destination_hs_code like '43%' or destination_hs_code like '51%'",
        "type": "animal_quarantine",
        "name": "라오스 동물검역·축산물 수입허가 확인",
        "agency": "Ministry of Agriculture and Forestry / Lao Customs",
        "basis": "Lao PDR sanitary and animal quarantine import controls",
        "summary": "동물, 축산물, 동물성 원료, 가죽, 모피, 양모 등은 수입허가, 위생증명서, 검역검사 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "동물종/원재료 정보", "위생증명서(해당 시)", "수입허가 자료(해당 시)", "처리·가공 증명자료(해당 시)"],
        "notes": "동물종, 질병상황, 가공상태, 식용/비식품용, 수입자 허가 여부에 따라 요구사항이 달라질 수 있습니다.",
        "source_name": "Lao PDR Trade Portal imports guide",
        "source_url": LAO_TRADE_PORTAL_IMPORTS_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '06%' or destination_hs_code like '07%' or destination_hs_code like '08%' or destination_hs_code like '10%' or destination_hs_code like '12%' or destination_hs_code like '14%' or destination_hs_code like '44%' or destination_hs_code like '45%' or destination_hs_code like '46%' or destination_hs_code like '94%'",
        "type": "plant_quarantine",
        "name": "라오스 식물검역·목재류 수입허가 확인",
        "agency": "Ministry of Agriculture and Forestry / Lao Customs",
        "basis": "Lao PDR phytosanitary import controls",
        "summary": "식물, 종자, 곡물, 과실, 식물성 원료, 목재 및 목재포장재는 식물검역증명서, 수입허가, 검역검사, 훈증 또는 처리증명 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "학명/수종 정보", "식물검역증명서(해당 시)", "수입허가 자료(해당 시)", "훈증/열처리 증명서(해당 시)"],
        "notes": "금지품목, 제한품목, 원산지, 수종, 가공상태, 식용/비식용에 따라 검역 조건이 달라질 수 있습니다.",
        "source_name": "Lao PDR Trade Portal imports guide",
        "source_url": LAO_TRADE_PORTAL_IMPORTS_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '30%' or destination_hs_code like '3006%' or destination_hs_code like '9018%' or destination_hs_code like '9021%' or destination_hs_code like '9022%'",
        "type": "drug_medical_device_import",
        "name": "라오스 의약품·의료기기 수입등록 확인",
        "agency": "Food and Drug Department / Lao Customs",
        "basis": "Lao PDR food and drug import controls",
        "summary": "의약품, 의료기기, 진단기기성 제품은 제품등록, 수입허가, 라벨, 제조자 품질문서, 사용목적 확인 대상 가능성이 있습니다.",
        "documents": ["제품 사양서", "성분/모델 정보", "용도 설명", "제품등록 또는 수입허가 자료(해당 시)", "라벨/사용설명서", "제조자 품질문서(해당 시)"],
        "notes": "치료 목적, 인체 사용 목적, 의료기기 등급, 진단용 여부에 따라 적용 제도와 필요 허가가 달라질 수 있습니다.",
        "source_name": "Food and Drug Department Lao PDR",
        "source_url": LAO_FOOD_DRUG_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '3304%'",
        "type": "cosmetics_import_labeling",
        "name": "라오스 화장품 수입등록·라벨 확인",
        "agency": "Food and Drug Department / Lao Customs",
        "basis": "Lao PDR cosmetic import and labeling controls",
        "summary": "화장품은 수입자 등록, 제품신고 또는 허가, 성분 제한, 라벨, 효능표현 확인 대상 가능성이 있습니다.",
        "documents": ["전성분표", "제품 라벨", "제품 정보자료", "수입자/책임회사 자료", "제품신고 또는 허가자료(해당 시)"],
        "notes": "의약품성 효능 표현이 있거나 치료 목적을 표방하면 화장품이 아닌 의약품 규제가 적용될 수 있습니다.",
        "source_name": "Food and Drug Department Lao PDR",
        "source_url": LAO_FOOD_DRUG_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '17%' or destination_hs_code like '18%' or destination_hs_code like '19%' or destination_hs_code like '20%' or destination_hs_code like '21%' or destination_hs_code like '22%' or destination_hs_code like '25%' or destination_hs_code like '27%' or destination_hs_code like '28%' or destination_hs_code like '29%' or destination_hs_code like '33%' or destination_hs_code like '34%' or destination_hs_code like '39%' or destination_hs_code like '40%' or destination_hs_code like '68%' or destination_hs_code like '72%' or destination_hs_code like '73%' or destination_hs_code like '84%' or destination_hs_code like '85%' or destination_hs_code like '87%' or destination_hs_code like '90%' or destination_hs_code like '94%' or destination_hs_code like '95%'",
        "type": "technical_standard",
        "name": "라오스 기술표준·적합성 확인",
        "agency": "Department of Standardization and Metrology / Lao Customs",
        "basis": "Lao PDR technical requirements and standards controls",
        "summary": "식품, 화학, 전기전자, 기계, 차량부품, 건축자재, 완구 등 일부 제품은 기술표준, 라벨, 적합성 확인 또는 수입허가 대상 가능성이 있습니다.",
        "documents": ["제품 사양서", "모델명/규격", "시험성적서", "적합성 또는 수입허가 자료(해당 시)", "라벨/마킹 자료"],
        "notes": "대상 여부는 HS만이 아니라 제품명, 모델, 전기정격, 적용 표준, 사용처와 예외조건에 따라 달라질 수 있습니다.",
        "source_name": "Department of Standardization and Metrology Lao PDR",
        "source_url": LAO_STANDARDS_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '8517%' or destination_hs_code like '8525%' or destination_hs_code like '8526%' or destination_hs_code like '8527%' or destination_hs_code like '8528%' or destination_hs_code like '8543%'",
        "type": "telecom_radio_equipment",
        "name": "라오스 통신·무선기기 승인 확인",
        "agency": "Ministry of Technology and Communications / Lao Customs",
        "basis": "Lao PDR telecom and radio equipment controls",
        "summary": "통신장비, 무선기기, Wi-Fi/Bluetooth/RFID 기능 제품은 형식승인, 주파수·라벨 조건, 수입허가 대상 가능성이 있습니다.",
        "documents": ["제품 사양서", "무선 모듈/주파수 정보", "시험성적서", "승인 또는 신청자료(해당 시)", "모델명/제조자 정보"],
        "notes": "무선 기능 포함 여부, 주파수 대역, 완제품/부품 형태, 통신망 접속 여부에 따라 요구사항이 달라질 수 있습니다.",
        "source_name": "Ministry of Technology and Communications Lao PDR",
        "source_url": LAO_TELECOM_SOURCE_URL,
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
  'LAO',
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
  encode(digest('LAO|' || heading.destination_hs_code || '|' || {sql(requirement["type"])} || '|' || {sql(requirement["name"])} || '|' || {sql(SOURCE_VERSION)}, 'sha256'), 'hex')
from (
  select distinct left(destination_hs_code, 4) as destination_hs_code
  from public.export_destination_tariff_rates
  where country_code = 'LAO'
    and source_version = 'customs-country-tariff-20251231:LAO'
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

    output = f"""-- Generated by scripts/generate_laos_import_data_seed.py

begin;

delete from public.export_destination_internal_taxes
where country_code = 'LAO'
  and source_version like '{SOURCE_VERSION}%';

delete from public.export_destination_import_requirements
where country_code = 'LAO'
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
  'LAO',
  tariff.destination_hs_code,
  'vat',
  '수입 VAT',
  '10%',
  '라오스 수입 VAT 표준세율 후보',
  'Lao Trade Portal의 VAT 안내 기준 수입물품과 국내 소비 재화·용역에 10% VAT가 적용됩니다. 면세, 감면, 소비세·특별세, 프로젝트 인센티브 및 품목별 예외는 별도 확인이 필요합니다.',
  'Lao PDR Trade Portal VAT rate notice',
  {sql(LAO_VAT_SOURCE_URL)},
  {sql(SOURCE_VERSION + ':vat')},
  date '2026-01-01',
  null::date,
  null::timestamptz,
  now(),
  'staged'::public.legal_record_status,
  encode(digest('LAO|vat|10|' || tariff.destination_hs_code || '|' || {sql(SOURCE_VERSION)}, 'sha256'), 'hex')
from (
  select distinct destination_hs_code
  from public.export_destination_tariff_rates
  where country_code = 'LAO'
    and source_version = 'customs-country-tariff-20251231:LAO'
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
