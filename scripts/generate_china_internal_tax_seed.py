#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import re
from pathlib import Path
from xml.etree import ElementTree as ET
from zipfile import ZipFile


ROOT = Path(__file__).resolve().parents[1]
INPUT = ROOT / "data/external/china/china-2026-import-vat-consumption-tax-partial-goods.xlsx"
OUTPUT = ROOT / "supabase/seed/generated/china_2026_import_internal_tax_seed.sql"

NS = {"a": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}

SOURCE_VERSION = "china-import-internal-tax-2026"
VAT_LAW_SOURCE_URL = "https://www.chinatax.gov.cn/eng/c101269/c5246628/content.html"
VAT_SCOPE_SOURCE_URL = "https://www.mof.gov.cn/jrttts/202602/t20260203_3983174.htm"
GACC_260_SOURCE_URL = "http://www.customs.gov.cn/customs/2025-12/31/article_2025123118010783852.html"
GACC_VAT9_SOURCE_URL = "http://www.customs.gov.cn/customs/2026-02/03/article_2026020318010783852.html"

# GACC Announcement 2026 No. 15, appendix:
# "适用9%进口环节增值税税率非全税目商品对应海关商品编号表".
# The official page may block direct automated download; the same appendix is
# mirrored by Hong Kong TID in data/external/china for audit.
VAT_9_CODES = [
    ("0410909020", "食用濒危河鳖或海龟的蛋"),
    ("0410909030", "食用河鳖或海龟的蛋"),
    ("0511999030", "其他编号未列名濒危野生动物产品（动物排泄物除外）"),
    ("0511999090", "其他编号未列名的动物产品（动物排泄物除外）"),
    ("0910991010", "未磨的花椒、竹叶花椒和青花椒"),
    ("1512110010", "初榨的葵花油"),
    ("1512190010", "精制的葵花油及其分离品"),
    ("1514990010", "精制非低芥子酸菜籽油"),
    ("1515909020", "米糠油、茴油、核桃油、花椒油、杏仁油、葡萄籽油、牡丹籽油"),
    ("1517901002", "植物油脂制造的起酥油"),
    ("1517901090", "微生物油脂制造的起酥油"),
    ("1517909002", "其他混合制成的植物质食用油脂或制品"),
    ("1517909003", "其他混合制成的微生物质食用油脂或制品"),
    ("1801000010", "生的整颗或破碎的可可豆"),
    ("1902110010", "未包馅或未制作的含蛋生面食，非速冻的"),
    ("1902190010", "其他未包馅或未制作的生面食，非速冻的"),
    ("3105100090", "制成片状及类似形状或零售包装的第31章其他货品"),
    ("3808921090", "零售包装的其他杀菌剂成药"),
    ("3808929021", "经农药杀菌剂浸渍的纸质水果套袋"),
    ("3808929029", "非零售包装的其他农用杀菌剂成药"),
    ("3808940030", "含汞消毒剂"),
    ("3808940040", "兽用已配剂量消毒剂"),
    ("3808940090", "其他非医用消毒剂"),
    ("3920109010", "农用非泡沫聚乙烯薄膜"),
    ("3920209010", "农用非泡沫聚丙烯薄膜"),
    ("3920430010", "农用软质聚氯乙烯薄膜"),
    ("3920490010", "其他农用软质聚氯乙烯薄膜"),
    ("4501100010", "未加工的栓皮槠树树皮"),
    ("5305002010", "生的蕉麻"),
    ("5305009110", "生的西沙尔麻及纺织用龙舌兰纤维"),
    ("5305009210", "生的椰壳纤维"),
    ("5305009910", "生的未列名纺织用植物纤维"),
    ("8408201010", "功率≥132.39kw农用拖拉机用柴油机"),
    ("8408209010", "功率＜132.39kw农用拖拉机用柴油机"),
    ("8408909110", "功率≤14kw农业用柴油发动机"),
    ("8408909220", "14kw<功率<132.39kw的农业用柴油机"),
    ("8408909310", "功率≥132.39kw的农业用柴油机"),
    ("8413501010", "农业用气动往复式排液泵"),
    ("8413502010", "农业用电动往复式排液泵"),
    ("8413503101", "农业用柱塞泵"),
    ("8413503901", "其他农业用液压往复式排液泵"),
    ("8413509010", "其他农用往复式排液泵"),
    ("8413602101", "农业用电动齿轮泵"),
    ("8413602201", "农业用回转式液压油泵"),
    ("8413602210", "其他农业用液压齿轮泵"),
    ("8413602901", "其他农业用齿轮泵"),
    ("8413603101", "农业用电动叶片泵"),
    ("8413603201", "农业用液压叶片泵"),
    ("8413603901", "其他农业用叶片泵"),
    ("8413604001", "农业用螺杆泵"),
    ("8413605001", "农业用径向柱塞泵"),
    ("8413606001", "农业用轴向柱塞泵"),
    ("8413609010", "农业用其他回转式排液泵"),
    ("8413701010", "农业用其他离心泵"),
    ("8413709110", "农业用电动潜油泵及潜水电泵"),
    ("8413709910", "其他农业用离心泵"),
    ("8413810010", "农业用其他液体泵"),
    ("8429521110", "农用轮胎式挖掘机"),
    ("8429521210", "农用履带式挖掘机"),
    ("8429521910", "其他农用挖掘机"),
    ("8523299010", "其他含人类遗传资源信息资料的磁性媒体"),
    ("8523299020", "其他录有广播电影电视节目的磁性媒体"),
    ("8523299030", "其他已录制磁性媒体"),
    ("8701300010", "履带式拖拉机"),
    ("8701911010", "其他发动机功率不超过18千瓦的农业用拖拉机"),
    ("8701921010", "其他发动机功率超过18千瓦但不超过37千瓦的农业用拖拉机"),
    ("8701931010", "其他发动机功率超过37千瓦但不超过75千瓦的农业用拖拉机"),
    ("8701941010", "发动机功率超过75千瓦但不超过130千瓦的农业用拖拉机"),
    ("8701951011", "其他发动机功率超过190千瓦的农业用轮式拖拉机"),
    ("8701951091", "其他发动机功率超过130千瓦的农业用拖拉机"),
]


def sql(value: str | None) -> str:
    if value is None:
        return "null"
    return "'" + value.replace("'", "''") + "'"


def checksum(*parts: str | None) -> str:
    return hashlib.sha256("|".join(part or "" for part in parts).encode("utf-8")).hexdigest()


def load_shared_strings(zf: ZipFile) -> list[str]:
    root = ET.fromstring(zf.read("xl/sharedStrings.xml"))
    strings: list[str] = []
    for item in root.findall("a:si", NS):
        strings.append("".join(text.text or "" for text in item.iter("{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t")))
    return strings


def cell_value(cell: ET.Element, shared_strings: list[str]) -> str:
    node = cell.find("a:v", NS)
    if node is None or node.text is None:
        return ""
    value = node.text
    if cell.attrib.get("t") == "s":
        return shared_strings[int(value)]
    return value


def parse_partial_policy_workbook() -> tuple[list[tuple[str, str, str]], list[tuple[str, str, str]], list[tuple[str, str]]]:
    vat_3_rows: list[tuple[str, str, str]] = []
    vat_policy_rows: list[tuple[str, str, str]] = []
    consumption_rows: list[tuple[str, str]] = []

    with ZipFile(INPUT) as zf:
        shared_strings = load_shared_strings(zf)
        sheet = ET.fromstring(zf.read("xl/worksheets/sheet1.xml"))
        section = ""

        for row in sheet.findall(".//a:row", NS):
            cells = [cell_value(cell, shared_strings).strip() for cell in row.findall("a:c", NS)]
            cells += [""] * (5 - len(cells))
            first, _, _, name, code = cells[:5]
            if re.match(r"^[一二三四五六七八九十]+、", first):
                section = first
                continue
            if not re.fullmatch(r"\d{10}", code):
                continue

            if "抗癌药品" in section or "罕见病药品" in section:
                vat_3_rows.append((code, name, section))
            elif "消费税" in section:
                consumption_rows.append((code, name))
            elif "增值税政策" in section and "政策已到期" not in section:
                vat_policy_rows.append((code, name, section))

    return vat_3_rows, vat_policy_rows, consumption_rows


def values_rows(rows: list[tuple[str, ...]]) -> str:
    return ",\n".join("    (" + ", ".join(sql(value) for value in row) + ")" for row in rows)


def dedupe_rows(rows: list[tuple[str, str, str]]) -> list[tuple[str, str, str]]:
    grouped: dict[str, tuple[list[str], list[str]]] = {}
    for code, name, policy_group in rows:
        names, policies = grouped.setdefault(code, ([], []))
        if name and name not in names:
            names.append(name)
        if policy_group and policy_group not in policies:
            policies.append(policy_group)

    return [
        (code, "、".join(names), " / ".join(policies))
        for code, (names, policies) in sorted(grouped.items())
    ]


def dedupe_pair_rows(rows: list[tuple[str, str]]) -> list[tuple[str, str]]:
    grouped: dict[str, list[str]] = {}
    for code, name in rows:
        names = grouped.setdefault(code, [])
        if name and name not in names:
            names.append(name)
    return [(code, "、".join(names)) for code, names in sorted(grouped.items())]


def upsert_select(select_sql: str) -> str:
    return f"""
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
{select_sql}
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
"""


def main() -> None:
    if not INPUT.exists():
        raise SystemExit(f"Missing input file: {INPUT}")

    vat_3_rows, vat_policy_rows, consumption_rows = parse_partial_policy_workbook()
    vat_3_rows = dedupe_rows(vat_3_rows)
    vat_policy_rows = dedupe_rows(vat_policy_rows)
    consumption_rows = dedupe_pair_rows(consumption_rows)
    exact_vat_overrides = sorted({code for code, _ in VAT_9_CODES} | {code for code, _, _ in vat_3_rows})

    output = f"""-- Generated by scripts/generate_china_internal_tax_seed.py
-- Source workbook: data/external/china/china-2026-import-vat-consumption-tax-partial-goods.xlsx

begin;

delete from public.export_destination_internal_taxes
where country_code = 'CHN'
  and source_version like '{SOURCE_VERSION}%';

with exact_vat_overrides(destination_hs_code) as (
  values
{values_rows([(code,) for code in exact_vat_overrides])}
)
{upsert_select(f'''select
  'CHN',
  tariff.destination_hs_code,
  'vat',
  '수입 부가가치세',
  '13%',
  '중국 수입화물 기본 부가가치세율',
  '9%, 3% 등 명시 특례 코드가 별도로 적재된 경우 해당 특례 행을 우선 표시한다.',
  '中华人民共和国增值税法 / 中华人民共和国增值税法实施条例',
  {sql(VAT_LAW_SOURCE_URL)},
  '{SOURCE_VERSION}:vat-general-13',
  date '2026-01-01',
  null::date,
  now(),
  now(),
  'published'::public.legal_record_status,
  encode(digest('CHN|vat|13|' || tariff.destination_hs_code || '|{SOURCE_VERSION}:vat-general-13', 'sha256'), 'hex')
from (
  select distinct destination_hs_code
  from public.export_destination_tariff_rates
  where country_code = 'CHN'
    and source_version = 'china-import-export-tariff-2026'
    and status = 'published'::public.legal_record_status
    and effective_from <= date '2026-01-01'
    and (effective_to is null or effective_to >= date '2026-01-01')
    and destination_hs_code ~ '^[0-9]{{8,10}}$'
) tariff
where not exists (
  select 1
  from exact_vat_overrides override
  where override.destination_hs_code = tariff.destination_hs_code
)''')}

with vat_9(destination_hs_code, product_name) as (
  values
{values_rows(VAT_9_CODES)}
)
{upsert_select(f'''select
  'CHN',
  destination_hs_code,
  'vat',
  '수입 부가가치세',
  '9%',
  '적용 9% 수입단계 부가가치세율 비전세목 상품번호표',
  product_name,
  '海关总署公告2026年第15号',
  {sql(GACC_VAT9_SOURCE_URL)},
  '{SOURCE_VERSION}:vat-9-non-full-items',
  date '2026-01-01',
  null::date,
  now(),
  now(),
  'published'::public.legal_record_status,
  encode(digest('CHN|vat|9|' || destination_hs_code || '|{SOURCE_VERSION}:vat-9-non-full-items', 'sha256'), 'hex')
from vat_9''')}

with vat_3(destination_hs_code, product_name, policy_group) as (
  values
{values_rows(vat_3_rows)}
)
{upsert_select(f'''select
  'CHN',
  destination_hs_code,
  'vat',
  '수입 부가가치세',
  '3%',
  '항암/희귀병 의약품 수입단계 부가가치세 감면 정책',
  policy_group || ' / ' || product_name,
  '海关总署公告2025年第260号 附件2',
  {sql(GACC_260_SOURCE_URL)},
  '{SOURCE_VERSION}:vat-3-medicines',
  date '2026-01-01',
  null::date,
  now(),
  now(),
  'published'::public.legal_record_status,
  encode(digest('CHN|vat|3|' || destination_hs_code || '|{SOURCE_VERSION}:vat-3-medicines', 'sha256'), 'hex')
from vat_3''')}

with vat_policy(destination_hs_code, product_name, policy_group) as (
  values
{values_rows(vat_policy_rows)}
)
{upsert_select(f'''select
  'CHN',
  destination_hs_code,
  'vat_policy',
  '수입 부가가치세 특례 대상',
  null::text,
  '비전세목 수입단계 부가가치세 정책 대상',
  policy_group || ' / ' || product_name,
  '海关总署公告2025年第260号 附件2',
  {sql(GACC_260_SOURCE_URL)},
  '{SOURCE_VERSION}:vat-policy-partial-items',
  date '2026-01-01',
  null::date,
  now(),
  now(),
  'published'::public.legal_record_status,
  encode(digest('CHN|vat_policy|' || destination_hs_code || '|{SOURCE_VERSION}:vat-policy-partial-items', 'sha256'), 'hex')
from vat_policy''')}

with consumption_policy(destination_hs_code, product_name) as (
  values
{values_rows(consumption_rows)}
)
{upsert_select(f'''select
  'CHN',
  destination_hs_code,
  'consumption_tax_policy',
  '수입 소비세 대상',
  null::text,
  '비전세목 수입단계 소비세 정책 대상',
  product_name,
  '海关总署公告2025年第260号 附件2',
  {sql(GACC_260_SOURCE_URL)},
  '{SOURCE_VERSION}:consumption-tax-policy-partial-items',
  date '2026-01-01',
  null::date,
  now(),
  now(),
  'published'::public.legal_record_status,
  encode(digest('CHN|consumption_tax_policy|' || destination_hs_code || '|{SOURCE_VERSION}:consumption-tax-policy-partial-items', 'sha256'), 'hex')
from consumption_policy''')}

commit;
"""

    OUTPUT.write_text(output, encoding="utf-8")
    print(f"wrote {OUTPUT.relative_to(ROOT)}")
    print(f"vat_9={len(VAT_9_CODES)} vat_3={len(vat_3_rows)} vat_policy={len(vat_policy_rows)} consumption_policy={len(consumption_rows)}")


if __name__ == "__main__":
    main()
