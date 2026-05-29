import { NextResponse } from "next/server";
import type { PublicDataFetchError } from "@/server/integrations/public-data/client";

export type ExternalIntegrationErrorLevel =
  | "input"
  | "empty"
  | "temporary"
  | "external_unavailable"
  | "configuration"
  | "degraded"
  | "unexpected";

export type ExternalIntegrationErrorBody = {
  ok: false;
  level: ExternalIntegrationErrorLevel;
  code: string;
  message: string;
  retryable: boolean;
  requestId: string;
};

export function buildExternalIntegrationError({
  code,
  level,
  message,
  requestId = crypto.randomUUID(),
  retryable
}: {
  code: string;
  level: ExternalIntegrationErrorLevel;
  message: string;
  requestId?: string;
  retryable?: boolean;
}): ExternalIntegrationErrorBody {
  return {
    ok: false,
    level,
    code,
    message,
    retryable: retryable ?? (level === "temporary" || level === "external_unavailable" || level === "degraded"),
    requestId
  };
}

export function externalIntegrationErrorResponse({
  status,
  ...input
}: {
  code: string;
  level: ExternalIntegrationErrorLevel;
  message: string;
  requestId?: string;
  retryable?: boolean;
  status: number;
}) {
  const body = buildExternalIntegrationError(input);

  return NextResponse.json(body, {
    headers: {
      "cache-control": "no-store",
      "x-request-id": body.requestId
    },
    status
  });
}

export function publicDataFetchErrorToExternalError({
  error,
  serviceCode,
  serviceName
}: {
  error: PublicDataFetchError;
  serviceCode: string;
  serviceName: string;
}) {
  const endpoint = `${error.endpointHost}:${error.endpointPort}`;
  const detail = [error.causeCode, error.causeMessage].filter(Boolean).join(" / ") || "세부 원인 없음";

  if (error.category === "timeout") {
    return {
      body: buildExternalIntegrationError({
        code: `${serviceCode.toLowerCase()}_timeout`,
        level: "temporary",
        message: `${serviceName} 응답 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.`
      }),
      diagnostic: { category: error.category, detail, endpoint }
    };
  }

  if (error.category === "dns" || error.category === "tls" || error.category === "outbound_port" || error.category === "network") {
    return {
      body: buildExternalIntegrationError({
        code: `${serviceCode.toLowerCase()}_${error.category}`,
        level: "external_unavailable",
        message: `${serviceName} 서버 연결에 실패했습니다. 잠시 후 다시 시도해 주세요.`
      }),
      diagnostic: { category: error.category, detail, endpoint }
    };
  }

  return {
    body: buildExternalIntegrationError({
      code: `${serviceCode.toLowerCase()}_unknown`,
      level: "unexpected",
      message: `${serviceName} 호출 중 알 수 없는 오류가 발생했습니다.`
    }),
    diagnostic: { category: error.category, detail, endpoint }
  };
}
