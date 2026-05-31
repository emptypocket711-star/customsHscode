import { checkRateLimitAsync, isRateLimitEnabled, rateLimitIdentity } from "@/lib/rate-limit";
import { createSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase/server";
import { logRateLimitExceeded } from "@/server/observability/rate-limit-events";

function clientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwardedFor || request.headers.get("x-real-ip") || "unknown";
}

export async function requireAuthenticatedApiRoute(
  request: Request,
  input: {
    scope: string;
    limit: number;
    windowMs: number;
  }
) {
  let userId = "local-dev";

  if (hasSupabaseEnv()) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error
    } = await supabase.auth.getUser();

    if (error || !user) {
      return {
        allowed: false as const,
        status: 401,
        message: "로그인이 필요한 요청입니다."
      };
    }

    userId = user.id;
  }

  if (!isRateLimitEnabled()) {
    return { allowed: true as const, userId };
  }

  const identity = rateLimitIdentity({
    scope: input.scope,
    ip: `${userId}:${clientIp(request)}`,
    userAgent: request.headers.get("user-agent")
  });
  const result = await checkRateLimitAsync({
    key: identity,
    limit: input.limit,
    windowMs: input.windowMs
  });

  if (!result.allowed) {
    await logRateLimitExceeded({
      identity,
      limit: input.limit,
      metadata: {
        method: request.method
      },
      retryAfterSeconds: result.retryAfterSeconds,
      route: new URL(request.url).pathname,
      scope: input.scope,
      userId,
      windowMs: input.windowMs
    });

    return {
      allowed: false as const,
      status: 429,
      message: `요청이 일시적으로 많습니다. ${result.retryAfterSeconds}초 후 다시 시도해 주세요.`
    };
  }

  return { allowed: true as const, userId };
}
