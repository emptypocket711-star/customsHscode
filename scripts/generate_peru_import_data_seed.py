#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "supabase/seed/generated/peru_import_data_seed.sql"

SOURCE_VERSION = "peru-import-data-20260524"
SUNAT_VAT_SOURCE_URL = "https://emprender.sunat.gob.pe/principales-impuestos/impuesto-general-las-ventas-igv/impuesto-general-las-ventas"
SUNAT_IMPORT_TAX_SOURCE_URL = "https://www.sunat.gob.pe/orientacionaduanera/despsimpimportacion/pagos.html"
SENASA_VUCE_SOURCE_URL = "https://www.senasa.gob.pe/senasa/vuce/"
SENASA_ANIMAL_SOURCE_URL = "https://www.senasa.gob.pe/senasacontigo/minagri-establece-requisitos-sanitarios-para-la-importacion-de-animales/"
MTC_SOURCE_URL = "https://www.portal.mtc.gob.pe/comunicaciones/control_supervision/homologacion_equipos/homologacion_equipos.html"
DIGEMID_SOURCE_URL = "https://www.digemid.minsa.gob.pe/"

REQUIREMENTS = [
    {
        "condition": "destination_hs_code like '01%' or destination_hs_code like '02%' or destination_hs_code like '03%' or destination_hs_code like '04%' or destination_hs_code like '05%' or destination_hs_code like '41%' or destination_hs_code like '42%' or destination_hs_code like '43%' or destination_hs_code like '51%'",
        "type": "senasa_animal_origin_import_control",
        "name": "페루 동물·동물성 제품 SENASA 수입허가 확인",
        "agency": "SENASA / SUNAT",
        "basis": "SENASA sanitary import permit and animal-origin product requirements",
        "summary": "동물, 축산물, 수산물, 동물성 원료, 가죽·모피·양모 등은 SENASA 위생수입허가, 위생증명서, 원산국·품목별 요건 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "B/L 또는 AWB", "포장명세서", "동물종/원재료 정보", "위생증명서(해당 시)", "SENASA 수입허가 자료(해당 시)"],
        "notes": "동물종, 원산국, 품목별 requisitos sanitarios, 상업용/샘플, 검역·CITES 여부에 따라 요구사항이 달라질 수 있습니다.",
        "source_name": "SENASA animal sanitary import requirements",
        "source_url": SENASA_ANIMAL_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '06%' or destination_hs_code like '07%' or destination_hs_code like '08%' or destination_hs_code like '09%' or destination_hs_code like '10%' or destination_hs_code like '11%' or destination_hs_code like '12%' or destination_hs_code like '14%' or destination_hs_code like '15%' or destination_hs_code like '16%' or destination_hs_code like '17%' or destination_hs_code like '18%' or destination_hs_code like '19%' or destination_hs_code like '20%' or destination_hs_code like '21%' or destination_hs_code like '22%' or destination_hs_code like '23%'",
        "type": "senasa_food_plant_import_control",
        "name": "페루 식품·농산물·식물검역 SENASA 확인",
        "agency": "SENASA / SUNAT",
        "basis": "SENASA VUCE procedures for agricultural, plant and food-related imports",
        "summary": "식품, 농산물, 식물, 종자, 곡물, 음료, 사료류는 SENASA 식물검역, 위생요건, 수입허가, VUCE 절차 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "성분표", "제품 라벨", "식물검역증명서(해당 시)", "SENASA/VUCE 허가자료(해당 시)"],
        "notes": "식품/사료/종자/재식용 여부, 원산국, 품목별 requisitos fitosanitarios, 목재포장재 여부에 따라 요구자료가 달라질 수 있습니다.",
        "source_name": "SENASA VUCE procedures",
        "source_url": SENASA_VUCE_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '30%' or destination_hs_code like '3303%' or destination_hs_code like '3304%' or destination_hs_code like '3305%' or destination_hs_code like '3306%' or destination_hs_code like '3307%' or destination_hs_code like '3401%' or destination_hs_code like '3402%' or destination_hs_code like '3808%' or destination_hs_code like '9018%' or destination_hs_code like '9021%' or destination_hs_code like '9022%'",
        "type": "digemid_health_product_control",
        "name": "페루 의약품·의료기기·화장품 DIGEMID 확인",
        "agency": "DIGEMID / SUNAT",
        "basis": "Peru health product sanitary registration and import controls",
        "summary": "의약품, 의료기기, 체외진단기기, 화장품·위생제품은 DIGEMID 등록, 수입자 자격, 제품분류, 라벨·성분 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "제품 사양서", "성분표", "위생등록 또는 수입허가 자료(해당 시)", "라벨/사용설명서"],
        "notes": "의약품/의료기기/화장품/소독제 분류, 위험등급, 치료·살균 효능 표시, 스페인어 표시 여부에 따라 절차가 달라질 수 있습니다.",
        "source_name": "DIGEMID",
        "source_url": DIGEMID_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '28%' or destination_hs_code like '29%' or destination_hs_code like '32%' or destination_hs_code like '34%' or destination_hs_code like '35%' or destination_hs_code like '38%' or destination_hs_code like '39%' or destination_hs_code like '40%'",
        "type": "chemical_hazardous_product_control",
        "name": "페루 화학물질·위험제품 확인",
        "agency": "competent Peruvian authority / SUNAT",
        "basis": "Peru customs import payment and restricted goods controls",
        "summary": "화학물질, 혼합물, 위험물, 세정제, 고무·플라스틱 원료는 MSDS, 위험물 분류, 제한물질, 수입신고·관할기관 승인 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "MSDS", "성분표", "위험물 분류자료", "라벨/표시 자료"],
        "notes": "성분, 농도, UN 번호, 용도, 소비자용/산업용, 살생물·농약·의약품성 표시 여부에 따라 요구사항이 달라질 수 있습니다.",
        "source_name": "SUNAT import payments",
        "source_url": SUNAT_IMPORT_TAX_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '8517%' or destination_hs_code like '8525%' or destination_hs_code like '8526%' or destination_hs_code like '8527%' or destination_hs_code like '8528%' or destination_hs_code like '8543%' or destination_hs_code like '9026%' or destination_hs_code like '9030%'",
        "type": "telecom_equipment_homologation",
        "name": "페루 통신·무선기기 MTC homologación 확인",
        "agency": "Ministerio de Transportes y Comunicaciones / SUNAT",
        "basis": "MTC homologation of telecommunications equipment connected to public networks or using radio spectrum",
        "summary": "통신장비, 무선기기, 단말기, IoT, 네트워크 장비는 MTC homologación, 주파수, 공중망 접속 가능 여부 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "제품 사양서", "무선/통신 기능 설명", "시험성적서", "MTC homologación 자료(해당 시)"],
        "notes": "공중망 접속 여부, 주파수 사용, 이동통신 단말 여부, 판매용/샘플, 미국·캐나다 동등 인증 등록 가능성에 따라 절차가 달라질 수 있습니다.",
        "source_name": "MTC homologacion de equipos",
        "source_url": MTC_SOURCE_URL,
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
  'PER',
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
  encode(digest('PER|' || heading.destination_hs_code || '|' || {sql(requirement["type"])} || '|' || {sql(requirement["name"])} || '|' || {sql(SOURCE_VERSION)}, 'sha256'), 'hex')
from (
  select distinct left(destination_hs_code, 4) as destination_hs_code
  from public.export_destination_tariff_rates
  where country_code = 'PER'
    and source_version = 'customs-country-tariff-20251231:PER'
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

    output = f"""-- Generated by scripts/generate_peru_import_data_seed.py

begin;

delete from public.export_destination_internal_taxes
where country_code = 'PER'
  and source_version like '{SOURCE_VERSION}%';

delete from public.export_destination_import_requirements
where country_code = 'PER'
  and source_version like '{SOURCE_VERSION}%';

insert into public.export_destination_internal_taxes (
  country_code, destination_hs_code, tax_type, tax_name, rate_text, basis, notes,
  source_name, source_url, source_version, effective_from, effective_to,
  published_at, retrieved_at, status, checksum
)
select
  'PER',
  tariff.destination_hs_code,
  'vat',
  '수입 IGV',
  '18%',
  '페루 수입 IGV 표준세율 후보',
  'SUNAT 안내 기준 IGV 적용 세율은 18%입니다. 2026년 구성은 IGV 15.5%와 IPM 2.5%이며, 면세·비과세·특별세와 품목별 예외는 별도 확인이 필요합니다.',
  'SUNAT Impuesto General a las Ventas',
  {sql(SUNAT_VAT_SOURCE_URL)},
  {sql(SOURCE_VERSION + ':vat')},
  date '2026-01-01',
  null::date,
  null::timestamptz,
  now(),
  'staged'::public.legal_record_status,
  encode(digest('PER|vat|' || tariff.destination_hs_code || '|' || {sql(SOURCE_VERSION)}, 'sha256'), 'hex')
from (
  select distinct destination_hs_code
  from public.export_destination_tariff_rates
  where country_code = 'PER'
    and source_version = 'customs-country-tariff-20251231:PER'
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
