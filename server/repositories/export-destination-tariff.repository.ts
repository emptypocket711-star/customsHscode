import type { SupabaseClient } from "@supabase/supabase-js";
import { countryCodeAliases, destinationCountryOptions } from "@/features/export-diagnosis/country-options";

export type ExportDestinationTariffItem = {
  countryCode: string;
  tariffYear: number;
  destinationHsCode: string;
  destinationCustomsCode?: string;
  destinationCustomsName?: string | null;
  destinationTariffCode?: string;
  destinationCodeRole?: string;
  matchBasis: "exact" | "prefix" | "hs6" | "hs4";
  matchScore: number;
  englishName: string | null;
  koreanName: string | null;
  unit: string | null;
  baseRateText: string | null;
  agreementRates: Record<string, string>;
  sourceName: string;
  sourceVersion: string;
  basisDate: string;
  staffReviewStatus: "확인 필요";
};

type ExportDestinationTariffRow = {
  country_code: string;
  tariff_year: number;
  destination_hs_code: string;
  english_name: string | null;
  korean_name: string | null;
  unit: string | null;
  base_rate_text: string | null;
  agreement_rates: unknown;
  source_name: string;
  source_version: string;
};

export type ExportDestinationCustomsCodeItem = {
  countryCode: string;
  customsCode: string;
  tariffCode: string;
  koreanName: string | null;
  englishName: string | null;
  codeRole: string;
  notes: string | null;
  sourceName: string;
  sourceVersion: string;
};

type ExportDestinationCustomsCodeRow = {
  country_code: string;
  customs_code: string;
  tariff_code: string;
  korean_name: string | null;
  english_name: string | null;
  code_role: string;
  notes: string | null;
  source_name: string;
  source_version: string;
};

export function normalizeDestinationHsCode(value: string) {
  return value.replace(/[^0-9]/g, "");
}

export function destinationHsPrefixes(hskCode: string) {
  const normalized = normalizeDestinationHsCode(hskCode);

  if (normalized.length <= 4) {
    return normalized.length >= 4 ? [normalized] : [];
  }

  if (normalized.length <= 6) {
    return [normalized];
  }

  return [normalized.slice(0, 6)];
}

function destinationMatchBasis(rowCode: string, inputCode?: string): ExportDestinationTariffItem["matchBasis"] {
  const normalizedRow = normalizeDestinationHsCode(rowCode);
  const normalizedInput = normalizeDestinationHsCode(inputCode ?? "");

  if (normalizedInput && normalizedRow === normalizedInput) return "exact";
  if (normalizedInput && normalizedInput.length <= 6 && normalizedRow.startsWith(normalizedInput)) return "prefix";
  if (normalizedInput && normalizedRow.startsWith(normalizedInput.slice(0, 6))) return "hs6";
  if (normalizedInput && normalizedRow.startsWith(normalizedInput.slice(0, 4))) return "hs4";

  return "prefix";
}

function hasTariffRate(row: Pick<ExportDestinationTariffItem, "baseRateText" | "agreementRates">) {
  return Boolean(row.baseRateText?.trim() || Object.keys(row.agreementRates).length);
}

export function destinationTariffMatchScore(row: Pick<ExportDestinationTariffItem, "destinationHsCode" | "matchBasis" | "baseRateText" | "agreementRates">) {
  const basisScore = {
    exact: 100,
    prefix: 90,
    hs6: 70,
    hs4: 40
  }[row.matchBasis];
  const lengthScore = Math.min(normalizeDestinationHsCode(row.destinationHsCode).length, 10);
  const rateScore = hasTariffRate(row) ? 5 : 0;

  return basisScore + lengthScore + rateScore;
}

function destinationSourcePriority(row: ExportDestinationTariffItem) {
  if (row.sourceVersion.startsWith("hmrc-trade-tariff-api-")) return 30;
  if (row.sourceVersion.startsWith("usitc-hts-")) return 30;
  if (row.sourceVersion.startsWith("japan-customs-tariff-")) return 30;
  if (row.sourceVersion === "china-import-export-tariff-2026") return 30;
  if (row.sourceVersion.startsWith("customs-country-tariff-")) return 10;
  return 20;
}

export function sortExportDestinationTariffs(rows: ExportDestinationTariffItem[]) {
  return rows.toSorted((a, b) =>
    b.matchScore - a.matchScore
    || Number(hasTariffRate(b)) - Number(hasTariffRate(a))
    || normalizeDestinationHsCode(b.destinationHsCode).length - normalizeDestinationHsCode(a.destinationHsCode).length
    || normalizeDestinationHsCode(a.destinationHsCode).localeCompare(normalizeDestinationHsCode(b.destinationHsCode))
    || destinationSourcePriority(b) - destinationSourcePriority(a)
    || b.tariffYear - a.tariffYear
  );
}

function asAgreementRates(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === "string")
  );
}

export function mapExportDestinationTariffRow(row: ExportDestinationTariffRow, basisDate: string, inputCode?: string): ExportDestinationTariffItem {
  const mapped = {
    countryCode: row.country_code,
    tariffYear: row.tariff_year,
    destinationHsCode: row.destination_hs_code,
    matchBasis: destinationMatchBasis(row.destination_hs_code, inputCode),
    englishName: row.english_name,
    koreanName: row.korean_name,
    unit: row.unit,
    baseRateText: row.base_rate_text,
    agreementRates: asAgreementRates(row.agreement_rates),
    sourceName: row.source_name,
    sourceVersion: row.source_version,
    basisDate,
    staffReviewStatus: "확인 필요" as const
  };

  return {
    ...mapped,
    matchScore: destinationTariffMatchScore(mapped)
  };
}

export function mapExportDestinationCustomsCodeRow(row: ExportDestinationCustomsCodeRow): ExportDestinationCustomsCodeItem {
  return {
    countryCode: row.country_code,
    customsCode: row.customs_code,
    tariffCode: row.tariff_code,
    koreanName: row.korean_name,
    englishName: row.english_name,
    codeRole: row.code_role,
    notes: row.notes,
    sourceName: row.source_name,
    sourceVersion: row.source_version
  };
}

function customsCodePriority(row: ExportDestinationCustomsCodeItem) {
  if (row.sourceVersion.includes("gacc-2026-15")) return 0;
  if (row.sourceVersion.includes("gacc-2025-260")) return 1;
  if (row.koreanName && !/[一-龥]/.test(row.koreanName)) return 2;
  return 3;
}

export function dedupeExportDestinationCustomsCodes(rows: ExportDestinationCustomsCodeItem[]) {
  const bestByCode = new Map<string, ExportDestinationCustomsCodeItem>();

  for (const row of rows) {
    const key = `${row.countryCode}|${normalizeDestinationHsCode(row.customsCode)}`;
    const previous = bestByCode.get(key);
    if (!previous || customsCodePriority(row) < customsCodePriority(previous)) {
      bestByCode.set(key, row);
    }
  }

  return Array.from(bestByCode.values()).sort((a, b) => {
    const codeDiff = normalizeDestinationHsCode(a.customsCode).localeCompare(normalizeDestinationHsCode(b.customsCode));
    if (codeDiff !== 0) return codeDiff;
    return customsCodePriority(a) - customsCodePriority(b);
  });
}

function attachCustomsCode(
  tariff: ExportDestinationTariffItem,
  customsCode: ExportDestinationCustomsCodeItem,
  inputCode: string
): ExportDestinationTariffItem {
  return {
    ...tariff,
    destinationHsCode: customsCode.customsCode,
    destinationCustomsCode: customsCode.customsCode,
    destinationCustomsName: customsCode.koreanName ?? customsCode.englishName,
    destinationTariffCode: customsCode.tariffCode,
    destinationCodeRole: customsCode.codeRole,
    koreanName: customsCode.koreanName ?? tariff.koreanName,
    englishName: customsCode.englishName ?? tariff.englishName,
    matchBasis: destinationMatchBasis(customsCode.customsCode, inputCode),
    matchScore: destinationTariffMatchScore({
      ...tariff,
      destinationHsCode: customsCode.customsCode,
      matchBasis: destinationMatchBasis(customsCode.customsCode, inputCode)
    })
  };
}

export async function findExportDestinationTariffs(
  supabase: SupabaseClient,
  input: {
    hskCode: string;
    destinationCountry: string;
    basisDate: string;
    limit?: number;
  }
): Promise<ExportDestinationTariffItem[]> {
  const normalized = normalizeDestinationHsCode(input.hskCode);
  const hs6 = normalized.slice(0, 6);
  const shouldSearchAllCountries = input.destinationCountry.trim().toUpperCase() === "ALL";
  const countries = countryCodeAliases(input.destinationCountry);

  if (normalized.length < 4 || (!shouldSearchAllCountries && countries.length === 0)) {
    return [];
  }

  if (shouldSearchAllCountries) {
    const targetCountries = destinationCountryOptions
      .filter((country) => country.code !== "ALL")
      .flatMap((country) => countryCodeAliases(country.code));
    const uniqueCountries = Array.from(new Set(targetCountries));
    const resultLimit = input.limit ?? 80;
    const queryLimit = Math.min(Math.max(resultLimit * 4, uniqueCountries.length * 3), 500);
    let query = supabase
      .from("export_destination_tariff_rates")
      .select("country_code, tariff_year, destination_hs_code, english_name, korean_name, unit, base_rate_text, agreement_rates, source_name, source_version")
      .in("country_code", uniqueCountries)
      .lte("effective_from", input.basisDate)
      .or(`effective_to.is.null,effective_to.gte.${input.basisDate}`)
      .eq("status", "published")
      .order("destination_hs_code", { ascending: true })
      .limit(queryLimit);

    if (normalized.length <= 6) {
      query = query.like("destination_hs_code", `${normalized}%`);
    } else {
      query = query.like("destination_hs_code", `${hs6}%`);
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);

    return sortExportDestinationTariffs(
      ((data ?? []) as ExportDestinationTariffRow[]).map((row) => mapExportDestinationTariffRow(row, input.basisDate, input.hskCode))
    ).slice(0, resultLimit);
  }

  let query = supabase
    .from("export_destination_tariff_rates")
    .select("country_code, tariff_year, destination_hs_code, english_name, korean_name, unit, base_rate_text, agreement_rates, source_name, source_version")
    .lte("effective_from", input.basisDate)
    .or(`effective_to.is.null,effective_to.gte.${input.basisDate}`)
    .eq("status", "published")
    .order("destination_hs_code", { ascending: false })
    .limit(input.limit ?? 5);

  if (!shouldSearchAllCountries) {
    query = query.in("country_code", countries);
  }

  if (normalized.length <= 6) {
    query = query.like("destination_hs_code", `${normalized}%`);
  } else {
    query = query.like("destination_hs_code", `${hs6}%`);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);

  return sortExportDestinationTariffs(
    ((data ?? []) as ExportDestinationTariffRow[]).map((row) => mapExportDestinationTariffRow(row, input.basisDate, input.hskCode))
  );
}

export async function findExportDestinationTariffsByDestinationCode(
  supabase: SupabaseClient,
  input: {
    destinationHsCode: string;
    destinationCountry: string;
    basisDate: string;
    limit?: number;
  }
) {
  const normalized = normalizeDestinationHsCode(input.destinationHsCode);
  const countries = countryCodeAliases(input.destinationCountry);

  if (normalized.length < 4 || countries.length === 0) {
    return [];
  }

  if (normalized.length > 8) {
    const customsCodes = await findExportDestinationCustomsCodes(supabase, {
      countryCode: input.destinationCountry,
      queryCode: normalized,
      basisDate: input.basisDate,
      limit: input.limit ?? 50
    });
    if (!customsCodes.length) return [];

    const tariffCodes = Array.from(new Set(customsCodes.map((row) => row.tariffCode)));
    const { data, error } = await supabase
      .from("export_destination_tariff_rates")
      .select("country_code, tariff_year, destination_hs_code, english_name, korean_name, unit, base_rate_text, agreement_rates, source_name, source_version")
      .in("country_code", countries)
      .in("destination_hs_code", tariffCodes)
      .lte("effective_from", input.basisDate)
      .or(`effective_to.is.null,effective_to.gte.${input.basisDate}`)
      .eq("status", "published")
      .order("tariff_year", { ascending: false })
      .limit(input.limit ?? 50);

    if (error) throw new Error(error.message);

    const tariffByCode = new Map(
      ((data ?? []) as ExportDestinationTariffRow[]).map((row) => [
        normalizeDestinationHsCode(row.destination_hs_code),
        mapExportDestinationTariffRow(row, input.basisDate, input.destinationHsCode)
      ])
    );

    return sortExportDestinationTariffs(dedupeExportDestinationCustomsCodes(customsCodes)
      .map((customsCode) => {
        const tariff = tariffByCode.get(normalizeDestinationHsCode(customsCode.tariffCode));
        return tariff ? attachCustomsCode(tariff, customsCode, input.destinationHsCode) : null;
      })
      .filter((row): row is ExportDestinationTariffItem => row !== null));
  }

  const { data, error } = await supabase
    .from("export_destination_tariff_rates")
    .select("country_code, tariff_year, destination_hs_code, english_name, korean_name, unit, base_rate_text, agreement_rates, source_name, source_version")
    .in("country_code", countries)
    .like("destination_hs_code", `${normalized}%`)
    .lte("effective_from", input.basisDate)
    .or(`effective_to.is.null,effective_to.gte.${input.basisDate}`)
    .eq("status", "published")
    .order("destination_hs_code", { ascending: true })
    .limit(input.limit ?? 50);

  if (error) throw new Error(error.message);

  return sortExportDestinationTariffs(
    ((data ?? []) as ExportDestinationTariffRow[]).map((row) => mapExportDestinationTariffRow(row, input.basisDate, input.destinationHsCode))
  );
}

export async function findExportDestinationCustomsCodes(
  supabase: SupabaseClient,
  input: {
    countryCode: string;
    queryCode: string;
    basisDate: string;
    limit?: number;
  }
) {
  const normalized = normalizeDestinationHsCode(input.queryCode);
  const countries = countryCodeAliases(input.countryCode);

  if (normalized.length < 4 || countries.length === 0) {
    return [];
  }

  let query = supabase
    .from("export_destination_customs_codes")
    .select("country_code, customs_code, tariff_code, korean_name, english_name, code_role, notes, source_name, source_version")
    .in("country_code", countries)
    .lte("effective_from", input.basisDate)
    .or(`effective_to.is.null,effective_to.gte.${input.basisDate}`)
    .eq("status", "published")
    .order("customs_code", { ascending: true })
    .limit(input.limit ?? 30);

  if (normalized.length >= 8) {
    query = query.like("customs_code", `${normalized}%`);
  } else {
    query = query.or(`customs_code.like.${normalized}%,tariff_code.like.${normalized}%`);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);

  return dedupeExportDestinationCustomsCodes(
    ((data ?? []) as ExportDestinationCustomsCodeRow[]).map(mapExportDestinationCustomsCodeRow)
  );
}
