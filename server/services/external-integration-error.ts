import { NextResponse } from "next/server";

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

export function externalIntegrationErrorResponse({
  code,
  level,
  message,
  requestId = crypto.randomUUID(),
  retryable,
  status
}: {
  code: string;
  level: ExternalIntegrationErrorLevel;
  message: string;
  requestId?: string;
  retryable?: boolean;
  status: number;
}) {
  const body: ExternalIntegrationErrorBody = {
    ok: false,
    level,
    code,
    message,
    retryable: retryable ?? (level === "temporary" || level === "external_unavailable" || level === "degraded"),
    requestId
  };

  return NextResponse.json(body, {
    headers: {
      "cache-control": "no-store",
      "x-request-id": requestId
    },
    status
  });
}
