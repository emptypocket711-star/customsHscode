#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "supabase/seed/generated/china_additional_industrial_import_requirements_seed.sql"

SOURCE_VERSION = "china-additional-industrial-import-requirements-2026"
SAMR_BATTERY_SOURCE_URL = "https://www.samr.gov.cn/zw/zfxxgk/fdzdgknr/rzjgs/art/2023/art_ad15150414fe40d3807857910bff7118.html"
SAMR_CCC_SOURCE_URL = "https://www.samr.gov.cn/cms_files/filemanager/samr/www/samrnew/samrgkml/nsjg/rzjgs/202004/W020200428419284306124.pdf"
GACC_PLANT_QUARANTINE_SOURCE_URL = "https://english.customs.gov.cn/inspection/html/animal.html"
ANIMAL_PLANT_QUARANTINE_LAW_SOURCE_URL = "https://www.npc.gov.cn/zgrdw/englishnpc/Law/2007-12/12/content_1383874.htm"

REQUIREMENTS = [
    {
        "condition": "destination_hs_code like '850760%' or destination_hs_code like '850650%' or destination_hs_code like '850780%' or destination_hs_code like '850440%'",
        "type": "ccc_battery",
        "name": "중국 리튬이온 배터리·전원제품 CCC 인증",
        "agency": "State Administration for Market Regulation / CNCA",
        "basis": "SAMR Announcement No.10 of 2023",
        "summary": "전자전기제품용 리튬이온전지·배터리팩, 보조배터리, 통신단말용 전원어댑터/충전기는 CCC 인증 대상 가능성이 있습니다.",
        "documents": ["CCC 인증서", "제품 사양서", "배터리 셀/팩 구조 자료", "정격/용도 자료", "라벨 표시 자료"],
        "notes": "HS만으로 확정하지 않고 전자전기제품용 여부, 보조배터리 여부, 통신단말용 어댑터/충전기 여부, 정격과 모델을 확인합니다.",
        "source_name": "SAMR lithium-ion battery CCC certification announcement",
        "source_url": SAMR_BATTERY_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '8701%' or destination_hs_code like '8702%' or destination_hs_code like '8703%' or destination_hs_code like '8704%' or destination_hs_code like '8705%' or destination_hs_code like '8706%' or destination_hs_code like '8707%' or destination_hs_code like '8708%' or destination_hs_code like '4011%' or destination_hs_code like '7007%' or destination_hs_code like '940120%'",
        "type": "ccc_vehicle_parts",
        "name": "중국 자동차·부품 CCC 인증 확인",
        "agency": "State Administration for Market Regulation / CNCA",
        "basis": "China Compulsory Certification catalogue",
        "summary": "자동차, 이륜차, 안전부품, 타이어, 안전유리, 좌석·머리지지대 등은 CCC 인증 또는 안전규제 확인 대상 가능성이 있습니다.",
        "documents": ["CCC 인증서", "제품 사양서", "차량/부품 용도 자료", "시험성적서", "라벨 표시 자료"],
        "notes": "모든 자동차부품이 CCC 대상은 아니므로 부품 종류, 완성차/AS부품 여부, 안전부품 해당 여부를 확인합니다.",
        "source_name": "SAMR/CNCA compulsory product certification catalogue",
        "source_url": SAMR_CCC_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '4401%' or destination_hs_code like '4403%' or destination_hs_code like '4407%' or destination_hs_code like '4412%' or destination_hs_code like '4418%' or destination_hs_code like '940330%' or destination_hs_code like '940340%' or destination_hs_code like '940350%' or destination_hs_code like '940360%'",
        "type": "plant_quarantine_wood",
        "name": "중국 목재·목제품 동식물검역 확인",
        "agency": "General Administration of Customs of China",
        "basis": "Law of the PRC on the Entry and Exit Animal and Plant Quarantine",
        "summary": "원목, 제재목, 합판, 목제품, 목재가구 등은 병해충, 수피, 열처리/훈증, 원산국·수종 조건에 따라 검역증명 및 검사 대상 가능성이 있습니다.",
        "documents": ["식물검역증명서", "훈증/열처리 증명(해당 시)", "수종/학명 자료", "가공상태 자료", "송장", "포장명세서"],
        "notes": "고도 가공 제품과 원목·제재목은 위험도가 다릅니다. 수종, 수피 포함 여부, 포장재, 원산국 검역요건을 확인합니다.",
        "source_name": "GACC animal and plant quarantine supervision",
        "source_url": GACC_PLANT_QUARANTINE_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '0601%' or destination_hs_code like '0602%' or destination_hs_code like '0603%' or destination_hs_code like '0604%' or destination_hs_code like '1209%'",
        "type": "plant_quarantine_seedling",
        "name": "중국 식물·종자·묘목 검역 확인",
        "agency": "General Administration of Customs of China",
        "basis": "Law of the PRC on the Entry and Exit Animal and Plant Quarantine",
        "summary": "식물, 종자, 묘목, 절화 등은 동식물검역법에 따라 수입허가, 검역증명, 항만검사 대상 가능성이 있습니다.",
        "documents": ["식물검역증명서", "수입허가/검역허가 자료(해당 시)", "학명/품종 자료", "송장", "포장명세서"],
        "notes": "품목별 금지·허용 국가, 재배지, 병해충 관리, 유전자원·보호종 여부를 확인합니다.",
        "source_name": "Law of the PRC on Entry and Exit Animal and Plant Quarantine",
        "source_url": ANIMAL_PLANT_QUARANTINE_LAW_SOURCE_URL,
    },
]


def sql(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def doc_array(documents: list[str]) -> str:
    return ", ".join(sql(document) for document in documents)


def requirement_insert(requirement: dict[str, object]) -> str:
    return f"""
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
  'CHN',
  heading.destination_hs_code,
  {sql(str(requirement["type"]))},
  {sql(str(requirement["name"]))},
  {sql(str(requirement["agency"]))},
  {sql(str(requirement["basis"]))},
  {sql(str(requirement["summary"]))},
  jsonb_build_array({doc_array(requirement["documents"]) if isinstance(requirement["documents"], list) else ""}),
  {sql(str(requirement["notes"]))},
  {sql(str(requirement["source_name"]))},
  {sql(str(requirement["source_url"]))},
  {sql(SOURCE_VERSION)},
  date '2026-01-01',
  null::date,
  null::timestamptz,
  now(),
  'staged'::public.legal_record_status,
  encode(digest('CHN|' || heading.destination_hs_code || '|' || {sql(str(requirement["type"]))} || '|' || {sql(str(requirement["name"]))} || '|' || {sql(SOURCE_VERSION)}, 'sha256'), 'hex')
from (
  select distinct left(destination_hs_code, 4) as destination_hs_code
  from public.export_destination_tariff_rates
  where country_code = 'CHN'
    and source_version = 'china-import-export-tariff-2026'
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


def main() -> None:
    output = f"""-- Generated by scripts/generate_china_additional_industrial_requirements_seed.py

begin;

delete from public.export_destination_import_requirements
where country_code = 'CHN'
  and source_version = '{SOURCE_VERSION}';

{"".join(requirement_insert(requirement) for requirement in REQUIREMENTS)}

commit;
"""

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(output, encoding="utf-8")
    print(f"wrote {OUTPUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
