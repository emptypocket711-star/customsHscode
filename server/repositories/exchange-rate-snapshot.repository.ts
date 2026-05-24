import type { SupabaseClient } from "@supabase/supabase-js";
import type { PublicDataSnapshot } from "@/server/integrations/public-data/client";

export const recordExchangeRateSourceSnapshotRpcName = "record_exchange_rate_source_snapshot";

export async function recordExchangeRateSourceSnapshot(
  supabase: SupabaseClient,
  input: {
    snapshot: PublicDataSnapshot;
    effectiveFrom: string;
  }
) {
  const { data, error } = await supabase.rpc(recordExchangeRateSourceSnapshotRpcName, {
    p_source_name: input.snapshot.sourceName,
    p_source_url: input.snapshot.sourceUrl,
    p_source_version: input.snapshot.sourceVersion,
    p_effective_from: input.effectiveFrom,
    p_retrieved_at: input.snapshot.retrievedAt,
    p_checksum: input.snapshot.checksum
  });

  if (error) throw new Error(error.message);

  return typeof data === "string" ? data : null;
}
