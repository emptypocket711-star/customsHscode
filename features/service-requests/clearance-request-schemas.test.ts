import { describe, expect, it } from "vitest";
import { clearanceRequestDraftSchema } from "@/features/service-requests/clearance-request-schemas";

describe("clearance request draft schema", () => {
  it("accepts a clearance request draft", () => {
    const parsed = clearanceRequestDraftSchema.parse({
      destinationCountryCode: "kr",
      direction: "import",
      estimatedDeclarationCount: "3",
      ftaPreferenceRequested: true,
      hsCodeKnown: true,
      hskCode: "3304991000",
      requirementsCheckNeeded: true,
      title: "화장품 수입 통관 의뢰"
    });

    expect(parsed.destinationCountryCode).toBe("KR");
    expect(parsed.estimatedDeclarationCount).toBe(3);
    expect(parsed.hskCode).toBe("3304991000");
  });

  it("rejects malformed HSK and country codes", () => {
    expect(() =>
      clearanceRequestDraftSchema.parse({
        destinationCountryCode: "KOR",
        direction: "import",
        hskCode: "3304",
        title: "통관"
      })
    ).toThrow();
  });
});
