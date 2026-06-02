import { describe, expect, it } from "vitest";
import {
  companyRoleRequestReviewSchema,
  companyRoleRequestSchema
} from "@/features/company-verification/company-role-request-schemas";

describe("company role request schema", () => {
  it("accepts a role request with one or more marketplace party types", () => {
    const parsed = companyRoleRequestSchema.parse({
      reason: "포워딩 견적 입찰을 위해 역할을 신청합니다.",
      requestedPartyTypes: ["forwarder", "domestic_shipper"]
    });

    expect(parsed.requestedPartyTypes).toEqual(["forwarder", "domestic_shipper"]);
  });

  it("requires at least one role", () => {
    const parsed = companyRoleRequestSchema.safeParse({
      requestedPartyTypes: []
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects unsupported role values", () => {
    const parsed = companyRoleRequestSchema.safeParse({
      requestedPartyTypes: ["broker"]
    });

    expect(parsed.success).toBe(false);
  });

  it("accepts approved or rejected review decisions with a request id", () => {
    const parsed = companyRoleRequestReviewSchema.parse({
      decision: "approved",
      requestId: "11111111-1111-4111-8111-111111111111",
      reviewNote: "증빙과 신청 사유 확인"
    });

    expect(parsed.decision).toBe("approved");
  });

  it("rejects unsupported review decisions", () => {
    const parsed = companyRoleRequestReviewSchema.safeParse({
      decision: "cancelled",
      requestId: "11111111-1111-4111-8111-111111111111"
    });

    expect(parsed.success).toBe(false);
  });
});
