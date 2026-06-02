import { describe, expect, it } from "vitest";
import {
  attachServiceRequestCompletionReportDocument,
  listCompletionReportDocumentsForReports,
  listOwnCompletionReportsForRequests,
  saveServiceRequestCompletionReport,
  selectCompletionReportForRequest,
  serviceRequestCompletionReportDocumentsToRecord,
  serviceRequestCompletionReportListToRecord,
  transitionServiceRequestCompletionReport
} from "@/server/repositories/service-request-completion-report.repository";

describe("service request completion report repository", () => {
  it("deduplicates request ids and maps completion report rows", async () => {
    const calls: Array<{ column: string; values: string[] }> = [];
    const supabase = {
      from(table: string) {
        expect(table).toBe("service_request_completion_reports");
        return {
          select() {
            return this;
          },
          in(column: string, values: string[]) {
            calls.push({ column, values });
            return this;
          },
          neq(column: string, value: string) {
            expect(column).toBe("status");
            expect(value).toBe("voided");
            return this;
          },
          order(column: string, options: { ascending: boolean }) {
            expect(column).toBe("updated_at");
            expect(options).toEqual({ ascending: false });
            return Promise.resolve({
              data: [{
                clearance_result: {},
                created_at: "2026-06-01T00:00:00.000Z",
                currency: "KRW",
                final_amount: 120000,
                freight_result: { blOrAwbNo: "BL-1" },
                id: "report-1",
                locked_at: null,
                request_id: "req-1",
                request_type: "freight",
                requester_company_id: "company-1",
                selected_partner_company_id: "company-2",
                settlement_items: [{ label: "운임" }],
                source_snapshot: { request_status: "completed" },
                status: "draft",
                submitted_at: null,
                summary: "운송 완료",
                timeline_events: [],
                updated_at: "2026-06-01T01:00:00.000Z"
              }],
              error: null
            });
          }
        };
      }
    };

    await expect(listOwnCompletionReportsForRequests(supabase as never, ["req-1", "req-1", ""])).resolves.toEqual({
      items: [{
        clearanceResult: {},
        createdAt: "2026-06-01T00:00:00.000Z",
        currency: "KRW",
        finalAmount: 120000,
        freightResult: { blOrAwbNo: "BL-1" },
        lockedAt: null,
        reportId: "report-1",
        requestId: "req-1",
        requestType: "freight",
        requesterCompanyId: "company-1",
        selectedPartnerCompanyId: "company-2",
        settlementItems: [{ label: "운임" }],
        sourceSnapshot: { request_status: "completed" },
        status: "draft",
        submittedAt: null,
        summary: "운송 완료",
        timelineEvents: [],
        updatedAt: "2026-06-01T01:00:00.000Z"
      }],
      schemaReady: true
    });
    expect(calls).toEqual([{ column: "request_id", values: ["req-1"] }]);
  });

  it("keeps the first report per request when converting the ordered list to a record", () => {
    const latest = {
      clearanceResult: {},
      createdAt: "2026-06-01T00:00:00.000Z",
      currency: "KRW",
      finalAmount: 120000,
      freightResult: {},
      lockedAt: null,
      reportId: "report-latest",
      requestId: "req-1",
      requesterCompanyId: "company-1",
      requestType: "freight" as const,
      selectedPartnerCompanyId: "company-2",
      settlementItems: [],
      sourceSnapshot: {},
      status: "locked" as const,
      submittedAt: "2026-06-01T00:00:00.000Z",
      summary: "latest",
      timelineEvents: [],
      updatedAt: "2026-06-02T00:00:00.000Z"
    };
    const older = {
      ...latest,
      reportId: "report-older",
      summary: "older",
      updatedAt: "2026-06-01T00:00:00.000Z"
    };

    expect(serviceRequestCompletionReportListToRecord([latest, older])).toEqual({
      "req-1": latest
    });
    expect(selectCompletionReportForRequest([latest, older], "req-1")).toBe(latest);
    expect(selectCompletionReportForRequest([latest, older], "req-missing")).toBeUndefined();
  });

  it("returns schemaReady false when completion report tables are absent", async () => {
    const supabase = {
      from() {
        return {
          select() {
            return this;
          },
          in() {
            return this;
          },
          neq() {
            return this;
          },
          order() {
            return Promise.resolve({ data: null, error: { code: "42P01", message: "missing table" } });
          }
        };
      }
    };

    await expect(listOwnCompletionReportsForRequests(supabase as never, ["req-1"])).resolves.toEqual({
      items: [],
      schemaReady: false
    });
  });

  it("calls the audited completion report RPC for saves", async () => {
    const supabase = {
      rpc(name: string, params: Record<string, unknown>) {
        expect(name).toBe("create_or_update_completion_report");
        expect(params).toMatchObject({
          p_request_id: "req-1",
          p_payload: {
            currency: "KRW",
            finalAmount: 120000,
            settlementItems: [{ label: "운임" }],
            summary: "운송 완료"
          }
        });
        return Promise.resolve({ data: "report-1", error: null });
      }
    };

    await expect(saveServiceRequestCompletionReport(supabase as never, {
      currency: "KRW",
      finalAmount: 120000,
      requestId: "req-1",
      requestType: "freight",
      settlementItems: [{ label: "운임" }],
      summary: "운송 완료"
    })).resolves.toEqual({
      reportId: "report-1",
      requestId: "req-1"
    });
  });

  it("lists completion report document mappings", async () => {
    const supabase = {
      from(table: string) {
        expect(table).toBe("service_request_completion_report_documents");
        return {
          select() {
            return this;
          },
          in(column: string, values: string[]) {
            expect(column).toBe("completion_report_id");
            expect(values).toEqual(["report-1"]);
            return this;
          },
          order(column: string, options: { ascending: boolean }) {
            expect(column).toBe("created_at");
            expect(options).toEqual({ ascending: false });
            return Promise.resolve({
              data: [{
                completion_report_id: "report-1",
                created_at: "2026-06-01T00:00:00.000Z",
                document_role: "final_bl_or_awb",
                id: "mapping-1",
                request_document_id: "document-1",
                required_for_archive: true
              }],
              error: null
            });
          }
        };
      }
    };

    await expect(listCompletionReportDocumentsForReports(supabase as never, ["report-1", "report-1"])).resolves.toEqual({
      items: [{
        createdAt: "2026-06-01T00:00:00.000Z",
        documentRole: "final_bl_or_awb",
        mappingId: "mapping-1",
        reportId: "report-1",
        requestDocumentId: "document-1",
        requiredForArchive: true
      }],
      schemaReady: true
    });
  });

  it("groups completion report document mappings by report id", () => {
    expect(serviceRequestCompletionReportDocumentsToRecord([
      {
        createdAt: "2026-06-01T00:00:00.000Z",
        documentRole: "final_bl_or_awb",
        mappingId: "mapping-1",
        reportId: "report-1",
        requestDocumentId: "document-1",
        requiredForArchive: true
      },
      {
        createdAt: "2026-06-01T00:10:00.000Z",
        documentRole: "freight_invoice",
        mappingId: "mapping-2",
        reportId: "report-1",
        requestDocumentId: "document-2",
        requiredForArchive: false
      },
      {
        createdAt: "2026-06-01T00:20:00.000Z",
        documentRole: "commercial_invoice",
        mappingId: "mapping-3",
        reportId: "report-2",
        requestDocumentId: "document-3",
        requiredForArchive: false
      }
    ])).toEqual({
      "report-1": [
        {
          createdAt: "2026-06-01T00:00:00.000Z",
          documentRole: "final_bl_or_awb",
          mappingId: "mapping-1",
          reportId: "report-1",
          requestDocumentId: "document-1",
          requiredForArchive: true
        },
        {
          createdAt: "2026-06-01T00:10:00.000Z",
          documentRole: "freight_invoice",
          mappingId: "mapping-2",
          reportId: "report-1",
          requestDocumentId: "document-2",
          requiredForArchive: false
        }
      ],
      "report-2": [{
        createdAt: "2026-06-01T00:20:00.000Z",
        documentRole: "commercial_invoice",
        mappingId: "mapping-3",
        reportId: "report-2",
        requestDocumentId: "document-3",
        requiredForArchive: false
      }]
    });
  });

  it("calls the audited completion report document attach RPC", async () => {
    const supabase = {
      rpc(name: string, params: Record<string, unknown>) {
        expect(name).toBe("attach_completion_report_document");
        expect(params).toEqual({
          p_document_role: "final_bl_or_awb",
          p_report_id: "report-1",
          p_request_document_id: "document-1",
          p_required_for_archive: true
        });
        return Promise.resolve({ data: "mapping-1", error: null });
      }
    };

    await expect(attachServiceRequestCompletionReportDocument(supabase as never, {
      documentRole: "final_bl_or_awb",
      reportId: "report-1",
      requestDocumentId: "document-1",
      requestId: "req-1",
      requiredForArchive: true
    })).resolves.toEqual({
      mappingId: "mapping-1",
      reportId: "report-1",
      requestId: "req-1"
    });
  });

  it("calls the audited completion report transition RPCs", async () => {
    const calls: Array<{ name: string; params: Record<string, unknown> }> = [];
    const supabase = {
      rpc(name: string, params: Record<string, unknown>) {
        calls.push({ name, params });
        return Promise.resolve({ data: "report-1", error: null });
      }
    };

    await expect(transitionServiceRequestCompletionReport(supabase as never, {
      reportId: "report-1",
      requestId: "req-1",
      transition: "submit"
    })).resolves.toEqual({ reportId: "report-1", requestId: "req-1", transition: "submit" });

    await expect(transitionServiceRequestCompletionReport(supabase as never, {
      acknowledgeRole: "requester",
      reportId: "report-1",
      requestId: "req-1",
      transition: "acknowledge"
    })).resolves.toEqual({ reportId: "report-1", requestId: "req-1", transition: "acknowledge" });

    await expect(transitionServiceRequestCompletionReport(supabase as never, {
      reportId: "report-1",
      requestId: "req-1",
      transition: "review"
    })).resolves.toEqual({ reportId: "report-1", requestId: "req-1", transition: "review" });

    await expect(transitionServiceRequestCompletionReport(supabase as never, {
      reportId: "report-1",
      requestId: "req-1",
      transition: "lock"
    })).resolves.toEqual({ reportId: "report-1", requestId: "req-1", transition: "lock" });

    expect(calls).toEqual([
      { name: "submit_completion_report", params: { p_report_id: "report-1" } },
      { name: "acknowledge_completion_report", params: { p_report_id: "report-1", p_role: "requester" } },
      { name: "review_completion_report", params: { p_report_id: "report-1" } },
      { name: "lock_completion_report", params: { p_report_id: "report-1" } }
    ]);
  });
});
