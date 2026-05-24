export type DutyEstimateInput = {
  goodsAmount: number;
  exchangeRate: number;
  freightKrw: number;
  insuranceKrw: number;
  dutyRate: number;
  preferentialRate?: number | null;
  usePreferentialRate: boolean;
  otherInternalTaxRate: number;
  otherInternalTaxItems?: DutyEstimateInternalTaxItem[];
  vatRate: number;
};

export type DutyEstimateTaxBaseType =
  | "taxable_value"
  | "customs_duty"
  | "taxable_value_plus_customs_duty"
  | "previous_internal_tax_total"
  | "taxable_value_plus_customs_duty_plus_previous_internal_tax";

export type DutyEstimateInternalTaxItem = {
  name: string;
  rate: number;
  baseType?: DutyEstimateTaxBaseType;
};

export type DutyEstimateInternalTaxResult = DutyEstimateInternalTaxItem & {
  baseType: DutyEstimateTaxBaseType;
  baseAmountKrw: number;
  amountKrw: number;
};

export type DutyEstimateResult = {
  taxableValueKrw: number;
  appliedDutyRate: number;
  customsDutyKrw: number;
  otherInternalTaxItems: DutyEstimateInternalTaxResult[];
  otherInternalTaxKrw: number;
  vatBaseKrw: number;
  vatKrw: number;
  totalTaxKrw: number;
};

function finiteNumber(value: number) {
  return Number.isFinite(value) ? value : 0;
}

function nonNegative(value: number) {
  return Math.max(0, finiteNumber(value));
}

function money(value: number) {
  return Math.round(nonNegative(value));
}

function internalTaxBaseAmount(input: {
  baseType: DutyEstimateTaxBaseType;
  taxableValueKrw: number;
  customsDutyKrw: number;
  previousInternalTaxTotalKrw: number;
}) {
  if (input.baseType === "customs_duty") return input.customsDutyKrw;
  if (input.baseType === "taxable_value_plus_customs_duty") return input.taxableValueKrw + input.customsDutyKrw;
  if (input.baseType === "previous_internal_tax_total") return input.previousInternalTaxTotalKrw;
  if (input.baseType === "taxable_value_plus_customs_duty_plus_previous_internal_tax") {
    return input.taxableValueKrw + input.customsDutyKrw + input.previousInternalTaxTotalKrw;
  }
  return input.taxableValueKrw;
}

export function calculateDutyEstimate(input: DutyEstimateInput): DutyEstimateResult {
  const goodsValueKrw = nonNegative(input.goodsAmount) * nonNegative(input.exchangeRate);
  const taxableValueKrw = money(goodsValueKrw + nonNegative(input.freightKrw) + nonNegative(input.insuranceKrw));
  const appliedDutyRate = input.usePreferentialRate && input.preferentialRate !== null && input.preferentialRate !== undefined
    ? nonNegative(input.preferentialRate)
    : nonNegative(input.dutyRate);
  const customsDutyKrw = money(taxableValueKrw * appliedDutyRate / 100);
  let previousInternalTaxTotalKrw = 0;
  const otherInternalTaxItems = (input.otherInternalTaxItems ?? [])
    .filter((item) => item.name.trim() && nonNegative(item.rate) > 0)
    .map((item) => {
      const baseType = item.baseType ?? "taxable_value";
      const baseAmountKrw = internalTaxBaseAmount({
        baseType,
        taxableValueKrw,
        customsDutyKrw,
        previousInternalTaxTotalKrw
      });
      const amountKrw = money(baseAmountKrw * nonNegative(item.rate) / 100);
      previousInternalTaxTotalKrw += amountKrw;

      return {
        name: item.name.trim(),
        rate: nonNegative(item.rate),
        baseType,
        baseAmountKrw,
        amountKrw
      };
    });
  const otherInternalTaxKrw = otherInternalTaxItems.length
    ? otherInternalTaxItems.reduce((sum, item) => sum + item.amountKrw, 0)
    : money(taxableValueKrw * nonNegative(input.otherInternalTaxRate) / 100);
  const vatBaseKrw = money(taxableValueKrw + customsDutyKrw + otherInternalTaxKrw);
  const vatKrw = money(vatBaseKrw * nonNegative(input.vatRate) / 100);

  return {
    taxableValueKrw,
    appliedDutyRate,
    customsDutyKrw,
    otherInternalTaxItems,
    otherInternalTaxKrw,
    vatBaseKrw,
    vatKrw,
    totalTaxKrw: money(customsDutyKrw + otherInternalTaxKrw + vatKrw)
  };
}

export function parseNumericInput(value: string) {
  const normalized = value.replace(/,/g, "").trim();
  if (!normalized) return 0;
  return Number(normalized) || 0;
}
