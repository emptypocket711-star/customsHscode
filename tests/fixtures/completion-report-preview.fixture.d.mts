export type CompletionReportPreviewFixtureRole =
  | "developer"
  | "requester"
  | "selectedPartner"
  | "unmatchedPartner";

export type CompletionReportPreviewFixture = {
  clearanceRequestId: string;
  developerUserEmail: string;
  draftFreightRequestId: string;
  freightRequestId: string;
  requesterUserEmail: string;
  selectedPartnerUserEmail: string;
  unmatchedPartnerUserEmail: string;
};

export type CompletionReportPreviewSeedCompany = {
  id: string;
  name: string;
  role: "developer" | "requester" | "selected_partner" | "unmatched_partner";
  type: "client" | "internal";
};

export type CompletionReportPreviewSeedUser = {
  companyId: string;
  email: string;
  id: string;
  profileRole: "client" | "developer";
  role: CompletionReportPreviewFixtureRole;
};

export type CompletionReportPreviewSeedRequest = {
  direction: "import" | "export";
  id: string;
  requestType: "clearance" | "freight";
  requesterCompanyId: string;
  selectedBidId: string;
  status: "completed";
};

export type CompletionReportPreviewSourceSnapshot = {
  lookup: {
    source_lookup_snapshot: {
      source_locks: Array<{
        checksum: string;
        effective_from: string;
        effective_to: string | null;
        published_at: string;
        retrieved_at: string;
        source_name: string;
        source_url: string;
        source_version: string;
      }>;
    };
  };
  request: {
    basis_date: string;
    direction: "import" | "export";
    has_source_lookup_snapshot: boolean;
    request_status: string;
    source_hs_request_id: string | null;
  };
  safety: {
    hs_classification_final: boolean;
    legal_certainty: boolean;
    requires_staff_review_for_legal_outputs: boolean;
  };
  selected_bid: {
    bid_status: string;
    bid_type: "clearance" | "freight";
    selected_at: string;
    selected_bid_id: string;
  };
  snapshot_version: string;
};

export type CompletionReportPreviewSeedReport = {
  archiveDocumentRole: string;
  currency: "KRW" | "USD";
  finalAmount: number;
  id: string;
  requestId: string;
  requestType: "clearance" | "freight";
  requesterCompanyId: string;
  selectedPartnerCompanyId: string;
  sourceSnapshot: CompletionReportPreviewSourceSnapshot;
  status: "draft" | "locked" | "operator_reviewed" | "submitted";
  summary: string;
};

export type CompletionReportPreviewAccessMatrixEntry = {
  kinds: Array<"clearance" | "freight">;
  role: CompletionReportPreviewFixtureRole;
  visible: boolean;
};

export const completionReportPreviewFixture: CompletionReportPreviewFixture;
export const completionReportPreviewSeedCompanies: CompletionReportPreviewSeedCompany[];
export const completionReportPreviewSeedUsers: CompletionReportPreviewSeedUser[];

export function buildCompletionReportPreviewSourceSnapshot(input: {
  bidType: "clearance" | "freight";
  direction: "import" | "export";
  requestStatus?: string;
  selectedBidId: string;
}): CompletionReportPreviewSourceSnapshot;

export const completionReportPreviewSeedRequests: CompletionReportPreviewSeedRequest[];
export const completionReportPreviewSeedReports: CompletionReportPreviewSeedReport[];
export const completionReportPreviewAccessMatrix: CompletionReportPreviewAccessMatrixEntry[];
export const completionReportPreviewForbiddenFixtureTerms: readonly string[];
