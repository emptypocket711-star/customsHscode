import { describe, expect, it } from "vitest";
import {
  freightBidSelectSchema,
  freightBidSubmitSchema
} from "@/features/service-requests/freight-bid-schemas";

describe("freight bid submit schema", () => {
  it("accepts a freight bid submission", () => {
    const parsed = freightBidSubmitSchema.parse({
      currency: "usd",
      requestId: "11111111-1111-4111-8111-111111111111",
      totalAmount: "1500"
    });

    expect(parsed.currency).toBe("USD");
    expect(parsed.totalAmount).toBe(1500);
  });

  it("rejects invalid currency and zero total amount", () => {
    expect(() =>
      freightBidSubmitSchema.parse({
        currency: "dollar",
        requestId: "11111111-1111-4111-8111-111111111111",
        totalAmount: "0"
      })
    ).toThrow();
  });

  it("accepts a submitted bid id for requester selection", () => {
    const parsed = freightBidSelectSchema.parse({
      bidId: "11111111-1111-4111-8111-111111111111"
    });

    expect(parsed.bidId).toBe("11111111-1111-4111-8111-111111111111");
  });
});
