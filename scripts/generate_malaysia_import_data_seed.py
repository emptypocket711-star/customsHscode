#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "supabase/seed/generated/malaysia_import_data_seed.sql"

SOURCE_VERSION = "malaysia-import-data-20260523"
JKDM_HS_EXPLORER_SOURCE_URL = "https://ezhs.customs.gov.my/"
MYSST_ORDERS_SOURCE_URL = "https://mysst.customs.gov.my/assets/document/SST%20Orders/order/Order_BI.html"
EPERMIT_SOURCE_URL = "https://epermit.dagangnet.com.my/"
MYTRADELINK_SOURCE_URL = "https://www.mytradelink.gov.my/epermitinfo"
MAQIS_SOURCE_URL = "https://www.maqis.gov.my/"
NPRA_SOURCE_URL = "https://www.npra.gov.my/"
NPRA_COSMETICS_FAQ_SOURCE_URL = "https://www.npra.gov.my/index.php/my/frequently-asked-questions-faqs"
SIRIM_SOURCE_URL = "https://www.sirim-qas.com.my/"
ENERGY_COMMISSION_SOURCE_URL = "https://www.st.gov.my/"

REQUIREMENTS = [
    {
        "condition": "destination_hs_code like '02%' or destination_hs_code like '03%' or destination_hs_code like '04%' or destination_hs_code like '07%' or destination_hs_code like '08%' or destination_hs_code like '09%' or destination_hs_code like '10%' or destination_hs_code like '11%' or destination_hs_code like '12%' or destination_hs_code like '15%' or destination_hs_code like '16%' or destination_hs_code like '17%' or destination_hs_code like '18%' or destination_hs_code like '19%' or destination_hs_code like '20%' or destination_hs_code like '21%' or destination_hs_code like '22%'",
        "type": "food_import_health_control",
        "name": "말레이시아 식품 수입허가·위생확인",
        "agency": "MAQIS / Ministry of Health / Royal Malaysian Customs",
        "basis": "Malaysia import permit, quarantine and food safety controls",
        "summary": "식품, 식품원료, 식품첨가물, 음료, 식품접촉 포장재는 수입허가, 위생증명, 라벨, 성분 및 검역·식품안전 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "성분표", "제품 라벨", "위생증명서 또는 자유판매증명서(해당 시)", "ePermit 또는 수입허가 자료(해당 시)"],
        "notes": "제품 유형, 원재료, 동식물성 성분, 포장 상태, 수입자 등록 및 permit issuing agency 지정 여부에 따라 조건이 달라질 수 있습니다.",
        "source_name": "myTRADELINK ePermit",
        "source_url": MYTRADELINK_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '01%' or destination_hs_code like '02%' or destination_hs_code like '03%' or destination_hs_code like '04%' or destination_hs_code like '05%' or destination_hs_code like '41%' or destination_hs_code like '42%' or destination_hs_code like '43%' or destination_hs_code like '51%'",
        "type": "maqis_animal_quarantine",
        "name": "말레이시아 MAQIS 동물검역·축산물 수입허가 확인",
        "agency": "Malaysian Quarantine and Inspection Services / Royal Malaysian Customs",
        "basis": "MAQIS import permit and inspection controls",
        "summary": "동물, 축산물, 수산물, 동물성 원료, 가죽, 모피, 양모 등은 MAQIS 수입허가, 위생증명서, 검역검사 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "동물종/원재료 정보", "위생증명서(해당 시)", "MAQIS 수입허가 자료(해당 시)", "처리·가공 증명자료(해당 시)"],
        "notes": "동물종, 질병상황, 가공상태, 식용/비식품용, permit issuing agency 지정 여부에 따라 요구사항이 달라질 수 있습니다.",
        "source_name": "Malaysian Quarantine and Inspection Services",
        "source_url": MAQIS_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '06%' or destination_hs_code like '07%' or destination_hs_code like '08%' or destination_hs_code like '10%' or destination_hs_code like '12%' or destination_hs_code like '14%' or destination_hs_code like '44%' or destination_hs_code like '45%' or destination_hs_code like '46%' or destination_hs_code like '94%'",
        "type": "maqis_plant_quarantine",
        "name": "말레이시아 MAQIS 식물검역·목재류 수입허가 확인",
        "agency": "Malaysian Quarantine and Inspection Services / Royal Malaysian Customs",
        "basis": "MAQIS import permit and phytosanitary inspection controls",
        "summary": "식물, 종자, 곡물, 과실, 식물성 원료, 목재 및 목재포장재는 식물검역증명서, 수입허가, 검역검사, 훈증 또는 처리증명 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "학명/수종 정보", "식물검역증명서(해당 시)", "MAQIS 수입허가 자료(해당 시)", "훈증/열처리 증명서(해당 시)"],
        "notes": "금지품목, 제한품목, 원산지, 수종, 가공상태, 식용/비식용에 따라 검역 조건이 달라질 수 있습니다.",
        "source_name": "Malaysian Quarantine and Inspection Services",
        "source_url": MAQIS_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '30%' or destination_hs_code like '3006%' or destination_hs_code like '9018%' or destination_hs_code like '9021%' or destination_hs_code like '9022%'",
        "type": "npra_drug_medical_device",
        "name": "말레이시아 NPRA 의약품·의료기기 수입등록 확인",
        "agency": "National Pharmaceutical Regulatory Agency / Royal Malaysian Customs",
        "basis": "Control of Drugs and Cosmetics Regulations 1984 and NPRA licensing",
        "summary": "의약품, 의료기기, 진단기기성 제품은 제품등록, 수입면허, 라벨, 제조자 품질문서, 사용목적 확인 대상 가능성이 있습니다.",
        "documents": ["제품 사양서", "성분/모델 정보", "용도 설명", "NPRA 등록 또는 수입면허 자료(해당 시)", "라벨/사용설명서", "제조자 품질문서(해당 시)"],
        "notes": "치료 목적, 인체 사용 목적, 의료기기 등급, 진단용 여부에 따라 적용 제도와 필요 허가가 달라질 수 있습니다.",
        "source_name": "National Pharmaceutical Regulatory Agency",
        "source_url": NPRA_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '3304%'",
        "type": "npra_cosmetics_notification",
        "name": "말레이시아 NPRA 화장품 신고·라벨 확인",
        "agency": "National Pharmaceutical Regulatory Agency / Royal Malaysian Customs",
        "basis": "Malaysia cosmetic product notification requirement",
        "summary": "화장품은 말레이시아 시장 출시·수입 전 NPRA 화장품 신고, 책임회사 지정, 성분 제한, 라벨 및 효능표현 확인 대상 가능성이 있습니다.",
        "documents": ["전성분표", "제품 라벨", "제품 정보자료", "책임회사/수입자 자료", "NPRA 화장품 신고자료(해당 시)"],
        "notes": "의약품성 효능 표현이 있거나 치료 목적을 표방하면 화장품이 아닌 의약품 규제가 적용될 수 있습니다.",
        "source_name": "NPRA cosmetics FAQ",
        "source_url": NPRA_COSMETICS_FAQ_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '17%' or destination_hs_code like '18%' or destination_hs_code like '19%' or destination_hs_code like '20%' or destination_hs_code like '21%' or destination_hs_code like '22%' or destination_hs_code like '25%' or destination_hs_code like '27%' or destination_hs_code like '28%' or destination_hs_code like '29%' or destination_hs_code like '33%' or destination_hs_code like '34%' or destination_hs_code like '39%' or destination_hs_code like '40%' or destination_hs_code like '68%' or destination_hs_code like '72%' or destination_hs_code like '73%' or destination_hs_code like '84%' or destination_hs_code like '85%' or destination_hs_code like '87%' or destination_hs_code like '90%' or destination_hs_code like '94%' or destination_hs_code like '95%'",
        "type": "sirim_standards_coa",
        "name": "말레이시아 SIRIM/기술표준·COA 확인",
        "agency": "SIRIM QAS International / Royal Malaysian Customs",
        "basis": "Malaysia regulated product certification and certificate of approval procedure",
        "summary": "식품, 화학, 전기전자, 기계, 철강, 건축자재, 차량부품, 완구 등 일부 제품은 SIRIM 인증, Certificate of Approval, 기술표준 또는 수입허가 대상 가능성이 있습니다.",
        "documents": ["제품 사양서", "모델명/규격", "시험성적서", "SIRIM COA 또는 인증자료(해당 시)", "라벨/마킹 자료"],
        "notes": "대상 여부는 HS만이 아니라 제품명, 모델, 전기정격, 적용 표준, 사용처와 예외조건에 따라 달라질 수 있습니다.",
        "source_name": "SIRIM QAS International",
        "source_url": SIRIM_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '8517%' or destination_hs_code like '8525%' or destination_hs_code like '8526%' or destination_hs_code like '8527%' or destination_hs_code like '8528%' or destination_hs_code like '8543%'",
        "type": "sirim_mcmc_telecom_equipment",
        "name": "말레이시아 SIRIM/MCMC 통신·무선기기 승인 확인",
        "agency": "SIRIM QAS International / Malaysian Communications and Multimedia Commission / Royal Malaysian Customs",
        "basis": "MCMC technical standards and SIRIM communication equipment approval",
        "summary": "통신장비, 무선기기, Wi-Fi/Bluetooth/RFID 기능 제품은 SIRIM 형식승인, MCMC 기술기준, 수입허가 및 라벨 조건 대상 가능성이 있습니다.",
        "documents": ["제품 사양서", "무선 모듈/주파수 정보", "시험성적서", "SIRIM/MCMC 승인 또는 신청자료(해당 시)", "모델명/제조자 정보"],
        "notes": "무선 기능 포함 여부, 주파수 대역, 완제품/부품 형태, 통신망 접속 여부에 따라 요구사항이 달라질 수 있습니다.",
        "source_name": "SIRIM communication and multimedia product certification",
        "source_url": "https://www.sirim-qas.com.my/our-services/product-certification/communication-and-multimedia-product-certification/",
    },
    {
        "condition": "destination_hs_code like '8504%' or destination_hs_code like '8516%' or destination_hs_code like '8536%' or destination_hs_code like '8544%' or destination_hs_code like '9405%'",
        "type": "energy_commission_electrical_equipment",
        "name": "말레이시아 전기제품 COA·수입승인 확인",
        "agency": "Energy Commission / SIRIM QAS International / Royal Malaysian Customs",
        "basis": "Malaysia electrical equipment certificate of approval procedure",
        "summary": "일부 가정용·상업용 전기제품과 전기부품은 Energy Commission COA, SIRIM 시험·인증, ePermit 수입승인 대상 가능성이 있습니다.",
        "documents": ["제품 사양서", "전기정격/모델 정보", "시험성적서", "COA 또는 ePermit 승인자료(해당 시)", "라벨/마킹 자료"],
        "notes": "전기제품 규제 대상은 품목, 전압, 용도, 완제품/부품 여부와 적용 안전기준에 따라 달라질 수 있습니다.",
        "source_name": "Energy Commission electrical equipment services",
        "source_url": ENERGY_COMMISSION_SOURCE_URL,
    },
]


def sql(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def doc_array(documents: list[str]) -> str:
    return ", ".join(sql(document) for document in documents)


def tax_insert(tax_type: str, tax_name: str, rate_key: str, basis: str, notes: str) -> str:
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
  'MYS',
  tariff.destination_hs_code,
  {sql(tax_type)},
  {sql(tax_name)},
  tariff.agreement_rates ->> {sql(rate_key)},
  {sql(basis)},
  {sql(notes)},
  'JKDM HS Explorer / mySST Sales Tax Orders',
  {sql(MYSST_ORDERS_SOURCE_URL)},
  {sql(SOURCE_VERSION + ':' + tax_type)},
  date '2026-01-01',
  null::date,
  null::timestamptz,
  now(),
  'staged'::public.legal_record_status,
  encode(digest('MYS|{tax_type}|' || tariff.destination_hs_code || '|' || coalesce(tariff.agreement_rates ->> {sql(rate_key)}, '') || '|' || {sql(SOURCE_VERSION)}, 'sha256'), 'hex')
from public.export_destination_tariff_rates tariff
where tariff.country_code = 'MYS'
  and tariff.source_version = 'customs-country-tariff-20251231:MYS'
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


def no_general_vat_gst_insert() -> str:
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
  'MYS',
  tariff.destination_hs_code,
  'vat',
  '수입 VAT/GST',
  '없음',
  '말레이시아 일반 VAT/GST 없음',
  '말레이시아 수입 내국세는 일반 VAT/GST가 아니라 SST 체계로 표시합니다. taxable goods 수입 판매세와 소비세가 있는 품목은 별도 SST/소비세 행으로 함께 표시됩니다.',
  'Royal Malaysian Customs Department Sales Tax',
  {sql(MYSST_ORDERS_SOURCE_URL)},
  {sql(SOURCE_VERSION + ':no-general-vat-gst')},
  date '2026-01-01',
  null::date,
  null::timestamptz,
  now(),
  'staged'::public.legal_record_status,
  encode(digest('MYS|no-general-vat-gst|' || tariff.destination_hs_code || '|' || {sql(SOURCE_VERSION)}, 'sha256'), 'hex')
from (
  select distinct destination_hs_code
  from public.export_destination_tariff_rates
  where country_code = 'MYS'
    and source_version = 'customs-country-tariff-20251231:MYS'
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
  'MYS',
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
  encode(digest('MYS|' || heading.destination_hs_code || '|' || {sql(requirement["type"])} || '|' || {sql(requirement["name"])} || '|' || {sql(SOURCE_VERSION)}, 'sha256'), 'hex')
from (
  select distinct left(destination_hs_code, 4) as destination_hs_code
  from public.export_destination_tariff_rates
  where country_code = 'MYS'
    and source_version = 'customs-country-tariff-20251231:MYS'
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

    sales_tax_notes = (
        "관세청 국가별 관세율표의 말레이시아 부가세율 컬럼을 SST 판매세 후보로 분리했습니다. "
        "mySST 고시의 면세, 5%/10% 세율, 특정세율, 저가수입품, 자유지역·보세구역·면세승인 조건은 별도 확인이 필요합니다."
    )
    excise_tax_notes = (
        "관세청 국가별 관세율표의 말레이시아 소비세율 컬럼을 소비세 후보로 분리했습니다. "
        "주류, 담배, 자동차, 석유제품 등 품목별 소비세 및 면세·감면 조건은 별도 확인이 필요합니다."
    )

    output = f"""-- Generated by scripts/generate_malaysia_import_data_seed.py

begin;

delete from public.export_destination_internal_taxes
where country_code = 'MYS'
  and source_version like '{SOURCE_VERSION}%';

delete from public.export_destination_import_requirements
where country_code = 'MYS'
  and source_version like '{SOURCE_VERSION}%';

{tax_insert('sales_tax', '수입 SST(판매세)', '부가세율', '말레이시아 수입 SST 판매세 후보', sales_tax_notes)}

{tax_insert('excise_tax', '수입 소비세', '소비세율', '말레이시아 수입 소비세 후보', excise_tax_notes)}

{no_general_vat_gst_insert()}

{requirement_sql}

commit;
"""

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(output, encoding="utf-8")
    print(f"wrote {OUTPUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
