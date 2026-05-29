import { describe, expect, it } from "vitest";
import { getEnvironmentHealthGroups } from "@/server/operations/environment-health.service";

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
  });

  it("does not expose secret values in previews", () => {
    const tokenItem = getEnvironmentHealthGroups()
      .flatMap((group) => group.items)
      .find((item) => item.key === "CUSTOMS_API_CARGO_PROGRESS_RELAY_TOKEN");

    expect(tokenItem?.valuePreview === "미설정" || tokenItem?.valuePreview === "설정됨").toBe(true);
  });
});
