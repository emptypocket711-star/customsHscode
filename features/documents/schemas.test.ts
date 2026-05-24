import { describe, expect, it } from "vitest";
import { documentExtractionPersistSchema } from "@/features/documents/schemas";

describe("document schemas", () => {
  it("does not require client-provided company id for extraction persistence", () => {
    const result = documentExtractionPersistSchema.safeParse({
      documentId: "11111111-1111-4111-8111-111111111111",
      requestId: "22222222-2222-4222-8222-222222222222",
      rawText: "COMMERCIAL INVOICE\nInvoice No: CI-1\nCountry of Origin: KR\nDestination Country: CN"
    });

    expect(result.success).toBe(true);
  });

  it("rejects nearly empty extraction text", () => {
    const result = documentExtractionPersistSchema.safeParse({
      documentId: "11111111-1111-4111-8111-111111111111",
      requestId: "22222222-2222-4222-8222-222222222222",
      rawText: "  "
    });

    expect(result.success).toBe(false);
  });

  it("accepts short copied invoice row text", () => {
    const result = documentExtractionPersistSchema.safeParse({
      documentId: "11111111-1111-4111-8111-111111111111",
      requestId: "22222222-2222-4222-8222-222222222222",
      rawText: "A,B,C"
    });

    expect(result.success).toBe(true);
  });
});
