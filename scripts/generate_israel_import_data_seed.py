#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "supabase/seed/generated/israel_import_data_seed.sql"

SOURCE_VERSION = "israel-import-data-20260524"
CUSTOMS_TARIFF_SOURCE_URL = "https://www.gov.il/en/service/customs-tariff"
VAT_SOURCE_URL = "https://www.gov.il/BlobFolder/policy/bileteral-forms-nursing-institutions/he/obligatory_deduction_LTCF_nepali.pdf"
MOH_ANIMAL_FOOD_SOURCE_URL = "https://www.gov.il/en/service/animal-derived-food-product-importation"
MOH_PLANT_FOOD_SOURCE_URL = "https://www.gov.il/en/service/release-import-status-non-animal-derived-food-product"
MOH_DRUG_SOURCE_URL = "https://www.gov.il/en/service/application-to-import-registered-drug-products"
MOH_PHARMA_RAW_SOURCE_URL = "https://www.gov.il/en/service/issuance-import-permits-raw-materials-medicines-prodution"
MOH_COSMETICS_SOURCE_URL = "https://www.gov.il/en/service/cosmetics-health-data"
MOH_MEDICAL_DEVICE_SOURCE_URL = "https://www.gov.il/en/service/issuance-import-permits-raw-materials-medicines-prodution"
MOC_EQUIPMENT_SOURCE_URL = "https://www.gov.il/en/service/approval_of_wireless_equipment_imported"
MOC_TYPE_APPROVAL_SOURCE_URL = "https://www.gov.il/en/service/request-type-approval-wireless-device-new"

REQUIREMENTS = [
    {
        "condition": "destination_hs_code like '01%' or destination_hs_code like '02%' or destination_hs_code like '03%' or destination_hs_code like '04%' or destination_hs_code like '05%' or destination_hs_code like '41%' or destination_hs_code like '42%' or destination_hs_code like '43%' or destination_hs_code like '51%'",
        "type": "animal_origin_sag_control",
        "name": "이스라엘 동물·동물성 제품 Ministry of Health 검역 확인",
        "agency": "Ministry of Health / Ministry of Agriculture / Israel Tax Authority",
        "basis": "Ministry of Health import requirements for animals, animal products and animal-origin subproducts",
        "summary": "동물, 축산물, 수산물, 동물성 원료, 가죽·모피·양모 등은 Ministry of Health 위생요건, 시장개방, 시설승인, 위생증명서, 수입허가 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "B/L 또는 AWB", "포장명세서", "동물종/원재료 정보", "위생증명서(해당 시)", "Ministry of Health 수입허가 또는 승인자료(해당 시)"],
        "notes": "동물종, 원산국, 생산시설 승인, 상업용/샘플, 목재포장재 NIMF 15 적용 여부에 따라 요구사항이 달라질 수 있습니다.",
        "source_name": "Ministry of Health animal-derived food import permit",
        "source_url": MOH_ANIMAL_FOOD_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '06%' or destination_hs_code like '07%' or destination_hs_code like '08%' or destination_hs_code like '09%' or destination_hs_code like '10%' or destination_hs_code like '11%' or destination_hs_code like '12%' or destination_hs_code like '14%' or destination_hs_code like '15%' or destination_hs_code like '16%' or destination_hs_code like '17%' or destination_hs_code like '18%' or destination_hs_code like '19%' or destination_hs_code like '20%' or destination_hs_code like '21%' or destination_hs_code like '22%' or destination_hs_code like '23%'",
        "type": "food_plant_sag_control",
        "name": "이스라엘 식품·농산물·식물검역 Ministry of Health 확인",
        "agency": "Ministry of Health / Ministry of Agriculture / Israel Tax Authority",
        "basis": "Ministry of Health phytosanitary and agricultural import controls",
        "summary": "식품, 농산물, 식물, 종자, 곡물, 음료, 사료류는 Ministry of Health 식물검역, 위생·식품요건, 목재포장재 NIMF 15, 수입요건 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "성분표", "제품 라벨", "식물검역증명서(해당 시)", "Ministry of Health 수입요건 확인자료(해당 시)"],
        "notes": "식물성 원료, 가공상태, 재식용 여부, 원산국, 포장재, 식품/사료 구분에 따라 요구자료가 달라질 수 있습니다.",
        "source_name": "Ministry of Health plant-based food release",
        "source_url": MOH_PLANT_FOOD_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '30%'",
        "type": "pharmaceutical_sanitary_registration",
        "name": "이스라엘 의약품 Ministry of Health 수입허가 확인",
        "agency": "Ministry of Health / Israel Tax Authority",
        "basis": "Ministry of Health sanitary registration for imported or locally manufactured pharmaceutical products",
        "summary": "의약품, 원료의약품, 생물학적 제제는 이스라엘 내 유통·사용 전 Ministry of Health 수입허가/등록, 품질·안전성·효능 심사, 수입자 자격 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "제품 사양서", "성분표", "Ministry of Health 등록 또는 허가자료(해당 시)", "라벨/사용설명서"],
        "notes": "제품 분류, 처방/일반의약품, 생물학적 제제, 원료/완제품, 등록제품 여부에 따라 절차가 달라질 수 있습니다.",
        "source_name": "Ministry of Health registered drug import permit",
        "source_url": MOH_DRUG_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '9018%' or destination_hs_code like '9021%' or destination_hs_code like '9022%'",
        "type": "medical_device_customs_destination_certificate",
        "name": "이스라엘 의료기기 Ministry of Health 확인",
        "agency": "Ministry of Health / Israel Tax Authority",
        "basis": "Ministry of Health Certificado de Destinacion Aduanera for medical devices and IVDs",
        "summary": "의료기기, 체외진단기기, 관련 부품은 Ministry of Health 수입허가/등록, 목적지 시설, 등록·감시 요건 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "제품 사양서", "의료기기 분류자료", "CDA 또는 Ministry of Health 승인자료(해당 시)", "라벨/사용설명서"],
        "notes": "의료기기/IVD 구분, 위험등급, 목적지 시설, 등록대상 여부, 수입자 자격에 따라 요구사항이 달라질 수 있습니다.",
        "source_name": "Ministry of Health medical devices import",
        "source_url": MOH_MEDICAL_DEVICE_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '3303%' or destination_hs_code like '3304%' or destination_hs_code like '3305%' or destination_hs_code like '3306%' or destination_hs_code like '3307%' or destination_hs_code like '3401%' or destination_hs_code like '3402%' or destination_hs_code like '3808%'",
        "type": "cosmetics_disinfectant_health_control",
        "name": "이스라엘 화장품·위생제품 Ministry of Health 확인",
        "agency": "Ministry of Health / Israel Tax Authority",
        "basis": "Israel health product import controls and product classification",
        "summary": "화장품, 퍼스널케어, 세정제, 소독제류는 Ministry of Health 분류, 성분, 라벨, 수입허가/등록 또는 통관 목적지 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "전성분표", "제품 라벨", "제품 사양서", "Ministry of Health 등록 또는 분류자료(해당 시)"],
        "notes": "치료·살균·소독 효능, 제한성분, 화장품/의약품/살생물 제품 분류, 히브리어/영어 표시 여부에 따라 관할과 요구자료가 달라질 수 있습니다.",
        "source_name": "Instituto de Salud Publica de Israel",
        "source_url": MOH_COSMETICS_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '28%' or destination_hs_code like '29%' or destination_hs_code like '32%' or destination_hs_code like '34%' or destination_hs_code like '35%' or destination_hs_code like '38%' or destination_hs_code like '39%' or destination_hs_code like '40%'",
        "type": "chemical_hazardous_product_control",
        "name": "이스라엘 화학물질·위험제품 확인",
        "agency": "competent Israeli authority / Israel Tax Authority",
        "basis": "Israel import controls for restricted, dangerous and regulated goods",
        "summary": "화학물질, 혼합물, 위험물, 세정제, 고무·플라스틱 원료는 MSDS, 위험물 분류, 제한물질, 수입신고·관할기관 승인 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "MSDS", "성분표", "위험물 분류자료", "라벨/표시 자료"],
        "notes": "성분, 농도, UN 번호, 용도, 소비자용/산업용, 살생물·농약·의약품성 표시 여부에 따라 요구사항이 달라질 수 있습니다.",
        "source_name": "Israel Tax Authority",
        "source_url": CUSTOMS_TARIFF_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '8517%' or destination_hs_code like '8525%' or destination_hs_code like '8526%' or destination_hs_code like '8527%' or destination_hs_code like '8528%' or destination_hs_code like '8543%' or destination_hs_code like '9026%' or destination_hs_code like '9030%'",
        "type": "telecom_radio_equipment_certification",
        "name": "이스라엘 통신·무선기기 Ministry of Communications 승인 확인",
        "agency": "Ministry of Communications / Israel Tax Authority",
        "basis": "Ministry of Communications certification of telecommunications equipment and short-range radio equipment",
        "summary": "통신장비, 무선기기, RFID, IoT, 차량 레이더, 단거리 무선장비는 Ministry of Communications 승인/형식승인, 주파수, 판매 가능 여부 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "제품 사양서", "무선/통신 기능 설명", "시험성적서", "Ministry of Communications 인증 또는 적합성 자료(해당 시)"],
        "notes": "주파수 대역, 송신출력, 이동통신망 접속 여부, 판매용/샘플, 멀티밴드/SAE 등록대상 여부에 따라 절차가 달라질 수 있습니다.",
        "source_name": "Ministry of Communications equipment import approval",
        "source_url": MOC_EQUIPMENT_SOURCE_URL,
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
  'ISR',
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
  encode(digest('ISR|' || heading.destination_hs_code || '|' || {sql(requirement["type"])} || '|' || {sql(requirement["name"])} || '|' || {sql(SOURCE_VERSION)}, 'sha256'), 'hex')
from (
  select distinct left(destination_hs_code, 4) as destination_hs_code
  from public.export_destination_tariff_rates
  where country_code = 'ISR'
    and source_version = 'customs-country-tariff-20251231:ISR'
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

    output = f"""-- Generated by scripts/generate_israel_import_data_seed.py

begin;

delete from public.export_destination_internal_taxes
where country_code = 'ISR'
  and source_version like '{SOURCE_VERSION}%';

delete from public.export_destination_import_requirements
where country_code = 'ISR'
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
  'ISR',
  tariff.destination_hs_code,
  'vat',
  '수입 VAT',
  '18%',
  '이스라엘 수입 VAT 표준세율 후보',
  '이스라엘 VAT 표준세율은 2025년 이후 18% 후보로 표시합니다. 면세, purchase tax, 품목별 예외와 수입 단계 과세표준은 Customs tariff and purchase tax 기준으로 별도 확인이 필요합니다.',
  'Israel VAT guidance',
  {sql(VAT_SOURCE_URL)},
  {sql(SOURCE_VERSION + ':vat')},
  date '2026-01-01',
  null::date,
  null::timestamptz,
  now(),
  'staged'::public.legal_record_status,
  encode(digest('ISR|vat|' || tariff.destination_hs_code || '|' || {sql(SOURCE_VERSION)}, 'sha256'), 'hex')
from (
  select distinct destination_hs_code
  from public.export_destination_tariff_rates
  where country_code = 'ISR'
    and source_version = 'customs-country-tariff-20251231:ISR'
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
