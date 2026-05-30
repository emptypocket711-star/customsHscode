import { formatHsCode, normalizeHsCode } from "@/lib/hs-code";
import { hsChapterName, type HsHierarchyNode } from "@/lib/hs-hierarchy";

function cleanedLabel(value?: string | null) {
  return value?.replace(/^-+\s*/, "").trim() || "";
}

function isGenericLabel(value?: string | null) {
  const normalized = cleanedLabel(value).replace(/[\s.:-]/g, "").toLowerCase();
  return !normalized || normalized === "기타" || normalized === "other" || normalized.endsWith("소호");
}

function hasFinalConsonant(value: string) {
  const last = value.trim().at(-1);
  if (!last) return false;
  const code = last.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return false;
  return (code - 0xac00) % 28 !== 0;
}

function materialProductPhrase(chapterName: string) {
  const match = chapterName.match(/^(.+?)(?:과|와) 그 제품$/);
  if (!match?.[1]) return "";

  const material = match[1].trim();
  const particle = hasFinalConsonant(material) ? "으로" : "로";
  return `${material}${particle} 만든 제품`;
}

function chapterBasedProductPhrase(code: string) {
  const chapterName = hsChapterName(code);
  if (!chapterName) return "해당 HS 류의 품목";
  return materialProductPhrase(chapterName) || `${chapterName} 관련 품목`;
}

function hs6Node(hierarchyPath: HsHierarchyNode[], hs6: string) {
  return hierarchyPath.find((node) => node.level === 6 && normalizeHsCode(node.code) === hs6);
}

export function buildHsBriefDescription(input: {
  hskCode: string;
  hs6?: string | null;
  koreanName?: string | null;
  hierarchyPath?: HsHierarchyNode[];
}) {
  const hskCode = normalizeHsCode(input.hskCode);
  const hs6 = normalizeHsCode(input.hs6 || hskCode.slice(0, 6));
  const koreanName = cleanedLabel(input.koreanName);
  const basePhrase = chapterBasedProductPhrase(hskCode);

  if (!hskCode) return koreanName || "-";

  if (isGenericLabel(koreanName)) {
    const genericName = koreanName || "기타";
    const materialPhrase = materialProductPhrase(hsChapterName(hskCode));
    return materialPhrase ? materialPhrase.replace(/제품$/, `${genericName} 제품`) : `${basePhrase} 중 ${genericName} 품목`;
  }

  const hs6Label = cleanedLabel(hs6Node(input.hierarchyPath ?? [], hs6)?.label);
  if (hs6Label && !isGenericLabel(hs6Label) && hs6Label !== koreanName) {
    return `${hs6Label} 중 ${koreanName}`;
  }

  return `${basePhrase} 중 ${koreanName}`;
}

export function buildHsSubheadingDescription(input: {
  hskCode: string;
  hs6?: string | null;
  koreanName?: string | null;
  hierarchyPath?: HsHierarchyNode[];
}) {
  const hskCode = normalizeHsCode(input.hskCode);
  const hs6 = normalizeHsCode(input.hs6 || hskCode.slice(0, 6));
  if (hs6.length !== 6) return "-";

  const hs6Label = cleanedLabel(hs6Node(input.hierarchyPath ?? [], hs6)?.label);
  if (hs6Label && !isGenericLabel(hs6Label)) {
    return `${formatHsCode(hs6)} ${hs6Label}`;
  }

  const brief = buildHsBriefDescription(input);
  return `${formatHsCode(hs6)} 계열: ${brief}`;
}
