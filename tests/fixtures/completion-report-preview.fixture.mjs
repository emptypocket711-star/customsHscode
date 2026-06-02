export const completionReportPreviewFixture = {
  clearanceRequestId: "00000000-0000-4000-8000-000000000201",
  developerUserEmail: "completion-preview-developer@example.test",
  freightRequestId: "00000000-0000-4000-8000-000000000101",
  requesterUserEmail: "completion-preview-requester@example.test",
  selectedPartnerUserEmail: "completion-preview-selected-partner@example.test",
  unmatchedPartnerUserEmail: "completion-preview-unmatched-partner@example.test"
};

export const completionReportPreviewSeedCompanies = [
  {
    id: "00000000-0000-4000-8000-000000000011",
    name: "완료 리포트 테스트 요청자 회사",
    role: "requester",
    type: "client"
  },
  {
    id: "00000000-0000-4000-8000-000000000012",
    name: "완료 리포트 테스트 선정 파트너",
    role: "selected_partner",
    type: "client"
  },
  {
    id: "00000000-0000-4000-8000-000000000013",
    name: "완료 리포트 테스트 미선정 파트너",
    role: "unmatched_partner",
    type: "client"
  },
  {
    id: "00000000-0000-4000-8000-000000000014",
    name: "완료 리포트 테스트 운영 회사",
    role: "developer",
    type: "internal"
  }
];

export const completionReportPreviewSeedUsers = [
  {
    companyId: completionReportPreviewSeedCompanies[0].id,
    email: completionReportPreviewFixture.requesterUserEmail,
    id: "00000000-0000-4000-8000-000000000021",
    profileRole: "client",
    role: "requester"
  },
  {
    companyId: completionReportPreviewSeedCompanies[1].id,
    email: completionReportPreviewFixture.selectedPartnerUserEmail,
    id: "00000000-0000-4000-8000-000000000022",
    profileRole: "client",
    role: "selectedPartner"
  },
  {
    companyId: completionReportPreviewSeedCompanies[2].id,
    email: completionReportPreviewFixture.unmatchedPartnerUserEmail,
    id: "00000000-0000-4000-8000-000000000023",
    profileRole: "client",
    role: "unmatchedPartner"
  },
  {
    companyId: completionReportPreviewSeedCompanies[3].id,
    email: completionReportPreviewFixture.developerUserEmail,
    id: "00000000-0000-4000-8000-000000000024",
    profileRole: "developer",
    role: "developer"
  }
];

export function buildCompletionReportPreviewSourceSnapshot({
  bidType,
  direction,
  requestStatus = "completed",
  selectedBidId
}) {
  return {
    lookup: {
      source_lookup_snapshot: {
        source_locks: [
          {
            checksum: "completion-preview-test-checksum",
            effective_from: "2026-01-01",
            effective_to: null,
            published_at: "2026-05-31T00:00:00.000Z",
            retrieved_at: "2026-06-01T00:00:00.000Z",
            source_name: "완료 리포트 테스트 공식 출처",
            source_url: "https://example.test/completion-preview-source",
            source_version: "2026-test"
          }
        ]
      }
    },
    request: {
      basis_date: "2026-06-01",
      direction,
      has_source_lookup_snapshot: true,
      request_status: requestStatus,
      source_hs_request_id: "00000000-0000-4000-8000-000000000031"
    },
    safety: {
      hs_classification_final: false,
      legal_certainty: false,
      requires_staff_review_for_legal_outputs: true
    },
    selected_bid: {
      bid_status: "selected",
      bid_type: bidType,
      selected_at: "2026-06-01T00:00:00.000Z",
      selected_bid_id: selectedBidId
    },
    snapshot_version: "completion-report-source-v1"
  };
}

export const completionReportPreviewSeedRequests = [
  {
    direction: "export",
    id: completionReportPreviewFixture.freightRequestId,
    requesterCompanyId: completionReportPreviewSeedCompanies[0].id,
    requestType: "freight",
    selectedBidId: "00000000-0000-4000-8000-000000000111",
    status: "completed"
  },
  {
    direction: "import",
    id: completionReportPreviewFixture.clearanceRequestId,
    requesterCompanyId: completionReportPreviewSeedCompanies[0].id,
    requestType: "clearance",
    selectedBidId: "00000000-0000-4000-8000-000000000211",
    status: "completed"
  }
];

export const completionReportPreviewSeedReports = [
  {
    archiveDocumentRole: "final_bl_or_awb",
    currency: "KRW",
    finalAmount: 220000,
    id: "00000000-0000-4000-8000-000000000121",
    requestId: completionReportPreviewFixture.freightRequestId,
    requesterCompanyId: completionReportPreviewSeedCompanies[0].id,
    requestType: "freight",
    selectedPartnerCompanyId: completionReportPreviewSeedCompanies[1].id,
    sourceSnapshot: buildCompletionReportPreviewSourceSnapshot({
      bidType: "freight",
      direction: "export",
      selectedBidId: "00000000-0000-4000-8000-000000000111"
    }),
    status: "locked",
    summary: "테스트 운송 완료 리포트 요약"
  },
  {
    archiveDocumentRole: "import_declaration_certificate",
    currency: "KRW",
    finalAmount: 110000,
    id: "00000000-0000-4000-8000-000000000221",
    requestId: completionReportPreviewFixture.clearanceRequestId,
    requesterCompanyId: completionReportPreviewSeedCompanies[0].id,
    requestType: "clearance",
    selectedPartnerCompanyId: completionReportPreviewSeedCompanies[1].id,
    sourceSnapshot: buildCompletionReportPreviewSourceSnapshot({
      bidType: "clearance",
      direction: "import",
      selectedBidId: "00000000-0000-4000-8000-000000000211"
    }),
    status: "operator_reviewed",
    summary: "테스트 통관 완료 리포트 요약"
  }
];

export const completionReportPreviewAccessMatrix = [
  {
    kinds: ["freight", "clearance"],
    role: "requester",
    visible: true
  },
  {
    kinds: ["freight", "clearance"],
    role: "selectedPartner",
    visible: true
  },
  {
    kinds: ["freight", "clearance"],
    role: "developer",
    visible: true
  },
  {
    kinds: ["freight", "clearance"],
    role: "unmatchedPartner",
    visible: false
  }
];

export const completionReportPreviewForbiddenFixtureTerms = [
  "fileName",
  "question",
  "answer",
  "message",
  "download",
  "real-invoice-line-item",
  "personal-phone-number"
];
