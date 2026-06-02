import { describe, expect, it } from "vitest";
import {
  companyOperationsStatusSchema,
  companyVerificationReviewSchema,
  companyVerificationUploadSchema
} from "@/features/company-verification/schemas";

describe("company verification schemas", () => {
  it("accepts a verification upload input", () => {
    const parsed = companyVerificationUploadSchema.safeParse({
      documentType: "business_registration",
      note: "법인 사업자등록증"
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects unknown verification document types", () => {
    const parsed = companyVerificationUploadSchema.safeParse({
      documentType: "spreadsheet"
    });

    expect(parsed.success).toBe(false);
  });

  it("accepts a verification review decision", () => {
    const parsed = companyVerificationReviewSchema.safeParse({
      decision: "approved",
      documentId: "11111111-1111-4111-8111-111111111111",
      reviewNote: "서류 확인"
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects invalid verification review decisions", () => {
    const parsed = companyVerificationReviewSchema.safeParse({
      decision: "blocked",
      documentId: "11111111-1111-4111-8111-111111111111"
    });

    expect(parsed.success).toBe(false);
  });

  it("accepts developer company operation status updates", () => {
    const parsed = companyOperationsStatusSchema.safeParse({
      companyId: "11111111-1111-4111-8111-111111111111",
      note: "증빙 확인 완료",
      status: "recommended_partner"
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects unknown company operation statuses", () => {
    const parsed = companyOperationsStatusSchema.safeParse({
      companyId: "11111111-1111-4111-8111-111111111111",
      status: "hidden"
    });

    expect(parsed.success).toBe(false);
  });
});
