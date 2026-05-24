import { describe, expect, it } from "vitest";
import { checkRateLimit, checkRateLimitAsync, rateLimitIdentity, rateLimitInternals } from "@/lib/rate-limit";

describe("rate limit", () => {
  it("allows requests inside the window and blocks after the limit", () => {
    rateLimitInternals.store.clear();

    expect(checkRateLimit({ key: "lookup:1", limit: 2, windowMs: 1000, now: 100 }).allowed).toBe(true);
    expect(checkRateLimit({ key: "lookup:1", limit: 2, windowMs: 1000, now: 200 }).allowed).toBe(true);

    const blocked = checkRateLimit({ key: "lookup:1", limit: 2, windowMs: 1000, now: 300 });
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(1);
  });

  it("resets after the configured window", () => {
    rateLimitInternals.store.clear();

    expect(checkRateLimit({ key: "lookup:2", limit: 1, windowMs: 1000, now: 100 }).allowed).toBe(true);
    expect(checkRateLimit({ key: "lookup:2", limit: 1, windowMs: 1000, now: 200 }).allowed).toBe(false);
    expect(checkRateLimit({ key: "lookup:2", limit: 1, windowMs: 1000, now: 1200 }).allowed).toBe(true);
  });

  it("builds a scoped identity without storing full user input", () => {
    expect(rateLimitIdentity({ scope: "hs", ip: "127.0.0.1", userAgent: "browser" })).toBe("hs:127.0.0.1:browser");
  });

  it("uses the memory fallback from async checks when distributed env is absent", async () => {
    rateLimitInternals.store.clear();

    expect(await checkRateLimitAsync({ key: "lookup:async", limit: 1, windowMs: 1000, now: 100 })).toMatchObject({ allowed: true });
    expect(await checkRateLimitAsync({ key: "lookup:async", limit: 1, windowMs: 1000, now: 200 })).toMatchObject({ allowed: false });
  });
});
