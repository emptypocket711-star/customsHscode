import { describe, expect, it } from "vitest";
import { diagnoseImport } from "@/server/rules/import-diagnosis.service";

describe("diagnoseImport", () => {
  it("returns tariff, fta and requirement sections for a matching hsk and country", () => {
    const result = diagnoseImport({
      hskCode: "3304.99-1000",
      basisDate: "2026-05-21",
      originCountry: "CN",
      shipmentCountry: "CN",
      destinationCountry: "KR"
    });

    expect(result?.hskCode).toBe("3304991000");
    expect(result?.tariffs.length).toBeGreaterThan(0);
    expect(result?.ftaOptions[0]?.staffReviewStatus).toBe("확인 필요");
    expect(result?.requirements[0]?.playbook?.requiredDocuments.length).toBeGreaterThan(0);
  });

  it("does not return inactive basis-date records", () => {
    const result = diagnoseImport({
      hskCode: "3304.99-1000",
      basisDate: "2025-05-21",
      originCountry: "CN"
    });

    expect(result).toBeNull();
  });
});
