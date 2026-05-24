#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "supabase/seed/generated/mexico_import_data_seed.sql"

SOURCE_VERSION = "mexico-import-data-20260523"
IVA_SOURCE_URL = "https://wwwmatnp.sat.gob.mx/articulo/38511/criterio-9/iva/nv"
SAT_IVA_IMPORT_QUERY_URL = "https://www.gob.mx/tramites/ficha/consulta-sobre-el-iva-en-mercancias-de-importacion/SAT4473"
COFEPRIS_IMPORT_SOURCE_URL = "https://www.gob.mx/cofepris/acciones-y-programas/importaciones-69325"
NOM_SOURCE_URL = "https://www.gob.mx/se/acciones-y-programas/standards"
PLATIICA_SOURCE_URL = "https://platiica.economia.gob.mx/estandarizacion/"
SENASICA_SOURCE_URL = "https://www.gob.mx/senasica"
IFT_SOURCE_URL = "https://www.ift.org.mx/"

REQUIREMENTS = [
    {
        "condition": "destination_hs_code like '02%' or destination_hs_code like '03%' or destination_hs_code like '04%' or destination_hs_code like '07%' or destination_hs_code like '08%' or destination_hs_code like '09%' or destination_hs_code like '10%' or destination_hs_code like '11%' or destination_hs_code like '12%' or destination_hs_code like '15%' or destination_hs_code like '16%' or destination_hs_code like '17%' or destination_hs_code like '18%' or destination_hs_code like '19%' or destination_hs_code like '20%' or destination_hs_code like '21%' or destination_hs_code like '22%'",
        "type": "cofepris_food_import",
        "name": "멕시코 COFEPRIS 식품·식품첨가물 수입위생 확인",
        "agency": "COFEPRIS / SAT Aduanas",
        "basis": "COFEPRIS sanitary import authorizations",
        "summary": "식품, 식품첨가물, 식품원료, 건강보조성 제품은 COFEPRIS 위생허가, 사전 수입확인, 라벨 및 성분 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "성분표", "제품 라벨", "COFEPRIS 허가 또는 신고자료(해당 시)", "위생증명서 또는 원산지증명서(해당 시)"],
        "notes": "제품 성격, 성분, 표시 문구, 소비자 판매 여부와 멕시코 보건 분류에 따라 COFEPRIS 대상 여부가 달라질 수 있습니다.",
        "source_name": "COFEPRIS import authorizations",
        "source_url": COFEPRIS_IMPORT_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '01%' or destination_hs_code like '02%' or destination_hs_code like '03%' or destination_hs_code like '04%' or destination_hs_code like '05%' or destination_hs_code like '06%' or destination_hs_code like '07%' or destination_hs_code like '08%' or destination_hs_code like '10%' or destination_hs_code like '12%' or destination_hs_code like '14%' or destination_hs_code like '41%' or destination_hs_code like '42%' or destination_hs_code like '43%' or destination_hs_code like '44%' or destination_hs_code like '45%' or destination_hs_code like '46%' or destination_hs_code like '51%'",
        "type": "senasica_sanitary_phytosanitary",
        "name": "멕시코 SENASICA 동식물검역·위생요건 확인",
        "agency": "SENASICA / SAT Aduanas",
        "basis": "Mexico sanitary and phytosanitary import controls",
        "summary": "동물, 식물, 농수산물, 목재, 가죽, 모피, 양모 등은 동식물검역, 위생·식물검역증명서, 수입허가 또는 검사 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "학명/동물종/수종 정보", "검역증명서(해당 시)", "수입허가 자료(해당 시)", "처리·가공 증명자료(해당 시)"],
        "notes": "원산지, 가공상태, 식용/비식용, 질병·병해충 위험과 SENASICA 품목별 요건에 따라 조건이 달라질 수 있습니다.",
        "source_name": "SENASICA sanitary and phytosanitary controls",
        "source_url": SENASICA_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '30%' or destination_hs_code like '3006%' or destination_hs_code like '9018%' or destination_hs_code like '9021%' or destination_hs_code like '9022%'",
        "type": "cofepris_drug_medical_device",
        "name": "멕시코 COFEPRIS 의약품·의료기기 수입허가 확인",
        "agency": "COFEPRIS / SAT Aduanas",
        "basis": "COFEPRIS sanitary import authorizations for health products",
        "summary": "의약품, 의료기기, 진단기기성 제품은 COFEPRIS 위생등록, 수입허가, 위험등급별 등록·신고, 라벨 확인 대상 가능성이 있습니다.",
        "documents": ["제품 사양서", "성분/모델 정보", "용도 설명", "COFEPRIS 등록·허가 자료(해당 시)", "라벨/사용설명서", "제조자 품질문서(해당 시)"],
        "notes": "치료 목적, 인체 사용 목적, 의료기기 등급, 진단용 여부에 따라 적용 제도와 필요 허가가 달라질 수 있습니다.",
        "source_name": "COFEPRIS import authorizations",
        "source_url": COFEPRIS_IMPORT_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '3304%'",
        "type": "cofepris_cosmetics_labeling",
        "name": "멕시코 COFEPRIS 화장품·라벨 확인",
        "agency": "COFEPRIS / SAT Aduanas",
        "basis": "COFEPRIS sanitary controls and Mexican labelling rules",
        "summary": "화장품은 COFEPRIS 위생규제, 성분 제한, 스페인어 라벨, 효능표현 및 소비자 표시 확인 대상 가능성이 있습니다.",
        "documents": ["전성분표", "제품 라벨", "제품 정보자료", "수입자/책임회사 자료", "COFEPRIS 관련 허가 또는 신고자료(해당 시)"],
        "notes": "의약품성 효능 표현이 있거나 치료 목적을 표방하면 화장품이 아닌 의약품 또는 의료기기 규제가 적용될 수 있습니다.",
        "source_name": "COFEPRIS import authorizations",
        "source_url": COFEPRIS_IMPORT_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '39%' or destination_hs_code like '40%' or destination_hs_code like '68%' or destination_hs_code like '72%' or destination_hs_code like '73%' or destination_hs_code like '84%' or destination_hs_code like '85%' or destination_hs_code like '87%' or destination_hs_code like '90%' or destination_hs_code like '94%' or destination_hs_code like '95%'",
        "type": "nom_mandatory_standard",
        "name": "멕시코 NOM 강제표준·제품인증 확인",
        "agency": "Secretaria de Economia / competent agencies / SAT Aduanas",
        "basis": "Official Mexican Standards (NOM) and conformity assessment",
        "summary": "전기전자, 기계, 철강, 플라스틱·고무, 차량부품, 완구, 소비재 등 일부 제품은 NOM 강제표준, 적합성평가, 시험성적서, 스페인어 라벨 확인 대상 가능성이 있습니다.",
        "documents": ["제품 사양서", "모델명/규격", "시험성적서", "NOM 인증 또는 적합성 자료(해당 시)", "스페인어 라벨/마킹 자료"],
        "notes": "NOM 대상은 HS만이 아니라 제품명, 모델, 용도, 기술규정, 예외조건에 따라 판단해야 합니다.",
        "source_name": "Secretaria de Economia standards",
        "source_url": NOM_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '8517%' or destination_hs_code like '8525%' or destination_hs_code like '8526%' or destination_hs_code like '8527%' or destination_hs_code like '8528%' or destination_hs_code like '8543%'",
        "type": "ift_telecom_equipment",
        "name": "멕시코 IFT 통신·무선기기 승인 확인",
        "agency": "Instituto Federal de Telecomunicaciones / SAT Aduanas",
        "basis": "IFT telecom and radio equipment approval",
        "summary": "통신장비, 무선기기, Wi-Fi/Bluetooth/RFID 기능 제품은 IFT 형식승인, NOM/IFT 기술규정, 주파수·라벨 조건 대상 가능성이 있습니다.",
        "documents": ["제품 사양서", "무선 모듈/주파수 정보", "시험성적서", "IFT 승인 또는 인증자료(해당 시)", "모델명/제조자 정보"],
        "notes": "무선 기능 포함 여부, 주파수 대역, 완제품/부품 형태, 통신망 접속 여부에 따라 요구사항이 달라질 수 있습니다.",
        "source_name": "Instituto Federal de Telecomunicaciones",
        "source_url": IFT_SOURCE_URL,
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
  'MEX',
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
  encode(digest('MEX|' || heading.destination_hs_code || '|' || {sql(requirement["type"])} || '|' || {sql(requirement["name"])} || '|' || {sql(SOURCE_VERSION)}, 'sha256'), 'hex')
from (
  select distinct left(destination_hs_code, 4) as destination_hs_code
  from public.export_destination_tariff_rates
  where country_code = 'MEX'
    and source_version = 'customs-country-tariff-20251231:MEX'
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

    output = f"""-- Generated by scripts/generate_mexico_import_data_seed.py

begin;

delete from public.export_destination_internal_taxes
where country_code = 'MEX'
  and source_version like '{SOURCE_VERSION}%';

delete from public.export_destination_import_requirements
where country_code = 'MEX'
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
  'MEX',
  tariff.destination_hs_code,
  'vat',
  '수입 IVA',
  '16%',
  '멕시코 수입 IVA 일반세율 후보',
  'SAT IVA 법령 안내 기준 멕시코 내 재화 수입은 일반적으로 IVA 16% 대상입니다. 0%, 면세, 북부/남부 국경지역 인센티브, 임시수입, IMMEX, 특정 품목 예외는 별도 확인이 필요합니다.',
  'SAT IVA import guidance',
  {sql(IVA_SOURCE_URL)},
  {sql(SOURCE_VERSION + ':iva')},
  date '2026-01-01',
  null::date,
  null::timestamptz,
  now(),
  'staged'::public.legal_record_status,
  encode(digest('MEX|iva|16|' || tariff.destination_hs_code || '|' || {sql(SOURCE_VERSION)}, 'sha256'), 'hex')
from (
  select distinct destination_hs_code
  from public.export_destination_tariff_rates
  where country_code = 'MEX'
    and source_version = 'customs-country-tariff-20251231:MEX'
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
