import { describe, expect, it } from "vitest";
import { calculateDutyEstimate, parseNumericInput } from "@/features/duty-estimator/calculation";

describe("calculateDutyEstimate", () => {
  it("calculates customs duty, VAT base, VAT, and total tax", () => {
    const result = calculateDutyEstimate({
      goodsAmount: 1000,
      exchangeRate: 1350,
      freightKrw: 150000,
      insuranceKrw: 10000,
      dutyRate: 8,
      preferentialRate: null,
      usePreferentialRate: false,
      otherInternalTaxRate: 0,
      otherInternalTaxItems: [],
      vatRate: 10
    });

    expect(result.taxableValueKrw).toBe(1510000);
    expect(result.appliedDutyRate).toBe(8);
    expect(result.customsDutyKrw).toBe(120800);
    expect(result.vatBaseKrw).toBe(1630800);
    expect(result.vatKrw).toBe(163080);
    expect(result.totalTaxKrw).toBe(283880);
  });

  it("uses preferential duty rate when selected", () => {
    const result = calculateDutyEstimate({
      goodsAmount: 1000,
      exchangeRate: 1000,
      freightKrw: 0,
      insuranceKrw: 0,
      dutyRate: 8,
      preferentialRate: 0,
      usePreferentialRate: true,
      otherInternalTaxRate: 5,
      otherInternalTaxItems: [],
      vatRate: 10
    });

    expect(result.appliedDutyRate).toBe(0);
    expect(result.customsDutyKrw).toBe(0);
    expect(result.otherInternalTaxKrw).toBe(50000);
    expect(result.vatBaseKrw).toBe(1050000);
  });

  it("breaks down percentage-based internal tax items", () => {
    const result = calculateDutyEstimate({
      goodsAmount: 1000,
      exchangeRate: 1000,
      freightKrw: 0,
      insuranceKrw: 0,
      dutyRate: 8,
      preferentialRate: null,
      usePreferentialRate: false,
      otherInternalTaxRate: 10,
      otherInternalTaxItems: [
        { name: "개별소비세", rate: 7 },
        { name: "교육세", rate: 3, baseType: "previous_internal_tax_total" }
      ],
      vatRate: 10
    });

    expect(result.otherInternalTaxItems).toEqual([
      { name: "개별소비세", rate: 7, baseType: "taxable_value", baseAmountKrw: 1000000, amountKrw: 70000 },
      { name: "교육세", rate: 3, baseType: "previous_internal_tax_total", baseAmountKrw: 70000, amountKrw: 2100 }
    ]);
    expect(result.otherInternalTaxKrw).toBe(72100);
    expect(result.vatBaseKrw).toBe(1152100);
  });

  it("supports internal tax items based on customs duty", () => {
    const result = calculateDutyEstimate({
      goodsAmount: 1000,
      exchangeRate: 1000,
      freightKrw: 0,
      insuranceKrw: 0,
      dutyRate: 8,
      preferentialRate: null,
      usePreferentialRate: false,
      otherInternalTaxRate: 0,
      otherInternalTaxItems: [
        { name: "농어촌특별세", rate: 20, baseType: "customs_duty" }
      ],
      vatRate: 10
    });

    expect(result.customsDutyKrw).toBe(80000);
    expect(result.otherInternalTaxItems[0]).toEqual({
      name: "농어촌특별세",
      rate: 20,
      baseType: "customs_duty",
      baseAmountKrw: 80000,
      amountKrw: 16000
    });
  });
});

describe("parseNumericInput", () => {
  it("parses comma formatted numeric input", () => {
    expect(parseNumericInput("1,234.5")).toBe(1234.5);
    expect(parseNumericInput("")).toBe(0);
  });
});
