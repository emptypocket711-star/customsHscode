#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "supabase/seed/generated/brazil_import_data_seed.sql"

SOURCE_VERSION = "brazil-import-data-20260524"
RECEITA_IMPORT_SOURCE_URL = "https://www.gov.br/receitafederal/pt-br/servicos/aduana/importacao"
RECEITA_PIS_COFINS_SOURCE_URL = "https://www.gov.br/receitafederal/pt-br/assuntos/aduana-e-comercio-exterior/manuais/despacho-de-importacao/sistemas/siscomex-importacao-web/declaracao-de-importacao/funcionalidades/elaborar-uma-nova-solicitacao-de-di/preenchimento-da-di-1/formularios-de-dados-especificos-da-adicao/aba-tributos-1/campos-relativos-as-contribuicoes-pis-pasep-e-cofins"
RECEITA_IPI_SOURCE_URL = "https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/tributos/ipi"
RECEITA_NCM_SOURCE_URL = "https://www.gov.br/receitafederal/pt-br/assuntos/aduana-e-comercio-exterior/classificacao-fiscal-de-mercadorias/ncm"
SISCOMEX_TREATMENT_SOURCE_URL = "https://www.gov.br/siscomex/pt-br/informacoes/tratamento-administrativos/tratamento-administrativo-na-importacao"
MAPA_IMPORT_SOURCE_URL = "https://www.gov.br/agricultura/pt-br/internacional/portugues/importacao"
MAPA_ANIMAL_SOURCE_URL = "https://www.gov.br/agricultura/pt-br/internacional/portugues/importacao/animal"
ANVISA_SOURCE_URL = "https://www.gov.br/anvisa/pt-br/assuntos/noticias-anvisa/2024/anvisa-esclarece-sobre-tratamentos-administrativos-na-importacao-de-insumos"
ANATEL_SOURCE_URL = "https://www.gov.br/anatel/pt-br/regulado/certificacao-de-produtos"

REQUIREMENTS = [
    {
        "condition": "destination_hs_code like '01%' or destination_hs_code like '02%' or destination_hs_code like '03%' or destination_hs_code like '04%' or destination_hs_code like '05%' or destination_hs_code like '41%' or destination_hs_code like '42%' or destination_hs_code like '43%' or destination_hs_code like '51%'",
        "type": "apa_animal_food_import_control",
        "name": "브라질 동물·동물성 제품 MAPA 확인",
        "agency": "MAPA / Receita Federal",
        "basis": "Siscomex LPCO import treatment and MAPA animal/plant sanitary controls",
        "summary": "동물, 축산물, 수산물, 동물성 원료, 가죽·모피·양모 등은 MAPA/Vigiagro 수입허가, 위생·검역요건, 위생증명서, LPCO/LI 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "B/L 또는 AWB", "포장명세서", "동물종/원재료 정보", "위생증명서(해당 시)", "MAPA/Vigiagro 허가자료(해당 시)"],
        "notes": "식용/사료용/산업용 구분, 동물종, 원산국·시설등록, 가공도, 검역·CITES 여부에 따라 요구사항이 달라질 수 있습니다.",
        "source_name": "MAPA importação animal",
        "source_url": MAPA_ANIMAL_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '06%' or destination_hs_code like '07%' or destination_hs_code like '08%' or destination_hs_code like '09%' or destination_hs_code like '10%' or destination_hs_code like '11%' or destination_hs_code like '12%' or destination_hs_code like '14%' or destination_hs_code like '15%' or destination_hs_code like '16%' or destination_hs_code like '17%' or destination_hs_code like '18%' or destination_hs_code like '19%' or destination_hs_code like '20%' or destination_hs_code like '21%' or destination_hs_code like '22%' or destination_hs_code like '23%'",
        "type": "apa_food_plant_import_control",
        "name": "브라질 식품·농산물·식물검역 MAPA/ANVISA 확인",
        "agency": "MAPA / ANVISA / Receita Federal",
        "basis": "Siscomex LPCO import treatment, MAPA Vigiagro and ANVISA import controls",
        "summary": "식품, 농산물, 식물, 종자, 곡물, 음료, 사료류는 MAPA/ANVISA 수입허가·regularização, Vigiagro 식물검역·LPCO/LI, 위생·라벨 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "성분표", "제품 라벨", "식물검역증명서(해당 시)", "MAPA/ANVISA 등록 또는 허가자료(해당 시)"],
        "notes": "식품/사료/재식용, 원산국·시설등록, 가공도, Siscomex LPCO/LI 대상, Vigiagro 검사, ANVISA anuência 여부에 따라 요구자료가 달라질 수 있습니다.",
        "source_name": "MAPA/Vigiagro importação vegetal",
        "source_url": MAPA_IMPORT_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '30%' or destination_hs_code like '9018%' or destination_hs_code like '9021%' or destination_hs_code like '9022%'",
        "type": "minsa_health_product_control",
        "name": "브라질 의약품·의료기기 ANVISA 확인",
        "agency": "ANVISA / Receita Federal",
        "basis": "ANVISA import licensing and health-product regularization context",
        "summary": "의약품, 원료의약품, 의료기기, 체외진단기기는 ANVISA anuência/regularização, 수입자 habilitação/regularização, 제품분류, 라벨·사용목적 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "제품 사양서", "성분표 또는 분류자료", "ANVISA regularização 또는 허가자료(해당 시)", "라벨/사용설명서"],
        "notes": "의약품/의료기기/식품보조제/화장품 분류, 등록제품 여부와 통제물질 여부에 따라 절차가 달라질 수 있습니다.",
        "source_name": "ANVISA",
        "source_url": ANVISA_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '3303%' or destination_hs_code like '3304%' or destination_hs_code like '3305%' or destination_hs_code like '3306%' or destination_hs_code like '3307%' or destination_hs_code like '3401%' or destination_hs_code like '3402%' or destination_hs_code like '3808%'",
        "type": "minsa_cosmetics_hygiene_control",
        "name": "브라질 화장품·위생제품 ANVISA 확인",
        "agency": "ANVISA / Receita Federal",
        "basis": "ANVISA cosmetics, hygiene products and saneantes import control context",
        "summary": "화장품, 퍼스널케어, 세정제, 위생제품, 살충·소독 제품은 ANVISA regularização, 성분·라벨, 제품분류 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "전성분표", "제품 라벨", "제품 사양서", "ANVISA regularização 자료(해당 시)"],
        "notes": "치료·살균 효능, 제한성분, 화장품/의약품/위생제품/농약 분류와 스페인어 표시 여부에 따라 관할과 요건이 달라질 수 있습니다.",
        "source_name": "ANVISA",
        "source_url": ANVISA_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '28%' or destination_hs_code like '29%' or destination_hs_code like '32%' or destination_hs_code like '34%' or destination_hs_code like '35%' or destination_hs_code like '38%' or destination_hs_code like '39%' or destination_hs_code like '40%'",
        "type": "chemical_hazardous_product_control",
        "name": "브라질 화학물질·위험제품 확인",
        "agency": "ANVISA / Receita Federal",
        "basis": "Siscomex administrative treatment and Receita Federal import context",
        "summary": "화학물질, 혼합물, 위험물, 세정제, 플라스틱·고무 원료는 MSDS, 위험물 분류, 제한물질, ANVISA anuência/regularização 또는 관할기관 승인 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "MSDS", "성분표", "위험물 분류자료", "라벨/표시 자료"],
        "notes": "성분, 농도, UN 번호, 용도, 소비자용/산업용, 살생물·농약·의약품성 표시 여부에 따라 요구사항이 달라질 수 있습니다.",
        "source_name": "Receita Federal import context",
        "source_url": SISCOMEX_TREATMENT_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '8517%' or destination_hs_code like '8525%' or destination_hs_code like '8526%' or destination_hs_code like '8527%' or destination_hs_code like '8528%' or destination_hs_code like '8543%' or destination_hs_code like '9026%' or destination_hs_code like '9030%'",
        "type": "telecom_wireless_homologation",
        "name": "브라질 통신·무선기기 ANATEL homologação 확인",
        "agency": "ANATEL / Receita Federal",
        "basis": "ANATEL homologation procedure for telecommunication products",
        "summary": "통신장비, 이동통신 단말, 무선기기, IoT, 네트워크 장비는 ANATEL homologação, 주파수·기술기준, 단말 모델 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "제품 사양서", "무선/통신 기능 설명", "시험성적서", "ANATEL homologação 자료(해당 시)"],
        "notes": "무선기기 여부, 공중망 접속, 주파수 사용, 판매용/샘플 여부에 따라 절차가 달라질 수 있습니다.",
        "source_name": "ANATEL homologação",
        "source_url": ANATEL_SOURCE_URL,
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
  'BRA',
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
  encode(digest('BRA|' || heading.destination_hs_code || '|' || {sql(requirement["type"])} || '|' || {sql(requirement["name"])} || '|' || {sql(SOURCE_VERSION)}, 'sha256'), 'hex')
from (
  select distinct left(destination_hs_code, 4) as destination_hs_code
  from public.export_destination_tariff_rates
  where country_code = 'BRA'
    and source_version = 'customs-country-tariff-20251231:BRA'
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

    output = f"""-- Generated by scripts/generate_brazil_import_data_seed.py

begin;

delete from public.export_destination_internal_taxes
where country_code = 'BRA'
  and source_version like '{SOURCE_VERSION}%';

delete from public.export_destination_import_requirements
where country_code = 'BRA'
  and source_version like '{SOURCE_VERSION}%';

insert into public.export_destination_internal_taxes (
  country_code, destination_hs_code, tax_type, tax_name, rate_text, basis, notes,
  source_name, source_url, source_version, effective_from, effective_to,
  published_at, retrieved_at, status, checksum
)
select
  'BRA',
  tariff.destination_hs_code,
  'pis_import',
  '수입 PIS/PASEP-Importação',
  '2.1%',
  '브라질 수입 PIS/PASEP-Importação 표준세율 후보',
  'Receita Federal 안내 예시 기준 PIS/PASEP-Importação 기본 후보는 2.1%입니다. 품목·수입자·용도별 감면, alíquota zero, 특정 제도와 2026년 혜택 축소 규칙은 별도 확인이 필요합니다.',
  'Receita Federal PIS/COFINS importação',
  {sql(RECEITA_PIS_COFINS_SOURCE_URL)},
  {sql(SOURCE_VERSION + ':pis')},
  date '2026-01-01',
  null::date,
  null::timestamptz,
  now(),
  'staged'::public.legal_record_status,
  encode(digest('BRA|pis|' || tariff.destination_hs_code || '|' || {sql(SOURCE_VERSION)}, 'sha256'), 'hex')
from (
  select distinct destination_hs_code
  from public.export_destination_tariff_rates
  where country_code = 'BRA'
    and source_version = 'customs-country-tariff-20251231:BRA'
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


insert into public.export_destination_internal_taxes (
  country_code, destination_hs_code, tax_type, tax_name, rate_text, basis, notes,
  source_name, source_url, source_version, effective_from, effective_to,
  published_at, retrieved_at, status, checksum
)
select
  'BRA',
  tariff.destination_hs_code,
  'cofins_import',
  '수입 COFINS-Importação',
  '9.65%',
  '브라질 수입 COFINS-Importação 표준세율 후보',
  'Receita Federal 안내 예시 기준 COFINS-Importação 기본 후보는 9.65%입니다. 품목·수입자·용도별 감면, alíquota zero, 추가 1% 대상과 2026년 혜택 축소 규칙은 별도 확인이 필요합니다.',
  'Receita Federal PIS/COFINS importação',
  {sql(RECEITA_PIS_COFINS_SOURCE_URL)},
  {sql(SOURCE_VERSION + ':cofins')},
  date '2026-01-01',
  null::date,
  null::timestamptz,
  now(),
  'staged'::public.legal_record_status,
  encode(digest('BRA|cofins|' || tariff.destination_hs_code || '|' || {sql(SOURCE_VERSION)}, 'sha256'), 'hex')
from (
  select distinct destination_hs_code
  from public.export_destination_tariff_rates
  where country_code = 'BRA'
    and source_version = 'customs-country-tariff-20251231:BRA'
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

insert into public.export_destination_internal_taxes (
  country_code, destination_hs_code, tax_type, tax_name, rate_text, basis, notes,
  source_name, source_url, source_version, effective_from, effective_to,
  published_at, retrieved_at, status, checksum
)
select
  'BRA',
  tariff.destination_hs_code,
  'ipi_import',
  '수입 IPI',
  '품목별',
  '브라질 수입 IPI 품목별 세율 확인 필요',
  'IPI는 TIPI 기준 품목별 세율이 적용됩니다. 수입 단계 과세표준은 관세 과세가격에 수입 관련 조세와 비용을 더해 계산되므로 실제 세액 계산 시 NCM별 TIPI 확인이 필요합니다.',
  'Receita Federal IPI',
  {sql(RECEITA_IPI_SOURCE_URL)},
  {sql(SOURCE_VERSION + ':ipi')},
  date '2026-01-01',
  null::date,
  null::timestamptz,
  now(),
  'staged'::public.legal_record_status,
  encode(digest('BRA|ipi|' || tariff.destination_hs_code || '|' || {sql(SOURCE_VERSION)}, 'sha256'), 'hex')
from (
  select distinct destination_hs_code
  from public.export_destination_tariff_rates
  where country_code = 'BRA'
    and source_version = 'customs-country-tariff-20251231:BRA'
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

insert into public.export_destination_internal_taxes (
  country_code, destination_hs_code, tax_type, tax_name, rate_text, basis, notes,
  source_name, source_url, source_version, effective_from, effective_to,
  published_at, retrieved_at, status, checksum
)
select
  'BRA',
  tariff.destination_hs_code,
  'icms_import',
  '수입 ICMS',
  '주별',
  '브라질 수입 ICMS 주별 세율 확인 필요',
  'ICMS는 수입 목적지 주(Estado)별로 부과되며 계산은 por dentro 방식으로 수입세 등도 과세표준에 반영될 수 있습니다. 실제 적용은 목적지 주와 품목별 감면·대체과세 규칙 확인이 필요합니다.',
  'Receita Federal import tax guidance',
  {sql(RECEITA_IMPORT_SOURCE_URL)},
  {sql(SOURCE_VERSION + ':icms')},
  date '2026-01-01',
  null::date,
  null::timestamptz,
  now(),
  'staged'::public.legal_record_status,
  encode(digest('BRA|icms|' || tariff.destination_hs_code || '|' || {sql(SOURCE_VERSION)}, 'sha256'), 'hex')
from (
  select distinct destination_hs_code
  from public.export_destination_tariff_rates
  where country_code = 'BRA'
    and source_version = 'customs-country-tariff-20251231:BRA'
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
