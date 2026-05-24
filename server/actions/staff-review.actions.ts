"use server";

import { revalidatePath } from "next/cache";
import {
  staffReviewDecisionSchema,
  type StaffReviewActionState
} from "@/features/staff-review/schemas";
import { createSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase/server";
import { createReportDraftForHsCandidate } from "@/server/repositories/report-draft.repository";
import { applyStaffReviewDecision } from "@/server/repositories/staff-review-mutation.repository";

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : undefined;
}

export async function applyStaffReviewDecisionAction(
  _previousState: StaffReviewActionState,
  formData: FormData
): Promise<StaffReviewActionState> {
  const parsed = staffReviewDecisionSchema.safeParse({
    targetType: stringValue(formData, "targetType"),
    targetId: stringValue(formData, "targetId"),
    decision: stringValue(formData, "decision"),
    note: stringValue(formData, "note")
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "검토 입력값을 확인해 주세요."
    };
  }

  if (!hasSupabaseEnv()) {
    return {
      status: "error",
      message: "Supabase 환경 변수가 없어 검토 처리는 저장되지 않았습니다. mock 화면에서는 상태 변경을 수행하지 않습니다."
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    await applyStaffReviewDecision(supabase, parsed.data);
    const reportResult = parsed.data.targetType === "hs_candidate" && parsed.data.decision === "approve"
      ? await createReportDraftForHsCandidate(supabase, parsed.data.targetId, parsed.data.note)
      : null;
    revalidatePath("/staff/review");
    revalidatePath("/reports/preview");

    return {
      status: "success",
      message: reportResult
        ? `담당자 검토 처리가 저장되었고 리포트 초안이 생성되었습니다. Source lock ${reportResult.sourceLockCount}건 / 리포트 ID: ${reportResult.reportId}`
        : "담당자 검토 처리가 저장되었습니다."
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "담당자 검토 처리 중 오류가 발생했습니다."
    };
  }
}
