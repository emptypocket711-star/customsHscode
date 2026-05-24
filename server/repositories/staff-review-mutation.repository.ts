import type { SupabaseClient } from "@supabase/supabase-js";
import type { StaffReviewDecisionInput } from "@/features/staff-review/schemas";

export function getReviewRpcName(targetType: StaffReviewDecisionInput["targetType"]) {
  if (targetType === "hs_candidate") return "review_hs_candidate";
  if (targetType === "hs_confirmation_request") return "review_hs_confirmation_request";
  if (targetType === "report") return "review_report";
  return "review_legal_change";
}

export async function applyStaffReviewDecision(
  supabase: SupabaseClient,
  input: StaffReviewDecisionInput
) {
  const rpcName = getReviewRpcName(input.targetType);
  const { error } = await supabase.rpc(rpcName, {
    [input.targetType === "hs_candidate"
      ? "p_candidate_id"
      : input.targetType === "hs_confirmation_request"
        ? "p_request_id"
        : input.targetType === "report"
          ? "p_report_id"
          : "p_change_id"]: input.targetId,
    p_decision: input.decision,
    p_note: input.note ?? null
  });

  if (error) throw new Error(error.message);
}
