import { describe, expect, it } from "vitest";
import { importRequirementSummaryText } from "./import-requirement-summary";

describe("importRequirementSummaryText", () => {
  it("summarizes requirement candidates as preliminary possibilities", () => {
    const result = importRequirementSummaryText(3);

    expect(result.summary).toBe("3개 요건 가능성");
    expect(result.note).toContain("제품 상세자료");
    expect(result.note).toContain("검토");
  });

  it("does not imply requirements are absent when customs-confirmation lookup is empty", () => {
    const result = importRequirementSummaryText(0);

    expect(result.summary).toBe("세관장확인 조회 결과 없음");
    expect(result.note).toContain("통합공고");
    expect(result.note).toContain("개별법령");
    expect(result.note).toContain("별도 확인");
  });
});
