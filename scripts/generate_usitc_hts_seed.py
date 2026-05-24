#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
import os
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.request import Request, urlopen

SCRIPT_DIR = Path(__file__).resolve().parent
ROOT = SCRIPT_DIR.parents[0]
sys.path.insert(0, str(SCRIPT_DIR))

from generate_customs_excel_seed import copy_block  # noqa: E402

OUTPUT = Path(os.getenv("USITC_HTS_OUTPUT", ROOT / "supabase/seed/generated/usitc_hts_seed.sql"))
ADDITIONAL_OUTPUT = Path(os.getenv("USITC_CHAPTER99_OUTPUT", ROOT / "supabase/seed/generated/us_chapter99_additional_tariffs_seed.sql"))
SOURCE_NAME = "USITC HTS REST API"
SOURCE_VERSION = os.getenv("USITC_HTS_SOURCE_VERSION", "usitc-hts-2026-rev7-20260523")
ADDITIONAL_SOURCE_VERSION = os.getenv("USITC_CHAPTER99_SOURCE_VERSION", "usitc-chapter99-additional-tariffs-20260523")
BASE_URL = "https://hts.usitc.gov/reststop/exportList"
CACHE_DIR = Path(os.getenv("USITC_HTS_CACHE_DIR", ROOT / "data/cache/usitc/exportList"))
GENERATED_HS_SEED = ROOT / "supabase/seed/generated/customs_hs_seed.sql"
DEFAULT_PREFIXES = [
    "3004",
    "3304",
    "4202",
    "7308",
    "7616",
    "8415",
    "8507",
    "8516",
    "8528",
    "8544",
    "8708",
    "9018",
]
CHAPTER_99_REF_RE = re.compile(r"\b(9903\.\d{2}\.\d{2})\b")
US_NOTE_2_RE = re.compile(r"u\.s\. note 2(?!\d)", re.IGNORECASE)
US_NOTE_REF_RE = re.compile(r"U\.S\. note\s+([0-9]+(?:\([a-z]+\))?)", re.IGNORECASE)


def chapter99_label(code: str, description: str | None) -> str:
    text = (description or "").lower()
    if code.startswith("9903.82") or "u.s. note 16" in text:
        return f"미국 추가관세 후보 {code} (Section 232 금속)"
    if code.startswith("9903.01") or code.startswith("9903.02") or US_NOTE_2_RE.search(text):
        return f"미국 추가관세 후보 {code} (상호관세/IEEPA)"
    if "product of china" in text or "products of china" in text:
        return f"미국 추가관세 후보 {code} (중국산 Section 301)"
    if "product of canada" in text or "products of canada" in text:
        return f"미국 추가관세 후보 {code} (캐나다산)"
    if "product of mexico" in text or "products of mexico" in text:
        return f"미국 추가관세 후보 {code} (멕시코산)"
    if "product of the russian federation" in text or "products of the russian federation" in text:
        return f"미국 추가관세 후보 {code} (러시아산)"

    return f"미국 추가관세 후보 {code}"


def chapter99_program(description: str | None) -> str:
    text = (description or "").lower()
    if "u.s. note 16" in text:
        return "Section 232 금속 추가관세"
    if US_NOTE_2_RE.search(text):
        return "상호관세/IEEPA 추가관세"
    if "product of china" in text or "products of china" in text:
        return "Section 301 추가관세"
    if "product of canada" in text or "products of canada" in text:
        return "캐나다산 추가관세"
    if "product of mexico" in text or "products of mexico" in text:
        return "멕시코산 추가관세"
    if "product of the russian federation" in text or "products of the russian federation" in text:
        return "러시아산 추가관세"

    return "Chapter 99 추가관세"


def chapter99_origin_country(description: str | None) -> str | None:
    text = (description or "").lower()
    if "product of china" in text or "products of china" in text:
        return "CHN"
    if "product of canada" in text or "products of canada" in text:
        return "CAN"
    if "product of mexico" in text or "products of mexico" in text:
        return "MEX"
    if "product of the russian federation" in text or "products of the russian federation" in text:
        return "RUS"

    return None


def chapter99_legal_basis(description: str | None) -> str:
    notes = sorted(set(match.group(0) for match in US_NOTE_REF_RE.finditer(description or "")))
    if notes:
        return f"HTS Chapter 99; {', '.join(notes)}"
    return "HTS Chapter 99"


def chapter99_condition_summary(code: str, description: str | None) -> str:
    text = (description or "").lower()
    excluded_headings = sorted(set(CHAPTER_99_REF_RE.findall(description or "")))
    excluded_text = f" 예외/대체 적용 Chapter 99 후보: {', '.join(excluded_headings)}." if excluded_headings else ""

    if code.startswith("9903.82") or "u.s. note 16" in text:
        return (
            "철강, 알루미늄, 구리 및 관련 파생품 중 HTS Chapter 99 U.S. note 16 적용 대상 후보입니다. "
            "품목의 금속 함유 여부, 함량 기준, 파생품 범위, 원산지/국가별 예외 및 9903.82.01/9903.82.03 제외 조건을 함께 확인해야 합니다."
        )

    if "product of china" in text or "products of china" in text:
        return (
            "원산지가 중국인 물품 중 HTS Chapter 99의 해당 U.S. note에 열거된 품목에 적용되는 Section 301 추가관세 후보입니다. "
            f"품목별 제외, 한시적 제외, 대체 Chapter 99 적용 여부를 확인해야 합니다.{excluded_text}"
        )

    if "product of the russian federation" in text or "products of the russian federation" in text:
        return (
            "원산지가 러시아인 물품 중 HTS Chapter 99의 해당 U.S. note에 열거된 품목에 적용되는 추가관세 후보입니다. "
            f"품목별 제외, 시행일, 대체 Chapter 99 적용 여부를 확인해야 합니다.{excluded_text}"
        )

    if "product of canada" in text or "products of canada" in text:
        return (
            "원산지가 캐나다인 물품 중 HTS Chapter 99의 해당 U.S. note에 열거된 품목에 적용되는 추가관세 후보입니다. "
            f"품목별 제외와 적용 기간을 확인해야 합니다.{excluded_text}"
        )

    if "product of mexico" in text or "products of mexico" in text:
        return (
            "원산지가 멕시코인 물품 중 HTS Chapter 99의 해당 U.S. note에 열거된 품목에 적용되는 추가관세 후보입니다. "
            f"품목별 제외와 적용 기간을 확인해야 합니다.{excluded_text}"
        )

    if code.startswith("9903.01") or code.startswith("9903.02") or US_NOTE_2_RE.search(text):
        return (
            "HTS Chapter 99 U.S. note 2 관련 상호관세/IEEPA 추가관세 후보입니다. "
            "대상국, 면제 품목, 시행일, 중복 적용 제한을 확인해야 합니다."
        )

    return (
        "HTS Chapter 99에 연결된 추가관세 후보입니다. "
        "원산지, 적용 품목, 제외 품목, 시행일 및 다른 Chapter 99와의 중복 적용 여부를 확인해야 합니다."
    )


def checksum(*parts: str) -> str:
    return hashlib.sha256("|".join(parts).encode("utf-8")).hexdigest()


def normalize_code(value: str | None) -> str:
    return re.sub(r"[^0-9]", "", value or "")


def clean_rate(value: str | None) -> str | None:
    if not value:
        return None
    cleaned = re.sub(r"\s+", " ", value).strip()
    return cleaned or None


def cache_enabled() -> bool:
    return os.getenv("USITC_HTS_CACHE", "1").lower() not in {"0", "false", "no"}


def read_json_url(url: str, cache_name: str) -> Any:
    cache_path = CACHE_DIR / cache_name
    if cache_enabled() and cache_path.exists():
        return json.loads(cache_path.read_text(encoding="utf-8"))

    request = Request(url, headers={"Accept": "application/json", "User-Agent": "customs-ai-codex-harness"})
    last_error: Exception | None = None
    for attempt in range(1, 4):
        try:
            with urlopen(request, timeout=45) as response:
                payload = json.loads(response.read().decode("utf-8"))
            if cache_enabled():
                cache_path.parent.mkdir(parents=True, exist_ok=True)
                cache_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
            return payload
        except Exception as exc:  # noqa: BLE001
            last_error = exc
            if attempt < 3:
                time.sleep(attempt * 1.5)

    raise RuntimeError(f"USITC request failed after retries: {url}") from last_error


def prefixes_from_file(path: Path) -> list[str]:
    text = path.read_text(encoding="utf-8")
    return sorted({match.group(0) for match in re.finditer(r"\b\d{4}\b", text)})


def prefixes_from_generated_hs_seed(path: Path = GENERATED_HS_SEED) -> list[str]:
    if not path.exists():
        raise FileNotFoundError(f"HS seed not found: {path}")

    prefixes: set[str] = set()
    in_copy = False
    with path.open("r", encoding="utf-8") as seed:
        for line in seed:
            if line.startswith("COPY ") and "hs_master" in line:
                in_copy = True
                continue
            if not in_copy:
                continue
            if line.startswith("\\."):
                break

            hsk_code = line.split("\t", 1)[0]
            normalized = normalize_code(hsk_code)
            if len(normalized) >= 4:
                prefixes.add(normalized[:4])

    return sorted(prefixes)


def normalize_prefixes(prefixes: list[str]) -> list[str]:
    normalized = sorted({normalize_code(prefix)[:4] for prefix in prefixes if len(normalize_code(prefix)) >= 4})
    max_prefixes = os.getenv("USITC_HTS_MAX_PREFIXES")
    if max_prefixes:
        return normalized[: int(max_prefixes)]
    return normalized


def resolve_prefixes() -> list[str]:
    explicit_prefixes = os.getenv("USITC_HTS_PREFIXES")
    if explicit_prefixes:
        return normalize_prefixes(explicit_prefixes.split(","))

    prefix_file = os.getenv("USITC_HTS_PREFIX_FILE")
    if prefix_file:
        return normalize_prefixes(prefixes_from_file(Path(prefix_file)))

    mode = os.getenv("USITC_HTS_PREFIX_MODE", "default").lower()
    if mode in {"korea-hs4", "korean-hs4", "hs-master"}:
        return normalize_prefixes(prefixes_from_generated_hs_seed())

    if mode.startswith("range:"):
        _, start, end = mode.split(":", 2)
        return normalize_prefixes([f"{code:04d}" for code in range(int(start), int(end) + 1)])

    return normalize_prefixes(DEFAULT_PREFIXES)


def display_path(path: Path) -> str:
    try:
        return str(path.relative_to(ROOT))
    except ValueError:
        return str(path)


def summarize_chapter99_rate(rate_text: str | None, description: str | None) -> str | None:
    if not rate_text:
        return None

    rate = clean_rate(rate_text)
    if not rate:
        return None

    percent_match = re.search(r"(?:\+|plus)\s*([0-9.]+%|\$[0-9.,]+)", rate, flags=re.IGNORECASE)
    if "duty provided in the applicable subheading" in rate.lower() and percent_match:
        summary = f"기본세율 + {percent_match.group(1)}"
    elif "duty provided in the applicable subheading" in rate.lower():
        summary = "기본세율"
    else:
        summary = rate

    text = (description or "").lower()
    conditions: list[str] = []
    if "product of china" in text or "products of china" in text:
        conditions.append("중국산 조건부")
    elif "product of canada" in text or "products of canada" in text:
        conditions.append("캐나다산 조건부")
    elif "product of mexico" in text or "products of mexico" in text:
        conditions.append("멕시코산 조건부")
    elif "product of the russian federation" in text or "products of the russian federation" in text:
        conditions.append("러시아산 조건부")

    conditions.append("Chapter 99 적용 제외/예외 확인 필요")

    return f"{summary} ({', '.join(conditions)})"


def chapter99_rate_text(item: dict[str, Any] | None) -> str | None:
    if not item:
        return None
    for key in ("general", "special", "other", "additionalDuties", "addiitionalDuties"):
        value = clean_rate(item.get(key))
        if value:
            return value
    return None


def fetch_range(prefix: str) -> list[dict[str, Any]]:
    url = f"{BASE_URL}?from={prefix}&to={int(prefix) + 1:04d}&format=JSON&styles=false"
    payload = read_json_url(url, f"range_{prefix}_{int(prefix) + 1:04d}.json")
    if not isinstance(payload, list):
        raise RuntimeError(f"unexpected USITC response for {prefix}: {payload!r}")
    return payload


def next_hts_code(code: str) -> str:
    parts = code.split(".")
    last = parts[-1]
    parts[-1] = str(int(last) + 1).zfill(len(last))
    return ".".join(parts)


def fetch_chapter99_ref(code: str) -> dict[str, Any] | None:
    url = f"{BASE_URL}?from={code}&to={next_hts_code(code)}&format=JSON&styles=false"
    payload = read_json_url(url, f"chapter99_{normalize_code(code)}.json")
    if not isinstance(payload, list):
        raise RuntimeError(f"unexpected USITC Chapter 99 response for {code}: {payload!r}")

    normalized = normalize_code(code)
    return next((item for item in payload if normalize_code(item.get("htsno") or "") == normalized), None)


def chapter99_cache_entry(chapter99_cache: dict[str, dict[str, str | None]], chapter99_code: str) -> dict[str, str | None]:
    if chapter99_code not in chapter99_cache:
        chapter99_item = fetch_chapter99_ref(chapter99_code)
        chapter99_description = chapter99_item.get("description") if chapter99_item else None
        chapter99_cache[chapter99_code] = {
            "description": chapter99_description,
            "rate": summarize_chapter99_rate(
                chapter99_rate_text(chapter99_item),
                chapter99_description,
            ),
        }

    return chapter99_cache[chapter99_code]


def append_additional_tariff_row(
    additional_rows: list[list[object | None]],
    seen_additional_keys: set[tuple[str, str, str, str | None]],
    *,
    destination_code: str,
    chapter99_code: str,
    chapter99: dict[str, str | None],
    retrieved_at: str,
    notes: str,
) -> None:
    if not chapter99["rate"]:
        return

    origin_country = chapter99_origin_country(chapter99["description"])
    additional_key = ("USA", destination_code, chapter99_code, origin_country)
    if additional_key in seen_additional_keys:
        return

    seen_additional_keys.add(additional_key)
    chapter99_url = f"{BASE_URL}?from={chapter99_code}&to={next_hts_code(chapter99_code)}&format=JSON&styles=false"
    source_description = chapter99["description"]
    source_notes = f"USITC 원문 조건: {source_description}" if source_description else None
    merged_notes = " ".join([part for part in [notes, source_notes] if part])
    additional_rows.append([
        "USA",
        destination_code,
        chapter99_code,
        chapter99_program(chapter99["description"]),
        chapter99["rate"],
        origin_country,
        chapter99_condition_summary(chapter99_code, chapter99["description"]),
        chapter99_legal_basis(chapter99["description"]),
        merged_notes,
        SOURCE_NAME,
        chapter99_url,
        ADDITIONAL_SOURCE_VERSION,
        "2026-04-29",
        None,
        None,
        retrieved_at,
        "staged",
        checksum("USA", destination_code, chapter99_code, ADDITIONAL_SOURCE_VERSION),
    ])


def section232_candidate_code(destination_code: str) -> str | None:
    if len(destination_code) >= 8 and destination_code.startswith(("72", "73", "74", "76")):
        return "9903.82.02"
    return None


def section232_notes(chapter99_cache: dict[str, dict[str, str | None]]) -> str:
    no_metal = chapter99_cache_entry(chapter99_cache, "9903.82.01")["description"]
    low_metal = chapter99_cache_entry(chapter99_cache, "9903.82.03")["description"]
    return " ".join([
        "Section 232 금속류 조건부 후보입니다.",
        "U.S. note 16, 금속 함량, 파생품 범위, 국가/품목 예외를 확인해야 합니다.",
        "예외 후보:",
        f"9903.82.01 {no_metal or '금속 미포함 물품'};",
        f"9903.82.03 {low_metal or '일정 금속 함량 미만 물품'}."
    ])


def main() -> None:
    prefixes = resolve_prefixes()
    retrieved_at = datetime.now(timezone.utc).isoformat()
    rows: list[list[object | None]] = []
    additional_rows: list[list[object | None]] = []
    seen_codes: set[str] = set()
    seen_additional_keys: set[tuple[str, str, str, str | None]] = set()
    chapter99_cache: dict[str, dict[str, str | None]] = {}

    for prefix_index, prefix in enumerate(prefixes, start=1):
        print(f"fetching USITC HTS {prefix} ({prefix_index}/{len(prefixes)})", file=sys.stderr)
        inherited_by_indent: dict[int, dict[str, str | None]] = {}
        for item in fetch_range(prefix):
            original_code = item.get("htsno") or ""
            code = normalize_code(original_code)
            if len(code) < 4 or code in seen_codes:
                continue

            indent = int(item.get("indent") or 0)
            description = item.get("description") or None
            unit = ", ".join(item.get("units") or []) or None
            general = clean_rate(item.get("general"))
            special = clean_rate(item.get("special"))
            other = clean_rate(item.get("other"))

            if general or special or other:
                inherited_by_indent[indent] = {
                    "general": general,
                    "special": special,
                    "other": other,
                }
                for stale_indent in [key for key in inherited_by_indent if key > indent]:
                    inherited_by_indent.pop(stale_indent, None)
            else:
                parent_rate = next(
                    (inherited_by_indent[key] for key in sorted(inherited_by_indent.keys(), reverse=True) if key < indent),
                    {},
                )
                general = parent_rate.get("general")
                special = parent_rate.get("special")
                other = parent_rate.get("other")

            agreement_rates: dict[str, str] = {}
            if special:
                agreement_rates["Special / preferential duty"] = special
            if other:
                agreement_rates["Column 2 duty"] = other

            footnotes = item.get("footnotes") or []
            if footnotes:
                footnote_text = "; ".join(
                    str(note.get("value") or "").strip()
                    for note in footnotes
                    if note.get("value")
                )
                agreement_rates["미국 HTS 주석"] = footnote_text

                for chapter99_code in sorted(set(CHAPTER_99_REF_RE.findall(footnote_text))):
                    append_additional_tariff_row(
                        additional_rows,
                        seen_additional_keys,
                        destination_code=code,
                        chapter99_code=chapter99_code,
                        chapter99=chapter99_cache_entry(chapter99_cache, chapter99_code),
                        retrieved_at=retrieved_at,
                        notes="HTS footnote에서 참조된 조건부 추가관세 후보입니다. 품목 예외, 원산지, 적용 제외 및 고시 변경 여부를 별도 확인해야 합니다.",
                    )

            section232_code = section232_candidate_code(code)
            if section232_code:
                append_additional_tariff_row(
                    additional_rows,
                    seen_additional_keys,
                    destination_code=code,
                    chapter99_code=section232_code,
                    chapter99=chapter99_cache_entry(chapter99_cache, section232_code),
                    retrieved_at=retrieved_at,
                    notes=section232_notes(chapter99_cache),
                )

            seen_codes.add(code)
            rows.append([
                "USA", 2026, code, description, description, None, unit, general,
                json.dumps(agreement_rates, ensure_ascii=False, sort_keys=True), SOURCE_NAME,
                f"https://hts.usitc.gov/reststop/exportList?from={prefix}&to={int(prefix) + 1:04d}&format=JSON&styles=false",
                SOURCE_VERSION, "2026-04-29", None, None, retrieved_at, "staged",
                checksum("USA", code, SOURCE_VERSION),
            ])

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT.open("w", encoding="utf-8") as output:
        output.write("-- Generated by scripts/generate_usitc_hts_seed.py\n")
        output.write("begin;\n")
        output.write(f"delete from public.export_destination_tariff_rates where country_code = 'USA' and source_version = '{SOURCE_VERSION}';\n")
        output.write(copy_block("public.export_destination_tariff_rates", [
            "country_code", "tariff_year", "destination_hs_code", "original_name", "english_name", "korean_name", "unit", "base_rate_text",
            "agreement_rates", "source_name", "source_url", "source_version", "effective_from", "effective_to",
            "published_at", "retrieved_at", "status", "checksum",
        ], rows))
        output.write("commit;\n")

    with ADDITIONAL_OUTPUT.open("w", encoding="utf-8") as output:
        output.write("-- Generated by scripts/generate_usitc_hts_seed.py\n")
        output.write("begin;\n")
        output.write(f"delete from public.export_destination_additional_tariffs where country_code = 'USA' and source_version = '{ADDITIONAL_SOURCE_VERSION}';\n")
        output.write(copy_block("public.export_destination_additional_tariffs", [
            "country_code", "destination_hs_code", "additional_tariff_code", "tariff_program", "rate_text", "origin_country_code",
            "condition_summary", "legal_basis", "notes", "source_name", "source_url", "source_version", "effective_from", "effective_to",
            "published_at", "retrieved_at", "status", "checksum",
        ], additional_rows))
        output.write("commit;\n")

    print(f"wrote {display_path(OUTPUT)} ({len(rows)} tariff rows)")
    print(f"wrote {display_path(ADDITIONAL_OUTPUT)} ({len(additional_rows)} additional tariff rows)")


if __name__ == "__main__":
    main()
