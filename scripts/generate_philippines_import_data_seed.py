#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "supabase/seed/generated/philippines_import_data_seed.sql"

SOURCE_VERSION = "philippines-import-data-20260523"
TARIFF_FINDER_SOURCE_URL = "https://finder.tariffcommission.gov.ph/"
BOC_TARIFF_FINDER_SOURCE_URL = "https://customs.gov.ph/philippine-tariff-finder/"
BOC_VAT_SOURCE_URL = "https://customs.gov.ph/importing-relief-goods/"
TRADENET_SOURCE_URL = "https://tradenet.gov.ph/"
FDA_SOURCE_URL = "https://www.fda.gov.ph/"
BAI_SOURCE_URL = "https://www.bai.gov.ph/"
BPI_SOURCE_URL = "https://bpi.da.gov.ph/"
BFAR_SOURCE_URL = "https://www.bfar.da.gov.ph/"
BPS_SOURCE_URL = "https://bps.dti.gov.ph/"
NTC_SOURCE_URL = "https://ntc.gov.ph/permit-to-import/"

REQUIREMENTS = [
    {
        "condition": "destination_hs_code like '02%' or destination_hs_code like '03%' or destination_hs_code like '04%' or destination_hs_code like '07%' or destination_hs_code like '08%' or destination_hs_code like '09%' or destination_hs_code like '10%' or destination_hs_code like '11%' or destination_hs_code like '12%' or destination_hs_code like '15%' or destination_hs_code like '16%' or destination_hs_code like '17%' or destination_hs_code like '18%' or destination_hs_code like '19%' or destination_hs_code like '20%' or destination_hs_code like '21%' or destination_hs_code like '22%'",
        "type": "fda_food_import",
        "name": "필리핀 FDA 식품 수입등록·허가 확인",
        "agency": "Food and Drug Administration Philippines / Bureau of Customs",
        "basis": "FDA regulated food import controls and TradeNet permit workflow",
        "summary": "식품, 식품원료, 식품첨가물, 음료, 식품접촉 포장재는 FDA 등록, 수입허가, 라벨, 성분 및 위생증명 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "성분표", "제품 라벨", "FDA 등록 또는 수입허가 자료(해당 시)", "위생증명서 또는 자유판매증명서(해당 시)"],
        "notes": "제품 유형, 성분, 포장 상태, 용도, 필리핀 FDA 제품 분류 및 TradeNet 신청대상 여부에 따라 조건이 달라질 수 있습니다.",
        "source_name": "Philippines FDA",
        "source_url": FDA_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '01%' or destination_hs_code like '02%' or destination_hs_code like '04%' or destination_hs_code like '05%' or destination_hs_code like '41%' or destination_hs_code like '42%' or destination_hs_code like '43%' or destination_hs_code like '51%'",
        "type": "bai_animal_quarantine",
        "name": "필리핀 BAI 동물검역·축산물 수입허가 확인",
        "agency": "Bureau of Animal Industry / Bureau of Customs",
        "basis": "Philippines animal quarantine and veterinary import permit controls",
        "summary": "동물, 축산물, 동물성 원료, 가죽, 모피, 양모 등은 BAI 수입허가, 위생증명서, 검역검사 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "동물종/원재료 정보", "위생증명서(해당 시)", "BAI 수입허가 자료(해당 시)", "처리·가공 증명자료(해당 시)"],
        "notes": "동물종, 질병상황, 가공상태, 식용/비식품용, 국가별 수입허용 조건에 따라 요구사항이 달라질 수 있습니다.",
        "source_name": "Bureau of Animal Industry",
        "source_url": BAI_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '03%'",
        "type": "bfar_fishery_import",
        "name": "필리핀 BFAR 수산물 수입허가·검역 확인",
        "agency": "Bureau of Fisheries and Aquatic Resources / Bureau of Customs",
        "basis": "Philippines fishery and aquatic product import controls",
        "summary": "수산물, 수산가공품, 수산 원료는 BFAR 수입허가, 위생증명, 검역검사 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "어종/학명 정보", "위생증명서(해당 시)", "BFAR 수입허가 자료(해당 시)", "냉장·냉동 운송자료(해당 시)"],
        "notes": "어종, 식용/비식용, 가공상태, 원산지 위생요건과 수입허가 조건에 따라 요구사항이 달라질 수 있습니다.",
        "source_name": "Bureau of Fisheries and Aquatic Resources",
        "source_url": BFAR_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '06%' or destination_hs_code like '07%' or destination_hs_code like '08%' or destination_hs_code like '10%' or destination_hs_code like '12%' or destination_hs_code like '14%' or destination_hs_code like '44%' or destination_hs_code like '45%' or destination_hs_code like '46%' or destination_hs_code like '94%'",
        "type": "bpi_plant_quarantine",
        "name": "필리핀 BPI 식물검역·목재류 수입허가 확인",
        "agency": "Bureau of Plant Industry / Bureau of Customs",
        "basis": "Philippines plant quarantine and sanitary/phytosanitary controls",
        "summary": "식물, 종자, 곡물, 과실, 식물성 원료, 목재 및 목재포장재는 식물검역증명서, 수입허가, 검역검사, 훈증 또는 처리증명 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "학명/수종 정보", "식물검역증명서(해당 시)", "BPI 수입허가 자료(해당 시)", "훈증/열처리 증명서(해당 시)"],
        "notes": "금지품목, 제한품목, 원산지, 수종, 가공상태, 식용/비식용에 따라 검역 조건이 달라질 수 있습니다.",
        "source_name": "Bureau of Plant Industry",
        "source_url": BPI_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '30%' or destination_hs_code like '3006%' or destination_hs_code like '9018%' or destination_hs_code like '9021%' or destination_hs_code like '9022%'",
        "type": "fda_drug_medical_device",
        "name": "필리핀 FDA 의약품·의료기기 수입등록 확인",
        "agency": "Food and Drug Administration Philippines / Bureau of Customs",
        "basis": "FDA regulated health product import controls",
        "summary": "의약품, 의료기기, 진단기기성 제품은 FDA 제품등록, 수입허가, 라벨, 제조자 품질문서, 사용목적 확인 대상 가능성이 있습니다.",
        "documents": ["제품 사양서", "성분/모델 정보", "용도 설명", "FDA 등록 또는 수입허가 자료(해당 시)", "라벨/사용설명서", "제조자 품질문서(해당 시)"],
        "notes": "치료 목적, 인체 사용 목적, 의료기기 등급, 진단용 여부에 따라 적용 제도와 필요 허가가 달라질 수 있습니다.",
        "source_name": "Philippines FDA",
        "source_url": FDA_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '3304%'",
        "type": "fda_cosmetics_notification",
        "name": "필리핀 FDA 화장품 신고·라벨 확인",
        "agency": "Food and Drug Administration Philippines / Bureau of Customs",
        "basis": "FDA cosmetic product notification and labeling controls",
        "summary": "화장품은 필리핀 FDA 화장품 신고, 책임회사 지정, 성분 제한, 라벨 및 효능표현 확인 대상 가능성이 있습니다.",
        "documents": ["전성분표", "제품 라벨", "제품 정보자료", "책임회사/수입자 자료", "FDA 화장품 신고자료(해당 시)"],
        "notes": "의약품성 효능 표현이 있거나 치료 목적을 표방하면 화장품이 아닌 의약품 규제가 적용될 수 있습니다.",
        "source_name": "Philippines FDA",
        "source_url": FDA_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '17%' or destination_hs_code like '18%' or destination_hs_code like '19%' or destination_hs_code like '20%' or destination_hs_code like '21%' or destination_hs_code like '22%' or destination_hs_code like '25%' or destination_hs_code like '27%' or destination_hs_code like '28%' or destination_hs_code like '29%' or destination_hs_code like '33%' or destination_hs_code like '34%' or destination_hs_code like '39%' or destination_hs_code like '40%' or destination_hs_code like '68%' or destination_hs_code like '72%' or destination_hs_code like '73%' or destination_hs_code like '84%' or destination_hs_code like '85%' or destination_hs_code like '87%' or destination_hs_code like '90%' or destination_hs_code like '94%' or destination_hs_code like '95%'",
        "type": "bps_mandatory_standard",
        "name": "필리핀 BPS 강제표준·제품인증 확인",
        "agency": "Bureau of Philippine Standards / Bureau of Customs",
        "basis": "Philippines mandatory product certification and technical regulations",
        "summary": "식품, 화학, 전기전자, 기계, 철강, 건축자재, 차량부품, 완구 등 일부 제품은 BPS 강제표준, ICC/PS 인증, 기술규정 또는 수입허가 대상 가능성이 있습니다.",
        "documents": ["제품 사양서", "모델명/규격", "시험성적서", "BPS ICC/PS 인증자료(해당 시)", "라벨/마킹 자료"],
        "notes": "대상 여부는 HS만이 아니라 제품명, 모델, 전기정격, 적용 PNS/기술규정, 사용처와 예외조건에 따라 달라질 수 있습니다.",
        "source_name": "Bureau of Philippine Standards",
        "source_url": BPS_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '8517%' or destination_hs_code like '8525%' or destination_hs_code like '8526%' or destination_hs_code like '8527%' or destination_hs_code like '8528%' or destination_hs_code like '8543%'",
        "type": "ntc_telecom_equipment",
        "name": "필리핀 NTC 통신·무선기기 수입허가 확인",
        "agency": "National Telecommunications Commission / Bureau of Customs",
        "basis": "NTC permit to import communication and radio equipment",
        "summary": "통신장비, 무선기기, Wi-Fi/Bluetooth/RFID 기능 제품은 NTC 수입허가, 형식승인, 주파수·라벨 조건 대상 가능성이 있습니다.",
        "documents": ["제품 사양서", "무선 모듈/주파수 정보", "시험성적서", "NTC 수입허가 또는 승인자료(해당 시)", "모델명/제조자 정보"],
        "notes": "무선 기능 포함 여부, 주파수 대역, 완제품/부품 형태, 통신망 접속 여부에 따라 요구사항이 달라질 수 있습니다.",
        "source_name": "National Telecommunications Commission permit to import",
        "source_url": NTC_SOURCE_URL,
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
  'PHL',
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
  encode(digest('PHL|' || heading.destination_hs_code || '|' || {sql(requirement["type"])} || '|' || {sql(requirement["name"])} || '|' || {sql(SOURCE_VERSION)}, 'sha256'), 'hex')
from (
  select distinct left(destination_hs_code, 4) as destination_hs_code
  from public.export_destination_tariff_rates
  where country_code = 'PHL'
    and source_version = 'customs-country-tariff-20251231:PHL'
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

    output = f"""-- Generated by scripts/generate_philippines_import_data_seed.py

begin;

delete from public.export_destination_internal_taxes
where country_code = 'PHL'
  and source_version like '{SOURCE_VERSION}%';

delete from public.export_destination_import_requirements
where country_code = 'PHL'
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
  'PHL',
  tariff.destination_hs_code,
  'vat',
  '수입 VAT',
  '12%',
  '필리핀 수입 VAT 표준세율 후보',
  'Bureau of Customs 안내 기준 수입물품 VAT는 통관 과세가격, 관세, 소비세 및 기타 비용을 포함한 landed cost 기준 12% 후보로 표시합니다. VAT 면세, 영세율, 특수경제구역, excise tax, 품목별 예외는 별도 확인이 필요합니다.',
  'Bureau of Customs import VAT guidance',
  {sql(BOC_VAT_SOURCE_URL)},
  {sql(SOURCE_VERSION + ':vat')},
  date '2026-01-01',
  null::date,
  null::timestamptz,
  now(),
  'staged'::public.legal_record_status,
  encode(digest('PHL|vat|12|' || tariff.destination_hs_code || '|' || {sql(SOURCE_VERSION)}, 'sha256'), 'hex')
from (
  select distinct destination_hs_code
  from public.export_destination_tariff_rates
  where country_code = 'PHL'
    and source_version = 'customs-country-tariff-20251231:PHL'
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
