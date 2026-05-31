import { cachedLookup, lookupCacheKey } from "@/server/cache/lookup-cache";
import {
  buildCustomsHsCodeNavigationQuery,
  fetchCustomsOpenApiSnapshot,
  hasCustomsOpenApiEnv,
  parseCustomsHsCodeNavigationXml
} from "@/server/integrations/customs/customs-api";
import { normalizeHsCode } from "@/lib/hs-code";

const lookupCacheTtlMs = Number(process.env.HS_LOOKUP_CACHE_TTL_MS ?? 30 * 60 * 1000);

export type HsNavigationStatItem = {
  hskCodePattern: string;
  lineCount: string;
  productName: string;
  rank: string;
};

export async function getHsNavigationStats(hskCode: string) {
  const normalizedCode = normalizeHsCode(hskCode);
  if (normalizedCode.length !== 10 || !hasCustomsOpenApiEnv("hs_code_navigation")) {
    return [] as HsNavigationStatItem[];
  }

  return cachedLookup({
    key: lookupCacheKey("hs-navigation-stats-detail", { hskCode: normalizedCode }),
    ttlMs: lookupCacheTtlMs,
    load: async () => {
      const snapshot = await fetchCustomsOpenApiSnapshot(
        "hs_code_navigation",
        buildCustomsHsCodeNavigationQuery({ hskPattern: normalizedCode })
      );

      return parseCustomsHsCodeNavigationXml(snapshot.rawText)
        .filter((row) => normalizeHsCode(row.hskCodePattern) === normalizedCode)
        .sort((a, b) => Number(a.rank || 9999) - Number(b.rank || 9999))
        .slice(0, 12);
    }
  });
}
