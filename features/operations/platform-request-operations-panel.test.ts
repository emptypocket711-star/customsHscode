import { describe, expect, it } from "vitest";
import { buildPlatformRequestOperationsMetricGroups } from "@/features/operations/platform-request-operations-panel";
import type { PlatformRequestOperationsSummary } from "@/server/repositories/platform-operations.repository";

function summaryFixture(overrides: Partial<PlatformRequestOperationsSummary> = {}): PlatformRequestOperationsSummary {
  return {
    actionItems: [],
    actionRequest: "다음 MVP 기능 구현 계속 진행",
    averageFeedbackRating: null,
    bidsReceived: 0,
    clearance: 0,
    completed: 0,
    completedWithoutFeedback: 0,
    completedWithoutReport: 0,
    completionReportsAcknowledged: 0,
    completionReportsLocked: 0,
    completionReportsReadyToLock: 0,
    completionReportsSubmitted: 0,
    draft: 0,
    feedbackCount: 0,
    freight: 0,
    inProgress: 0,
    lowFeedbacks: 0,
    open: 0,
    openWithoutBids: 0,
    partnerSelected: 0,
    schemaReady: true,
    staleDrafts: 0,
    staleInProgress: 0,
    staleOpen: 0,
    total: 0,
    unansweredQuestions: 0,
    ...overrides
  };
}

describe("platform request operations panel", () => {
  it("keeps the default operations view focused on four primary metrics", () => {
    const groups = buildPlatformRequestOperationsMetricGroups(summaryFixture({
      bidsReceived: 2,
      clearance: 3,
      completed: 1,
      feedbackCount: 4,
      freight: 5,
      inProgress: 6,
      lowFeedbacks: 1,
      open: 7,
      partnerSelected: 8,
      total: 9
    }));

    expect(groups.primaryMetrics.map((metric) => metric.label)).toEqual([
      "전체 요청",
      "진행 요청",
      "선정 후 진행",
      "거래 후기"
    ]);
    expect(groups.diagnosticMetrics).toHaveLength(11);
  });

  it("moves workflow diagnosis counts out of the default metric cards", () => {
    const groups = buildPlatformRequestOperationsMetricGroups(summaryFixture({
      completedWithoutFeedback: 2,
      completionReportsReadyToLock: 3,
      openWithoutBids: 4,
      staleOpen: 5,
      unansweredQuestions: 6
    }));

    expect(groups.primaryMetrics.map((metric) => metric.label)).not.toContain("미답변 질문");
    expect(groups.primaryMetrics.map((metric) => metric.label)).not.toContain("견적 없는 공개");
    expect(groups.diagnosticMetrics.map((metric) => metric.label)).toContain("미답변 질문");
    expect(groups.diagnosticMetrics.map((metric) => metric.label)).toContain("견적 없는 공개");
  });
});
