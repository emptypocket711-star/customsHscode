#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "supabase/seed/generated/switzerland_import_data_seed.sql"

SOURCE_VERSION = "switzerland-import-data-20260524"
BAZG_VAT_SOURCE_URL = "https://www.bazg.admin.ch/en/import-taxes-vat-on-imported-goods"
FSVO_THIRD_COUNTRY_IMPORT_URL = "https://www.blv.admin.ch/blv/it/home/import-und-export/import/importe-aus-drittstaaten.html"
FSVO_FOOD_IMPORT_URL = "https://www.blv.admin.ch/blv/de/home/import-und-export/import/importe-aus-der-eu/lebensmittel-und-gebrauchsgegenstaende.html"
FSVO_GMO_URL = "https://www.blv.admin.ch/blv/en/home/lebensmittel-und-ernaehrung/rechts-und-vollzugsgrundlagen/bewilligung-und-meldung/gentechnisch-veraenderte-organismen-gvo.html"
SWISSMEDIC_LICENSING_URL = "https://www.swissmedic.ch/swissmedic/en/home/humanarzneimittel/bewilligungen_zertifikate.html"
SWISSMEDIC_MEDICAL_DEVICE_URL = "https://www.swissmedic.ch/swissmedic/en/home/medical-devices/market-access/dispensing---imports.html"
SWISSDAMED_URL = "https://www.swissmedic.ch/content/swissmedic/en/home/medizinprodukte/medizinprodukte-datenbank.html"
BAKOM_URL = "https://www.bakom.admin.ch/"
BAZG_CUSTOMS_URL = "https://www.bazg.admin.ch/"

REQUIREMENTS = [
    {
        "condition": "destination_hs_code like '01%' or destination_hs_code like '02%' or destination_hs_code like '03%' or destination_hs_code like '04%' or destination_hs_code like '05%' or destination_hs_code like '41%' or destination_hs_code like '42%' or destination_hs_code like '43%' or destination_hs_code like '51%'",
        "type": "animal_origin_veterinary_control",
        "name": "스위스 동물·동물성 제품 검역 확인",
        "agency": "Federal Food Safety and Veterinary Office / Federal Office for Customs and Border Security",
        "basis": "Swiss import rules for animals and products of animal origin from third countries",
        "summary": "동물, 동물성 제품, 수산물, 가죽·모피·양모 등은 수의검역, 국경검사, 원산국·시설 승인, 위생증명서 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "B/L 또는 AWB", "포장명세서", "동물종/원재료 정보", "위생증명서(해당 시)", "수입허가 또는 국경검사 자료(해당 시)"],
        "notes": "동물종, 식용/비식품용, 원산국, EU/제3국 구분, 가공상태에 따라 검사 및 증명서 조건이 달라질 수 있습니다.",
        "source_name": "FSVO imports from third countries",
        "source_url": FSVO_THIRD_COUNTRY_IMPORT_URL,
    },
    {
        "condition": "destination_hs_code like '06%' or destination_hs_code like '07%' or destination_hs_code like '08%' or destination_hs_code like '09%' or destination_hs_code like '10%' or destination_hs_code like '11%' or destination_hs_code like '12%' or destination_hs_code like '14%' or destination_hs_code like '15%' or destination_hs_code like '16%' or destination_hs_code like '17%' or destination_hs_code like '18%' or destination_hs_code like '19%' or destination_hs_code like '20%' or destination_hs_code like '21%' or destination_hs_code like '22%' or destination_hs_code like '23%'",
        "type": "food_plant_import_control",
        "name": "스위스 식품·농산물·식물성 제품 확인",
        "agency": "Federal Food Safety and Veterinary Office / Federal Office for Customs and Border Security",
        "basis": "Swiss food, plant and consumer-product import controls",
        "summary": "식품, 농산물, 식물성 원료, 음료, 사료류는 식품안전, 강화 국경검사, 식물검역, GMO 승인·표시 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "성분표", "제품 라벨", "식물검역증명서(해당 시)", "식품안전 또는 GMO 승인자료(해당 시)"],
        "notes": "식품/사료/종자/재식용 여부, GMO 여부, 원산국, 강화검사 대상 여부에 따라 요구자료가 달라질 수 있습니다.",
        "source_name": "FSVO food and consumer goods imports",
        "source_url": FSVO_FOOD_IMPORT_URL,
    },
    {
        "condition": "destination_hs_code like '30%'",
        "type": "medicinal_product_import_licence",
        "name": "스위스 의약품 수입허가 확인",
        "agency": "Swissmedic / Federal Office for Customs and Border Security",
        "basis": "Swissmedic licensing for manufacture, wholesale, import, export and trade in medicinal products",
        "summary": "의약품, 동물용 의약품, 생물학적 제제, 마약성 또는 도핑 관련 성분은 Swissmedic 허가, 수입자 자격, 제품 승인 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "제품 사양서", "성분표", "제품 승인 또는 수입허가 자료(해당 시)", "라벨/사용설명서"],
        "notes": "상업수입/개인수입, 마약성·도핑성분 여부, 인체/동물용, 승인제품 여부에 따라 절차가 달라질 수 있습니다.",
        "source_name": "Swissmedic licensing",
        "source_url": SWISSMEDIC_LICENSING_URL,
    },
    {
        "condition": "destination_hs_code like '9018%' or destination_hs_code like '9021%' or destination_hs_code like '9022%'",
        "type": "medical_device_market_access",
        "name": "스위스 의료기기 시장진입·수입자 의무 확인",
        "agency": "Swissmedic / Federal Office for Customs and Border Security",
        "basis": "Swiss medical device import, sale, distribution and swissdamed registration framework",
        "summary": "의료기기, 체외진단기기, 관련 부품은 CE 적합성, Swiss authorised representative, 수입자 의무, swissdamed 등록 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "제품 사양서", "적합성 선언서", "CE/인증 자료", "Swissmedic 또는 swissdamed 자료(해당 시)"],
        "notes": "의료기기 등급, IVD 여부, 스위스 대리인, EU MDR/IVDR 전환조건, 판매용/개인용 여부에 따라 요구사항이 달라질 수 있습니다.",
        "source_name": "Swissmedic import sale and distribution",
        "source_url": SWISSMEDIC_MEDICAL_DEVICE_URL,
    },
    {
        "condition": "destination_hs_code like '3303%' or destination_hs_code like '3304%' or destination_hs_code like '3305%' or destination_hs_code like '3306%' or destination_hs_code like '3307%' or destination_hs_code like '3401%' or destination_hs_code like '3402%'",
        "type": "cosmetics_consumer_goods_control",
        "name": "스위스 화장품·소비재 안전·표시 확인",
        "agency": "Federal Food Safety and Veterinary Office / cantonal enforcement authority",
        "basis": "Swiss consumer goods and foodstuffs framework for products placed on the market",
        "summary": "화장품, 퍼스널케어, 세정제류는 성분, 안전성, 표시, 제품 책임자, 제한성분 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "전성분표", "제품 라벨", "제품 사양서", "안전성 자료(해당 시)"],
        "notes": "의약품성 효능, 살균·소독 표시, 제한성분, 언어 표시, EU/스위스 화장품 규정 연계 여부에 따라 추가 확인이 필요할 수 있습니다.",
        "source_name": "FSVO food and consumer goods imports",
        "source_url": FSVO_FOOD_IMPORT_URL,
    },
    {
        "condition": "destination_hs_code like '28%' or destination_hs_code like '29%' or destination_hs_code like '32%' or destination_hs_code like '34%' or destination_hs_code like '35%' or destination_hs_code like '38%' or destination_hs_code like '39%' or destination_hs_code like '40%'",
        "type": "chemical_hazardous_product_control",
        "name": "스위스 화학물질·위험제품 확인",
        "agency": "competent Swiss federal or cantonal authority / Federal Office for Customs and Border Security",
        "basis": "Swiss chemicals, dangerous goods and market surveillance controls",
        "summary": "화학물질, 혼합물, 세정제, 위험물, 고무·플라스틱 원료는 MSDS, CLP/GHS 분류, 제한물질, 시장감시 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "MSDS", "성분표", "위험물 분류자료", "라벨/표시 자료"],
        "notes": "성분, 농도, UN 번호, 용도, 소비자용/산업용, 살생물·의약품성 표시 여부에 따라 관할과 요구자료가 달라질 수 있습니다.",
        "source_name": "Federal Office for Customs and Border Security",
        "source_url": BAZG_CUSTOMS_URL,
    },
    {
        "condition": "destination_hs_code like '8517%' or destination_hs_code like '8525%' or destination_hs_code like '8526%' or destination_hs_code like '8527%' or destination_hs_code like '8528%' or destination_hs_code like '8543%' or destination_hs_code like '9026%' or destination_hs_code like '9030%'",
        "type": "radio_telecom_equipment_control",
        "name": "스위스 통신·무선기기 적합성 확인",
        "agency": "Federal Office of Communications / Federal Office for Customs and Border Security",
        "basis": "Swiss radio and telecommunications equipment conformity controls",
        "summary": "통신장비, 무선기기, 송신기, 주파수 사용 장비는 기술기준 적합성, 주파수, 인증·표시, 수입자 책임 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "제품 사양서", "무선/통신 기능 설명", "시험성적서", "적합성 선언서(해당 시)"],
        "notes": "주파수 대역, 송신출력, 판매용/개인용, EU CE 적합성, 스위스 주파수 사용 가능 여부에 따라 절차가 달라질 수 있습니다.",
        "source_name": "Federal Office of Communications",
        "source_url": BAKOM_URL,
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
  'CHE',
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
  encode(digest('CHE|' || heading.destination_hs_code || '|' || {sql(requirement["type"])} || '|' || {sql(requirement["name"])} || '|' || {sql(SOURCE_VERSION)}, 'sha256'), 'hex')
from (
  select distinct left(destination_hs_code, 4) as destination_hs_code
  from public.export_destination_tariff_rates
  where country_code = 'CHE'
    and source_version = 'customs-country-tariff-20251231:CHE'
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

    output = f"""-- Generated by scripts/generate_switzerland_import_data_seed.py

begin;

delete from public.export_destination_internal_taxes
where country_code = 'CHE'
  and source_version like '{SOURCE_VERSION}%';

delete from public.export_destination_import_requirements
where country_code = 'CHE'
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
  'CHE',
  tariff.destination_hs_code,
  'vat',
  '수입 VAT',
  '8.1%',
  '스위스 수입 VAT 표준세율 후보',
  'Swiss Federal Office for Customs and Border Security 안내 기준 imported goods에는 원칙적으로 수입 VAT가 부과되며 표준세율은 8.1%입니다. 필수품 2.6% 감면세율, 면세, 특별세와 품목별 예외는 별도 확인이 필요합니다.',
  'Swiss Federal Office for Customs and Border Security import VAT',
  {sql(BAZG_VAT_SOURCE_URL)},
  {sql(SOURCE_VERSION + ':vat')},
  date '2026-01-01',
  null::date,
  null::timestamptz,
  now(),
  'staged'::public.legal_record_status,
  encode(digest('CHE|vat|' || tariff.destination_hs_code || '|' || {sql(SOURCE_VERSION)}, 'sha256'), 'hex')
from (
  select distinct destination_hs_code
  from public.export_destination_tariff_rates
  where country_code = 'CHE'
    and source_version = 'customs-country-tariff-20251231:CHE'
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
