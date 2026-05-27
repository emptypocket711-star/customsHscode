import { afterEach, describe, expect, it, vi } from "vitest";
import { lookupExchangeRateAction } from "@/server/actions/exchange-rate.actions";
import { fetchCustomsOpenApiSnapshot, hasCustomsOpenApiEnv } from "@/server/integrations/customs/customs-api";
import { hasSupabaseEnv, createSupabaseServerClient } from "@/lib/supabase/server";
import { recordExchangeRateSourceSnapshot } from "@/server/repositories/exchange-rate-snapshot.repository";

vi.mock("@/server/integrations/customs/customs-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/server/integrations/customs/customs-api")>();

  return {
    ...actual,
    fetchCustomsOpenApiSnapshot: vi.fn(),
    hasCustomsOpenApiEnv: vi.fn()
  };
});

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
  hasSupabaseEnv: vi.fn()
}));

vi.mock("@/server/repositories/exchange-rate-snapshot.repository", () => ({
  recordExchangeRateSourceSnapshot: vi.fn()
}));

const mockedFetchCustomsOpenApiSnapshot = vi.mocked(fetchCustomsOpenApiSnapshot);
const mockedHasCustomsOpenApiEnv = vi.mocked(hasCustomsOpenApiEnv);
const mockedHasSupabaseEnv = vi.mocked(hasSupabaseEnv);
const mockedCreateSupabaseServerClient = vi.mocked(createSupabaseServerClient);
const mockedRecordExchangeRateSourceSnapshot = vi.mocked(recordExchangeRateSourceSnapshot);

function formData(values: Record<string, string>) {
  const data = new FormData();

  for (const [key, value] of Object.entries(values)) {
    data.set(key, value);
  }

  return data;
}

describe("lookupExchangeRateAction", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns local KRW rate without calling customs API", async () => {
    const result = await lookupExchangeRateAction({ status: "idle" }, formData({
      currencyCode: "KRW",
      applyStartDate: "2026-05-24",
      direction: "import"
    }));

    expect(result).toEqual({
      status: "success",
      message: "원화는 환율 1을 적용합니다.",
      rate: "1",
      currencyCode: "KRW",
      effectiveFrom: "2026-05-24",
      sourceVersion: "local-krw"
    });
    expect(mockedFetchCustomsOpenApiSnapshot).not.toHaveBeenCalled();
  });

  it("finds a currency rate from API012 XML", async () => {
    mockedHasCustomsOpenApiEnv.mockReturnValue(true);
    mockedHasSupabaseEnv.mockReturnValue(true);
    mockedCreateSupabaseServerClient.mockResolvedValue({} as Awaited<ReturnType<typeof createSupabaseServerClient>>);
    mockedRecordExchangeRateSourceSnapshot.mockResolvedValue("00000000-0000-0000-0000-000000000012");
    mockedFetchCustomsOpenApiSnapshot.mockResolvedValue({
      sourceName: "관세청 관세환율 정보",
      sourceUrl: "https://example.test/exchange",
      sourceVersion: "myc-openapi-api012-v1.0",
      retrievedAt: "2026-05-24T00:00:00.000Z",
      checksum: "checksum",
      contentType: "application/xml",
      rawText: `
        <trifFxrtInfoQryRtnVo>
          <trifFxrtInfoQryRsltVo>
            <cntySgn>US</cntySgn>
            <mtryUtNm>Dollar</mtryUtNm>
            <fxrt>1350.20</fxrt>
            <currSgn>USD</currSgn>
            <aplyBgnDt>20260524</aplyBgnDt>
            <imexTp>2</imexTp>
          </trifFxrtInfoQryRsltVo>
        </trifFxrtInfoQryRtnVo>
      `
    });

    const result = await lookupExchangeRateAction({ status: "idle" }, formData({
      currencyCode: "usd",
      applyStartDate: "2026-05-24",
      direction: "import"
    }));

    expect(mockedFetchCustomsOpenApiSnapshot).toHaveBeenCalledWith("exchange_rate", {
      qryYymmDd: "20260524",
      imexTp: "2"
    });
    expect(result).toEqual({
      status: "success",
      message: "USD 관세환율을 적용했습니다.",
      rate: "1350.20",
      currencyCode: "USD",
      effectiveFrom: "2026-05-24",
      sourceVersion: "myc-openapi-api012-v1.0",
      sourceSnapshotId: "00000000-0000-0000-0000-000000000012"
    });
    expect(mockedRecordExchangeRateSourceSnapshot).toHaveBeenCalledWith({}, {
      snapshot: expect.objectContaining({
        sourceVersion: "myc-openapi-api012-v1.0",
        checksum: "checksum"
      }),
      effectiveFrom: "2026-05-24"
    });
  });

  it("returns a clear error when API012 env is missing", async () => {
    mockedHasCustomsOpenApiEnv.mockReturnValue(false);

    const result = await lookupExchangeRateAction({ status: "idle" }, formData({
      currencyCode: "USD",
      applyStartDate: "2026-05-24",
      direction: "import"
    }));

    expect(result).toEqual({
      status: "error",
      message: "관세환율 API012 키가 설정되지 않았습니다. Vercel 환경변수에 CUSTOMS_API_EXCHANGE_RATE_SERVICE_KEY 값을 등록해 주세요. URL은 미입력 시 기본 UNIPASS API012 endpoint를 사용합니다."
    });
  });
});
