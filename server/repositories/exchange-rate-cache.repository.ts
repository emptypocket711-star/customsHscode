import type { SupabaseClient } from "@supabase/supabase-js";
import type { PublicDataSnapshot } from "@/server/integrations/public-data/client";
import type { CustomsExchangeRateItem } from "@/server/integrations/customs/customs-api";

export type CachedExchangeRateRow = {
  currencyCode: string;
  rate: string;
  effectiveFrom: string;
  direction: "import" | "export";
  sourceVersion: string;
  sourceSnapshotId: string | null;
};

type ExchangeRateRow = {
  currency_code: string;
  rate: string | number;
  effective_from: string;
  direction: "import" | "export";
  source_version: string;
  source_snapshot_id: string | null;
};

function mapRow(row: ExchangeRateRow): CachedExchangeRateRow {
  return {
    currencyCode: row.currency_code,
    rate: String(row.rate),
    effectiveFrom: row.effective_from,
    direction: row.direction,
    sourceVersion: row.source_version,
    sourceSnapshotId: row.source_snapshot_id
  };
}

export async function findCachedExchangeRate(
  supabase: SupabaseClient,
  input: {
    currencyCode: string;
    direction: "import" | "export";
    basisDate: string;
    mode?: "current" | "next";
  }
) {
  const query = supabase
    .from("customs_exchange_rates")
    .select("currency_code,rate,effective_from,direction,source_version,source_snapshot_id")
    .eq("status", "published")
    .eq("direction", input.direction)
    .eq("currency_code", input.currencyCode.toUpperCase());

  const { data, error } = input.mode === "next"
    ? await query.gt("effective_from", input.basisDate).order("effective_from", { ascending: true }).limit(1).maybeSingle()
    : await query.lte("effective_from", input.basisDate).order("effective_from", { ascending: false }).limit(1).maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapRow(data as ExchangeRateRow) : null;
}

export async function insertExchangeRateSourceSnapshot(
  supabase: SupabaseClient,
  input: {
    snapshot: PublicDataSnapshot;
    effectiveFrom: string;
  }
) {
  const { data, error } = await supabase
    .from("legal_source_snapshots")
    .insert({
      source_type: "exchange_rate",
      source_name: input.snapshot.sourceName,
      source_url: input.snapshot.sourceUrl,
      source_version: input.snapshot.sourceVersion,
      published_at: null,
      retrieved_at: input.snapshot.retrievedAt,
      effective_from: input.effectiveFrom,
      effective_to: null,
      checksum: input.snapshot.checksum,
      raw_file_path: null,
      status: "fetched",
      created_by: null
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return typeof data?.id === "string" ? data.id : null;
}

export async function upsertCachedExchangeRates(
  supabase: SupabaseClient,
  input: {
    snapshot: PublicDataSnapshot;
    sourceSnapshotId: string | null;
    rows: CustomsExchangeRateItem[];
  }
) {
  const now = new Date().toISOString();
  const records = input.rows
    .filter((row) => row.currencyCode && row.rate && row.effectiveFrom)
    .map((row) => ({
      direction: row.direction,
      currency_code: row.currencyCode.toUpperCase(),
      country_code: row.countryCode || null,
      currency_unit_name: row.currencyUnitName || null,
      rate: Number(row.rate),
      effective_from: row.effectiveFrom!,
      source_name: input.snapshot.sourceName,
      source_url: input.snapshot.sourceUrl,
      source_version: input.snapshot.sourceVersion,
      retrieved_at: input.snapshot.retrievedAt,
      checksum: input.snapshot.checksum,
      source_snapshot_id: input.sourceSnapshotId,
      status: "published",
      updated_at: now
    }))
    .filter((row) => Number.isFinite(row.rate));

  if (!records.length) return 0;

  const { error } = await supabase
    .from("customs_exchange_rates")
    .upsert(records, {
      onConflict: "direction,currency_code,effective_from"
    });

  if (error) throw new Error(error.message);
  return records.length;
}
