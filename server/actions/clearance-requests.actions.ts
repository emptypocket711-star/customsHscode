"use server";

import { revalidatePath } from "next/cache";
import {
  clearanceRequestDraftSchema,
  type ClearanceRequestDraftActionState
} from "@/features/service-requests/clearance-request-schemas";
import {
  clearanceRequestDocumentUploadSchema,
  type ClearanceRequestDocumentUploadActionState
} from "@/features/service-requests/clearance-request-document-schemas";
import {
  clearanceRequestQuestionAnswerSchema,
  clearanceRequestQuestionAskSchema,
  type ClearanceRequestQuestionActionState
} from "@/features/service-requests/clearance-request-question-schemas";
import {
  clearanceBidSelectSchema,
  clearanceBidSubmitSchema,
  clearanceRequestPublishSchema,
  type ClearanceBidSelectActionState,
  type ClearanceBidSubmitActionState,
  type ClearanceRequestPublishActionState
} from "@/features/service-requests/clearance-bid-schemas";
import {
  serviceRequestCompleteSchema,
  serviceRequestStartSchema,
  type ServiceRequestLifecycleActionState
} from "@/features/service-requests/service-request-lifecycle-schemas";
import { createSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase/server";
import { recordAuditLog } from "@/server/audit/account-audit";
import {
  answerClearanceRequestQuestion,
  askClearanceRequestQuestion,
  completeSelectedClearanceRequest,
  createClearanceRequestDraft,
  uploadClearanceRequestDocument,
  publishClearanceRequest,
  selectClearanceBid,
  startSelectedClearanceRequest,
  submitClearanceBid
} from "@/server/repositories/clearance-requests.repository";

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function booleanValue(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function fileValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return value instanceof File && value.size > 0 ? value : null;
}

export async function publishClearanceRequestAction(
  _previousState: ClearanceRequestPublishActionState,
  formData: FormData
): Promise<ClearanceRequestPublishActionState> {
  if (!hasSupabaseEnv()) {
    return {
      status: "error",
      message: "통관 의뢰 공개 환경을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요."
    };
  }

  const parsed = clearanceRequestPublishSchema.safeParse({
    deadlineHours: stringValue(formData, "deadlineHours"),
    requestId: stringValue(formData, "requestId")
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "통관 의뢰 공개 입력값을 확인해 주세요.",
      requestId: stringValue(formData, "requestId")
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const result = await publishClearanceRequest(supabase, parsed.data);

    revalidatePath("/requests/clearance");
    revalidatePath("/dashboard");

    return {
      matchedCount: result.matchedCount,
      message: result.matchedCount > 0
        ? `통관 의뢰 요청을 공개했습니다. 조건에 맞는 관세사무소 ${result.matchedCount}곳에 노출됩니다.`
        : "통관 의뢰 요청을 공개했습니다. 현재 조건에 맞는 관세사무소 매칭은 없습니다.",
      requestId: result.requestId,
      status: "success"
    };
  } catch {
    return {
      status: "error",
      message: "통관 의뢰 요청을 공개하지 못했습니다. 목적국, 회사 검증 상태, 관세사무소 매칭 조건을 확인해 주세요.",
      requestId: parsed.data.requestId
    };
  }
}

export async function submitClearanceBidAction(
  _previousState: ClearanceBidSubmitActionState,
  formData: FormData
): Promise<ClearanceBidSubmitActionState> {
  if (!hasSupabaseEnv()) {
    return {
      status: "error",
      message: "통관 견적 제출 환경을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요."
    };
  }

  const parsed = clearanceBidSubmitSchema.safeParse({
    additionalDocumentsRequired: stringValue(formData, "additionalDocumentsRequired"),
    brokerageFeeAmount: stringValue(formData, "brokerageFeeAmount"),
    currency: stringValue(formData, "currency"),
    expectedClearanceDays: stringValue(formData, "expectedClearanceDays"),
    leadTimeDays: stringValue(formData, "leadTimeDays"),
    message: stringValue(formData, "message"),
    requestId: stringValue(formData, "requestId"),
    reviewAvailable: booleanValue(formData, "reviewAvailable"),
    riskNote: stringValue(formData, "riskNote"),
    totalAmount: stringValue(formData, "totalAmount"),
    validUntil: stringValue(formData, "validUntil")
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "통관 견적 입력값을 확인해 주세요.",
      requestId: stringValue(formData, "requestId")
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const result = await submitClearanceBid(supabase, parsed.data);

    revalidatePath("/requests/clearance");
    revalidatePath("/dashboard");

    return {
      bidId: result.bidId,
      message: "통관 견적을 제출했습니다.",
      requestId: result.requestId,
      status: "success"
    };
  } catch {
    return {
      message: "통관 견적을 제출하지 못했습니다. 매칭 상태와 회사 검증 상태를 확인해 주세요.",
      requestId: parsed.data.requestId,
      status: "error"
    };
  }
}

export async function uploadClearanceRequestDocumentAction(
  _previousState: ClearanceRequestDocumentUploadActionState,
  formData: FormData
): Promise<ClearanceRequestDocumentUploadActionState> {
  if (!hasSupabaseEnv()) {
    return {
      status: "error",
      message: "통관 의뢰 서류 업로드 환경을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요."
    };
  }

  const parsed = clearanceRequestDocumentUploadSchema.safeParse({
    documentType: stringValue(formData, "documentType"),
    requestId: stringValue(formData, "requestId"),
    visibility: stringValue(formData, "visibility")
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "통관 의뢰 서류 입력값을 확인해 주세요.",
      requestId: stringValue(formData, "requestId")
    };
  }

  const file = fileValue(formData, "file");
  if (!file) {
    return {
      status: "error",
      message: "업로드할 통관 의뢰 서류를 선택해 주세요.",
      requestId: parsed.data.requestId
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const result = await uploadClearanceRequestDocument(supabase, parsed.data, file);

    await recordAuditLog({
      action: "service_request_document_uploaded",
      actorId: result.uploadedBy,
      targetTable: "service_request_documents",
      targetId: result.documentId,
      after: {
        documentType: result.documentType,
        fileName: result.fileName,
        requestId: result.requestId,
        requestType: "clearance",
        storageBucket: result.storageBucket
      }
    });

    revalidatePath("/requests/clearance");
    revalidatePath("/dashboard");

    return {
      documentId: result.documentId,
      message: "통관 의뢰 서류가 private bucket에 저장되었습니다.",
      requestId: result.requestId,
      status: "success"
    };
  } catch {
    return {
      status: "error",
      message: "통관 의뢰 서류를 업로드하지 못했습니다. 요청 소유권과 파일 형식을 확인해 주세요.",
      requestId: parsed.data.requestId
    };
  }
}

export async function selectClearanceBidAction(
  _previousState: ClearanceBidSelectActionState,
  formData: FormData
): Promise<ClearanceBidSelectActionState> {
  if (!hasSupabaseEnv()) {
    return {
      status: "error",
      message: "통관 견적 선택 환경을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요."
    };
  }

  const parsed = clearanceBidSelectSchema.safeParse({
    bidId: stringValue(formData, "bidId")
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "선택할 통관 견적을 확인해 주세요."
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const result = await selectClearanceBid(supabase, parsed.data);

    revalidatePath("/requests/clearance");
    revalidatePath("/dashboard");

    return {
      bidId: result.bidId,
      message: "통관 견적을 선택했습니다. 다른 제출 견적은 자동으로 미선정 처리됩니다.",
      status: "success"
    };
  } catch {
    return {
      bidId: parsed.data.bidId,
      message: "통관 견적을 선택하지 못했습니다. 요청 소유권과 견적 상태를 확인해 주세요.",
      status: "error"
    };
  }
}

export async function startSelectedClearanceRequestAction(
  _previousState: ServiceRequestLifecycleActionState,
  formData: FormData
): Promise<ServiceRequestLifecycleActionState> {
  if (!hasSupabaseEnv()) {
    return {
      status: "error",
      message: "통관 의뢰 진행 시작 환경을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요."
    };
  }

  const parsed = serviceRequestStartSchema.safeParse({
    requestId: stringValue(formData, "requestId")
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "진행 시작할 통관 의뢰를 확인해 주세요.",
      requestId: stringValue(formData, "requestId")
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const result = await startSelectedClearanceRequest(supabase, parsed.data);

    revalidatePath("/requests/clearance");
    revalidatePath(`/requests/clearance/${result.requestId}`);
    revalidatePath(`/requests/clearance/opportunities/${result.requestId}`);
    revalidatePath("/dashboard");

    return {
      message: "선정된 통관 의뢰를 진행 중으로 변경했습니다.",
      requestId: result.requestId,
      status: "success"
    };
  } catch {
    return {
      message: "통관 의뢰 진행을 시작하지 못했습니다. 선정 상태와 회사 권한을 확인해 주세요.",
      requestId: parsed.data.requestId,
      status: "error"
    };
  }
}

export async function completeSelectedClearanceRequestAction(
  _previousState: ServiceRequestLifecycleActionState,
  formData: FormData
): Promise<ServiceRequestLifecycleActionState> {
  if (!hasSupabaseEnv()) {
    return {
      status: "error",
      message: "통관 의뢰 완료 처리 환경을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요."
    };
  }

  const parsed = serviceRequestCompleteSchema.safeParse({
    completionNote: stringValue(formData, "completionNote"),
    requestId: stringValue(formData, "requestId")
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "완료 처리할 통관 의뢰를 확인해 주세요.",
      requestId: stringValue(formData, "requestId")
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const result = await completeSelectedClearanceRequest(supabase, parsed.data);

    revalidatePath("/requests/clearance");
    revalidatePath(`/requests/clearance/${result.requestId}`);
    revalidatePath(`/requests/clearance/opportunities/${result.requestId}`);
    revalidatePath("/dashboard");

    return {
      message: "통관 의뢰를 완료 처리했습니다.",
      requestId: result.requestId,
      status: "success"
    };
  } catch {
    return {
      message: "통관 의뢰를 완료 처리하지 못했습니다. 진행 상태와 회사 권한을 확인해 주세요.",
      requestId: parsed.data.requestId,
      status: "error"
    };
  }
}

export async function askClearanceRequestQuestionAction(
  _previousState: ClearanceRequestQuestionActionState,
  formData: FormData
): Promise<ClearanceRequestQuestionActionState> {
  if (!hasSupabaseEnv()) {
    return {
      status: "error",
      message: "통관 의뢰 질문 등록 환경을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요."
    };
  }

  const parsed = clearanceRequestQuestionAskSchema.safeParse({
    question: stringValue(formData, "question"),
    requestId: stringValue(formData, "requestId")
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "통관 의뢰 질문 입력값을 확인해 주세요.",
      requestId: stringValue(formData, "requestId")
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const result = await askClearanceRequestQuestion(supabase, parsed.data);

    revalidatePath("/requests/clearance");

    return {
      message: "통관 의뢰 질문을 등록했습니다.",
      questionId: result.questionId,
      requestId: result.requestId,
      status: "success"
    };
  } catch {
    return {
      message: "통관 의뢰 질문을 등록하지 못했습니다. 매칭 상태와 회사 검증 상태를 확인해 주세요.",
      requestId: parsed.data.requestId,
      status: "error"
    };
  }
}

export async function answerClearanceRequestQuestionAction(
  _previousState: ClearanceRequestQuestionActionState,
  formData: FormData
): Promise<ClearanceRequestQuestionActionState> {
  if (!hasSupabaseEnv()) {
    return {
      status: "error",
      message: "통관 의뢰 질문 답변 환경을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요."
    };
  }

  const parsed = clearanceRequestQuestionAnswerSchema.safeParse({
    answer: stringValue(formData, "answer"),
    questionId: stringValue(formData, "questionId")
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "통관 의뢰 질문 답변을 확인해 주세요.",
      questionId: stringValue(formData, "questionId")
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const result = await answerClearanceRequestQuestion(supabase, parsed.data);

    revalidatePath("/requests/clearance");

    return {
      message: "통관 의뢰 질문에 답변했습니다.",
      questionId: result.questionId,
      status: "success"
    };
  } catch {
    return {
      message: "통관 의뢰 질문에 답변하지 못했습니다. 요청 소유권, 마감 시간, 질문 상태를 확인해 주세요.",
      questionId: parsed.data.questionId,
      status: "error"
    };
  }
}

export async function createClearanceRequestDraftAction(
  _previousState: ClearanceRequestDraftActionState,
  formData: FormData
): Promise<ClearanceRequestDraftActionState> {
  if (!hasSupabaseEnv()) {
    return {
      status: "error",
      message: "통관 의뢰 요청 저장 환경을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요."
    };
  }

  const parsed = clearanceRequestDraftSchema.safeParse({
    destinationCountryCode: stringValue(formData, "destinationCountryCode"),
    direction: stringValue(formData, "direction"),
    estimatedDeclarationCount: stringValue(formData, "estimatedDeclarationCount"),
    exportCountryCode: stringValue(formData, "exportCountryCode"),
    ftaPreferenceRequested: booleanValue(formData, "ftaPreferenceRequested"),
    hs6: stringValue(formData, "hs6"),
    hsCodeKnown: booleanValue(formData, "hsCodeKnown"),
    hskCode: stringValue(formData, "hskCode"),
    incoterms: stringValue(formData, "incoterms"),
    modelName: stringValue(formData, "modelName"),
    originCountryCode: stringValue(formData, "originCountryCode"),
    preferredArrivalDate: stringValue(formData, "preferredArrivalDate"),
    preferredStartDate: stringValue(formData, "preferredStartDate"),
    productMaterial: stringValue(formData, "productMaterial"),
    productSummary: stringValue(formData, "productSummary"),
    productUsage: stringValue(formData, "productUsage"),
    requirementsCheckNeeded: booleanValue(formData, "requirementsCheckNeeded"),
    shipmentCountryCode: stringValue(formData, "shipmentCountryCode"),
    title: stringValue(formData, "title"),
    urgent: booleanValue(formData, "urgent")
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "통관 의뢰 요청 입력값을 확인해 주세요."
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const requestId = await createClearanceRequestDraft(supabase, parsed.data);

    revalidatePath("/requests/clearance");
    revalidatePath("/dashboard");

    return {
      status: "success",
      message: "통관 의뢰 요청 초안을 저장했습니다. 아래 내 요청 목록에서 상세 화면으로 들어가 서류 첨부와 관세사무소 공개를 진행해 주세요.",
      requestId
    };
  } catch {
    return {
      status: "error",
      message: "통관 의뢰 요청 초안을 저장하지 못했습니다. 로그인 상태와 회사 프로필을 확인해 주세요."
    };
  }
}
