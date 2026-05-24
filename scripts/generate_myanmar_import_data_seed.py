#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "supabase/seed/generated/myanmar_import_data_seed.sql"

SOURCE_VERSION = "myanmar-import-data-20260523"
MYANMAR_TRADE_PORTAL_IMPORT_GUIDE_URL = "https://www.myanmartradeportal.gov.mm/en/guide-to-import"
MYANMAR_TRADE_PORTAL_COMMODITY_SOURCE_URL = "https://myanmartradeportal.gov.mm/en/commodity-search"
TRADENET_SOURCE_URL = "https://www.myanmartradenet.com/"
MACCS_SOURCE_URL = "https://www.maccs.gov.mm/Import"
COMMERCIAL_TAX_LAW_SOURCE_URL = "https://servicetrade.gov.mm/horizontal/law-detail/commercial-tax-law"
FDA_SOURCE_URL = "https://www.fda.gov.mm/"
MOALI_SOURCE_URL = "https://www.moali.gov.mm/"
MOC_SOURCE_URL = "https://www.commerce.gov.mm/"
MOTC_SOURCE_URL = "https://www.motc.gov.mm/"

REQUIREMENTS = [
    {
        "condition": "destination_hs_code like '02%' or destination_hs_code like '03%' or destination_hs_code like '04%' or destination_hs_code like '07%' or destination_hs_code like '08%' or destination_hs_code like '09%' or destination_hs_code like '10%' or destination_hs_code like '11%' or destination_hs_code like '12%' or destination_hs_code like '15%' or destination_hs_code like '16%' or destination_hs_code like '17%' or destination_hs_code like '18%' or destination_hs_code like '19%' or destination_hs_code like '20%' or destination_hs_code like '21%' or destination_hs_code like '22%'",
        "type": "fda_food_import_health_certificate",
        "name": "미얀마 FDA 식품 수입허가·위생증명 확인",
        "agency": "Food and Drug Administration Myanmar / Department of Trade / Myanmar Customs",
        "basis": "Myanmar Trade Portal SPS and Food Import Health Certificate procedures",
        "summary": "식품, 식품원료, 식품첨가물, 음료, 식품접촉 포장재는 FDA 식품 수입위생증명, 수입허가, 라벨, 성분 및 SPS 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "성분표", "제품 라벨", "FDA 식품 수입위생증명 또는 허가자료(해당 시)", "위생증명서 또는 자유판매증명서(해당 시)"],
        "notes": "Myanmar Trade Portal 상품검색의 품목별 authorization requirement와 TradeNet 2.0 수입허가 대상 여부에 따라 조건이 달라질 수 있습니다.",
        "source_name": "Myanmar National Trade Portal guide to import",
        "source_url": MYANMAR_TRADE_PORTAL_IMPORT_GUIDE_URL,
    },
    {
        "condition": "destination_hs_code like '01%' or destination_hs_code like '02%' or destination_hs_code like '03%' or destination_hs_code like '04%' or destination_hs_code like '05%' or destination_hs_code like '41%' or destination_hs_code like '42%' or destination_hs_code like '43%' or destination_hs_code like '51%'",
        "type": "animal_fishery_quarantine",
        "name": "미얀마 동물·수산 검역 및 수입허가 확인",
        "agency": "Ministry of Agriculture, Livestock and Irrigation / Myanmar Customs",
        "basis": "Myanmar SPS import controls for animal, fishery and animal-origin goods",
        "summary": "동물, 축산물, 수산물, 동물성 원료, 가죽, 모피, 양모 등은 수입허가, 위생증명서, 검역검사 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "동물종/원재료 정보", "위생증명서(해당 시)", "수입허가 자료(해당 시)", "처리·가공 증명자료(해당 시)"],
        "notes": "동물종, 어종, 질병상황, 가공상태, 식용/비식품용, Trade Portal 품목별 절차에 따라 요구사항이 달라질 수 있습니다.",
        "source_name": "Myanmar National Trade Portal guide to import",
        "source_url": MYANMAR_TRADE_PORTAL_IMPORT_GUIDE_URL,
    },
    {
        "condition": "destination_hs_code like '06%' or destination_hs_code like '07%' or destination_hs_code like '08%' or destination_hs_code like '10%' or destination_hs_code like '12%' or destination_hs_code like '14%' or destination_hs_code like '44%' or destination_hs_code like '45%' or destination_hs_code like '46%' or destination_hs_code like '94%'",
        "type": "plant_quarantine_seed_permit",
        "name": "미얀마 식물검역·종자허가 확인",
        "agency": "Department of Agriculture / Myanmar Customs",
        "basis": "Myanmar SPS and seed business import controls",
        "summary": "식물, 종자, 곡물, 과실, 식물성 원료, 목재 및 목재포장재는 식물검역증명서, 수입허가, 종자허가, 검역검사, 훈증 또는 처리증명 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "학명/수종 정보", "식물검역증명서(해당 시)", "수입허가 또는 종자허가 자료(해당 시)", "훈증/열처리 증명서(해당 시)"],
        "notes": "금지품목, 제한품목, 원산지, 수종, 가공상태, 식용/비식용에 따라 검역 조건이 달라질 수 있습니다.",
        "source_name": "Myanmar National Trade Portal commodity search",
        "source_url": MYANMAR_TRADE_PORTAL_COMMODITY_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '30%' or destination_hs_code like '3006%' or destination_hs_code like '9018%' or destination_hs_code like '9021%' or destination_hs_code like '9022%'",
        "type": "fda_drug_medical_device_import",
        "name": "미얀마 FDA 의약품·의료기기 수입허가 확인",
        "agency": "Food and Drug Administration Myanmar / Myanmar Customs",
        "basis": "Myanmar FDA import controls for drugs, medical devices and related products",
        "summary": "의약품, 의료기기, 진단기기성 제품은 FDA 제품등록, 수입허가, 라벨, 제조자 품질문서, 사용목적 확인 대상 가능성이 있습니다.",
        "documents": ["제품 사양서", "성분/모델 정보", "용도 설명", "FDA 등록 또는 수입허가 자료(해당 시)", "라벨/사용설명서", "제조자 품질문서(해당 시)"],
        "notes": "치료 목적, 인체 사용 목적, 의료기기 등급, 진단용 여부에 따라 적용 제도와 필요 허가가 달라질 수 있습니다.",
        "source_name": "Food and Drug Administration Myanmar",
        "source_url": FDA_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '3304%'",
        "type": "fda_cosmetics_import",
        "name": "미얀마 FDA 화장품 수입허가·라벨 확인",
        "agency": "Food and Drug Administration Myanmar / Myanmar Customs",
        "basis": "Myanmar FDA cosmetic and health product import controls",
        "summary": "화장품은 FDA 신고 또는 허가, 성분 제한, 라벨, 효능표현 확인 대상 가능성이 있습니다.",
        "documents": ["전성분표", "제품 라벨", "제품 정보자료", "책임회사/수입자 자료", "FDA 신고 또는 허가자료(해당 시)"],
        "notes": "의약품성 효능 표현이 있거나 치료 목적을 표방하면 화장품이 아닌 의약품 규제가 적용될 수 있습니다.",
        "source_name": "Food and Drug Administration Myanmar",
        "source_url": FDA_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '17%' or destination_hs_code like '18%' or destination_hs_code like '19%' or destination_hs_code like '20%' or destination_hs_code like '21%' or destination_hs_code like '22%' or destination_hs_code like '25%' or destination_hs_code like '27%' or destination_hs_code like '28%' or destination_hs_code like '29%' or destination_hs_code like '33%' or destination_hs_code like '34%' or destination_hs_code like '39%' or destination_hs_code like '40%' or destination_hs_code like '68%' or destination_hs_code like '72%' or destination_hs_code like '73%' or destination_hs_code like '84%' or destination_hs_code like '85%' or destination_hs_code like '87%' or destination_hs_code like '90%' or destination_hs_code like '94%' or destination_hs_code like '95%'",
        "type": "import_license_tbt_requirement",
        "name": "미얀마 수입허가·기술요건 확인",
        "agency": "Department of Trade / competent ministry / Myanmar Customs",
        "basis": "Myanmar TradeNet 2.0 import licence, TBT and competent authority controls",
        "summary": "일부 식품, 화학, 전기전자, 기계, 소비재, 안전·보안 관련 제품은 TradeNet 2.0 수입허가, 관할부처 추천서, 기술요건 또는 검사 대상 가능성이 있습니다.",
        "documents": ["제품 사양서", "모델명/규격", "시험성적서", "수입허가 또는 관할부처 추천서(해당 시)", "라벨/마킹 자료"],
        "notes": "대상 여부는 HS만이 아니라 제품명, 모델, 용도, 적용 표준, 관할기관과 연례 수입허가 대상목록에 따라 달라질 수 있습니다.",
        "source_name": "Myanmar National Trade Portal guide to import",
        "source_url": MYANMAR_TRADE_PORTAL_IMPORT_GUIDE_URL,
    },
    {
        "condition": "destination_hs_code like '8517%' or destination_hs_code like '8525%' or destination_hs_code like '8526%' or destination_hs_code like '8527%' or destination_hs_code like '8528%' or destination_hs_code like '8543%'",
        "type": "telecom_equipment_import_permit",
        "name": "미얀마 통신·무선기기 수입허가 확인",
        "agency": "Ministry of Transport and Communications / Department of Trade / Myanmar Customs",
        "basis": "Myanmar import licence controls for telecommunication equipment",
        "summary": "통신장비, 무선기기, Wi-Fi/Bluetooth/RFID 기능 제품은 수입허가, 형식승인, 주파수·라벨 조건 대상 가능성이 있습니다.",
        "documents": ["제품 사양서", "무선 모듈/주파수 정보", "시험성적서", "수입허가 또는 승인자료(해당 시)", "모델명/제조자 정보"],
        "notes": "무선 기능 포함 여부, 주파수 대역, 완제품/부품 형태, 통신망 접속 여부에 따라 요구사항이 달라질 수 있습니다.",
        "source_name": "Myanmar National Trade Portal guide to import",
        "source_url": MYANMAR_TRADE_PORTAL_IMPORT_GUIDE_URL,
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
  'MYA',
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
  encode(digest('MYA|' || heading.destination_hs_code || '|' || {sql(requirement["type"])} || '|' || {sql(requirement["name"])} || '|' || {sql(SOURCE_VERSION)}, 'sha256'), 'hex')
from (
  select distinct left(destination_hs_code, 4) as destination_hs_code
  from public.export_destination_tariff_rates
  where country_code = 'MYA'
    and source_version = 'customs-country-tariff-20251231:MYA'
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

    output = f"""-- Generated by scripts/generate_myanmar_import_data_seed.py

begin;

delete from public.export_destination_internal_taxes
where country_code = 'MYA'
  and source_version like '{SOURCE_VERSION}%';

delete from public.export_destination_import_requirements
where country_code = 'MYA'
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
  'MYA',
  tariff.destination_hs_code,
  'commercial_tax',
  '수입 상업세',
  '5%',
  '미얀마 수입 상업세 일반세율 후보',
  'Myanmar Trade Portal과 Commercial Tax Law 안내 기준 수입물품에는 분류에 따라 상업세 또는 특별상품세가 적용될 수 있으며, 일반 상업세 후보는 5%입니다. 면세 47개 품목, 0/10/15/20/25% 스케줄, 특정상품세 대상은 품목별 추가 확인이 필요합니다.',
  'Myanmar Commercial Tax Law',
  {sql(COMMERCIAL_TAX_LAW_SOURCE_URL)},
  {sql(SOURCE_VERSION + ':commercial-tax')},
  date '2026-01-01',
  null::date,
  null::timestamptz,
  now(),
  'staged'::public.legal_record_status,
  encode(digest('MYA|commercial_tax|5|' || tariff.destination_hs_code || '|' || {sql(SOURCE_VERSION)}, 'sha256'), 'hex')
from (
  select distinct destination_hs_code
  from public.export_destination_tariff_rates
  where country_code = 'MYA'
    and source_version = 'customs-country-tariff-20251231:MYA'
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
