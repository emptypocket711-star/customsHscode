import { describe, expect, it } from "vitest";
import {
  buildPlatformRequestImprovementPrompt,
  platformRequestOperationsDetailSelects,
  summarizePlatformRequestOperations,
  type PlatformRequestOperationsDetail
} from "@/server/repositories/platform-operations.repository";

describe("platform request operations summary", () => {
  it("keeps operations detail selects free of sensitive raw fields", () => {
    const selectText = Object.values(platformRequestOperationsDetailSelects).join(",");
    const selectedColumns = selectText.split(",");

    expect(selectedColumns).not.toContain("title");
    expect(selectedColumns).not.toContain("product_summary");
    expect(selectedColumns).not.toContain("file_name");
    expect(selectedColumns).not.toContain("question");
    expect(selectedColumns).not.toContain("answer");
    expect(selectedColumns).not.toContain("message");
    expect(selectedColumns).not.toContain("total_amount");
  });

  it("prioritizes unanswered questions over other operational signals", () => {
    const summary = summarizePlatformRequestOperations({
      bids: [{ id: "bid-1", request_id: "req-2", status: "submitted" }],
      now: new Date("2026-06-01T00:00:00.000Z"),
      questions: [{ answer: null, id: "q-1", request_id: "req-1" }],
      requests: [
        { created_at: "2026-05-31T00:00:00.000Z", deadline_at: null, id: "req-1", request_type: "clearance", status: "open" },
        { created_at: "2026-05-31T00:00:00.000Z", deadline_at: null, id: "req-2", request_type: "freight", status: "bids_received" }
      ]
    });

    expect(summary.total).toBe(2);
    expect(summary.clearance).toBe(1);
    expect(summary.freight).toBe(1);
    expect(summary.unansweredQuestions).toBe(1);
    expect(summary.actionRequest).toContain("미답변 질문 1건");
    expect(summary.actionItems[0]).toMatchObject({
      href: "/operations/requests/req-1#request-questions",
      label: "미답변 질문 확인",
      requestId: "req-1",
      requestType: "clearance"
    });
  });

  it("flags open requests without bids", () => {
    const summary = summarizePlatformRequestOperations({
      bids: [],
      now: new Date("2026-06-01T00:00:00.000Z"),
      questions: [],
      requests: [
        { created_at: "2026-05-31T00:00:00.000Z", deadline_at: "2026-06-02T00:00:00.000Z", id: "req-1", request_type: "freight", status: "open" }
      ]
    });

    expect(summary.openWithoutBids).toBe(1);
    expect(summary.actionRequest).toContain("공개됐지만 견적이 없는 요청 1건");
    expect(summary.actionItems[0]).toMatchObject({
      href: "/operations/requests/req-1#request-bids",
      label: "견적 대기 확인",
      requestId: "req-1",
      requestType: "freight"
    });
  });

  it("tracks post-selection lifecycle counts and stale in-progress requests", () => {
    const summary = summarizePlatformRequestOperations({
      bids: [],
      now: new Date("2026-06-10T00:00:00.000Z"),
      questions: [],
      requests: [
        {
          created_at: "2026-06-01T00:00:00.000Z",
          deadline_at: null,
          id: "req-1",
          request_type: "freight",
          status: "in_progress",
          updated_at: "2026-06-01T00:00:00.000Z"
        },
        {
          created_at: "2026-06-02T00:00:00.000Z",
          deadline_at: null,
          id: "req-2",
          request_type: "clearance",
          status: "completed",
          updated_at: "2026-06-09T00:00:00.000Z"
        },
        {
          created_at: "2026-06-03T00:00:00.000Z",
          deadline_at: null,
          id: "req-3",
          request_type: "freight",
          status: "partner_selected",
          updated_at: "2026-06-09T00:00:00.000Z"
        }
      ]
    });

    expect(summary.inProgress).toBe(1);
    expect(summary.completed).toBe(1);
    expect(summary.partnerSelected).toBe(1);
    expect(summary.staleInProgress).toBe(1);
    expect(summary.actionRequest).toContain("7일 이상 진행중인 요청 1건");
    expect(summary.actionItems[0]).toMatchObject({
      href: "/operations/requests/req-1",
      label: "오래 진행중 요청 확인",
      requestId: "req-1",
      requestType: "freight"
    });
  });

  it("connects completed requests to feedback quality operations signals", () => {
    const summary = summarizePlatformRequestOperations({
      bids: [],
      completionReports: [
        { id: "report-1", request_id: "req-1", status: "draft" },
        { id: "report-2", request_id: "req-2", status: "draft" }
      ],
      feedbacks: [{
        communication_score: 2,
        document_quality_score: 4,
        id: "feedback-1",
        rating: 3,
        request_id: "req-1",
        response_speed_score: 5
      }],
      now: new Date("2026-06-10T00:00:00.000Z"),
      questions: [],
      requests: [
        {
          created_at: "2026-06-01T00:00:00.000Z",
          deadline_at: null,
          id: "req-1",
          request_type: "freight",
          status: "completed",
          updated_at: "2026-06-09T00:00:00.000Z"
        },
        {
          created_at: "2026-06-02T00:00:00.000Z",
          deadline_at: null,
          id: "req-2",
          request_type: "clearance",
          status: "completed",
          updated_at: "2026-06-09T00:00:00.000Z"
        }
      ]
    });

    expect(summary.feedbackCount).toBe(1);
    expect(summary.averageFeedbackRating).toBe(3);
    expect(summary.lowFeedbacks).toBe(1);
    expect(summary.completedWithoutReport).toBe(0);
    expect(summary.completedWithoutFeedback).toBe(1);
    expect(summary.actionRequest).toContain("낮은 후기 1건");
    expect(summary.actionItems[0]).toMatchObject({
      href: "/operations/requests/req-1",
      label: "낮은 후기 확인",
      requestId: "req-1",
      requestType: "freight"
    });
  });

  it("flags completed requests without completion reports before feedback follow-up", () => {
    const summary = summarizePlatformRequestOperations({
      bids: [],
      completionReports: [{ id: "report-1", request_id: "req-1", status: "draft" }],
      feedbacks: [],
      now: new Date("2026-06-10T00:00:00.000Z"),
      questions: [],
      requests: [
        {
          created_at: "2026-06-01T00:00:00.000Z",
          deadline_at: null,
          id: "req-1",
          request_type: "freight",
          status: "completed",
          updated_at: "2026-06-09T00:00:00.000Z"
        },
        {
          created_at: "2026-06-02T00:00:00.000Z",
          deadline_at: null,
          id: "req-2",
          request_type: "clearance",
          status: "completed",
          updated_at: "2026-06-09T00:00:00.000Z"
        }
      ]
    });

    expect(summary.completedWithoutReport).toBe(1);
    expect(summary.actionRequest).toContain("완료됐지만 완료 리포트가 없는 요청 1건");
    expect(summary.actionItems[0]).toMatchObject({
      href: "/operations/requests/req-2",
      label: "완료 리포트 없음",
      requestId: "req-2",
      requestType: "clearance"
    });
  });

  it("prioritizes submitted and acknowledged completion report transition queues before feedback follow-up", () => {
    const summary = summarizePlatformRequestOperations({
      bids: [],
      completionReports: [
        { id: "report-1", request_id: "req-1", status: "submitted" },
        { id: "report-2", request_id: "req-2", status: "requester_acknowledged" },
        { id: "report-3", request_id: "req-3", status: "operator_reviewed" },
        { id: "report-4", request_id: "req-4", status: "locked" }
      ],
      feedbacks: [],
      now: new Date("2026-06-10T00:00:00.000Z"),
      questions: [],
      requests: [
        { created_at: "2026-06-01T00:00:00.000Z", deadline_at: null, id: "req-1", request_type: "freight", status: "completed", updated_at: "2026-06-09T00:00:00.000Z" },
        { created_at: "2026-06-02T00:00:00.000Z", deadline_at: null, id: "req-2", request_type: "clearance", status: "completed", updated_at: "2026-06-09T00:00:00.000Z" },
        { created_at: "2026-06-03T00:00:00.000Z", deadline_at: null, id: "req-3", request_type: "freight", status: "completed", updated_at: "2026-06-09T00:00:00.000Z" },
        { created_at: "2026-06-04T00:00:00.000Z", deadline_at: null, id: "req-4", request_type: "clearance", status: "completed", updated_at: "2026-06-09T00:00:00.000Z" }
      ]
    });

    expect(summary.completionReportsSubmitted).toBe(1);
    expect(summary.completionReportsAcknowledged).toBe(1);
    expect(summary.completionReportsReadyToLock).toBe(1);
    expect(summary.completionReportsLocked).toBe(1);
    expect(summary.completedWithoutReport).toBe(0);
    expect(summary.completedWithoutFeedback).toBe(4);
    expect(summary.actionRequest).toContain("제출됐지만 상대방 확인이 필요한 완료 리포트 1건");
    expect(summary.actionItems[0]).toMatchObject({
      href: "/operations/requests/req-1",
      label: "리포트 확인 대기",
      requestId: "req-1",
      requestType: "freight"
    });
  });

  it("builds copy-ready improvement prompts without document file names", () => {
    const detail: PlatformRequestOperationsDetail = {
      bids: [],
      clearanceDetail: null,
      completionReport: null,
      documents: [{
        createdAt: "2026-06-01T00:00:00.000Z",
        documentId: "doc-1",
        documentType: "commercial_invoice",
        fileName: "sensitive-invoice.pdf",
        fileSize: 1234,
        visibility: "requester_only"
      }],
      freightDetail: null,
      questions: [{
        answer: null,
        answeredAt: null,
        bidderCompanyId: "company-1",
        createdAt: "2026-06-01T00:00:00.000Z",
        question: "제품 중량 확인이 필요합니다.",
        questionId: "question-1"
      }],
      request: {
        createdAt: "2026-06-01T00:00:00.000Z",
        deadlineAt: null,
        destinationCountryCode: "KR",
        direction: "import",
        hskCode: null,
        id: "req-1",
        originCountryCode: "CN",
        productSummary: "민감한 품목 설명",
        requestType: "freight",
        status: "open",
        title: "민감한 요청 제목"
      },
      schemaReady: true
    };

    const prompt = buildPlatformRequestImprovementPrompt(detail);

    expect(prompt?.category).toBe("question_response");
    expect(prompt?.prompt).toContain("미답변 질문 수: 1");
    expect(prompt?.prompt).toContain("서류 수: 1");
    expect(prompt?.prompt).not.toContain("sensitive-invoice.pdf");
    expect(prompt?.prompt).not.toContain("민감한 품목 설명");
    expect(prompt?.prompt).not.toContain("민감한 요청 제목");
  });

  it("builds lifecycle follow-up prompts for in-progress requests", () => {
    const detail: PlatformRequestOperationsDetail = {
      bids: [{ bidId: "bid-1", bidderCompanyId: "company-1", currency: "KRW", leadTimeDays: 2, message: null, selectedAt: "2026-06-01T00:00:00.000Z", status: "selected", submittedAt: "2026-06-01T00:00:00.000Z", totalAmount: 100000 }],
      clearanceDetail: null,
      completionReport: null,
      documents: [],
      freightDetail: null,
      questions: [],
      request: {
        createdAt: "2026-06-01T00:00:00.000Z",
        deadlineAt: null,
        destinationCountryCode: "KR",
        direction: "import",
        hskCode: null,
        id: "req-1",
        originCountryCode: "CN",
        productSummary: "민감한 품목 설명",
        requestType: "freight",
        status: "in_progress",
        title: "민감한 요청 제목"
      },
      schemaReady: true
    };

    const prompt = buildPlatformRequestImprovementPrompt(detail);

    expect(prompt?.category).toBe("lifecycle_followup");
    expect(prompt?.label).toBe("진행중 요청 완료 전환 개선");
    expect(prompt?.prompt).toContain("진행중 요청");
    expect(prompt?.prompt).not.toContain("민감한 품목 설명");
    expect(prompt?.prompt).not.toContain("민감한 요청 제목");
  });
});
