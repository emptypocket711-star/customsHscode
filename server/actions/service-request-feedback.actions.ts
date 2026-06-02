"use server";

import { revalidatePath } from "next/cache";
import {
  serviceRequestFeedbackSchema,
  type ServiceRequestFeedbackActionState
} from "@/features/service-requests/service-request-feedback-schemas";
import { createSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase/server";
import { submitServiceRequestFeedback } from "@/server/repositories/service-request-feedback.repository";

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

export async function submitServiceRequestFeedbackAction(
  _previousState: ServiceRequestFeedbackActionState,
  formData: FormData
): Promise<ServiceRequestFeedbackActionState> {
  if (!hasSupabaseEnv()) {
    return {
      status: "error",
      message: "피드백 제출 환경을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요."
    };
  }

  const parsed = serviceRequestFeedbackSchema.safeParse({
    comment: stringValue(formData, "comment"),
    communicationScore: stringValue(formData, "communicationScore"),
    documentQualityScore: stringValue(formData, "documentQualityScore"),
    rating: stringValue(formData, "rating"),
    requestId: stringValue(formData, "requestId"),
    responseSpeedScore: stringValue(formData, "responseSpeedScore")
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "피드백 입력값을 확인해 주세요.",
      requestId: stringValue(formData, "requestId")
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const result = await submitServiceRequestFeedback(supabase, parsed.data);

    revalidatePath("/requests/freight");
    revalidatePath(`/requests/freight/${result.requestId}`);
    revalidatePath(`/requests/freight/opportunities/${result.requestId}`);
    revalidatePath("/requests/clearance");
    revalidatePath(`/requests/clearance/${result.requestId}`);
    revalidatePath(`/requests/clearance/opportunities/${result.requestId}`);
    revalidatePath("/dashboard");

    return {
      feedbackId: result.feedbackId,
      message: "완료 요청 피드백을 제출했습니다.",
      requestId: result.requestId,
      status: "success"
    };
  } catch {
    return {
      status: "error",
      message: "피드백을 제출하지 못했습니다. 완료 상태와 요청 권한을 확인해 주세요.",
      requestId: parsed.data.requestId
    };
  }
}
