#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "supabase/seed/generated/new_zealand_import_data_seed.sql"

SOURCE_VERSION = "new-zealand-import-data-20260523"
CUSTOMS_GST_SOURCE_URL = "https://www.customs.govt.nz/personal/duty-and-gst/duty-and-allowances"
CUSTOMS_TARIFF_SOURCE_URL = "https://www.customs.govt.nz/business/tariffs/"
CUSTOMS_RESTRICTED_SOURCE_URL = "https://www.customs.govt.nz/business/import/import-prohibited-and-restricted-imports/"
TSW_SOURCE_URL = "https://www.tsw.govt.nz/"
MPI_GENERAL_SOURCE_URL = "https://www.mpi.govt.nz/import/importing-into-nz-how-it-works/general-importing-requirements"
MPI_FOOD_SOURCE_URL = "https://www.mpi.govt.nz/import/importing-food-and-beverages/food-safety-clearance-of-imported-food-2/food-safety-clearance-of-imported-food/"
MPI_PERMIT_SOURCE_URL = "https://animalplantimportpermit.mpi.govt.nz/Home/Disclaimer"
MEDSAFE_DEVICE_SOURCE_URL = "https://www.medsafe.govt.nz/regulatory/DevicesNew/4Importing.asp"
EPA_COSMETICS_SOURCE_URL = "https://www.epa.govt.nz/everyday-environment/cosmetics/making-or-importing-cosmetics-and-toiletries/"
EPA_HAZARDOUS_SOURCE_URL = "https://www.epa.govt.nz/hazardous-substances/before-you-import-or-manufacture/"
RSM_SOURCE_URL = "https://www.rsm.govt.nz/business-individuals/supplier-compliance"

REQUIREMENTS = [
    {
        "condition": "destination_hs_code like '02%' or destination_hs_code like '03%' or destination_hs_code like '04%' or destination_hs_code like '07%' or destination_hs_code like '08%' or destination_hs_code like '09%' or destination_hs_code like '10%' or destination_hs_code like '11%' or destination_hs_code like '12%' or destination_hs_code like '15%' or destination_hs_code like '16%' or destination_hs_code like '17%' or destination_hs_code like '18%' or destination_hs_code like '19%' or destination_hs_code like '20%' or destination_hs_code like '21%' or destination_hs_code like '22%'",
        "type": "mpi_food_safety_clearance",
        "name": "뉴질랜드 식품 MPI 식품안전 통관 확인",
        "agency": "Ministry for Primary Industries / New Zealand Customs Service",
        "basis": "MPI food safety clearance for imported food",
        "summary": "식품, 식품원료, 식품첨가물, 음료는 MPI 식품수입자 등록, Trade Single Window 식품안전 통관, 공식증명서, 검사·샘플링 대상 가능성이 있습니다.",
        "documents": ["상업송장", "B/L 또는 AWB", "포장명세서", "성분표", "제품 라벨", "공식증명서 또는 위생증명서(해당 시)"],
        "notes": "고위험 식품, 동물성 원료, 유제품, 육류, 수산물, 벌꿀, 식물성 식품 여부에 따라 검사·증명 요건이 달라질 수 있습니다.",
        "source_name": "MPI food safety clearance of imported food",
        "source_url": MPI_FOOD_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '01%' or destination_hs_code like '02%' or destination_hs_code like '03%' or destination_hs_code like '04%' or destination_hs_code like '05%' or destination_hs_code like '41%' or destination_hs_code like '42%' or destination_hs_code like '43%' or destination_hs_code like '51%'",
        "type": "mpi_animal_biosecurity",
        "name": "뉴질랜드 동물·수산·축산물 MPI 생물보안 확인",
        "agency": "Ministry for Primary Industries / New Zealand Customs Service",
        "basis": "MPI biosecurity requirements and import health standards",
        "summary": "동물, 축산물, 수산물, 동물성 원료, 가죽, 모피, 양모 등은 Import Health Standard, 수입허가, 검역, 위생증명 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "동물종/원재료 정보", "Import Health Standard 대응자료", "수입허가(해당 시)", "위생증명서(해당 시)"],
        "notes": "동물종, 원산국, 가공상태, 식용/비식품용, 질병상황과 IHS 조건에 따라 요구사항이 달라질 수 있습니다.",
        "source_name": "MPI general importing requirements",
        "source_url": MPI_GENERAL_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '06%' or destination_hs_code like '07%' or destination_hs_code like '08%' or destination_hs_code like '10%' or destination_hs_code like '12%' or destination_hs_code like '14%' or destination_hs_code like '44%' or destination_hs_code like '45%' or destination_hs_code like '46%' or destination_hs_code like '94%'",
        "type": "mpi_plant_wood_biosecurity",
        "name": "뉴질랜드 식물·목재류 MPI 생물보안 확인",
        "agency": "Ministry for Primary Industries / New Zealand Customs Service",
        "basis": "MPI plant product and wood import health standards",
        "summary": "식물, 종자, 곡물, 과실, 식물성 원료, 목재 및 목재포장재는 수입허가, 식물검역증명서, 훈증·열처리, 검역검사 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "학명/수종 정보", "식물검역증명서(해당 시)", "처리·훈증 증명서(해당 시)", "MPI 수입허가(해당 시)"],
        "notes": "재식용 여부, 수종, bark 포함 여부, 가공상태, 목재포장재 여부, 원산국 병해충 조건에 따라 요구사항이 달라질 수 있습니다.",
        "source_name": "MPI online import permit",
        "source_url": MPI_PERMIT_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '30%' or destination_hs_code like '3006%' or destination_hs_code like '9018%' or destination_hs_code like '9021%' or destination_hs_code like '9022%'",
        "type": "medsafe_medicine_medical_device",
        "name": "뉴질랜드 의약품·의료기기 Medsafe 확인",
        "agency": "Medsafe / New Zealand Customs Service",
        "basis": "Medsafe medical device and therapeutic product import controls",
        "summary": "의약품, 치료제, 의료기기, 진단기기성 제품은 Medsafe 요건, WAND 의료기기 통지, 수입자 의무, 라벨·사용목적 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "제품 사양서", "용도 설명", "WAND 또는 Medsafe 관련 자료(해당 시)", "라벨/사용설명서"],
        "notes": "치료·진단 목적, 멸균 여부, 인체 적용 여부, 개인수입/상업수입 구분에 따라 규제가 달라질 수 있습니다.",
        "source_name": "Medsafe importing medical devices",
        "source_url": MEDSAFE_DEVICE_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '3304%'",
        "type": "epa_cosmetics_hsno",
        "name": "뉴질랜드 화장품 EPA HSNO·라벨 확인",
        "agency": "Environmental Protection Authority / New Zealand Customs Service",
        "basis": "EPA Cosmetic Products Group Standard and HSNO controls",
        "summary": "화장품과 화장품 원료는 HSNO 화장품 그룹표준, 위험성분 여부, 영문 라벨, 성분표, SDS, HSRN 통지 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "전성분표", "제품 라벨", "SDS(해당 시)", "HSNO approval number 또는 HSRN 관련 자료(해당 시)"],
        "notes": "위험물질 성분 포함 여부, 의약품성 효능 표현, 에어로졸/알코올 등 위험물 운송 조건에 따라 추가 확인이 필요할 수 있습니다.",
        "source_name": "EPA making or importing cosmetics and toiletries",
        "source_url": EPA_COSMETICS_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '28%' or destination_hs_code like '29%' or destination_hs_code like '32%' or destination_hs_code like '33%' or destination_hs_code like '34%' or destination_hs_code like '35%' or destination_hs_code like '38%' or destination_hs_code like '39%' or destination_hs_code like '40%'",
        "type": "epa_hazardous_substances",
        "name": "뉴질랜드 화학물질·위험물 EPA HSNO 확인",
        "agency": "Environmental Protection Authority / New Zealand Customs Service",
        "basis": "HSNO hazardous substance approval before import or manufacture",
        "summary": "화학물질, 혼합물, 세정제, 접착제, 도료, 플라스틱·고무 원료 등은 HSNO 승인, SDS, 라벨, 포장, HSRN 통지 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "CAS 번호", "SDS", "성분비", "용도 설명", "HSNO approval 자료(해당 시)"],
        "notes": "물질 단위 승인, 그룹표준 적용, 오존층파괴물질·폐기물·독성물질 등 별도 허가 대상 여부를 함께 확인합니다.",
        "source_name": "EPA before you import or manufacture hazardous substances",
        "source_url": EPA_HAZARDOUS_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '17%' or destination_hs_code like '18%' or destination_hs_code like '19%' or destination_hs_code like '20%' or destination_hs_code like '21%' or destination_hs_code like '22%' or destination_hs_code like '25%' or destination_hs_code like '27%' or destination_hs_code like '28%' or destination_hs_code like '29%' or destination_hs_code like '33%' or destination_hs_code like '34%' or destination_hs_code like '38%' or destination_hs_code like '39%' or destination_hs_code like '40%' or destination_hs_code like '68%' or destination_hs_code like '72%' or destination_hs_code like '73%' or destination_hs_code like '84%' or destination_hs_code like '85%' or destination_hs_code like '87%' or destination_hs_code like '90%' or destination_hs_code like '94%' or destination_hs_code like '95%'",
        "type": "customs_restricted_goods",
        "name": "뉴질랜드 금지·제한 수입품 확인",
        "agency": "New Zealand Customs Service / Other Government Agencies",
        "basis": "New Zealand Customs prohibited and restricted imports",
        "summary": "일부 화학제품, 의약품성 물품, 전기전자, 차량·부품, 소비재, CITES·보호종, 폐기물, 무기류 등은 수입 금지 또는 사전승인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "제품 사양서", "카탈로그", "관할기관 허가자료(해당 시)", "인증·시험자료(해당 시)"],
        "notes": "금지·제한 대상 여부는 HS뿐 아니라 제품명, 성분, 용도, 모델, 중고 여부, CITES/폐기물/무기류 해당성에 따라 달라질 수 있습니다.",
        "source_name": "New Zealand Customs prohibited and restricted imports",
        "source_url": CUSTOMS_RESTRICTED_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '8517%' or destination_hs_code like '8525%' or destination_hs_code like '8526%' or destination_hs_code like '8527%' or destination_hs_code like '8528%' or destination_hs_code like '8543%'",
        "type": "rsm_radio_equipment_compliance",
        "name": "뉴질랜드 통신·무선기기 RSM 적합성 확인",
        "agency": "Radio Spectrum Management / New Zealand Customs Service",
        "basis": "RSM supplier compliance for radio transmitting equipment",
        "summary": "통신장비, 무선기기, Wi-Fi/Bluetooth/RFID 기능 제품은 RSM 공급자 적합성, 수입·공급자 licence, SDoC, 라벨, 금지장비 여부 확인 대상 가능성이 있습니다.",
        "documents": ["제품 사양서", "브랜드/모델 정보", "무선 모듈/주파수 정보", "시험성적서", "SDoC 또는 compliance folder 자료(해당 시)", "공급자 licence 자료(해당 시)"],
        "notes": "무선 송신 기능, 주파수 대역, 상업 공급 여부, 금지 장비 해당 여부에 따라 요구사항이 달라질 수 있습니다.",
        "source_name": "Radio Spectrum Management supplier compliance",
        "source_url": RSM_SOURCE_URL,
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
  'NZL',
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
  encode(digest('NZL|' || heading.destination_hs_code || '|' || {sql(requirement["type"])} || '|' || {sql(requirement["name"])} || '|' || {sql(SOURCE_VERSION)}, 'sha256'), 'hex')
from (
  select distinct left(destination_hs_code, 4) as destination_hs_code
  from public.export_destination_tariff_rates
  where country_code = 'NZL'
    and source_version = 'customs-country-tariff-20251231:NZL'
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

    output = f"""-- Generated by scripts/generate_new_zealand_import_data_seed.py

begin;

delete from public.export_destination_internal_taxes
where country_code = 'NZL'
  and source_version like '{SOURCE_VERSION}%';

delete from public.export_destination_import_requirements
where country_code = 'NZL'
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
  'NZL',
  tariff.destination_hs_code,
  'gst',
  '수입 GST',
  '15%',
  '뉴질랜드 수입 GST 표준세율 후보',
  'NZ Customs 안내 기준 수입물품에는 GST가 적용될 수 있습니다. NZD 1,000 이하 물품, 해외공급자 GST, 주류·담배, IETF/BSEL, 면세·감면 조건은 거래조건별 확인이 필요합니다.',
  'New Zealand Customs duty and GST',
  {sql(CUSTOMS_GST_SOURCE_URL)},
  {sql(SOURCE_VERSION + ':gst')},
  date '2026-01-01',
  null::date,
  null::timestamptz,
  now(),
  'staged'::public.legal_record_status,
  encode(digest('NZL|gst|' || tariff.destination_hs_code || '|' || {sql(SOURCE_VERSION)}, 'sha256'), 'hex')
from (
  select distinct destination_hs_code
  from public.export_destination_tariff_rates
  where country_code = 'NZL'
    and source_version = 'customs-country-tariff-20251231:NZL'
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
