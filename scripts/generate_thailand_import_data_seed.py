#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "supabase/seed/generated/thailand_import_data_seed.sql"

SOURCE_VERSION = "thailand-import-data-20260523"
VAT_SOURCE_URL = "https://www.rd.go.th/english/6043.html"
THAI_CUSTOMS_SOURCE_URL = "https://www.customs.go.th/"
THAI_FDA_FOOD_SOURCE_URL = "https://en.fda.moph.go.th/entrepreneurs-food/food-importation-01"
THAI_FDA_MEDICAL_DEVICE_SOURCE_URL = "https://en.fda.moph.go.th/our-services-new/our-services-manufacturer-importer-of-medical-devices"
THAI_FDA_COSMETICS_SOURCE_URL = "https://en.fda.moph.go.th/"
TISI_SOURCE_URL = "https://www2.tisi.go.th/standard-list/en"
DOA_PLANT_SOURCE_URL = "https://www.doa.go.th/"
DLD_SOURCE_URL = "https://dld.go.th/"
NBTC_SOURCE_URL = "https://www.nbtc.go.th/"

REQUIREMENTS = [
    {
        "condition": "destination_hs_code like '02%' or destination_hs_code like '03%' or destination_hs_code like '04%' or destination_hs_code like '07%' or destination_hs_code like '08%' or destination_hs_code like '09%' or destination_hs_code like '10%' or destination_hs_code like '11%' or destination_hs_code like '12%' or destination_hs_code like '15%' or destination_hs_code like '16%' or destination_hs_code like '17%' or destination_hs_code like '18%' or destination_hs_code like '19%' or destination_hs_code like '20%' or destination_hs_code like '21%' or destination_hs_code like '22%'",
        "type": "thai_fda_food_import",
        "name": "태국 FDA 식품 수입허가·검사 확인",
        "agency": "Thai Food and Drug Administration / Thai Customs",
        "basis": "Thai FDA food importation procedure",
        "summary": "식품, 식품원료, 식품첨가물, 식품접촉 포장재는 Thai FDA 수입자 자격, 식품 수입허가, 제품등록, 라벨 및 검사 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "성분표", "제품 라벨", "식품 수입허가 또는 FDA 등록자료(해당 시)", "위생증명서 또는 원산지증명서(해당 시)"],
        "notes": "식품 유형, 성분, 용도, 포장 상태, 수입자 사업장 요건과 Thai FDA 제품 분류에 따라 결과가 달라질 수 있습니다.",
        "source_name": "Thai FDA food importation",
        "source_url": THAI_FDA_FOOD_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '06%' or destination_hs_code like '07%' or destination_hs_code like '08%' or destination_hs_code like '10%' or destination_hs_code like '12%' or destination_hs_code like '14%' or destination_hs_code like '44%' or destination_hs_code like '45%' or destination_hs_code like '46%' or destination_hs_code like '94%'",
        "type": "plant_quarantine",
        "name": "태국 식물검역·목재류 수입허가 확인",
        "agency": "Department of Agriculture / Thai Customs",
        "basis": "Thailand plant quarantine and import permit procedure",
        "summary": "식물, 종자, 곡물, 과실, 식물성 원료, 목재 및 목재포장재는 수입허가, 식물검역증명서, 검역검사, 훈증 또는 처리증명 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "학명/수종 정보", "식물검역증명서(해당 시)", "수입허가 자료(해당 시)", "훈증/열처리 증명서(해당 시)"],
        "notes": "금지품목, 제한품목, 원산지, 수종, 가공상태, 식용/비식용에 따라 검역 조건이 달라질 수 있습니다.",
        "source_name": "Thailand Department of Agriculture",
        "source_url": DOA_PLANT_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '01%' or destination_hs_code like '02%' or destination_hs_code like '03%' or destination_hs_code like '04%' or destination_hs_code like '05%' or destination_hs_code like '41%' or destination_hs_code like '42%' or destination_hs_code like '43%' or destination_hs_code like '51%'",
        "type": "animal_quarantine",
        "name": "태국 동물검역·동물성 제품 수입허가 확인",
        "agency": "Department of Livestock Development / Thai Customs",
        "basis": "Thailand livestock and animal product import procedure",
        "summary": "동물, 축산물, 수산물, 가죽, 모피, 양모 등 동물성 제품은 수입허가, 위생증명서, 검역검사 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "동물종/원재료 정보", "위생증명서(해당 시)", "수입허가 자료(해당 시)", "처리·가공 증명자료(해당 시)"],
        "notes": "동물종, 원산지 질병상황, 가공상태, 식품용/비식품용, Thai FDA 또는 DLD 관할 여부에 따라 요구사항이 달라질 수 있습니다.",
        "source_name": "Thailand Department of Livestock Development",
        "source_url": DLD_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '30%' or destination_hs_code like '3006%' or destination_hs_code like '9018%' or destination_hs_code like '9021%' or destination_hs_code like '9022%'",
        "type": "thai_fda_drug_medical_device",
        "name": "태국 FDA 의약품·의료기기 수입등록 확인",
        "agency": "Thai Food and Drug Administration / Thai Customs",
        "basis": "Thai FDA drug and medical device import procedure",
        "summary": "의약품, 의료기기, 진단기기성 제품은 Thai FDA 수입자 등록, 제품허가, 위험등급별 등록·신고·목록화 대상 가능성이 있습니다.",
        "documents": ["제품 사양서", "성분/모델 정보", "용도 설명", "Thai FDA 등록·허가 자료(해당 시)", "라벨/사용설명서", "제조자 품질문서(해당 시)"],
        "notes": "치료 목적, 인체 사용 목적, 의료기기 등급, 진단용 여부에 따라 적용 제도와 필요 허가가 달라질 수 있습니다.",
        "source_name": "Thai FDA medical device importer service",
        "source_url": THAI_FDA_MEDICAL_DEVICE_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '3304%'",
        "type": "thai_fda_cosmetics_notification",
        "name": "태국 FDA 화장품 신고·라벨 확인",
        "agency": "Thai Food and Drug Administration / Thai Customs",
        "basis": "Thai FDA cosmetics notification and ASEAN cosmetic framework",
        "summary": "화장품은 Thai FDA 화장품 신고, 성분 제한, 라벨, 수입자 책임, 효능표현 확인 대상 가능성이 있습니다.",
        "documents": ["전성분표", "제품 라벨", "제품 정보 파일(PIF)", "수입자/책임회사 자료", "화장품 신고자료(해당 시)"],
        "notes": "의약품성 효능 표현이 있거나 치료 목적을 표방하면 화장품이 아닌 의약품 또는 의료기기 규제가 적용될 수 있습니다.",
        "source_name": "Thai FDA cosmetics service",
        "source_url": THAI_FDA_COSMETICS_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '39%' or destination_hs_code like '40%' or destination_hs_code like '68%' or destination_hs_code like '72%' or destination_hs_code like '73%' or destination_hs_code like '84%' or destination_hs_code like '85%' or destination_hs_code like '87%' or destination_hs_code like '90%' or destination_hs_code like '94%' or destination_hs_code like '95%'",
        "type": "tisi_mandatory_standard",
        "name": "태국 TISI 강제표준·제품인증 확인",
        "agency": "Thai Industrial Standards Institute / Thai Customs",
        "basis": "Thai Industrial Standards Institute mandatory standards",
        "summary": "전기전자, 기계, 철강, 고무·플라스틱, 차량부품, 완구 등 일부 제품은 TISI 강제표준, 제품인증, 수입허가 또는 적합성 확인 대상 가능성이 있습니다.",
        "documents": ["제품 사양서", "모델명/규격", "시험성적서", "TISI 인증 또는 수입허가 자료(해당 시)", "라벨/마킹 자료"],
        "notes": "TISI 대상은 HS만이 아니라 제품명, 모델, 전기정격, 적용 TIS 번호, 예외조건에 따라 판단해야 합니다.",
        "source_name": "Thai Industrial Standards Institute standard list",
        "source_url": TISI_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '8517%' or destination_hs_code like '8525%' or destination_hs_code like '8526%' or destination_hs_code like '8527%' or destination_hs_code like '8528%' or destination_hs_code like '8543%'",
        "type": "nbtc_telecom_equipment",
        "name": "태국 NBTC 통신·무선기기 승인 확인",
        "agency": "Office of the National Broadcasting and Telecommunications Commission / Thai Customs",
        "basis": "NBTC telecom and radio equipment approval",
        "summary": "통신장비, 무선기기, Wi-Fi/Bluetooth/RFID 기능 제품은 NBTC 형식승인, 기술기준 적합성, 주파수·라벨 조건 대상 가능성이 있습니다.",
        "documents": ["제품 사양서", "무선 모듈/주파수 정보", "시험성적서", "NBTC 승인 또는 신고자료(해당 시)", "모델명/제조자 정보"],
        "notes": "무선 기능 포함 여부, 주파수 대역, 완제품/부품 형태, 통신망 접속 여부에 따라 요구사항이 달라질 수 있습니다.",
        "source_name": "Office of the NBTC",
        "source_url": NBTC_SOURCE_URL,
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
  'THA',
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
  encode(digest('THA|' || heading.destination_hs_code || '|' || {sql(requirement["type"])} || '|' || {sql(requirement["name"])} || '|' || {sql(SOURCE_VERSION)}, 'sha256'), 'hex')
from (
  select distinct left(destination_hs_code, 4) as destination_hs_code
  from public.export_destination_tariff_rates
  where country_code = 'THA'
    and source_version = 'customs-country-tariff-20251231:THA'
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

    output = f"""-- Generated by scripts/generate_thailand_import_data_seed.py

begin;

delete from public.export_destination_internal_taxes
where country_code = 'THA'
  and source_version like '{SOURCE_VERSION}%';

delete from public.export_destination_import_requirements
where country_code = 'THA'
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
  'THA',
  tariff.destination_hs_code,
  'vat',
  '수입 VAT',
  '7%',
  '태국 수입 VAT 표준세율 후보',
  '태국 Revenue Department 안내 기준 현재 VAT 표준세율은 7%이며, 수입물품 VAT는 수입 시점에 Thai Customs에 납부합니다. 면세, 감면, 특정 소비세·내국세 및 품목별 예외는 별도 확인이 필요합니다.',
  'Thailand Revenue Department VAT',
  {sql(VAT_SOURCE_URL)},
  {sql(SOURCE_VERSION + ':vat')},
  date '2026-01-01',
  null::date,
  null::timestamptz,
  now(),
  'staged'::public.legal_record_status,
  encode(digest('THA|vat|7|' || tariff.destination_hs_code || '|' || {sql(SOURCE_VERSION)}, 'sha256'), 'hex')
from (
  select distinct destination_hs_code
  from public.export_destination_tariff_rates
  where country_code = 'THA'
    and source_version = 'customs-country-tariff-20251231:THA'
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
