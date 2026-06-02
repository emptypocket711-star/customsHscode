import { createSupabaseServiceRoleClient, hasSupabaseServiceRoleEnv } from "@/lib/supabase/service-role";
import { companyVerificationDocumentsBucket } from "@/server/repositories/company-verification.repository";

export type CompanyVerificationReviewQueueItem = {
  id: string;
  companyId: string;
  companyName: string;
  businessNo: string | null;
  verificationStatus: string;
  trustScore: number;
  documentType: string;
  fileName: string;
  mimeType: string | null;
  fileSize: number | null;
  checksum: string | null;
  status: string;
  createdAt: string;
  reviewNote: string | null;
  signedUrl: string | null;
};

export type CompanyVerificationReviewQueue = {
  schemaReady: boolean;
  items: CompanyVerificationReviewQueueItem[];
};

export type CompanyOperationsCompanyItem = {
  id: string;
  name: string;
  businessNo: string | null;
  countryCode: string | null;
  createdAt: string;
  partyTypes: string[];
  trustScore: number;
  verificationStatus: string;
  verifiedAt: string | null;
};

export type CompanyOperationsCompanyList = {
  schemaReady: boolean;
  items: CompanyOperationsCompanyItem[];
};

export type CompanyRoleRequestReviewQueueItem = {
  id: string;
  businessNo: string | null;
  companyId: string;
  companyName: string;
  createdAt: string;
  reason: string | null;
  requestedByEmail: string | null;
  requestedByName: string | null;
  requestedPartyTypes: string[];
  reviewNote: string | null;
  reviewedAt: string | null;
  status: string;
  verificationStatus: string;
};

export type CompanyRoleRequestReviewQueue = {
  schemaReady: boolean;
  items: CompanyRoleRequestReviewQueueItem[];
};

type CompanyVerificationDocumentRow = {
  id: string;
  company_id: string;
  companies?: {
    business_no: string | null;
    name: string | null;
    trust_score: number | null;
    verification_status: string | null;
  } | Array<{
    business_no: string | null;
    name: string | null;
    trust_score: number | null;
    verification_status: string | null;
  }> | null;
  document_type: string;
  file_name: string;
  storage_bucket: string;
  storage_path: string;
  mime_type: string | null;
  file_size: number | null;
  checksum: string | null;
  status: string;
  created_at: string;
  review_note: string | null;
};

function firstCompany(row: CompanyVerificationDocumentRow) {
  return Array.isArray(row.companies) ? row.companies[0] : row.companies;
}

function isMissingVerificationSchemaError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return error.code === "42P01" || error.code === "42703" || /schema cache|company_verification_documents/i.test(error.message ?? "");
}

export async function listCompanyVerificationReviewQueue(): Promise<CompanyVerificationReviewQueue> {
  if (!hasSupabaseServiceRoleEnv()) {
    return {
      schemaReady: false,
      items: []
    };
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("company_verification_documents")
    .select(
      "id,company_id,document_type,file_name,storage_bucket,storage_path,mime_type,file_size,checksum,status,created_at,review_note,companies(name,business_no,verification_status,trust_score)"
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    if (isMissingVerificationSchemaError(error)) {
      return {
        schemaReady: false,
        items: []
      };
    }

    throw error;
  }

  const rows = (data ?? []) as unknown as CompanyVerificationDocumentRow[];
  const items = await Promise.all(
    rows.map(async (row) => {
      const company = firstCompany(row);
      const signedUrlResult = row.storage_bucket === companyVerificationDocumentsBucket
        ? await supabase.storage.from(companyVerificationDocumentsBucket).createSignedUrl(row.storage_path, 600)
        : { data: null };

      return {
        id: row.id,
        businessNo: company?.business_no ?? null,
        checksum: row.checksum,
        companyId: row.company_id,
        companyName: company?.name ?? "회사명 미확인",
        createdAt: row.created_at,
        documentType: row.document_type,
        fileName: row.file_name,
        fileSize: row.file_size,
        mimeType: row.mime_type,
        reviewNote: row.review_note,
        signedUrl: signedUrlResult.data?.signedUrl ?? null,
        status: row.status,
        trustScore: company?.trust_score ?? 0,
        verificationStatus: company?.verification_status ?? "unverified"
      } satisfies CompanyVerificationReviewQueueItem;
    })
  );

  return {
    schemaReady: true,
    items
  };
}

type CompanyOperationsCompanyRow = {
  id: string;
  name: string | null;
  business_no: string | null;
  country_code: string | null;
  created_at: string;
  trust_score: number | null;
  verification_status: string | null;
  verified_at: string | null;
};

type CompanyPartyTypeRow = {
  company_id: string;
  party_type: string;
};

type CompanyPartyTypeRequestRow = {
  id: string;
  company_id: string;
  companies?: {
    business_no: string | null;
    name: string | null;
    verification_status: string | null;
  } | Array<{
    business_no: string | null;
    name: string | null;
    verification_status: string | null;
  }> | null;
  created_at: string;
  profiles?: {
    email: string | null;
    full_name: string | null;
  } | Array<{
    email: string | null;
    full_name: string | null;
  }> | null;
  reason: string | null;
  requested_party_types: string[];
  review_note: string | null;
  reviewed_at: string | null;
  status: string;
};

function firstProfile(row: CompanyPartyTypeRequestRow) {
  return Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
}

export async function listCompanyOperationsCompanies(): Promise<CompanyOperationsCompanyList> {
  if (!hasSupabaseServiceRoleEnv()) {
    return {
      schemaReady: false,
      items: []
    };
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data: companies, error: companiesError } = await supabase
    .from("companies")
    .select("id,name,business_no,country_code,verification_status,trust_score,verified_at,created_at")
    .order("created_at", { ascending: false })
    .limit(80);

  if (companiesError) {
    if (isMissingVerificationSchemaError(companiesError)) {
      return {
        schemaReady: false,
        items: []
      };
    }

    throw companiesError;
  }

  const companyRows = (companies ?? []) as unknown as CompanyOperationsCompanyRow[];
  const companyIds = companyRows.map((company) => company.id);
  const { data: partyTypes, error: partyTypesError } = companyIds.length
    ? await supabase
      .from("company_party_types")
      .select("company_id,party_type")
      .in("company_id", companyIds)
    : { data: [], error: null };

  if (partyTypesError && !isMissingVerificationSchemaError(partyTypesError)) throw partyTypesError;

  const partyTypesByCompany = ((partyTypes ?? []) as unknown as CompanyPartyTypeRow[]).reduce((groups, partyType) => {
    groups.set(partyType.company_id, [...(groups.get(partyType.company_id) ?? []), partyType.party_type]);
    return groups;
  }, new Map<string, string[]>());

  return {
    schemaReady: !partyTypesError,
    items: companyRows.map((company) => ({
      id: company.id,
      businessNo: company.business_no,
      countryCode: company.country_code,
      createdAt: company.created_at,
      name: company.name ?? "회사명 미확인",
      partyTypes: partyTypesByCompany.get(company.id) ?? [],
      trustScore: company.trust_score ?? 0,
      verificationStatus: company.verification_status ?? "unverified",
      verifiedAt: company.verified_at
    }))
  };
}

export async function listCompanyRoleRequestReviewQueue(): Promise<CompanyRoleRequestReviewQueue> {
  if (!hasSupabaseServiceRoleEnv()) {
    return {
      schemaReady: false,
      items: []
    };
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("company_party_type_requests")
    .select("id,company_id,requested_party_types,reason,status,review_note,reviewed_at,created_at,companies(name,business_no,verification_status),profiles!company_party_type_requests_requested_by_fkey(full_name,email)")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    if (isMissingVerificationSchemaError(error)) {
      return {
        schemaReady: false,
        items: []
      };
    }

    throw error;
  }

  const rows = (data ?? []) as unknown as CompanyPartyTypeRequestRow[];
  return {
    schemaReady: true,
    items: rows.map((row) => {
      const company = firstCompany({
        companies: row.companies
      } as CompanyVerificationDocumentRow);
      const requester = firstProfile(row);

      return {
        id: row.id,
        businessNo: company?.business_no ?? null,
        companyId: row.company_id,
        companyName: company?.name ?? "회사명 미확인",
        createdAt: row.created_at,
        reason: row.reason,
        requestedByEmail: requester?.email ?? null,
        requestedByName: requester?.full_name ?? null,
        requestedPartyTypes: Array.isArray(row.requested_party_types) ? row.requested_party_types.map(String) : [],
        reviewNote: row.review_note,
        reviewedAt: row.reviewed_at,
        status: row.status,
        verificationStatus: company?.verification_status ?? "unverified"
      } satisfies CompanyRoleRequestReviewQueueItem;
    })
  };
}
