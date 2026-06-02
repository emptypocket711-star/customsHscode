import { headers } from "next/headers";
import { createSupabaseServiceRoleClient, hasSupabaseServiceRoleEnv } from "@/lib/supabase/service-role";

type AccountEventType =
  | "login_success"
  | "login_failure"
  | "signup_otp_requested"
  | "signup_email_verified"
  | "signup_completed"
  | "password_reset_requested"
  | "password_updated"
  | "sign_out";

function normalizeIp(value: string | null) {
  if (!value) return null;
  return value.split(",")[0]?.trim() || null;
}

export async function getRequestClientInfo() {
  const headersList = await headers();
  return {
    ipAddress:
      normalizeIp(headersList.get("x-forwarded-for")) ||
      normalizeIp(headersList.get("x-real-ip")) ||
      normalizeIp(headersList.get("cf-connecting-ip")),
    userAgent: headersList.get("user-agent") || null
  };
}

export async function recordAccountAccessEvent(input: {
  eventType: AccountEventType;
  userId?: string | null;
  email?: string | null;
  companyId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  if (!hasSupabaseServiceRoleEnv()) return;

  const { ipAddress, userAgent } = await getRequestClientInfo();
  const supabase = createSupabaseServiceRoleClient();

  await supabase.from("account_access_events").insert({
    user_id: input.userId || null,
    email: input.email || null,
    company_id: input.companyId || null,
    event_type: input.eventType,
    ip_address: ipAddress,
    user_agent: userAgent,
    metadata: input.metadata || {}
  });
}

export async function recordAuditLog(input: {
  action: string;
  actorId?: string | null;
  companyId?: string | null;
  targetTable: string;
  targetId?: string | null;
  before?: unknown;
  after?: unknown;
  throwOnError?: boolean;
}) {
  if (!hasSupabaseServiceRoleEnv()) return;

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.from("audit_logs").insert({
    actor_id: input.actorId || null,
    company_id: input.companyId || null,
    action: input.action,
    target_table: input.targetTable,
    target_id: input.targetId || null,
    before_json: input.before ?? null,
    after_json: input.after ?? null
  });

  if (error && input.throwOnError) {
    throw error;
  }
}
