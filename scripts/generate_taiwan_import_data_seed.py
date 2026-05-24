#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "supabase/seed/generated/taiwan_import_data_seed.sql"

SOURCE_VERSION = "taiwan-import-data-20260523"
CUSTOMS_TARIFF_SOURCE_URL = "https://portal.sw.nat.gov.tw/APGQO/GC411"
TRADE_CCC_REG_SOURCE_URL = "https://fbfh.trade.gov.tw/fh/ap/queryCCCRegFormf_e.do"
TFDA_BORDER_SOURCE_URL = "https://www.fda.gov.tw/TC/site.aspx?r=498607567&sid=2403"
TFDA_MEDICAL_SOURCE_URL = "https://www.fda.gov.tw/ENG/lawContent.aspx?cid=5063&id=3362"
KAOHSIUNG_CUSTOMS_HEALTH_SOURCE_URL = "https://web.customs.gov.tw/ekaohsiung/singlehtml/47162cfe8dc340c19aae0fa7758a7db3?cntId=596b8756c6714918aa786f2f773d9dc1"
BSMI_SOURCE_URL = "https://www.bsmi.gov.tw/wSite/ct?ctNode=9925&mp=3&xItem=109455"
NCC_SOURCE_URL = "https://www.ncc.gov.tw/English/news_detail.aspx?site_content_sn=69&sn_f=5342"

IMPORT_REG_KEY = "수출입규정\n(수입)"


def sql(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def doc_array(documents: list[str]) -> str:
    return ", ".join(sql(document) for document in documents)


REQUIREMENTS = [
    {
        "granularity": "full",
        "condition": f"(tariff.agreement_rates ->> {sql(IMPORT_REG_KEY)}) ~ '(^|\\s)(F01|F02|B01)(\\s|$)'",
        "type": "tfda_food_border_inspection",
        "name": "대만 TFDA 식품 수입검사 확인",
        "agency": "Taiwan Food and Drug Administration / Customs Administration",
        "basis": "CCC import regulation codes F01/F02/B01 and TFDA border inspection",
        "summary": "관세표 수입규정 코드상 식품·식품관련 제품은 TFDA 식품수입검사, 수입신청, 위생·성분·라벨, 샘플링 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "B/L 또는 AWB", "성분표", "제품 라벨", "위생증명서 또는 검사자료(해당 시)"],
        "notes": "F01/F02/B01 코드는 품목별 수입규정 코드입니다. 실제 적용은 제품 성분, 식품 여부, 용도, 수입자 자격, TFDA 최신 공고에 따라 달라질 수 있습니다.",
        "source_name": "Taiwan FDA border inspection",
        "source_url": TFDA_BORDER_SOURCE_URL,
    },
    {
        "granularity": "full",
        "condition": f"(tariff.agreement_rates ->> {sql(IMPORT_REG_KEY)}) ~ '(^|\\s)(C01|C02)(\\s|$)'",
        "type": "bsmi_import_inspection",
        "name": "대만 BSMI 수입검사 확인",
        "agency": "Bureau of Standards, Metrology and Inspection / Customs Administration",
        "basis": "CCC import regulation codes C01/C02 and BSMI import inspection",
        "summary": "관세표 수입규정 코드상 일부 상품은 BSMI 공고 수입검사, 품목조회, 인증·시험자료, 통관허가 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "제품 사양서", "모델명/규격", "시험성적서 또는 인증자료(해당 시)", "BSMI 품목조회 또는 통관허가 자료(해당 시)"],
        "notes": "C01/C02 코드는 일부 상품만 검사 대상일 수 있어 모델, 전기정격, 용도, 공고 품목 해당성을 함께 확인해야 합니다.",
        "source_name": "Bureau of Standards Metrology and Inspection Taiwan",
        "source_url": BSMI_SOURCE_URL,
    },
    {
        "granularity": "full",
        "condition": f"(tariff.agreement_rates ->> {sql(IMPORT_REG_KEY)}) ~ '(^|\\s)MW0(\\s|$)'",
        "type": "mainland_goods_import_restriction",
        "name": "대만 중국대륙산 물품 수입제한 확인",
        "agency": "International Trade Administration / Customs Administration",
        "basis": "CCC import regulation code MW0",
        "summary": "관세표 수입규정 코드상 MW0가 표시된 품목은 중국대륙산 물품 수입제한 또는 프로젝트 수입허가 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "원산지 자료", "제품 사양서", "수입허가 또는 예외승인 자료(해당 시)"],
        "notes": "MW0는 원산지가 중국대륙인 경우 특히 중요합니다. 한국 원산지라 하더라도 부품·제조공정·원산지 증빙을 함께 확인합니다.",
        "source_name": "Taiwan commodity classification and import regulations",
        "source_url": TRADE_CCC_REG_SOURCE_URL,
    },
    {
        "granularity": "full",
        "condition": f"(tariff.agreement_rates ->> {sql(IMPORT_REG_KEY)}) ~ '(^|\\s)(801|802|821|827)(\\s|$)'",
        "type": "tfda_health_product_import",
        "name": "대만 의약품·의료기기 TFDA 통관허가 확인",
        "agency": "Taiwan Food and Drug Administration / Customs Administration",
        "basis": "CCC health-product import regulation codes and TFDA controls",
        "summary": "관세표 수입규정 코드상 의약품, 의료기기, 건강 관련 제품은 TFDA 허가, 등록, 사전승인, 라벨·사용목적 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "제품 사양서", "용도 설명", "TFDA 허가 또는 등록자료(해당 시)", "라벨/사용설명서"],
        "notes": "의약품성 효능, 인체 적용 여부, 의료기기 등급, 개인/상업 수입 여부에 따라 요구사항이 달라질 수 있습니다.",
        "source_name": "Taiwan FDA medical device border inspection regulations",
        "source_url": TFDA_MEDICAL_SOURCE_URL,
    },
    {
        "granularity": "hs4",
        "condition": "tariff.destination_hs_code like '3304%'",
        "type": "tfda_cosmetics_import",
        "name": "대만 화장품 TFDA 성분·라벨 확인",
        "agency": "Taiwan Food and Drug Administration / Customs Administration",
        "basis": "Taiwan cosmetics and health-product import controls",
        "summary": "화장품은 성분 제한, 라벨, 효능표현, 금지 포장형태, TFDA 관련 허가 또는 통관 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "전성분표", "제품 라벨", "제품 사진 또는 카탈로그", "TFDA 관련 자료(해당 시)"],
        "notes": "의약품성 효능 표현이나 특수 기능성 표시가 있으면 화장품 외 규제가 적용될 수 있습니다.",
        "source_name": "Kaohsiung Customs medicines cosmetics and medical devices",
        "source_url": KAOHSIUNG_CUSTOMS_HEALTH_SOURCE_URL,
    },
    {
        "granularity": "hs4",
        "condition": "tariff.destination_hs_code like '8517%' or tariff.destination_hs_code like '8525%' or tariff.destination_hs_code like '8526%' or tariff.destination_hs_code like '8527%' or tariff.destination_hs_code like '8528%' or tariff.destination_hs_code like '8543%'",
        "type": "ncc_radio_frequency_devices",
        "name": "대만 통신·무선기기 NCC 적합성 확인",
        "agency": "National Communications Commission / Customs Administration",
        "basis": "Controlled Telecommunications Radio-Frequency Devices controls",
        "summary": "통신장비, 무선기기, Wi-Fi/Bluetooth/RFID 기능 제품은 NCC 형식인증, 수입신고, 무선주파수 장비 규제 대상 가능성이 있습니다.",
        "documents": ["제품 사양서", "브랜드/모델 정보", "무선 모듈/주파수 정보", "시험성적서", "NCC 인증 또는 허가자료(해당 시)"],
        "notes": "무선 기능, 주파수 대역, 상업 판매 여부, 통신망 접속 여부에 따라 요구사항이 달라질 수 있습니다.",
        "source_name": "National Communications Commission Taiwan",
        "source_url": NCC_SOURCE_URL,
    },
]

def main() -> None:
    requirement_sql_parts: list[str] = []
    for requirement in REQUIREMENTS:
        code_expr = "tariff.destination_hs_code" if requirement["granularity"] == "full" else "left(tariff.destination_hs_code, 4)"
        requirement_sql_parts.append(f"""
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
  'TWN',
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
  encode(digest('TWN|' || heading.destination_hs_code || '|' || {sql(requirement["type"])} || '|' || {sql(requirement["name"])} || '|' || {sql(SOURCE_VERSION)}, 'sha256'), 'hex')
from (
  select distinct {code_expr} as destination_hs_code
  from public.export_destination_tariff_rates tariff
  where tariff.country_code = 'TWN'
    and tariff.source_version = 'customs-country-tariff-20251231:TWN'
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
""")

    requirement_sql = "\n".join(requirement_sql_parts)

    output = f"""-- Generated by scripts/generate_taiwan_import_data_seed.py

begin;

delete from public.export_destination_internal_taxes
where country_code = 'TWN'
  and source_version like '{SOURCE_VERSION}%';

delete from public.export_destination_import_requirements
where country_code = 'TWN'
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
  'TWN',
  tariff.destination_hs_code,
  'business_tax',
  '수입 영업세',
  '5%',
  '대만 수입 영업세 표준세율 후보',
  '대만 수입물품에는 관세, 화물세 또는 주세 등 과세가격 구성요소에 영업세 5%가 적용될 수 있습니다. 면세, 감면, commodity tax, tobacco/alcohol tax는 품목별 확인이 필요합니다.',
  'Taiwan Customs tariff and tax information',
  {sql(CUSTOMS_TARIFF_SOURCE_URL)},
  {sql(SOURCE_VERSION + ':business-tax')},
  date '2026-01-01',
  null::date,
  null::timestamptz,
  now(),
  'staged'::public.legal_record_status,
  encode(digest('TWN|business_tax|' || tariff.destination_hs_code || '|' || {sql(SOURCE_VERSION)}, 'sha256'), 'hex')
from (
  select distinct destination_hs_code
  from public.export_destination_tariff_rates
  where country_code = 'TWN'
    and source_version = 'customs-country-tariff-20251231:TWN'
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
