import { describe, expect, it } from "vitest";
import { canShowCompletionReportPreviewForRoute } from "@/features/service-requests/service-request-completion-report-preview-route";

describe("completion report preview route guard", () => {
  it("allows a non-voided report when the route kind matches the report type", () => {
    expect(canShowCompletionReportPreviewForRoute({ requestType: "freight", status: "locked" }, "freight")).toBe(true);
    expect(canShowCompletionReportPreviewForRoute({ requestType: "clearance", status: "operator_reviewed" }, "clearance")).toBe(true);
  });

  it("blocks missing, voided, or route/report type mismatched reports", () => {
    expect(canShowCompletionReportPreviewForRoute(undefined, "freight")).toBe(false);
    expect(canShowCompletionReportPreviewForRoute({ requestType: "freight", status: "voided" }, "freight")).toBe(false);
    expect(canShowCompletionReportPreviewForRoute({ requestType: "clearance", status: "locked" }, "freight")).toBe(false);
    expect(canShowCompletionReportPreviewForRoute({ requestType: "freight", status: "locked" }, "clearance")).toBe(false);
  });
});
