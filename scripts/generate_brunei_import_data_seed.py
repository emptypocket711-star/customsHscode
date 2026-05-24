#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "supabase/seed/generated/brunei_import_data_seed.sql"

SOURCE_VERSION = "brunei-import-data-20260523"
BDNSW_SOURCE_URL = "https://bdnsw.mofe.gov.bn/Pages/ImpExpProcedure.aspx"
BDNSW_CUSTOMS_DUTY_SOURCE_URL = "https://bdnsw.mofe.gov.bn/Pages/CustomsImportDuty.aspx"
RCED_SOURCE_URL = "https://bdnsw.mofe.gov.bn/Pages/Home.aspx"
MOH_PHARMACY_SOURCE_URL = "https://moh.gov.bn/services/pharmary-services/"
MPRT_SOURCE_URL = "https://www.mprt.gov.bn/"
MORA_SOURCE_URL = "https://www.mora.gov.bn/"
AITI_SOURCE_URL = "https://www.aiti.gov.bn/permits/personal-import-permit/"

REQUIREMENTS = [
    {
        "condition": "destination_hs_code like '02%' or destination_hs_code like '03%' or destination_hs_code like '04%' or destination_hs_code like '07%' or destination_hs_code like '08%' or destination_hs_code like '09%' or destination_hs_code like '10%' or destination_hs_code like '11%' or destination_hs_code like '12%' or destination_hs_code like '15%' or destination_hs_code like '16%' or destination_hs_code like '17%' or destination_hs_code like '18%' or destination_hs_code like '19%' or destination_hs_code like '20%' or destination_hs_code like '21%' or destination_hs_code like '22%'",
        "type": "food_import_health_halal",
        "name": "브루나이 식품 수입허가·위생·할랄 확인",
        "agency": "Ministry of Health / Ministry of Religious Affairs / Royal Customs and Excise Department",
        "basis": "BDNSW import procedures and Brunei food/halal import controls",
        "summary": "식품, 식품원료, 식품첨가물, 음료, 식품접촉 포장재는 수입허가, 위생·안전 확인, 라벨, 성분, 할랄 요건 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "성분표", "제품 라벨", "위생증명서(해당 시)", "할랄증명서 또는 할랄 관련 자료(해당 시)"],
        "notes": "식품 유형, 성분, 동물성 원료 포함 여부, 할랄 표시 여부, 개인/상업 수입 구분에 따라 요구사항이 달라질 수 있습니다.",
        "source_name": "Brunei Darussalam National Single Window import procedures",
        "source_url": BDNSW_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '01%' or destination_hs_code like '02%' or destination_hs_code like '03%' or destination_hs_code like '04%' or destination_hs_code like '05%' or destination_hs_code like '41%' or destination_hs_code like '42%' or destination_hs_code like '43%' or destination_hs_code like '51%'",
        "type": "animal_fishery_quarantine",
        "name": "브루나이 동물·수산·축산물 검역 확인",
        "agency": "Ministry of Primary Resources and Tourism / Royal Customs and Excise Department",
        "basis": "Brunei animal, fishery and animal-origin import controls",
        "summary": "동물, 축산물, 수산물, 동물성 원료, 가죽, 모피, 양모 등은 검역, 위생증명, 수입허가 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "동물종/원재료 정보", "위생증명서(해당 시)", "검역 또는 수입허가 자료(해당 시)"],
        "notes": "동물종, 가공상태, 식용/비식품용, 원산지 질병상황, 수입자 자격에 따라 조건이 달라질 수 있습니다.",
        "source_name": "Ministry of Primary Resources and Tourism Brunei",
        "source_url": MPRT_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '06%' or destination_hs_code like '07%' or destination_hs_code like '08%' or destination_hs_code like '10%' or destination_hs_code like '12%' or destination_hs_code like '14%' or destination_hs_code like '44%' or destination_hs_code like '45%' or destination_hs_code like '46%' or destination_hs_code like '94%'",
        "type": "plant_quarantine",
        "name": "브루나이 식물검역·목재류 확인",
        "agency": "Ministry of Primary Resources and Tourism / Royal Customs and Excise Department",
        "basis": "Brunei phytosanitary and plant import controls",
        "summary": "식물, 종자, 곡물, 과실, 식물성 원료, 목재 및 목재포장재는 식물검역증명서, 수입허가, 훈증 또는 처리증명 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "학명/수종 정보", "식물검역증명서(해당 시)", "훈증/열처리 증명서(해당 시)", "수입허가 자료(해당 시)"],
        "notes": "수종, 가공상태, 재식용 여부, 목재포장재 포함 여부, 원산지별 병해충 조건에 따라 요구사항이 달라질 수 있습니다.",
        "source_name": "Ministry of Primary Resources and Tourism Brunei",
        "source_url": MPRT_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '30%' or destination_hs_code like '3006%' or destination_hs_code like '9018%' or destination_hs_code like '9021%' or destination_hs_code like '9022%'",
        "type": "medicine_medical_device_import",
        "name": "브루나이 의약품·의료기기 수입허가 확인",
        "agency": "Ministry of Health / Royal Customs and Excise Department",
        "basis": "Ministry of Health pharmaceutical services import permit and health product controls",
        "summary": "의약품, 특별승인 의약품, 의료기기, 진단기기성 제품은 보건부 수입허가, 등록, 라벨, 사용목적 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "제품 사양서", "성분/처방 정보(해당 시)", "등록 또는 수입허가 자료(해당 시)", "라벨/사용설명서"],
        "notes": "의약품성 효능, 멸균 여부, 인체 적용 여부, 진단·치료 목적에 따라 의약품 또는 의료기기 규제가 적용될 수 있습니다.",
        "source_name": "Ministry of Health Brunei pharmacy services",
        "source_url": MOH_PHARMACY_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '3304%'",
        "type": "cosmetics_notification",
        "name": "브루나이 화장품 통지·라벨 확인",
        "agency": "Ministry of Health / Royal Customs and Excise Department",
        "basis": "Ministry of Health cosmetic product notification controls",
        "summary": "화장품은 브루나이 내 판매 전 보건부 화장품 통지, 성분 제한, 라벨, 수입신고 연계 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "전성분표", "제품 라벨", "카탈로그 또는 제품 사진", "화장품 통지번호 또는 관련 자료(해당 시)"],
        "notes": "치료·미백·의약품성 효능 표현, 금지 또는 제한 성분, 개인/상업 수입 여부에 따라 요구사항이 달라질 수 있습니다.",
        "source_name": "Ministry of Health Brunei pharmacy services",
        "source_url": MOH_PHARMACY_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '17%' or destination_hs_code like '18%' or destination_hs_code like '19%' or destination_hs_code like '20%' or destination_hs_code like '21%' or destination_hs_code like '22%' or destination_hs_code like '25%' or destination_hs_code like '27%' or destination_hs_code like '28%' or destination_hs_code like '29%' or destination_hs_code like '33%' or destination_hs_code like '34%' or destination_hs_code like '38%' or destination_hs_code like '39%' or destination_hs_code like '40%' or destination_hs_code like '68%' or destination_hs_code like '72%' or destination_hs_code like '73%' or destination_hs_code like '84%' or destination_hs_code like '85%' or destination_hs_code like '87%' or destination_hs_code like '90%' or destination_hs_code like '94%' or destination_hs_code like '95%'",
        "type": "controlled_goods_import_permit",
        "name": "브루나이 제한·통제물품 수입허가 확인",
        "agency": "Royal Customs and Excise Department / Other Government Agencies",
        "basis": "BDNSW import procedures for restricted, prohibited and controlled goods",
        "summary": "화학제품, 전기전자, 기계류, 차량부품, 소비재, 건축자재 등 일부 제품은 BDNSW 수입신고와 함께 통제물품 허가 또는 관할기관 승인이 필요할 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "제품 사양서", "카탈로그", "시험성적서 또는 인증자료(해당 시)", "관할기관 허가자료(해당 시)"],
        "notes": "대상 여부는 HS만이 아니라 제품명, 모델, 용도, 전기정격, 무선 기능, 화학성분, 중고 여부와 관할기관 조건에 따라 달라질 수 있습니다.",
        "source_name": "Brunei Darussalam National Single Window import procedures",
        "source_url": BDNSW_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '8517%' or destination_hs_code like '8525%' or destination_hs_code like '8526%' or destination_hs_code like '8527%' or destination_hs_code like '8528%' or destination_hs_code like '8543%'",
        "type": "aiti_telecom_equipment",
        "name": "브루나이 통신·무선기기 AITI 수입허가 확인",
        "agency": "Authority for Info-communications Technology Industry / Royal Customs and Excise Department",
        "basis": "AITI telecommunications and radiocommunications equipment import permit controls",
        "summary": "통신장비, 무선기기, Wi-Fi/Bluetooth/RFID 기능 제품은 AITI 수입허가, 형식승인, 기술규격 확인 대상 가능성이 있습니다.",
        "documents": ["제품 사양서", "브랜드/모델/수량 정보", "무선 모듈/주파수 정보", "브로슈어 또는 카탈로그", "운송서류 또는 압류통지서(해당 시)", "AITI 허가자료(해당 시)"],
        "notes": "상업 판매용, 개인용, 데모/시험용, 형식승인 필요 여부에 따라 허가 종류와 제출자료가 달라질 수 있습니다.",
        "source_name": "AITI personal import permit",
        "source_url": AITI_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '02%' or destination_hs_code like '03%' or destination_hs_code like '04%' or destination_hs_code like '15%' or destination_hs_code like '16%' or destination_hs_code like '19%' or destination_hs_code like '20%' or destination_hs_code like '21%' or destination_hs_code like '22%' or destination_hs_code like '33%'",
        "type": "halal_restricted_ingredient_check",
        "name": "브루나이 할랄·제한성분 확인",
        "agency": "Ministry of Religious Affairs / Ministry of Health / Royal Customs and Excise Department",
        "basis": "Brunei halal and restricted ingredient controls",
        "summary": "식품, 화장품, 향료, 동물성 원료 포함 제품은 할랄 표시, 제한성분, 성분 증빙, 관할기관 확인 대상 가능성이 있습니다.",
        "documents": ["전성분표", "원료 원산지 자료", "동물성 원료 유무 자료", "할랄증명서(해당 시)", "제품 라벨", "제조공정 자료(해당 시)"],
        "notes": "돼지 유래 원료, 알코올, 동물성 원료, 할랄 표시 여부에 따라 통관 또는 유통 전 확인 범위가 달라질 수 있습니다.",
        "source_name": "Ministry of Religious Affairs Brunei",
        "source_url": MORA_SOURCE_URL,
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
  'BRU',
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
  encode(digest('BRU|' || heading.destination_hs_code || '|' || {sql(requirement["type"])} || '|' || {sql(requirement["name"])} || '|' || {sql(SOURCE_VERSION)}, 'sha256'), 'hex')
from (
  select distinct left(destination_hs_code, 4) as destination_hs_code
  from public.export_destination_tariff_rates
  where country_code = 'BRU'
    and source_version = 'customs-country-tariff-20251231:BRU'
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

    output = f"""-- Generated by scripts/generate_brunei_import_data_seed.py

begin;

delete from public.export_destination_internal_taxes
where country_code = 'BRU'
  and source_version like '{SOURCE_VERSION}%';

delete from public.export_destination_import_requirements
where country_code = 'BRU'
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
  'BRU',
  tariff.destination_hs_code,
  'vat',
  'VAT/GST',
  '없음',
  '브루나이 일반 VAT/GST 없음',
  '브루나이는 일반 VAT/GST 또는 일반 판매세를 부과하지 않는 것으로 처리합니다. 다만 품목별 수입관세, excise duty, 허가 수수료는 별도로 적용될 수 있습니다.',
  'Brunei Darussalam National Single Window customs import duty',
  {sql(BDNSW_CUSTOMS_DUTY_SOURCE_URL)},
  {sql(SOURCE_VERSION + ':no-vat-gst')},
  date '2026-01-01',
  null::date,
  null::timestamptz,
  now(),
  'staged'::public.legal_record_status,
  encode(digest('BRU|no-vat-gst|' || tariff.destination_hs_code || '|' || {sql(SOURCE_VERSION)}, 'sha256'), 'hex')
from (
  select distinct destination_hs_code
  from public.export_destination_tariff_rates
  where country_code = 'BRU'
    and source_version = 'customs-country-tariff-20251231:BRU'
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
