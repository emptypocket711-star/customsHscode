import { normalizeHsCode } from "@/lib/hs-code";
import { hsChapterName, type HsHierarchyNode } from "@/lib/hs-hierarchy";

function cleanedLabel(value?: string | null) {
  return value?.replace(/^-+\s*/, "").trim() || "";
}

function isGenericLabel(value?: string | null) {
  const normalized = cleanedLabel(value).replace(/[\s.:-]/g, "").toLowerCase();
  return !normalized || normalized === "기타" || normalized === "other" || normalized.endsWith("소호") || /^\d{4,10}(호|품목)$/.test(normalized);
}

function isResidualFamilyLabel(value?: string | null) {
  const label = cleanedLabel(value).replace(/\s/g, "");
  return !label || label === "기타" || label.startsWith("그밖") || label.startsWith("그외");
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

function preferredFamilyLabel(
  hierarchyPath: HsHierarchyNode[],
  hs6: string,
  hskCode: string,
  familyLabels: Record<string, string | null | undefined>
) {
  const intermediateCodes = [
    hskCode.length > 8 ? hskCode.slice(0, 8) : "",
    hskCode.length > 7 ? hskCode.slice(0, 7) : "",
    hs6,
    hskCode.slice(0, 4)
  ].filter(Boolean);

  for (const code of intermediateCodes) {
    const label = cleanedLabel(familyLabels[code]);
    if (label && !isGenericLabel(label) && !isResidualFamilyLabel(label)) return label;
  }

  const hs6Label = cleanedLabel(hs6Node(hierarchyPath, hs6)?.label);
  if (hs6Label && !isGenericLabel(hs6Label) && !isResidualFamilyLabel(hs6Label)) return hs6Label;

  const hs4 = hs6.slice(0, 4);
  const hs4Label = cleanedLabel(hierarchyPath.find((node) => node.level === 4 && normalizeHsCode(node.code) === hs4)?.label);
  if (hs4Label && !isGenericLabel(hs4Label) && !isResidualFamilyLabel(hs4Label)) return hs4Label;

  return "";
}

export function buildHsBriefDescription(input: {
  hskCode: string;
  hs6?: string | null;
  koreanName?: string | null;
  hierarchyPath?: HsHierarchyNode[];
  familyLabels?: Record<string, string | null | undefined>;
}) {
  const hskCode = normalizeHsCode(input.hskCode);
  const hs6 = normalizeHsCode(input.hs6 || hskCode.slice(0, 6));
  const koreanName = cleanedLabel(input.koreanName);
  const basePhrase = chapterBasedProductPhrase(hskCode);

  if (!hskCode) return koreanName || "-";

  const familyLabel = preferredFamilyLabel(input.hierarchyPath ?? [], hs6, hskCode, input.familyLabels ?? {});

  if (isGenericLabel(koreanName)) {
    const genericName = koreanName || "기타";
    if (familyLabel) return `${familyLabel} 중 ${genericName} 품목`;

    const materialPhrase = materialProductPhrase(hsChapterName(hskCode));
    return materialPhrase ? materialPhrase.replace(/제품$/, `${genericName} 제품`) : `${basePhrase} 중 ${genericName} 품목`;
  }

  if (familyLabel && familyLabel !== koreanName) {
    return `${familyLabel} 중 ${koreanName}`;
  }

  return `${basePhrase} 중 ${koreanName}`;
}
