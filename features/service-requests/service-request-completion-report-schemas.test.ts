import { describe, expect, it } from "vitest";
import {
  serviceRequestCompletionReportDocumentSchema,
  serviceRequestCompletionReportSchema,
  serviceRequestCompletionReportTransitionSchema
} from "@/features/service-requests/service-request-completion-report-schemas";

const requestId = "11111111-1111-4111-8111-111111111111";
const reportId = "22222222-2222-4222-8222-222222222222";
const requestDocumentId = "33333333-3333-4333-8333-333333333333";

describe("service request completion report schema", () => {
  it("parses optional JSON strings and numeric fields", () => {
    expect(serviceRequestCompletionReportSchema.parse({
      currency: "KRW",
      finalAmount: "120000",
      requestId,
      requestType: "freight",
      settlementItems: "[{\"label\":\"운임\",\"amount\":120000}]",
      summary: "  운송 완료  ",
      timelineEvents: "[{\"label\":\"도착\"}]"
    })).toMatchObject({
      currency: "KRW",
      finalAmount: 120000,
      requestId,
      requestType: "freight",
      settlementItems: [{ label: "운임", amount: 120000 }],
      summary: "운송 완료",
      timelineEvents: [{ label: "도착" }]
    });
  });

  it("rejects invalid currency and negative final amount", () => {
    expect(() => serviceRequestCompletionReportSchema.parse({ currency: "원", requestId })).toThrow();
    expect(() => serviceRequestCompletionReportSchema.parse({ finalAmount: "-1", requestId })).toThrow();
  });

  it("rejects non-array settlement items", () => {
    expect(() => serviceRequestCompletionReportSchema.parse({
      requestId,
      settlementItems: "{\"label\":\"운임\"}"
    })).toThrow();
  });

  it("validates completion report document mapping input", () => {
    expect(serviceRequestCompletionReportDocumentSchema.parse({
      documentRole: "  final_bl_or_awb  ",
      reportId,
      requestDocumentId,
      requestId,
      requiredForArchive: "true"
    })).toEqual({
      documentRole: "final_bl_or_awb",
      reportId,
      requestDocumentId,
      requestId,
      requiredForArchive: true
    });
  });

  it("validates completion report status transition input", () => {
    expect(serviceRequestCompletionReportTransitionSchema.parse({
      acknowledgeRole: "requester",
      reportId,
      requestId,
      requestType: "freight",
      transition: "acknowledge"
    })).toEqual({
      acknowledgeRole: "requester",
      reportId,
      requestId,
      requestType: "freight",
      transition: "acknowledge"
    });

    expect(() => serviceRequestCompletionReportTransitionSchema.parse({
      acknowledgeRole: "viewer",
      reportId,
      transition: "acknowledge"
    })).toThrow();
    expect(() => serviceRequestCompletionReportTransitionSchema.parse({
      reportId,
      transition: "publish"
    })).toThrow();
  });
});
