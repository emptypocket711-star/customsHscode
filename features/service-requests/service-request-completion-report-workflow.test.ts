import { describe, expect, it } from "vitest";
import {
  buildCompletionReportWorkflow,
  selectCurrentCompletionReportWorkflowStep
} from "@/features/service-requests/service-request-completion-report-workflow";

describe("completion report workflow", () => {
  it("blocks submit until a report draft exists", () => {
    expect(buildCompletionReportWorkflow({
      hasReport: false,
      linkedDocumentCount: 0,
      requiredDocumentCount: 0,
      viewerRole: "requester"
    }).map((step) => [step.label, step.state, step.disabledReason])).toEqual([
      ["초안 저장", "current", "아래 초안 저장을 먼저 완료하세요"],
      ["리포트 제출", "blocked", "초안 저장 후 제출할 수 있습니다"],
      ["화주 확인", "pending", "리포트 제출 후 확인할 수 있습니다"],
      ["운영 검토", "pending", "화주 또는 파트너 확인 후 운영 검토가 가능합니다"],
      ["보관 잠금", "pending", "운영 검토 완료 후 잠금할 수 있습니다"]
    ]);
  });

  it("explains that draft reports need archive documents before submit", () => {
    expect(buildCompletionReportWorkflow({
      hasReport: true,
      linkedDocumentCount: 0,
      requiredDocumentCount: 1,
      status: "draft",
      viewerRole: "requester"
    }).map((step) => [step.label, step.state, step.disabledReason])).toContainEqual([
      "리포트 제출",
      "blocked",
      "필수 보관 서류 연결 후 제출할 수 있습니다"
    ]);
  });

  it("shows submit as current for a draft with required documents", () => {
    expect(buildCompletionReportWorkflow({
      hasReport: true,
      linkedDocumentCount: 1,
      requiredDocumentCount: 1,
      status: "draft",
      viewerRole: "partner"
    }).map((step) => [step.label, step.state])).toEqual([
      ["초안 저장", "done"],
      ["리포트 제출", "current"],
      ["파트너 확인", "pending"],
      ["운영 검토", "pending"],
      ["보관 잠금", "pending"]
    ]);
  });

  it("marks operator review and lock as current after review", () => {
    expect(buildCompletionReportWorkflow({
      hasReport: true,
      linkedDocumentCount: 2,
      requiredDocumentCount: 1,
      status: "operator_reviewed",
      viewerRole: "requester"
    }).map((step) => [step.label, step.state])).toEqual([
      ["초안 저장", "done"],
      ["리포트 제출", "done"],
      ["화주 확인", "done"],
      ["운영 검토", "done"],
      ["보관 잠금", "current"]
    ]);
  });

  it("selects one primary next workflow action for dense panels", () => {
    const draftSteps = buildCompletionReportWorkflow({
      hasReport: true,
      linkedDocumentCount: 0,
      requiredDocumentCount: 1,
      status: "draft",
      viewerRole: "requester"
    });
    const lockedSteps = buildCompletionReportWorkflow({
      hasReport: true,
      linkedDocumentCount: 1,
      requiredDocumentCount: 1,
      status: "locked",
      viewerRole: "requester"
    });

    expect(selectCurrentCompletionReportWorkflowStep(draftSteps)?.label).toBe("리포트 제출");
    expect(selectCurrentCompletionReportWorkflowStep(draftSteps)?.disabledReason).toBe("필수 보관 서류 연결 후 제출할 수 있습니다");
    expect(selectCurrentCompletionReportWorkflowStep(lockedSteps)?.label).toBe("보관 잠금");
  });
});
