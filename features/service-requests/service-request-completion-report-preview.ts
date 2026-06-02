import type { ServiceRequestCompletionReportStatus } from "@/server/repositories/service-request-completion-report.repository";

type JsonRecord = Record<string, unknown>;

export type CompletionReportPreviewInput = {
  archiveDocuments: Array<{
    documentRole: string;
    requiredForArchive: boolean;
  }>;
  clearanceResult?: JsonRecord;
  createdAt: string;
  currency: string | null;
  finalAmount: number | null;
  freightResult?: JsonRecord;
  lockedAt: string | null;
  reportId: string;
  requestId: string;
  requestType: "clearance" | "freight";
  requesterCompanyId: string;
  selectedPartnerCompanyId: string;
  settlementItems?: unknown[];
  sourceSnapshot?: JsonRecord;
  status: Exclude<ServiceRequestCompletionReportStatus, "voided">;
  submittedAt: string | null;
  summary: string | null;
  updatedAt: string;
};

export type CompletionReportPreview = {
  archiveDocuments: Array<{
    documentRole: string;
    linked: boolean;
    requiredForArchive: boolean;
  }>;
  clearanceResult?: {
    acceptedAt?: string;
    cautions: string[];
    declarationNo?: string;
    declaredHskCode?: string;
    ftaAgreementName?: string;
    originCountryCode?: string;
    releasedAt?: string;
    taxSummary: Array<{ amount: number; currency: string; label: string }>;
  };
  freightResult?: {
    arrivalDate?: string;
    blOrAwbNo?: string;
    carrier?: string;
    departureDate?: string;
    destinationPort?: string;
    exceptions: string[];
    originPort?: string;
  };
  generatedAt: string;
  lockedAt: string | null;
  parties: {
    requesterCompanyId: string;
    selectedPartnerCompanyId: string;
  };
  reportId: string;
  requestBasis: {
    basisDate: string | null;
    direction: "import" | "export" | null;
    hasSourceLookupSnapshot: boolean;
    requestStatus: string | null;
    sourceHsRequestId: string | null;
  };
  requestId: string;
  requestType: "clearance" | "freight";
  safetyNotices: string[];
  selectedBidBasis: {
    bidType: "clearance" | "freight" | null;
    selectedAt: string | null;
    selectedBidId: string | null;
  };
  sourceLocks: Array<{
    checksum?: string;
    effectiveFrom?: string;
    effectiveTo?: string | null;
    publishedAt?: string;
    retrievedAt?: string;
    sourceName: string;
    sourceUrl?: string;
    sourceVersion?: string;
  }>;
  status: Exclude<ServiceRequestCompletionReportStatus, "voided">;
  sourceSnapshotVersion: string | null;
  summary: {
    currency: string | null;
    finalAmount: number | null;
    settlementItems: Array<{ amount?: number; currency?: string; label: string }>;
    text: string | null;
  };
  watermark: string;
};

const safetyNotices = [
  "본 완료 리포트는 플랫폼 거래 종료 기록입니다.",
  "HS, FTA, 요건, 인허가 내용은 예비진단 또는 실제 신고 결과 기준으로 구분됩니다.",
  "담당자 검토 없이 법적 확정, 요건 없음 확정, FTA 적용 보장으로 사용할 수 없습니다.",
  "세관장확인대상이 아니더라도 통합공고, 개별법령, 표시·인증·유통규제 의무가 존재할 수 있습니다."
];

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function arrayValue(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function objectValue(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {};
}

function booleanValue(value: unknown) {
  return typeof value === "boolean" ? value : false;
}

function settlementItems(items: unknown[] | undefined): CompletionReportPreview["summary"]["settlementItems"] {
  return arrayValue(items).flatMap((item) => {
    const row = objectValue(item);
    const label = stringValue(row.label);
    if (!label) return [];
    return [{
      amount: numberValue(row.amount),
      currency: stringValue(row.currency),
      label
    }];
  });
}

function freightResult(input: JsonRecord | undefined): CompletionReportPreview["freightResult"] | undefined {
  const row = objectValue(input);
  const hasAny = Object.keys(row).length > 0;
  if (!hasAny) return undefined;

  return {
    arrivalDate: stringValue(row.arrivalDate),
    blOrAwbNo: stringValue(row.blOrAwbNo),
    carrier: stringValue(row.carrier),
    departureDate: stringValue(row.departureDate),
    destinationPort: stringValue(row.destinationPort),
    exceptions: arrayValue(row.exceptions).map(stringValue).filter((value): value is string => Boolean(value)),
    originPort: stringValue(row.originPort)
  };
}

function clearanceResult(input: JsonRecord | undefined): CompletionReportPreview["clearanceResult"] | undefined {
  const row = objectValue(input);
  const hasAny = Object.keys(row).length > 0;
  if (!hasAny) return undefined;

  return {
    acceptedAt: stringValue(row.acceptedAt),
    cautions: arrayValue(row.cautions).map(stringValue).filter((value): value is string => Boolean(value)),
    declarationNo: stringValue(row.declarationNo),
    declaredHskCode: stringValue(row.declaredHskCode),
    ftaAgreementName: stringValue(row.ftaAgreementName),
    originCountryCode: stringValue(row.originCountryCode),
    releasedAt: stringValue(row.releasedAt),
    taxSummary: arrayValue(row.taxSummary).map((item) => {
      const tax = objectValue(item);
      const label = stringValue(tax.label);
      const amount = numberValue(tax.amount);
      const currency = stringValue(tax.currency);
      if (!label || amount === undefined || !currency) return null;
      return { amount, currency, label };
    }).filter((item): item is { amount: number; currency: string; label: string } => Boolean(item))
  };
}

function sourceLocks(sourceSnapshot: JsonRecord | undefined): CompletionReportPreview["sourceLocks"] {
  const snapshot = objectValue(sourceSnapshot);
  const lookup = objectValue(objectValue(snapshot.lookup).source_lookup_snapshot);
  const candidates = [
    lookup,
    ...arrayValue(lookup.source_locks).map(objectValue),
    ...arrayValue(lookup.sources).map(objectValue)
  ];

  return candidates.flatMap((source) => {
    const sourceName = stringValue(source.source_name) ?? stringValue(source.sourceName);
    if (!sourceName) return [];
    return [{
      checksum: stringValue(source.checksum),
      effectiveFrom: stringValue(source.effective_from) ?? stringValue(source.effectiveFrom),
      effectiveTo: stringValue(source.effective_to) ?? stringValue(source.effectiveTo) ?? null,
      publishedAt: stringValue(source.published_at) ?? stringValue(source.publishedAt),
      retrievedAt: stringValue(source.retrieved_at) ?? stringValue(source.retrievedAt),
      sourceName,
      sourceUrl: stringValue(source.source_url) ?? stringValue(source.sourceUrl),
      sourceVersion: stringValue(source.source_version) ?? stringValue(source.sourceVersion)
    }];
  });
}

function watermark(status: CompletionReportPreviewInput["status"]) {
  if (status === "draft") return "초안";
  if (status === "submitted") return "상대방 확인 필요";
  if (status === "requester_acknowledged") return "파트너 확인 또는 운영 검토 필요";
  if (status === "partner_acknowledged") return "화주 확인 또는 운영 검토 필요";
  if (status === "operator_reviewed") return "운영 검토 완료, 잠금 전";
  if (status === "locked") return "정식 보관본";
  return "출력 비권장";
}

export function buildCompletionReportPreview(input: CompletionReportPreviewInput): CompletionReportPreview {
  const sourceSnapshot = objectValue(input.sourceSnapshot);
  const request = objectValue(sourceSnapshot.request);
  const selectedBid = objectValue(sourceSnapshot.selected_bid);

  return {
    archiveDocuments: input.archiveDocuments.map((document) => ({
      documentRole: document.documentRole,
      linked: true,
      requiredForArchive: document.requiredForArchive
    })),
    clearanceResult: clearanceResult(input.clearanceResult),
    freightResult: freightResult(input.freightResult),
    generatedAt: input.updatedAt || input.createdAt,
    lockedAt: input.lockedAt,
    parties: {
      requesterCompanyId: input.requesterCompanyId,
      selectedPartnerCompanyId: input.selectedPartnerCompanyId
    },
    reportId: input.reportId,
    requestBasis: {
      basisDate: stringValue(request.basis_date) ?? null,
      direction: stringValue(request.direction) === "import" || stringValue(request.direction) === "export" ? stringValue(request.direction) as "import" | "export" : null,
      hasSourceLookupSnapshot: booleanValue(request.has_source_lookup_snapshot),
      requestStatus: stringValue(request.request_status) ?? null,
      sourceHsRequestId: stringValue(request.source_hs_request_id) ?? null
    },
    requestId: input.requestId,
    requestType: input.requestType,
    safetyNotices,
    selectedBidBasis: {
      bidType: stringValue(selectedBid.bid_type) === "freight" || stringValue(selectedBid.bid_type) === "clearance" ? stringValue(selectedBid.bid_type) as "freight" | "clearance" : null,
      selectedAt: stringValue(selectedBid.selected_at) ?? null,
      selectedBidId: stringValue(selectedBid.selected_bid_id) ?? null
    },
    sourceLocks: sourceLocks(input.sourceSnapshot),
    sourceSnapshotVersion: stringValue(sourceSnapshot.snapshot_version) ?? null,
    status: input.status,
    summary: {
      currency: input.currency,
      finalAmount: input.finalAmount,
      settlementItems: settlementItems(input.settlementItems),
      text: input.summary
    },
    watermark: watermark(input.status)
  };
}
