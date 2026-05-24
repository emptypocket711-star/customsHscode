import { describe, expect, it } from "vitest";
import {
  getImportCountryCandidates,
  normalizeImportHskCode
} from "@/server/repositories/import-diagnosis.repository";

describe("import diagnosis repository helpers", () => {
  it("normalizes formatted hsk codes", () => {
    expect(normalizeImportHskCode("3304.99-1000")).toBe("3304991000");
  });

  it("keeps fta country candidates distinct from shipment country only", () => {
    expect(
      getImportCountryCandidates({
        hskCode: "3304991000",
        basisDate: "2026-05-21",
        originCountry: "cn",
        exportCountry: "CN",
        shipmentCountry: "HK",
        manufacturingCountry: "KR",
        sellerCountry: "SG",
        destinationCountry: "KR"
      })
    ).toEqual(["CN", "CN", "HK", "KR", "SG"]);
  });
});
