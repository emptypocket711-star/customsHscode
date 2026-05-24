#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import sys
from datetime import datetime, timezone
from pathlib import Path
from xml.etree import ElementTree as ET
from zipfile import ZipFile

SCRIPT_DIR = Path(__file__).resolve().parent
ROOT = SCRIPT_DIR.parents[0]
sys.path.insert(0, str(SCRIPT_DIR))

from generate_customs_excel_seed import copy_block  # noqa: E402

INPUT = ROOT / "data/external/china/china-2026-import-vat-consumption-tax-partial-goods.xlsx"
OUTPUT = ROOT / "supabase/seed/generated/china_2026_customs_codes_seed.sql"
SOURCE_VERSION = "china-customs-declaration-codes-2026"
GACC_260_SOURCE_URL = "http://www.customs.gov.cn/customs/2025-12/31/article_2025123118010783852.html"
GACC_VAT9_SOURCE_URL = "http://www.customs.gov.cn/customs/2026-02/03/article_2026020318010783852.html"

NS = {"a": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}

VAT_9_CODES = [
    ("0410909020", "04109090", "食用濒危河鳖或海龟的蛋"),
    ("0410909030", "04109090", "食用河鳖或海龟的蛋"),
    ("0511999030", "05119990", "其他编号未列名濒危野生动物产品（动物排泄物除外）"),
    ("0511999090", "05119990", "其他编号未列名的动物产品（动物排泄物除外）"),
    ("0910991010", "09109910", "未磨的花椒、竹叶花椒和青花椒"),
    ("1512110010", "15121100", "初榨的葵花油"),
    ("1512190010", "15121900", "精制的葵花油及其分离品"),
    ("1514990010", "15149900", "精制非低芥子酸菜籽油"),
    ("1515909020", "15159090", "米糠油、茴油、核桃油、花椒油、杏仁油、葡萄籽油、牡丹籽油"),
    ("1517901002", "15179010", "植物油脂制造的起酥油"),
    ("1517901090", "15179010", "微生物油脂制造的起酥油"),
    ("1517909002", "15179090", "其他混合制成的植物质食用油脂或制品"),
    ("1517909003", "15179090", "其他混合制成的微生物质食用油脂或制品"),
    ("1801000010", "18010000", "生的整颗或破碎的可可豆"),
    ("1902110010", "19021100", "未包馅或未制作的含蛋生面食，非速冻的"),
    ("1902190010", "19021900", "其他未包馅或未制作的生面食，非速冻的"),
    ("3105100090", "31051000", "制成片状及类似形状或零售包装的第31章其他货品"),
    ("3808921090", "38089210", "零售包装的其他杀菌剂成药"),
    ("3808929021", "38089290", "经农药杀菌剂浸渍的纸质水果套袋"),
    ("3808929029", "38089290", "非零售包装的其他农用杀菌剂成药"),
    ("3808940030", "38089400", "含汞消毒剂"),
    ("3808940040", "38089400", "兽用已配剂量消毒剂"),
    ("3808940090", "38089400", "其他非医用消毒剂"),
    ("3920109010", "39201090", "农用非泡沫聚乙烯薄膜"),
    ("3920209010", "39202090", "农用非泡沫聚丙烯薄膜"),
    ("3920430010", "39204300", "农用软质聚氯乙烯薄膜"),
    ("3920490010", "39204900", "其他农用软质聚氯乙烯薄膜"),
    ("4501100010", "45011000", "未加工的栓皮槠树树皮"),
    ("5305002010", "53050020", "生的蕉麻"),
    ("5305009110", "53050091", "生的西沙尔麻及纺织用龙舌兰纤维"),
    ("5305009210", "53050092", "生的椰壳纤维"),
    ("5305009910", "53050099", "生的未列名纺织用植物纤维"),
    ("8408201010", "84082010", "功率≥132.39kw农用拖拉机用柴油机"),
    ("8408209010", "84082090", "功率＜132.39kw农用拖拉机用柴油机"),
    ("8408909110", "84089091", "功率≤14kw农业用柴油发动机"),
    ("8408909220", "84089092", "14kw<功率<132.39kw的农业用柴油机"),
    ("8408909310", "84089093", "功率≥132.39kw的农业用柴油机"),
    ("8413501010", "84135010", "农业用气动往复式排液泵"),
    ("8413502010", "84135020", "农业用电动往复式排液泵"),
    ("8413503101", "84135031", "农业用柱塞泵"),
    ("8413503901", "84135039", "其他农业用液压往复式排液泵"),
    ("8413509010", "84135090", "其他农用往复式排液泵"),
    ("8413602101", "84136021", "农业用电动齿轮泵"),
    ("8413602201", "84136022", "农业用回转式液压油泵"),
    ("8413602210", "84136022", "其他农业用液压齿轮泵"),
    ("8413602901", "84136029", "其他农业用齿轮泵"),
    ("8413603101", "84136031", "农业用电动叶片泵"),
    ("8413603201", "84136032", "农业用液压叶片泵"),
    ("8413603901", "84136039", "其他农业用叶片泵"),
    ("8413604001", "84136040", "农业用螺杆泵"),
    ("8413605001", "84136050", "农业用径向柱塞泵"),
    ("8413606001", "84136060", "农业用轴向柱塞泵"),
    ("8413609010", "84136090", "农业用其他回转式排液泵"),
    ("8413701010", "84137010", "农业用其他离心泵"),
    ("8413709110", "84137091", "农业用电动潜油泵及潜水电泵"),
    ("8413709910", "84137099", "其他农业用离心泵"),
    ("8413810010", "84138100", "农业用其他液体泵"),
    ("8429521110", "84295211", "农用轮胎式挖掘机"),
    ("8429521210", "84295212", "农用履带式挖掘机"),
    ("8429521910", "84295219", "其他农用挖掘机"),
    ("8523299010", "85232990", "其他含人类遗传资源信息资料的磁性媒体"),
    ("8523299020", "85232990", "其他录有广播电影电视节目的磁性媒体"),
    ("8523299030", "85232990", "其他已录制磁性媒体"),
    ("8701300010", "87013000", "履带式拖拉机"),
    ("8701911010", "87019110", "其他发动机功率不超过18千瓦的农业用拖拉机"),
    ("8701921010", "87019210", "其他发动机功率超过18千瓦但不超过37千瓦的农业用拖拉机"),
    ("8701931010", "87019310", "其他发动机功率超过37千瓦但不超过75千瓦的农业用拖拉机"),
    ("8701941010", "87019410", "发动机功率超过75千瓦但不超过130千瓦的农业用拖拉机"),
    ("8701951011", "87019510", "其他发动机功率超过190千瓦的农业用轮式拖拉机"),
    ("8701951091", "87019510", "其他发动机功率超过130千瓦的农业用拖拉机"),
]


def shared_strings(zf: ZipFile) -> list[str]:
    root = ET.fromstring(zf.read("xl/sharedStrings.xml"))
    return ["".join(t.text or "" for t in item.iter("{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t")) for item in root.findall("a:si", NS)]


def cell_value(cell: ET.Element, strings: list[str]) -> str:
    node = cell.find("a:v", NS)
    if node is None or node.text is None:
        return ""
    value = node.text
    return strings[int(value)] if cell.attrib.get("t") == "s" else value


def workbook_rows() -> list[tuple[str, str, str, str]]:
    rows: list[tuple[str, str, str, str]] = []
    with ZipFile(INPUT) as zf:
        strings = shared_strings(zf)
        sheet = ET.fromstring(zf.read("xl/worksheets/sheet1.xml"))
        section = ""
        for row in sheet.findall(".//a:row", NS):
            cells = [cell_value(cell, strings).strip() for cell in row.findall("a:c", NS)]
            cells += [""] * (5 - len(cells))
            first, _, tariff_code, name, customs_code = cells[:5]
            if first and not first[0].isdigit():
                section = first
                continue
            if len(customs_code) == 10 and customs_code.isdigit():
                rows.append((customs_code, "".join(ch for ch in tariff_code if ch.isdigit())[:8], name, section))
    return rows


def checksum(*parts: str) -> str:
    return hashlib.sha256("|".join(parts).encode("utf-8")).hexdigest()


def main() -> None:
    retrieved_at = datetime.now(timezone.utc).isoformat()
    rows: dict[str, list[object]] = {}

    for customs_code, tariff_code, name in VAT_9_CODES:
        rows[customs_code] = [
            "CHN", customs_code, tariff_code, name, None, name, "vat_9_non_full_item",
            "9% 수입단계 부가가치세 비전세목 신고상품번호", "海关总署公告2026年第15号", GACC_VAT9_SOURCE_URL,
            f"{SOURCE_VERSION}:gacc-2026-15", "2026-01-01", None, None, retrieved_at, "staged",
            checksum(customs_code, tariff_code, name, "gacc-2026-15")
        ]

    for customs_code, tariff_code, name, section in workbook_rows():
        role = "consumption_tax_policy_item" if "消费税" in section else "vat_policy_item"
        rows[customs_code] = [
            "CHN", customs_code, tariff_code, name, None, name, role, section,
            "海关总署公告2025年第260号 附件2", GACC_260_SOURCE_URL,
            f"{SOURCE_VERSION}:gacc-2025-260-attachment2", "2026-01-01", None, None, retrieved_at, "staged",
            checksum(customs_code, tariff_code, name, section)
        ]

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT.open("w", encoding="utf-8") as output:
        output.write("-- Generated by scripts/generate_china_2026_customs_codes_seed.py\n")
        output.write("begin;\n")
        output.write(f"delete from public.export_destination_customs_codes where country_code = 'CHN' and source_version like '{SOURCE_VERSION}%';\n")
        output.write("""
insert into public.export_destination_customs_codes (
  country_code,
  customs_code,
  tariff_code,
  original_name,
  english_name,
  korean_name,
  code_role,
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
  country_code,
  destination_hs_code,
  left(destination_hs_code, 8),
  original_name,
  english_name,
  korean_name,
  'declaration_code',
  '관세청 국가별 관세율표 2025 중국 10자리 신고상품번호 후보. 2026 세칙의 상위 8자리 관세 세번과 연결해 표시한다.',
  '관세청 국가별 관세율표 중국',
  'local://customs-country-tariff-20251231:CHN',
  'china-customs-declaration-codes-2026:customs-country-tariff-2025-10digit',
  date '2026-01-01',
  null::date,
  null::timestamptz,
  now(),
  'staged'::public.legal_record_status,
  encode(digest('CHN|customs-10|' || destination_hs_code || '|customs-country-tariff-2025-10digit', 'sha256'), 'hex')
from public.export_destination_tariff_rates
where country_code = 'CHN'
  and source_version = 'customs-country-tariff-20251231:CHN'
  and destination_hs_code ~ '^[0-9]{10}$'
on conflict (country_code, customs_code, source_version)
do update set
  tariff_code = excluded.tariff_code,
  original_name = excluded.original_name,
  english_name = excluded.english_name,
  korean_name = excluded.korean_name,
  code_role = excluded.code_role,
  notes = excluded.notes,
  source_name = excluded.source_name,
  source_url = excluded.source_url,
  effective_from = excluded.effective_from,
  effective_to = excluded.effective_to,
  retrieved_at = excluded.retrieved_at,
  status = excluded.status,
  checksum = excluded.checksum;
""")
        output.write(copy_block("public.export_destination_customs_codes", [
            "country_code", "customs_code", "tariff_code", "original_name", "english_name", "korean_name",
            "code_role", "notes", "source_name", "source_url", "source_version", "effective_from",
            "effective_to", "published_at", "retrieved_at", "status", "checksum"
        ], rows.values()))
        output.write("commit;\n")

    print(f"wrote {OUTPUT.relative_to(ROOT)} ({len(rows)} explicit 2026 rows plus 2025-derived insert)")


if __name__ == "__main__":
    main()
