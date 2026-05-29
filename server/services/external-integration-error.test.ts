import { describe, expect, it } from "vitest";
import {
  buildExternalIntegrationError,
  externalIntegrationErrorResponse,
  publicDataFetchErrorToExternalError
} from "./external-integration-error";
import { PublicDataFetchError } from "@/server/integrations/public-data/client";

describe("externalIntegrationErrorResponse", () => {
  it("returns a source-safe JSON error contract", async () => {
    const response = externalIntegrationErrorResponse({
      code: "terminal_capture_failed",
      level: "external_unavailable",
      message: "터미널 원문 화면을 불러오지 못했습니다.",
      requestId: "req-test",
      status: 502
    });

    expect(response.status).toBe(502);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-request-id")).toBe("req-test");

    const body = await response.json();
    expect(body).toEqual({
      ok: false,
      level: "external_unavailable",
      code: "terminal_capture_failed",
      message: "터미널 원문 화면을 불러오지 못했습니다.",
      retryable: true,
      requestId: "req-test"
    });
  });

  it("does not mark input errors as retryable by default", async () => {
    const response = externalIntegrationErrorResponse({
      code: "invalid_container_no",
      level: "input",
      message: "컨테이너 번호 형식이 올바르지 않습니다.",
      requestId: "req-input",
      status: 400
    });

    await expect(response.json()).resolves.toMatchObject({
      retryable: false,
      requestId: "req-input"
    });
  });

  it("builds a reusable action error body without NextResponse", () => {
    expect(buildExternalIntegrationError({
      code: "api012_timeout",
      level: "temporary",
      message: "관세환율 API012 응답 시간이 초과되었습니다.",
      requestId: "req-action"
    })).toEqual({
      ok: false,
      level: "temporary",
      code: "api012_timeout",
      message: "관세환율 API012 응답 시간이 초과되었습니다.",
      retryable: true,
      requestId: "req-action"
    });
  });

  it("maps public data failures to external error diagnostics", () => {
    const mapped = publicDataFetchErrorToExternalError({
      error: new PublicDataFetchError({
        category: "outbound_port",
        endpointHost: "unipass.customs.go.kr",
        endpointPort: "38010",
        causeCode: "ECONNRESET",
        causeMessage: "read ECONNRESET"
      }),
      serviceCode: "API001",
      serviceName: "관세청 API001"
    });

    expect(mapped.body).toMatchObject({
      code: "api001_outbound_port",
      level: "external_unavailable",
      retryable: true
    });
    expect(mapped.diagnostic).toEqual({
      category: "outbound_port",
      endpoint: "unipass.customs.go.kr:38010",
      detail: "ECONNRESET / read ECONNRESET"
    });
  });
});
