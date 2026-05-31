import { afterEach, describe, expect, it, vi } from "vitest";
import { cachedLookup, clearLookupCache, lookupCacheInternals, lookupCacheKey } from "@/server/cache/lookup-cache";

describe("lookup cache", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    clearLookupCache();
  });

  it("builds stable keys regardless of object key order", () => {
    expect(lookupCacheKey("hs", { b: 2, a: 1 })).toBe(lookupCacheKey("hs", { a: 1, b: 2 }));
  });

  it("caches values until ttl expiry", async () => {
    clearLookupCache();
    let calls = 0;

    const first = await cachedLookup({
      key: "test:ttl",
      ttlMs: 1000,
      now: 100,
      load: async () => {
        calls += 1;
        return "value";
      }
    });
    const second = await cachedLookup({
      key: "test:ttl",
      ttlMs: 1000,
      now: Date.now(),
      load: async () => {
        calls += 1;
        return "new";
      }
    });

    expect(first).toBe("value");
    expect(second).toBe("value");
    expect(calls).toBe(1);
  });

  it("deduplicates concurrent loads", async () => {
    clearLookupCache();
    let calls = 0;
    const load = async () => {
      calls += 1;
      return ["row"];
    };

    const [left, right] = await Promise.all([
      cachedLookup({ key: "test:inflight", ttlMs: 1000, load }),
      cachedLookup({ key: "test:inflight", ttlMs: 1000, load })
    ]);

    expect(left).toEqual(["row"]);
    expect(right).toEqual(["row"]);
    expect(calls).toBe(1);
    expect(lookupCacheInternals.inflightStore.size).toBe(0);
  });

  it("can skip caching loaded values while still returning them", async () => {
    clearLookupCache();
    let calls = 0;

    const first = await cachedLookup({
      key: "test:skip",
      ttlMs: 1000,
      load: async () => {
        calls += 1;
        return "empty";
      },
      shouldCache: () => false
    });
    const second = await cachedLookup({
      key: "test:skip",
      ttlMs: 1000,
      load: async () => {
        calls += 1;
        return "loaded-again";
      },
      shouldCache: () => false
    });

    expect(first).toBe("empty");
    expect(second).toBe("loaded-again");
    expect(calls).toBe(2);
    expect(lookupCacheInternals.cacheStore.has("test:skip")).toBe(false);
  });

  it("can assign a shorter ttl based on the loaded value", async () => {
    clearLookupCache();

    await cachedLookup({
      key: "test:value-ttl",
      ttlMs: 1000,
      load: async () => [] as string[],
      valueTtlMs: (value) => value.length ? 1000 : 100
    });

    const entry = lookupCacheInternals.cacheStore.get("test:value-ttl");

    expect(entry?.expiresAt).toBeLessThanOrEqual(Date.now() + 100);
  });

  it("encodes and decodes Map values for distributed cache compatibility", () => {
    const encoded = lookupCacheInternals.encodeCacheValue(new Map([["3304991000", [{ rate: "8%" }]]]));
    const decoded = lookupCacheInternals.decodeCacheValue<Map<string, Array<{ rate: string }>>>(encoded);

    expect(decoded).toBeInstanceOf(Map);
    expect(decoded?.get("3304991000")).toEqual([{ rate: "8%" }]);
  });

  it("removes expired memory entries before serving a lookup", async () => {
    clearLookupCache();
    lookupCacheInternals.cacheStore.set("test:expired", { value: "old", expiresAt: 100 });

    const value = await cachedLookup({
      key: "test:fresh",
      ttlMs: 1000,
      now: 200,
      load: async () => "fresh"
    });

    expect(value).toBe("fresh");
    expect(lookupCacheInternals.cacheStore.has("test:expired")).toBe(false);
  });

  it("caps memory entries to avoid unbounded growth", async () => {
    clearLookupCache();
    vi.stubEnv("LOOKUP_CACHE_MAX_ENTRIES", "2");

    await cachedLookup({ key: "test:first", ttlMs: 1000, load: async () => "first" });
    await cachedLookup({ key: "test:second", ttlMs: 1000, load: async () => "second" });
    await cachedLookup({ key: "test:third", ttlMs: 1000, load: async () => "third" });

    expect(lookupCacheInternals.cacheStore.size).toBe(2);
    expect(lookupCacheInternals.cacheStore.has("test:first")).toBe(false);
    expect(lookupCacheInternals.cacheStore.has("test:second")).toBe(true);
    expect(lookupCacheInternals.cacheStore.has("test:third")).toBe(true);
  });
});
