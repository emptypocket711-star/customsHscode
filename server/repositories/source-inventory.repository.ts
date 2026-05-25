import type { SupabaseClient } from "@supabase/supabase-js";
import type { SourceVersionInventoryItem } from "@/features/legal-updates/mock-source-inventory";

type SourceInventoryRow = {
  target_table: string;
  source_name: string;
  source_version: string;
  status: SourceVersionInventoryItem["status"];
  row_count: number | string;
  latest_retrieved_at: string | null;
  latest_published_at: string | null;
};

export type DomesticHsLookupSnapshotCoverage = {
  snapshotBasisDate: string | null;
  totalHsk10: number;
  withTariffRates: number;
  missingTariffRates: number;
  withCustomsRequirements: number;
  withPublicNoticeRequirements: number;
  withInternalTaxes: number;
  lastRefreshedAt: string | null;
};

type DomesticHsLookupSnapshotCoverageRow = {
  snapshot_basis_date: string | null;
  total_hsk10: number | string | null;
  with_tariff_rates: number | string | null;
  missing_tariff_rates: number | string | null;
  with_customs_requirements: number | string | null;
  with_public_notice_requirements: number | string | null;
  with_internal_taxes: number | string | null;
  last_refreshed_at: string | null;
};

export const getLegalSourceVersionInventoryRpcName = "get_legal_source_version_inventory";
export const getDomesticHsLookupSnapshotCoverageRpcName = "get_domestic_hs_lookup_snapshot_coverage";

export function mapSourceInventoryRow(row: SourceInventoryRow): SourceVersionInventoryItem {
  return {
    targetTable: row.target_table,
    sourceName: row.source_name,
    sourceVersion: row.source_version,
    status: row.status,
    rowCount: Number(row.row_count),
    latestRetrievedAt: row.latest_retrieved_at,
    latestPublishedAt: row.latest_published_at
  };
}

export async function getSourceVersionInventoryFromSupabase(
  supabase: SupabaseClient
): Promise<SourceVersionInventoryItem[]> {
  const { data, error } = await supabase.rpc(getLegalSourceVersionInventoryRpcName);

  if (error) throw new Error(error.message);

  return ((data ?? []) as SourceInventoryRow[]).map(mapSourceInventoryRow);
}

function numericCount(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

export function mapDomesticHsLookupSnapshotCoverageRow(row: DomesticHsLookupSnapshotCoverageRow): DomesticHsLookupSnapshotCoverage {
  return {
    snapshotBasisDate: row.snapshot_basis_date,
    totalHsk10: numericCount(row.total_hsk10),
    withTariffRates: numericCount(row.with_tariff_rates),
    missingTariffRates: numericCount(row.missing_tariff_rates),
    withCustomsRequirements: numericCount(row.with_customs_requirements),
    withPublicNoticeRequirements: numericCount(row.with_public_notice_requirements),
    withInternalTaxes: numericCount(row.with_internal_taxes),
    lastRefreshedAt: row.last_refreshed_at
  };
}

export async function getDomesticHsLookupSnapshotCoverageFromSupabase(
  supabase: SupabaseClient
): Promise<DomesticHsLookupSnapshotCoverage | null> {
  const { data, error } = await supabase.rpc(getDomesticHsLookupSnapshotCoverageRpcName);

  if (error) throw new Error(error.message);

  const row = ((data ?? []) as DomesticHsLookupSnapshotCoverageRow[])[0];
  return row ? mapDomesticHsLookupSnapshotCoverageRow(row) : null;
}
