import { describe, expect, it } from "vitest";
import { cachedLookup, clearLookupCache, lookupCacheInternals, lookupCacheKey } from "@/server/cache/lookup-cache";

describe("lookup cache", () => {
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

  it("encodes and decodes Map values for distributed cache compatibility", () => {
    const encoded = lookupCacheInternals.encodeCacheValue(new Map([["3304991000", [{ rate: "8%" }]]]));
    const decoded = lookupCacheInternals.decodeCacheValue<Map<string, Array<{ rate: string }>>>(encoded);

    expect(decoded).toBeInstanceOf(Map);
    expect(decoded?.get("3304991000")).toEqual([{ rate: "8%" }]);
  });
});
