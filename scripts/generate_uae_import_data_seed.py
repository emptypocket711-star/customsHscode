#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "supabase/seed/generated/uae_import_data_seed.sql"

SOURCE_VERSION = "uae-import-data-20260524"
UAE_VAT_SOURCE_URL = "https://tax.gov.ae/en/taxes/vat.aspx"
UAE_TAXABLE_SUPPLY_URL = "https://tax.gov.ae/en/content/what.is.a.taxable.supply.aspx"
DUBAI_CUSTOMS_RESTRICTED_URL = "https://www.dubaicustoms.gov.ae/en/mobile/Pages/ProhibitedandRestrictedGoods.aspx"
TDRA_TYPE_APPROVAL_URL = "https://tdra.gov.ae/en/about/tdra-sectors/telecommunication/the-technology-development-affairs/type-approval"
TDRA_EQUIPMENT_REGISTRATION_URL = "https://tdra.gov.ae/en/Services/equipment-registration"
MOCCAE_URL = "https://moccae.gov.ae/"
MOHAP_URL = "https://mohap.gov.ae/"
MOIAT_URL = "https://moiat.gov.ae/"

REQUIREMENTS = [
    {
        "condition": "destination_hs_code like '01%' or destination_hs_code like '02%' or destination_hs_code like '03%' or destination_hs_code like '04%' or destination_hs_code like '05%' or destination_hs_code like '41%' or destination_hs_code like '42%' or destination_hs_code like '43%' or destination_hs_code like '51%'",
        "type": "animal_agriculture_veterinary_control",
        "name": "UAE 동물·동물성 제품·농축수산물 검역 확인",
        "agency": "Ministry of Climate Change & Environment / local customs authority",
        "basis": "UAE restricted goods controls for live animals, plants, fertilizers and insecticides",
        "summary": "동물, 축산물, 수산물, 동물성 원료, 가죽·모피·양모 등은 UAE 관할기관 승인, 검역, 위생증명서, 원산국 질병상황 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "B/L 또는 AWB", "포장명세서", "동물종/원재료 정보", "위생증명서(해당 시)", "수입허가 또는 검역승인 자료(해당 시)"],
        "notes": "식용/비식용, 동물종, 가공상태, 원산국 질병상황, 에미리트별 통관 관할에 따라 요구사항이 달라질 수 있습니다.",
        "source_name": "Dubai Customs prohibited and restricted goods",
        "source_url": DUBAI_CUSTOMS_RESTRICTED_URL,
    },
    {
        "condition": "destination_hs_code like '06%' or destination_hs_code like '07%' or destination_hs_code like '08%' or destination_hs_code like '09%' or destination_hs_code like '10%' or destination_hs_code like '11%' or destination_hs_code like '12%' or destination_hs_code like '14%' or destination_hs_code like '15%' or destination_hs_code like '16%' or destination_hs_code like '17%' or destination_hs_code like '18%' or destination_hs_code like '19%' or destination_hs_code like '20%' or destination_hs_code like '21%' or destination_hs_code like '22%' or destination_hs_code like '23%'",
        "type": "food_plant_agriculture_control",
        "name": "UAE 식품·농산물·식물검역 확인",
        "agency": "Ministry of Climate Change & Environment / Dubai Municipality / local customs authority",
        "basis": "UAE restricted goods controls for plants, foodstuffs and agriculture-related products",
        "summary": "식품, 농산물, 식물, 곡물, 종자, 음료, 사료류는 식품안전, 식물검역, 라벨, 수입허가 또는 관할기관 승인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "성분표", "제품 라벨", "식물검역증명서(해당 시)", "식품 또는 농산물 수입허가 자료(해당 시)"],
        "notes": "재식용 여부, 식용 여부, 가공상태, 할랄·라벨 기준, 에미리트별 식품 통제기관에 따라 추가자료가 필요할 수 있습니다.",
        "source_name": "Dubai Customs prohibited and restricted goods",
        "source_url": DUBAI_CUSTOMS_RESTRICTED_URL,
    },
    {
        "condition": "destination_hs_code like '30%' or destination_hs_code like '9018%' or destination_hs_code like '9021%' or destination_hs_code like '9022%'",
        "type": "health_product_import_control",
        "name": "UAE 의약품·의료기기 수입승인 확인",
        "agency": "Ministry of Health & Prevention / local customs authority",
        "basis": "UAE restricted goods controls for pharmaceutical products and medical or surgical instruments",
        "summary": "의약품, 의료기기, 진단기기, 의료·수술용 기기는 MOHAP 등록·허가, 수입자 자격, 통관승인 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "제품 사양서", "용도 설명", "등록 또는 수입승인 자료(해당 시)", "라벨/사용설명서"],
        "notes": "의약품·의료기기 등급, 인체/동물용, 등록제품 여부, 수입자 자격에 따라 요구사항이 달라질 수 있습니다.",
        "source_name": "Dubai Customs prohibited and restricted goods",
        "source_url": DUBAI_CUSTOMS_RESTRICTED_URL,
    },
    {
        "condition": "destination_hs_code like '3303%' or destination_hs_code like '3304%' or destination_hs_code like '3305%' or destination_hs_code like '3306%' or destination_hs_code like '3307%'",
        "type": "cosmetics_personal_care_control",
        "name": "UAE 화장품·퍼스널케어 등록·표시 확인",
        "agency": "Dubai Municipality / Ministry of Health & Prevention / local customs authority",
        "basis": "UAE restricted goods controls for personal care and cosmetic products",
        "summary": "화장품, 향수, 헤어·구강·면도·탈취 제품은 성분, 라벨, 제품등록, 관할기관 승인 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "전성분표", "제품 라벨", "제품 사양서", "제품등록 또는 승인자료(해당 시)"],
        "notes": "의약품성 효능, 제한성분, 아랍어 라벨, 할랄·안전성 표시, 에미리트별 등록제도에 따라 추가 확인이 필요할 수 있습니다.",
        "source_name": "Dubai Customs prohibited and restricted goods",
        "source_url": DUBAI_CUSTOMS_RESTRICTED_URL,
    },
    {
        "condition": "destination_hs_code like '25%' or destination_hs_code like '27%' or destination_hs_code like '28%' or destination_hs_code like '29%' or destination_hs_code like '32%' or destination_hs_code like '33%' or destination_hs_code like '34%' or destination_hs_code like '35%' or destination_hs_code like '36%' or destination_hs_code like '38%' or destination_hs_code like '39%' or destination_hs_code like '40%'",
        "type": "chemical_hazardous_restricted_control",
        "name": "UAE 화학물질·위험물·제한물품 확인",
        "agency": "local customs authority / Ministry of Climate Change & Environment / competent authority",
        "basis": "UAE prohibited and restricted goods controls",
        "summary": "화학물질, 위험물, 비료, 살충제, 폭발성·인화성 물품, 일부 고무·플라스틱 제품은 관할기관 승인, MSDS, 위험물 분류 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "MSDS", "성분표", "위험물 분류자료", "수입승인 또는 관할기관 허가자료(해당 시)"],
        "notes": "화학물질 성분, 농도, UN 번호, 포장, 최종용도, 보관·운송 조건에 따라 승인기관과 요구자료가 달라질 수 있습니다.",
        "source_name": "Dubai Customs prohibited and restricted goods",
        "source_url": DUBAI_CUSTOMS_RESTRICTED_URL,
    },
    {
        "condition": "destination_hs_code like '40%' or destination_hs_code like '84%' or destination_hs_code like '85%' or destination_hs_code like '87%' or destination_hs_code like '90%' or destination_hs_code like '94%' or destination_hs_code like '95%'",
        "type": "conformity_standard_control",
        "name": "UAE 제품적합성·표준 확인",
        "agency": "Ministry of Industry and Advanced Technology / local customs authority",
        "basis": "UAE restricted goods and regulated product conformity controls",
        "summary": "전기전자, 기계, 타이어, 차량·부품, 소비재, 완구 등은 UAE 적합성, 표준, 인증, 라벨 또는 통관승인 확인 대상 가능성이 있습니다.",
        "documents": ["제품 사양서", "모델명/규격", "시험성적서", "적합성 인증서(해당 시)", "라벨/마킹 자료", "통관승인 자료(해당 시)"],
        "notes": "강제규격 대상 여부는 HS뿐 아니라 모델, 전기정격, 무선기능, 안전기준, 판매용/개인용 여부에 따라 달라질 수 있습니다.",
        "source_name": "Dubai Customs prohibited and restricted goods",
        "source_url": DUBAI_CUSTOMS_RESTRICTED_URL,
    },
    {
        "condition": "destination_hs_code like '8517%' or destination_hs_code like '8525%' or destination_hs_code like '8526%' or destination_hs_code like '8527%' or destination_hs_code like '8528%' or destination_hs_code like '8543%' or destination_hs_code like '9026%' or destination_hs_code like '9030%'",
        "type": "telecom_radio_type_approval",
        "name": "UAE 통신·무선기기 TDRA 형식승인 확인",
        "agency": "Telecommunications and Digital Government Regulatory Authority / local customs authority",
        "basis": "TDRA telecommunications equipment type approval and custom clearance requirements",
        "summary": "통신장비, 무선기기, 송신기, 네트워크 장비, 일부 측정·제어 장비는 TDRA 등록, 형식승인, 통관승인 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "제품 사양서", "무선/통신 기능 설명", "시험성적서", "TDRA 형식승인 또는 통관승인 자료(해당 시)"],
        "notes": "상업용/비상업용, 판매용/전시용, 주파수 사용 여부, UAE 기술기준 적합 여부에 따라 절차가 달라질 수 있습니다.",
        "source_name": "TDRA type approval",
        "source_url": TDRA_TYPE_APPROVAL_URL,
    },
    {
        "condition": "destination_hs_code like '4901%' or destination_hs_code like '4902%' or destination_hs_code like '4903%' or destination_hs_code like '4908%' or destination_hs_code like '4909%' or destination_hs_code like '4911%' or destination_hs_code like '71%' or destination_hs_code like '93%' or destination_hs_code like '97%'",
        "type": "restricted_goods_competent_authority_control",
        "name": "UAE 제한·금지물품 관할기관 승인 확인",
        "agency": "local customs authority / competent authority",
        "basis": "UAE prohibited and restricted goods controls",
        "summary": "간행물·미디어, 무기류, 귀금속·다이아몬드, 문화재·예술품 등은 금지·제한물품, 관할기관 승인, 수입자 자격 확인 대상 가능성이 있습니다.",
        "documents": ["상업송장", "포장명세서", "품목 설명", "용도 설명", "관할기관 승인자료(해당 시)", "수입자 자격자료(해당 시)"],
        "notes": "동일 HS라도 내용물, 소재, 용도, 원산지, 수입자 자격에 따라 금지 또는 제한 여부가 달라질 수 있습니다.",
        "source_name": "Dubai Customs prohibited and restricted goods",
        "source_url": DUBAI_CUSTOMS_RESTRICTED_URL,
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
  'ARE',
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
  encode(digest('ARE|' || heading.destination_hs_code || '|' || {sql(requirement["type"])} || '|' || {sql(requirement["name"])} || '|' || {sql(SOURCE_VERSION)}, 'sha256'), 'hex')
from (
  select distinct left(destination_hs_code, 4) as destination_hs_code
  from public.export_destination_tariff_rates
  where country_code = 'ARE'
    and source_version = 'customs-country-tariff-20251231:ARE'
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

    output = f"""-- Generated by scripts/generate_uae_import_data_seed.py

begin;

delete from public.export_destination_internal_taxes
where country_code = 'ARE'
  and source_version like '{SOURCE_VERSION}%';

delete from public.export_destination_import_requirements
where country_code = 'ARE'
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
  'ARE',
  tariff.destination_hs_code,
  'vat',
  '수입 VAT',
  '5%',
  'UAE 수입 VAT 표준세율 후보',
  'UAE Federal Tax Authority 안내 기준 taxable supply는 5% 또는 0% 과세 대상이 될 수 있고, 수입도 국내 공급 시 과세되는 물품이면 VAT 판단에 포함됩니다. 영세율, 면세, 보세·일시수입·품목별 예외는 별도 확인이 필요합니다.',
  'UAE Federal Tax Authority VAT',
  {sql(UAE_VAT_SOURCE_URL)},
  {sql(SOURCE_VERSION + ':vat')},
  date '2026-01-01',
  null::date,
  null::timestamptz,
  now(),
  'staged'::public.legal_record_status,
  encode(digest('ARE|vat|' || tariff.destination_hs_code || '|' || {sql(SOURCE_VERSION)}, 'sha256'), 'hex')
from (
  select distinct destination_hs_code
  from public.export_destination_tariff_rates
  where country_code = 'ARE'
    and source_version = 'customs-country-tariff-20251231:ARE'
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
