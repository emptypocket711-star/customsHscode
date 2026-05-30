"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { recordAuditLog } from "@/server/audit/account-audit";
import { isDeveloperEmail } from "@/server/auth/developer";
import {
  buildOperationsIssueStatusErrorMessage,
  buildOperationsIssueStatusNextStep,
  buildOperationsIssueStatusSuccessMessage
} from "@/server/operations/operations-issue-status-message.service";
import {
  updateOperationsIssueStatus,
  type OperationsIssueStatus
} from "@/server/repositories/operations-issue.repository";

export type OperationsIssueStatusActionState = {
  status: "idle" | "success" | "error";
  message: string | null;
  nextStep?: string | null;
};

const operationsIssueStatusSchema = z.object({
  issueId: z.uuid(),
  status: z.enum(["open", "resolved", "ignored"]),
  assignedToLabel: z.string().trim().max(120).optional(),
  operatorNote: z.string().trim().max(1000).optional(),
  resolutionReason: z.string().trim().max(1000).optional()
});

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : undefined;
}

async function requireCurrentDeveloper() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user?.id || !isDeveloperEmail(user.email)) {
    throw new Error("개발자 계정만 운영 이슈 상태를 변경할 수 있습니다.");
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

async function updateOperationsIssueStatusFromForm(formData: FormData) {
  const actor = await requireCurrentDeveloper();
  const parsed = operationsIssueStatusSchema.parse({
    issueId: stringValue(formData, "issueId"),
    status: stringValue(formData, "status"),
    assignedToLabel: stringValue(formData, "assignedToLabel"),
    operatorNote: stringValue(formData, "operatorNote"),
    resolutionReason: stringValue(formData, "resolutionReason")
  });
  const admin = createSupabaseServiceRoleClient();
  const { data: beforeIssue } = await admin
    .from("operations_issue_events")
    .select("id,issue_key,status,severity,title,occurrence_count,resolved_at,assigned_to_label,operator_note,resolution_reason,status_updated_by,status_updated_at")
    .eq("id", parsed.issueId)
    .maybeSingle();
  const updated = await updateOperationsIssueStatus(admin, {
    issueId: parsed.issueId,
    status: parsed.status as OperationsIssueStatus,
    assignedToLabel: parsed.assignedToLabel || null,
    operatorNote: parsed.operatorNote || null,
    resolutionReason: parsed.resolutionReason || null,
    statusUpdatedBy: actor.id
  });

  await recordAuditLog({
    action: "operations_issue_status_update",
    actorId: actor.id,
    targetTable: "operations_issue_events",
    targetId: parsed.issueId,
    before: beforeIssue,
    after: {
      issueKey: updated.issueKey,
      status: updated.status,
      resolvedAt: updated.resolvedAt,
      assignedToLabel: updated.assignedToLabel,
      operatorNote: updated.operatorNote,
      resolutionReason: updated.resolutionReason,
      statusUpdatedBy: updated.statusUpdatedBy,
      statusUpdatedAt: updated.statusUpdatedAt
    }
  });

  revalidatePath("/operations/health");
  return updated;
}

export async function updateOperationsIssueStatusAction(formData: FormData) {
  await updateOperationsIssueStatusFromForm(formData);
}

export async function updateOperationsIssueStatusWithStateAction(
  _previousState: OperationsIssueStatusActionState,
  formData: FormData
): Promise<OperationsIssueStatusActionState> {
  const attemptedStatus = stringValue(formData, "status");

  try {
    const updated = await updateOperationsIssueStatusFromForm(formData);

    return {
      status: "success",
      message: buildOperationsIssueStatusSuccessMessage(updated.status),
      nextStep: buildOperationsIssueStatusNextStep(updated.status)
    };
  } catch (error) {
    const reason = error instanceof z.ZodError
      ? "입력값을 확인해 주세요. 담당자 120자, 메모와 처리 사유는 각각 1000자 이내여야 합니다."
      : error instanceof Error
        ? error.message
        : "운영 이슈 상태를 저장하지 못했습니다.";

    return {
      status: "error",
      message: buildOperationsIssueStatusErrorMessage(attemptedStatus, reason),
      nextStep: null
    };
  }
}
