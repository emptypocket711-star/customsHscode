import { describe, expect, it } from "vitest";
import { externalIntegrationErrorResponse } from "./external-integration-error";

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
});
