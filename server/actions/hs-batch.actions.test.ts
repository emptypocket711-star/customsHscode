import { describe, expect, it, vi } from "vitest";
import type { HsDirectLookupResult } from "@/server/repositories/hs-master.repository";

const { lookupHsDirectMock } = vi.hoisted(() => ({
  lookupHsDirectMock: vi.fn()
}));

vi.mock("@/server/repositories/hs-master.repository", () => ({
  lookupHsDirect: lookupHsDirectMock
}));

import { lookupHsBatchAction } from "./hs-batch.actions";

function mockLookupResult(hskCode: string, koreanName: string): HsDirectLookupResult {
  return {
    hskCode,
    hs6: hskCode.slice(0, 6),
    koreanName,
    englishName: null,
    importNatureCode: null,
    exportNatureCode: null,
    quantityUnit: null,
    weightUnit: null,
    basisDate: "2026-05-30",
    sourceName: "mock",
    sourceUrl: "mock://hs",
    sourceVersion: "mock-hs",
    effectiveFrom: "2026-01-01",
    effectiveTo: null,
    publishedAt: null,
    retrievedAt: "2026-05-30T00:00:00Z",
    checksum: null,
    standardProductNames: [],
    classificationSiblings: [],
    tariffPreviews: [],
    importRequirements: [],
    originMarking: null,
    classificationCases: [],
    hierarchyPath: []
  };
}

function formDataForRows(rows: unknown[]) {
  const formData = new FormData();
  formData.set("basisDate", "2026-05-30");
  formData.set("destinationCountry", "CHN");
  formData.set("rowsJson", JSON.stringify(rows));
  return formData;
}

describe("lookupHsBatchAction", () => {
  it("returns lower HSK candidates for HS6 rows that need completion", async () => {
    lookupHsDirectMock.mockResolvedValueOnce([
      mockLookupResult("3304991000", "기초화장품"),
      mockLookupResult("3304999000", "기타 화장품")
    ]);

    const result = await lookupHsBatchAction({ status: "idle" }, formDataForRows([
      { rowNumber: 1, hskCode: "3304.99", productName: "화장품", memo: "" }
    ]));

    expect(result.status).toBe("success");
    expect(result.results?.[0]?.status).toBe("warning");
    expect(result.results?.[0]?.candidateOptions).toEqual([
      { hskCode: "3304991000", hs6: "330499", koreanName: "기초화장품" },
      { hskCode: "3304999000", hs6: "330499", koreanName: "기타 화장품" }
    ]);
    expect(result.results?.[0]?.message).toContain("하위 10자리 후보 2건");
    expect(result.results?.[0]?.basisDate).toBe("2026-05-30");
    expect(result.results?.[0]?.countryCode).toBe("CHN");
  });
});
