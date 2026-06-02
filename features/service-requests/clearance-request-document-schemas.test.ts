import { describe, expect, it } from "vitest";
import { clearanceRequestDocumentUploadSchema } from "@/features/service-requests/clearance-request-document-schemas";

describe("clearance request document upload schema", () => {
  it("accepts private clearance request document metadata", () => {
    const parsed = clearanceRequestDocumentUploadSchema.parse({
      documentType: "commercial_invoice",
      requestId: "11111111-1111-4111-8111-111111111111",
      visibility: "matched_partner_after_interest"
    });

    expect(parsed.visibility).toBe("matched_partner_after_interest");
  });

  it("rejects unsupported visibility", () => {
    expect(() =>
      clearanceRequestDocumentUploadSchema.parse({
        documentType: "packing_list",
        requestId: "11111111-1111-4111-8111-111111111111",
        visibility: "public"
      })
    ).toThrow();
  });
});
