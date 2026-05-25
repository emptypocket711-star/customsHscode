import { cookies, headers } from "next/headers";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

const activeSessionCookieName = "hs_finder_active_session";
const persistentSessionMaxAge = 400 * 24 * 60 * 60;

type AccountType = "personal" | "company";

function cookieOptions(maxAge?: number) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    ...(maxAge ? { maxAge } : {})
  };
}

async function getRequestClientInfo() {
  const headersList = await headers();
  const forwardedFor = headersList.get("x-forwarded-for")?.split(",")[0]?.trim();
  return {
    ipAddress: forwardedFor || headersList.get("x-real-ip") || headersList.get("cf-connecting-ip"),
    userAgent: headersList.get("user-agent")
  };
}

export async function activateUserSession({
  accountType,
  email,
  rememberSession,
  userId
}: {
  accountType: AccountType;
  email?: string | null;
  rememberSession: boolean;
  userId: string;
}) {
  const sessionId = crypto.randomUUID();
  const { ipAddress, userAgent } = await getRequestClientInfo();
  const supabase = createSupabaseServiceRoleClient();

  const { error } = await supabase.from("active_user_sessions").upsert(
    {
      account_type: accountType,
      email: email ?? null,
      ip_address: ipAddress,
      session_id: sessionId,
      updated_at: new Date().toISOString(),
      user_agent: userAgent,
      user_id: userId
    },
    { onConflict: "user_id" }
  );

  if (error) throw new Error(error.message);

  const cookieStore = await cookies();
  cookieStore.set(activeSessionCookieName, sessionId, cookieOptions(rememberSession ? persistentSessionMaxAge : undefined));
}

export async function clearActiveUserSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(activeSessionCookieName);
}

export async function validatePersonalActiveSession({
  accountType,
  userId
}: {
  accountType: AccountType | null;
  userId: string;
}) {
  if (accountType !== "personal") {
    return { valid: true as const };
  }

  const cookieStore = await cookies();
  const sessionId = cookieStore.get(activeSessionCookieName)?.value;
  if (!sessionId) {
    return { valid: false as const, reason: "missing_session_cookie" };
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("active_user_sessions")
    .select("session_id")
    .eq("user_id", userId)
    .maybeSingle<{ session_id: string }>();

  if (error) {
    return { valid: false as const, reason: "session_lookup_failed" };
  }

  if (!data?.session_id || data.session_id !== sessionId) {
    return { valid: false as const, reason: "session_replaced" };
  }

  return { valid: true as const };
}

export async function checkCompanyIpAllowance({
  accountType,
  allowedIpCount,
  userId
}: {
  accountType: AccountType | null;
  allowedIpCount: number | null;
  userId: string;
}) {
  if (accountType !== "company") {
    return { allowed: true as const };
  }

  const { ipAddress } = await getRequestClientInfo();
  if (!ipAddress || ipAddress === "unknown") {
    return { allowed: true as const };
  }

  const maxIpCount = Math.max(1, allowedIpCount ?? 5);
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("account_access_events")
    .select("ip_address")
    .eq("user_id", userId)
    .eq("event_type", "login_success")
    .not("ip_address", "is", null)
    .limit(1000);

  if (error) {
    return { allowed: true as const, warning: "ip_lookup_failed" };
  }

  const usedIps = new Set((data ?? []).map((event) => event.ip_address).filter(Boolean) as string[]);
  if (usedIps.has(ipAddress) || usedIps.size < maxIpCount) {
    return { allowed: true as const };
  }

  return {
    allowed: false as const,
    currentIp: ipAddress,
    maxIpCount,
    usedIpCount: usedIps.size
  };
}
