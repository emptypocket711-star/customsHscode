#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "supabase/seed/generated/panama_import_data_seed.sql"

SOURCE_VERSION = "panama-import-data-20260524"
DGI_ITBMS_SOURCE_URL = "https://dgi.mef.gob.pa/itbms/Itbms"
ANA_TARIFF_SOURCE_URL = "https://aranceles.ana.gob.pa/assets/documentos_aduanas/manual/Manual%20Herramienta%20Arancel%20Interactivo_Dic2020_V1.pdf"
ANA_IMPORT_SOURCE_URL = "https://tramites.ana.gob.pa/w_cifras/"
APA_SOURCE_URL = "https://apa.gob.pa/"
APA_ABOUT_SOURCE_URL = "https://apa.gob.pa/en/nosotros/"
MIDA_PLANT_SOURCE_URL = "https://mida.gob.pa/direcciones/direccion-nacional-de-sanidad-vegetal/requisitos-fitosanitarios-para-importacion/"
MINSA_SOURCE_URL = "https://www.minsa.gob.pa/"
ASEP_SOURCE_URL = "https://asep.gob.pa/direcciones/telecomunicaciones/homologacion/"
ASEP_FAQ_SOURCE_URL = "https://asep.gob.pa/direcciones/telecomunicaciones/guia-y-preguntas-frecuentes/preguntas-frecuentes-sobre-homologacion/"

REQUIREMENTS = [
    {
        "condition": "destination_hs_code like '01%' or destination_hs_code like '02%' or destination_hs_code like '03%' or destination_hs_code like '04%' or destination_hs_code like '05%' or destination_hs_code like '41%' or destination_hs_code like '42%' or destination_hs_code like '43%' or destination_hs_code like '51%'",
        "type": "apa_animal_food_import_control",
        "name": "파나마 동물·동물성 제품 APA/MIDA 확인",
        "agency": "Agencia Panameña de Alimentos / MIDA / Autoridad Nacional de Aduanas",
        "basis": "Panama food import notification and animal/plant sanitary controls",
        "summary": "동물, 축산물, 수산물, 동물성 원료, 가죽·모피·양모 등은 APA 식품수입 통지, MIDA 위생·검역요건, 위생증명서, 수입허가 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "B/L 또는 AWB", "포장명세서", "동물종/원재료 정보", "위생증명서(해당 시)", "APA/MIDA 허가자료(해당 시)"],
        "notes": "식용/사료용/산업용 구분, 동물종, 원산국, 가공도, 검역·CITES 여부에 따라 요구사항이 달라질 수 있습니다.",
        "source_name": "APA food import procedures",
        "source_url": APA_ABOUT_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '06%' or destination_hs_code like '07%' or destination_hs_code like '08%' or destination_hs_code like '09%' or destination_hs_code like '10%' or destination_hs_code like '11%' or destination_hs_code like '12%' or destination_hs_code like '14%' or destination_hs_code like '15%' or destination_hs_code like '16%' or destination_hs_code like '17%' or destination_hs_code like '18%' or destination_hs_code like '19%' or destination_hs_code like '20%' or destination_hs_code like '21%' or destination_hs_code like '22%' or destination_hs_code like '23%'",
        "type": "apa_food_plant_import_control",
        "name": "파나마 식품·농산물·식물검역 APA/MIDA 확인",
        "agency": "Agencia Panameña de Alimentos / MIDA / Autoridad Nacional de Aduanas",
        "basis": "APA SISNIA/SIT food import procedures and MIDA phytosanitary requirements",
        "summary": "식품, 농산물, 식물, 종자, 곡물, 음료, 사료류는 APA 식품수입 통지·등록, MIDA 식물검역·수입허가, 위생·라벨 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "성분표", "제품 라벨", "식물검역증명서(해당 시)", "APA/MIDA 등록 또는 허가자료(해당 시)"],
        "notes": "식품/사료/재식용, 원산국, 가공도, APA SIT/SISNIA 통지 대상과 쿼터·계절 제한 여부에 따라 요구자료가 달라질 수 있습니다.",
        "source_name": "MIDA phytosanitary import requirements",
        "source_url": MIDA_PLANT_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '30%' or destination_hs_code like '9018%' or destination_hs_code like '9021%' or destination_hs_code like '9022%'",
        "type": "minsa_health_product_control",
        "name": "파나마 의약품·의료기기 MINSA 확인",
        "agency": "Ministerio de Salud / Autoridad Nacional de Aduanas",
        "basis": "Panama health-product registration and import control context",
        "summary": "의약품, 원료의약품, 의료기기, 체외진단기기는 MINSA 보건제품 등록, 수입자 자격, 제품분류, 라벨·사용목적 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "제품 사양서", "성분표 또는 분류자료", "MINSA 등록 또는 허가자료(해당 시)", "라벨/사용설명서"],
        "notes": "의약품/의료기기/식품보조제/화장품 분류, 등록제품 여부와 통제물질 여부에 따라 절차가 달라질 수 있습니다.",
        "source_name": "Ministerio de Salud Panama",
        "source_url": MINSA_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '3303%' or destination_hs_code like '3304%' or destination_hs_code like '3305%' or destination_hs_code like '3306%' or destination_hs_code like '3307%' or destination_hs_code like '3401%' or destination_hs_code like '3402%' or destination_hs_code like '3808%'",
        "type": "minsa_cosmetics_hygiene_control",
        "name": "파나마 화장품·위생제품 MINSA 확인",
        "agency": "Ministerio de Salud / Autoridad Nacional de Aduanas",
        "basis": "Panama health-interest product registration and import control context",
        "summary": "화장품, 퍼스널케어, 세정제, 위생제품, 살충·소독 제품은 MINSA 등록, 성분·라벨, 제품분류 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "전성분표", "제품 라벨", "제품 사양서", "MINSA 등록자료(해당 시)"],
        "notes": "치료·살균 효능, 제한성분, 화장품/의약품/위생제품/농약 분류와 스페인어 표시 여부에 따라 관할과 요건이 달라질 수 있습니다.",
        "source_name": "Ministerio de Salud Panama",
        "source_url": MINSA_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '28%' or destination_hs_code like '29%' or destination_hs_code like '32%' or destination_hs_code like '34%' or destination_hs_code like '35%' or destination_hs_code like '38%' or destination_hs_code like '39%' or destination_hs_code like '40%'",
        "type": "chemical_hazardous_product_control",
        "name": "파나마 화학물질·위험제품 확인",
        "agency": "Ministerio de Salud / Autoridad Nacional de Aduanas",
        "basis": "Panama customs import controls and health-product regulation context",
        "summary": "화학물질, 혼합물, 위험물, 세정제, 플라스틱·고무 원료는 MSDS, 위험물 분류, 제한물질, 보건제품 등록 또는 관할기관 승인 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "MSDS", "성분표", "위험물 분류자료", "라벨/표시 자료"],
        "notes": "성분, 농도, UN 번호, 용도, 소비자용/산업용, 살생물·농약·의약품성 표시 여부에 따라 요구사항이 달라질 수 있습니다.",
        "source_name": "Autoridad Nacional de Aduanas import context",
        "source_url": ANA_IMPORT_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '8517%' or destination_hs_code like '8525%' or destination_hs_code like '8526%' or destination_hs_code like '8527%' or destination_hs_code like '8528%' or destination_hs_code like '8543%' or destination_hs_code like '9026%' or destination_hs_code like '9030%'",
        "type": "telecom_wireless_homologation",
        "name": "파나마 통신·무선기기 ASEP homologación 확인",
        "agency": "ASEP / Autoridad Nacional de Aduanas",
        "basis": "ASEP homologation procedure for wireless telecommunication devices",
        "summary": "통신장비, 이동통신 단말, 무선기기, IoT, 네트워크 장비는 ASEP homologación, 주파수·기술기준, 단말 모델 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "제품 사양서", "무선/통신 기능 설명", "시험성적서", "ASEP homologación 자료(해당 시)"],
        "notes": "무선기기 여부, 공중망 접속, 주파수 사용, 판매용/샘플 여부에 따라 절차가 달라질 수 있습니다.",
        "source_name": "ASEP homologation FAQ",
        "source_url": ASEP_FAQ_SOURCE_URL,
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
  'PAN',
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
  encode(digest('PAN|' || heading.destination_hs_code || '|' || {sql(requirement["type"])} || '|' || {sql(requirement["name"])} || '|' || {sql(SOURCE_VERSION)}, 'sha256'), 'hex')
from (
  select distinct left(destination_hs_code, 4) as destination_hs_code
  from public.export_destination_tariff_rates
  where country_code = 'PAN'
    and source_version = 'customs-country-tariff-20251231:PAN'
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

    output = f"""-- Generated by scripts/generate_panama_import_data_seed.py

begin;

delete from public.export_destination_internal_taxes
where country_code = 'PAN'
  and source_version like '{SOURCE_VERSION}%';

delete from public.export_destination_import_requirements
where country_code = 'PAN'
  and source_version like '{SOURCE_VERSION}%';

insert into public.export_destination_internal_taxes (
  country_code, destination_hs_code, tax_type, tax_name, rate_text, basis, notes,
  source_name, source_url, source_version, effective_from, effective_to,
  published_at, retrieved_at, status, checksum
)
select
  'PAN',
  tariff.destination_hs_code,
  'vat',
  '수입 ITBMS',
  '7%',
  '파나마 수입 ITBMS 표준세율 후보',
  'DGI 안내 기준 ITBMS 일반세율은 7%입니다. 주류 10%, 담배 15%, 의약품·식품·농산물 등 비과세·면세 및 품목별 예외는 별도 확인이 필요합니다.',
  'Dirección General de Ingresos ITBMS',
  {sql(DGI_ITBMS_SOURCE_URL)},
  {sql(SOURCE_VERSION + ':vat')},
  date '2026-01-01',
  null::date,
  null::timestamptz,
  now(),
  'staged'::public.legal_record_status,
  encode(digest('PAN|vat|' || tariff.destination_hs_code || '|' || {sql(SOURCE_VERSION)}, 'sha256'), 'hex')
from (
  select distinct destination_hs_code
  from public.export_destination_tariff_rates
  where country_code = 'PAN'
    and source_version = 'customs-country-tariff-20251231:PAN'
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
