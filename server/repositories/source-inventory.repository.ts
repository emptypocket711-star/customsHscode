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

export const getLegalSourceVersionInventoryRpcName = "get_legal_source_version_inventory";

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
