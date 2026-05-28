import { describe, expect, it } from "vitest";
import {
  buildAiLocaleSafetyContext,
  getHsFinderGlossary,
  getHsFinderGlossaryTerm,
  getLegalSafetyCopies,
  getLegalSafetyCopy,
  hsFinderGlossaryKeys,
  hsFinderSupportedLocales,
  legalSafetyCopyKeys,
  normalizeHsFinderLocale
} from "@/lib/i18n/hs-finder-locale";

describe("HS Finder i18n dictionaries", () => {
  it("normalizes supported locale aliases conservatively", () => {
    expect(normalizeHsFinderLocale("ko-KR")).toBe("ko");
    expect(normalizeHsFinderLocale("en-US")).toBe("en");
    expect(normalizeHsFinderLocale("zh_CN")).toBe("zh-CN");
    expect(normalizeHsFinderLocale("zh-Hans")).toBe("zh-CN");
    expect(normalizeHsFinderLocale("zh-TW")).toBe("ko");
    expect(normalizeHsFinderLocale("fr-FR")).toBe("ko");
    expect(normalizeHsFinderLocale()).toBe("ko");
  });

  it("provides every glossary key for ko, en, and zh-CN", () => {
    for (const locale of hsFinderSupportedLocales) {
      const glossary = getHsFinderGlossary(locale);
      expect(Object.keys(glossary).sort()).toEqual([...hsFinderGlossaryKeys].sort());

      for (const key of hsFinderGlossaryKeys) {
        expect(glossary[key].trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("provides every legal safety copy for ko, en, and zh-CN", () => {
    for (const locale of hsFinderSupportedLocales) {
      const copies = getLegalSafetyCopies(locale);
      expect(Object.keys(copies).sort()).toEqual([...legalSafetyCopyKeys].sort());

      for (const key of legalSafetyCopyKeys) {
        expect(copies[key].trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("keeps HS and legal-risk wording explicitly preliminary", () => {
    expect(getLegalSafetyCopy("preliminaryHsCandidate", "ko")).toContain("확정이 아닙니다");
    expect(getLegalSafetyCopy("preliminaryHsCandidate", "en")).toContain("not a final classification");
    expect(getLegalSafetyCopy("preliminaryHsCandidate", "zh-CN")).toContain("并非最终归类结论");

    expect(getLegalSafetyCopy("exportControlPreliminary", "ko")).toContain("대체하지 않습니다");
    expect(getLegalSafetyCopy("exportControlPreliminary", "en")).toContain("does not replace");
    expect(getLegalSafetyCopy("exportControlPreliminary", "zh-CN")).toContain("不替代");
  });

  it("builds compact AI locale context without changing prompt behavior", () => {
    const context = buildAiLocaleSafetyContext("en-US");

    expect(context.locale).toBe("en");
    expect(context.glossary.hsk).toBe(getHsFinderGlossaryTerm("hsk", "en"));
    expect(context.safetyCopies.staffReviewRequired).toBe("Staff review required");
    expect(context.glossaryText).toContain("hsk: Korean HSK 10-digit code");
    expect(context.legalSafetyText).toContain("notFinalHsClassification:");
  });
});
