import { describe, expect, it } from "vitest";
import { hsMasterRepositoryInternals } from "@/server/repositories/hs-master.repository";

describe("hs master repository mock lookup", () => {
  it("normalizes hsk punctuation and returns published basis-date records", () => {
    const results = hsMasterRepositoryInternals.lookupWithMockData("3304.99-1000", "2026-05-21");

    expect(results).toHaveLength(1);
    expect(results[0]?.hskCode).toBe("3304991000");
    expect(results[0]?.sourceVersion).toBe("mock-2026-hsk");
    expect(results[0]?.standardProductNames[0]?.sourceVersion).toBe("mock-standard-product-2026");
    expect(results[0]?.classificationSiblings[0]?.isSelected).toBe(true);
    expect(results[0]?.tariffPreviews.map((item) => item.label)).toContain("기본세율");
    expect(results[0]?.tariffPreviews.some((item) => item.label.includes("WTO"))).toBe(true);
    expect(results[0]?.tariffPreviews.some((item) => item.label.includes("한ㆍ중국 FTA"))).toBe(true);
    expect(results[0]?.importRequirements[0]?.relatedLaw).toBe("화장품법");
    expect(results[0]?.classificationCases).toHaveLength(3);
    expect(results[0]?.classificationCases[0]?.title).toContain("Skin care cosmetics");
    expect(results[0]?.hierarchyPath.map((node) => node.code)).toEqual(["33", "3304", "330499", "3304991000"]);
  });

  it("excludes records outside the basis date range", () => {
    const results = hsMasterRepositoryInternals.lookupWithMockData("3304999900", "2026-05-21");

    expect(results).toHaveLength(0);
  });

  it("supports hs6 lookup without final classification language", () => {
    const results = hsMasterRepositoryInternals.lookupWithMockData("3304.99", "2026-05-21");

    expect(results).toHaveLength(4);
    expect(results[0]?.hs6).toBe("330499");
    expect(results.map((result) => result.hskCode)).toContain("3304999000");
  });

  it("supports hs4 prefix lookup for overseas tariff workflows", () => {
    const results = hsMasterRepositoryInternals.lookupWithMockData("3304", "2026-05-21");

    expect(results).toHaveLength(5);
    expect(new Set(results.map((result) => result.hs6))).toEqual(new Set(["330410", "330499"]));
  });

  it("supports hs6 lookup for lip make-up preparations", () => {
    const results = hsMasterRepositoryInternals.lookupWithMockData("330410", "2026-05-21");

    expect(results).toHaveLength(1);
    expect(results[0]?.hskCode).toBe("3304101000");
    expect(results[0]?.koreanName).toContain("입술화장");
    expect(results[0]?.importRequirements[0]?.name).toContain("화장품");
    expect(results[0]?.classificationCases).toHaveLength(2);
    expect(results[0]?.hierarchyPath[0]?.label).toContain("화장품");
  });
});
