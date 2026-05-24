import { describe, expect, it } from "vitest";
import { buildDutyEstimatorHref, internalTaxEstimatorRates, percentRateValue } from "@/features/duty-estimator/url-params";

describe("percentRateValue", () => {
  it("extracts percentage rates and duty-free text", () => {
    expect(percentRateValue("6.5%")).toBe(6.5);
    expect(percentRateValue("무세")).toBe(0);
    expect(percentRateValue("종량/종가 혼합")).toBeNull();
  });
});

describe("internalTaxEstimatorRates", () => {
  it("uses VAT separately and sums non-VAT percentage taxes", () => {
    expect(internalTaxEstimatorRates([
      { name: "부가가치세", lawName: "부가가치세법", rateText: "10%" },
      { name: "개별소비세", lawName: "개별소비세법", rateText: "7%" },
      { name: "교육세", lawName: "교육세법", rateText: "3%" },
      { name: "주세", lawName: "주세법", rateText: "종량/종가 혼합" }
    ])).toEqual({
      otherInternalTaxItems: [
        { name: "개별소비세", rate: 7, baseType: "taxable_value" },
        { name: "교육세", rate: 3, baseType: "previous_internal_tax_total" }
      ],
      otherInternalTaxRate: 10,
      vatRate: 10
    });
  });
});

describe("buildDutyEstimatorHref", () => {
  it("builds an estimator URL from HS lookup rates", () => {
    const href = buildDutyEstimatorHref({
      hskCode: "3304.10-1000",
      basisDate: "2026-05-24",
      dutyRate: "8%",
      preferentialRate: "0%",
      internalTaxRows: [
        { name: "부가가치세", lawName: "부가가치세법", rateText: "10%" },
        { name: "개별소비세", lawName: "개별소비세법", rateText: "7%" }
      ]
    });

    expect(decodeURIComponent(href)).toBe('/duty-estimator?hskCode=3304.10-1000&basisDate=2026-05-24&dutyRate=8&preferentialRate=0&otherInternalTaxRate=7&internalTaxItems=[{"name":"개별소비세","rate":7,"baseType":"taxable_value"}]&vatRate=10');
  });
});
