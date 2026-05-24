#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "supabase/seed/generated/norway_import_data_seed.sql"

SOURCE_VERSION = "norway-import-data-20260524"
NORWAY_VAT_SOURCE_URL = "https://www.toll.no/en/online-shopping/calculation-norwegian-vat"
NORWAY_IMPORT_GUIDE_URL = "https://www.toll.no/en/corporate/import/import-guide-for-beginners"
NFSA_FOOD_SOURCE_URL = "https://www.mattilsynet.no/en/food-and-beverages/commercial-import-of-foodstuff-to-norway"
NFSA_ANIMAL_SOURCE_URL = "https://www.mattilsynet.no/en/food-and-beverages/commercial-import-of-foodstuff-to-norway/control-of-products-of-animal-origin-from-third-countries?noJS=true"
DMP_MEDICINE_SOURCE_URL = "https://www.dmp.no/en/medicinesfromabroad"
DMP_MEDICAL_DEVICE_SOURCE_URL = "https://www.dmp.no/en/medical-devices/sale-import-and-distribution"
DMP_DISINFECTANT_SOURCE_URL = "https://www.dmp.no/en/approval-of-medicines/disinfectans---approval-manufacturing-and-import"
NKOM_IMPORT_SOURCE_URL = "https://nkom.no/frekvenser-og-elektronisk-utstyr/import"

REQUIREMENTS = [
    {
        "condition": "destination_hs_code like '01%' or destination_hs_code like '02%' or destination_hs_code like '03%' or destination_hs_code like '04%' or destination_hs_code like '05%' or destination_hs_code like '41%' or destination_hs_code like '42%' or destination_hs_code like '43%' or destination_hs_code like '51%'",
        "type": "animal_origin_border_control",
        "name": "노르웨이 동물·동물성 제품 국경검사 확인",
        "agency": "Norwegian Food Safety Authority / Norwegian Customs",
        "basis": "Norwegian control of products of animal origin from third countries",
        "summary": "동물, 동물성 제품, 수산물, 가죽·모피·양모 등은 국경검사소 검사, TRACES NT 사전신고, 위생증명서, 원산국·시설 승인 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "B/L 또는 AWB", "포장명세서", "동물종/원재료 정보", "위생증명서(해당 시)", "TRACES NT 또는 국경검사 자료(해당 시)"],
        "notes": "EU/EEA 또는 제3국 출발 여부, 동물종, 식용/비식품용, 가공상태에 따라 국경검사와 증명서 조건이 달라질 수 있습니다.",
        "source_name": "NFSA products of animal origin from third countries",
        "source_url": NFSA_ANIMAL_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '06%' or destination_hs_code like '07%' or destination_hs_code like '08%' or destination_hs_code like '09%' or destination_hs_code like '10%' or destination_hs_code like '11%' or destination_hs_code like '12%' or destination_hs_code like '14%' or destination_hs_code like '15%' or destination_hs_code like '16%' or destination_hs_code like '17%' or destination_hs_code like '18%' or destination_hs_code like '19%' or destination_hs_code like '20%' or destination_hs_code like '21%' or destination_hs_code like '22%' or destination_hs_code like '23%'",
        "type": "food_plant_import_control",
        "name": "노르웨이 식품·농산물·식물성 제품 확인",
        "agency": "Norwegian Food Safety Authority / Norwegian Customs",
        "basis": "Norwegian commercial import of foodstuff and EEA-harmonised food/veterinary legislation",
        "summary": "식품, 음료, 농산물, 식물성 원료, 사료류는 식품안전, 라벨, 사전신고, 위험제품 국경검사, 식물검역 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "성분표", "제품 라벨", "식물검역증명서(해당 시)", "사전신고 또는 식품안전 자료(해당 시)"],
        "notes": "수입자는 노르웨이 식품규정 적합성과 라벨·성분 적합성을 확인해야 하며, EEA/제3국 구분과 위험제품 여부에 따라 절차가 달라질 수 있습니다.",
        "source_name": "NFSA commercial import of foodstuff",
        "source_url": NFSA_FOOD_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '30%'",
        "type": "medicine_import_control",
        "name": "노르웨이 의약품 수입·판매 허가 확인",
        "agency": "Norwegian Medical Products Agency / Norwegian Customs",
        "basis": "Norwegian medicinal product import and personal-use import rules",
        "summary": "의약품, 동물용 의약품, 마약성·도핑 관련 성분은 수입자 자격, 도매·판매 허가, 개인수입 제한, 제품 승인 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "제품 사양서", "성분표", "처방 또는 허가자료(해당 시)", "라벨/사용설명서"],
        "notes": "상업수입/개인수입, 인체/동물용, 마약성·도핑 성분, EEA 내 승인 여부에 따라 절차가 달라질 수 있습니다.",
        "source_name": "Norwegian Medical Products Agency medicines from abroad",
        "source_url": DMP_MEDICINE_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '9018%' or destination_hs_code like '9021%' or destination_hs_code like '9022%'",
        "type": "medical_device_import_control",
        "name": "노르웨이 의료기기 수입자 의무 확인",
        "agency": "Norwegian Medical Products Agency / Norwegian Customs",
        "basis": "Norwegian medical device supply, import and distribution obligations",
        "summary": "의료기기, 체외진단기기, 관련 부품은 제조자·수입자·유통자 책임, CE 적합성, 등록·감시 의무 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "제품 사양서", "적합성 선언서", "CE/인증 자료", "수입자·유통자 정보"],
        "notes": "의료기기 등급, IVD 여부, 판매용/개인용, EEA 규정 적용 여부에 따라 요구사항이 달라질 수 있습니다.",
        "source_name": "Norwegian Medical Products Agency medical devices import and distribution",
        "source_url": DMP_MEDICAL_DEVICE_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '3303%' or destination_hs_code like '3304%' or destination_hs_code like '3305%' or destination_hs_code like '3306%' or destination_hs_code like '3307%' or destination_hs_code like '3401%' or destination_hs_code like '3402%' or destination_hs_code like '3808%'",
        "type": "cosmetics_disinfectant_consumer_control",
        "name": "노르웨이 화장품·소독제·소비재 안전 확인",
        "agency": "Norwegian Food Safety Authority / Norwegian Medical Products Agency / Norwegian Customs",
        "basis": "Norwegian cosmetics, consumer goods and disinfectant classification controls",
        "summary": "화장품, 퍼스널케어, 세정제, 소독제류는 성분, 라벨, 제품분류, 의약품·의료기기·살생물 제품 해당 여부 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "전성분표", "제품 라벨", "제품 사양서", "안전성 또는 분류자료(해당 시)"],
        "notes": "치료·상처치료·살균 효능 표시, 제한성분, EEA 화장품 규정, 살생물 제품 분류에 따라 관할과 요구자료가 달라질 수 있습니다.",
        "source_name": "Norwegian Medical Products Agency disinfectants approval manufacturing and import",
        "source_url": DMP_DISINFECTANT_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '28%' or destination_hs_code like '29%' or destination_hs_code like '32%' or destination_hs_code like '34%' or destination_hs_code like '35%' or destination_hs_code like '38%' or destination_hs_code like '39%' or destination_hs_code like '40%'",
        "type": "chemical_hazardous_product_control",
        "name": "노르웨이 화학물질·위험제품 확인",
        "agency": "competent Norwegian authority / Norwegian Customs",
        "basis": "Norwegian import guide and restricted/prohibited goods controls",
        "summary": "화학물질, 혼합물, 위험물, 세정제, 고무·플라스틱 원료는 MSDS, 위험물 분류, 제한물질, 수입신고·관할기관 승인 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "MSDS", "성분표", "위험물 분류자료", "라벨/표시 자료"],
        "notes": "성분, 농도, UN 번호, 용도, 소비자용/산업용, 살생물·의약품성 표시 여부에 따라 요구사항이 달라질 수 있습니다.",
        "source_name": "Norwegian Customs import guide",
        "source_url": NORWAY_IMPORT_GUIDE_URL,
    },
    {
        "condition": "destination_hs_code like '8517%' or destination_hs_code like '8525%' or destination_hs_code like '8526%' or destination_hs_code like '8527%' or destination_hs_code like '8528%' or destination_hs_code like '8543%' or destination_hs_code like '9026%' or destination_hs_code like '9030%'",
        "type": "radio_telecom_equipment_control",
        "name": "노르웨이 통신·무선기기 등록·적합성 확인",
        "agency": "Norwegian Communications Authority / Norwegian Customs",
        "basis": "Nkom import and sale of radio, teleterminal and network equipment",
        "summary": "통신장비, 무선기기, 송신기, 네트워크 장비는 수입자·판매자 등록, 기술기준 적합성, 주파수, CE/문서 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "제품 사양서", "무선/통신 기능 설명", "시험성적서", "적합성 선언서(해당 시)"],
        "notes": "주파수 대역, 송신출력, 판매용/개인용, EEA 적합성, 노르웨이 주파수 사용 가능 여부에 따라 절차가 달라질 수 있습니다.",
        "source_name": "Nkom import and sale of equipment",
        "source_url": NKOM_IMPORT_SOURCE_URL,
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
  'NOR',
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
  encode(digest('NOR|' || heading.destination_hs_code || '|' || {sql(requirement["type"])} || '|' || {sql(requirement["name"])} || '|' || {sql(SOURCE_VERSION)}, 'sha256'), 'hex')
from (
  select distinct left(destination_hs_code, 4) as destination_hs_code
  from public.export_destination_tariff_rates
  where country_code = 'NOR'
    and source_version = 'customs-country-tariff-20251231:NOR'
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

    output = f"""-- Generated by scripts/generate_norway_import_data_seed.py

begin;

delete from public.export_destination_internal_taxes
where country_code = 'NOR'
  and source_version like '{SOURCE_VERSION}%';

delete from public.export_destination_import_requirements
where country_code = 'NOR'
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
  'NOR',
  tariff.destination_hs_code,
  'vat',
  '수입 VAT',
  '25%',
  '노르웨이 수입 VAT 표준세율 후보',
  'Norwegian Customs 안내 기준 수입 시 노르웨이 VAT가 계산되며 표준세율은 25%입니다. 식품 15%, 면세, 특별세, 품목별 예외는 별도 확인이 필요합니다.',
  'Norwegian Customs calculation of Norwegian VAT',
  {sql(NORWAY_VAT_SOURCE_URL)},
  {sql(SOURCE_VERSION + ':vat')},
  date '2026-01-01',
  null::date,
  null::timestamptz,
  now(),
  'staged'::public.legal_record_status,
  encode(digest('NOR|vat|' || tariff.destination_hs_code || '|' || {sql(SOURCE_VERSION)}, 'sha256'), 'hex')
from (
  select distinct destination_hs_code
  from public.export_destination_tariff_rates
  where country_code = 'NOR'
    and source_version = 'customs-country-tariff-20251231:NOR'
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
