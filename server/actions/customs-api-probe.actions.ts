"use server";

import {
  customsApiProbeSchema,
  type CustomsApiProbeActionState
} from "@/features/legal-updates/customs-api-schemas";
import {
  buildCustomsConfirmationQuery,
  buildCustomsExchangeRateQuery,
  buildCustomsHsCodeNavigationQuery,
  buildCustomsHsCodeQuery,
  buildCustomsStatisticalCodeQuery,
  buildCustomsTariffRateQuery,
  fetchCustomsOpenApiSnapshot,
  hasCustomsOpenApiEnv
} from "@/server/integrations/customs/customs-api";

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : undefined;
}

function buildProbeParams(input: {
  source: "customs_confirmation" | "hs_code" | "hs_code_navigation" | "tariff_rate" | "statistical_code" | "exchange_rate" | "cargo_progress";
  hskCode?: string;
  productName?: string;
  statisticalCodeType?: string;
  direction?: "import" | "export";
  applyStartDate?: string;
  cargoManagementNo?: string;
  masterBlNo?: string;
  houseBlNo?: string;
}) {
  if (input.source === "customs_confirmation") {
    return buildCustomsConfirmationQuery({
      hskCode: input.hskCode || "3304991000",
      direction: input.direction || "import"
    });
  }

  if (input.source === "tariff_rate") {
    return buildCustomsTariffRateQuery({
      hskCode: input.hskCode || "3304991000"
    });
  }

  if (input.source === "hs_code") {
    return buildCustomsHsCodeQuery({
      hskCode: input.hskCode,
      productName: input.productName || (!input.hskCode ? "스콤버" : undefined),
      language: "ko"
    });
  }

  if (input.source === "hs_code_navigation") {
    return buildCustomsHsCodeNavigationQuery({
      hskPattern: input.hskCode || "4202290000"
    });
  }

  if (input.source === "statistical_code") {
    return buildCustomsStatisticalCodeQuery({
      codeType: input.statisticalCodeType || "A01"
    });
  }

  if (input.source === "exchange_rate") {
    return buildCustomsExchangeRateQuery({
      applyStartDate: input.applyStartDate || new Date().toISOString().slice(0, 10),
      direction: input.direction || "import"
    });
  }

  return {
    cargMtNo: input.cargoManagementNo,
    mblNo: input.masterBlNo,
    hblNo: input.houseBlNo
  };
}

export async function probeCustomsApiAction(
  _previousState: CustomsApiProbeActionState,
  formData: FormData
): Promise<CustomsApiProbeActionState> {
  const parsed = customsApiProbeSchema.safeParse({
    source: stringValue(formData, "source"),
    hskCode: stringValue(formData, "hskCode"),
    productName: stringValue(formData, "productName"),
    statisticalCodeType: stringValue(formData, "statisticalCodeType"),
    direction: stringValue(formData, "direction"),
    applyStartDate: stringValue(formData, "applyStartDate"),
    cargoManagementNo: stringValue(formData, "cargoManagementNo"),
    masterBlNo: stringValue(formData, "masterBlNo"),
    houseBlNo: stringValue(formData, "houseBlNo")
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "관세청 API 조회 입력값을 확인해 주세요."
    };
  }

  if (!hasCustomsOpenApiEnv(parsed.data.source)) {
    return {
      status: "error",
      message: "PUBLIC_DATA_SERVICE_KEY와 선택한 관세청 API endpoint URL이 설정되지 않았습니다."
    };
  }

  try {
    const snapshot = await fetchCustomsOpenApiSnapshot(parsed.data.source, buildProbeParams(parsed.data));

    return {
      status: "success",
      message: "관세청 API 응답을 수신했습니다. 운영 반영 전에는 source snapshot 저장과 담당자 검토가 필요합니다.",
      snapshot: {
        sourceName: snapshot.sourceName,
        sourceUrl: snapshot.sourceUrl,
        sourceVersion: snapshot.sourceVersion,
        retrievedAt: snapshot.retrievedAt,
        checksum: snapshot.checksum,
        contentType: snapshot.contentType,
        preview: snapshot.rawText.slice(0, 800)
      }
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "관세청 API 조회 중 오류가 발생했습니다."
    };
  }
}
