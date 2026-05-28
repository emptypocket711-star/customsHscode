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
      countryCode: "cn",
      preferentialRateLabel: "한-중 FTA 관세율",
      internalTaxRows: [
        { name: "부가가치세", lawName: "부가가치세법", rateText: "10%" },
        { name: "개별소비세", lawName: "개별소비세법", rateText: "7%" }
      ]
    });

    const url = new URL(href, "https://example.test");
    expect(url.pathname).toBe("/duty-estimator");
    expect(url.searchParams.get("hskCode")).toBe("3304.10-1000");
    expect(url.searchParams.get("basisDate")).toBe("2026-05-24");
    expect(url.searchParams.get("dutyRate")).toBe("8");
    expect(url.searchParams.get("preferentialRate")).toBe("0");
    expect(url.searchParams.get("countryCode")).toBe("CN");
    expect(url.searchParams.get("preferentialRateLabel")).toBe("한-중 FTA 관세율");
    expect(url.searchParams.get("otherInternalTaxRate")).toBe("7");
    expect(url.searchParams.get("internalTaxItems")).toBe('[{"name":"개별소비세","rate":7,"baseType":"taxable_value"}]');
    expect(url.searchParams.get("vatRate")).toBe("10");
  });
});
