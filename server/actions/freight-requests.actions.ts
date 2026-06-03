"use server";

import { revalidatePath } from "next/cache";
import {
  freightRequestDraftSchema,
  freightRequestPublishSchema,
  type FreightRequestDraftActionState,
  type FreightRequestPublishActionState
} from "@/features/service-requests/freight-request-schemas";
import {
  freightRequestDocumentUploadSchema,
  type FreightRequestDocumentUploadActionState
} from "@/features/service-requests/freight-request-document-schemas";
import {
  freightRequestQuestionAnswerSchema,
  freightRequestQuestionAskSchema,
  type FreightRequestQuestionActionState
} from "@/features/service-requests/freight-request-question-schemas";
import {
  freightBidSelectSchema,
  freightBidSubmitSchema,
  type FreightBidSelectActionState,
  type FreightBidSubmitActionState
} from "@/features/service-requests/freight-bid-schemas";
import {
  serviceRequestCompleteSchema,
  serviceRequestStartSchema,
  type ServiceRequestLifecycleActionState
} from "@/features/service-requests/service-request-lifecycle-schemas";
import { createSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase/server";
import { recordAuditLog } from "@/server/audit/account-audit";
import {
  answerFreightRequestQuestion,
  askFreightRequestQuestion,
  completeSelectedServiceRequest,
  createFreightRequestDraft,
  publishFreightRequest,
  selectFreightBid,
  startSelectedServiceRequest,
  submitFreightBid,
  uploadFreightRequestDocument
} from "@/server/repositories/freight-requests.repository";

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function fileValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return value instanceof File && value.size > 0 ? value : null;
}

export async function publishFreightRequestAction(
  _previousState: FreightRequestPublishActionState,
  formData: FormData
): Promise<FreightRequestPublishActionState> {
  if (!hasSupabaseEnv()) {
    return {
      status: "error",
      message: "운송 견적 요청 공개 환경을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요."
    };
  }

  const parsed = freightRequestPublishSchema.safeParse({
    deadlineHours: stringValue(formData, "deadlineHours"),
    requestId: stringValue(formData, "requestId")
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "운송 견적 요청 공개 입력값을 확인해 주세요."
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const result = await publishFreightRequest(supabase, parsed.data);

    revalidatePath("/requests/freight");
    revalidatePath("/dashboard");

    return {
      status: "success",
      matchedCount: result.matchedCount,
      message: result.matchedCount > 0
        ? `운송 견적 요청을 공개했습니다. 조건에 맞는 포워더 ${result.matchedCount}곳에 노출됩니다.`
        : "운송 견적 요청을 공개했습니다. 현재 조건에 맞는 포워더 매칭은 없습니다.",
      requestId: result.requestId
    };
  } catch {
    return {
      status: "error",
      message: "운송 견적 요청을 공개하지 못했습니다. 임시저장 상태와 회사 권한을 확인해 주세요.",
      requestId: parsed.data.requestId
    };
  }
}

export async function submitFreightBidAction(
  _previousState: FreightBidSubmitActionState,
  formData: FormData
): Promise<FreightBidSubmitActionState> {
  if (!hasSupabaseEnv()) {
    return {
      status: "error",
      message: "운송 견적 제출 환경을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요."
    };
  }

  const parsed = freightBidSubmitSchema.safeParse({
    carrierNote: stringValue(formData, "carrierNote"),
    currency: stringValue(formData, "currency"),
    freeTimeNote: stringValue(formData, "freeTimeNote"),
    freightRateAmount: stringValue(formData, "freightRateAmount"),
    leadTimeDays: stringValue(formData, "leadTimeDays"),
    localChargeAmount: stringValue(formData, "localChargeAmount"),
    message: stringValue(formData, "message"),
    requestId: stringValue(formData, "requestId"),
    surchargeAmount: stringValue(formData, "surchargeAmount"),
    totalAmount: stringValue(formData, "totalAmount"),
    transitTimeDays: stringValue(formData, "transitTimeDays"),
    validUntil: stringValue(formData, "validUntil")
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "운송 견적 입력값을 확인해 주세요.",
      requestId: stringValue(formData, "requestId")
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const result = await submitFreightBid(supabase, parsed.data);

    revalidatePath("/requests/freight");
    revalidatePath("/dashboard");

    return {
      bidId: result.bidId,
      message: "운송 견적을 제출했습니다.",
      requestId: result.requestId,
      status: "success"
    };
  } catch {
    return {
      message: "운송 견적을 제출하지 못했습니다. 매칭 상태와 회사 검증 상태를 확인해 주세요.",
      requestId: parsed.data.requestId,
      status: "error"
    };
  }
}

export async function selectFreightBidAction(
  _previousState: FreightBidSelectActionState,
  formData: FormData
): Promise<FreightBidSelectActionState> {
  if (!hasSupabaseEnv()) {
    return {
      status: "error",
      message: "운송 견적 선택 환경을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요."
    };
  }

  const parsed = freightBidSelectSchema.safeParse({
    bidId: stringValue(formData, "bidId")
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "선택할 운송 견적을 확인해 주세요."
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const result = await selectFreightBid(supabase, parsed.data);

    revalidatePath("/requests/freight");
    revalidatePath("/dashboard");

    return {
      bidId: result.bidId,
      message: "운송 견적을 선택했습니다. 다른 제출 견적은 자동으로 미선정 처리됩니다.",
      status: "success"
    };
  } catch {
    return {
      bidId: parsed.data.bidId,
      message: "운송 견적을 선택하지 못했습니다. 요청 소유권과 견적 상태를 확인해 주세요.",
      status: "error"
    };
  }
}

export async function startSelectedFreightRequestAction(
  _previousState: ServiceRequestLifecycleActionState,
  formData: FormData
): Promise<ServiceRequestLifecycleActionState> {
  if (!hasSupabaseEnv()) {
    return {
      status: "error",
      message: "요청 진행 시작 환경을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요."
    };
  }

  const parsed = serviceRequestStartSchema.safeParse({
    requestId: stringValue(formData, "requestId")
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "진행 시작할 요청을 확인해 주세요.",
      requestId: stringValue(formData, "requestId")
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const result = await startSelectedServiceRequest(supabase, parsed.data);

    revalidatePath("/requests/freight");
    revalidatePath(`/requests/freight/${result.requestId}`);
    revalidatePath(`/requests/freight/opportunities/${result.requestId}`);
    revalidatePath("/dashboard");

    return {
      message: "선정된 운송 요청을 진행 중으로 변경했습니다.",
      requestId: result.requestId,
      status: "success"
    };
  } catch {
    return {
      message: "운송 요청 진행을 시작하지 못했습니다. 선정 상태와 회사 권한을 확인해 주세요.",
      requestId: parsed.data.requestId,
      status: "error"
    };
  }
}

export async function completeSelectedFreightRequestAction(
  _previousState: ServiceRequestLifecycleActionState,
  formData: FormData
): Promise<ServiceRequestLifecycleActionState> {
  if (!hasSupabaseEnv()) {
    return {
      status: "error",
      message: "요청 완료 처리 환경을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요."
    };
  }

  const parsed = serviceRequestCompleteSchema.safeParse({
    completionNote: stringValue(formData, "completionNote"),
    requestId: stringValue(formData, "requestId")
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "완료 처리할 요청을 확인해 주세요.",
      requestId: stringValue(formData, "requestId")
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const result = await completeSelectedServiceRequest(supabase, parsed.data);

    revalidatePath("/requests/freight");
    revalidatePath(`/requests/freight/${result.requestId}`);
    revalidatePath(`/requests/freight/opportunities/${result.requestId}`);
    revalidatePath("/dashboard");

    return {
      message: "운송 요청을 완료 처리했습니다.",
      requestId: result.requestId,
      status: "success"
    };
  } catch {
    return {
      message: "운송 요청을 완료 처리하지 못했습니다. 진행 상태와 회사 권한을 확인해 주세요.",
      requestId: parsed.data.requestId,
      status: "error"
    };
  }
}

export async function uploadFreightRequestDocumentAction(
  _previousState: FreightRequestDocumentUploadActionState,
  formData: FormData
): Promise<FreightRequestDocumentUploadActionState> {
  if (!hasSupabaseEnv()) {
    return {
      status: "error",
      message: "요청 서류 업로드 환경을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요."
    };
  }

  const parsed = freightRequestDocumentUploadSchema.safeParse({
    documentType: stringValue(formData, "documentType"),
    requestId: stringValue(formData, "requestId"),
    visibility: stringValue(formData, "visibility")
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "요청 서류 입력값을 확인해 주세요.",
      requestId: stringValue(formData, "requestId")
    };
  }

  const file = fileValue(formData, "file");
  if (!file) {
    return {
      status: "error",
      message: "업로드할 요청 서류를 선택해 주세요.",
      requestId: parsed.data.requestId
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const result = await uploadFreightRequestDocument(supabase, parsed.data, file);

    await recordAuditLog({
      action: "service_request_document_uploaded",
      actorId: result.uploadedBy,
      targetTable: "service_request_documents",
      targetId: result.documentId,
      after: {
        documentType: result.documentType,
        fileName: result.fileName,
        requestId: result.requestId,
        storageBucket: result.storageBucket
      }
    });

    revalidatePath("/requests/freight");
    revalidatePath("/dashboard");

    return {
      documentId: result.documentId,
      message: "요청 서류가 private bucket에 저장되었습니다.",
      requestId: result.requestId,
      status: "success"
    };
  } catch {
    return {
      status: "error",
      message: "요청 서류를 업로드하지 못했습니다. 요청 소유권과 파일 형식을 확인해 주세요.",
      requestId: parsed.data.requestId
    };
  }
}

export async function askFreightRequestQuestionAction(
  _previousState: FreightRequestQuestionActionState,
  formData: FormData
): Promise<FreightRequestQuestionActionState> {
  if (!hasSupabaseEnv()) {
    return {
      status: "error",
      message: "질문 등록 환경을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요."
    };
  }

  const parsed = freightRequestQuestionAskSchema.safeParse({
    question: stringValue(formData, "question"),
    requestId: stringValue(formData, "requestId")
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "질문 입력값을 확인해 주세요.",
      requestId: stringValue(formData, "requestId")
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const result = await askFreightRequestQuestion(supabase, parsed.data);

    revalidatePath("/requests/freight");
    revalidatePath("/dashboard");

    return {
      message: "질문을 등록했습니다.",
      questionId: result.questionId,
      requestId: result.requestId,
      status: "success"
    };
  } catch {
    return {
      status: "error",
      message: "질문을 등록하지 못했습니다. 매칭 상태와 요청 마감 시간을 확인해 주세요.",
      requestId: parsed.data.requestId
    };
  }
}

export async function answerFreightRequestQuestionAction(
  _previousState: FreightRequestQuestionActionState,
  formData: FormData
): Promise<FreightRequestQuestionActionState> {
  if (!hasSupabaseEnv()) {
    return {
      status: "error",
      message: "답변 등록 환경을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요."
    };
  }

  const parsed = freightRequestQuestionAnswerSchema.safeParse({
    answer: stringValue(formData, "answer"),
    questionId: stringValue(formData, "questionId")
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "답변 입력값을 확인해 주세요.",
      questionId: stringValue(formData, "questionId")
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const result = await answerFreightRequestQuestion(supabase, parsed.data);

    revalidatePath("/requests/freight");
    revalidatePath("/dashboard");

    return {
      message: "답변을 등록했습니다.",
      questionId: result.questionId,
      status: "success"
    };
  } catch {
    return {
      status: "error",
      message: "답변을 등록하지 못했습니다. 요청 소유권과 질문 상태를 확인해 주세요.",
      questionId: parsed.data.questionId
    };
  }
}

function booleanValue(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

export async function createFreightRequestDraftAction(
  _previousState: FreightRequestDraftActionState,
  formData: FormData
): Promise<FreightRequestDraftActionState> {
  if (!hasSupabaseEnv()) {
    return {
      status: "error",
      message: "운송 견적 요청 저장 환경을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요."
    };
  }

  const parsed = freightRequestDraftSchema.safeParse({
    cbm: stringValue(formData, "cbm"),
    containerType: stringValue(formData, "containerType"),
    destinationCountryCode: stringValue(formData, "destinationCountryCode"),
    destinationPlace: stringValue(formData, "destinationPlace"),
    destinationPort: stringValue(formData, "destinationPort"),
    direction: stringValue(formData, "direction"),
    grossWeight: stringValue(formData, "grossWeight"),
    hazardous: booleanValue(formData, "hazardous"),
    incoterms: stringValue(formData, "incoterms"),
    loadType: stringValue(formData, "loadType"),
    originCountryCode: stringValue(formData, "originCountryCode"),
    originPlace: stringValue(formData, "originPlace"),
    originPort: stringValue(formData, "originPort"),
    packageCount: stringValue(formData, "packageCount"),
    packageUnit: stringValue(formData, "packageUnit"),
    preferredArrivalDate: stringValue(formData, "preferredArrivalDate"),
    preferredStartDate: stringValue(formData, "preferredStartDate"),
    productSummary: stringValue(formData, "productSummary"),
    temperatureControlled: booleanValue(formData, "temperatureControlled"),
    title: stringValue(formData, "title"),
    transportMode: stringValue(formData, "transportMode"),
    usedCar: booleanValue(formData, "usedCar"),
    vehicleVin: stringValue(formData, "vehicleVin"),
    weightUnit: stringValue(formData, "weightUnit")
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "운송 견적 요청 입력값을 확인해 주세요."
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const requestId = await createFreightRequestDraft(supabase, parsed.data);

    revalidatePath("/requests/freight");
    revalidatePath("/dashboard");

    return {
      status: "success",
      message: "운송 견적 요청 초안을 저장했습니다. 아래 내 요청 목록에서 상세 화면으로 들어가 서류 첨부와 포워더 공개 모집을 진행해 주세요.",
      requestId
    };
  } catch {
    return {
      status: "error",
      message: "운송 견적 요청 초안을 저장하지 못했습니다. 로그인 상태를 확인하고, 회사 설정에서 화주 역할과 회사 정보를 확인해 주세요."
    };
  }
}
