import { describe, expect, it } from "vitest";
import { buildCompletionReportWorkflow } from "@/features/service-requests/service-request-completion-report-workflow";

describe("completion report workflow", () => {
  it("blocks submit until a report draft exists", () => {
    expect(buildCompletionReportWorkflow({
      hasReport: false,
      linkedDocumentCount: 0,
      requiredDocumentCount: 0,
      viewerRole: "requester"
    }).map((step) => [step.label, step.state, step.disabledReason])).toEqual([
      ["초안 저장", "current", "완료 리포트 초안 저장 필요"],
      ["리포트 제출", "blocked", "완료 리포트 초안 저장 필요"],
      ["화주 확인", "pending", "리포트 제출 후 확인 가능"],
      ["운영 검토", "pending", "양측 확인 후 운영 검토 가능"],
      ["보관 잠금", "pending", "운영 검토 후 잠금 가능"]
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
});
