"use server";

import { filterImportTariffsForCountry, displayImportTariffLabel } from "@/features/hs/import-tariff-display";
import {
  hsBatchInputRowSchema,
  hsBatchLookupSchema,
  type HsBatchInputRow,
  type HsBatchLookupActionState,
  type HsBatchLookupStatus,
  type HsBatchResultRow
} from "@/features/hs-batch/schemas";
import { formatHsCode, normalizeHsCode } from "@/lib/hs-code";
import { lookupHsDirect, type HsDirectLookupResult } from "@/server/repositories/hs-master.repository";

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : undefined;
}

function parseRows(rowsJson: string) {
  const raw = JSON.parse(rowsJson);
  const parsed = hsBatchInputRowSchema.array().max(300, "한 번에 최대 300행까지 조회할 수 있습니다.").safeParse(raw);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "조회할 행 형식을 확인해 주세요.");
  }
  return parsed.data;
}

function numericPercent(rateText: string) {
  const match = rateText.match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function rateTypeGroup(rateType: string) {
  return rateType.trim().toUpperCase().replace(/\d+$/, "");
}

function isBasicTariff(rateType: string, label: string) {
  const group = rateTypeGroup(rateType);
  return group === "A" || group === "BASIC" || label.includes("기본");
}

function isFtaTariff(rateType: string) {
  const group = rateTypeGroup(rateType);
  return group.startsWith("F") && group.length > 1;
}

function formatTariff(label: string, rateText: string) {
  return `${label} ${rateText}`;
}

function chooseLowestTariff(tariffs: Array<{ rateText: string; rateType: string; label: string }>) {
  const rows = tariffs
    .map((tariff) => ({ tariff, rate: numericPercent(tariff.rateText) }))
    .filter((row): row is { tariff: { rateText: string; rateType: string; label: string }; rate: number } => row.rate !== null)
    .toSorted((a, b) => a.rate - b.rate);

  return rows[0]?.tariff ?? null;
}

function summarizeRequirements(result: HsDirectLookupResult) {
  const unique = Array.from(
    new Map(
      result.importRequirements.map((requirement) => [
        [requirement.type, requirement.name, requirement.relatedLaw, requirement.agency ?? ""].join("|"),
        requirement
      ])
    ).values()
  );

  if (!unique.length) {
    return "세관장확인 수입요건 조회 결과 없음";
  }

  return unique
    .slice(0, 8)
    .map((requirement) => {
      const agency = requirement.agency ? ` / ${requirement.agency}` : "";
      return `${requirement.relatedLaw} - ${requirement.name}${agency}`;
    })
    .join("\n");
}

function summarizeOriginMarking(result: HsDirectLookupResult) {
  if (!result.originMarking) return "-";
  if (!result.originMarking.isTarget) return "대상 아님";
  const method = result.originMarking.method?.methodSummary ? ` / ${result.originMarking.method.methodSummary}` : "";
  return `대상${method}`;
}

function buildSuccessRow({
  row,
  result,
  destinationCountry,
  basisDate
}: {
  row: HsBatchInputRow;
  result: HsDirectLookupResult;
  destinationCountry: string;
  basisDate: string;
}): HsBatchResultRow {
  const tariffs = filterImportTariffsForCountry(result.tariffPreviews, destinationCountry).map((tariff) => ({
    ...tariff,
    displayLabel: displayImportTariffLabel(tariff, destinationCountry)
  }));
  const basic = tariffs.find((tariff) => isBasicTariff(tariff.rateType, tariff.displayLabel));
  const ftaRows = tariffs.filter((tariff) => isFtaTariff(tariff.rateType));
  const lowestFta = chooseLowestTariff(ftaRows.map((tariff) => ({ ...tariff, label: tariff.displayLabel })));
  const lowest = chooseLowestTariff(tariffs.map((tariff) => ({ ...tariff, label: tariff.displayLabel })));

  return {
    rowNumber: row.rowNumber,
    inputHskCode: row.hskCode,
    normalizedHskCode: result.hskCode,
    productName: row.productName ?? "",
    matchedHskCode: formatHsCode(result.hskCode),
    matchedName: result.koreanName,
    countryCode: destinationCountry,
    basicTariff: basic ? formatTariff(basic.displayLabel, basic.rateText) : "-",
    ftaTariff: lowestFta ? formatTariff(displayImportTariffLabel(lowestFta, destinationCountry), lowestFta.rateText) : "-",
    lowestTariff: lowest ? formatTariff(displayImportTariffLabel(lowest, destinationCountry), lowest.rateText) : "-",
    internalTax: "부가세 10%",
    importRequirements: summarizeRequirements(result),
    originMarking: summarizeOriginMarking(result),
    status: "success",
    message: `조회기준일 ${basisDate} 기준 예비 조회`
  };
}

function buildErrorRow(row: HsBatchInputRow, message: string, status: HsBatchLookupStatus = "error"): HsBatchResultRow {
  const normalized = normalizeHsCode(row.hskCode);
  return {
    rowNumber: row.rowNumber,
    inputHskCode: row.hskCode,
    normalizedHskCode: normalized,
    productName: row.productName ?? "",
    matchedHskCode: normalized ? formatHsCode(normalized) : "",
    matchedName: "",
    countryCode: "",
    basicTariff: "-",
    ftaTariff: "-",
    lowestTariff: "-",
    internalTax: "-",
    importRequirements: "-",
    originMarking: "-",
    status,
    message
  };
}

async function lookupRow({
  row,
  destinationCountry,
  basisDate,
  cache
}: {
  row: HsBatchInputRow;
  destinationCountry: string;
  basisDate: string;
  cache: Map<string, Promise<HsDirectLookupResult[]>>;
}) {
  const normalized = normalizeHsCode(row.hskCode);
  if (normalized.length !== 10) {
    return buildErrorRow(row, "HS CODE 10자리를 입력해 주세요. 4자리/6자리/8자리는 일괄조회에서 제외했습니다.", "warning");
  }

  if (!cache.has(normalized)) {
    cache.set(normalized, lookupHsDirect(normalized, basisDate));
  }

  const lookupResults = await cache.get(normalized);
  const result = lookupResults?.find((item) => item.hskCode === normalized) ?? lookupResults?.[0] ?? null;
  if (!result) {
    return buildErrorRow(row, "조회기준일에 표시할 수 있는 HS CODE 데이터가 없습니다.");
  }

  return buildSuccessRow({ row, result, destinationCountry, basisDate });
}

export async function lookupHsBatchAction(
  _previousState: HsBatchLookupActionState,
  formData: FormData
): Promise<HsBatchLookupActionState> {
  const parsed = hsBatchLookupSchema.safeParse({
    basisDate: stringValue(formData, "basisDate"),
    destinationCountry: stringValue(formData, "destinationCountry") || "ALL",
    rowsJson: stringValue(formData, "rowsJson")
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "일괄조회 입력값을 확인해 주세요."
    };
  }

  try {
    const rows = parseRows(parsed.data.rowsJson);
    const cache = new Map<string, Promise<HsDirectLookupResult[]>>();
    const results = await Promise.all(
      rows.map((row) =>
        lookupRow({
          row,
          destinationCountry: parsed.data.destinationCountry,
          basisDate: parsed.data.basisDate,
          cache
        }).catch((error) => buildErrorRow(row, error instanceof Error ? error.message : "조회 중 오류가 발생했습니다."))
      )
    );

    const summary = {
      total: results.length,
      success: results.filter((row) => row.status === "success").length,
      warning: results.filter((row) => row.status === "warning").length,
      error: results.filter((row) => row.status === "error").length
    };

    return {
      status: "success",
      message: `총 ${summary.total}행 중 ${summary.success}행을 조회했습니다. 입력 행 순서와 중복 HS CODE는 그대로 유지했습니다.`,
      results,
      summary
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "일괄조회 처리 중 오류가 발생했습니다."
    };
  }
}
