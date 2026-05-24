#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "supabase/seed/generated/india_import_data_seed.sql"

SOURCE_VERSION = "india-import-data-20260523"
GST_RATES_SOURCE_URL = "https://cbic-gst.gov.in/gst-goods-services-rates.html"
DGFT_ITC_HS_SOURCE_URL = "https://www.dgft.gov.in/CP/?opt=itchs-import-export"
FSSAI_IMPORT_SOURCE_URL = "https://www.fssai.gov.in/cms/imports.php"
PLANT_QUARANTINE_SOURCE_URL = "https://pqms.cgg.gov.in/pqms-angular/home"
ANIMAL_QUARANTINE_SOURCE_URL = "https://aqcsindia.gov.in/"
CDSCO_COSMETICS_SOURCE_URL = "https://cdsco.gov.in/opencms/opencms/en/Cosmetics/"
CDSCO_IMPORT_SOURCE_URL = "https://cdsco.gov.in/opencms/opencms/en/Import-and-Registration/"
BIS_QCO_SOURCE_URL = "https://www.bis.gov.in/product-certification/products-under-compulsory-certification/?lang=en"
DOT_IMPORT_LICENSE_SOURCE_URL = "https://deveservices.dot.gov.in/import-license"

REQUIREMENTS = [
    {
        "condition": "destination_hs_code like '02%' or destination_hs_code like '03%' or destination_hs_code like '04%' or destination_hs_code like '07%' or destination_hs_code like '08%' or destination_hs_code like '09%' or destination_hs_code like '10%' or destination_hs_code like '11%' or destination_hs_code like '12%' or destination_hs_code like '15%' or destination_hs_code like '16%' or destination_hs_code like '17%' or destination_hs_code like '18%' or destination_hs_code like '19%' or destination_hs_code like '20%' or destination_hs_code like '21%' or destination_hs_code like '22%'",
        "type": "fssai_food_import_clearance",
        "name": "인도 FSSAI 식품 수입통관 확인",
        "agency": "Food Safety and Standards Authority of India / Indian Customs",
        "basis": "Food Safety and Standards Act / Food Import Clearance System",
        "summary": "식품, 식품원료, 식품접촉 가능 제품은 FSSAI Food Import Clearance System, 라벨, 성분, 검사 또는 NOC 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "성분표", "제조공정 또는 용도 설명", "원산지증명 또는 위생증명서(해당 시)", "라벨 견본", "FSSAI 관련 허가/등록 자료(해당 시)"],
        "notes": "FSSAI 결과는 품목, 성분, 최종용도, 항만/공항, 수입자 자격에 따라 달라질 수 있으므로 HS만으로 확정하지 않습니다.",
        "source_name": "FSSAI Food Import Clearance System",
        "source_url": FSSAI_IMPORT_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '06%' or destination_hs_code like '07%' or destination_hs_code like '08%' or destination_hs_code like '10%' or destination_hs_code like '12%' or destination_hs_code like '14%' or destination_hs_code like '44%' or destination_hs_code like '45%' or destination_hs_code like '46%' or destination_hs_code like '94%'",
        "type": "plant_quarantine",
        "name": "인도 식물검역·목재류 수입조건 확인",
        "agency": "Directorate of Plant Protection, Quarantine and Storage / Indian Customs",
        "basis": "Plant Quarantine Order / PQMS import permit and inspection process",
        "summary": "식물, 종자, 곡물, 식물성 원료, 목재 및 목재포장재는 수입허가, 식물검역증명서, 검사, 훈증 또는 처리증명 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "학명/수종 정보", "식물검역증명서(해당 시)", "수입허가 또는 PQMS 자료(해당 시)", "훈증/열처리 증명서(해당 시)"],
        "notes": "수종, 가공 정도, 껍질 포함 여부, 용도, 원산지별 검역조건에 따라 요구서류가 달라질 수 있습니다.",
        "source_name": "India Plant Quarantine Management System",
        "source_url": PLANT_QUARANTINE_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '01%' or destination_hs_code like '02%' or destination_hs_code like '03%' or destination_hs_code like '04%' or destination_hs_code like '05%' or destination_hs_code like '41%' or destination_hs_code like '42%' or destination_hs_code like '43%' or destination_hs_code like '51%'",
        "type": "animal_quarantine",
        "name": "인도 동물검역·동물성 제품 수입조건 확인",
        "agency": "Animal Quarantine and Certification Services / Indian Customs",
        "basis": "Livestock Importation Act and animal quarantine import procedure",
        "summary": "동물, 축산물, 수산물, 가죽, 모피, 양모 등 동물성 제품은 수입허가, 위생증명서, 검역검사 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "동물종/원재료 정보", "위생증명서(해당 시)", "처리·가공 증명자료(해당 시)", "AQCS 수입허가 자료(해당 시)"],
        "notes": "동물종, 가공상태, 식품용/비식품용, 원산지의 질병상황과 인도 검역조건에 따라 결과가 달라질 수 있습니다.",
        "source_name": "Animal Quarantine and Certification Services India",
        "source_url": ANIMAL_QUARANTINE_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '30%' or destination_hs_code like '3006%' or destination_hs_code like '9018%' or destination_hs_code like '9021%' or destination_hs_code like '9022%'",
        "type": "cdsco_drug_medical_device",
        "name": "인도 CDSCO 의약품·의료기기 수입등록 확인",
        "agency": "Central Drugs Standard Control Organisation / Indian Customs",
        "basis": "Drugs and Cosmetics Act / Medical Device Rules / CDSCO import registration",
        "summary": "의약품, 의료기기성 제품, 진단기기 등은 CDSCO 수입등록, 라이선스, 제품분류, 라벨 및 수입자 자격 확인 대상 가능성이 있습니다.",
        "documents": ["제품 사양서", "성분/모델 정보", "용도 설명", "CDSCO 등록·허가 자료(해당 시)", "라벨/사용설명서", "제조자 품질문서(해당 시)"],
        "notes": "치료 목적, 인체 사용 목적, 의료기기 등급, 진단용 여부에 따라 적용 제도와 필요 허가가 달라질 수 있습니다.",
        "source_name": "CDSCO import and registration",
        "source_url": CDSCO_IMPORT_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '3304%'",
        "type": "cdsco_cosmetics",
        "name": "인도 CDSCO 화장품 수입등록 확인",
        "agency": "Central Drugs Standard Control Organisation / Indian Customs",
        "basis": "Drugs and Cosmetics Act / Cosmetics Rules / cosmetic import registration",
        "summary": "화장품은 인도 수입 전 CDSCO Import Registration Certificate, 성분 제한, 라벨 표시, 수입자/대리인 자격 확인 대상 가능성이 있습니다.",
        "documents": ["전성분표", "제품 라벨", "제조자 정보", "제품 기능/효능 설명", "CDSCO 화장품 수입등록 자료(해당 시)"],
        "notes": "의약품성 효능 표현이나 치료 목적 표시가 있으면 화장품이 아닌 의약품 또는 의료기기 규제가 적용될 수 있습니다.",
        "source_name": "CDSCO cosmetics import registration",
        "source_url": CDSCO_COSMETICS_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '28%' or destination_hs_code like '29%' or destination_hs_code like '32%' or destination_hs_code like '38%' or destination_hs_code like '39%' or destination_hs_code like '40%' or destination_hs_code like '68%' or destination_hs_code like '72%' or destination_hs_code like '73%' or destination_hs_code like '84%' or destination_hs_code like '85%' or destination_hs_code like '87%' or destination_hs_code like '90%' or destination_hs_code like '94%'",
        "type": "bis_qco",
        "name": "인도 BIS 강제인증·품질관리명령(QCO) 확인",
        "agency": "Bureau of Indian Standards / relevant line ministry / Indian Customs",
        "basis": "BIS Act / Quality Control Orders / Compulsory Certification scheme",
        "summary": "철강, 화학, 전기전자, 기계, 자동차부품, 의료·측정기기, 가구 등 일부 품목은 BIS 표준마크, QCO, CRS 또는 적합성 인증 대상 가능성이 있습니다.",
        "documents": ["제품 사양서", "모델명/규격", "시험성적서", "BIS 라이선스 또는 CoC 자료(해당 시)", "제조자 정보", "라벨/마킹 자료"],
        "notes": "BIS 대상은 HS만이 아니라 품목명, 규격, 모델, 적용 QCO의 시행일과 예외조건으로 판단해야 합니다.",
        "source_name": "Bureau of Indian Standards compulsory certification products",
        "source_url": BIS_QCO_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '8517%' or destination_hs_code like '8525%' or destination_hs_code like '8526%' or destination_hs_code like '8527%' or destination_hs_code like '8528%' or destination_hs_code like '8543%' or destination_hs_code like '9503%'",
        "type": "dot_wpc_wireless",
        "name": "인도 무선·통신기기 수입허가 확인",
        "agency": "Department of Telecommunications WPC Wing / Indian Customs",
        "basis": "Wireless equipment import licence and equipment type approval process",
        "summary": "Wi-Fi, Bluetooth, RFID, 이동통신, 송수신기 등 무선 기능이 있는 물품은 WPC/DoT 수입허가 또는 형식승인 대상 가능성이 있습니다.",
        "documents": ["제품 사양서", "무선 모듈/주파수 정보", "시험성적서", "ETA 또는 수입허가 자료(해당 시)", "모델명/제조자 정보"],
        "notes": "무선 기능 포함 여부, 주파수 대역, 면허면제 대역 해당 여부, 완제품/모듈 수입 형태에 따라 요구사항이 달라질 수 있습니다.",
        "source_name": "Department of Telecom eServices import license",
        "source_url": DOT_IMPORT_LICENSE_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '27%' or destination_hs_code like '28%' or destination_hs_code like '29%' or destination_hs_code like '30%' or destination_hs_code like '38%' or destination_hs_code like '72%' or destination_hs_code like '73%' or destination_hs_code like '84%' or destination_hs_code like '85%' or destination_hs_code like '87%' or destination_hs_code like '90%'",
        "type": "dgft_itc_hs_import_policy",
        "name": "인도 DGFT ITC(HS) 수입정책 상태 확인",
        "agency": "Directorate General of Foreign Trade / Indian Customs",
        "basis": "ITC(HS) Import Policy Schedule 1",
        "summary": "일부 품목은 DGFT ITC(HS) 기준 Free, Restricted, Prohibited, STE, Policy Condition 등 수입정책 상태 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "제품 사양서", "용도 설명", "DGFT 라이선스 또는 정책조건 충족자료(해당 시)"],
        "notes": "현재 매핑은 위험 품목군 후보입니다. 실제 제한·금지·정책조건 여부는 인도 ITC(HS) 품목별 수입정책 상태로 좁혀야 합니다.",
        "source_name": "DGFT ITC(HS) Import Policy",
        "source_url": DGFT_ITC_HS_SOURCE_URL,
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
  'IND',
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
  encode(digest('IND|' || heading.destination_hs_code || '|' || {sql(requirement["type"])} || '|' || {sql(requirement["name"])} || '|' || {sql(SOURCE_VERSION)}, 'sha256'), 'hex')
from (
  select distinct left(destination_hs_code, 4) as destination_hs_code
  from public.export_destination_tariff_rates
  where country_code = 'IND'
    and source_version = 'customs-country-tariff-20251231:IND'
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

    output = f"""-- Generated by scripts/generate_india_import_data_seed.py

begin;

delete from public.export_destination_internal_taxes
where country_code = 'IND'
  and source_version like '{SOURCE_VERSION}%';

delete from public.export_destination_import_requirements
where country_code = 'IND'
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
  'IND',
  tariff.destination_hs_code,
  'igst',
  '수입 IGST',
  '18%',
  '인도 수입 IGST 표준세율 후보',
  'CBIC GST rate table 기준 일반 IGST 18% 후보입니다. 실제 인도 수입세액은 Basic Customs Duty, Social Welfare Surcharge, IGST, Compensation Cess 및 품목별 감면·예외를 함께 계산해야 하며, GST rate schedule 매핑 전까지는 표준세율 후보로 표시합니다.',
  'CBIC GST Goods and Services Rates',
  {sql(GST_RATES_SOURCE_URL)},
  {sql(SOURCE_VERSION + ':igst')},
  date '2026-01-01',
  null::date,
  null::timestamptz,
  now(),
  'staged'::public.legal_record_status,
  encode(digest('IND|igst|18|' || tariff.destination_hs_code || '|' || {sql(SOURCE_VERSION)}, 'sha256'), 'hex')
from (
  select distinct destination_hs_code
  from public.export_destination_tariff_rates
  where country_code = 'IND'
    and source_version = 'customs-country-tariff-20251231:IND'
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
