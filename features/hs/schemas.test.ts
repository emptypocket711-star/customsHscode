import { describe, expect, it } from "vitest";
import { hsSearchRequestSchema } from "@/features/hs/schemas";

describe("hsSearchRequestSchema", () => {
  it("requires hs code for direct lookup requests", () => {
    const result = hsSearchRequestSchema.safeParse({
      direction: "import",
      searchType: "hs_code",
      basisDate: "2026-05-21"
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.inputHsCode?.[0]).toContain("HS");
    }
  });

  it("keeps basis date explicit for valid product name requests", () => {
    const result = hsSearchRequestSchema.safeParse({
      direction: "export",
      searchType: "product_name",
      inputProductName: "리튬 배터리 모듈",
      basisDate: "2026-05-21"
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.basisDate).toBe("2026-05-21");
    }
  });
});
