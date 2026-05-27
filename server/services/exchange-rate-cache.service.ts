import { buildCustomsExchangeRateQuery, fetchCustomsOpenApiSnapshot, parseCustomsExchangeRatesXml } from "@/server/integrations/customs/customs-api";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import {
  insertExchangeRateSourceSnapshot,
  upsertCachedExchangeRates
} from "@/server/repositories/exchange-rate-cache.repository";

function seoulDateString(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

export async function refreshCustomsExchangeRateCache(basisDate = seoulDateString()) {
  const supabase = createSupabaseServiceRoleClient();
  const directions = ["import", "export"] as const;
  const results: Array<{
    direction: "import" | "export";
    fetched: number;
    upserted: number;
    effectiveFrom: string | null;
  }> = [];

  for (const direction of directions) {
    const snapshot = await fetchCustomsOpenApiSnapshot("exchange_rate", buildCustomsExchangeRateQuery({
      applyStartDate: basisDate,
      direction
    }), { timeoutMs: 15000 });
    const rows = parseCustomsExchangeRatesXml(snapshot.rawText).filter((row) => row.direction === direction);
    const effectiveFrom = rows.find((row) => row.effectiveFrom)?.effectiveFrom ?? basisDate;
    const sourceSnapshotId = await insertExchangeRateSourceSnapshot(supabase, {
      snapshot,
      effectiveFrom
    });
    const upserted = await upsertCachedExchangeRates(supabase, {
      snapshot,
      sourceSnapshotId,
      rows
    });

    results.push({
      direction,
      fetched: rows.length,
      upserted,
      effectiveFrom
    });
  }

  return {
    basisDate,
    results
  };
}
