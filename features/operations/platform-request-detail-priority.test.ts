import { describe, expect, it } from "vitest";
import { buildPlatformRequestDetailPrioritySignals } from "@/features/operations/platform-request-detail-priority";
import type { PlatformRequestOperationsDetail } from "@/server/repositories/platform-operations.repository";

function detailFixture(overrides: Partial<PlatformRequestOperationsDetail> = {}): PlatformRequestOperationsDetail {
  return {
    bids: [],
    clearanceDetail: null,
    completionReport: null,
    documents: [],
    feedbackSummary: { averageRating: null, count: 0, lowScoreCount: 0 },
    freightDetail: null,
    matchSummary: {
      declinedInterestCount: 0,
      failedNotificationCount: 0,
      interestedInterestCount: 0,
      matchedPartnerCount: 1,
      noneInterestCount: 1,
      pendingNotificationCount: 0,
      sentNotificationCount: 0,
      skippedNotificationCount: 0,
      viewedInterestCount: 0
    },
    questions: [],
    request: {
      createdAt: "2026-06-03T00:00:00.000Z",
      deadlineAt: null,
      destinationCountryCode: "KR",
      direction: "import",
      hskCode: null,
      id: "request-1",
      originCountryCode: "CN",
      productSummary: null,
      requestType: "freight",
      status: "open",
      title: "운영 샘플 요청"
    },
    schemaReady: true,
    ...overrides
  };
}

describe("platform request detail priority", () => {
  it("flags completed requests without completion reports or feedback first", () => {
    const signals = buildPlatformRequestDetailPrioritySignals(detailFixture({
      request: {
        ...detailFixture().request!,
        status: "completed"
      }
    }));

    expect(signals.map((signal) => signal.label)).toEqual(["완료 리포트", "피드백", "파트너 응답"]);
    expect(signals[0]).toMatchObject({ tone: "warning", value: "없음" });
    expect(signals[1]).toMatchObject({ tone: "warning", value: "없음" });
  });

  it("surfaces low feedback and locked completion report as separate signals", () => {
    const signals = buildPlatformRequestDetailPrioritySignals(detailFixture({
      completionReport: {
        currency: "KRW",
        documentMappings: [],
        finalAmountPresent: true,
        hasClearanceResult: false,
        hasFreightResult: true,
        lockedAt: "2026-06-03T00:00:00.000Z",
        reportId: "report-1",
        status: "locked",
        submittedAt: "2026-06-03T00:00:00.000Z",
        summaryPresent: true,
        updatedAt: "2026-06-03T00:00:00.000Z"
      },
      feedbackSummary: { averageRating: 2, count: 1, lowScoreCount: 1 },
      request: {
        ...detailFixture().request!,
        status: "completed"
      }
    }));

    expect(signals[0]).toMatchObject({ tone: "success", value: "잠금" });
    expect(signals[1]).toMatchObject({ tone: "warning", value: "1건" });
  });

  it("flags sent notifications with no active bids as partner no-response", () => {
    const signals = buildPlatformRequestDetailPrioritySignals(detailFixture({
      matchSummary: {
        declinedInterestCount: 0,
        failedNotificationCount: 0,
        interestedInterestCount: 0,
        matchedPartnerCount: 2,
        noneInterestCount: 2,
        pendingNotificationCount: 0,
        sentNotificationCount: 2,
        skippedNotificationCount: 0,
        viewedInterestCount: 0
      }
    }));

    expect(signals[2]).toMatchObject({ tone: "warning", value: "무응답" });
  });
});
