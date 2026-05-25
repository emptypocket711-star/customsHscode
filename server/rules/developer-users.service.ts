import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

export type AccountAccessEvent = {
  id: string;
  eventType: string;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export type ManagedUser = {
  id: string;
  email: string;
  authCreatedAt: string | null;
  lastSignInAt: string | null;
  emailConfirmedAt: string | null;
  fullName: string;
  role: "developer" | "admin" | "customs_staff" | "client";
  accountType: "personal" | "company";
  companyRole: "admin" | "member";
  allowedIpCount: number;
  onboardingCompletedAt: string | null;
  companyId: string;
  companyName: string;
  businessNo: string;
  companyType: string;
  usedLoginIps: string[];
  recentAccessEvents: AccountAccessEvent[];
};

type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: ManagedUser["role"] | null;
  company_id: string | null;
  company_role: ManagedUser["companyRole"] | null;
  account_type: ManagedUser["accountType"] | null;
  allowed_ip_count: number | null;
  onboarding_completed_at: string | null;
};

type CompanyRow = {
  id: string;
  name: string | null;
  business_no: string | null;
  type: string | null;
};

type AccountAccessEventRow = {
  id: string;
  user_id: string | null;
  email: string | null;
  event_type: string;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export async function listManagedUsers(): Promise<ManagedUser[]> {
  const supabase = createSupabaseServiceRoleClient();
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000
  });

  if (authError) throw authError;

  const users = authData.users;
  const userIds = users.map((user) => user.id);

  const profileById = new Map<string, ProfileRow>();
  const companyById = new Map<string, CompanyRow>();
  const eventsByUserId = new Map<string, AccountAccessEvent[]>();
  const eventsByEmail = new Map<string, AccountAccessEvent[]>();
  const usedIpsByUserId = new Map<string, Set<string>>();
  const usedIpsByEmail = new Map<string, Set<string>>();

  if (userIds.length > 0) {
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id,email,full_name,role,company_id,company_role,account_type,allowed_ip_count,onboarding_completed_at")
      .in("id", userIds);

    if (profileError) throw profileError;

    for (const profile of (profiles ?? []) as ProfileRow[]) {
      profileById.set(profile.id, profile);
    }

    const companyIds = Array.from(new Set((profiles ?? []).map((profile) => profile.company_id).filter(Boolean)));
    if (companyIds.length > 0) {
      const { data: companies, error: companyError } = await supabase
        .from("companies")
        .select("id,name,business_no,type")
        .in("id", companyIds);

      if (companyError) throw companyError;

      for (const company of (companies ?? []) as CompanyRow[]) {
        companyById.set(company.id, company);
      }
    }
  }

  if (userIds.length > 0 || users.some((user) => user.email)) {
    const emails = users.map((user) => user.email?.toLowerCase()).filter(Boolean) as string[];
    const eventFilters = [
      userIds.length > 0 ? `user_id.in.(${userIds.join(",")})` : "",
      emails.length > 0 ? `email.in.(${emails.map((email) => `"${email}"`).join(",")})` : ""
    ].filter(Boolean);

    if (eventFilters.length > 0) {
      const { data: events, error: eventError } = await supabase
        .from("account_access_events")
        .select("id,user_id,email,event_type,ip_address,user_agent,metadata,created_at")
        .or(eventFilters.join(","))
        .order("created_at", { ascending: false })
        .limit(500);

      if (eventError) throw eventError;

      for (const event of (events ?? []) as AccountAccessEventRow[]) {
        const normalizedEvent = {
          id: event.id,
          eventType: event.event_type,
          ipAddress: event.ip_address,
          userAgent: event.user_agent,
          metadata: event.metadata,
          createdAt: event.created_at
        } satisfies AccountAccessEvent;

        if (event.user_id) {
          const existing = eventsByUserId.get(event.user_id) ?? [];
          if (existing.length < 5) eventsByUserId.set(event.user_id, [...existing, normalizedEvent]);

          if (event.event_type === "login_success" && event.ip_address) {
            const usedIps = usedIpsByUserId.get(event.user_id) ?? new Set<string>();
            usedIps.add(event.ip_address);
            usedIpsByUserId.set(event.user_id, usedIps);
          }
        }

        if (event.email) {
          const emailKey = event.email.toLowerCase();
          const existing = eventsByEmail.get(emailKey) ?? [];
          if (existing.length < 5) eventsByEmail.set(emailKey, [...existing, normalizedEvent]);

          if (event.event_type === "login_success" && event.ip_address) {
            const usedIps = usedIpsByEmail.get(emailKey) ?? new Set<string>();
            usedIps.add(event.ip_address);
            usedIpsByEmail.set(emailKey, usedIps);
          }
        }
      }
    }
  }

  return users
    .map((user) => {
      const profile = profileById.get(user.id);
      const company = profile?.company_id ? companyById.get(profile.company_id) : undefined;
      const emailKey = (user.email ?? profile?.email ?? "").toLowerCase();
      const recentAccessEvents = eventsByUserId.get(user.id) ?? eventsByEmail.get(emailKey) ?? [];
      const usedLoginIps = Array.from(usedIpsByUserId.get(user.id) ?? usedIpsByEmail.get(emailKey) ?? []);

      return {
        id: user.id,
        email: user.email ?? profile?.email ?? "",
        authCreatedAt: user.created_at ?? null,
        lastSignInAt: user.last_sign_in_at ?? null,
        emailConfirmedAt: user.email_confirmed_at ?? null,
        fullName: profile?.full_name ?? String(user.user_metadata?.full_name ?? ""),
        role: profile?.role ?? "client",
        accountType: profile?.account_type ?? "company",
        companyRole: profile?.company_role ?? "member",
        allowedIpCount: profile?.allowed_ip_count ?? 5,
        onboardingCompletedAt: profile?.onboarding_completed_at ?? null,
        companyId: profile?.company_id ?? "",
        companyName: company?.name ?? String(user.user_metadata?.company_name ?? ""),
        businessNo: company?.business_no ?? String(user.user_metadata?.business_no ?? ""),
        companyType: company?.type ?? "",
        usedLoginIps,
        recentAccessEvents
      } satisfies ManagedUser;
    })
    .sort((a, b) => {
      const left = a.authCreatedAt ? Date.parse(a.authCreatedAt) : 0;
      const right = b.authCreatedAt ? Date.parse(b.authCreatedAt) : 0;
      return right - left;
    });
}
