import { describe, expect, it } from "vitest";
import { staffReviewDecisionSchema } from "@/features/staff-review/schemas";

describe("staffReviewDecisionSchema", () => {
  it("accepts valid report approval decisions", () => {
    const result = staffReviewDecisionSchema.safeParse({
      targetType: "report",
      targetId: "00000000-0000-4000-8000-000000000001",
      decision: "approve",
      note: "source lock 확인"
    });

    expect(result.success).toBe(true);
  });

  it("rejects non-uuid target ids", () => {
    const result = staffReviewDecisionSchema.safeParse({
      targetType: "report",
      targetId: "mock-id",
      decision: "approve"
    });

    expect(result.success).toBe(false);
  });
});
