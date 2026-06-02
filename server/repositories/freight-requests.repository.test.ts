import { describe, expect, it } from "vitest";
import {
  assertUploadableServiceRequestDocument,
  calculateServiceRequestDocumentSha256,
  createServiceRequestDocumentStoragePath,
  serviceRequestListLimit,
  serviceRequestOpportunityScanLimit,
  serviceRequestDocumentsBucket
} from "@/server/repositories/freight-requests.repository";
import {
  clearanceServiceRequestListLimit,
  clearanceServiceRequestOpportunityScanLimit
} from "@/server/repositories/clearance-requests.repository";
import {
  buildPartnerOpportunityNextFocus,
  buildRequesterServiceRequestNextFocus,
  completedServiceRequestIds,
  groupServiceRequestItemsByRequestId,
  serviceRequestFeedbackMapToRecord,
  shouldLoadServiceRequestFeedback,
  uniqueServiceRequestIds
} from "@/server/repositories/service-request-list-view";
import { listOwnServiceRequestFeedbackRecordForRequest } from "@/server/repositories/service-request-feedback.repository";

describe("freight request document helpers", () => {
  it("keeps requester lists bounded and scans extra partner matches before type filtering", () => {
    expect(serviceRequestListLimit).toBe(20);
    expect(clearanceServiceRequestListLimit).toBe(20);
    expect(serviceRequestOpportunityScanLimit).toBeGreaterThan(serviceRequestListLimit);
    expect(clearanceServiceRequestOpportunityScanLimit).toBeGreaterThan(clearanceServiceRequestListLimit);
  });

  it("deduplicates request ids and groups request-scoped items for list pages", () => {
    expect(uniqueServiceRequestIds([{ id: "req-1" }, { id: "req-2" }], [{ id: "req-2" }, { id: "req-3" }])).toEqual([
      "req-1",
      "req-2",
      "req-3"
    ]);
    expect(groupServiceRequestItemsByRequestId([
      { requestId: "req-1", value: "a" },
      { requestId: "req-1", value: "b" },
      { requestId: "req-2", value: "c" }
    ])).toEqual({
      "req-1": [{ requestId: "req-1", value: "a" }, { requestId: "req-1", value: "b" }],
      "req-2": [{ requestId: "req-2", value: "c" }]
    });
    expect(serviceRequestFeedbackMapToRecord(new Map([["req-1", { rating: 5 }]]))).toEqual({
      "req-1": { rating: 5 }
    });
  });

  it("limits feedback lookups to completed service requests", () => {
    expect(completedServiceRequestIds(
      [{ id: "req-1", status: "completed" }, { id: "req-2", status: "open" }],
      [{ id: "req-1", status: "completed" }, { id: "req-3", status: "partner_selected" }]
    )).toEqual(["req-1"]);
    expect(shouldLoadServiceRequestFeedback("completed")).toBe(true);
    expect(shouldLoadServiceRequestFeedback("in_progress")).toBe(false);
    expect(shouldLoadServiceRequestFeedback("partner_selected")).toBe(false);
  });

  it("loads own feedback records only for completed detail requests", async () => {
    const skippedCalls: string[] = [];
    const skippedFeedback = await listOwnServiceRequestFeedbackRecordForRequest({
      rpc: (name: string) => {
        skippedCalls.push(name);
        throw new Error("feedback lookup should be skipped");
      }
    } as never, { id: "req-1", status: "in_progress" });

    expect(skippedFeedback).toEqual({});
    expect(skippedCalls).toEqual([]);

    const supabase = {
      rpc: async (name: string) => {
        expect(name).toBe("current_company_id");
        return { data: "company-1", error: null };
      },
      from: (table: string) => {
        expect(table).toBe("service_request_feedbacks");
        return {
          select() {
            return this;
          },
          eq(column: string, value: string) {
            expect(column).toBe("reviewer_company_id");
            expect(value).toBe("company-1");
            return this;
          },
          in(column: string, values: string[]) {
            expect(column).toBe("request_id");
            expect(values).toEqual(["req-1"]);
            return this;
          },
          order(column: string, options: { ascending: boolean }) {
            expect(column).toBe("created_at");
            expect(options).toEqual({ ascending: false });
            return Promise.resolve({
              data: [{
                created_at: "2026-06-01T00:00:00.000Z",
                id: "feedback-1",
                rating: 5,
                request_id: "req-1"
              }],
              error: null
            });
          }
        };
      }
    };

    await expect(listOwnServiceRequestFeedbackRecordForRequest(supabase as never, { id: "req-1", status: "completed" })).resolves.toEqual({
      "req-1": {
        createdAt: "2026-06-01T00:00:00.000Z",
        feedbackId: "feedback-1",
        rating: 5,
        requestId: "req-1"
      }
    });
  });

  it("prioritizes requester detail next-focus actions consistently", () => {
    expect(buildRequesterServiceRequestNextFocus({
      bidCount: 2,
      documentCount: 1,
      questionAnchor: "#request-questions",
      requestStatus: "bids_received",
      unansweredQuestionCount: 1
    })).toMatchObject({ href: "#request-questions", label: "미답변 질문", tone: "warning", value: "1건" });

    expect(buildRequesterServiceRequestNextFocus({
      bidCount: 2,
      documentCount: 1,
      questionAnchor: "#request-questions",
      requestStatus: "bids_received",
      unansweredQuestionCount: 0
    })).toMatchObject({ href: "#request-bids", label: "견적 비교", tone: "info", value: "2건" });

    expect(buildRequesterServiceRequestNextFocus({
      bidCount: 0,
      documentCount: 0,
      publishAnchor: "#request-publish",
      questionAnchor: "#request-questions",
      requestStatus: "draft",
      unansweredQuestionCount: 0
    })).toMatchObject({ href: "#request-documents", label: "서류 첨부", tone: "warning", value: "권장" });

    expect(buildRequesterServiceRequestNextFocus({
      bidCount: 0,
      documentCount: 1,
      publishAnchor: "#request-publish",
      questionAnchor: "#request-questions",
      requestStatus: "draft",
      unansweredQuestionCount: 0
    })).toMatchObject({ href: "#request-publish", label: "공개 설정", tone: "info", value: "대기" });
  });

  it("prioritizes partner opportunity question review before bid submission", () => {
    expect(buildPartnerOpportunityNextFocus({
      bidAnchor: "#opportunity-bid",
      questionAnchor: "#opportunity-questions",
      unansweredQuestionCount: 2
    })).toMatchObject({ href: "#opportunity-questions", label: "질문 답변 확인", tone: "warning", value: "2건" });

    expect(buildPartnerOpportunityNextFocus({
      bidAnchor: "#opportunity-bid",
      questionAnchor: "#opportunity-questions",
      unansweredQuestionCount: 0
    })).toMatchObject({ href: "#opportunity-bid", label: "견적 제출", tone: "info", value: "작성" });
  });

  it("uses the private service request documents bucket", () => {
    expect(serviceRequestDocumentsBucket).toBe("service-request-documents");
  });

  it("builds storage paths with company and request id segments", () => {
    const path = createServiceRequestDocumentStoragePath({
      companyId: "00000000-0000-0000-0000-000000000001",
      requestId: "00000000-0000-0000-0000-000000000002",
      fileName: "Commercial Invoice 2026/05.pdf"
    });

    expect(path).toMatch(
      /^00000000-0000-0000-0000-000000000001\/00000000-0000-0000-0000-000000000002\/[0-9a-f-]+-Commercial-Invoice-2026-05\.pdf$/
    );
  });

  it("calculates deterministic service request document checksums", () => {
    expect(calculateServiceRequestDocumentSha256(Buffer.from("service request document"))).toBe(
      "560f138f5c746ff9c0be4fb36bcf99604b9c83ef0afd9a1443709f9759ffb818"
    );
  });

  it("allows trade documents and rejects unsupported file types", () => {
    expect(() =>
      assertUploadableServiceRequestDocument(new File(["mock"], "invoice.xlsx", {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      }))
    ).not.toThrow();

    expect(() =>
      assertUploadableServiceRequestDocument(new File(["mock"], "invoice.exe", {
        type: "application/octet-stream"
      }))
    ).toThrow("요청 서류는 PDF, 이미지, XLS, XLSX, CSV 형식만 업로드할 수 있습니다.");

    expect(() =>
      assertUploadableServiceRequestDocument(new File(["mock"], "payload.exe", {
        type: ""
      }))
    ).toThrow("요청 서류는 PDF, 이미지, XLS, XLSX, CSV 형식만 업로드할 수 있습니다.");
  });
});
