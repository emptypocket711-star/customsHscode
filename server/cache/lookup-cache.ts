import { hasUpstashRestEnv, upstashCommand, upstashPipeline } from "@/lib/upstash-rest";

type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

const globalStore = globalThis as typeof globalThis & {
  __customsLookupCacheStore?: Map<string, CacheEntry<unknown>>;
  __customsLookupInflightStore?: Map<string, Promise<unknown>>;
};

const cacheStore = globalStore.__customsLookupCacheStore ?? new Map<string, CacheEntry<unknown>>();
const inflightStore = globalStore.__customsLookupInflightStore ?? new Map<string, Promise<unknown>>();

globalStore.__customsLookupCacheStore = cacheStore;
globalStore.__customsLookupInflightStore = inflightStore;

function shouldLogCacheEvents() {
  return process.env.LOOKUP_CACHE_DEBUG === "1" || process.env.LOOKUP_CACHE_DEBUG === "true";
}

function cacheNamespace(key: string) {
  return key.split(":", 1)[0] || "lookup";
}

function logCacheEvent(event: "redis-hit" | "memory-hit" | "inflight-hit" | "miss" | "set", key: string) {
  if (!shouldLogCacheEvents()) return;
  console.info("[lookup-cache]", event, { namespace: cacheNamespace(key) });
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

function encodeCacheValue(value: unknown): string | null {
  try {
    return JSON.stringify(value, (_key, item) => {
      if (item instanceof Map) {
        return {
          __customsCacheType: "Map",
          entries: Array.from(item.entries())
        };
      }

      return item;
    });
  } catch {
    return null;
  }
}

function decodeCacheValue<T>(value: unknown): T | null {
  if (typeof value !== "string") return null;

  try {
    return JSON.parse(value, (_key, item) => {
      if (item && typeof item === "object" && item.__customsCacheType === "Map" && Array.isArray(item.entries)) {
        return new Map(item.entries);
      }

      return item;
    }) as T;
  } catch {
    return null;
  }
}

export function lookupCacheKey(namespace: string, input: unknown) {
  return `${namespace}:${stableStringify(input)}`;
}

export async function cachedLookup<T>({
  key,
  ttlMs,
  load,
  now = Date.now()
}: {
  key: string;
  ttlMs: number;
  load: () => Promise<T>;
  now?: number;
}): Promise<T> {
  if (hasUpstashRestEnv()) {
    const redisKey = `lookup:${key}`;
    const cachedValue = await upstashCommand(["GET", redisKey]).catch(() => null);
    const decodedValue = decodeCacheValue<T>(cachedValue);
    if (decodedValue !== null) {
      logCacheEvent("redis-hit", key);
      return decodedValue;
    }
  }

  const cached = cacheStore.get(key) as CacheEntry<T> | undefined;
  if (cached && cached.expiresAt > now) {
    logCacheEvent("memory-hit", key);
    return cached.value;
  }

  const inflight = inflightStore.get(key) as Promise<T> | undefined;
  if (inflight) {
    logCacheEvent("inflight-hit", key);
    return inflight;
  }

  logCacheEvent("miss", key);
  const promise = load()
    .then((value) => {
      cacheStore.set(key, { value, expiresAt: Date.now() + ttlMs });
      logCacheEvent("set", key);
      if (hasUpstashRestEnv()) {
        const encoded = encodeCacheValue(value);
        if (encoded) {
          void upstashPipeline([
            ["SETEX", `lookup:${key}`, Math.max(1, Math.ceil(ttlMs / 1000)), encoded]
          ]).catch(() => null);
        }
      }
      return value;
    })
    .finally(() => {
      inflightStore.delete(key);
    });

  inflightStore.set(key, promise);
  return promise;
}

export function clearLookupCache() {
  cacheStore.clear();
  inflightStore.clear();
}

export const lookupCacheInternals = {
  cacheStore,
  inflightStore,
  stableStringify,
  encodeCacheValue,
  decodeCacheValue
};
