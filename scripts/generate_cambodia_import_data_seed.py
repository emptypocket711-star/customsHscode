#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "supabase/seed/generated/cambodia_import_data_seed.sql"

SOURCE_VERSION = "cambodia-import-data-20260523"
GDCE_SOURCE_URL = "https://customs.gov.kh/en"
NTR_IMPORT_GUIDE_SOURCE_URL = "https://cambodiantr.gov.kh/en/guide-to-trade/guide-to-import-export/"
NTR_MEDICINE_COSMETICS_SOURCE_URL = "https://cambodiantr.gov.kh/en/procedure?title=application-for-import-certificate-for-medicine-cosmetics-medical-equipment"
GDT_VAT_SOURCE_URL = "https://www.tax.gov.kh/gdtwebsiteweb/en/faq"
CAMCONTROL_SOURCE_URL = "https://www.ccfdg.gov.kh/"
MAFF_SOURCE_URL = "https://www.maff.gov.kh/"
MISTI_SOURCE_URL = "https://misti.gov.kh/"
TRC_SOURCE_URL = "https://trc.gov.kh/en/radiocom-telecom-equipment-import-approval/"

REQUIREMENTS = [
    {
        "condition": "destination_hs_code like '02%' or destination_hs_code like '03%' or destination_hs_code like '04%' or destination_hs_code like '07%' or destination_hs_code like '08%' or destination_hs_code like '09%' or destination_hs_code like '10%' or destination_hs_code like '11%' or destination_hs_code like '12%' or destination_hs_code like '15%' or destination_hs_code like '16%' or destination_hs_code like '17%' or destination_hs_code like '18%' or destination_hs_code like '19%' or destination_hs_code like '20%' or destination_hs_code like '21%' or destination_hs_code like '22%'",
        "type": "food_import_quality_control",
        "name": "캄보디아 식품 수입허가·품질검사 확인",
        "agency": "CCF / MAFF / GDCE",
        "basis": "Cambodia National Trade Repository import guide and food quality controls",
        "summary": "식품, 식품원료, 식품첨가물, 음료, 식품접촉 포장재는 수입허가, 품질·안전검사, 라벨, 성분 및 위생증명 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "성분표", "제품 라벨", "수입허가 또는 등록자료(해당 시)", "위생증명서 또는 자유판매증명서(해당 시)"],
        "notes": "제품 유형, 성분, 포장 상태, 용도, 관할기관과 NTR 품목별 절차에 따라 조건이 달라질 수 있습니다.",
        "source_name": "Cambodia National Trade Repository import guide",
        "source_url": NTR_IMPORT_GUIDE_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '01%' or destination_hs_code like '02%' or destination_hs_code like '03%' or destination_hs_code like '04%' or destination_hs_code like '05%' or destination_hs_code like '41%' or destination_hs_code like '42%' or destination_hs_code like '43%' or destination_hs_code like '51%'",
        "type": "animal_quarantine",
        "name": "캄보디아 동물검역·축산물 수입허가 확인",
        "agency": "Ministry of Agriculture, Forestry and Fisheries / GDCE",
        "basis": "Cambodia animal quarantine and sanitary import controls",
        "summary": "동물, 축산물, 수산물, 동물성 원료, 가죽, 모피, 양모 등은 수입허가, 위생증명서, 검역검사 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "동물종/원재료 정보", "위생증명서(해당 시)", "수입허가 자료(해당 시)", "처리·가공 증명자료(해당 시)"],
        "notes": "동물종, 질병상황, 가공상태, 식용/비식품용, 수입허용 조건에 따라 요구사항이 달라질 수 있습니다.",
        "source_name": "Ministry of Agriculture Forestry and Fisheries Cambodia",
        "source_url": MAFF_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '06%' or destination_hs_code like '07%' or destination_hs_code like '08%' or destination_hs_code like '10%' or destination_hs_code like '12%' or destination_hs_code like '14%' or destination_hs_code like '44%' or destination_hs_code like '45%' or destination_hs_code like '46%' or destination_hs_code like '94%'",
        "type": "plant_quarantine",
        "name": "캄보디아 식물검역·목재류 수입허가 확인",
        "agency": "Ministry of Agriculture, Forestry and Fisheries / GDCE",
        "basis": "Cambodia phytosanitary and plant import controls",
        "summary": "식물, 종자, 곡물, 과실, 식물성 원료, 목재 및 목재포장재는 식물검역증명서, 수입허가, 검역검사, 훈증 또는 처리증명 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "학명/수종 정보", "식물검역증명서(해당 시)", "수입허가 자료(해당 시)", "훈증/열처리 증명서(해당 시)"],
        "notes": "금지품목, 제한품목, 원산지, 수종, 가공상태, 식용/비식용에 따라 검역 조건이 달라질 수 있습니다.",
        "source_name": "Ministry of Agriculture Forestry and Fisheries Cambodia",
        "source_url": MAFF_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '30%' or destination_hs_code like '3006%' or destination_hs_code like '9018%' or destination_hs_code like '9021%' or destination_hs_code like '9022%'",
        "type": "medicine_cosmetics_medical_equipment_import",
        "name": "캄보디아 의약품·의료기기 수입증명 확인",
        "agency": "Ministry of Health / GDCE",
        "basis": "Application for Import Certificate for Medicine, Cosmetics and Medical Equipment",
        "summary": "의약품, 의료기기, 진단기기성 제품은 보건부 수입증명, 제품등록, 수입기관 허가, 라벨 및 사용목적 확인 대상 가능성이 있습니다.",
        "documents": ["Shipping invoice 또는 Air invoice", "상업송장", "포장명세서", "수입 대상 제품 목록", "제품등록 또는 수입증명 자료(해당 시)", "라벨/사용설명서"],
        "notes": "NTR 절차상 의약품, 화장품, 의료기기는 제품등록과 수입기관 자격이 먼저 요구될 수 있습니다.",
        "source_name": "Cambodia NTR import certificate for medicine cosmetics medical equipment",
        "source_url": NTR_MEDICINE_COSMETICS_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '3304%'",
        "type": "cosmetics_import_certificate",
        "name": "캄보디아 화장품 수입증명·라벨 확인",
        "agency": "Ministry of Health / GDCE",
        "basis": "Application for Import Certificate for Medicine, Cosmetics and Medical Equipment",
        "summary": "화장품은 보건부 수입증명, 제품등록, 성분 제한, 라벨, 효능표현 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "전성분표", "제품 라벨", "수입 대상 화장품 목록", "수입증명 또는 등록자료(해당 시)"],
        "notes": "의약품성 효능 표현이 있거나 치료 목적을 표방하면 화장품이 아닌 의약품 규제가 적용될 수 있습니다.",
        "source_name": "Cambodia NTR import certificate for medicine cosmetics medical equipment",
        "source_url": NTR_MEDICINE_COSMETICS_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '17%' or destination_hs_code like '18%' or destination_hs_code like '19%' or destination_hs_code like '20%' or destination_hs_code like '21%' or destination_hs_code like '22%' or destination_hs_code like '25%' or destination_hs_code like '27%' or destination_hs_code like '28%' or destination_hs_code like '29%' or destination_hs_code like '33%' or destination_hs_code like '34%' or destination_hs_code like '39%' or destination_hs_code like '40%' or destination_hs_code like '68%' or destination_hs_code like '72%' or destination_hs_code like '73%' or destination_hs_code like '84%' or destination_hs_code like '85%' or destination_hs_code like '87%' or destination_hs_code like '90%' or destination_hs_code like '94%' or destination_hs_code like '95%'",
        "type": "technical_standard_quality_control",
        "name": "캄보디아 기술표준·품질검사 확인",
        "agency": "MISTI / CCF / GDCE",
        "basis": "Cambodia technical regulation, standard and quality inspection controls",
        "summary": "식품, 화학, 전기전자, 기계, 건축자재, 차량부품, 소비재 등 일부 제품은 기술표준, 품질검사, 라벨 또는 수입허가 대상 가능성이 있습니다.",
        "documents": ["제품 사양서", "모델명/규격", "시험성적서", "인증 또는 검사자료(해당 시)", "라벨/마킹 자료"],
        "notes": "대상 여부는 HS만이 아니라 제품명, 모델, 전기정격, 적용 표준, 사용처와 품목별 NTR 절차에 따라 달라질 수 있습니다.",
        "source_name": "Ministry of Industry Science Technology and Innovation Cambodia",
        "source_url": MISTI_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '8517%' or destination_hs_code like '8525%' or destination_hs_code like '8526%' or destination_hs_code like '8527%' or destination_hs_code like '8528%' or destination_hs_code like '8543%'",
        "type": "trc_telecom_equipment",
        "name": "캄보디아 통신·무선기기 수입승인 확인",
        "agency": "Telecommunication Regulator of Cambodia / GDCE",
        "basis": "TRC radiocommunication and telecommunication equipment import approval",
        "summary": "통신장비, 무선기기, Wi-Fi/Bluetooth/RFID 기능 제품은 TRC 수입허가, 형식승인, 주파수·라벨 조건 대상 가능성이 있습니다.",
        "documents": ["제품 사양서", "무선 모듈/주파수 정보", "시험성적서", "TRC 수입허가 또는 승인자료(해당 시)", "모델명/제조자 정보"],
        "notes": "무선 기능 포함 여부, 주파수 대역, 완제품/부품 형태, 통신망 접속 여부에 따라 요구사항이 달라질 수 있습니다.",
        "source_name": "Telecommunication Regulator of Cambodia import approval",
        "source_url": TRC_SOURCE_URL,
    },
]


def sql(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def doc_array(documents: list[str]) -> str:
    return ", ".join(sql(document) for document in documents)


def tax_insert(tax_type: str, tax_name: str, rate_key: str, basis: str, notes: str, source_url: str) -> str:
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
  'CAM',
  tariff.destination_hs_code,
  {sql(tax_type)},
  {sql(tax_name)},
  tariff.agreement_rates ->> {sql(rate_key)},
  {sql(basis)},
  {sql(notes)},
  'GDCE Cambodia customs tariff',
  {sql(source_url)},
  {sql(SOURCE_VERSION + ':' + tax_type)},
  date '2026-01-01',
  null::date,
  null::timestamptz,
  now(),
  'staged'::public.legal_record_status,
  encode(digest('CAM|{tax_type}|' || tariff.destination_hs_code || '|' || coalesce(tariff.agreement_rates ->> {sql(rate_key)}, '') || '|' || {sql(SOURCE_VERSION)}, 'sha256'), 'hex')
from public.export_destination_tariff_rates tariff
where tariff.country_code = 'CAM'
  and tariff.source_version = 'customs-country-tariff-20251231:CAM'
  and tariff.agreement_rates ? {sql(rate_key)}
  and nullif(btrim(tariff.agreement_rates ->> {sql(rate_key)}), '') is not null
  and btrim(tariff.agreement_rates ->> {sql(rate_key)}) <> '-'
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
  'CAM',
  tariff.destination_hs_code,
  'vat',
  '수입 VAT',
  '10%',
  '캄보디아 수입 VAT 표준세율 후보',
  'GDT VAT FAQ 기준 일반 VAT는 10%입니다. GDCE 관세율표에 별도 부가세 컬럼 값이 있는 품목은 해당 품목별 행을 우선 사용하며, 면세, 투자 인센티브, 정부부담 VAT, 특정 공급 또는 품목별 예외는 별도 확인이 필요합니다.',
  'General Department of Taxation VAT FAQ',
  {sql(GDT_VAT_SOURCE_URL)},
  {sql(SOURCE_VERSION + ':vat-standard-10-fallback')},
  date '2026-01-01',
  null::date,
  null::timestamptz,
  now(),
  'staged'::public.legal_record_status,
  encode(digest('CAM|vat-standard-10|' || tariff.destination_hs_code || '|' || {sql(SOURCE_VERSION)}, 'sha256'), 'hex')
from public.export_destination_tariff_rates tariff
where tariff.country_code = 'CAM'
  and tariff.source_version = 'customs-country-tariff-20251231:CAM'
  and not exists (
    select 1
    from public.export_destination_internal_taxes existing
    where existing.country_code = 'CAM'
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
  'CAM',
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
  encode(digest('CAM|' || heading.destination_hs_code || '|' || {sql(requirement["type"])} || '|' || {sql(requirement["name"])} || '|' || {sql(SOURCE_VERSION)}, 'sha256'), 'hex')
from (
  select distinct left(destination_hs_code, 4) as destination_hs_code
  from public.export_destination_tariff_rates
  where country_code = 'CAM'
    and source_version = 'customs-country-tariff-20251231:CAM'
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

    output = f"""-- Generated by scripts/generate_cambodia_import_data_seed.py

begin;

delete from public.export_destination_internal_taxes
where country_code = 'CAM'
  and source_version like '{SOURCE_VERSION}%';

delete from public.export_destination_import_requirements
where country_code = 'CAM'
  and source_version like '{SOURCE_VERSION}%';

{tax_insert('vat', '수입 VAT', '부가세', '캄보디아 수입 VAT 후보', 'GDCE 관세율표의 부가세 컬럼을 수입 VAT 후보로 분리했습니다. GDT 안내 기준 일반 VAT는 10%이며, 면세, 투자 인센티브, 정부부담 VAT, 특정 공급 또는 품목별 예외는 별도 확인이 필요합니다.', GDT_VAT_SOURCE_URL)}

{standard_vat_fallback_insert()}

{tax_insert('special_tax', '수입 특별세', '특별세', '캄보디아 수입 특별세 후보', 'GDCE 관세율표의 특별세 컬럼을 수입 특별세 후보로 분리했습니다. 주류, 담배, 차량, 석유제품 등 품목별 특별세와 감면·면세 조건은 별도 확인이 필요합니다.', GDCE_SOURCE_URL)}

{requirement_sql}

commit;
"""

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(output, encoding="utf-8")
    print(f"wrote {OUTPUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
