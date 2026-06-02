import { describe, expect, it } from "vitest";
import {
  clearanceBidSelectSchema,
  clearanceBidSubmitSchema,
  clearanceRequestPublishSchema
} from "@/features/service-requests/clearance-bid-schemas";

describe("clearance request publish schema", () => {
  it("accepts a publish deadline up to 48 hours", () => {
    const parsed = clearanceRequestPublishSchema.parse({
      deadlineHours: "24",
      requestId: "11111111-1111-4111-8111-111111111111"
    });

    expect(parsed.deadlineHours).toBe(24);
  });

  it("rejects deadlines over 48 hours", () => {
    expect(() =>
      clearanceRequestPublishSchema.parse({
        deadlineHours: "72",
        requestId: "11111111-1111-4111-8111-111111111111"
      })
    ).toThrow();
  });
});

describe("clearance bid submit schema", () => {
  it("accepts a clearance bid submission", () => {
    const parsed = clearanceBidSubmitSchema.parse({
      brokerageFeeAmount: "70000",
      currency: "krw",
      expectedClearanceDays: "2",
      requestId: "11111111-1111-4111-8111-111111111111",
      totalAmount: "120000"
    });

    expect(parsed.currency).toBe("KRW");
    expect(parsed.totalAmount).toBe(120000);
    expect(parsed.reviewAvailable).toBe(true);
  });

  it("rejects invalid currency and zero total amount", () => {
    expect(() =>
      clearanceBidSubmitSchema.parse({
        currency: "won",
        requestId: "11111111-1111-4111-8111-111111111111",
        totalAmount: "0"
      })
    ).toThrow();
  });
});

describe("clearance bid select schema", () => {
  it("accepts a selected clearance bid id", () => {
    const parsed = clearanceBidSelectSchema.parse({
      bidId: "11111111-1111-4111-8111-111111111111"
    });

    expect(parsed.bidId).toBe("11111111-1111-4111-8111-111111111111");
  });
});
