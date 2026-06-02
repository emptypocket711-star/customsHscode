import type { ServiceRequestCompletionReportStatus } from "@/server/repositories/service-request-completion-report.repository";

export type CompletionReportViewerRole = "partner" | "requester" | "staff";

export type CompletionReportWorkflowInput = {
  hasReport: boolean;
  linkedDocumentCount: number;
  requiredDocumentCount: number;
  status?: ServiceRequestCompletionReportStatus;
  viewerRole: CompletionReportViewerRole;
};

export type CompletionReportWorkflowStep = {
  description: string;
  disabledReason?: string;
  label: string;
  state: "blocked" | "current" | "done" | "pending";
};

export function buildCompletionReportWorkflow(input: CompletionReportWorkflowInput): CompletionReportWorkflowStep[] {
  const status = input.status;
  const hasRequiredDocuments = input.requiredDocumentCount === 0 || input.linkedDocumentCount >= input.requiredDocumentCount;
  const reportExists = input.hasReport && Boolean(status);
  const submittedOrLater = status !== undefined && status !== "draft" && status !== "voided";
  const reviewedOrLocked = status === "operator_reviewed" || status === "locked";

  return [
    {
      description: reportExists ? "완료 결과 초안이 저장되었습니다." : "정산 요약과 완료 결과를 먼저 저장합니다.",
      disabledReason: reportExists ? undefined : "아래 초안 저장을 먼저 완료하세요",
      label: "초안 저장",
      state: reportExists ? "done" : "current"
    },
    {
      description: hasRequiredDocuments ? "연결된 보관 서류를 기준으로 제출 준비 상태를 확인합니다." : "필수 보관 서류를 먼저 연결합니다.",
      disabledReason: !reportExists ? "초안 저장 후 제출할 수 있습니다" : hasRequiredDocuments ? undefined : "필수 보관 서류 연결 후 제출할 수 있습니다",
      label: "리포트 제출",
      state: submittedOrLater ? "done" : reportExists && hasRequiredDocuments ? "current" : "blocked"
    },
    {
      description: input.viewerRole === "partner" ? "선정 파트너가 제출된 완료 리포트를 확인합니다." : "화주가 제출된 완료 리포트를 확인합니다.",
      disabledReason: submittedOrLater ? undefined : "리포트 제출 후 확인할 수 있습니다",
      label: input.viewerRole === "partner" ? "파트너 확인" : "화주 확인",
      state: status === "requester_acknowledged" || status === "partner_acknowledged" || reviewedOrLocked ? "done" : submittedOrLater ? "current" : "pending"
    },
    {
      description: "운영자가 민감정보, 서류 연결, 분쟁 가능성을 점검합니다.",
      disabledReason: reviewedOrLocked ? undefined : "화주 또는 파트너 확인 후 운영 검토가 가능합니다",
      label: "운영 검토",
      state: reviewedOrLocked ? "done" : status === "requester_acknowledged" || status === "partner_acknowledged" ? "current" : "pending"
    },
    {
      description: "잠금 후 완료 리포트와 보관 서류 연결은 수정할 수 없습니다.",
      disabledReason: status === "operator_reviewed" || status === "locked" ? undefined : "운영 검토 완료 후 잠금할 수 있습니다",
      label: "보관 잠금",
      state: status === "locked" ? "done" : status === "operator_reviewed" ? "current" : "pending"
    }
  ];
}

export function selectCurrentCompletionReportWorkflowStep(steps: CompletionReportWorkflowStep[]) {
  return steps.find((step) => step.state === "current")
    ?? steps.find((step) => step.state === "blocked")
    ?? steps.find((step) => step.state === "pending")
    ?? steps.at(-1);
}
