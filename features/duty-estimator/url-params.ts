import type { DutyEstimateTaxBaseType } from "@/features/duty-estimator/calculation";

export type InternalTaxEstimateRow = {
  name: string;
  lawName?: string | null;
  rateText: string;
  baseType?: DutyEstimateTaxBaseType;
};

function tariffNumericValue(rateText: string) {
  if (/^(무세|free)$/i.test(rateText.trim())) return 0;

  const percent = rateText.match(/-?\d+(?:\.\d+)?(?=\s*%)/);
  if (percent) return Number(percent[0]);

  const numeric = rateText.match(/-?\d+(?:\.\d+)?/);
  return numeric ? Number(numeric[0]) : Number.POSITIVE_INFINITY;
}

export function percentRateValue(rateText?: string | null) {
  if (!rateText) return null;
  const parsed = tariffNumericValue(rateText);
  return Number.isFinite(parsed) ? parsed : null;
}

function isVatInternalTax(row: InternalTaxEstimateRow) {
  return [row.name, row.lawName].some((value) => value?.includes("부가가치세"));
}

function inferInternalTaxBaseType(row: InternalTaxEstimateRow): DutyEstimateTaxBaseType {
  if (row.baseType) return row.baseType;
  if (row.name.includes("교육세") || row.name.includes("농어촌특별세")) return "previous_internal_tax_total";
  return "taxable_value";
}

export function internalTaxEstimatorRates(rows: InternalTaxEstimateRow[]) {
  const otherInternalTaxItems = rows
    .filter((row) => !isVatInternalTax(row))
    .map((row) => ({
      name: row.name,
      rate: percentRateValue(row.rateText),
      baseType: inferInternalTaxBaseType(row)
    }))
    .filter((item): item is { name: string; rate: number; baseType: DutyEstimateTaxBaseType } => item.rate !== null && item.rate > 0);
  const vatRow = rows.find(isVatInternalTax);
  const vatRate = percentRateValue(vatRow?.rateText);
  const otherInternalTaxRate = otherInternalTaxItems.reduce((sum, item) => sum + item.rate, 0);

  return {
    otherInternalTaxItems,
    otherInternalTaxRate,
    vatRate: vatRate ?? 10
  };
}

export function buildDutyEstimatorHref({
  hskCode,
  basisDate,
  dutyRate,
  preferentialRate,
  internalTaxRows
}: {
  hskCode: string;
  basisDate: string;
  dutyRate?: string;
  preferentialRate?: string;
  internalTaxRows?: InternalTaxEstimateRow[];
}) {
  const params = new URLSearchParams({ hskCode, basisDate });
  const parsedRate = dutyRate ? percentRateValue(dutyRate) : null;
  const parsedPreferentialRate = preferentialRate ? percentRateValue(preferentialRate) : null;
  const internalTaxRates = internalTaxEstimatorRates(internalTaxRows ?? []);

  if (parsedRate !== null) {
    params.set("dutyRate", String(parsedRate));
  }

  if (parsedPreferentialRate !== null) {
    params.set("preferentialRate", String(parsedPreferentialRate));
  }

  if (internalTaxRates.otherInternalTaxRate > 0) {
    params.set("otherInternalTaxRate", String(internalTaxRates.otherInternalTaxRate));
    params.set("internalTaxItems", JSON.stringify(internalTaxRates.otherInternalTaxItems));
  }

  params.set("vatRate", String(internalTaxRates.vatRate));

  return `/duty-estimator?${params.toString()}`;
}
