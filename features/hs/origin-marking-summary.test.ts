import { describe, expect, it } from "vitest";
import { originMarkingSummaryText } from "./origin-marking-summary";

describe("originMarkingSummaryText", () => {
  it("labels target rows as lookup results that still need condition review", () => {
    const result = originMarkingSummaryText(true);

    expect(result.summary).toBe("표시대상 조회됨(Y)");
    expect(result.note).toContain("표시방법");
    expect(result.note).toContain("거래조건");
  });

  it("does not render non-target rows as a plain dash", () => {
    const result = originMarkingSummaryText(false);

    expect(result.summary).toBe("표시대상 조회 결과 없음");
    expect(result.note).toContain("개별법령");
    expect(result.note).toContain("별도 표시");
  });
});
