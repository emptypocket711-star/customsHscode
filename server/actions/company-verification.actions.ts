"use server";

import { revalidatePath } from "next/cache";
import {
  companyRoleRequestReviewSchema,
  companyRoleRequestSchema,
  type CompanyRoleRequestActionState,
  type CompanyRoleRequestReviewActionState
} from "@/features/company-verification/company-role-request-schemas";
import {
  companyOperationsStatusSchema,
  companyVerificationReviewSchema,
  companyVerificationUploadSchema,
  type CompanyOperationsStatusActionState,
  type CompanyVerificationReviewActionState,
  type CompanyVerificationUploadActionState
} from "@/features/company-verification/schemas";
import { createSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase/server";
import { createSupabaseServiceRoleClient, hasSupabaseServiceRoleEnv } from "@/lib/supabase/service-role";
import { recordAuditLog } from "@/server/audit/account-audit";
import { isDeveloperEmail } from "@/server/auth/developer";
import { createCompanyRoleRequest } from "@/server/repositories/company-role-requests.repository";
import { uploadCompanyVerificationDocument } from "@/server/repositories/company-verification.repository";

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : undefined;
}

function fileValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return value instanceof File && value.size > 0 ? value : null;
}

function stringArrayValue(formData: FormData, key: string) {
  return formData.getAll(key).filter((value): value is string => typeof value === "string" && value.trim().length > 0);
}

async function requireCurrentDeveloper() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user?.id || !isDeveloperEmail(user.email)) {
    throw new Error("개발자 계정만 회사 검증 상태를 변경할 수 있습니다.");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "developer") {
    throw new Error("개발자 권한 프로필이 필요합니다.");
  }

  return user;
}

async function markCompanyDocumentsSubmitted(input: {
  actorId: string;
  companyId: string;
  documentId: string;
  documentType: string;
}) {
  if (!hasSupabaseServiceRoleEnv()) return;

  const admin = createSupabaseServiceRoleClient();
  const { data: beforeCompany, error: beforeCompanyError } = await admin
    .from("companies")
    .select("id,verification_status")
    .eq("id", input.companyId)
    .maybeSingle();

  if (beforeCompanyError) throw beforeCompanyError;

  const currentStatus = String(beforeCompany?.verification_status ?? "unverified");
  if (["unverified", "email_verified"].includes(currentStatus)) {
    const { error: companyUpdateError } = await admin
      .from("companies")
      .update({ verification_status: "documents_submitted" })
      .eq("id", input.companyId);

    if (companyUpdateError) throw companyUpdateError;
  }

  await recordAuditLog({
    action: "company_verification_document_uploaded",
    actorId: input.actorId,
    companyId: input.companyId,
    targetTable: "company_verification_documents",
    targetId: input.documentId,
    before: {
      companyVerificationStatus: currentStatus
    },
    after: {
      documentType: input.documentType,
      companyVerificationStatus: ["unverified", "email_verified"].includes(currentStatus)
        ? "documents_submitted"
        : currentStatus
    },
    throwOnError: true
  });
}

export async function uploadCompanyVerificationDocumentAction(
  _previousState: CompanyVerificationUploadActionState,
  formData: FormData
): Promise<CompanyVerificationUploadActionState> {
  const parsed = companyVerificationUploadSchema.safeParse({
    documentType: stringValue(formData, "documentType"),
    note: stringValue(formData, "note")
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "회사 검증 증빙 입력값을 확인해 주세요."
    };
  }

  const file = fileValue(formData, "file");
  if (!file) {
    return {
      status: "error",
      message: "업로드할 증빙 파일을 선택해 주세요."
    };
  }

  if (!hasSupabaseEnv()) {
    return {
      status: "error",
      message: "회사 증빙 업로드 환경을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요."
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const result = await uploadCompanyVerificationDocument(supabase, parsed.data, file);

    await markCompanyDocumentsSubmitted({
      actorId: result.uploadedBy,
      companyId: result.companyId,
      documentId: result.documentId,
      documentType: result.documentType
    });

    revalidatePath("/settings/members");
    revalidatePath("/dashboard");

    return {
      status: "success",
      documentId: result.documentId,
      message: "회사 검증 증빙이 private bucket에 저장되었습니다. 운영자 검토 후 상태가 갱신됩니다."
    };
  } catch {
    return {
      status: "error",
      message: "회사 검증 증빙 업로드 중 오류가 발생했습니다. 파일 형식과 용량을 확인한 뒤 다시 시도해 주세요."
    };
  }
}

export async function reviewCompanyVerificationDocumentAction(
  _previousState: CompanyVerificationReviewActionState,
  formData: FormData
): Promise<CompanyVerificationReviewActionState> {
  const parsed = companyVerificationReviewSchema.safeParse({
    decision: stringValue(formData, "decision"),
    documentId: stringValue(formData, "documentId"),
    reviewNote: stringValue(formData, "reviewNote")
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "회사 검증 처리 입력값을 확인해 주세요."
    };
  }

  try {
    const actor = await requireCurrentDeveloper();
    const admin = createSupabaseServiceRoleClient();
    const { data: beforeDocument, error: documentError } = await admin
      .from("company_verification_documents")
      .select("id,company_id,document_type,status,review_note")
      .eq("id", parsed.data.documentId)
      .maybeSingle();

    if (documentError) throw documentError;
    if (!beforeDocument?.id) {
      return {
        status: "error",
        message: "검토할 회사 증빙을 찾을 수 없습니다."
      };
    }

    const { data: beforeCompany, error: beforeCompanyError } = await admin
      .from("companies")
      .select("id,verification_status,verified_at,verified_by")
      .eq("id", beforeDocument.company_id)
      .maybeSingle();

    if (beforeCompanyError) throw beforeCompanyError;

    const reviewedAt = new Date().toISOString();
    const { data: updatedDocument, error: updateDocumentError } = await admin
      .from("company_verification_documents")
      .update({
        reviewed_at: reviewedAt,
        reviewed_by: actor.id,
        review_note: parsed.data.reviewNote || null,
        status: parsed.data.decision
      })
      .eq("id", parsed.data.documentId)
      .select("id,company_id,document_type,status,review_note,reviewed_at,reviewed_by")
      .single();

    if (updateDocumentError) throw updateDocumentError;

    if (parsed.data.decision === "approved") {
      const { error: companyUpdateError } = await admin
        .from("companies")
        .update({
          verification_status: "operator_approved",
          verified_at: reviewedAt,
          verified_by: actor.id
        })
        .eq("id", beforeDocument.company_id);

      if (companyUpdateError) throw companyUpdateError;
    }

    await recordAuditLog({
      action: "company_verification_document_reviewed",
      actorId: actor.id,
      companyId: String(beforeDocument.company_id),
      targetTable: "company_verification_documents",
      targetId: parsed.data.documentId,
      before: {
        companyVerificationStatus: beforeCompany?.verification_status ?? null,
        documentStatus: beforeDocument.status,
        documentType: beforeDocument.document_type
      },
      after: {
        companyVerificationStatus: parsed.data.decision === "approved"
          ? "operator_approved"
          : beforeCompany?.verification_status ?? null,
        documentStatus: updatedDocument.status,
        documentType: updatedDocument.document_type
      },
      throwOnError: true
    });

    revalidatePath("/operations/users");
    revalidatePath("/settings/members");

    return {
      status: "success",
      message: parsed.data.decision === "approved"
        ? "회사 검증 증빙을 승인했습니다."
        : "회사 검증 증빙을 반려했습니다."
    };
  } catch {
    return {
      status: "error",
      message: "회사 검증 상태를 저장하지 못했습니다."
    };
  }
}

export async function updateCompanyOperationsStatusAction(
  _previousState: CompanyOperationsStatusActionState,
  formData: FormData
): Promise<CompanyOperationsStatusActionState> {
  const parsed = companyOperationsStatusSchema.safeParse({
    companyId: stringValue(formData, "companyId"),
    note: stringValue(formData, "note"),
    status: stringValue(formData, "status")
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "업체 상태 변경 입력값을 확인해 주세요."
    };
  }

  try {
    const actor = await requireCurrentDeveloper();
    const admin = createSupabaseServiceRoleClient();
    const { error } = await admin.rpc("update_company_marketplace_status", {
      p_actor_id: actor.id,
      p_company_id: parsed.data.companyId,
      p_note: parsed.data.note ?? null,
      p_status: parsed.data.status
    });

    if (error) throw error;

    revalidatePath("/operations/users");
    revalidatePath("/dashboard");

    return {
      companyId: parsed.data.companyId,
      message: "업체 상태를 변경했습니다.",
      status: "success"
    };
  } catch {
    return {
      companyId: parsed.data.companyId,
      message: "업체 상태를 변경하지 못했습니다. 권한과 데이터베이스 상태를 확인해 주세요.",
      status: "error"
    };
  }
}

export async function createCompanyRoleRequestAction(
  _previousState: CompanyRoleRequestActionState,
  formData: FormData
): Promise<CompanyRoleRequestActionState> {
  if (!hasSupabaseEnv()) {
    return {
      status: "error",
      message: "플랫폼 역할 신청 환경을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요."
    };
  }

  const parsed = companyRoleRequestSchema.safeParse({
    reason: stringValue(formData, "reason"),
    requestedPartyTypes: stringArrayValue(formData, "requestedPartyTypes")
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "플랫폼 역할 신청 입력값을 확인해 주세요."
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const result = await createCompanyRoleRequest(supabase, parsed.data);

    await recordAuditLog({
      action: "company_party_type_request_submitted",
      actorId: result.requestedBy,
      companyId: result.companyId,
      targetTable: "company_party_type_requests",
      targetId: result.requestId,
      after: {
        requestedPartyTypes: result.requestedPartyTypes,
        status: result.status
      }
    });

    revalidatePath("/settings/members");
    revalidatePath("/dashboard");

    return {
      status: "success",
      message: "플랫폼 역할 신청을 접수했습니다. 운영자 검토 후 역할이 반영됩니다."
    };
  } catch {
    return {
      status: "error",
      message: "플랫폼 역할 신청을 접수하지 못했습니다. 회사 관리자 권한과 데이터베이스 상태를 확인해 주세요."
    };
  }
}

export async function reviewCompanyRoleRequestAction(
  _previousState: CompanyRoleRequestReviewActionState,
  formData: FormData
): Promise<CompanyRoleRequestReviewActionState> {
  const parsed = companyRoleRequestReviewSchema.safeParse({
    decision: stringValue(formData, "decision"),
    requestId: stringValue(formData, "requestId"),
    reviewNote: stringValue(formData, "reviewNote")
  });

  if (!parsed.success) {
    return {
      requestId: stringValue(formData, "requestId"),
      status: "error",
      message: parsed.error.issues[0]?.message ?? "역할 신청 검토 입력값을 확인해 주세요."
    };
  }

  try {
    const actor = await requireCurrentDeveloper();
    const admin = createSupabaseServiceRoleClient();
    const { error } = await admin.rpc("review_company_party_type_request", {
      p_actor_id: actor.id,
      p_decision: parsed.data.decision,
      p_request_id: parsed.data.requestId,
      p_review_note: parsed.data.reviewNote ?? null
    });

    if (error) throw error;

    revalidatePath("/operations/users");
    revalidatePath("/settings/members");
    revalidatePath("/dashboard");

    return {
      requestId: parsed.data.requestId,
      status: "success",
      message: parsed.data.decision === "approved"
        ? "플랫폼 역할 신청을 승인하고 회사 역할에 반영했습니다."
        : "플랫폼 역할 신청을 반려했습니다."
    };
  } catch {
    return {
      requestId: parsed.data.requestId,
      status: "error",
      message: "역할 신청 검토 결과를 저장하지 못했습니다. 권한과 데이터베이스 상태를 확인해 주세요."
    };
  }
}
