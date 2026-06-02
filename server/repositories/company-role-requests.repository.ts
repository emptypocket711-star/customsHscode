import type { SupabaseClient } from "@supabase/supabase-js";
import type { CompanyRoleRequestInput } from "@/features/company-verification/company-role-request-schemas";

export type CompanyRoleRequestItem = {
  id: string;
  createdAt: string;
  reason: string | null;
  requestedPartyTypes: string[];
  status: string;
};

export type CompanyRoleRequestsDashboard = {
  companyId: string;
  companyRole: string;
  requests: CompanyRoleRequestItem[];
  schemaReady: boolean;
};

function isMissingMarketplaceSchemaError(error: { code?: string; message?: string }) {
  const message = error.message ?? "";
  return (
    error.code === "42703" ||
    error.code === "42P01" ||
    (error.code === "PGRST205" && message.toLowerCase().includes("schema cache"))
  );
}

async function currentCompanyAdminProfile(supabase: SupabaseClient) {
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user?.id) {
    throw new Error("로그인 후 회사 역할을 신청할 수 있습니다.");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("company_id,company_role")
    .eq("id", user.id)
    .single();

  if (error || !profile?.company_id) {
    throw new Error("회사 프로필을 확인할 수 없습니다.");
  }

  if (profile.company_role !== "admin") {
    throw new Error("회사 관리자만 플랫폼 역할을 신청할 수 있습니다.");
  }

  return {
    companyId: String(profile.company_id),
    companyRole: String(profile.company_role),
    userId: user.id
  };
}

export async function getCompanyRoleRequestsDashboard(
  supabase: SupabaseClient
): Promise<CompanyRoleRequestsDashboard> {
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user?.id) {
    throw new Error("로그인 후 회사 역할 신청 상태를 확인할 수 있습니다.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("company_id,company_role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.company_id) {
    throw new Error("회사 프로필을 확인할 수 없습니다.");
  }

  const base = {
    companyId: String(profile.company_id),
    companyRole: String(profile.company_role ?? "member"),
    requests: [],
    schemaReady: false
  } satisfies CompanyRoleRequestsDashboard;

  const { data, error } = await supabase
    .from("company_party_type_requests")
    .select("id,requested_party_types,reason,status,created_at")
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    if (isMissingMarketplaceSchemaError(error)) return base;
    throw new Error(error.message);
  }

  return {
    ...base,
    requests: (data ?? []).map((row) => ({
      id: String(row.id),
      createdAt: String(row.created_at ?? ""),
      reason: row.reason ? String(row.reason) : null,
      requestedPartyTypes: Array.isArray(row.requested_party_types) ? row.requested_party_types.map(String) : [],
      status: String(row.status ?? "submitted")
    })),
    schemaReady: true
  };
}

export async function createCompanyRoleRequest(
  supabase: SupabaseClient,
  input: CompanyRoleRequestInput
) {
  const profile = await currentCompanyAdminProfile(supabase);
  const { data, error } = await supabase
    .from("company_party_type_requests")
    .insert({
      company_id: profile.companyId,
      reason: input.reason ?? null,
      requested_by: profile.userId,
      requested_party_types: input.requestedPartyTypes,
      status: "submitted"
    })
    .select("id,company_id,requested_by,requested_party_types,status")
    .single();

  if (error) {
    if (isMissingMarketplaceSchemaError(error)) {
      throw new Error("플랫폼 역할 신청 데이터베이스가 아직 적용되지 않았습니다.");
    }
    throw new Error(error.message);
  }

  return {
    companyId: String(data.company_id),
    requestedBy: String(data.requested_by),
    requestedPartyTypes: Array.isArray(data.requested_party_types) ? data.requested_party_types.map(String) : [],
    requestId: String(data.id),
    status: String(data.status ?? "submitted")
  };
}
