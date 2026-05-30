import { afterEach, describe, expect, it, vi } from "vitest";
import { getEnvironmentHealthGroups, getExternalIntegrationHealthItems } from "@/server/operations/environment-health.service";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("environment health service", () => {
  it("shows relay and expensive external lookup controls in operations health", () => {
    const keys = getEnvironmentHealthGroups()
      .flatMap((group) => group.items)
      .map((item) => item.key);

    expect(keys).toContain("CUSTOMS_API_CARGO_PROGRESS_RELAY_URL");
    expect(keys).toContain("CUSTOMS_API_CARGO_PROGRESS_RELAY_TOKEN");
    expect(keys).toContain("CUSTOMS_API_EXCHANGE_RATE_RELAY_URL");
    expect(keys).toContain("CUSTOMS_API_EXCHANGE_RATE_RELAY_TOKEN");
    expect(keys).toContain("CUSTOMS_API_SHED_INFO_SERVICE_KEY");
    expect(keys).toContain("CONTAINER_RECEIPT_RATE_LIMIT_PER_MINUTE");
    expect(keys).toContain("TERMINAL_HELPER_RATE_LIMIT_PER_MINUTE");
    expect(keys).toContain("VEHICLE_SPEC_RATE_LIMIT_PER_MINUTE");
    expect(keys).toContain("KOTRA_OPENAPI_SERVICE_KEY");
    expect(keys).toContain("KOTRA_OVERSEAS_MARKET_NEWS_SERVICE_KEY");
    expect(keys).toContain("KOTRA_OVERSEAS_MARKET_NEWS_URL");
    expect(keys).toContain("KOTRA_OVERSEAS_MARKET_NEWS_ENDPOINT");
    expect(keys).toContain("KOTRA_USA_GLOBAL_ISSUE_URL");
    expect(keys).toContain("KOTRA_TRADE_FRAUD_CASE_URL");
    expect(keys).toContain("PUBLIC_DATA_REQUEST_TIMEOUT_MS");
  });

  it("does not expose secret values in previews", () => {
    const tokenItem = getEnvironmentHealthGroups()
      .flatMap((group) => group.items)
      .find((item) => item.key === "CUSTOMS_API_CARGO_PROGRESS_RELAY_TOKEN");

    expect(tokenItem?.valuePreview === "미설정" || tokenItem?.valuePreview === "설정됨").toBe(true);
  });

  it("summarizes API001 as relay-based when a relay URL is configured", () => {
    vi.stubEnv("CUSTOMS_API_CARGO_PROGRESS_RELAY_URL", "https://relay.example.test/cargo");
    vi.stubEnv("CUSTOMS_API_CARGO_PROGRESS_RELAY_TOKEN", "relay-token");
    vi.stubEnv("CUSTOMS_API_CARGO_PROGRESS_SERVICE_KEY", "");

    const api001 = getExternalIntegrationHealthItems().find((item) => item.key === "customs_api001");

    expect(api001?.status).toBe("ok");
    expect(api001?.path).toBe("relay 서버 경유");
    expect(api001?.configuredKeys).toEqual(expect.arrayContaining([
      "CUSTOMS_API_CARGO_PROGRESS_RELAY_URL",
      "CUSTOMS_API_CARGO_PROGRESS_RELAY_TOKEN"
    ]));
  });

  it("warns when KOTRA news has no API key but can still show non-KOTRA sources", () => {
    vi.stubEnv("KOTRA_OPENAPI_SERVICE_KEY", "");
    vi.stubEnv("KOTRA_OVERSEAS_MARKET_NEWS_SERVICE_KEY", "");
    vi.stubEnv("KOTRA_USA_GLOBAL_ISSUE_SERVICE_KEY", "");
    vi.stubEnv("KOTRA_TRADE_FRAUD_CASE_SERVICE_KEY", "");

    const kotra = getExternalIntegrationHealthItems().find((item) => item.key === "kotra_trade_news");

    expect(kotra?.status).toBe("warning");
    expect(kotra?.message).toContain("RSS");
  });
});
