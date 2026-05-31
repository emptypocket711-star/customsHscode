import { createHash } from "node:crypto";
import { createSupabaseServiceRoleClient, hasSupabaseServiceRoleEnv } from "@/lib/supabase/service-role";

function hashIdentity(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function logRateLimitExceeded(input: {
  identity: string;
  limit: number;
  metadata?: Record<string, unknown>;
  retryAfterSeconds: number;
  route: string;
  scope: string;
  userId?: string | null;
  windowMs: number;
}) {
  if (!hasSupabaseServiceRoleEnv()) return;

  try {
    const supabase = createSupabaseServiceRoleClient();
    await supabase
      .from("rate_limit_events")
      .insert({
        identity_hash: hashIdentity(input.identity),
        limit_count: input.limit,
        metadata: input.metadata ?? {},
        retry_after_seconds: input.retryAfterSeconds,
        route: input.route,
        scope: input.scope,
        user_id: input.userId ?? null,
        window_ms: input.windowMs
      });
  } catch {
    // Rate-limit telemetry must not block the protected request path.
  }
}
