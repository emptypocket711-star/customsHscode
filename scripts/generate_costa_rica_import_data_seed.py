#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "supabase/seed/generated/costa_rica_import_data_seed.sql"

SOURCE_VERSION = "costa-rica-import-data-20260524"
HACIENDA_VAT_SOURCE_URL = "https://www.hacienda.go.cr/docs/TarifasdelIVA.pdf"
HACIENDA_TARIFF_SOURCE_URL = "https://serviciosnet.hacienda.go.cr/arancelnet/"
HACIENDA_TICA_SOURCE_URL = "https://portaltica.hacienda.go.cr/TicaExterno/hdbaranc.aspx"
SENASA_ANIMAL_SOURCE_URL = "https://www.senasa.go.cr/informacion/Centro-de-informacion/informacion/sgc/dca/dca-pg-02-requisitos-sanitarios-para-importacion"
SENASA_PLANT_SOURCE_URL = "https://www.senasa.go.cr/senasa/sitio/index.php/paginas/view/119"
MINSA_MEDICINE_SOURCE_URL = "https://www.ministeriodesalud.go.cr/index.php?catid=34&id=160%3Aregistro-de-medicamentos&view=article"
MINSA_MEDICINE_IMPORT_SOURCE_URL = "https://www.ministeriodesalud.go.cr/index.php?catid=35&id=1314&view=article"
MINSA_COSMETICS_SOURCE_URL = "https://www.ministeriodesalud.go.cr/index.php/biblioteca-de-archivos-left/documentos-ministerio-de-salud/ministerio-de-salud/tramites-1/empresariales/registro-de-cosmeticos?format=html"
MINSA_LEGISLATION_SOURCE_URL = "https://www.ministeriodesalud.go.cr/index.php/biblioteca/legislacion"
SUTEL_SOURCE_URL = "https://sutel.go.cr/pagina/solicitud-homologacion"
MEIC_SOURCE_URL = "https://www.meic.go.cr/tramites-y-servicios/reglatec/ciot/"

REQUIREMENTS = [
    {
        "condition": "destination_hs_code like '01%' or destination_hs_code like '02%' or destination_hs_code like '03%' or destination_hs_code like '04%' or destination_hs_code like '05%' or destination_hs_code like '41%' or destination_hs_code like '42%' or destination_hs_code like '43%' or destination_hs_code like '51%'",
        "type": "senasa_animal_import_control",
        "name": "코스타리카 동물·동물성 제품 SENASA 확인",
        "agency": "SENASA / Dirección General de Aduanas",
        "basis": "SENASA sanitary requirements for importation of animals and animal-origin products",
        "summary": "동물, 축산물, 수산물, 동물성 원료, 가죽·모피·양모 등은 SENASA 위생요건, 수입허가, 위생증명서, 시설승인 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "B/L 또는 AWB", "포장명세서", "동물종/원재료 정보", "위생증명서(해당 시)", "SENASA 허가자료(해당 시)"],
        "notes": "동물종, 원산국, 가공도, 식용/사료용/산업용 구분, 시설승인과 CITES 여부에 따라 요구사항이 달라질 수 있습니다.",
        "source_name": "SENASA sanitary import requirements",
        "source_url": SENASA_ANIMAL_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '06%' or destination_hs_code like '07%' or destination_hs_code like '08%' or destination_hs_code like '09%' or destination_hs_code like '10%' or destination_hs_code like '11%' or destination_hs_code like '12%' or destination_hs_code like '14%' or destination_hs_code like '15%' or destination_hs_code like '16%' or destination_hs_code like '17%' or destination_hs_code like '18%' or destination_hs_code like '19%' or destination_hs_code like '20%' or destination_hs_code like '21%' or destination_hs_code like '22%' or destination_hs_code like '23%'",
        "type": "food_plant_health_import_control",
        "name": "코스타리카 식품·농산물·식물검역 확인",
        "agency": "SENASA / Ministerio de Salud / Dirección General de Aduanas",
        "basis": "SENASA import sanitary requirements and Costa Rica health-product registration controls",
        "summary": "식품, 농산물, 식물, 종자, 곡물, 음료, 사료류는 SENASA 위생·검역요건, Ministerio de Salud 식품등록, 라벨·성분 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "성분표", "제품 라벨", "식물검역증명서(해당 시)", "SENASA/보건부 등록자료(해당 시)"],
        "notes": "재식용/식용/사료용, 가공도, 원산국, 식품등록 대상, 목재포장재 여부에 따라 요구자료가 달라질 수 있습니다.",
        "source_name": "SENASA quarantine and import control",
        "source_url": SENASA_PLANT_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '30%'",
        "type": "ministry_health_medicine_registration",
        "name": "코스타리카 의약품 보건부 등록 확인",
        "agency": "Ministerio de Salud / Dirección General de Aduanas",
        "basis": "Costa Rica medicine sanitary registration and import authorisation rules",
        "summary": "의약품, 원료의약품, 생물학적 제제는 Ministerio de Salud 등록, Regístrelo 플랫폼, 미등록 의약품 수입승인, 수입자 자격 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "제품 사양서", "성분표", "보건부 등록 또는 수입승인 자료(해당 시)", "라벨/사용설명서"],
        "notes": "등록 의약품/미등록 예외수입, 공공기관 구매, 생물학적 제제, 통제물질 여부에 따라 절차가 달라질 수 있습니다.",
        "source_name": "Ministerio de Salud medicine registration",
        "source_url": MINSA_MEDICINE_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '3303%' or destination_hs_code like '3304%' or destination_hs_code like '3305%' or destination_hs_code like '3306%' or destination_hs_code like '3307%' or destination_hs_code like '3401%' or destination_hs_code like '3402%' or destination_hs_code like '3808%'",
        "type": "ministry_health_cosmetics_hygiene_control",
        "name": "코스타리카 화장품·위생제품 보건부 등록 확인",
        "agency": "Ministerio de Salud / Dirección General de Aduanas",
        "basis": "Costa Rica cosmetics and health-interest product registration procedures",
        "summary": "화장품, 퍼스널케어, 세정제, 위생제품, 살충·소독 제품은 Ministerio de Salud 등록, 성분·라벨, 제품분류 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "전성분표", "제품 라벨", "제품 사양서", "보건부 등록자료(해당 시)"],
        "notes": "치료·살균 효능, 제한성분, 화장품/의약품/위생제품/화학제품 분류와 스페인어 표시 여부에 따라 관할과 요건이 달라질 수 있습니다.",
        "source_name": "Ministerio de Salud cosmetics registration",
        "source_url": MINSA_COSMETICS_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '9018%' or destination_hs_code like '9021%' or destination_hs_code like '9022%'",
        "type": "ministry_health_medical_device_control",
        "name": "코스타리카 의료기기 보건부 등록 확인",
        "agency": "Ministerio de Salud / Dirección General de Aduanas",
        "basis": "Costa Rica health legislation and registration for health-interest products",
        "summary": "의료기기, 체외진단기기, 의료용 장비는 Ministerio de Salud 제품등록, 위험등급, 사용목적, 수입자·라벨 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "제품 사양서", "의료기기 분류자료", "보건부 등록 또는 허가자료(해당 시)", "라벨/사용설명서"],
        "notes": "의료기기/부품/소모품/IVD 구분, 위험등급, 등록제품 여부에 따라 요구사항이 달라질 수 있습니다.",
        "source_name": "Ministerio de Salud sanitary legislation",
        "source_url": MINSA_LEGISLATION_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '28%' or destination_hs_code like '29%' or destination_hs_code like '32%' or destination_hs_code like '34%' or destination_hs_code like '35%' or destination_hs_code like '38%' or destination_hs_code like '39%' or destination_hs_code like '40%'",
        "type": "chemical_technical_regulation_control",
        "name": "코스타리카 화학물질·기술규정 확인",
        "agency": "Ministerio de Salud / MEIC / Dirección General de Aduanas",
        "basis": "Costa Rica health-product registration and technical-barrier information sources",
        "summary": "화학물질, 혼합물, 위험물, 세정제, 플라스틱·고무 원료는 MSDS, 위험물 분류, 보건부 등록, MEIC 기술규정 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "MSDS", "성분표", "위험물 분류자료", "라벨/표시 자료"],
        "notes": "성분, 농도, UN 번호, 용도, 소비자용/산업용, 살생물·농약·의약품성 표시 여부에 따라 요구사항이 달라질 수 있습니다.",
        "source_name": "MEIC CIOT technical regulations",
        "source_url": MEIC_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '8517%' or destination_hs_code like '8525%' or destination_hs_code like '8526%' or destination_hs_code like '8527%' or destination_hs_code like '8528%' or destination_hs_code like '8543%' or destination_hs_code like '9026%' or destination_hs_code like '9030%'",
        "type": "telecom_terminal_homologation",
        "name": "코스타리카 통신·무선기기 SUTEL homologación 확인",
        "agency": "SUTEL / Dirección General de Aduanas",
        "basis": "SUTEL homologation procedure for telecommunications terminals",
        "summary": "통신장비, 이동통신 단말, 무선기기, IoT, 네트워크 장비는 SUTEL homologación, IMEI/단말 모델, 주파수·기술기준 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "제품 사양서", "무선/통신 기능 설명", "시험성적서", "SUTEL homologación 자료(해당 시)"],
        "notes": "이동통신 단말 여부, 공중망 접속, 주파수 사용, 판매용/샘플 여부에 따라 절차가 달라질 수 있습니다.",
        "source_name": "SUTEL homologation",
        "source_url": SUTEL_SOURCE_URL,
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
  country_code, destination_hs_code, requirement_type, requirement_name, agency,
  legal_basis, procedure_summary, required_documents, notes, source_name, source_url,
  source_version, effective_from, effective_to, published_at, retrieved_at, status, checksum
)
select
  'CRI',
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
  encode(digest('CRI|' || heading.destination_hs_code || '|' || {sql(requirement["type"])} || '|' || {sql(requirement["name"])} || '|' || {sql(SOURCE_VERSION)}, 'sha256'), 'hex')
from (
  select distinct left(destination_hs_code, 4) as destination_hs_code
  from public.export_destination_tariff_rates
  where country_code = 'CRI'
    and source_version = 'customs-country-tariff-20251231:CRI'
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

    output = f"""-- Generated by scripts/generate_costa_rica_import_data_seed.py

begin;

delete from public.export_destination_internal_taxes
where country_code = 'CRI'
  and source_version like '{SOURCE_VERSION}%';

delete from public.export_destination_import_requirements
where country_code = 'CRI'
  and source_version like '{SOURCE_VERSION}%';

insert into public.export_destination_internal_taxes (
  country_code, destination_hs_code, tax_type, tax_name, rate_text, basis, notes,
  source_name, source_url, source_version, effective_from, effective_to,
  published_at, retrieved_at, status, checksum
)
select
  'CRI',
  tariff.destination_hs_code,
  'vat',
  '수입 IVA',
  '13%',
  '코스타리카 수입 IVA 표준세율 후보',
  'Ministerio de Hacienda 안내 기준 IVA 일반세율은 13%입니다. 감면세율 4%, 2%, 1%, 면세·비과세와 특정 품목 예외는 별도 확인이 필요합니다.',
  'Ministerio de Hacienda Tarifas del IVA',
  {sql(HACIENDA_VAT_SOURCE_URL)},
  {sql(SOURCE_VERSION + ':vat')},
  date '2026-01-01',
  null::date,
  null::timestamptz,
  now(),
  'staged'::public.legal_record_status,
  encode(digest('CRI|vat|' || tariff.destination_hs_code || '|' || {sql(SOURCE_VERSION)}, 'sha256'), 'hex')
from (
  select distinct destination_hs_code
  from public.export_destination_tariff_rates
  where country_code = 'CRI'
    and source_version = 'customs-country-tariff-20251231:CRI'
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
