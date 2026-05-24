"use server";

import { revalidatePath } from "next/cache";
import {
  documentLineHsRequestSchema,
  type StaffReviewActionState
} from "@/features/staff-review/schemas";
import { createSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase/server";
import { createHsRequestFromDocumentLineItem } from "@/server/repositories/document-line-hs-request.repository";
import { createHsCandidatesForRequest } from "@/server/repositories/hs-candidate.repository";

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : undefined;
}

export async function createHsRequestFromDocumentLineItemAction(
  _previousState: StaffReviewActionState,
  formData: FormData
): Promise<StaffReviewActionState> {
  const parsed = documentLineHsRequestSchema.safeParse({
    lineItemId: stringValue(formData, "lineItemId"),
    direction: stringValue(formData, "direction"),
    basisDate: stringValue(formData, "basisDate"),
    note: stringValue(formData, "note")
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "문서 라인아이템 입력값을 확인해 주세요."
    };
  }

  if (!hasSupabaseEnv()) {
    return {
      status: "error",
      message: "Supabase 환경 변수가 없어 HS 문서 요청을 생성하지 않았습니다. mock 화면에서는 버튼이 비활성화됩니다."
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const requestId = await createHsRequestFromDocumentLineItem(supabase, parsed.data);
    const candidateResult = await createHsCandidatesForRequest(supabase, requestId);
    revalidatePath("/staff/review");
    revalidatePath("/dashboard");

    return {
      status: "success",
      message: `문서 라인아이템 기반 HS 예비진단 요청이 생성되었습니다. 후보 ${candidateResult.candidateCount}건 / 요청 ID: ${requestId}`
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "HS 문서 요청 생성 중 오류가 발생했습니다."
    };
  }
}
