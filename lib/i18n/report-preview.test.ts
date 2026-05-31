import { describe, expect, it } from "vitest";
import { getReportPreviewDictionary } from "./report-preview";
import { supportedLocales } from "./locales";

describe("getReportPreviewDictionary", () => {
  it("returns report preview labels for every supported locale", () => {
    for (const locale of supportedLocales) {
      const dictionary = getReportPreviewDictionary(locale);

      expect(dictionary.page.title).toBeTruthy();
      expect(dictionary.approval.pendingReview).toBeTruthy();
      expect(dictionary.labels.autoPreliminary).toBeTruthy();
      expect(dictionary.sections.sourceLocksTitle).toBeTruthy();
    }
  });

  it("keeps report preview copy away from final certainty language", () => {
    const text = JSON.stringify(getReportPreviewDictionary("en-US"));

    expect(text).not.toMatch(/guaranteed|definitely|final classification/i);
  });

  it("uses Korean-facing source lock labels in Korean locale", () => {
    const dictionary = getReportPreviewDictionary("ko-KR");

    expect(dictionary.sections.sourceLocksTitle).toBe("근거 자료 고정");
    expect(dictionary.sections.sourceSnapshotLabel).toBe("자료 보관본");
    expect(dictionary.sections.ruleVersionLabel).toBe("판정 규칙");
  });
});
