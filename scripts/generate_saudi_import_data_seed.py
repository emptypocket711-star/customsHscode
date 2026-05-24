#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "supabase/seed/generated/saudi_import_data_seed.sql"

SOURCE_VERSION = "saudi-import-data-20260524"
ZATCA_TARIFF_SOURCE_URL = "https://zatca.gov.sa/en/eServices/Pages/eServices_220.aspx"
ZATCA_IMPORT_SOURCE_URL = "https://www.zatca.gov.sa/en/RulesRegulations/Taxes/Pages/customs_bussiness/import_pages/Import-Instructions.aspx"
ZATCA_VAT_SOURCE_URL = "https://www.zatca.gov.sa/en/RulesRegulations/VAT/Pages/default1.aspx"
SFDA_FOOD_SOURCE_URL = "https://sfda.gov.sa/en/imported-food"
SFDA_FASEH_SOURCE_URL = "https://www.sfda.gov.sa/en/eservices?keys=Faseh"
SABER_SOURCE_URL = "https://www.saso.gov.sa/en/mediacenter/news/Pages/saso_news_1178.aspx"
SFDA_SOURCE_URL = "https://sfda.gov.sa/en"
SFDA_CLASSIFICATION_SOURCE_URL = "https://www.sfda.gov.sa/sites/default/files/2020-04/SFDAProductsClassificationGuidance.pdf"
CST_SOURCE_URL = "https://www.cst.gov.sa/"

REQUIREMENTS = [
    {
        "condition": "destination_hs_code like '02%' or destination_hs_code like '03%' or destination_hs_code like '04%' or destination_hs_code like '07%' or destination_hs_code like '08%' or destination_hs_code like '09%' or destination_hs_code like '10%' or destination_hs_code like '11%' or destination_hs_code like '12%' or destination_hs_code like '15%' or destination_hs_code like '16%' or destination_hs_code like '17%' or destination_hs_code like '18%' or destination_hs_code like '19%' or destination_hs_code like '20%' or destination_hs_code like '21%' or destination_hs_code like '22%'",
        "type": "sfda_food_faseh_clearance",
        "name": "사우디 SFDA 식품 FASEH 통관 확인",
        "agency": "Saudi Food and Drug Authority / ZATCA",
        "basis": "SFDA imported food controls and FASEH electronic clearance",
        "summary": "식품, 식품원료, 식품첨가물, 음료는 SFDA 수입자·제품 등록, FASEH 전자통관, 할랄·위생증명, 라벨·성분 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "B/L 또는 AWB", "포장명세서", "성분표", "제품 라벨", "원산지증명서(해당 시)", "할랄증명서 또는 위생증명서(해당 시)"],
        "notes": "식품 유형, 동물성 원료, 할랄 대상, 특수용도식품, 신규식품 여부에 따라 SFDA 제출자료와 검사 범위가 달라질 수 있습니다.",
        "source_name": "Saudi Food and Drug Authority imported food",
        "source_url": SFDA_FOOD_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '01%' or destination_hs_code like '02%' or destination_hs_code like '03%' or destination_hs_code like '04%' or destination_hs_code like '05%' or destination_hs_code like '41%' or destination_hs_code like '42%' or destination_hs_code like '43%' or destination_hs_code like '51%'",
        "type": "sfda_animal_halal_control",
        "name": "사우디 동물성 제품·할랄·검역 확인",
        "agency": "Saudi Food and Drug Authority / ZATCA",
        "basis": "SFDA food and animal-origin product import controls",
        "summary": "동물, 축산물, 수산물, 동물성 원료, 가죽, 모피, 양모 등은 SFDA 등록, 위생·검역증명, 할랄증명, 원산국 제한 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "동물종/원재료 정보", "위생증명서(해당 시)", "할랄증명서(해당 시)", "원산지 자료"],
        "notes": "동물종, 식용/비식품용, 원산국 질병상황, 할랄 인증기관 인정 여부에 따라 조건이 달라질 수 있습니다.",
        "source_name": "Saudi Food and Drug Authority imported food",
        "source_url": SFDA_FOOD_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '06%' or destination_hs_code like '07%' or destination_hs_code like '08%' or destination_hs_code like '10%' or destination_hs_code like '12%' or destination_hs_code like '14%' or destination_hs_code like '44%' or destination_hs_code like '45%' or destination_hs_code like '46%' or destination_hs_code like '94%'",
        "type": "plant_wood_import_control",
        "name": "사우디 식물·목재류 수입검역 확인",
        "agency": "ZATCA / Relevant competent authorities",
        "basis": "Saudi import instructions and product-specific competent-authority controls",
        "summary": "식물, 종자, 곡물, 과실, 식물성 원료, 목재 및 목재포장재는 식물검역증명서, 수입허가, 훈증·열처리, 관할기관 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "학명/수종 정보", "식물검역증명서(해당 시)", "훈증 또는 처리증명서(해당 시)", "수입허가 자료(해당 시)"],
        "notes": "재식용 여부, 수종, 가공상태, 목재포장재 포함 여부와 원산국별 병해충 조건을 함께 확인합니다.",
        "source_name": "ZATCA import instructions",
        "source_url": ZATCA_IMPORT_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '30%' or destination_hs_code like '3006%' or destination_hs_code like '9018%' or destination_hs_code like '9021%' or destination_hs_code like '9022%'",
        "type": "sfda_drug_medical_device_clearance",
        "name": "사우디 의약품·의료기기 SFDA 통관 확인",
        "agency": "Saudi Food and Drug Authority / ZATCA",
        "basis": "SFDA product classification, registration and FASEH clearance",
        "summary": "의약품, 의료기기, 진단기기성 제품은 SFDA 분류·등록, 의료기기 국가등록, FASEH 통관, 라벨·사용목적 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "제품 사양서", "용도 설명", "SFDA 등록 또는 허가자료(해당 시)", "라벨/사용설명서"],
        "notes": "의료 목적 표시, 인체 적용 여부, 의료기기 등급, 개인/상업 수입 구분에 따라 요구사항이 달라질 수 있습니다.",
        "source_name": "SFDA product classification guidance",
        "source_url": SFDA_CLASSIFICATION_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '3304%'",
        "type": "sfda_cosmetics_clearance",
        "name": "사우디 화장품 SFDA 성분·라벨 확인",
        "agency": "Saudi Food and Drug Authority / ZATCA",
        "basis": "SFDA cosmetics controls and FASEH clearance",
        "summary": "화장품은 SFDA 제품분류·등록, 성분 제한, ISO/GMP, 라벨, FASEH 통관 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "전성분표", "제품 라벨", "제품 정보파일 또는 안전성 자료(해당 시)", "SFDA 등록자료(해당 시)"],
        "notes": "의약품성 효능 표현, 금지·제한 성분, 할랄/동물성 원료 포함 여부에 따라 추가 확인이 필요할 수 있습니다.",
        "source_name": "Saudi Food and Drug Authority FASEH",
        "source_url": SFDA_FASEH_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '25%' or destination_hs_code like '27%' or destination_hs_code like '28%' or destination_hs_code like '29%' or destination_hs_code like '32%' or destination_hs_code like '33%' or destination_hs_code like '34%' or destination_hs_code like '35%' or destination_hs_code like '38%' or destination_hs_code like '39%' or destination_hs_code like '40%' or destination_hs_code like '68%' or destination_hs_code like '72%' or destination_hs_code like '73%' or destination_hs_code like '84%' or destination_hs_code like '85%' or destination_hs_code like '87%' or destination_hs_code like '90%' or destination_hs_code like '94%' or destination_hs_code like '95%'",
        "type": "saber_product_conformity",
        "name": "사우디 SABER 제품적합성 확인",
        "agency": "Saudi Standards Metrology and Quality Organization / ZATCA",
        "basis": "SABER platform product and shipment conformity certificates",
        "summary": "전기전자, 기계, 소비재, 장난감, 화학제품, 건축자재, 차량·부품 등은 SABER 제품등록, PCoC/SCoC, 기술규정·표준 적합성 확인 대상 가능성이 있습니다.",
        "documents": ["제품 사양서", "모델명/규격", "시험성적서", "적합성 인증서(해당 시)", "SABER PCoC/SCoC 자료(해당 시)", "라벨/마킹 자료"],
        "notes": "규제제품 여부는 HS뿐 아니라 제품명, 모델, 용도, 전기정격, SASO 기술규정과 SABER 분류에 따라 달라질 수 있습니다.",
        "source_name": "SASO SABER platform",
        "source_url": SABER_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '8517%' or destination_hs_code like '8525%' or destination_hs_code like '8526%' or destination_hs_code like '8527%' or destination_hs_code like '8528%' or destination_hs_code like '8543%'",
        "type": "cst_telecom_radio_equipment",
        "name": "사우디 통신·무선기기 CST 확인",
        "agency": "Communications, Space and Technology Commission / ZATCA",
        "basis": "Saudi telecom and radio equipment compliance controls",
        "summary": "통신장비, 무선기기, Wi-Fi/Bluetooth/RFID 기능 제품은 CST 형식승인, 주파수, SABER/적합성, 수입허가 확인 대상 가능성이 있습니다.",
        "documents": ["제품 사양서", "브랜드/모델 정보", "무선 모듈/주파수 정보", "시험성적서", "CST 승인 또는 적합성자료(해당 시)"],
        "notes": "무선 기능, 주파수 대역, 통신망 접속 여부, 상업 판매 여부에 따라 요구사항이 달라질 수 있습니다.",
        "source_name": "Communications Space and Technology Commission Saudi Arabia",
        "source_url": CST_SOURCE_URL,
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
  'SAU',
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
  encode(digest('SAU|' || heading.destination_hs_code || '|' || {sql(requirement["type"])} || '|' || {sql(requirement["name"])} || '|' || {sql(SOURCE_VERSION)}, 'sha256'), 'hex')
from (
  select distinct left(destination_hs_code, 4) as destination_hs_code
  from public.export_destination_tariff_rates
  where country_code = 'SAU'
    and source_version = 'customs-country-tariff-20251231:SAU'
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

    output = f"""-- Generated by scripts/generate_saudi_import_data_seed.py

begin;

delete from public.export_destination_internal_taxes
where country_code = 'SAU'
  and source_version like '{SOURCE_VERSION}%';

delete from public.export_destination_import_requirements
where country_code = 'SAU'
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
  'SAU',
  tariff.destination_hs_code,
  'vat',
  '수입 VAT',
  '15%',
  '사우디 수입 VAT 표준세율 후보',
  'ZATCA 안내 기준 수입물품에는 VAT가 적용될 수 있습니다. 영세율·면세, 선택적 소비세, 통관수수료와 품목별 예외는 별도 확인이 필요합니다.',
  'ZATCA VAT',
  {sql(ZATCA_VAT_SOURCE_URL)},
  {sql(SOURCE_VERSION + ':vat')},
  date '2026-01-01',
  null::date,
  null::timestamptz,
  now(),
  'staged'::public.legal_record_status,
  encode(digest('SAU|vat|' || tariff.destination_hs_code || '|' || {sql(SOURCE_VERSION)}, 'sha256'), 'hex')
from (
  select distinct destination_hs_code
  from public.export_destination_tariff_rates
  where country_code = 'SAU'
    and source_version = 'customs-country-tariff-20251231:SAU'
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
