import { describe, expect, it } from "vitest";
import { getReviewRpcName } from "@/server/repositories/staff-review-mutation.repository";

describe("staff review mutation repository", () => {
  it("maps review targets to atomic rpc names", () => {
    expect(getReviewRpcName("hs_candidate")).toBe("review_hs_candidate");
    expect(getReviewRpcName("hs_confirmation_request")).toBe("review_hs_confirmation_request");
    expect(getReviewRpcName("report")).toBe("review_report");
    expect(getReviewRpcName("legal_change")).toBe("review_legal_change");
  });
});
