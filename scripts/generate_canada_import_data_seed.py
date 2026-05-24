#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "supabase/seed/generated/canada_import_data_seed.sql"

SOURCE_VERSION = "canada-import-data-20260523"
GST_SOURCE_URL = "https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/charge-collect-imports-exports.html"
CFIA_AIRS_SOURCE_URL = "https://inspection.canada.ca/en/importing-food-plants-animals/airs"
HEALTH_PRODUCTS_SOURCE_URL = "https://www.canada.ca/content/dam/hc-sc/documents/services/drugs-health-products/compliance-enforcement/importation-exportation/commercial-use-health-products-guidance/importing-and-exporting-health-products-for-commercial-use-gui-0117.pdf"
COSMETICS_SOURCE_URL = "https://www.canada.ca/en/health-canada/services/consumer-product-safety/cosmetics/notification-cosmetics.html"
STEEL_CONTROLS_SOURCE_URL = "https://www.international.gc.ca/trade-commerce/controls-controles/steel-acier/index.aspx?lang=eng"
TEXTILE_CONTROLS_SOURCE_URL = "https://www.international.gc.ca/controls-controles/textiles/index.aspx?lang=eng"

REQUIREMENTS = [
    {
        "condition": "destination_hs_code like '02%' or destination_hs_code like '03%' or destination_hs_code like '04%' or destination_hs_code like '07%' or destination_hs_code like '08%' or destination_hs_code like '09%' or destination_hs_code like '10%' or destination_hs_code like '11%' or destination_hs_code like '12%' or destination_hs_code like '15%' or destination_hs_code like '16%' or destination_hs_code like '17%' or destination_hs_code like '18%' or destination_hs_code like '19%' or destination_hs_code like '20%' or destination_hs_code like '21%' or destination_hs_code like '22%'",
        "type": "cfia_food",
        "name": "캐나다 CFIA AIRS 식품·농수산물 수입조건 확인",
        "agency": "Canadian Food Inspection Agency / Canada Border Services Agency",
        "basis": "CFIA Automated Import Reference System (AIRS) / Safe Food for Canadians Act",
        "summary": "식품, 농수산물, 식품 원료가 포함된 물품은 CFIA AIRS 기준 허가, 증명서, 검사, Safe Food for Canadians licence 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "성분표", "제조공정 설명", "CFIA AIRS 등록/LPCO 자료(해당 시)", "위생증명서 또는 식물검역증명서(해당 시)"],
        "notes": "AIRS는 품목, 원산지, 캐나다 도착 주, 최종용도에 따라 결과가 달라지므로 HS만으로 확정하지 않습니다.",
        "source_name": "CFIA Automated Import Reference System",
        "source_url": CFIA_AIRS_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '01%' or destination_hs_code like '02%' or destination_hs_code like '03%' or destination_hs_code like '04%' or destination_hs_code like '05%' or destination_hs_code like '41%' or destination_hs_code like '42%' or destination_hs_code like '43%' or destination_hs_code like '51%'",
        "type": "cfia_animal",
        "name": "캐나다 CFIA AIRS 동물·동물성 제품 수입조건 확인",
        "agency": "Canadian Food Inspection Agency / Canada Border Services Agency",
        "basis": "CFIA Automated Import Reference System (AIRS) / Health of Animals Act",
        "summary": "동물, 수산물, 축산물, 가죽, 모피, 양모 등 동물성 제품은 CFIA AIRS 허가, 위생증명서, 검역검사, 최종용도 조건 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "동물종/원재료 정보", "위생증명서(해당 시)", "가공·처리 증명자료(해당 시)", "CFIA AIRS 등록/LPCO 자료(해당 시)"],
        "notes": "동물종, 원산지, 가공상태, 식품용/비식품용, 캐나다 도착 주와 최종용도에 따라 AIRS 조건이 달라질 수 있습니다.",
        "source_name": "CFIA Automated Import Reference System",
        "source_url": CFIA_AIRS_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '06%' or destination_hs_code like '07%' or destination_hs_code like '08%' or destination_hs_code like '12%' or destination_hs_code like '14%' or destination_hs_code like '44%' or destination_hs_code like '45%' or destination_hs_code like '46%' or destination_hs_code like '94%'",
        "type": "cfia_plant_wood",
        "name": "캐나다 CFIA AIRS 식물·목재류 수입조건 확인",
        "agency": "Canadian Food Inspection Agency / Canada Border Services Agency",
        "basis": "CFIA Automated Import Reference System (AIRS) / Plant Protection Act",
        "summary": "식물, 씨앗, 목재, 목재포장재, 식물성 제품은 CFIA AIRS 수입허가, 식물검역증명서, 처리증명, 병해충 검사 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "학명/수종 정보", "식물검역증명서(해당 시)", "처리 또는 훈증 증명서(해당 시)", "CFIA AIRS 등록/LPCO 자료(해당 시)"],
        "notes": "수종, bark 포함 여부, 가공상태, 포장재 여부, 원산지와 캐나다 도착 주에 따라 AIRS 조건이 달라질 수 있습니다.",
        "source_name": "CFIA Automated Import Reference System",
        "source_url": CFIA_AIRS_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '30%' or destination_hs_code like '3006%' or destination_hs_code like '9018%' or destination_hs_code like '9021%' or destination_hs_code like '9022%'",
        "type": "health_products",
        "name": "캐나다 의약품·의료기기 Health Canada 수입규제 확인",
        "agency": "Health Canada / Canada Border Services Agency",
        "basis": "Food and Drugs Act / Health Canada commercial health products import guidance",
        "summary": "의약품, 자연건강제품, 의료기기성 제품은 Health Canada 허가, 라이선스, 제품 등록, 수입자 자격 확인 대상 가능성이 있습니다.",
        "documents": ["제품 사양서", "성분/모델 정보", "용도 설명", "Health Canada 허가·라이선스 자료(해당 시)", "라벨/사용설명서"],
        "notes": "치료 목적 표시, 인체 사용 목적, 의료기기 등급, 자연건강제품 여부에 따라 적용 제도가 달라질 수 있습니다.",
        "source_name": "Health Canada commercial health products import guidance",
        "source_url": HEALTH_PRODUCTS_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '3304%'",
        "type": "cosmetics",
        "name": "캐나다 화장품 Health Canada 신고·표시 확인",
        "agency": "Health Canada / Canada Border Services Agency",
        "basis": "Cosmetic Regulations / Cosmetic Notification",
        "summary": "화장품은 Cosmetic Notification, 성분 제한, 라벨 표시, 안전성 책임 확인 대상 가능성이 있습니다.",
        "documents": ["전성분표", "제품 라벨", "제품 기능/효능 설명", "Cosmetic Notification 자료(해당 시)"],
        "notes": "의약품성 효능 표현이 있거나 치료 목적을 표방하면 화장품이 아닌 health product 규제가 적용될 수 있습니다.",
        "source_name": "Health Canada cosmetic notification",
        "source_url": COSMETICS_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '72%' or destination_hs_code like '73%'",
        "type": "steel_import_controls",
        "name": "캐나다 철강 수입통제·모니터링 확인",
        "agency": "Global Affairs Canada / Canada Border Services Agency",
        "basis": "Export and Import Permits Act / Steel Import Monitoring Program",
        "summary": "일부 철강 제품은 EIPA에 따른 수입통제, 일반수입허가, 모니터링, TRQ 또는 원산·제강국 신고 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "Mill certificate(해당 시)", "원산지/제강국 정보", "수입허가 또는 GIP 자료(해당 시)"],
        "notes": "실제 대상 여부는 HS10, 제품 형태, 원산국, melt and pour 정보, 최신 Notice to Importers 조건에 따라 달라질 수 있습니다.",
        "source_name": "Global Affairs Canada steel import controls",
        "source_url": STEEL_CONTROLS_SOURCE_URL,
    },
    {
        "condition": "destination_hs_code like '61%' or destination_hs_code like '62%' or destination_hs_code like '63%'",
        "type": "textile_import_controls",
        "name": "캐나다 섬유·의류 TPL 수입통제 확인",
        "agency": "Global Affairs Canada / Canada Border Services Agency",
        "basis": "Export and Import Permits Act / Textile and clothing controls",
        "summary": "일부 섬유·의류는 FTA Tariff Preference Level(TPL) 적용 시 수입허가 또는 관리대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "섬유 조성표", "원산지 자료", "TPL/수입허가 자료(해당 시)"],
        "notes": "일반 섬유 수입 전체가 허가대상이라는 의미는 아니며, TPL 또는 특정 협정·물량관리 조건에 해당하는지 확인합니다.",
        "source_name": "Global Affairs Canada textile and clothing controls",
        "source_url": TEXTILE_CONTROLS_SOURCE_URL,
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
  'CAN',
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
  encode(digest('CAN|' || heading.destination_hs_code || '|' || {sql(requirement["type"])} || '|' || {sql(requirement["name"])} || '|' || {sql(SOURCE_VERSION)}, 'sha256'), 'hex')
from (
  select distinct left(destination_hs_code, 4) as destination_hs_code
  from public.export_destination_tariff_rates
  where country_code = 'CAN'
    and source_version = 'customs-country-tariff-20251231:CAN'
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

    output = f"""-- Generated by scripts/generate_canada_import_data_seed.py

begin;

delete from public.export_destination_internal_taxes
where country_code = 'CAN'
  and source_version like '{SOURCE_VERSION}%';

delete from public.export_destination_import_requirements
where country_code = 'CAN'
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
  'CAN',
  tariff.destination_hs_code,
  'gst',
  '수입 GST',
  '5%',
  '캐나다 수입 GST 표준세율 후보',
  'CRA/CBSA 안내 기준으로 캐나다 수입물품에는 GST 또는 HST의 연방 부분이 부과될 수 있습니다. 비과세 수입, 영세율 물품, 참여주 HST의 주정부 부분, ITC 회수 가능성은 거래조건별 확인이 필요합니다.',
  'Canada Revenue Agency GST/HST on imports and exports',
  {sql(GST_SOURCE_URL)},
  {sql(SOURCE_VERSION + ':gst')},
  date '2026-01-01',
  null::date,
  null::timestamptz,
  now(),
  'staged'::public.legal_record_status,
  encode(digest('CAN|gst|' || tariff.destination_hs_code || '|' || {sql(SOURCE_VERSION)}, 'sha256'), 'hex')
from (
  select distinct destination_hs_code
  from public.export_destination_tariff_rates
  where country_code = 'CAN'
    and source_version = 'customs-country-tariff-20251231:CAN'
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
