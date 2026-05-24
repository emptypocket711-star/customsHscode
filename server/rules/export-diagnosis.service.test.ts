import { describe, expect, it } from "vitest";
import { diagnoseExport } from "@/server/rules/export-diagnosis.service";

describe("diagnoseExport", () => {
  it("returns export control and document checklist for battery exports", () => {
    const result = diagnoseExport({
      hskCode: "8507.60-1000",
      basisDate: "2026-05-23",
      destinationCountry: "DEU",
      productUse: "전기자전거 교체용",
      finalUser: "독일 유통사"
    });

    expect(result?.hskCode).toBe("8507601000");
    expect(result?.exportControls[0]?.staffReviewStatus).toBe("확인 필요");
    expect(result?.buyerDocumentList).toContain("UN38.3");
    expect(result?.ftaCoOptions[0]?.agreementName).toBe("한-EU FTA");
    expect(result?.destinationTariffs[0]?.staffReviewStatus).toBe("확인 필요");
  });

  it("accepts ISO2 destination aliases for mock fallback data", () => {
    const result = diagnoseExport({
      hskCode: "8507.60-1000",
      basisDate: "2026-05-23",
      destinationCountry: "DE"
    });

    expect(result?.ftaCoOptions[0]?.agreementName).toBe("한-EU FTA");
  });

  it("filters destination tariff rows by selected country", () => {
    const result = diagnoseExport({
      hskCode: "8507.60-1000",
      basisDate: "2026-05-23",
      destinationCountry: "USA"
    });

    expect(result?.destinationTariffs).toHaveLength(1);
    expect(result?.destinationTariffs[0]?.countryCode).toBe("US");
  });

  it("excludes inactive basis-date records", () => {
    const result = diagnoseExport({
      hskCode: "8507.60-1000",
      basisDate: "2025-05-21",
      destinationCountry: "DE"
    });

    expect(result).toBeNull();
  });
});
