#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "supabase/seed/generated/eu_import_data_seed.sql"

SOURCE_VERSION = "eu-import-data-20260523"
VAT_SOURCE_URL = "https://taxation-customs.ec.europa.eu/taxation/value-added-tax-vat/vat-rates_en"
TARIC_SOURCE_URL = "https://taxation-customs.ec.europa.eu/customs/calculation-customs-duties/customs-tariff/eu-customs-tariff-taric_en"
ACCESS2MARKETS_SOURCE_URL = "https://trade.ec.europa.eu/access-to-markets/"

COUNTRY_VAT_ROWS = [
    ("EEC", "회원국별", "EU 수입 VAT 회원국별 표준세율", "EU VAT는 수입 회원국별로 표준세율과 감면세율이 달라집니다. 목적 회원국을 선택하면 해당 회원국 표준세율 후보를 확인할 수 있습니다."),
    ("AUT", "20%", "오스트리아 수입 VAT 표준세율 후보", "오스트리아 VAT는 품목별 감면세율이 있을 수 있으므로 식품, 의약품, 도서 등은 별도 확인이 필요하다."),
    ("BEL", "21%", "벨기에 수입 VAT 표준세율 후보", "벨기에 VAT는 품목별 감면세율이 있을 수 있으므로 식품, 의약품, 도서 등은 별도 확인이 필요하다."),
    ("BGR", "20%", "불가리아 수입 VAT 표준세율 후보", "불가리아 VAT는 품목별 감면세율이 있을 수 있으므로 품목별 확인이 필요하다."),
    ("HRV", "25%", "크로아티아 수입 VAT 표준세율 후보", "크로아티아 VAT는 품목별 감면세율이 있을 수 있으므로 품목별 확인이 필요하다."),
    ("CYP", "19%", "키프로스 수입 VAT 표준세율 후보", "키프로스 VAT는 품목별 감면세율이 있을 수 있으므로 품목별 확인이 필요하다."),
    ("CZE", "21%", "체코 수입 VAT 표준세율 후보", "체코 VAT는 품목별 감면세율이 있을 수 있으므로 품목별 확인이 필요하다."),
    ("DNK", "25%", "덴마크 수입 VAT 표준세율 후보", "덴마크 VAT는 일반적으로 단일 표준세율 중심이나 면세·특례 여부는 품목별 확인이 필요하다."),
    ("EST", "24%", "에스토니아 수입 VAT 표준세율 후보", "에스토니아 VAT는 품목별 감면세율이 있을 수 있으므로 품목별 확인이 필요하다."),
    ("FIN", "25.5%", "핀란드 수입 VAT 표준세율 후보", "핀란드 VAT는 품목별 감면세율이 있을 수 있으므로 품목별 확인이 필요하다."),
    ("FRA", "20%", "프랑스 수입 VAT 표준세율 후보", "프랑스 VAT는 10%, 5.5%, 2.1% 등 감면세율이 있을 수 있으므로 품목별 확인이 필요하다."),
    ("DEU", "19%", "독일 수입 VAT 표준세율 후보", "독일 VAT는 품목별 감면세율이 있을 수 있으므로 음식료품, 의약품, 도서 등은 별도 확인이 필요하다."),
    ("GRC", "24%", "그리스 수입 VAT 표준세율 후보", "그리스 VAT는 품목별 감면세율이 있을 수 있으므로 품목별 확인이 필요하다."),
    ("HUN", "27%", "헝가리 수입 VAT 표준세율 후보", "헝가리 VAT는 품목별 감면세율이 있을 수 있으므로 품목별 확인이 필요하다."),
    ("IRL", "23%", "아일랜드 수입 VAT 표준세율 후보", "아일랜드 VAT는 품목별 감면세율이 있을 수 있으므로 품목별 확인이 필요하다."),
    ("ITA", "22%", "이탈리아 수입 VAT 표준세율 후보", "이탈리아 VAT는 품목별 감면세율이 있을 수 있으므로 품목별 확인이 필요하다."),
    ("LVA", "21%", "라트비아 수입 VAT 표준세율 후보", "라트비아 VAT는 품목별 감면세율이 있을 수 있으므로 품목별 확인이 필요하다."),
    ("LTU", "21%", "리투아니아 수입 VAT 표준세율 후보", "리투아니아 VAT는 품목별 감면세율이 있을 수 있으므로 품목별 확인이 필요하다."),
    ("LUX", "17%", "룩셈부르크 수입 VAT 표준세율 후보", "룩셈부르크 VAT는 품목별 감면세율이 있을 수 있으므로 품목별 확인이 필요하다."),
    ("MLT", "18%", "몰타 수입 VAT 표준세율 후보", "몰타 VAT는 품목별 감면세율이 있을 수 있으므로 품목별 확인이 필요하다."),
    ("NLD", "21%", "네덜란드 수입 VAT 표준세율 후보", "네덜란드 VAT는 품목별 감면세율이 있을 수 있으므로 품목별 확인이 필요하다."),
    ("POL", "23%", "폴란드 수입 VAT 표준세율 후보", "폴란드 VAT는 품목별 감면세율이 있을 수 있으므로 품목별 확인이 필요하다."),
    ("PRT", "23%", "포르투갈 수입 VAT 표준세율 후보", "포르투갈 VAT는 품목별 감면세율이 있을 수 있으므로 품목별 확인이 필요하다."),
    ("ROU", "21%", "루마니아 수입 VAT 표준세율 후보", "루마니아 VAT는 품목별 감면세율이 있을 수 있으므로 품목별 확인이 필요하다."),
    ("SVK", "23%", "슬로바키아 수입 VAT 표준세율 후보", "슬로바키아 VAT는 품목별 감면세율이 있을 수 있으므로 품목별 확인이 필요하다."),
    ("SVN", "22%", "슬로베니아 수입 VAT 표준세율 후보", "슬로베니아 VAT는 품목별 감면세율이 있을 수 있으므로 품목별 확인이 필요하다."),
    ("ESP", "21%", "스페인 수입 VAT 표준세율 후보", "스페인 VAT는 품목별 감면세율이 있을 수 있으므로 품목별 확인이 필요하다."),
    ("SWE", "25%", "스웨덴 수입 VAT 표준세율 후보", "스웨덴 VAT는 품목별 감면세율이 있을 수 있으므로 품목별 확인이 필요하다."),
]

REQUIREMENTS = [
    {
        "condition": "destination_hs_code like '02%' or destination_hs_code like '03%' or destination_hs_code like '04%' or destination_hs_code like '07%' or destination_hs_code like '08%' or destination_hs_code like '09%' or destination_hs_code like '10%' or destination_hs_code like '11%' or destination_hs_code like '12%' or destination_hs_code like '15%' or destination_hs_code like '16%' or destination_hs_code like '17%' or destination_hs_code like '18%' or destination_hs_code like '19%' or destination_hs_code like '20%' or destination_hs_code like '21%' or destination_hs_code like '22%'",
        "type": "food_safety",
        "name": "EU 식품·사료 수입규제 확인",
        "agency": "European Commission / Member State competent authority",
        "basis": "EU food and feed import rules / Access2Markets product requirements",
        "summary": "식품, 사료, 식품접촉 가능 물품은 EU 식품안전, 위생, 잔류물질, 표시, 회원국 검사 요건 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "성분/제조공정 자료", "위생증명서 또는 검사증명서(해당 시)", "라벨 자료"],
        "notes": "HS만으로 확정하지 않고 원재료, 가공상태, 식품접촉 여부, 판매 목적, 목적 회원국을 함께 확인합니다.",
    },
    {
        "condition": "destination_hs_code like '28%' or destination_hs_code like '29%' or destination_hs_code like '32%' or destination_hs_code like '33%' or destination_hs_code like '34%' or destination_hs_code like '38%'",
        "type": "chemical_reach_clp",
        "name": "EU REACH/CLP 화학물질 규제 확인",
        "agency": "European Chemicals Agency / Member State authority",
        "basis": "REACH, CLP and EU chemical controls",
        "summary": "화학물질, 혼합물, 화장품 원료성 제품은 REACH 등록, 제한물질, CLP 분류·라벨, SDS 확인 대상 가능성이 있습니다.",
        "documents": ["CAS 번호", "SDS", "성분비", "용도 설명", "REACH 등록/면제 확인자료(해당 시)"],
        "notes": "성분, 농도, 연간 톤수, 수입자 역할, 완제품/혼합물 여부에 따라 적용이 달라질 수 있습니다.",
    },
    {
        "condition": "destination_hs_code like '3304%'",
        "type": "cosmetics",
        "name": "EU 화장품 규정 확인",
        "agency": "European Commission / Member State market surveillance",
        "basis": "EU Cosmetics Regulation and Access2Markets requirements",
        "summary": "화장품은 책임자, CPNP 통지, PIF, 안전성 평가, 성분 제한, 라벨 표시 확인 대상 가능성이 있습니다.",
        "documents": ["전성분표", "제품 라벨", "PIF/안전성 평가 자료", "책임자 정보", "CPNP 통지 자료(해당 시)"],
        "notes": "효능 표현, 금지·제한 성분, 나노물질, 알레르겐 표시, 목적 회원국 언어 표시를 확인합니다.",
    },
    {
        "condition": "destination_hs_code like '84%' or destination_hs_code like '85%' or destination_hs_code like '90%'",
        "type": "ce_product_safety",
        "name": "EU CE/제품안전 규제 확인",
        "agency": "European Commission / Member State market surveillance",
        "basis": "EU product safety, CE marking, EMC, LVD, RoHS and sectoral regulations",
        "summary": "기계·전기전자·측정기기·의료기기성 제품은 CE 적합성, EMC/LVD/RoHS/기계류/의료기기 등 부문별 규제 확인 대상 가능성이 있습니다.",
        "documents": ["제품 사양서", "DoC 적합성선언서", "시험성적서", "기술문서", "라벨/사용설명서"],
        "notes": "정격, 용도, 통신 기능, 의료 목적, 배터리 포함 여부에 따라 적용 법령이 달라질 수 있습니다.",
    },
    {
        "condition": "destination_hs_code like '61%' or destination_hs_code like '62%' or destination_hs_code like '63%' or destination_hs_code like '64%'",
        "type": "textile_labeling",
        "name": "EU 섬유·의류 표시 및 제품안전 확인",
        "agency": "European Commission / Member State authority",
        "basis": "EU textile fibre names and labelling rules / General Product Safety",
        "summary": "섬유·의류·신발류는 섬유조성 표시, 원산지/라벨 언어, 화학물질 제한, 일반제품안전 요건 확인 대상 가능성이 있습니다.",
        "documents": ["섬유 조성표", "라벨 시안", "시험성적서(해당 시)", "제품 사양서"],
        "notes": "아동용, 피부접촉, 기능성 처리, 가죽/모피 포함 여부에 따라 추가 요건이 생길 수 있습니다.",
    },
]


def sql(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def doc_array(documents: list[str]) -> str:
    return ", ".join(sql(document) for document in documents)


def main() -> None:
    vat_values = ",\n".join(
        f"    ({sql(country)}, {sql(rate)}, {sql(basis)}, {sql(notes)})"
        for country, rate, basis, notes in COUNTRY_VAT_ROWS
    )

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
  'EEC',
  heading.destination_hs_code,
  {sql(requirement["type"])},
  {sql(requirement["name"])},
  {sql(requirement["agency"])},
  {sql(requirement["basis"])},
  {sql(requirement["summary"])},
  jsonb_build_array({doc_array(requirement["documents"])}),
  {sql(requirement["notes"])},
  'European Commission TARIC / Access2Markets',
  {sql(ACCESS2MARKETS_SOURCE_URL)},
  {sql(SOURCE_VERSION + ':import-requirements')},
  date '2026-01-01',
  null::date,
  null::timestamptz,
  now(),
  'staged'::public.legal_record_status,
  encode(digest('EEC|' || heading.destination_hs_code || '|' || {sql(requirement["type"])} || '|' || {sql(requirement["name"])} || '|' || {sql(SOURCE_VERSION)}, 'sha256'), 'hex')
from (
  select distinct left(destination_hs_code, 4) as destination_hs_code
  from public.export_destination_tariff_rates
  where country_code = 'EEC'
    and source_version = 'customs-country-tariff-20251231:EEC'
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

    output = f"""-- Generated by scripts/generate_eu_import_data_seed.py

begin;

delete from public.export_destination_internal_taxes
where country_code in ({", ".join(sql(country) for country, _, _, _ in COUNTRY_VAT_ROWS)})
  and source_version like '{SOURCE_VERSION}%';

delete from public.export_destination_import_requirements
where country_code = 'EEC'
  and source_version like '{SOURCE_VERSION}%';

with member_vat(country_code, rate_text, basis, notes) as (
  values
{vat_values}
)
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
  member_vat.country_code,
  tariff.destination_hs_code,
  'vat',
  '수입 VAT',
  member_vat.rate_text,
  member_vat.basis,
  member_vat.notes,
  'European Commission VAT rates / TEDB',
  {sql(VAT_SOURCE_URL)},
  {sql(SOURCE_VERSION + ':vat')},
  date '2026-01-01',
  null::date,
  null::timestamptz,
  now(),
  'staged'::public.legal_record_status,
  encode(digest(member_vat.country_code || '|vat|' || tariff.destination_hs_code || '|' || {sql(SOURCE_VERSION)}, 'sha256'), 'hex')
from (
  select distinct destination_hs_code
  from public.export_destination_tariff_rates
  where country_code = 'EEC'
    and source_version = 'customs-country-tariff-20251231:EEC'
) tariff
cross join member_vat
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
