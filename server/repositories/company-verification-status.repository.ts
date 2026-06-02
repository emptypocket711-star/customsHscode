import type { SupabaseClient } from "@supabase/supabase-js";
import {
  readMarketplaceRoleIntentsFromUserMetadata,
  type MarketplacePartyType
} from "@/server/repositories/company-marketplace.repository";

export type CompanyVerificationDocumentItem = {
  id: string;
  documentType: string;
  fileName: string;
  status: string;
  createdAt: string;
  reviewedAt: string | null;
};

export type CompanyVerificationDashboard = {
  companyId: string | null;
  companyName: string | null;
  accountType: string;
  companyRole: string;
  roleIntents: MarketplacePartyType[];
  verificationStatus: string;
  trustScore: number;
  documents: CompanyVerificationDocumentItem[];
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

export async function getCompanyVerificationDashboard(
  supabase: SupabaseClient
): Promise<CompanyVerificationDashboard> {
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("로그인 후 회사 검증 상태를 확인할 수 있습니다.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("company_id,account_type,company_role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.company_id) {
    throw new Error("회사 프로필을 확인할 수 없습니다.");
  }

  const baseDashboard = {
    accountType: String(profile.account_type ?? "company"),
    companyId: String(profile.company_id),
    companyName: null,
    companyRole: String(profile.company_role ?? "member"),
    documents: [],
    roleIntents: readMarketplaceRoleIntentsFromUserMetadata(user.user_metadata as Record<string, unknown>),
    schemaReady: false,
    trustScore: 0,
    verificationStatus: "unverified"
  } satisfies CompanyVerificationDashboard;

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("id,name,verification_status,trust_score")
    .eq("id", profile.company_id)
    .maybeSingle();

  if (companyError) {
    if (!isMissingMarketplaceSchemaError(companyError)) throw new Error(companyError.message);

    const { data: fallbackCompany } = await supabase
      .from("companies")
      .select("id,name")
      .eq("id", profile.company_id)
      .maybeSingle();

    return {
      ...baseDashboard,
      companyName: fallbackCompany?.name ? String(fallbackCompany.name) : null
    };
  }

  const { data: documents, error: documentsError } = await supabase
    .from("company_verification_documents")
    .select("id,document_type,file_name,status,created_at,reviewed_at")
    .order("created_at", { ascending: false })
    .limit(10);

  if (documentsError && !isMissingMarketplaceSchemaError(documentsError)) {
    throw new Error(documentsError.message);
  }

  return {
    ...baseDashboard,
    companyName: company?.name ? String(company.name) : null,
    documents: (documents ?? []).map((document) => ({
      id: String(document.id),
      documentType: String(document.document_type ?? ""),
      fileName: String(document.file_name ?? ""),
      status: String(document.status ?? "submitted"),
      createdAt: String(document.created_at ?? ""),
      reviewedAt: document.reviewed_at ? String(document.reviewed_at) : null
    })),
    schemaReady: !documentsError,
    trustScore: Number(company?.trust_score ?? 0),
    verificationStatus: String(company?.verification_status ?? "unverified")
  };
}
