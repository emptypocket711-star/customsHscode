#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "supabase/seed/generated/vietnam_import_data_seed.sql"

SOURCE_VERSION = "vietnam-import-data-20260523"
VAT_SOURCE_URL = "https://www.customs.gov.vn/"
VNSW_SOURCE_URL = "https://vnsw.gov.vn/"
FOOD_INSPECTION_SOURCE_URL = "https://nifc.gov.vn/en/imported-food-inspection"
COSMETICS_SOURCE_URL = "https://dav.gov.vn/"
MARD_SOURCE_URL = "https://www.mard.gov.vn/"
MIC_SOURCE_URL = "https://mic.gov.vn/"
MOST_SOURCE_URL = "https://www.most.gov.vn/"

REQUIREMENTS = [
    {
        "condition": "destination_hs_code like '02%' or destination_hs_code like '03%' or destination_hs_code like '04%' or destination_hs_code like '07%' or destination_hs_code like '08%' or destination_hs_code like '09%' or destination_hs_code like '10%' or destination_hs_code like '11%' or destination_hs_code like '12%' or destination_hs_code like '15%' or destination_hs_code like '16%' or destination_hs_code like '17%' or destination_hs_code like '18%' or destination_hs_code like '19%' or destination_hs_code like '20%' or destination_hs_code like '21%' or destination_hs_code like '22%'",
        "type": "food_safety_inspection",
        "name": "베트남 수입식품 안전검사 확인",
        "agency": "Ministry of Health / Vietnam Customs",
        "basis": "Vietnam food safety import inspection and National Single Window procedure",
        "summary": "식품, 식품첨가물, 식품접촉 포장재 등은 수입식품 안전검사, 제품공표, 검사면제 또는 검사방식 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "성분표", "제품 라벨", "식품안전 검사 등록자료(해당 시)", "위생증명서 또는 원산지증명서(해당 시)"],
        "notes": "식품 유형, 성분, 포장 상태, 수입자 자격, 검사 이력에 따라 일반검사·간소검사·면제 여부가 달라질 수 있습니다.",
        "source_name": "Vietnam imported food inspection",
        "source_url": FOOD_INSPECTION_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '01%' or destination_hs_code like '02%' or destination_hs_code like '03%' or destination_hs_code like '04%' or destination_hs_code like '05%' or destination_hs_code like '06%' or destination_hs_code like '07%' or destination_hs_code like '08%' or destination_hs_code like '10%' or destination_hs_code like '12%' or destination_hs_code like '14%' or destination_hs_code like '41%' or destination_hs_code like '42%' or destination_hs_code like '43%' or destination_hs_code like '44%' or destination_hs_code like '45%' or destination_hs_code like '46%' or destination_hs_code like '51%' or destination_hs_code like '94%'",
        "type": "mard_quarantine",
        "name": "베트남 동식물검역·농림수산물 전문검사 확인",
        "agency": "Ministry of Agriculture and Rural Development / Vietnam Customs",
        "basis": "MARD quarantine and specialized inspection procedures",
        "summary": "동물, 식물, 농림수산물, 목재류 및 관련 제품은 검역허가, 위생·식물검역증명서, 전문검사 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "학명/수종/동물종 정보", "검역증명서(해당 시)", "수입허가 또는 전문검사 자료(해당 시)", "처리·가공 증명자료(해당 시)"],
        "notes": "원산지, 가공상태, 수종·동물종, 식용/비식용, 위험관리 결과에 따라 검역 조건이 달라질 수 있습니다.",
        "source_name": "Vietnam Ministry of Agriculture and Rural Development",
        "source_url": MARD_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '30%' or destination_hs_code like '3006%' or destination_hs_code like '9018%' or destination_hs_code like '9021%' or destination_hs_code like '9022%'",
        "type": "moh_drug_medical_device",
        "name": "베트남 의약품·의료기기 수입허가 확인",
        "agency": "Ministry of Health / Drug Administration of Vietnam / Vietnam Customs",
        "basis": "MOH pharmaceutical and medical-device import management",
        "summary": "의약품, 의료기기, 진단기기성 제품은 제품등록, 수입허가, 유통허가, 라벨 및 수입자 자격 확인 대상 가능성이 있습니다.",
        "documents": ["제품 사양서", "성분/모델 정보", "용도 설명", "MOH/DAV 등록·허가 자료(해당 시)", "라벨/사용설명서", "제조자 품질문서(해당 시)"],
        "notes": "치료 목적, 의료기기 등급, 인체 사용 목적, 진단용 여부에 따라 적용 제도와 필요 허가가 달라질 수 있습니다.",
        "source_name": "Drug Administration of Vietnam",
        "source_url": COSMETICS_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '3304%'",
        "type": "moh_cosmetics_notification",
        "name": "베트남 화장품 제품공표·라벨 확인",
        "agency": "Ministry of Health / Drug Administration of Vietnam / Vietnam Customs",
        "basis": "Vietnam cosmetics management and ASEAN cosmetic notification framework",
        "summary": "화장품은 베트남 내 책임회사 기준 제품공표 접수번호, 성분 제한, 라벨, 효능표현 확인 대상 가능성이 있습니다.",
        "documents": ["전성분표", "제품 라벨", "위임장 또는 책임회사 자료", "제품 정보 파일(PIF)", "화장품 제품공표 접수자료(해당 시)"],
        "notes": "의약품성 효능 표현이 있거나 치료 목적을 표방하면 화장품이 아닌 의약품 또는 의료기기 규제가 적용될 수 있습니다.",
        "source_name": "Drug Administration of Vietnam cosmetics management",
        "source_url": COSMETICS_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '84%' or destination_hs_code like '85%' or destination_hs_code like '90%' or destination_hs_code like '94%' or destination_hs_code like '95%'",
        "type": "quality_conformity_inspection",
        "name": "베트남 품질·적합성 전문검사 확인",
        "agency": "Ministry of Science and Technology / line ministries / Vietnam Customs",
        "basis": "Vietnam specialized inspection and conformity assessment procedures",
        "summary": "전기전자, 기계, 측정기기, 완구 등 일부 제품은 품질검사, 적합성 인증, 표준·기술규정 확인 대상 가능성이 있습니다.",
        "documents": ["제품 사양서", "모델명/규격", "시험성적서", "적합성 인증 또는 품질검사 자료(해당 시)", "라벨/마킹 자료"],
        "notes": "품목명, 모델, 기술규정(QCVN/TCVN), 적용 부처와 시행일에 따라 대상 여부가 달라질 수 있습니다.",
        "source_name": "Vietnam Ministry of Science and Technology",
        "source_url": MOST_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '8517%' or destination_hs_code like '8525%' or destination_hs_code like '8526%' or destination_hs_code like '8527%' or destination_hs_code like '8528%' or destination_hs_code like '8543%'",
        "type": "mic_telecom_equipment",
        "name": "베트남 정보통신·무선기기 인증 확인",
        "agency": "Ministry of Information and Communications / Vietnam Customs",
        "basis": "MIC telecom and radio equipment conformity management",
        "summary": "통신장비, 무선기기, Wi-Fi/Bluetooth/RFID 기능 제품은 MIC 형식승인, 적합성 선언, 주파수·라벨 조건 대상 가능성이 있습니다.",
        "documents": ["제품 사양서", "무선 모듈/주파수 정보", "시험성적서", "MIC 인증 또는 적합성 선언 자료(해당 시)", "모델명/제조자 정보"],
        "notes": "무선 기능 포함 여부, 주파수 대역, 완제품/부품 형태, 베트남 기술규정 대상 여부에 따라 요구사항이 달라질 수 있습니다.",
        "source_name": "Vietnam Ministry of Information and Communications",
        "source_url": MIC_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '27%' or destination_hs_code like '28%' or destination_hs_code like '29%' or destination_hs_code like '30%' or destination_hs_code like '38%' or destination_hs_code like '39%' or destination_hs_code like '40%' or destination_hs_code like '72%' or destination_hs_code like '73%' or destination_hs_code like '84%' or destination_hs_code like '85%' or destination_hs_code like '87%' or destination_hs_code like '90%'",
        "type": "vnsw_specialized_inspection",
        "name": "베트남 국가싱글윈도우 전문검사·수입허가 확인",
        "agency": "Vietnam National Single Window / line ministries / Vietnam Customs",
        "basis": "Vietnam National Single Window and specialized inspection procedure",
        "summary": "화학, 기계, 전기전자, 철강, 차량부품 등 일부 품목은 국가싱글윈도우를 통한 전문검사, 수입허가, 정책조건 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "제품 사양서", "용도 설명", "수입허가 또는 전문검사 자료(해당 시)", "안전·품질 인증자료(해당 시)"],
        "notes": "현재 매핑은 위험 품목군 후보입니다. 실제 대상 여부는 베트남 품목별 전문검사 목록, 수입정책, 담당 부처 절차로 좁혀야 합니다.",
        "source_name": "Vietnam National Single Window",
        "source_url": VNSW_SOURCE_URL,
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
  'VNM',
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
  encode(digest('VNM|' || heading.destination_hs_code || '|' || {sql(requirement["type"])} || '|' || {sql(requirement["name"])} || '|' || {sql(SOURCE_VERSION)}, 'sha256'), 'hex')
from (
  select distinct left(destination_hs_code, 4) as destination_hs_code
  from public.export_destination_tariff_rates
  where country_code = 'VNM'
    and source_version = 'customs-country-tariff-20251231:VNM'
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

    output = f"""-- Generated by scripts/generate_vietnam_import_data_seed.py

begin;

delete from public.export_destination_internal_taxes
where country_code = 'VNM'
  and source_version like '{SOURCE_VERSION}%';

delete from public.export_destination_import_requirements
where country_code = 'VNM'
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
  'VNM',
  tariff.destination_hs_code,
  'vat',
  '수입 VAT',
  '10%',
  '베트남 수입 VAT 표준세율 후보',
  '베트남 수입물품 VAT 표준세율 후보입니다. 품목별 0%, 5%, 비과세, 감면 또는 한시적 세율 조정 대상 여부는 베트남 VAT 법령과 품목별 HS 매핑으로 별도 확인해야 합니다.',
  'Vietnam Customs import tax and VAT guidance',
  {sql(VAT_SOURCE_URL)},
  {sql(SOURCE_VERSION + ':vat')},
  date '2026-01-01',
  null::date,
  null::timestamptz,
  now(),
  'staged'::public.legal_record_status,
  encode(digest('VNM|vat|10|' || tariff.destination_hs_code || '|' || {sql(SOURCE_VERSION)}, 'sha256'), 'hex')
from (
  select distinct destination_hs_code
  from public.export_destination_tariff_rates
  where country_code = 'VNM'
    and source_version = 'customs-country-tariff-20251231:VNM'
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
