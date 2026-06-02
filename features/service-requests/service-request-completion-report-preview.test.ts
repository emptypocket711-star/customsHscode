import { describe, expect, it } from "vitest";
import { buildCompletionReportPreview } from "@/features/service-requests/service-request-completion-report-preview";

describe("completion report preview", () => {
  it("builds a locked preview with source locks and archive document roles", () => {
    const preview = buildCompletionReportPreview({
      archiveDocuments: [
        { documentRole: "final_bl_or_awb", requiredForArchive: true },
        { documentRole: "commercial_invoice", requiredForArchive: false }
      ],
      createdAt: "2026-06-01T00:00:00.000Z",
      currency: "KRW",
      finalAmount: 120000,
      freightResult: {
        arrivalDate: "2026-06-08",
        blOrAwbNo: "BL-123",
        carrier: "Carrier",
        exceptions: ["지연 없음"]
      },
      lockedAt: "2026-06-02T00:00:00.000Z",
      reportId: "report-1",
      requestId: "request-1",
      requesterCompanyId: "company-requester",
      requestType: "freight",
      selectedPartnerCompanyId: "company-partner",
      settlementItems: [{ amount: 120000, currency: "KRW", label: "운임" }],
      sourceSnapshot: {
        lookup: {
          source_lookup_snapshot: {
            source_name: "official tariff source",
            source_url: "https://example.test/source",
            source_version: "2026",
            effective_from: "2026-01-01",
            retrieved_at: "2026-06-01T00:00:00.000Z",
            checksum: "abc123"
          }
        },
        snapshot_version: "completion-report-source-v1",
        request: {
          basis_date: "2026-06-01",
          direction: "export",
          has_source_lookup_snapshot: true,
          request_status: "completed",
          source_hs_request_id: "hs-request-1"
        },
        selected_bid: {
          bid_type: "freight",
          selected_at: "2026-06-01T01:00:00.000Z",
          selected_bid_id: "bid-1"
        }
      },
      status: "locked",
      submittedAt: "2026-06-01T02:00:00.000Z",
      summary: "운송 완료",
      updatedAt: "2026-06-02T00:00:00.000Z"
    });

    expect(preview.watermark).toBe("정식 보관본");
    expect(preview.sourceSnapshotVersion).toBe("completion-report-source-v1");
    expect(preview.requestBasis).toEqual({
      basisDate: "2026-06-01",
      direction: "export",
      hasSourceLookupSnapshot: true,
      requestStatus: "completed",
      sourceHsRequestId: "hs-request-1"
    });
    expect(preview.selectedBidBasis).toEqual({
      bidType: "freight",
      selectedAt: "2026-06-01T01:00:00.000Z",
      selectedBidId: "bid-1"
    });
    expect(preview.archiveDocuments).toEqual([
      { documentRole: "final_bl_or_awb", linked: true, requiredForArchive: true },
      { documentRole: "commercial_invoice", linked: true, requiredForArchive: false }
    ]);
    expect(preview.sourceLocks).toEqual([{
      checksum: "abc123",
      effectiveFrom: "2026-01-01",
      effectiveTo: null,
      publishedAt: undefined,
      retrievedAt: "2026-06-01T00:00:00.000Z",
      sourceName: "official tariff source",
      sourceUrl: "https://example.test/source",
      sourceVersion: "2026"
    }]);
  });

  it("keeps raw document and message fields out of the preview model", () => {
    const preview = buildCompletionReportPreview({
      archiveDocuments: [{ documentRole: "import_declaration_certificate", requiredForArchive: true }],
      clearanceResult: {
        cautions: ["추가 확인 필요"],
        declaredHskCode: "3926909000",
        taxSummary: [{ amount: 1000, currency: "KRW", label: "관세" }]
      },
      createdAt: "2026-06-01T00:00:00.000Z",
      currency: null,
      finalAmount: null,
      lockedAt: null,
      reportId: "report-1",
      requestId: "request-1",
      requesterCompanyId: "company-requester",
      requestType: "clearance",
      selectedPartnerCompanyId: "company-partner",
      sourceSnapshot: {
        lookup: {
          source_lookup_snapshot: {
            sources: [{ sourceName: "customs source", retrievedAt: "2026-06-01" }]
          }
        },
        request: { basis_date: "2026-06-01", direction: "import" },
        selected_bid: { bid_type: "clearance" }
      },
      status: "submitted",
      submittedAt: "2026-06-01T02:00:00.000Z",
      summary: "통관 완료 기록",
      updatedAt: "2026-06-01T03:00:00.000Z"
    });

    const serialized = JSON.stringify(preview);

    expect(preview.watermark).toBe("상대방 확인 필요");
    expect(preview.clearanceResult?.declaredHskCode).toBe("3926909000");
    expect(preview.sourceLocks).toEqual([{
      checksum: undefined,
      effectiveFrom: undefined,
      effectiveTo: null,
      publishedAt: undefined,
      retrievedAt: "2026-06-01",
      sourceName: "customs source",
      sourceUrl: undefined,
      sourceVersion: undefined
    }]);
    expect(serialized).not.toContain("fileName");
    expect(serialized).not.toContain("question");
    expect(serialized).not.toContain("answer");
    expect(serialized).not.toContain("message");
  });

  it("collects source locks from source_locks and sources arrays", () => {
    const preview = buildCompletionReportPreview({
      archiveDocuments: [],
      createdAt: "2026-06-01T00:00:00.000Z",
      currency: null,
      finalAmount: null,
      lockedAt: null,
      reportId: "report-1",
      requestId: "request-1",
      requesterCompanyId: "company-requester",
      requestType: "freight",
      selectedPartnerCompanyId: "company-partner",
      sourceSnapshot: {
        lookup: {
          source_lookup_snapshot: {
            source_locks: [{
              checksum: "lock-checksum",
              effective_from: "2026-01-01",
              published_at: "2026-05-31T00:00:00.000Z",
              retrieved_at: "2026-06-01T00:00:00.000Z",
              source_name: "locked customs source",
              source_url: "https://example.test/locked",
              source_version: "2026-lock"
            }],
            sources: [{
              checksum: "array-checksum",
              effectiveFrom: "2026-02-01",
              publishedAt: "2026-05-30T00:00:00.000Z",
              retrievedAt: "2026-06-02T00:00:00.000Z",
              sourceName: "array customs source",
              sourceUrl: "https://example.test/array",
              sourceVersion: "2026-array"
            }]
          }
        }
      },
      status: "operator_reviewed",
      submittedAt: "2026-06-01T02:00:00.000Z",
      summary: null,
      updatedAt: "2026-06-01T03:00:00.000Z"
    });

    expect(preview.sourceLocks).toEqual([
      {
        checksum: "lock-checksum",
        effectiveFrom: "2026-01-01",
        effectiveTo: null,
        publishedAt: "2026-05-31T00:00:00.000Z",
        retrievedAt: "2026-06-01T00:00:00.000Z",
        sourceName: "locked customs source",
        sourceUrl: "https://example.test/locked",
        sourceVersion: "2026-lock"
      },
      {
        checksum: "array-checksum",
        effectiveFrom: "2026-02-01",
        effectiveTo: null,
        publishedAt: "2026-05-30T00:00:00.000Z",
        retrievedAt: "2026-06-02T00:00:00.000Z",
        sourceName: "array customs source",
        sourceUrl: "https://example.test/array",
        sourceVersion: "2026-array"
      }
    ]);
  });
});
