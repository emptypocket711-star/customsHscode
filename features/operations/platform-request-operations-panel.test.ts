import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { buildPlatformRequestOperationsMetricGroups, PlatformRequestOperationsPanel } from "@/features/operations/platform-request-operations-panel";
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
    expect(groups.diagnosticMetrics).toHaveLength(17);
  });

  it("moves workflow diagnosis counts out of the default metric cards", () => {
    const groups = buildPlatformRequestOperationsMetricGroups(summaryFixture({
      completedWithoutFeedback: 2,
      completionReportsReadyToLock: 3,
      openWithoutBids: 4,
      openWithoutMatches: 1,
      staleOpen: 5,
      unansweredQuestions: 6
    }));

    expect(groups.primaryMetrics.map((metric) => metric.label)).not.toContain("미답변 질문");
    expect(groups.primaryMetrics.map((metric) => metric.label)).not.toContain("견적 없는 공개");
    expect(groups.diagnosticMetrics.map((metric) => metric.label)).toContain("미답변 질문");
    expect(groups.diagnosticMetrics.map((metric) => metric.label)).toContain("노출 0건");
    expect(groups.diagnosticMetrics.map((metric) => metric.label)).toContain("알림 후 무응답");
    expect(groups.diagnosticMetrics.map((metric) => metric.label)).toContain("무응답·질문");
    expect(groups.diagnosticMetrics.map((metric) => metric.label)).toContain("무응답·서류 없음");
    expect(groups.diagnosticMetrics.map((metric) => metric.label)).toContain("무응답·파트너 활동");
    expect(groups.diagnosticMetrics.map((metric) => metric.label)).toContain("무응답·미열람 추정");
    expect(groups.diagnosticMetrics.map((metric) => metric.label)).toContain("견적 없는 공개");
  });

  it("renders one primary owner action and collapses the next candidates", () => {
    const html = renderToStaticMarkup(
      createElement(PlatformRequestOperationsPanel, {
        summary: summaryFixture({
          actionItems: [{
            detail: "운송 요청의 견적 비교·선택 위치를 확인합니다.",
            href: "/operations/requests/req-1#request-bids",
            label: "견적 비교 확인",
            requestId: "req-1",
            requestType: "freight",
            status: "bids_received"
          }],
          actionRequest: "견적이 도착한 요청 1건의 비교·선택 전환 UX를 점검해줘.",
          bidsReceived: 1,
          completedWithoutReport: 1,
          unansweredQuestions: 1,
          total: 1
        })
      })
    );

    expect(html).toContain("지금 바로 맡길 1순위만 먼저 보여주고");
    expect(html).toContain("다음 후보 2개 보기");
    expect(html).toContain("바로 확인할 운영 샘플");
    expect(html).toContain("/operations/requests/req-1#request-bids");
    expect(html).toContain("담당 개발자");
    expect(html).toContain("이유 선정 전환 병목");
    expect(html.indexOf("바로 확인할 운영 샘플")).toBeLessThan(html.indexOf("상세 진단 지표와 확인 샘플"));
  });

  it("keeps the copy-ready operations request short enough for implementation handoff", () => {
    const html = renderToStaticMarkup(
      createElement(PlatformRequestOperationsPanel, {
        summary: summaryFixture({
          actionItems: [],
          actionRequest: "완료 리포트 없는 요청 1건의 정산·보관 서류 흐름을 점검해줘.",
          completed: 4,
          completedWithoutFeedback: 2,
          completedWithoutReport: 1,
          completionReportsAcknowledged: 3,
          completionReportsLocked: 5,
          completionReportsReadyToLock: 6,
          completionReportsSubmitted: 7,
          feedbackCount: 8,
          inProgress: 9,
          notifiedWithoutBids: 1,
          notifiedWithoutBidsPartnerActivity: 1,
          notifiedWithoutBidsPartnerUnseen: 0,
          notifiedWithoutBidsWithUnansweredQuestions: 1,
          notifiedWithoutBidsWithoutDocuments: 1,
          open: 10,
          total: 11
        })
      })
    );

    expect(html).toContain("핵심 지표:");
    expect(html).toContain("완료 리포트 없음: 1건");
    expect(html).toContain("알림 후 무응답: 1건");
    expect(html).toContain("무응답 원인 단서: 미답변 질문 1건 / 공개 서류 없음 1건 / 파트너 활동 1건 / 미열람 추정 0건");
    expect(html).not.toContain("완료 리포트 운영 검토 필요: 3건");
    expect(html).not.toContain("완료 리포트 잠금 완료: 5건");
  });

  it("links schema fallback guidance to the operations schema health check", () => {
    const html = renderToStaticMarkup(
      createElement(PlatformRequestOperationsPanel, {
        summary: summaryFixture({
          actionRequest: "플랫폼 요청 DB 스키마 적용 상태를 먼저 확인해줘.",
          schemaReady: false
        })
      })
    );

    expect(html).toContain("요청·입찰 기능 DB 스키마 적용 상태를 먼저 확인");
    expect(html).toContain("운영 DB 스키마 점검 보기");
    expect(html).toContain("/operations/health#schema-health");
  });

  it("renders no-response cause segmentation in the owner action detail", () => {
    const html = renderToStaticMarkup(
      createElement(PlatformRequestOperationsPanel, {
        summary: summaryFixture({
          actionItems: [],
          actionRequest: "알림 후 무응답 요청을 점검해줘.",
          notifiedWithoutBids: 3,
          notifiedWithoutBidsPartnerActivity: 1,
          notifiedWithoutBidsPartnerUnseen: 2,
          notifiedWithoutBidsWithUnansweredQuestions: 1,
          notifiedWithoutBidsWithoutDocuments: 2,
          total: 3
        })
      })
    );

    expect(html).toContain("알림 후 무응답");
    expect(html).toContain("질문 1건 / 서류 없음 2건 / 파트너 활동 1건 / 미열람 추정 2건");
    expect(html).toContain("무응답·질문");
    expect(html).toContain("무응답·서류 없음");
    expect(html).toContain("무응답·파트너 활동");
    expect(html).toContain("무응답·미열람 추정");
  });
});
