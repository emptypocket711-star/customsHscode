import { hasUpstashRestEnv, upstashCommand, upstashPipeline } from "@/lib/upstash-rest";
import { createSupabaseServiceRoleClient, hasSupabaseServiceRoleEnv } from "@/lib/supabase/service-role";

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

function lookupCacheMaxEntries() {
  const parsed = Number(process.env.LOOKUP_CACHE_MAX_ENTRIES ?? 500);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 500;
}

function cacheNamespace(key: string) {
  return key.split(":", 1)[0] || "lookup";
}

function supabaseCacheNamespaces() {
  return new Set(
    (process.env.LOOKUP_SUPABASE_CACHE_NAMESPACES || "ai-product-normalization,hs-product-recommendations")
      .split(",")
      .map((namespace) => namespace.trim())
      .filter(Boolean)
  );
}

function shouldUseSupabaseCache(key: string) {
  if (!hasSupabaseServiceRoleEnv()) return false;
  return supabaseCacheNamespaces().has(cacheNamespace(key));
}

function logCacheEvent(event: "redis-hit" | "supabase-hit" | "memory-hit" | "inflight-hit" | "miss" | "set", key: string) {
  if (!shouldLogCacheEvents()) return;
  console.info("[lookup-cache]", event, { namespace: cacheNamespace(key) });
}

function pruneMemoryCache(now = Date.now()) {
  for (const [key, entry] of cacheStore.entries()) {
    if (entry.expiresAt <= now) {
      cacheStore.delete(key);
    }
  }

  const maxEntries = lookupCacheMaxEntries();
  while (cacheStore.size > maxEntries) {
    const oldestKey = cacheStore.keys().next().value as string | undefined;
    if (!oldestKey) break;
    cacheStore.delete(oldestKey);
  }
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

async function readSupabaseCache<T>(key: string, now: number): Promise<T | null> {
  if (!shouldUseSupabaseCache(key)) return null;

  const supabase = createSupabaseServiceRoleClient();
  const namespace = cacheNamespace(key);
  const { data, error } = await supabase
    .from("lookup_cache_entries")
    .select("encoded_value,expires_at")
    .eq("namespace", namespace)
    .eq("cache_key", key)
    .maybeSingle();

  if (error || !data) return null;

  if (new Date(data.expires_at).getTime() <= now) {
    void supabase
      .from("lookup_cache_entries")
      .delete()
      .eq("namespace", namespace)
      .eq("cache_key", key);
    return null;
  }

  return decodeCacheValue<T>(data.encoded_value);
}

async function writeSupabaseCache(key: string, encodedValue: string, ttlMs: number) {
  if (!shouldUseSupabaseCache(key)) return;

  const supabase = createSupabaseServiceRoleClient();
  const namespace = cacheNamespace(key);
  try {
    await supabase
      .from("lookup_cache_entries")
      .upsert({
        namespace,
        cache_key: key,
        encoded_value: encodedValue,
        expires_at: new Date(Date.now() + ttlMs).toISOString(),
        updated_at: new Date().toISOString()
      })
      .select("namespace")
      .maybeSingle();
  } catch {
    // Cache persistence is opportunistic; lookup should continue on failures.
  }
}

export function lookupCacheKey(namespace: string, input: unknown) {
  return `${namespace}:${stableStringify(input)}`;
}

export async function cachedLookup<T>({
  key,
  ttlMs,
  load,
  shouldCache = () => true,
  now = Date.now()
}: {
  key: string;
  ttlMs: number;
  load: () => Promise<T>;
  shouldCache?: (value: T) => boolean;
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

  pruneMemoryCache(now);
  const cached = cacheStore.get(key) as CacheEntry<T> | undefined;
  if (cached && cached.expiresAt > now) {
    logCacheEvent("memory-hit", key);
    return cached.value;
  }

  if (cached) {
    cacheStore.delete(key);
  }

  const supabaseCached = await readSupabaseCache<T>(key, now).catch(() => null);
  if (supabaseCached !== null) {
    cacheStore.set(key, { value: supabaseCached, expiresAt: now + ttlMs });
    pruneMemoryCache(now);
    logCacheEvent("supabase-hit", key);
    return supabaseCached;
  }

  const inflight = inflightStore.get(key) as Promise<T> | undefined;
  if (inflight) {
    logCacheEvent("inflight-hit", key);
    return inflight;
  }

  logCacheEvent("miss", key);
  const promise = load()
    .then((value) => {
      if (shouldCache(value)) {
        cacheStore.set(key, { value, expiresAt: Date.now() + ttlMs });
        pruneMemoryCache();
        logCacheEvent("set", key);
        if (hasUpstashRestEnv()) {
          const encoded = encodeCacheValue(value);
          if (encoded) {
            void upstashPipeline([
              ["SETEX", `lookup:${key}`, Math.max(1, Math.ceil(ttlMs / 1000)), encoded]
            ]).catch(() => null);
          }
        }
        if (shouldUseSupabaseCache(key)) {
          const encoded = encodeCacheValue(value);
          if (encoded) void writeSupabaseCache(key, encoded, ttlMs);
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
  decodeCacheValue,
  pruneMemoryCache
};
