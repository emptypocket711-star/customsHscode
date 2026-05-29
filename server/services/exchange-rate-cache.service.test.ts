import { afterEach, describe, expect, it, vi } from "vitest";
import {
  exchangeRateCacheInternals,
  refreshCustomsExchangeRateCache
} from "@/server/services/exchange-rate-cache.service";
import {
  fetchCustomsOpenApiSnapshot,
  parseCustomsExchangeRatesXml
} from "@/server/integrations/customs/customs-api";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import {
  insertExchangeRateSourceSnapshot,
  upsertCachedExchangeRates
} from "@/server/repositories/exchange-rate-cache.repository";

vi.mock("@/server/integrations/customs/customs-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/server/integrations/customs/customs-api")>();

  return {
    ...actual,
    fetchCustomsOpenApiSnapshot: vi.fn(),
    parseCustomsExchangeRatesXml: vi.fn()
  };
});

vi.mock("@/lib/supabase/service-role", () => ({
  createSupabaseServiceRoleClient: vi.fn()
}));

vi.mock("@/server/repositories/exchange-rate-cache.repository", () => ({
  insertExchangeRateSourceSnapshot: vi.fn(),
  upsertCachedExchangeRates: vi.fn()
}));

const mockedFetchCustomsOpenApiSnapshot = vi.mocked(fetchCustomsOpenApiSnapshot);
const mockedParseCustomsExchangeRatesXml = vi.mocked(parseCustomsExchangeRatesXml);
const mockedCreateSupabaseServiceRoleClient = vi.mocked(createSupabaseServiceRoleClient);
const mockedInsertExchangeRateSourceSnapshot = vi.mocked(insertExchangeRateSourceSnapshot);
const mockedUpsertCachedExchangeRates = vi.mocked(upsertCachedExchangeRates);

describe("refreshCustomsExchangeRateCache", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("queries the basis date and the next-week probe date for import/export rates", async () => {
    mockedCreateSupabaseServiceRoleClient.mockReturnValue({} as ReturnType<typeof createSupabaseServiceRoleClient>);
    mockedFetchCustomsOpenApiSnapshot.mockImplementation(async (_sourceType, query) => ({
      sourceName: "관세청 관세환율 정보",
      sourceUrl: "https://example.test/exchange",
      sourceVersion: "myc-openapi-api012-v1.0",
      retrievedAt: "2026-05-29T06:00:00.000Z",
      checksum: `checksum-${query.qryYymmDd}-${query.imexTp}`,
      contentType: "application/xml",
      rawText: String(query.qryYymmDd)
    }));
    mockedParseCustomsExchangeRatesXml.mockImplementation((rawText) => {
      const effectiveFrom = rawText === "20260531" ? "2026-05-31" : "2026-05-29";
      return [
        {
          countryCode: "US",
          currencyUnitName: "Dollar",
          currencyCode: "USD",
          rate: "1360.10",
          effectiveFrom,
          direction: "import"
        },
        {
          countryCode: "US",
          currencyUnitName: "Dollar",
          currencyCode: "USD",
          rate: "1358.20",
          effectiveFrom,
          direction: "export"
        }
      ];
    });
    mockedInsertExchangeRateSourceSnapshot.mockResolvedValue("snapshot-id");
    mockedUpsertCachedExchangeRates.mockResolvedValue(1);

    const result = await refreshCustomsExchangeRateCache("2026-05-29");

    expect(exchangeRateCacheInternals.exchangeRateQueryDates("2026-05-29")).toEqual([
      "2026-05-29",
      "2026-05-31"
    ]);
    expect(mockedFetchCustomsOpenApiSnapshot).toHaveBeenCalledTimes(4);
    expect(mockedFetchCustomsOpenApiSnapshot).toHaveBeenNthCalledWith(1, "exchange_rate", {
      qryYymmDd: "20260529",
      imexTp: "2"
    }, { timeoutMs: 15000 });
    expect(mockedFetchCustomsOpenApiSnapshot).toHaveBeenNthCalledWith(2, "exchange_rate", {
      qryYymmDd: "20260531",
      imexTp: "2"
    }, { timeoutMs: 15000 });
    expect(mockedFetchCustomsOpenApiSnapshot).toHaveBeenNthCalledWith(3, "exchange_rate", {
      qryYymmDd: "20260529",
      imexTp: "1"
    }, { timeoutMs: 15000 });
    expect(mockedFetchCustomsOpenApiSnapshot).toHaveBeenNthCalledWith(4, "exchange_rate", {
      qryYymmDd: "20260531",
      imexTp: "1"
    }, { timeoutMs: 15000 });
    expect(result.nextWeekProbeDate).toBe("2026-05-31");
    expect(result.results).toHaveLength(4);
  });
});
