"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase/server";

export type CompanyJoinRequestItem = {
  id: string;
  companyName: string | null;
  email: string;
  fullName: string;
  requestedBusinessTypes: string[];
  createdAt: string;
};

export type CompanyMemberItem = {
  id: string;
  email: string;
  fullName: string;
  companyRole: "admin" | "member";
  createdAt: string;
};

export type CompanyMembershipData = {
  canManage: boolean;
  isDeveloper: boolean;
  companyName: string | null;
  requests: CompanyJoinRequestItem[];
  members: CompanyMemberItem[];
  message?: string;
};

export type CompanyJoinReviewState = {
  status: "idle" | "success" | "error";
  message?: string;
};

const initialMessage = "회사 합류 요청을 처리했습니다.";

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export async function loadCompanyMembershipData(): Promise<CompanyMembershipData> {
  if (!hasSupabaseEnv()) {
    return {
      canManage: true,
      isDeveloper: true,
      companyName: "Mock 회사",
      requests: [],
      members: [],
      message: "Supabase 환경 변수가 없어 회사 관리 mock 화면을 표시합니다."
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      canManage: false,
      isDeveloper: false,
      companyName: null,
      requests: [],
      members: [],
      message: "로그인이 필요합니다."
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("company_id, company_role, role, companies(name)")
    .eq("id", user.id)
    .maybeSingle();

  const companyId = typeof profile?.company_id === "string" ? profile.company_id : null;
  const companyRole = typeof profile?.company_role === "string" ? profile.company_role : "member";
  const appRole = typeof profile?.role === "string" ? profile.role : "client";
  const relatedCompany = profile?.companies as { name?: unknown } | { name?: unknown }[] | null | undefined;
  const companyNameValue = Array.isArray(relatedCompany) ? relatedCompany[0]?.name : relatedCompany?.name;
  const companyName = typeof companyNameValue === "string" ? companyNameValue : null;
  const isDeveloper = appRole === "developer";
  const canManage = Boolean(companyId && (companyRole === "admin" || isDeveloper));

  if (profileError || !companyId) {
    return {
      canManage: false,
      isDeveloper,
      companyName,
      requests: [],
      members: [],
      message: "회사 정보를 확인할 수 없습니다."
    };
  }

  const [requestsResult, membersResult] = await Promise.all([
    canManage
      ? isDeveloper
        ? supabase
            .from("company_join_requests")
            .select("id, email, full_name, requested_business_types, created_at, companies(name)")
            .eq("status", "pending")
            .order("created_at", { ascending: true })
        : supabase
            .from("company_join_requests")
            .select("id, email, full_name, requested_business_types, created_at, companies(name)")
            .eq("company_id", companyId)
            .eq("status", "pending")
            .order("created_at", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("profiles")
      .select("id, email, full_name, company_role, created_at")
      .eq("company_id", companyId)
      .not("onboarding_completed_at", "is", null)
      .order("created_at", { ascending: true })
  ]);

  const requests = (requestsResult.data ?? []).map((row) => {
    const requestCompany = row.companies as { name?: unknown } | { name?: unknown }[] | null | undefined;
    const requestCompanyNameValue = Array.isArray(requestCompany) ? requestCompany[0]?.name : requestCompany?.name;

    return {
      id: String(row.id),
      companyName: typeof requestCompanyNameValue === "string" ? requestCompanyNameValue : null,
      email: String(row.email ?? "-"),
      fullName: String(row.full_name ?? "-"),
      requestedBusinessTypes: toStringArray(row.requested_business_types),
      createdAt: String(row.created_at ?? "")
    };
  });

  const members = (membersResult.data ?? []).map((row) => ({
    id: String(row.id),
    email: String(row.email ?? "-"),
    fullName: String(row.full_name ?? "-"),
    companyRole: row.company_role === "admin" ? "admin" as const : "member" as const,
    createdAt: String(row.created_at ?? "")
  }));

  return {
    canManage,
    isDeveloper,
    companyName,
    requests,
    members,
    message: requestsResult.error?.message || membersResult.error?.message
  };
}

export async function reviewCompanyJoinRequestAction(
  _previousState: CompanyJoinReviewState,
  formData: FormData
): Promise<CompanyJoinReviewState> {
  const requestId = formData.get("requestId");
  const decision = formData.get("decision");

  if (typeof requestId !== "string" || typeof decision !== "string") {
    return {
      status: "error",
      message: "처리할 합류 요청을 찾을 수 없습니다."
    };
  }

  if (decision !== "approved" && decision !== "rejected") {
    return {
      status: "error",
      message: "처리 상태가 올바르지 않습니다."
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("review_company_join_request", {
    p_decision: decision,
    p_request_id: requestId
  });

  if (error) {
    return {
      status: "error",
      message: error.message
    };
  }

  revalidatePath("/settings/members");
  revalidatePath("/", "layout");

  return {
    status: "success",
    message: decision === "approved" ? initialMessage : "회사 합류 요청을 거절했습니다."
  };
}
