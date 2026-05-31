import { describe, expect, it } from "vitest";
import { summarizeRateLimitEvents, type RateLimitEventItem } from "@/server/repositories/rate-limit-event.repository";

function event(overrides: Partial<RateLimitEventItem>): RateLimitEventItem {
  return {
    createdAt: "2026-05-31T00:00:00.000Z",
    id: crypto.randomUUID(),
    limitCount: 20,
    metadata: {},
    retryAfterSeconds: 30,
    route: "/api/external/container-receipt",
    scope: "container-receipt",
    userId: null,
    windowMs: 60_000,
    ...overrides
  };
}

describe("rate limit event repository helpers", () => {
  it("summarizes recent rate limit events by route without raw identity data", () => {
    const summary = summarizeRateLimitEvents([
      event({ createdAt: "2026-05-31T00:02:00.000Z" }),
      event({ createdAt: "2026-05-31T00:01:00.000Z" }),
      event({
        createdAt: "2026-05-31T00:03:00.000Z",
        route: "/used-car-export/vehicle-spec",
        scope: "vehicle-spec"
      })
    ]);

    expect(summary.total).toBe(3);
    expect(summary.latestAt).toBe("2026-05-31T00:03:00.000Z");
    expect(summary.routes).toEqual([
      {
        latestAt: "2026-05-31T00:02:00.000Z",
        route: "/api/external/container-receipt",
        scope: "container-receipt",
        total: 2
      },
      {
        latestAt: "2026-05-31T00:03:00.000Z",
        route: "/used-car-export/vehicle-spec",
        scope: "vehicle-spec",
        total: 1
      }
    ]);
  });
});
