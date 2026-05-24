import type { SupabaseClient } from "@supabase/supabase-js";
import { countryCodeAliases } from "@/features/export-diagnosis/country-options";
import { normalizeDestinationHsCode } from "@/server/repositories/export-destination-tariff.repository";

export type ExportDestinationImportRequirementItem = {
  countryCode: string;
  destinationHsCode: string;
  requirementType: string;
  requirementName: string;
  agency: string | null;
  legalBasis: string | null;
  procedureSummary: string | null;
  requiredDocuments: string[];
  notes: string | null;
  sourceName: string;
  sourceUrl: string;
  sourceVersion: string;
  basisDate: string;
};

export type ExportDestinationInternalTaxItem = {
  countryCode: string;
  destinationHsCode: string;
  taxType: string;
  taxName: string;
  rateText: string | null;
  basis: string | null;
  notes: string | null;
  sourceName: string;
  sourceUrl: string;
  sourceVersion: string;
  basisDate: string;
};

export type ExportDestinationAdditionalTariffItem = {
  countryCode: string;
  destinationHsCode: string;
  additionalTariffCode: string;
  tariffProgram: string;
  rateText: string | null;
  originCountryCode: string | null;
  conditionSummary: string | null;
  legalBasis: string | null;
  notes: string | null;
  sourceName: string;
  sourceUrl: string;
  sourceVersion: string;
  basisDate: string;
};

export type ExportDestinationTradeRemedyCaseItem = {
  countryCode: string;
  destinationHsCode: string;
  remedyType: string;
  caseNumber: string;
  caseTitle: string;
  originCountryCode: string | null;
  producerExporter: string | null;
  rateText: string | null;
  scopeSummary: string | null;
  legalBasis: string | null;
  notes: string | null;
  sourceName: string;
  sourceUrl: string;
  sourceVersion: string;
  basisDate: string;
};

export type ExportDestinationDataSourceItem = {
  countryCode: string;
  dataCategory: string;
  sourceName: string;
  sourceUrl: string;
  sourceVersion: string;
  accessMethod: string;
  connectorStatus: string;
  notes: string | null;
};

type RequirementRow = {
  country_code: string;
  destination_hs_code: string;
  requirement_type: string;
  requirement_name: string;
  agency: string | null;
  legal_basis: string | null;
  procedure_summary: string | null;
  required_documents: unknown;
  notes: string | null;
  source_name: string;
  source_url: string;
  source_version: string;
};

type InternalTaxRow = {
  country_code: string;
  destination_hs_code: string;
  tax_type: string;
  tax_name: string;
  rate_text: string | null;
  basis: string | null;
  notes: string | null;
  source_name: string;
  source_url: string;
  source_version: string;
};

type AdditionalTariffRow = {
  country_code: string;
  destination_hs_code: string;
  additional_tariff_code: string;
  tariff_program: string;
  rate_text: string | null;
  origin_country_code: string | null;
  condition_summary: string | null;
  legal_basis: string | null;
  notes: string | null;
  source_name: string;
  source_url: string;
  source_version: string;
};

type TradeRemedyCaseRow = {
  country_code: string;
  destination_hs_code: string;
  remedy_type: string;
  case_number: string;
  case_title: string;
  origin_country_code: string | null;
  producer_exporter: string | null;
  rate_text: string | null;
  scope_summary: string | null;
  legal_basis: string | null;
  notes: string | null;
  source_name: string;
  source_url: string;
  source_version: string;
};

type DataSourceRow = {
  country_code: string;
  data_category: string;
  source_name: string;
  source_url: string;
  source_version: string;
  access_method: string;
  connector_status: string;
  notes: string | null;
};

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

export function destinationHsLookupCodes(destinationHsCode: string) {
  const normalized = normalizeDestinationHsCode(destinationHsCode);
  return Array.from(new Set([
    normalized,
    normalized.slice(0, 8),
    normalized.slice(0, 6),
    normalized.slice(0, 4)
  ].filter((value) => value.length >= 4)));
}

export function mapExportDestinationImportRequirementRow(
  row: RequirementRow,
  basisDate: string
): ExportDestinationImportRequirementItem {
  return {
    countryCode: row.country_code,
    destinationHsCode: row.destination_hs_code,
    requirementType: row.requirement_type,
    requirementName: row.requirement_name,
    agency: row.agency,
    legalBasis: row.legal_basis,
    procedureSummary: row.procedure_summary,
    requiredDocuments: asStringArray(row.required_documents),
    notes: row.notes,
    sourceName: row.source_name,
    sourceUrl: row.source_url,
    sourceVersion: row.source_version,
    basisDate
  };
}

export function mapExportDestinationInternalTaxRow(row: InternalTaxRow, basisDate: string): ExportDestinationInternalTaxItem {
  return {
    countryCode: row.country_code,
    destinationHsCode: row.destination_hs_code,
    taxType: row.tax_type,
    taxName: row.tax_name,
    rateText: row.rate_text,
    basis: row.basis,
    notes: row.notes,
    sourceName: row.source_name,
    sourceUrl: row.source_url,
    sourceVersion: row.source_version,
    basisDate
  };
}

export function mapExportDestinationAdditionalTariffRow(row: AdditionalTariffRow, basisDate: string): ExportDestinationAdditionalTariffItem {
  return {
    countryCode: row.country_code,
    destinationHsCode: row.destination_hs_code,
    additionalTariffCode: row.additional_tariff_code,
    tariffProgram: row.tariff_program,
    rateText: row.rate_text,
    originCountryCode: row.origin_country_code,
    conditionSummary: row.condition_summary,
    legalBasis: row.legal_basis,
    notes: row.notes,
    sourceName: row.source_name,
    sourceUrl: row.source_url,
    sourceVersion: row.source_version,
    basisDate
  };
}

export function mapExportDestinationTradeRemedyCaseRow(row: TradeRemedyCaseRow, basisDate: string): ExportDestinationTradeRemedyCaseItem {
  return {
    countryCode: row.country_code,
    destinationHsCode: row.destination_hs_code,
    remedyType: row.remedy_type,
    caseNumber: row.case_number,
    caseTitle: row.case_title,
    originCountryCode: row.origin_country_code,
    producerExporter: row.producer_exporter,
    rateText: row.rate_text,
    scopeSummary: row.scope_summary,
    legalBasis: row.legal_basis,
    notes: row.notes,
    sourceName: row.source_name,
    sourceUrl: row.source_url,
    sourceVersion: row.source_version,
    basisDate
  };
}

export function preferMostSpecificInternalTaxRows(rows: ExportDestinationInternalTaxItem[]) {
  const bestByTax = new Map<string, ExportDestinationInternalTaxItem>();

  for (const row of rows) {
    const key = [
      row.countryCode,
      row.taxType,
      row.taxName,
      row.rateText ?? "",
      row.sourceVersion
    ].join("|");
    const previous = bestByTax.get(key);

    if (!previous || normalizeDestinationHsCode(row.destinationHsCode).length > normalizeDestinationHsCode(previous.destinationHsCode).length) {
      bestByTax.set(key, row);
    }
  }

  return Array.from(bestByTax.values()).sort((a, b) => {
    const codeDiff = normalizeDestinationHsCode(b.destinationHsCode).length - normalizeDestinationHsCode(a.destinationHsCode).length;
    if (codeDiff !== 0) return codeDiff;
    const typeDiff = internalTaxSortOrder(a) - internalTaxSortOrder(b);
    if (typeDiff !== 0) return typeDiff;
    return a.taxName.localeCompare(b.taxName, "ko");
  });
}

function internalTaxSortOrder(row: ExportDestinationInternalTaxItem) {
  const taxType = row.taxType.toLowerCase();
  const taxName = row.taxName.toLowerCase();
  const rateText = (row.rateText ?? "").trim();
  const isVatOrGst = taxType === "vat" || taxName.includes("vat") || taxName.includes("gst");

  if (isVatOrGst && rateText !== "없음") return 10;
  if (taxType.includes("sales") || taxName.includes("sst") || taxName.includes("sales")) return 20;
  if (taxType.includes("excise") || taxName.includes("소비세") || taxName.includes("excise")) return 30;
  if (isVatOrGst && rateText === "없음") return 90;

  return 50;
}

export function preferSelectedCountryInternalTaxRows(rows: ExportDestinationInternalTaxItem[], selectedCountryCode: string) {
  const normalized = selectedCountryCode.trim().toUpperCase();
  const aliases = new Set(countryCodeAliases(selectedCountryCode).map((code) => code.toUpperCase()));

  if (["EEC", "EU"].includes(normalized)) {
    const eecRows = rows.filter((row) => ["EEC", "EU"].includes(row.countryCode.toUpperCase()));
    return eecRows.length ? eecRows : rows;
  }

  const selectedRows = rows.filter((row) => {
    const countryCode = row.countryCode.toUpperCase();
    return countryCode !== "EEC" && countryCode !== "EU" && aliases.has(countryCode);
  });

  if (selectedRows.length) {
    return selectedRows;
  }

  return rows;
}

export function preferMostSpecificImportRequirementRows(rows: ExportDestinationImportRequirementItem[]) {
  const bestByRequirement = new Map<string, ExportDestinationImportRequirementItem>();

  for (const row of rows) {
    const key = [
      row.countryCode,
      row.requirementType,
      row.requirementName,
      row.agency ?? "",
      row.legalBasis ?? "",
      row.sourceVersion
    ].join("|");
    const previous = bestByRequirement.get(key);

    if (!previous || normalizeDestinationHsCode(row.destinationHsCode).length > normalizeDestinationHsCode(previous.destinationHsCode).length) {
      bestByRequirement.set(key, row);
    }
  }

  return Array.from(bestByRequirement.values()).sort((a, b) => {
    const codeDiff = normalizeDestinationHsCode(b.destinationHsCode).length - normalizeDestinationHsCode(a.destinationHsCode).length;
    if (codeDiff !== 0) return codeDiff;
    return a.requirementName.localeCompare(b.requirementName, "ko");
  });
}

export function preferMostSpecificAdditionalTariffRows(rows: ExportDestinationAdditionalTariffItem[]) {
  const bestByTariff = new Map<string, ExportDestinationAdditionalTariffItem>();

  for (const row of rows) {
    const key = [
      row.countryCode,
      row.additionalTariffCode,
      row.tariffProgram,
      row.rateText ?? "",
      row.originCountryCode ?? "",
      row.sourceVersion
    ].join("|");
    const previous = bestByTariff.get(key);

    if (!previous || normalizeDestinationHsCode(row.destinationHsCode).length > normalizeDestinationHsCode(previous.destinationHsCode).length) {
      bestByTariff.set(key, row);
    }
  }

  return Array.from(bestByTariff.values()).sort((a, b) => {
    const codeDiff = normalizeDestinationHsCode(b.destinationHsCode).length - normalizeDestinationHsCode(a.destinationHsCode).length;
    if (codeDiff !== 0) return codeDiff;
    return a.additionalTariffCode.localeCompare(b.additionalTariffCode, "ko");
  });
}

export function preferMostSpecificTradeRemedyCaseRows(rows: ExportDestinationTradeRemedyCaseItem[]) {
  const bestByCase = new Map<string, ExportDestinationTradeRemedyCaseItem>();

  for (const row of rows) {
    const key = [
      row.countryCode,
      row.remedyType,
      row.caseNumber,
      row.originCountryCode ?? "",
      row.producerExporter ?? "",
      row.rateText ?? "",
      row.sourceVersion
    ].join("|");
    const previous = bestByCase.get(key);

    if (!previous || normalizeDestinationHsCode(row.destinationHsCode).length > normalizeDestinationHsCode(previous.destinationHsCode).length) {
      bestByCase.set(key, row);
    }
  }

  return Array.from(bestByCase.values()).sort((a, b) => {
    const codeDiff = normalizeDestinationHsCode(b.destinationHsCode).length - normalizeDestinationHsCode(a.destinationHsCode).length;
    if (codeDiff !== 0) return codeDiff;
    return a.caseNumber.localeCompare(b.caseNumber, "ko");
  });
}

export function mapExportDestinationDataSourceRow(row: DataSourceRow): ExportDestinationDataSourceItem {
  return {
    countryCode: row.country_code,
    dataCategory: row.data_category,
    sourceName: row.source_name,
    sourceUrl: row.source_url,
    sourceVersion: row.source_version,
    accessMethod: row.access_method,
    connectorStatus: row.connector_status,
    notes: row.notes
  };
}

export async function findExportDestinationImportRequirements(
  supabase: SupabaseClient,
  input: {
    countryCode: string;
    destinationHsCode: string;
    basisDate: string;
    limit?: number;
  }
) {
  const countries = countryCodeAliases(input.countryCode);
  const destinationCodes = destinationHsLookupCodes(input.destinationHsCode);
  const { data, error } = await supabase
    .from("export_destination_import_requirements")
    .select("country_code, destination_hs_code, requirement_type, requirement_name, agency, legal_basis, procedure_summary, required_documents, notes, source_name, source_url, source_version")
    .in("country_code", countries)
    .in("destination_hs_code", destinationCodes)
    .lte("effective_from", input.basisDate)
    .or(`effective_to.is.null,effective_to.gte.${input.basisDate}`)
    .eq("status", "published")
    .order("destination_hs_code", { ascending: false })
    .limit(input.limit ?? 50);

  if (error) throw new Error(error.message);

  return preferMostSpecificImportRequirementRows(
    ((data ?? []) as RequirementRow[]).map((row) => mapExportDestinationImportRequirementRow(row, input.basisDate))
  );
}

export async function findExportDestinationInternalTaxes(
  supabase: SupabaseClient,
  input: {
    countryCode: string;
    destinationHsCode: string;
    basisDate: string;
    limit?: number;
  }
) {
  const countries = countryCodeAliases(input.countryCode);
  const destinationCodes = destinationHsLookupCodes(input.destinationHsCode);
  const { data, error } = await supabase
    .from("export_destination_internal_taxes")
    .select("country_code, destination_hs_code, tax_type, tax_name, rate_text, basis, notes, source_name, source_url, source_version")
    .in("country_code", countries)
    .in("destination_hs_code", destinationCodes)
    .lte("effective_from", input.basisDate)
    .or(`effective_to.is.null,effective_to.gte.${input.basisDate}`)
    .eq("status", "published")
    .order("destination_hs_code", { ascending: false })
    .limit(input.limit ?? 50);

  if (error) throw new Error(error.message);

  return preferMostSpecificInternalTaxRows(
    preferSelectedCountryInternalTaxRows(
      ((data ?? []) as InternalTaxRow[]).map((row) => mapExportDestinationInternalTaxRow(row, input.basisDate)),
      input.countryCode
    )
  );
}

export async function findExportDestinationAdditionalTariffs(
  supabase: SupabaseClient,
  input: {
    countryCode: string;
    destinationHsCode: string;
    basisDate: string;
    originCountryCode?: string;
    limit?: number;
  }
) {
  const countries = countryCodeAliases(input.countryCode);
  const destinationCodes = destinationHsLookupCodes(input.destinationHsCode);
  let query = supabase
    .from("export_destination_additional_tariffs")
    .select("country_code, destination_hs_code, additional_tariff_code, tariff_program, rate_text, origin_country_code, condition_summary, legal_basis, notes, source_name, source_url, source_version")
    .in("country_code", countries)
    .in("destination_hs_code", destinationCodes)
    .lte("effective_from", input.basisDate)
    .or(`effective_to.is.null,effective_to.gte.${input.basisDate}`)
    .eq("status", "published")
    .order("destination_hs_code", { ascending: false })
    .limit(input.limit ?? 50);

  if (input.originCountryCode && input.originCountryCode !== "ALL") {
    query = query.or(`origin_country_code.is.null,origin_country_code.eq.${input.originCountryCode}`);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);

  return preferMostSpecificAdditionalTariffRows(
    ((data ?? []) as AdditionalTariffRow[]).map((row) => mapExportDestinationAdditionalTariffRow(row, input.basisDate))
  );
}

export async function findExportDestinationTradeRemedyCases(
  supabase: SupabaseClient,
  input: {
    countryCode: string;
    destinationHsCode: string;
    basisDate: string;
    originCountryCode?: string;
    limit?: number;
  }
) {
  const countries = countryCodeAliases(input.countryCode);
  const destinationCodes = destinationHsLookupCodes(input.destinationHsCode);
  let query = supabase
    .from("export_destination_trade_remedy_cases")
    .select("country_code, destination_hs_code, remedy_type, case_number, case_title, origin_country_code, producer_exporter, rate_text, scope_summary, legal_basis, notes, source_name, source_url, source_version")
    .in("country_code", countries)
    .in("destination_hs_code", destinationCodes)
    .lte("effective_from", input.basisDate)
    .or(`effective_to.is.null,effective_to.gte.${input.basisDate}`)
    .eq("status", "published")
    .order("destination_hs_code", { ascending: false })
    .limit(input.limit ?? 50);

  if (input.originCountryCode && input.originCountryCode !== "ALL") {
    query = query.or(`origin_country_code.is.null,origin_country_code.eq.${input.originCountryCode}`);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);

  return preferMostSpecificTradeRemedyCaseRows(
    ((data ?? []) as TradeRemedyCaseRow[]).map((row) => mapExportDestinationTradeRemedyCaseRow(row, input.basisDate))
  );
}

export async function findExportDestinationDataSources(
  supabase: SupabaseClient,
  input: {
    countryCode?: string;
    dataCategory?: string;
    limit?: number;
  } = {}
) {
  let query = supabase
    .from("export_destination_data_sources")
    .select("country_code, data_category, source_name, source_url, source_version, access_method, connector_status, notes")
    .eq("status", "published")
    .order("country_code", { ascending: true })
    .order("data_category", { ascending: true })
    .limit(input.limit ?? 100);

  if (input.countryCode) {
    query = query.in("country_code", countryCodeAliases(input.countryCode));
  }

  if (input.dataCategory) {
    query = query.eq("data_category", input.dataCategory);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);

  return ((data ?? []) as DataSourceRow[]).map(mapExportDestinationDataSourceRow);
}
