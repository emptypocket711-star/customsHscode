import { describe, expect, it } from "vitest";
import { freightRequestDocumentUploadSchema } from "@/features/service-requests/freight-request-document-schemas";

describe("freight request document upload schema", () => {
  it("accepts request document upload metadata", () => {
    const parsed = freightRequestDocumentUploadSchema.parse({
      documentType: "commercial_invoice",
      requestId: "11111111-1111-4111-8111-111111111111",
      visibility: "selected_partner"
    });

    expect(parsed.visibility).toBe("selected_partner");
  });

  it("rejects unsupported visibility", () => {
    expect(() =>
      freightRequestDocumentUploadSchema.parse({
        documentType: "commercial_invoice",
        requestId: "11111111-1111-4111-8111-111111111111",
        visibility: "public"
      })
    ).toThrow();
  });
});
