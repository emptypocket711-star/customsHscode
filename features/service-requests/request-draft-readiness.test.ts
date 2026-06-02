import { describe, expect, it } from "vitest";
import { hasDraftValue, summarizeDraftReadiness } from "@/features/service-requests/request-draft-readiness";

describe("request draft readiness", () => {
  it("treats trimmed text, positive numbers, and true booleans as filled", () => {
    expect(hasDraftValue("  화장품  ")).toBe(true);
    expect(hasDraftValue("   ")).toBe(false);
    expect(hasDraftValue(3)).toBe(true);
    expect(hasDraftValue(0)).toBe(false);
    expect(hasDraftValue(true)).toBe(true);
    expect(hasDraftValue(false)).toBe(false);
  });

  it("summarizes required and recommended missing fields separately", () => {
    const summary = summarizeDraftReadiness([
      { label: "요청 제목", required: true, value: "사탕 수입 통관" },
      { label: "목적국", required: true, value: "" },
      { label: "품목 요약", value: "사탕" },
      { label: "원산지", value: null }
    ]);

    expect(summary.requiredCount).toBe(2);
    expect(summary.satisfiedRequiredCount).toBe(1);
    expect(summary.missingRequired.map((item) => item.label)).toEqual(["목적국"]);
    expect(summary.recommendedCount).toBe(2);
    expect(summary.satisfiedRecommendedCount).toBe(1);
    expect(summary.missingRecommended.map((item) => item.label)).toEqual(["원산지"]);
  });
});
