import type { SupabaseClient } from "@supabase/supabase-js";

type MarketplaceNotificationRecipientRow = {
  company_id: string | null;
  company_role: "admin" | "member" | string | null;
  email: string | null;
  id: string;
  onboarding_completed_at: string | null;
  role: string | null;
};

export type MarketplaceNotificationRecipient = {
  companyRole: "admin" | "member" | string | null;
  email: string;
  userId: string;
};

function isUsableEmail(value: string | null | undefined) {
  return Boolean(value && value.includes("@") && !value.includes(" "));
}

export function mapMarketplaceNotificationRecipients(
  rows: MarketplaceNotificationRecipientRow[],
  partnerCompanyId: string
): MarketplaceNotificationRecipient[] {
  return rows
    .filter((row) =>
      row.company_id === partnerCompanyId &&
      row.role === "client" &&
      Boolean(row.onboarding_completed_at) &&
      isUsableEmail(row.email)
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
  options: { limit?: number } = {}
): Promise<MarketplaceNotificationRecipient[]> {
  const limit = options.limit ?? 5;
  const { data, error } = await supabase
    .from("profiles")
    .select("id,email,company_id,company_role,role,onboarding_completed_at")
    .eq("company_id", partnerCompanyId)
    .eq("role", "client")
    .not("email", "is", null)
    .not("onboarding_completed_at", "is", null)
    .order("company_role", { ascending: true })
    .order("email", { ascending: true })
    .limit(limit);

  if (error) throw new Error(error.message);

  return mapMarketplaceNotificationRecipients(
    (data ?? []) as MarketplaceNotificationRecipientRow[],
    partnerCompanyId
  );
}
