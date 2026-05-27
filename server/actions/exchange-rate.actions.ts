"use server";

import {
  buildCustomsExchangeRateQuery,
  fetchCustomsOpenApiSnapshot,
  hasCustomsOpenApiEnv,
  parseCustomsExchangeRatesXml
} from "@/server/integrations/customs/customs-api";
import { createSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase/server";
import { recordExchangeRateSourceSnapshot } from "@/server/repositories/exchange-rate-snapshot.repository";

export type ExchangeRateLookupState = {
  status: "idle" | "success" | "error";
  message?: string;
  rate?: string;
  currencyCode?: string;
  effectiveFrom?: string | null;
  sourceVersion?: string;
  sourceSnapshotId?: string | null;
};

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function lookupExchangeRateAction(
  _previousState: ExchangeRateLookupState,
  formData: FormData
): Promise<ExchangeRateLookupState> {
  const currencyCode = stringValue(formData, "currencyCode").toUpperCase();
  const applyStartDate = stringValue(formData, "applyStartDate");
  const direction = stringValue(formData, "direction") === "export" ? "export" : "import";

  if (!currencyCode) {
    return { status: "error", message: "통화를 선택해 주세요." };
  }

  if (currencyCode === "KRW") {
    return {
      status: "success",
      message: "원화는 환율 1을 적용합니다.",
      rate: "1",
      currencyCode,
      effectiveFrom: applyStartDate || null,
      sourceVersion: "local-krw"
    };
  }

  if (!applyStartDate) {
    return { status: "error", message: "조회기준일을 입력해 주세요." };
  }

  if (!hasCustomsOpenApiEnv("exchange_rate")) {
    return {
      status: "error",
      message: "관세환율 API012 키가 설정되지 않았습니다. Vercel 환경변수에 CUSTOMS_API_EXCHANGE_RATE_SERVICE_KEY 값을 등록해 주세요. URL은 미입력 시 기본 UNIPASS API012 endpoint를 사용합니다."
    };
  }

  try {
    const snapshot = await fetchCustomsOpenApiSnapshot("exchange_rate", buildCustomsExchangeRateQuery({
      applyStartDate,
      direction
    }));
    const rows = parseCustomsExchangeRatesXml(snapshot.rawText);
    const matched = rows.find((row) => row.currencyCode.toUpperCase() === currencyCode);

    if (!rows.length) {
      return {
        status: "error",
        message: "관세환율 API012 응답에 환율 목록이 없습니다. API012 URL은 포트 38010을 포함한 UNIPASS 관세환율 endpoint로 설정해 주세요."
      };
    }

    if (!matched) {
      return {
        status: "error",
        message: `${applyStartDate} 기준 ${currencyCode} 관세환율을 찾지 못했습니다.`
      };
    }

    let sourceSnapshotId: string | null = null;
    if (hasSupabaseEnv() && matched.effectiveFrom) {
      try {
        const supabase = await createSupabaseServerClient();
        sourceSnapshotId = await recordExchangeRateSourceSnapshot(supabase, {
          snapshot,
          effectiveFrom: matched.effectiveFrom
        });
      } catch {
        sourceSnapshotId = null;
      }
    }

    return {
      status: "success",
      message: `${currencyCode} 관세환율을 적용했습니다.`,
      rate: matched.rate,
      currencyCode: matched.currencyCode,
      effectiveFrom: matched.effectiveFrom,
      sourceVersion: snapshot.sourceVersion,
      sourceSnapshotId
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "관세환율 조회 중 오류가 발생했습니다."
    };
  }
}
