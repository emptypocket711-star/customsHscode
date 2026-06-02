"use server";

import { revalidatePath } from "next/cache";
import {
  serviceRequestCompletionReportDocumentSchema,
  serviceRequestCompletionReportSchema,
  serviceRequestCompletionReportTransitionSchema,
  type ServiceRequestCompletionReportDocumentActionState,
  type ServiceRequestCompletionReportActionState,
  type ServiceRequestCompletionReportTransitionActionState
} from "@/features/service-requests/service-request-completion-report-schemas";
import { createSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase/server";
import {
  attachServiceRequestCompletionReportDocument,
  saveServiceRequestCompletionReport,
  transitionServiceRequestCompletionReport
} from "@/server/repositories/service-request-completion-report.repository";

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function getAllStrings(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim());
}

function numericValue(value: string | undefined) {
  if (!value) return undefined;
  const parsed = Number(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function jsonStringFromRecord(record: Record<string, unknown>) {
  const compact = Object.fromEntries(
    Object.entries(record).filter(([, value]) => {
      if (Array.isArray(value)) return value.length > 0;
      return value !== undefined && value !== null && value !== "";
    })
  );

  return Object.keys(compact).length > 0 ? JSON.stringify(compact) : undefined;
}

function settlementItemsJson(formData: FormData) {
  const labels = getAllStrings(formData, "settlementItemLabel");
  const amounts = getAllStrings(formData, "settlementItemAmount");
  const currencies = getAllStrings(formData, "settlementItemCurrency");
  const maxLength = Math.max(labels.length, amounts.length, currencies.length);
  const items = Array.from({ length: maxLength }, (_, index) => {
    const label = labels[index];
    const amount = numericValue(amounts[index]);
    const currency = currencies[index]?.toUpperCase();

    if (!label && amount === undefined && !currency) return null;

    return {
      ...(label ? { label } : {}),
      ...(amount !== undefined ? { amount } : {}),
      ...(currency ? { currency } : {})
    };
  }).filter((item): item is Record<string, unknown> => Boolean(item && Object.keys(item).length > 0));

  return items.length > 0 ? JSON.stringify(items) : undefined;
}

function freightResultJson(formData: FormData) {
  return jsonStringFromRecord({
    arrivalDate: stringValue(formData, "freightArrivalDate"),
    blOrAwbNo: stringValue(formData, "freightBlOrAwbNo"),
    carrier: stringValue(formData, "freightCarrier"),
    departureDate: stringValue(formData, "freightDepartureDate"),
    destinationPort: stringValue(formData, "freightDestinationPort"),
    exceptions: getAllStrings(formData, "freightException").filter(Boolean),
    originPort: stringValue(formData, "freightOriginPort")
  });
}

function clearanceResultJson(formData: FormData) {
  const taxLabel = stringValue(formData, "clearanceTaxLabel");
  const taxAmount = numericValue(stringValue(formData, "clearanceTaxAmount"));
  const taxCurrency = stringValue(formData, "clearanceTaxCurrency")?.toUpperCase();
  const taxSummary = taxLabel || taxAmount !== undefined || taxCurrency
    ? [{
      ...(taxLabel ? { label: taxLabel } : {}),
      ...(taxAmount !== undefined ? { amount: taxAmount } : {}),
      ...(taxCurrency ? { currency: taxCurrency } : {})
    }]
    : [];

  return jsonStringFromRecord({
    acceptedAt: stringValue(formData, "clearanceAcceptedAt"),
    cautions: getAllStrings(formData, "clearanceCaution").filter(Boolean),
    declarationNo: stringValue(formData, "clearanceDeclarationNo"),
    declaredHskCode: stringValue(formData, "clearanceDeclaredHskCode"),
    ftaAgreementName: stringValue(formData, "clearanceFtaAgreementName"),
    originCountryCode: stringValue(formData, "clearanceOriginCountryCode")?.toUpperCase(),
    releasedAt: stringValue(formData, "clearanceReleasedAt"),
    taxSummary
  });
}

export async function saveServiceRequestCompletionReportAction(
  _previousState: ServiceRequestCompletionReportActionState,
  formData: FormData
): Promise<ServiceRequestCompletionReportActionState> {
  if (!hasSupabaseEnv()) {
    return {
      status: "error",
      message: "완료 리포트 저장 환경을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요."
    };
  }

  const parsed = serviceRequestCompletionReportSchema.safeParse({
    clearanceResult: stringValue(formData, "clearanceResult") ?? clearanceResultJson(formData),
    currency: stringValue(formData, "currency"),
    finalAmount: stringValue(formData, "finalAmount"),
    freightResult: stringValue(formData, "freightResult") ?? freightResultJson(formData),
    requestId: stringValue(formData, "requestId"),
    requestType: stringValue(formData, "requestType"),
    settlementItems: stringValue(formData, "settlementItems") ?? settlementItemsJson(formData),
    sourceSnapshot: stringValue(formData, "sourceSnapshot"),
    summary: stringValue(formData, "summary"),
    timelineEvents: stringValue(formData, "timelineEvents")
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "완료 리포트 입력값을 확인해 주세요.",
      requestId: stringValue(formData, "requestId")
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const result = await saveServiceRequestCompletionReport(supabase, parsed.data);

    revalidatePath("/dashboard");
    if (parsed.data.requestType === "freight") {
      revalidatePath(`/requests/freight/${parsed.data.requestId}`);
      revalidatePath(`/requests/freight/opportunities/${parsed.data.requestId}`);
    }
    if (parsed.data.requestType === "clearance") {
      revalidatePath(`/requests/clearance/${parsed.data.requestId}`);
      revalidatePath(`/requests/clearance/opportunities/${parsed.data.requestId}`);
    }

    return {
      message: "완료 리포트를 저장했습니다.",
      reportId: result.reportId,
      requestId: result.requestId,
      status: "success"
    };
  } catch {
    return {
      message: "완료 리포트를 저장하지 못했습니다. 요청 완료 상태와 선정 파트너 권한을 확인해 주세요.",
      requestId: parsed.data.requestId,
      status: "error"
    };
  }
}

export async function attachServiceRequestCompletionReportDocumentAction(
  _previousState: ServiceRequestCompletionReportDocumentActionState,
  formData: FormData
): Promise<ServiceRequestCompletionReportDocumentActionState> {
  if (!hasSupabaseEnv()) {
    return {
      status: "error",
      message: "완료 리포트 서류 연결 환경을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요."
    };
  }

  const parsed = serviceRequestCompletionReportDocumentSchema.safeParse({
    documentRole: stringValue(formData, "documentRole"),
    reportId: stringValue(formData, "reportId"),
    requestDocumentId: stringValue(formData, "requestDocumentId"),
    requestId: stringValue(formData, "requestId"),
    requestType: stringValue(formData, "requestType"),
    requiredForArchive: formData.get("requiredForArchive") === "on"
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "완료 리포트에 연결할 서류를 확인해 주세요.",
      reportId: stringValue(formData, "reportId"),
      requestId: stringValue(formData, "requestId")
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const result = await attachServiceRequestCompletionReportDocument(supabase, parsed.data);

    revalidatePath("/dashboard");
    if (parsed.data.requestId && parsed.data.requestType === "freight") {
      revalidatePath(`/requests/freight/${parsed.data.requestId}`);
      revalidatePath(`/requests/freight/opportunities/${parsed.data.requestId}`);
    }
    if (parsed.data.requestId && parsed.data.requestType === "clearance") {
      revalidatePath(`/requests/clearance/${parsed.data.requestId}`);
      revalidatePath(`/requests/clearance/opportunities/${parsed.data.requestId}`);
    }

    return {
      mappingId: result.mappingId,
      message: "완료 리포트 보관 서류를 연결했습니다.",
      reportId: result.reportId,
      requestId: result.requestId,
      status: "success"
    };
  } catch {
    return {
      message: "완료 리포트 보관 서류를 연결하지 못했습니다. 리포트 상태와 서류 공개 권한을 확인해 주세요.",
      reportId: parsed.data.reportId,
      requestId: parsed.data.requestId,
      status: "error"
    };
  }
}

const transitionSuccessMessage = {
  acknowledge: "완료 리포트를 확인했습니다.",
  lock: "완료 리포트를 잠금 처리했습니다.",
  review: "완료 리포트를 운영 검토 상태로 변경했습니다.",
  submit: "완료 리포트를 제출했습니다."
} as const;

function revalidateCompletionReportPaths(requestType?: "clearance" | "freight", requestId?: string) {
  revalidatePath("/dashboard");

  if (!requestType || !requestId) return;

  if (requestType === "freight") {
    revalidatePath(`/requests/freight/${requestId}`);
    revalidatePath(`/requests/freight/opportunities/${requestId}`);
  }
  if (requestType === "clearance") {
    revalidatePath(`/requests/clearance/${requestId}`);
    revalidatePath(`/requests/clearance/opportunities/${requestId}`);
  }
}

export async function transitionServiceRequestCompletionReportAction(
  _previousState: ServiceRequestCompletionReportTransitionActionState,
  formData: FormData
): Promise<ServiceRequestCompletionReportTransitionActionState> {
  if (!hasSupabaseEnv()) {
    return {
      status: "error",
      message: "완료 리포트 상태 변경 환경을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요."
    };
  }

  const parsed = serviceRequestCompletionReportTransitionSchema.safeParse({
    acknowledgeRole: stringValue(formData, "acknowledgeRole"),
    reportId: stringValue(formData, "reportId"),
    requestId: stringValue(formData, "requestId"),
    requestType: stringValue(formData, "requestType"),
    transition: stringValue(formData, "transition")
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "완료 리포트 상태 변경 입력값을 확인해 주세요.",
      reportId: stringValue(formData, "reportId"),
      requestId: stringValue(formData, "requestId")
    };
  }

  if (parsed.data.transition === "acknowledge" && !parsed.data.acknowledgeRole) {
    return {
      status: "error",
      message: "완료 리포트를 확인할 역할을 확인해 주세요.",
      reportId: parsed.data.reportId,
      requestId: parsed.data.requestId,
      transition: parsed.data.transition
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const result = await transitionServiceRequestCompletionReport(supabase, parsed.data);

    revalidateCompletionReportPaths(parsed.data.requestType, parsed.data.requestId);

    return {
      message: transitionSuccessMessage[parsed.data.transition],
      reportId: result.reportId,
      requestId: result.requestId,
      status: "success",
      transition: parsed.data.transition
    };
  } catch {
    return {
      message: "완료 리포트 상태를 변경하지 못했습니다. 리포트 상태, 권한, 보관 서류 연결 상태를 확인해 주세요.",
      reportId: parsed.data.reportId,
      requestId: parsed.data.requestId,
      status: "error",
      transition: parsed.data.transition
    };
  }
}
