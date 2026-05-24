import { hasUpstashRestEnv, upstashPipeline } from "@/lib/upstash-rest";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
};

const globalStore = globalThis as typeof globalThis & {
  __customsRateLimitStore?: Map<string, RateLimitEntry>;
};

const store = globalStore.__customsRateLimitStore ?? new Map<string, RateLimitEntry>();
globalStore.__customsRateLimitStore = store;

export function checkRateLimit({
  key,
  limit,
  windowMs,
  now = Date.now()
}: {
  key: string;
  limit: number;
  windowMs: number;
  now?: number;
}): RateLimitResult {
  const current = store.get(key);

  if (!current || current.resetAt <= now) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: Math.max(0, limit - 1),
      resetAt,
      retryAfterSeconds: 0
    };
  }

  if (current.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: current.resetAt,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000))
    };
  }

  current.count += 1;
  return {
    allowed: true,
    remaining: Math.max(0, limit - current.count),
    resetAt: current.resetAt,
    retryAfterSeconds: 0
  };
}

export async function checkRateLimitAsync({
  key,
  limit,
  windowMs,
  now = Date.now()
}: {
  key: string;
  limit: number;
  windowMs: number;
  now?: number;
}): Promise<RateLimitResult> {
  if (!hasUpstashRestEnv()) {
    return checkRateLimit({ key, limit, windowMs, now });
  }

  try {
    const redisKey = `rate:${key}`;
    const windowSeconds = Math.max(1, Math.ceil(windowMs / 1000));
    const response = await upstashPipeline([
      ["INCR", redisKey],
      ["EXPIRE", redisKey, windowSeconds],
      ["TTL", redisKey]
    ]);
    const count = Number(response?.[0]?.result ?? 0);
    const ttlSeconds = Math.max(1, Number(response?.[2]?.result ?? windowSeconds));
    const resetAt = now + ttlSeconds * 1000;

    if (!Number.isFinite(count) || count <= 0) {
      return checkRateLimit({ key, limit, windowMs, now });
    }

    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
      resetAt,
      retryAfterSeconds: count <= limit ? 0 : ttlSeconds
    };
  } catch {
    return checkRateLimit({ key, limit, windowMs, now });
  }
}

export function rateLimitIdentity(input: { ip?: string | null; userAgent?: string | null; scope: string }) {
  const ip = input.ip?.trim() || "unknown-ip";
  const agent = input.userAgent?.slice(0, 80) || "unknown-agent";
  return `${input.scope}:${ip}:${agent}`;
}

export function isRateLimitEnabled() {
  if (process.env.RATE_LIMIT_ENABLED === "false") return false;
  if (process.env.RATE_LIMIT_ENABLED === "true") return true;
  return process.env.NODE_ENV === "production";
}

export const rateLimitInternals = {
  store
};
