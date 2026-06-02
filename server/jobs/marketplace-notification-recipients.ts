import type { SupabaseClient } from "@supabase/supabase-js";

type MarketplaceNotificationRecipientRow = {
  company_id: string | null;
  company_role: "admin" | "member" | string | null;
  email: string | null;
  id: string;
  onboarding_completed_at: string | null;
  role: string | null;
};

type MarketplaceNotificationPreferenceRow = {
  channel: "email" | string | null;
  enabled: boolean | null;
  notification_kind: MarketplaceNotificationPreferenceKind | string | null;
  profile_id: string | null;
};

export type MarketplaceNotificationPreferenceKind = "deadline_reminder" | "initial";

export type MarketplaceNotificationRecipient = {
  companyRole: "admin" | "member" | string | null;
  email: string;
  userId: string;
};

type MarketplaceNotificationRecipientOptions = {
  candidateLimit?: number;
  limit?: number;
  requireEmailOptInForKind?: MarketplaceNotificationPreferenceKind;
};

function isUsableEmail(value: string | null | undefined) {
  return Boolean(value && value.includes("@") && !value.includes(" "));
}

function buildEnabledEmailPreferenceSet(
  preferences: MarketplaceNotificationPreferenceRow[] | undefined,
  notificationKind: MarketplaceNotificationPreferenceKind | undefined
) {
  if (!notificationKind) return null;

  return new Set(
    (preferences ?? [])
      .filter((preference) =>
        preference.channel === "email" &&
        preference.notification_kind === notificationKind &&
        preference.enabled === true &&
        typeof preference.profile_id === "string"
      )
      .map((preference) => preference.profile_id as string)
  );
}

export function mapMarketplaceNotificationRecipients(
  rows: MarketplaceNotificationRecipientRow[],
  partnerCompanyId: string,
  options: {
    preferences?: MarketplaceNotificationPreferenceRow[];
    requireEmailOptInForKind?: MarketplaceNotificationPreferenceKind;
  } = {}
): MarketplaceNotificationRecipient[] {
  const enabledEmailPreferenceSet = buildEnabledEmailPreferenceSet(
    options.preferences,
    options.requireEmailOptInForKind
  );

  return rows
    .filter((row) =>
      row.company_id === partnerCompanyId &&
      row.role === "client" &&
      Boolean(row.onboarding_completed_at) &&
      isUsableEmail(row.email) &&
      (!enabledEmailPreferenceSet || enabledEmailPreferenceSet.has(row.id))
    )
    .map((row) => ({
      companyRole: row.company_role,
      email: row.email as string,
      userId: row.id
    }))
    .sort((left, right) => {
      if (left.companyRole === right.companyRole) return left.email.localeCompare(right.email);
      if (left.companyRole === "admin") return -1;
      if (right.companyRole === "admin") return 1;
      return String(left.companyRole ?? "").localeCompare(String(right.companyRole ?? ""));
    });
}

export async function listMarketplaceNotificationRecipientsForPartner(
  supabase: SupabaseClient,
  partnerCompanyId: string,
  options: MarketplaceNotificationRecipientOptions = {}
): Promise<MarketplaceNotificationRecipient[]> {
  const limit = options.limit ?? 5;
  const candidateLimit = options.requireEmailOptInForKind
    ? (options.candidateLimit ?? Math.max(limit * 20, 25))
    : limit;
  const { data, error } = await supabase
    .from("profiles")
    .select("id,email,company_id,company_role,role,onboarding_completed_at")
    .eq("company_id", partnerCompanyId)
    .eq("role", "client")
    .not("email", "is", null)
    .not("onboarding_completed_at", "is", null)
    .order("company_role", { ascending: true })
    .order("email", { ascending: true })
    .limit(candidateLimit);

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as MarketplaceNotificationRecipientRow[];
  const userIds = rows.map((row) => row.id);
  let preferences: MarketplaceNotificationPreferenceRow[] | undefined;

  if (options.requireEmailOptInForKind && userIds.length > 0) {
    const { data: preferenceRows, error: preferenceError } = await supabase
      .from("marketplace_notification_preferences")
      .select("profile_id,channel,notification_kind,enabled")
      .in("profile_id", userIds)
      .eq("channel", "email")
      .eq("notification_kind", options.requireEmailOptInForKind)
      .eq("enabled", true);

    if (preferenceError) throw new Error(preferenceError.message);
    preferences = (preferenceRows ?? []) as MarketplaceNotificationPreferenceRow[];
  }

  return mapMarketplaceNotificationRecipients(
    rows,
    partnerCompanyId,
    {
      preferences,
      requireEmailOptInForKind: options.requireEmailOptInForKind
    }
  ).slice(0, limit);
}
