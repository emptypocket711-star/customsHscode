import { describe, expect, it } from "vitest";
import { getMockSourceVersionInventory } from "@/server/rules/source-inventory.service";

describe("source inventory service", () => {
  it("summarizes staged source inventory", () => {
    const inventory = getMockSourceVersionInventory();

    expect(inventory.summary.stagedCount).toBeGreaterThan(0);
    expect(inventory.summary.totalRows).toBeGreaterThan(1_000_000);
    expect(inventory.summary.groupSummaries.map((group) => group.groupKey)).toContain("internalTax");
    expect(inventory.summary.groupSummaries.find((group) => group.groupKey === "internalTax")?.publishedCount).toBeGreaterThan(0);
    expect(inventory.domesticLookupCoverage.withTariffRates).toBeGreaterThan(10_000);
    expect(inventory.domesticLookupCoverage.missingTariffRates).toBe(1);
  });

  it("adds diagnostics for usable, unpublished, and empty sources", () => {
    const inventory = getMockSourceVersionInventory();
    const internalTax = inventory.items.find((item) => item.targetTable === "internal_tax_law_rules");
    const emptyApi = inventory.items.find((item) => item.sourceVersion === "myc-openapi-api030-v1.0");

    expect(internalTax?.diagnostics).toEqual([
      expect.objectContaining({ severity: "ok", label: "사용 가능" })
    ]);
    expect(emptyApi?.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ severity: "danger", label: "행 없음" }),
        expect.objectContaining({ severity: "danger", label: "수집시각 없음" }),
        expect.objectContaining({ severity: "warning", label: "게시 전" })
      ])
    );
    expect(inventory.summary.diagnosticCounts.ok).toBeGreaterThan(0);
    expect(inventory.summary.diagnosticCounts.warning).toBeGreaterThan(0);
    expect(inventory.summary.diagnosticCounts.danger).toBeGreaterThan(0);
  });
});
