#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "supabase/seed/generated/iceland_import_data_seed.sql"

SOURCE_VERSION = "iceland-import-data-20260524"
ICELAND_VAT_SOURCE_URL = "https://www.skatturinn.is/english/individuals/key-rates-and-amounts/2026/"
ICELAND_CUSTOMS_IMPORT_URL = "https://www.skatturinn.is/english/companies/customs-matters/importing-to-iceland/"
MAST_PLANT_SOURCE_URL = "https://www.mast.is/en/import-export/import-of-plants"
MAST_ANIMAL_SOURCE_URL = "https://www.mast.is/en/import-export/import-of-animal-products"
IMA_MEDICINE_PERSONAL_URL = "https://www.ima.is/licences/medicines-in-luggage-and-postal-shipments/"
IMA_MEDICINE_LICENSE_URL = "https://www.ima.is/regulated_entities/wholesalers-and-distributors/licenses-for-import-and-wholesale-distribution-of-medicinal-products/"
IMA_MEDICAL_DEVICE_URL = "https://www.ima.is/medical-devices/about-medical-devices/"
IMA_MEDICAL_DEVICE_LANGUAGE_URL = "https://www.ima.is/instructions-for-use/"
FJARSKIPTASTOFA_URL = "https://www.fjarskiptastofa.is/library?itemid=1273e597-011a-40c9-a7da-7410a02bb231"

REQUIREMENTS = [
    {
        "condition": "destination_hs_code like '01%' or destination_hs_code like '02%' or destination_hs_code like '03%' or destination_hs_code like '04%' or destination_hs_code like '05%' or destination_hs_code like '41%' or destination_hs_code like '42%' or destination_hs_code like '43%' or destination_hs_code like '51%'",
        "type": "animal_origin_border_control",
        "name": "아이슬란드 동물·동물성 제품 검역 확인",
        "agency": "Icelandic Food and Veterinary Authority / Iceland Revenue and Customs",
        "basis": "Icelandic import rules for animal products and EEA border control",
        "summary": "동물, 동물성 제품, 수산물, 가죽·모피·양모 등은 국경검사소 검사, EU 승인시설, 위생증명서, 원산국·생산자 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "B/L 또는 AWB", "포장명세서", "동물종/원재료 정보", "위생증명서(해당 시)", "국경검사 또는 수입허가 자료(해당 시)"],
        "notes": "EEA/제3국 출발 여부, 동물종, 식용/비식품용, 가공상태, 아이슬란드 특별조건에 따라 요구사항이 달라질 수 있습니다.",
        "source_name": "MAST import of animal products",
        "source_url": MAST_ANIMAL_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '06%' or destination_hs_code like '07%' or destination_hs_code like '08%' or destination_hs_code like '09%' or destination_hs_code like '10%' or destination_hs_code like '11%' or destination_hs_code like '12%' or destination_hs_code like '14%' or destination_hs_code like '15%' or destination_hs_code like '16%' or destination_hs_code like '17%' or destination_hs_code like '18%' or destination_hs_code like '19%' or destination_hs_code like '20%' or destination_hs_code like '21%' or destination_hs_code like '22%' or destination_hs_code like '23%'",
        "type": "food_plant_import_control",
        "name": "아이슬란드 식품·농산물·식물검역 확인",
        "agency": "Icelandic Food and Veterinary Authority / Iceland Revenue and Customs",
        "basis": "Icelandic plant health, seed quality and food import controls",
        "summary": "식품, 농산물, 식물, 종자, 곡물, 음료, 사료류는 식품안전, 식물검역증명서, 라벨, 수입조건 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "성분표", "제품 라벨", "식물검역증명서(해당 시)", "수입허가 또는 식품안전 자료(해당 시)"],
        "notes": "재식용 여부, 원산국, 식물검역 대상 여부, EEA 식품규정 적용 여부, 사료·GMO 여부에 따라 요구자료가 달라질 수 있습니다.",
        "source_name": "MAST import of plants",
        "source_url": MAST_PLANT_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '30%'",
        "type": "medicine_import_licence",
        "name": "아이슬란드 의약품 수입·도매 허가 확인",
        "agency": "Icelandic Medicines Agency / Iceland Revenue and Customs",
        "basis": "Icelandic licences for import and wholesale distribution of medicinal products",
        "summary": "의약품, 동물용 의약품, 마약성·향정·도핑 관련 성분은 IMA 수입·도매허가, 개인수입 제한, 처방·증빙 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "제품 사양서", "성분표", "처방 또는 허가자료(해당 시)", "라벨/사용설명서"],
        "notes": "상업수입/개인수입, EEA 내외 출발, 마약성·도핑 성분 여부, 승인제품 여부에 따라 절차가 달라질 수 있습니다.",
        "source_name": "IMA import and wholesale distribution licences",
        "source_url": IMA_MEDICINE_LICENSE_URL,
    },
    {
        "condition": "destination_hs_code like '9018%' or destination_hs_code like '9021%' or destination_hs_code like '9022%'",
        "type": "medical_device_import_control",
        "name": "아이슬란드 의료기기 등록·언어 요건 확인",
        "agency": "Icelandic Medicines Agency / Iceland Revenue and Customs",
        "basis": "Icelandic medical device surveillance, registration and instructions-for-use rules",
        "summary": "의료기기, 체외진단기기, 관련 부품은 CE 적합성, 수입자·판매자 등록, 사후감시, 아이슬란드어 사용설명서 요건 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "제품 사양서", "적합성 선언서", "CE/인증 자료", "아이슬란드어 또는 허용 언어 사용설명서"],
        "notes": "기기 등급, 일반소비자용/전문가용, MDR/IVDR 적용 여부, 언어요건 면제 가능성에 따라 요구사항이 달라질 수 있습니다.",
        "source_name": "IMA about medical devices",
        "source_url": IMA_MEDICAL_DEVICE_URL,
    },
    {
        "condition": "destination_hs_code like '3303%' or destination_hs_code like '3304%' or destination_hs_code like '3305%' or destination_hs_code like '3306%' or destination_hs_code like '3307%' or destination_hs_code like '3401%' or destination_hs_code like '3402%' or destination_hs_code like '3808%'",
        "type": "cosmetics_consumer_health_control",
        "name": "아이슬란드 화장품·소비재·소독제 안전 확인",
        "agency": "Icelandic Food and Veterinary Authority / Icelandic Medicines Agency / Iceland Revenue and Customs",
        "basis": "Icelandic EEA-aligned consumer product, cosmetic and medicinal-product classification controls",
        "summary": "화장품, 퍼스널케어, 세정제, 소독제류는 성분, 라벨, 제품분류, 의약품·의료기기·살생물 제품 해당 여부 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "전성분표", "제품 라벨", "제품 사양서", "안전성 또는 분류자료(해당 시)"],
        "notes": "치료·살균·상처치료 효능 표시, 제한성분, EEA 화장품 규정, 아이슬란드어 표시 필요 여부에 따라 관할과 요구자료가 달라질 수 있습니다.",
        "source_name": "Icelandic Medicines Agency",
        "source_url": "https://www.ima.is/",
    },
    {
        "condition": "destination_hs_code like '28%' or destination_hs_code like '29%' or destination_hs_code like '32%' or destination_hs_code like '34%' or destination_hs_code like '35%' or destination_hs_code like '38%' or destination_hs_code like '39%' or destination_hs_code like '40%'",
        "type": "chemical_hazardous_product_control",
        "name": "아이슬란드 화학물질·위험제품 확인",
        "agency": "competent Icelandic authority / Iceland Revenue and Customs",
        "basis": "Icelandic customs import restrictions and EEA-aligned chemical controls",
        "summary": "화학물질, 혼합물, 위험물, 세정제, 고무·플라스틱 원료는 MSDS, 위험물 분류, 제한물질, 수입신고·관할기관 승인 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "MSDS", "성분표", "위험물 분류자료", "라벨/표시 자료"],
        "notes": "성분, 농도, UN 번호, 용도, 소비자용/산업용, 살생물·의약품성 표시 여부에 따라 요구사항이 달라질 수 있습니다.",
        "source_name": "Iceland Revenue and Customs importing to Iceland",
        "source_url": ICELAND_CUSTOMS_IMPORT_URL,
    },
    {
        "condition": "destination_hs_code like '8517%' or destination_hs_code like '8525%' or destination_hs_code like '8526%' or destination_hs_code like '8527%' or destination_hs_code like '8528%' or destination_hs_code like '8543%' or destination_hs_code like '9026%' or destination_hs_code like '9030%'",
        "type": "radio_telecom_equipment_control",
        "name": "아이슬란드 통신·무선기기 허가·적합성 확인",
        "agency": "Icelandic Electronic Communications Office / Iceland Revenue and Customs",
        "basis": "Icelandic radio equipment import and operation licence controls",
        "summary": "통신장비, 무선기기, 송신기, 네트워크 장비는 주파수, 임시 수입·운용 허가, EEA 적합성, 기술문서 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "제품 사양서", "무선/통신 기능 설명", "시험성적서", "허가 또는 적합성 선언서(해당 시)"],
        "notes": "주파수 대역, 송신출력, 판매용/전시·임시사용, EEA 적합성, 아이슬란드 주파수 사용 가능 여부에 따라 절차가 달라질 수 있습니다.",
        "source_name": "Icelandic Electronic Communications Office radio equipment import licence",
        "source_url": FJARSKIPTASTOFA_URL,
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
  'ISL',
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
  encode(digest('ISL|' || heading.destination_hs_code || '|' || {sql(requirement["type"])} || '|' || {sql(requirement["name"])} || '|' || {sql(SOURCE_VERSION)}, 'sha256'), 'hex')
from (
  select distinct left(destination_hs_code, 4) as destination_hs_code
  from public.export_destination_tariff_rates
  where country_code = 'ISL'
    and source_version = 'customs-country-tariff-20251231:ISL'
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

    output = f"""-- Generated by scripts/generate_iceland_import_data_seed.py

begin;

delete from public.export_destination_internal_taxes
where country_code = 'ISL'
  and source_version like '{SOURCE_VERSION}%';

delete from public.export_destination_import_requirements
where country_code = 'ISL'
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
  'ISL',
  tariff.destination_hs_code,
  'vat',
  '수입 VAT',
  '24%',
  '아이슬란드 수입 VAT 표준세율 후보',
  'Skatturinn 2026 key rates 기준 VAT 표준세율은 24%, 감면세율은 11%입니다. 수입물품의 감면세율, 면세, 특별세와 품목별 예외는 별도 확인이 필요합니다.',
  'Skatturinn key rates and amounts 2026',
  {sql(ICELAND_VAT_SOURCE_URL)},
  {sql(SOURCE_VERSION + ':vat')},
  date '2026-01-01',
  null::date,
  null::timestamptz,
  now(),
  'staged'::public.legal_record_status,
  encode(digest('ISL|vat|' || tariff.destination_hs_code || '|' || {sql(SOURCE_VERSION)}, 'sha256'), 'hex')
from (
  select distinct destination_hs_code
  from public.export_destination_tariff_rates
  where country_code = 'ISL'
    and source_version = 'customs-country-tariff-20251231:ISL'
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
