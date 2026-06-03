import { describe, expect, it } from "vitest";
import { buildOperationsUsersOwnerPrompt, platformRequestAttentionCount } from "@/features/operations/operations-users-priority-panel";
import type { PlatformRequestOperationsSummary } from "@/server/repositories/platform-operations.repository";

function platformSummaryFixture(overrides: Partial<PlatformRequestOperationsSummary> = {}): PlatformRequestOperationsSummary {
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
    notifiedWithoutBids: 0,
    notifiedWithoutBidsPartnerActivity: 0,
    notifiedWithoutBidsPartnerUnseen: 0,
    notifiedWithoutBidsWithUnansweredQuestions: 0,
    notifiedWithoutBidsWithoutDocuments: 0,
    open: 0,
    openWithoutBids: 0,
    openWithoutMatches: 0,
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

describe("operations users priority panel", () => {
  it("prioritizes role requests before lower-priority user management work", () => {
    expect(buildOperationsUsersOwnerPrompt({
      attentionCompanies: 3,
      incompleteUsers: 8,
      pendingRoleRequests: 2,
      pendingVerificationDocuments: 4,
      platformAttention: 5
    })).toContain("역할 신청 2건");
  });

  it("prioritizes platform request bottlenecks before detailed user support", () => {
    expect(buildOperationsUsersOwnerPrompt({
      attentionCompanies: 0,
      incompleteUsers: 5,
      pendingRoleRequests: 0,
      pendingVerificationDocuments: 0,
      platformAttention: 3
    })).toContain("플랫폼 요청 병목 3건");
  });

  it("summarizes platform request attention from actionable marketplace counts", () => {
    expect(platformRequestAttentionCount(platformSummaryFixture({
      bidsReceived: 2,
      completedWithoutReport: 1,
      notifiedWithoutBids: 3,
      staleOpen: 4
    }))).toBe(10);
  });

  it("falls back to user support when there are no role or verification blockers", () => {
    expect(buildOperationsUsersOwnerPrompt({
      attentionCompanies: 0,
      incompleteUsers: 5,
      pendingRoleRequests: 0,
      pendingVerificationDocuments: 0,
      platformAttention: 0
    })).toContain("가입 미완료 사용자 5명");
  });
});
