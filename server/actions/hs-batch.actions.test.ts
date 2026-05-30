import { afterEach, describe, expect, it, vi } from "vitest";
import type { HsDirectLookupResult } from "@/server/repositories/hs-master.repository";

const { lookupHsDirectMock } = vi.hoisted(() => ({
  lookupHsDirectMock: vi.fn()
}));

const { normalizeProductSearchInputMock } = vi.hoisted(() => ({
  normalizeProductSearchInputMock: vi.fn()
}));

vi.mock("@/server/repositories/hs-master.repository", () => ({
  lookupHsDirect: lookupHsDirectMock
}));

vi.mock("@/server/ai/product-search-normalization.service", () => ({
  normalizeProductSearchInput: normalizeProductSearchInputMock
}));

import { lookupHsBatchAction } from "./hs-batch.actions";

function mockLookupResult(hskCode: string, koreanName: string): HsDirectLookupResult {
  return {
    hskCode,
    hs6: hskCode.slice(0, 6),
    koreanName,
    briefDescription: koreanName,
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
  afterEach(() => {
    lookupHsDirectMock.mockReset();
    normalizeProductSearchInputMock.mockReset();
  });

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

  it("returns AI preliminary HS directions for product-only rows", async () => {
    normalizeProductSearchInputMock.mockResolvedValueOnce({
      provider: "mock",
      model: "mock-model",
      classificationState: "needs_clarification",
      certainty: "low",
      displayMode: "needs_more_info",
      correctedProductName: "작업용 조끼",
      primaryCandidate: null,
      candidateHsCodes: ["6211", "611030"],
      candidateHsCodeReasons: [
        { code: "6211", reason: "직물제 조끼류 가능성", requiredInfo: ["직물/편직 구분", "재질"] },
        { code: "6110.30", reason: "편직물 조끼류 가능성", requiredInfo: ["니트 여부", "섬유 조성"] }
      ],
      searchTerms: [],
      koreanTerms: [],
      englishTerms: [],
      productFamilies: [],
      missingQuestions: ["직물제인지 편직물인지 확인해 주세요.", "겉감 재질과 섬유 조성을 확인해 주세요."],
      userMessage: "조끼류는 재질과 직물/편직 구분 확인이 필요합니다.",
      webSources: []
    });

    const result = await lookupHsBatchAction({ status: "idle" }, formDataForRows([
      { rowNumber: 1, hskCode: "", productName: "작업용 조끼", memo: "" }
    ]));

    expect(result.status).toBe("success");
    expect(result.results?.[0]?.status).toBe("warning");
    expect(result.results?.[0]?.aiSuggestedCodes).toEqual([
      { code: "6211", reason: "직물제 조끼류 가능성", requiredInfo: ["직물/편직 구분", "재질"] },
      { code: "611030", reason: "편직물 조끼류 가능성", requiredInfo: ["니트 여부", "섬유 조성"] }
    ]);
    expect(result.results?.[0]?.missingQuestions).toContain("직물제인지 편직물인지 확인해 주세요.");
    expect(lookupHsDirectMock).not.toHaveBeenCalled();
  });
});
