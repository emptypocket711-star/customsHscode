#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "supabase/seed/generated/colombia_import_data_seed.sql"

SOURCE_VERSION = "colombia-import-data-20260524"
DIAN_VAT_SOURCE_URL = "https://normograma.dian.gov.co/dian/compilacion/docs/oficio_dian_903539_2022.htm"
DIAN_IMPORT_SOURCE_URL = "https://www.dian.gov.co/aduanas/paginas/importacion.aspx"
DIAN_TARIFF_SOURCE_URL = "https://www.dian.gov.co/Transaccional/GuaServiciosLinea/Destinatarios_ConsultaAduanas.pdf"
ICA_PLANT_SOURCE_URL = "https://www.ica.gov.co/servicios_linea/sispap_principal/consultas/agricola/importacion/como-solicitar-un-documento-de-requisitos-fitosan"
ICA_ANIMAL_SOURCE_URL = "https://www.ica.gov.co/importacion-y-exportacion/procedimientos-importacion/procedimiento-de-importacion-de-animales-producto/productos-y-subproductos-de-origen-animal-para-1"
ICA_DZI_SOURCE_URL = "https://www.ica.gov.co/importacion-y-exportacion/procedimientos-importacion/mercancias-de-origen-animal-que-requieren-del-docu"
INVIMA_FOOD_SOURCE_URL = "https://www.invima.gov.co/"
INVIMA_COSMETICS_SOURCE_URL = "https://www.invima.gov.co/cosmeticos-aseo-plaguicidas/cosmeticos"
INVIMA_MEDICAL_DEVICE_SOURCE_URL = "https://www.invima.gov.co/node/69"
MINTIC_SOURCE_URL = "https://www.mintic.gov.co/portal/715/w3-article-5236.html"
CRC_HOMOLOGATION_SOURCE_URL = "https://normograma.mintic.gov.co/mintic/compilacion/docs/resolucion_crc_4507_2014.htm"

REQUIREMENTS = [
    {
        "condition": "destination_hs_code like '01%' or destination_hs_code like '02%' or destination_hs_code like '03%' or destination_hs_code like '04%' or destination_hs_code like '05%' or destination_hs_code like '41%' or destination_hs_code like '42%' or destination_hs_code like '43%' or destination_hs_code like '51%'",
        "type": "ica_animal_origin_import_control",
        "name": "콜롬비아 동물·동물성 제품 ICA DZI 확인",
        "agency": "Instituto Colombiano Agropecuario / DIAN",
        "basis": "ICA animal-origin import procedure and Documento Zoosanitario para Importacion controls",
        "summary": "동물, 축산물, 수산물, 동물성 원료, 가죽·모피·양모 등은 ICA Documento Zoosanitario para Importacion, 위생증명서, 원산국·품목별 요건 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "B/L 또는 AWB", "포장명세서", "동물종/원재료 정보", "위생증명서(해당 시)", "ICA DZI 또는 SISPAP 자료(해당 시)"],
        "notes": "동물종, 원산국, 가공도, 산업용/식용/사료용 구분, CITES 여부와 SISPAP 공개 요건 유무에 따라 절차가 달라질 수 있습니다.",
        "source_name": "ICA animal-origin import requirements",
        "source_url": ICA_ANIMAL_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '06%' or destination_hs_code like '07%' or destination_hs_code like '08%' or destination_hs_code like '09%' or destination_hs_code like '10%' or destination_hs_code like '11%' or destination_hs_code like '12%' or destination_hs_code like '14%' or destination_hs_code like '15%' or destination_hs_code like '16%' or destination_hs_code like '17%' or destination_hs_code like '18%' or destination_hs_code like '19%' or destination_hs_code like '20%' or destination_hs_code like '21%' or destination_hs_code like '22%' or destination_hs_code like '23%'",
        "type": "ica_food_plant_import_control",
        "name": "콜롬비아 식품·농산물·식물검역 ICA/INVIMA 확인",
        "agency": "Instituto Colombiano Agropecuario / INVIMA / DIAN",
        "basis": "ICA DRFI and SISPAP phytosanitary import procedure; INVIMA food import controls",
        "summary": "식품, 농산물, 식물, 종자, 곡물, 음료, 사료류는 ICA Documento de Requisitos Fitosanitarios, SISPAP, INVIMA 식품 위생관리, VUCE 수입등록 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "성분표", "제품 라벨", "식물검역증명서(해당 시)", "ICA/INVIMA/VUCE 허가자료(해당 시)"],
        "notes": "재식용/식용/사료용, 가공도, 원산국, 식물검역 위험, 식품등록·위생증명 여부에 따라 요구자료가 달라질 수 있습니다.",
        "source_name": "ICA phytosanitary import requirements",
        "source_url": ICA_PLANT_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '30%'",
        "type": "invima_pharmaceutical_registration",
        "name": "콜롬비아 의약품 INVIMA 등록 확인",
        "agency": "INVIMA / DIAN",
        "basis": "INVIMA sanitary registration and VUCE import approval for regulated health products",
        "summary": "의약품, 원료의약품, 생물학적 제제는 INVIMA 위생등록, 수입자 자격, 제품분류, VUCE visto bueno 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "제품 사양서", "성분표", "INVIMA 등록 또는 허가자료(해당 시)", "라벨/사용설명서"],
        "notes": "의약품/의료기기/식품보조제/화장품 분류, 효능 표시, 등록제품 여부와 수입자 지위에 따라 절차가 달라질 수 있습니다.",
        "source_name": "INVIMA",
        "source_url": INVIMA_FOOD_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '3303%' or destination_hs_code like '3304%' or destination_hs_code like '3305%' or destination_hs_code like '3306%' or destination_hs_code like '3307%' or destination_hs_code like '3401%' or destination_hs_code like '3402%' or destination_hs_code like '3808%'",
        "type": "invima_cosmetics_hygiene_control",
        "name": "콜롬비아 화장품·위생제품 INVIMA NSO 확인",
        "agency": "INVIMA / DIAN",
        "basis": "INVIMA Notificacion Sanitaria Obligatoria for cosmetics and regulated hygiene products",
        "summary": "화장품, 퍼스널케어, 세정제, 위생제품, 가정용 살충·소독 제품은 INVIMA NSO, 제품분류, 성분·라벨, VUCE visto bueno 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "전성분표", "제품 라벨", "제품 사양서", "INVIMA NSO 또는 등록자료(해당 시)"],
        "notes": "치료·살균 효능, 사용 부위, 제한성분, 화장품/의약품/위생제품/농약 분류와 스페인어 표시 여부에 따라 관할과 요건이 달라질 수 있습니다.",
        "source_name": "INVIMA cosmetics",
        "source_url": INVIMA_COSMETICS_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '9018%' or destination_hs_code like '9021%' or destination_hs_code like '9022%'",
        "type": "invima_medical_device_registration",
        "name": "콜롬비아 의료기기 INVIMA 등록 확인",
        "agency": "INVIMA / DIAN",
        "basis": "INVIMA medical device and biomedical equipment sanitary registration",
        "summary": "의료기기, 체외진단기기, 생체의료장비는 INVIMA 위생등록, 위험등급, 기술문서, 수입자·보관 조건 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "제품 사양서", "의료기기 분류자료", "INVIMA 등록 또는 허가자료(해당 시)", "라벨/사용설명서"],
        "notes": "의료기기/부품/소모품/IVD 구분, 위험등급, 사용목적, 등록제품 여부에 따라 요구사항이 달라질 수 있습니다.",
        "source_name": "INVIMA medical devices",
        "source_url": INVIMA_MEDICAL_DEVICE_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '28%' or destination_hs_code like '29%' or destination_hs_code like '32%' or destination_hs_code like '34%' or destination_hs_code like '35%' or destination_hs_code like '38%' or destination_hs_code like '39%' or destination_hs_code like '40%'",
        "type": "chemical_hazardous_product_control",
        "name": "콜롬비아 화학물질·위험제품 확인",
        "agency": "competent Colombian authority / DIAN",
        "basis": "DIAN import controls and VUCE prior approvals for restricted goods",
        "summary": "화학물질, 혼합물, 위험물, 세정제, 플라스틱·고무 원료는 MSDS, 위험물 분류, 제한물질, VUCE 사전승인 또는 관할기관 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "MSDS", "성분표", "위험물 분류자료", "라벨/표시 자료"],
        "notes": "성분, 농도, UN 번호, 용도, 소비자용/산업용, 살생물·농약·의약품성 표시 여부에 따라 요구사항이 달라질 수 있습니다.",
        "source_name": "DIAN importacion",
        "source_url": DIAN_IMPORT_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '4011%' or destination_hs_code like '4012%' or destination_hs_code like '4013%'",
        "type": "environmental_tire_collection_control",
        "name": "콜롬비아 타이어 환경관리·VUCE 확인",
        "agency": "competent Colombian environmental authority / VUCE / DIAN",
        "basis": "VUCE prior approval context for selective collection and environmental management of used tires",
        "summary": "타이어류는 수입자 환경관리, 선택수거·처리체계, VUCE 사전승인 또는 관련 환경규제 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "제품 규격", "수입자 환경관리자료(해당 시)", "VUCE 승인자료(해당 시)"],
        "notes": "신품/중고, 차량용/산업용, 수입자 등록, 회수·처리 의무 여부에 따라 절차가 달라질 수 있습니다.",
        "source_name": "VUCE tire environmental approval notice",
        "source_url": "https://www.vuce.gov.co/noticias/avisos/diligenciamiento-del-permiso-sistema-de-recoleccio",
    },
    {
        "condition": "destination_hs_code like '8517%' or destination_hs_code like '8525%' or destination_hs_code like '8526%' or destination_hs_code like '8527%' or destination_hs_code like '8528%' or destination_hs_code like '8543%' or destination_hs_code like '9026%' or destination_hs_code like '9030%'",
        "type": "telecom_equipment_homologation",
        "name": "콜롬비아 통신·무선기기 homologación 확인",
        "agency": "MinTIC / CRC / DIAN",
        "basis": "MinTIC/CRC homologation requirements for telecommunications terminal equipment",
        "summary": "통신장비, 이동통신 단말, 무선기기, IoT, 네트워크 장비는 homologación, IMEI/단말 등록, 주파수·인체노출 기준, 판매승인 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "제품 사양서", "무선/통신 기능 설명", "시험성적서", "CRC/MinTIC homologación 자료(해당 시)"],
        "notes": "이동통신 단말 여부, 공중망 접속, 주파수 사용, 판매용/샘플, IMEI 등록 대상 여부에 따라 절차가 달라질 수 있습니다.",
        "source_name": "MinTIC/CRC telecom homologation",
        "source_url": CRC_HOMOLOGATION_SOURCE_URL,
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
  'COL',
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
  encode(digest('COL|' || heading.destination_hs_code || '|' || {sql(requirement["type"])} || '|' || {sql(requirement["name"])} || '|' || {sql(SOURCE_VERSION)}, 'sha256'), 'hex')
from (
  select distinct left(destination_hs_code, 4) as destination_hs_code
  from public.export_destination_tariff_rates
  where country_code = 'COL'
    and source_version = 'customs-country-tariff-20251231:COL'
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

    output = f"""-- Generated by scripts/generate_colombia_import_data_seed.py

begin;

delete from public.export_destination_internal_taxes
where country_code = 'COL'
  and source_version like '{SOURCE_VERSION}%';

delete from public.export_destination_import_requirements
where country_code = 'COL'
  and source_version like '{SOURCE_VERSION}%';

insert into public.export_destination_internal_taxes (
  country_code, destination_hs_code, tax_type, tax_name, rate_text, basis, notes,
  source_name, source_url, source_version, effective_from, effective_to,
  published_at, retrieved_at, status, checksum
)
select
  'COL',
  tariff.destination_hs_code,
  'vat',
  '수입 IVA',
  '19%',
  '콜롬비아 수입 IVA 표준세율 후보',
  'DIAN 해석 기준으로 별도 제외·면세·차등세율 대상이 아닌 수입 물품은 일반 IVA 19% 적용 후보입니다. 품목별 5%, 0%, 제외 대상과 특별세는 별도 확인이 필요합니다.',
  'DIAN IVA general',
  {sql(DIAN_VAT_SOURCE_URL)},
  {sql(SOURCE_VERSION + ':vat')},
  date '2026-01-01',
  null::date,
  null::timestamptz,
  now(),
  'staged'::public.legal_record_status,
  encode(digest('COL|vat|' || tariff.destination_hs_code || '|' || {sql(SOURCE_VERSION)}, 'sha256'), 'hex')
from (
  select distinct destination_hs_code
  from public.export_destination_tariff_rates
  where country_code = 'COL'
    and source_version = 'customs-country-tariff-20251231:COL'
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
