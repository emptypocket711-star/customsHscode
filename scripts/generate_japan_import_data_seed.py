#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "supabase/seed/generated/japan_import_data_seed.sql"

SOURCE_VERSION = "japan-import-data-20260401"
CUSTOMS_IMPORT_SOURCE_URL = "https://www.customs.go.jp/english/summary/import.htm"
CUSTOMS_TAX_SOURCE_URL = "https://www.customs.go.jp/english/c-answer_e/imtsukan/1111_e.htm"
MHLW_FOOD_SOURCE_URL = "https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/kenkou_iryou/shokuhin/yunyu_kanshi/kanshi/index_00004.html"
MAFF_PLANT_SOURCE_URL = "https://www.maff.go.jp/pps/j/introduction/english.html"
METI_PSE_SOURCE_URL = "https://www.meti.go.jp/policy/consumer/seian/denan/file/06_guide/denan_guide_ver40_en.pdf"
METI_PRODUCT_SAFETY_SOURCE_URL = "https://www.meti.go.jp/policy/consumer/seian/shouan/act.html"

FOOD_HS4_CONDITIONS = """
    destination_hs_code like '02%'
    or destination_hs_code like '03%'
    or destination_hs_code like '04%'
    or destination_hs_code like '07%'
    or destination_hs_code like '08%'
    or destination_hs_code like '09%'
    or destination_hs_code like '10%'
    or destination_hs_code like '11%'
    or destination_hs_code like '12%'
    or destination_hs_code like '15%'
    or destination_hs_code like '16%'
    or destination_hs_code like '17%'
    or destination_hs_code like '18%'
    or destination_hs_code like '19%'
    or destination_hs_code like '20%'
    or destination_hs_code like '21%'
    or destination_hs_code like '2201%'
    or destination_hs_code like '2202%'
"""

PLANT_HS4_CONDITIONS = """
    destination_hs_code like '06%'
    or destination_hs_code like '07%'
    or destination_hs_code like '08%'
    or destination_hs_code like '09%'
    or destination_hs_code like '10%'
    or destination_hs_code like '11%'
    or destination_hs_code like '12%'
    or destination_hs_code like '13%'
    or destination_hs_code like '14%'
    or destination_hs_code like '44%'
"""

ANIMAL_HS4_CONDITIONS = """
    destination_hs_code like '01%'
    or destination_hs_code like '02%'
    or destination_hs_code like '03%'
    or destination_hs_code like '04%'
    or destination_hs_code like '05%'
    or destination_hs_code like '16%'
"""

PSE_HS4_CONDITIONS = """
    destination_hs_code like '8415%'
    or destination_hs_code like '8418%'
    or destination_hs_code like '8421%'
    or destination_hs_code like '8450%'
    or destination_hs_code like '8504%'
    or destination_hs_code like '8508%'
    or destination_hs_code like '8516%'
    or destination_hs_code like '8517%'
    or destination_hs_code like '8528%'
    or destination_hs_code like '8536%'
    or destination_hs_code like '8544%'
    or destination_hs_code like '9405%'
"""

PHARMA_MEDICAL_HS4_CONDITIONS = """
    destination_hs_code like '30%'
    or destination_hs_code like '9018%'
    or destination_hs_code like '9019%'
    or destination_hs_code like '9020%'
    or destination_hs_code like '9021%'
    or destination_hs_code like '9022%'
"""

CHEMICAL_HS4_CONDITIONS = """
    destination_hs_code like '28%'
    or destination_hs_code like '29%'
    or destination_hs_code like '38%'
"""


def sql_literal(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def requirement_insert(
    *,
    condition_sql: str,
    requirement_type: str,
    requirement_name: str,
    agency: str,
    legal_basis: str,
    procedure_summary: str,
    required_documents: list[str],
    notes: str,
    source_name: str,
    source_url: str,
) -> str:
    documents = ", ".join(sql_literal(document) for document in required_documents)
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
  'JPN',
  heading.destination_hs_code,
  {sql_literal(requirement_type)},
  {sql_literal(requirement_name)},
  {sql_literal(agency)},
  {sql_literal(legal_basis)},
  {sql_literal(procedure_summary)},
  jsonb_build_array({documents}),
  {sql_literal(notes)},
  {sql_literal(source_name)},
  {sql_literal(source_url)},
  {sql_literal(SOURCE_VERSION + ':import-requirements')},
  date '2026-04-01',
  null::date,
  null::timestamptz,
  now(),
  'staged'::public.legal_record_status,
  encode(digest('JPN|' || heading.destination_hs_code || '|' || {sql_literal(requirement_type)} || '|' || {sql_literal(requirement_name)} || '|' || {sql_literal(SOURCE_VERSION)}, 'sha256'), 'hex')
from (
  select distinct left(destination_hs_code, 4) as destination_hs_code
  from public.export_destination_tariff_rates
  where country_code = 'JPN'
    and source_version = 'japan-customs-tariff-20260401'
    and ({condition_sql})
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
    output = f"""-- Generated by scripts/generate_japan_import_data_seed.py

begin;

delete from public.export_destination_internal_taxes
where country_code = 'JPN'
  and source_version like '{SOURCE_VERSION}%';

delete from public.export_destination_import_requirements
where country_code = 'JPN'
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
  'JPN',
  tariff.destination_hs_code,
  'consumption_tax',
  '수입 소비세',
  case when {FOOD_HS4_CONDITIONS} then '8%' else '10%' end,
  case when {FOOD_HS4_CONDITIONS}
    then '일본 수입 소비세 경감세율 후보'
    else '일본 수입 소비세 표준세율'
  end,
  case when {FOOD_HS4_CONDITIONS}
    then '음식료품 후보에는 8% 경감세율을 우선 표시한다. 주류, 외식, 품목별 예외는 세번·용도·상품 상태 확인이 필요하다.'
    else '일본 세관 안내 기준 소비세 표준세율이다. 개별소비세, 주세, 담배세 등은 별도 품목세 자료 확인 후 추가한다.'
  end,
  'Japan Customs consumption tax guidance',
  {sql_literal(CUSTOMS_TAX_SOURCE_URL)},
  {sql_literal(SOURCE_VERSION + ':consumption-tax')},
  date '2026-04-01',
  null::date,
  null::timestamptz,
  now(),
  'staged'::public.legal_record_status,
  encode(digest('JPN|consumption_tax|' || tariff.destination_hs_code || '|' || {sql_literal(SOURCE_VERSION)}, 'sha256'), 'hex')
from public.export_destination_tariff_rates tariff
where tariff.country_code = 'JPN'
  and tariff.source_version = 'japan-customs-tariff-20260401'
group by tariff.destination_hs_code
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

{requirement_insert(
  condition_sql=FOOD_HS4_CONDITIONS,
  requirement_type="food_sanitation",
  requirement_name="일본 식품위생법 수입신고",
  agency="Ministry of Health, Labour and Welfare / Quarantine Station",
  legal_basis="Food Sanitation Act",
  procedure_summary="판매 또는 영업용 식품, 식품첨가물, 기구, 용기포장, 영유아용 장난감은 식품위생법상 수입신고와 검역소 심사·검사 대상 가능성이 있습니다.",
  required_documents=["식품 등 수입신고", "송장", "성분/제조공정 자료", "위생증명 또는 시험성적서(해당 시)"],
  notes="HS만으로 대상 여부가 확정되지 않으므로 용도, 원재료, 식품접촉 여부, 판매 목적을 확인합니다.",
  source_name="MHLW import procedure under Food Sanitation Act",
  source_url=MHLW_FOOD_SOURCE_URL,
)}

{requirement_insert(
  condition_sql=PLANT_HS4_CONDITIONS,
  requirement_type="plant_quarantine",
  requirement_name="일본 식물검역 검사",
  agency="MAFF Plant Protection Station",
  legal_basis="Plant Protection Act",
  procedure_summary="식물, 식물성 산물, 목재·종자·과실 등은 수출국 식물검역증명서와 일본 식물방역소 수입검사 대상 가능성이 있습니다.",
  required_documents=["식물검역증명서", "송장", "포장명세서", "품목·학명·가공상태 자료"],
  notes="가공 정도, 건조·분쇄·열처리 여부, 포장 상태에 따라 검역 대상 여부가 달라질 수 있습니다.",
  source_name="MAFF Plant Protection Station import regulations",
  source_url=MAFF_PLANT_SOURCE_URL,
)}

{requirement_insert(
  condition_sql=ANIMAL_HS4_CONDITIONS,
  requirement_type="animal_quarantine",
  requirement_name="일본 동물검역 검사",
  agency="MAFF Animal Quarantine Service",
  legal_basis="Act on Domestic Animal Infectious Diseases Control",
  procedure_summary="동물, 축산물, 수산·동물성 원료 제품은 동물검역 또는 위생증명 확인 대상 가능성이 있습니다.",
  required_documents=["검역증명서", "송장", "포장명세서", "원산지/가공상태 자료"],
  notes="가공식품, 열처리품, 원료성 제품은 품목 상태와 수입 목적에 따라 별도 확인이 필요합니다.",
  source_name="Japan Customs import procedures - quarantine related laws",
  source_url=CUSTOMS_IMPORT_SOURCE_URL,
)}

{requirement_insert(
  condition_sql=PSE_HS4_CONDITIONS,
  requirement_type="electrical_safety",
  requirement_name="일본 전기용품안전법 PSE 확인",
  agency="Ministry of Economy, Trade and Industry",
  legal_basis="Electrical Appliances and Materials Safety Act",
  procedure_summary="전기용품안전법 대상 전기제품은 수입사업 신고, 적합성 확인, PSE 표시 대상 가능성이 있습니다.",
  required_documents=["제품 사양서", "정격/전원 자료", "적합성 검사 또는 기술기준 적합 자료", "표시 자료"],
  notes="HS만으로 PSE 대상 여부가 확정되지 않으므로 정격, 구조, 용도, 별표 대상 품목 해당 여부를 확인합니다.",
  source_name="METI Electrical Appliances and Materials Safety Act guide",
  source_url=METI_PSE_SOURCE_URL,
)}

{requirement_insert(
  condition_sql=PHARMA_MEDICAL_HS4_CONDITIONS,
  requirement_type="pharma_medical",
  requirement_name="일본 의약품·의료기기 규제 확인",
  agency="MHLW / PMDA",
  legal_basis="Act on Securing Quality, Efficacy and Safety of Products Including Pharmaceuticals and Medical Devices",
  procedure_summary="의약품, 의약외품, 화장품, 의료기기 또는 관련 부품은 일본 약기법상 승인·인증·신고·수입자 요건 확인 대상 가능성이 있습니다.",
  required_documents=["제품 사양서", "성분표", "용도 설명", "승인/인증/신고 자료(해당 시)", "표시 자료"],
  notes="일반 제품과 의료·의약 목적 제품의 경계가 중요하므로 효능 표방, 사용 목적, 성분을 확인합니다.",
  source_name="Japan Customs import procedures - Pharmaceutical Affairs Law",
  source_url=CUSTOMS_IMPORT_SOURCE_URL,
)}

{requirement_insert(
  condition_sql="destination_hs_code like '3304%'",
  requirement_type="cosmetics",
  requirement_name="일본 화장품·의약외품 규제 확인",
  agency="MHLW / PMDA",
  legal_basis="Pharmaceutical and Medical Device Act",
  procedure_summary="화장품 또는 의약외품으로 판매되는 제품은 수입판매업 허가, 제조판매 승인·신고, 성분·표시 확인 대상 가능성이 있습니다.",
  required_documents=["전성분표", "제품 라벨", "용도/효능 표현 자료", "제조판매업 관련 자료(해당 시)"],
  notes="효능 표방, 성분, 사용 부위, 의약외품 해당 여부에 따라 절차가 달라질 수 있습니다.",
  source_name="Japan Customs import procedures - Pharmaceutical Affairs Law",
  source_url=CUSTOMS_IMPORT_SOURCE_URL,
)}

{requirement_insert(
  condition_sql=CHEMICAL_HS4_CONDITIONS,
  requirement_type="chemical_control",
  requirement_name="일본 화학물질 규제 확인",
  agency="METI / MHLW / MOE",
  legal_basis="Chemical Substances Control Law and related controls",
  procedure_summary="화학물질, 혼합물, 농약·살생물·유해물질성 제품은 화심법, 독극물, 위험물, 수입승인 등 별도 규제 확인 대상 가능성이 있습니다.",
  required_documents=["CAS 번호", "SDS", "성분비", "용도 설명", "규제대상 물질 비해당 확인자료(해당 시)"],
  notes="HS만으로 물질 규제가 확정되지 않으므로 CAS, 농도, 용도, 신규화학물질 여부를 확인합니다.",
  source_name="Japan Customs import procedures - other laws and regulations",
  source_url=CUSTOMS_IMPORT_SOURCE_URL,
)}

{requirement_insert(
  condition_sql="destination_hs_code like '9503%' or destination_hs_code like '9504%' or destination_hs_code like '9505%' or destination_hs_code like '9506%'",
  requirement_type="consumer_product_safety",
  requirement_name="일본 소비생활용제품 안전규제 확인",
  agency="Ministry of Economy, Trade and Industry",
  legal_basis="Consumer Product Safety Act and related product safety laws",
  procedure_summary="완구, 생활용품, 스포츠·레저 제품 등은 제품 안전, 표시, 특정 제품 인증 대상 가능성이 있습니다.",
  required_documents=["제품 사양서", "사용연령/용도 자료", "안전시험 자료(해당 시)", "표시 자료"],
  notes="제품 구조, 사용자 연령, 전기·기계적 위험, 식품접촉 여부에 따라 적용 법령이 달라질 수 있습니다.",
  source_name="METI consumer product safety laws",
  source_url=METI_PRODUCT_SAFETY_SOURCE_URL,
)}

commit;
"""

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(output, encoding="utf-8")
    print(f"wrote {OUTPUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
