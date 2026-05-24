#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "supabase/seed/generated/indonesia_import_data_seed.sql"

SOURCE_VERSION = "indonesia-import-data-20260523"
VAT_SOURCE_URL = "https://www.pajak.go.id/id/siaran-pers/ppn-2025-kebijakan-baru-beban-pajak-tetap-ringan-untuk-masyarakat"
INSW_SOURCE_URL = "https://insw.go.id/"
BPOM_EXIM_SOURCE_URL = "https://exim.pom.go.id/"
BSN_SNI_SOURCE_URL = "https://sispk-v2.bsn.go.id/artikel/index/read/alur-proses-sni"
QUARANTINE_SOURCE_URL = "https://karantinaindonesia.go.id/"
HALAL_SOURCE_URL = "https://bpjph.halal.go.id/"
POSTEL_SOURCE_URL = "https://sertifikasi.postel.go.id/"

REQUIREMENTS = [
    {
        "condition": "destination_hs_code like '02%' or destination_hs_code like '03%' or destination_hs_code like '04%' or destination_hs_code like '07%' or destination_hs_code like '08%' or destination_hs_code like '09%' or destination_hs_code like '10%' or destination_hs_code like '11%' or destination_hs_code like '12%' or destination_hs_code like '15%' or destination_hs_code like '16%' or destination_hs_code like '17%' or destination_hs_code like '18%' or destination_hs_code like '19%' or destination_hs_code like '20%' or destination_hs_code like '21%' or destination_hs_code like '22%'",
        "type": "bpom_food_import",
        "name": "인도네시아 BPOM 식품 수입허가·등록 확인",
        "agency": "Badan Pengawas Obat dan Makanan / Indonesia Customs",
        "basis": "BPOM e-BPOM import certificate and food registration procedure",
        "summary": "가공식품, 식품첨가물, 식품원료, 식품접촉 포장재는 BPOM 등록, SKI 수입확인, 라벨, 성분 및 수입자 자격 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "성분표", "제품 라벨", "BPOM 등록 또는 SKI 자료(해당 시)", "위생증명서 또는 원산지증명서(해당 시)"],
        "notes": "식품 유형, 성분, 포장 상태, 할랄 표시, 수입자 자격과 BPOM 분류에 따라 등록·검사·면제 여부가 달라질 수 있습니다.",
        "source_name": "BPOM e-BPOM import/export permit service",
        "source_url": BPOM_EXIM_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '01%' or destination_hs_code like '02%' or destination_hs_code like '03%' or destination_hs_code like '04%' or destination_hs_code like '05%' or destination_hs_code like '06%' or destination_hs_code like '07%' or destination_hs_code like '08%' or destination_hs_code like '10%' or destination_hs_code like '12%' or destination_hs_code like '14%' or destination_hs_code like '41%' or destination_hs_code like '42%' or destination_hs_code like '43%' or destination_hs_code like '44%' or destination_hs_code like '45%' or destination_hs_code like '46%' or destination_hs_code like '51%'",
        "type": "quarantine_import",
        "name": "인도네시아 동식물검역·검역허가 확인",
        "agency": "Indonesian Quarantine Authority / Indonesia Customs",
        "basis": "Indonesia quarantine inspection and import permit procedure",
        "summary": "동물, 식물, 농수산물, 목재, 가죽, 모피, 양모 등은 수입허가, 검역증명서, 검역검사, 처리증명 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "학명/동물종/수종 정보", "검역증명서(해당 시)", "수입허가 자료(해당 시)", "처리·가공 증명자료(해당 시)"],
        "notes": "원산지 질병·병해충 위험, 품목 상태, 식용/비식용, 가공 정도에 따라 검역 조건이 달라질 수 있습니다.",
        "source_name": "Indonesian Quarantine Authority",
        "source_url": QUARANTINE_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '30%' or destination_hs_code like '3006%' or destination_hs_code like '9018%' or destination_hs_code like '9021%' or destination_hs_code like '9022%'",
        "type": "bpom_drug_medical_device",
        "name": "인도네시아 의약품·의료기기 수입허가 확인",
        "agency": "Badan Pengawas Obat dan Makanan / Ministry of Health / Indonesia Customs",
        "basis": "BPOM and Ministry of Health import control procedure",
        "summary": "의약품, 전통의약품, 건강보조식품, 의료기기, 진단기기성 제품은 제품등록, 수입확인, 유통허가, 위험등급별 허가 대상 가능성이 있습니다.",
        "documents": ["제품 사양서", "성분/모델 정보", "용도 설명", "BPOM 또는 보건부 등록·허가 자료(해당 시)", "라벨/사용설명서", "제조자 품질문서(해당 시)"],
        "notes": "인체 사용 목적, 치료 효능 표현, 의료기기 등급, 진단용 여부에 따라 담당 기관과 허가 절차가 달라질 수 있습니다.",
        "source_name": "BPOM e-BPOM import/export permit service",
        "source_url": BPOM_EXIM_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '3304%'",
        "type": "bpom_cosmetics_notification",
        "name": "인도네시아 BPOM 화장품 신고·라벨 확인",
        "agency": "Badan Pengawas Obat dan Makanan / Indonesia Customs",
        "basis": "BPOM cosmetics notification and ASEAN cosmetic framework",
        "summary": "화장품은 BPOM 화장품 신고, 성분 제한, 라벨, 수입자 책임, SKI 수입확인 대상 가능성이 있습니다.",
        "documents": ["전성분표", "제품 라벨", "제품 정보 파일(PIF)", "수입자/책임회사 자료", "BPOM 화장품 신고 또는 SKI 자료(해당 시)"],
        "notes": "의약품성 효능 표현이 있거나 치료 목적을 표방하면 화장품이 아닌 의약품 또는 의료기기 규제가 적용될 수 있습니다.",
        "source_name": "BPOM e-BPOM import/export permit service",
        "source_url": BPOM_EXIM_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '02%' or destination_hs_code like '03%' or destination_hs_code like '04%' or destination_hs_code like '16%' or destination_hs_code like '17%' or destination_hs_code like '18%' or destination_hs_code like '19%' or destination_hs_code like '20%' or destination_hs_code like '21%' or destination_hs_code like '22%' or destination_hs_code like '3304%' or destination_hs_code like '3401%' or destination_hs_code like '3402%'",
        "type": "halal_product_assurance",
        "name": "인도네시아 할랄 인증·표시 확인",
        "agency": "BPJPH / line ministries / Indonesia Customs",
        "basis": "Indonesia halal product assurance procedure",
        "summary": "식품, 음료, 화장품, 위생용품 등 소비재는 할랄 인증, 라벨, 원재료 및 제조공정 확인 대상 가능성이 있습니다.",
        "documents": ["원재료 목록", "제조공정도", "제품 라벨", "할랄 인증서 또는 신청자료(해당 시)", "수입자/유통자 자료"],
        "notes": "품목군별 시행시기, 비할랄 표시, 원재료 동물성 여부, 유통 형태에 따라 의무와 표시 방식이 달라질 수 있습니다.",
        "source_name": "BPJPH halal product assurance service",
        "source_url": HALAL_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '39%' or destination_hs_code like '40%' or destination_hs_code like '68%' or destination_hs_code like '72%' or destination_hs_code like '73%' or destination_hs_code like '84%' or destination_hs_code like '85%' or destination_hs_code like '87%' or destination_hs_code like '90%' or destination_hs_code like '94%' or destination_hs_code like '95%'",
        "type": "sni_mandatory_standard",
        "name": "인도네시아 SNI 강제표준·제품인증 확인",
        "agency": "Badan Standardisasi Nasional / line ministries / Indonesia Customs",
        "basis": "Mandatory application of Indonesian National Standards",
        "summary": "전기전자, 기계, 철강, 고무·플라스틱, 차량부품, 완구 등 일부 제품은 SNI 강제표준, 제품인증, 시험성적서, 라벨 확인 대상 가능성이 있습니다.",
        "documents": ["제품 사양서", "모델명/규격", "시험성적서", "SNI 인증 또는 적합성 자료(해당 시)", "라벨/마킹 자료"],
        "notes": "SNI 의무 대상은 HS만이 아니라 제품명, 모델, 기술규정, 담당 부처 고시와 예외조건에 따라 판단해야 합니다.",
        "source_name": "Badan Standardisasi Nasional SNI process",
        "source_url": BSN_SNI_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '8517%' or destination_hs_code like '8525%' or destination_hs_code like '8526%' or destination_hs_code like '8527%' or destination_hs_code like '8528%' or destination_hs_code like '8543%'",
        "type": "postel_telecom_equipment",
        "name": "인도네시아 통신·무선기기 인증 확인",
        "agency": "Directorate General SDPPI / Indonesia Customs",
        "basis": "SDPPI telecom and radio equipment certification procedure",
        "summary": "통신장비, 무선기기, Wi-Fi/Bluetooth/RFID 기능 제품은 SDPPI 형식인증, 시험성적서, 주파수·라벨 조건 대상 가능성이 있습니다.",
        "documents": ["제품 사양서", "무선 모듈/주파수 정보", "시험성적서", "SDPPI 인증 또는 신청자료(해당 시)", "모델명/제조자 정보"],
        "notes": "무선 기능 포함 여부, 주파수 대역, 완제품/부품 형태, 통신망 접속 여부에 따라 요구사항이 달라질 수 있습니다.",
        "source_name": "SDPPI telecom equipment certification",
        "source_url": POSTEL_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '27%' or destination_hs_code like '28%' or destination_hs_code like '29%' or destination_hs_code like '30%' or destination_hs_code like '38%' or destination_hs_code like '39%' or destination_hs_code like '40%' or destination_hs_code like '72%' or destination_hs_code like '73%' or destination_hs_code like '84%' or destination_hs_code like '85%' or destination_hs_code like '87%' or destination_hs_code like '90%'",
        "type": "insw_lartas_import_control",
        "name": "인도네시아 INSW Lartas 수입제한·허가 확인",
        "agency": "Indonesia National Single Window / line ministries / Indonesia Customs",
        "basis": "INSW import restriction and line-ministry permit procedure",
        "summary": "화학, 기계, 전기전자, 철강, 차량부품 등 일부 품목은 INSW Lartas 기준 수입제한, 사전허가, 기술규정 또는 부처별 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "제품 사양서", "용도 설명", "수입허가 또는 Lartas 자료(해당 시)", "안전·품질 인증자료(해당 시)"],
        "notes": "현재 매핑은 위험 품목군 후보입니다. 실제 대상 여부는 INSW HS별 Lartas, 담당 부처 고시와 수입자 자격으로 좁혀야 합니다.",
        "source_name": "Indonesia National Single Window",
        "source_url": INSW_SOURCE_URL,
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
  'IDN',
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
  encode(digest('IDN|' || heading.destination_hs_code || '|' || {sql(requirement["type"])} || '|' || {sql(requirement["name"])} || '|' || {sql(SOURCE_VERSION)}, 'sha256'), 'hex')
from (
  select distinct left(destination_hs_code, 4) as destination_hs_code
  from public.export_destination_tariff_rates
  where country_code = 'IDN'
    and source_version = 'customs-country-tariff-20251231:IDN'
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

    output = f"""-- Generated by scripts/generate_indonesia_import_data_seed.py

begin;

delete from public.export_destination_internal_taxes
where country_code = 'IDN'
  and source_version like '{SOURCE_VERSION}%';

delete from public.export_destination_import_requirements
where country_code = 'IDN'
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
  'IDN',
  tariff.destination_hs_code,
  'vat',
  '수입 VAT',
  '11% 상당',
  '인도네시아 일반 비사치품 수입 VAT 실효세율 후보',
  'DJP 안내 기준 일반 비사치품은 PPN 12%를 11/12 과세표준에 적용하여 기존 11% 수준의 세부담으로 계산합니다. 사치품, PPnBM, 면세, 감면, 특정 과세표준 또는 품목별 예외는 별도 확인이 필요합니다.',
  'Direktorat Jenderal Pajak PPN 2025 guidance',
  {sql(VAT_SOURCE_URL)},
  {sql(SOURCE_VERSION + ':vat')},
  date '2026-01-01',
  null::date,
  null::timestamptz,
  now(),
  'staged'::public.legal_record_status,
  encode(digest('IDN|vat|11-effective|' || tariff.destination_hs_code || '|' || {sql(SOURCE_VERSION)}, 'sha256'), 'hex')
from (
  select distinct destination_hs_code
  from public.export_destination_tariff_rates
  where country_code = 'IDN'
    and source_version = 'customs-country-tariff-20251231:IDN'
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
