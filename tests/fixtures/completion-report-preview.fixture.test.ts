import { describe, expect, it } from "vitest";
import {
  buildCompletionReportPreviewSourceSnapshot,
  completionReportPreviewAccessMatrix,
  completionReportPreviewFixture,
  completionReportPreviewForbiddenFixtureTerms,
  completionReportPreviewSeedCompanies,
  completionReportPreviewSeedReports,
  completionReportPreviewSeedRequests,
  completionReportPreviewSeedUsers
} from "@/tests/fixtures/completion-report-preview.fixture";

describe("completion report preview fixture", () => {
  it("defines stable role emails and request ids for e2e setup", () => {
    expect(completionReportPreviewFixture.freightRequestId).toMatch(/^00000000-0000-4000-8000-/);
    expect(completionReportPreviewFixture.clearanceRequestId).toMatch(/^00000000-0000-4000-8000-/);
    expect(completionReportPreviewSeedCompanies).toHaveLength(4);
    expect(completionReportPreviewSeedUsers.map((user) => user.role).sort()).toEqual([
      "developer",
      "requester",
      "selectedPartner",
      "unmatchedPartner"
    ]);
  });

  it("keeps source snapshot metadata required by the preview read model", () => {
    const snapshot = buildCompletionReportPreviewSourceSnapshot({
      bidType: "clearance",
      direction: "import",
      selectedBidId: "00000000-0000-4000-8000-000000000211"
    });

    expect(snapshot.snapshot_version).toBe("completion-report-source-v1");
    expect(snapshot.request).toMatchObject({
      basis_date: "2026-06-01",
      direction: "import",
      has_source_lookup_snapshot: true,
      request_status: "completed"
    });
    expect(snapshot.lookup.source_lookup_snapshot.source_locks[0]).toMatchObject({
      published_at: "2026-05-31T00:00:00.000Z",
      source_name: "완료 리포트 테스트 공식 출처"
    });
    expect(snapshot.safety).toEqual({
      hs_classification_final: false,
      legal_certainty: false,
      requires_staff_review_for_legal_outputs: true
    });
  });

  it("keeps fixture reports linked to completed requests without sensitive raw terms", () => {
    const requestIds = new Set(completionReportPreviewSeedRequests.map((request) => request.id));
    const serialized = JSON.stringify({
      reports: completionReportPreviewSeedReports,
      requests: completionReportPreviewSeedRequests
    });

    expect(completionReportPreviewSeedRequests.every((request) => request.status === "completed")).toBe(true);
    expect(completionReportPreviewSeedReports.every((report) => requestIds.has(report.requestId))).toBe(true);

    for (const term of completionReportPreviewForbiddenFixtureTerms) {
      expect(serialized).not.toContain(term);
    }
  });

  it("defines the role and request-type access matrix used by preview e2e", () => {
    expect(completionReportPreviewAccessMatrix).toEqual([
      { kinds: ["freight", "clearance"], role: "requester", visible: true },
      { kinds: ["freight", "clearance"], role: "selectedPartner", visible: true },
      { kinds: ["freight", "clearance"], role: "developer", visible: true },
      { kinds: ["freight", "clearance"], role: "unmatchedPartner", visible: false }
    ]);
  });
});
