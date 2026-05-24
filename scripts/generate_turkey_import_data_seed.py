#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "supabase/seed/generated/turkey_import_data_seed.sql"

SOURCE_VERSION = "turkey-import-data-20260524"
TRADE_TARIFF_SOURCE_URL = "https://ticaret.gov.tr/gumruk-islemleri/sikca-sorulan-sorular/english/tariff"
TRADE_IMPORT_REGIME_SOURCE_URL = "https://ticaret.gov.tr/gumruk-islemleri/sikca-sorulan-sorular/english/import-regime"
TRADE_PRODUCT_SAFETY_SOURCE_URL = "https://ticaret.gov.tr/urun-guvenligi/ithalatta-urun-guvenligi-denetimleri"
CUSTOMS_GUIDE_TAX_SOURCE_URL = "https://www.gumrukrehberi.gov.tr/sayfa/g%C3%BCmr%C3%BCk-vergileri-neye-g%C3%B6re-hesaplan%C4%B1r"
TITCK_SOURCE_URL = "https://www.titck.gov.tr/"
MINISTRY_AGRICULTURE_SOURCE_URL = "https://www.tarimorman.gov.tr/"
BTK_SOURCE_URL = "https://www.btk.gov.tr/"

REQUIREMENTS = [
    {
        "condition": "destination_hs_code like '02%' or destination_hs_code like '03%' or destination_hs_code like '04%' or destination_hs_code like '07%' or destination_hs_code like '08%' or destination_hs_code like '09%' or destination_hs_code like '10%' or destination_hs_code like '11%' or destination_hs_code like '12%' or destination_hs_code like '15%' or destination_hs_code like '16%' or destination_hs_code like '17%' or destination_hs_code like '18%' or destination_hs_code like '19%' or destination_hs_code like '20%' or destination_hs_code like '21%' or destination_hs_code like '22%'",
        "type": "food_agriculture_control",
        "name": "튀르키예 식품·농산물 수입검사 확인",
        "agency": "Ministry of Agriculture and Forestry / Ministry of Trade",
        "basis": "Turkey food, agriculture and import regime controls",
        "summary": "식품, 식품원료, 식품첨가물, 음료, 농수산물은 식품코덱스, 수입검사, 위생·식물검역·동물검역, 라벨 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "성분표", "제품 라벨", "위생증명서 또는 식물검역증명서(해당 시)", "수입허가 또는 검사자료(해당 시)"],
        "notes": "제품 유형, 성분, 동식물성 원료, 원산국, 가공상태, 관세품목군에 따라 요구사항이 달라질 수 있습니다.",
        "source_name": "Turkey Ministry of Agriculture and Forestry",
        "source_url": MINISTRY_AGRICULTURE_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '01%' or destination_hs_code like '02%' or destination_hs_code like '03%' or destination_hs_code like '04%' or destination_hs_code like '05%' or destination_hs_code like '41%' or destination_hs_code like '42%' or destination_hs_code like '43%' or destination_hs_code like '51%'",
        "type": "animal_fishery_veterinary_control",
        "name": "튀르키예 동물·수산·축산물 검역 확인",
        "agency": "Ministry of Agriculture and Forestry / Ministry of Trade",
        "basis": "Turkey veterinary, fishery and animal-origin import controls",
        "summary": "동물, 축산물, 수산물, 동물성 원료, 가죽, 모피, 양모 등은 수입허가, 수의검역, 위생증명, 검사 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "동물종/원재료 정보", "위생증명서(해당 시)", "수입허가 또는 검사자료(해당 시)"],
        "notes": "동물종, 질병상황, 식용/비식품용, 가공상태, 원산국별 제한에 따라 조건이 달라질 수 있습니다.",
        "source_name": "Turkey Ministry of Agriculture and Forestry",
        "source_url": MINISTRY_AGRICULTURE_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '06%' or destination_hs_code like '07%' or destination_hs_code like '08%' or destination_hs_code like '10%' or destination_hs_code like '12%' or destination_hs_code like '14%' or destination_hs_code like '44%' or destination_hs_code like '45%' or destination_hs_code like '46%' or destination_hs_code like '94%'",
        "type": "plant_wood_phytosanitary_control",
        "name": "튀르키예 식물·목재류 식물검역 확인",
        "agency": "Ministry of Agriculture and Forestry / Ministry of Trade",
        "basis": "Turkey phytosanitary and plant product import controls",
        "summary": "식물, 종자, 곡물, 과실, 식물성 원료, 목재 및 목재포장재는 식물검역증명서, 수입허가, 훈증·열처리, 검사 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "학명/수종 정보", "식물검역증명서(해당 시)", "훈증 또는 처리증명서(해당 시)"],
        "notes": "재식용 여부, 수종, 목재포장재 여부, 가공상태와 원산국별 병해충 조건을 함께 확인합니다.",
        "source_name": "Turkey Ministry of Agriculture and Forestry",
        "source_url": MINISTRY_AGRICULTURE_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '30%' or destination_hs_code like '3006%' or destination_hs_code like '9018%' or destination_hs_code like '9021%' or destination_hs_code like '9022%'",
        "type": "titck_medicine_medical_device",
        "name": "튀르키예 의약품·의료기기 TITCK 확인",
        "agency": "Turkish Medicines and Medical Devices Agency / Ministry of Trade",
        "basis": "TITCK medicines, cosmetics and medical device controls",
        "summary": "의약품, 의료기기, 진단기기성 제품은 TITCK 등록, 수입허가, UTS/제품추적, CE·라벨·사용목적 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "제품 사양서", "용도 설명", "등록 또는 허가자료(해당 시)", "라벨/사용설명서"],
        "notes": "의료 목적 표시, 멸균 여부, 인체 적용 여부, 의료기기 등급과 EU MDR/CE 조건에 따라 요구사항이 달라질 수 있습니다.",
        "source_name": "Turkish Medicines and Medical Devices Agency",
        "source_url": TITCK_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '3304%'",
        "type": "titck_cosmetics_control",
        "name": "튀르키예 화장품 TITCK 성분·라벨 확인",
        "agency": "Turkish Medicines and Medical Devices Agency / Ministry of Trade",
        "basis": "TITCK cosmetics and personal care product controls",
        "summary": "화장품은 TITCK 화장품 규정, 제품 안전성, 성분 제한, 라벨, 통지·등록 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "전성분표", "제품 라벨", "제품 정보파일 또는 안전성 자료(해당 시)", "등록·통지 자료(해당 시)"],
        "notes": "의약품성 효능 표현, 금지·제한 성분, 나노물질, 피부 적용 제품 유형에 따라 추가 확인이 필요할 수 있습니다.",
        "source_name": "Turkish Medicines and Medical Devices Agency",
        "source_url": TITCK_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '25%' or destination_hs_code like '27%' or destination_hs_code like '28%' or destination_hs_code like '29%' or destination_hs_code like '32%' or destination_hs_code like '33%' or destination_hs_code like '34%' or destination_hs_code like '35%' or destination_hs_code like '38%' or destination_hs_code like '39%' or destination_hs_code like '40%' or destination_hs_code like '68%' or destination_hs_code like '72%' or destination_hs_code like '73%' or destination_hs_code like '84%' or destination_hs_code like '85%' or destination_hs_code like '87%' or destination_hs_code like '90%' or destination_hs_code like '94%' or destination_hs_code like '95%'",
        "type": "product_safety_tareks_control",
        "name": "튀르키예 제품안전·TAREKS 수입검사 확인",
        "agency": "Ministry of Trade / Relevant competent authorities",
        "basis": "Turkey product safety and import inspection communiques",
        "summary": "전기전자, 기계, 소비재, 장난감, 화학제품, 건축자재, 차량·부품 등은 TAREKS 제품안전 검사, CE/표준, 적합성평가 대상 가능성이 있습니다.",
        "documents": ["제품 사양서", "모델명/규격", "시험성적서", "CE/적합성 선언(해당 시)", "TAREKS 신청 또는 참조번호(해당 시)", "라벨/마킹 자료"],
        "notes": "대상 여부는 HS만이 아니라 제품명, 모델, 전기정격, 사용처, 위험도, 연도별 수입검사 communiqué에 따라 달라질 수 있습니다.",
        "source_name": "Turkey Ministry of Trade product safety import inspections",
        "source_url": TRADE_PRODUCT_SAFETY_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '8517%' or destination_hs_code like '8525%' or destination_hs_code like '8526%' or destination_hs_code like '8527%' or destination_hs_code like '8528%' or destination_hs_code like '8543%'",
        "type": "btk_telecom_radio_equipment",
        "name": "튀르키예 통신·무선기기 BTK 확인",
        "agency": "Information and Communication Technologies Authority / Ministry of Trade",
        "basis": "Turkey telecom and radio equipment compliance controls",
        "summary": "통신장비, 무선기기, Wi-Fi/Bluetooth/RFID 기능 제품은 BTK/무선장비 적합성, CE/RED, 주파수, 등록·수입허가 확인 대상 가능성이 있습니다.",
        "documents": ["제품 사양서", "브랜드/모델 정보", "무선 모듈/주파수 정보", "시험성적서", "CE/RED 적합성자료(해당 시)", "BTK 관련 자료(해당 시)"],
        "notes": "무선 기능, 주파수 대역, 상업 판매 여부, 통신망 접속 여부에 따라 요구사항이 달라질 수 있습니다.",
        "source_name": "Information and Communication Technologies Authority Turkey",
        "source_url": BTK_SOURCE_URL,
    },
]


def sql(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def doc_array(documents: list[str]) -> str:
    return ", ".join(sql(document) for document in documents)


def standard_vat_fallback_insert() -> str:
    return f"""
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
  'TUR',
  tariff.destination_hs_code,
  'vat',
  '수입 VAT(KDV)',
  '20%',
  '튀르키예 수입 VAT(KDV) 표준세율 후보',
  '튀르키예 수입 시 KDV가 주요 수입세목으로 부과됩니다. 관세청 국가별 관세율표에 부가세율 컬럼 값이 있는 품목은 해당 품목별 행을 우선 사용하며, 1%/10% 감면세율, 면세, 특별소비세(OTV), TRT bandrole, 추가재정의무는 품목별 확인이 필요합니다.',
  'Turkey customs guide taxes',
  {sql(CUSTOMS_GUIDE_TAX_SOURCE_URL)},
  {sql(SOURCE_VERSION + ':vat-standard-20-fallback')},
  date '2026-01-01',
  null::date,
  null::timestamptz,
  now(),
  'staged'::public.legal_record_status,
  encode(digest('TUR|vat-standard-20|' || tariff.destination_hs_code || '|' || {sql(SOURCE_VERSION)}, 'sha256'), 'hex')
from (
  select distinct destination_hs_code
  from public.export_destination_tariff_rates
  where country_code = 'TUR'
    and source_version = 'customs-country-tariff-20251231:TUR'
) tariff
where not exists (
    select 1
    from public.export_destination_internal_taxes existing
    where existing.country_code = 'TUR'
      and existing.destination_hs_code = tariff.destination_hs_code
      and existing.tax_type = 'vat'
      and existing.source_version like {sql(SOURCE_VERSION + ':%')}
  )
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
"""


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
  'TUR',
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
  encode(digest('TUR|' || heading.destination_hs_code || '|' || {sql(requirement["type"])} || '|' || {sql(requirement["name"])} || '|' || {sql(SOURCE_VERSION)}, 'sha256'), 'hex')
from (
  select distinct left(destination_hs_code, 4) as destination_hs_code
  from public.export_destination_tariff_rates
  where country_code = 'TUR'
    and source_version = 'customs-country-tariff-20251231:TUR'
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

    output = f"""-- Generated by scripts/generate_turkey_import_data_seed.py

begin;

delete from public.export_destination_internal_taxes
where country_code = 'TUR'
  and source_version like '{SOURCE_VERSION}%';

delete from public.export_destination_import_requirements
where country_code = 'TUR'
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
  'TUR',
  tariff.destination_hs_code,
  'vat',
  '수입 VAT(KDV)',
  case
    when btrim(tariff.agreement_rates ->> '부가세율') ~ '^[0-9]+([.][0-9]+)?$'
      then btrim(tariff.agreement_rates ->> '부가세율') || '%'
    else btrim(tariff.agreement_rates ->> '부가세율')
  end,
  '튀르키예 수입 VAT(KDV) 후보',
  '관세청 국가별 관세율표의 부가세율 컬럼을 수입 VAT 후보로 분리했습니다. 특별소비세(OTV), TRT bandrole, 추가재정의무, 면세·감면은 품목별 확인이 필요합니다.',
  'Turkey customs guide taxes',
  {sql(CUSTOMS_GUIDE_TAX_SOURCE_URL)},
  {sql(SOURCE_VERSION + ':vat')},
  date '2026-01-01',
  null::date,
  null::timestamptz,
  now(),
  'staged'::public.legal_record_status,
  encode(digest(
    'TUR|vat|' ||
    tariff.destination_hs_code ||
    '|' ||
    coalesce(
      case
        when btrim(tariff.agreement_rates ->> '부가세율') ~ '^[0-9]+([.][0-9]+)?$'
          then btrim(tariff.agreement_rates ->> '부가세율') || '%'
        else btrim(tariff.agreement_rates ->> '부가세율')
      end,
      ''
    ) ||
    '|' ||
    {sql(SOURCE_VERSION)},
    'sha256'
  ), 'hex')
from public.export_destination_tariff_rates tariff
where tariff.country_code = 'TUR'
  and tariff.source_version = 'customs-country-tariff-20251231:TUR'
  and tariff.agreement_rates ? '부가세율'
  and nullif(btrim(tariff.agreement_rates ->> '부가세율'), '') is not null
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

{standard_vat_fallback_insert()}

{requirement_sql}

commit;
"""

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(output, encoding="utf-8")
    print(f"wrote {OUTPUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
