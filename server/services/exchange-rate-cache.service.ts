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

function dateFromString(dateString: string) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function dateStringFromUtcDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(dateString: string, days: number) {
  const date = dateFromString(dateString);
  date.setUTCDate(date.getUTCDate() + days);
  return dateStringFromUtcDate(date);
}

function nextWeekRateProbeDate(basisDate: string) {
  const date = dateFromString(basisDate);
  const dayOfWeek = date.getUTCDay();
  const daysUntilSunday = (7 - dayOfWeek) % 7 || 7;
  return addDays(basisDate, daysUntilSunday);
}

function exchangeRateQueryDates(basisDate: string) {
  return Array.from(new Set([basisDate, nextWeekRateProbeDate(basisDate)]));
}

export async function refreshCustomsExchangeRateCache(basisDate = seoulDateString()) {
  const supabase = createSupabaseServiceRoleClient();
  const directions = ["import", "export"] as const;
  const queryDates = exchangeRateQueryDates(basisDate);
  const results: Array<{
    direction: "import" | "export";
    requestedDate: string;
    fetched: number;
    upserted: number;
    effectiveFrom: string | null;
  }> = [];

  for (const direction of directions) {
    for (const requestedDate of queryDates) {
      const snapshot = await fetchCustomsOpenApiSnapshot("exchange_rate", buildCustomsExchangeRateQuery({
        applyStartDate: requestedDate,
        direction
      }), { timeoutMs: 15000 });
      const rows = parseCustomsExchangeRatesXml(snapshot.rawText).filter((row) => row.direction === direction);
      const effectiveFrom = rows.find((row) => row.effectiveFrom)?.effectiveFrom ?? requestedDate;
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
        requestedDate,
        fetched: rows.length,
        upserted,
        effectiveFrom
      });
    }
  }

  return {
    basisDate,
    nextWeekProbeDate: queryDates.find((date) => date > basisDate) ?? null,
    results
  };
}

export const exchangeRateCacheInternals = {
  exchangeRateQueryDates,
  nextWeekRateProbeDate
};
