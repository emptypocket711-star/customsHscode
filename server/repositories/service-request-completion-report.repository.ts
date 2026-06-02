import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ServiceRequestCompletionReportDocumentInput,
  ServiceRequestCompletionReportInput,
  ServiceRequestCompletionReportTransitionInput
} from "@/features/service-requests/service-request-completion-report-schemas";

export type ServiceRequestCompletionReportStatus =
  | "draft"
  | "submitted"
  | "requester_acknowledged"
  | "partner_acknowledged"
  | "operator_reviewed"
  | "locked"
  | "voided";

type CompletionReportRow = {
  clearance_result: Record<string, unknown>;
  created_at: string;
  currency: string | null;
  final_amount: number | null;
  freight_result: Record<string, unknown>;
  id: string;
  locked_at: string | null;
  request_id: string;
  request_type: "clearance" | "freight";
  requester_company_id: string;
  selected_partner_company_id: string;
  settlement_items: unknown[];
  source_snapshot: Record<string, unknown>;
  status: ServiceRequestCompletionReportStatus;
  submitted_at: string | null;
  summary: string | null;
  timeline_events: unknown[];
  updated_at: string;
};

export type ServiceRequestCompletionReport = {
  clearanceResult: Record<string, unknown>;
  createdAt: string;
  currency: string | null;
  finalAmount: number | null;
  freightResult: Record<string, unknown>;
  lockedAt: string | null;
  reportId: string;
  requestId: string;
  requestType: "clearance" | "freight";
  requesterCompanyId: string;
  selectedPartnerCompanyId: string;
  settlementItems: unknown[];
  sourceSnapshot: Record<string, unknown>;
  status: ServiceRequestCompletionReportStatus;
  submittedAt: string | null;
  summary: string | null;
  timelineEvents: unknown[];
  updatedAt: string;
};

export type ServiceRequestCompletionReportList = {
  items: ServiceRequestCompletionReport[];
  schemaReady: boolean;
};

type CompletionReportDocumentRow = {
  completion_report_id: string;
  created_at: string;
  document_role: string;
  id: string;
  request_document_id: string;
  required_for_archive: boolean;
};

export type ServiceRequestCompletionReportDocument = {
  createdAt: string;
  documentRole: string;
  mappingId: string;
  reportId: string;
  requestDocumentId: string;
  requiredForArchive: boolean;
};

export function serviceRequestCompletionReportListToRecord(
  reports: ServiceRequestCompletionReport[]
): Record<string, ServiceRequestCompletionReport> {
  const grouped: Record<string, ServiceRequestCompletionReport> = {};

  for (const report of reports) {
    grouped[report.requestId] ??= report;
  }

  return grouped;
}

export function selectCompletionReportForRequest(
  reports: ServiceRequestCompletionReport[],
  requestId: string
) {
  return serviceRequestCompletionReportListToRecord(reports)[requestId];
}

export function serviceRequestCompletionReportDocumentsToRecord(
  documents: ServiceRequestCompletionReportDocument[]
): Record<string, ServiceRequestCompletionReportDocument[]> {
  const grouped: Record<string, ServiceRequestCompletionReportDocument[]> = {};

  for (const document of documents) {
    grouped[document.reportId] = [...(grouped[document.reportId] ?? []), document];
  }

  return grouped;
}

function mapCompletionReport(row: CompletionReportRow): ServiceRequestCompletionReport {
  return {
    clearanceResult: row.clearance_result ?? {},
    createdAt: row.created_at,
    currency: row.currency,
    finalAmount: row.final_amount,
    freightResult: row.freight_result ?? {},
    lockedAt: row.locked_at,
    reportId: row.id,
    requestId: row.request_id,
    requestType: row.request_type,
    requesterCompanyId: row.requester_company_id,
    selectedPartnerCompanyId: row.selected_partner_company_id,
    settlementItems: row.settlement_items ?? [],
    sourceSnapshot: row.source_snapshot ?? {},
    status: row.status,
    submittedAt: row.submitted_at,
    summary: row.summary,
    timelineEvents: row.timeline_events ?? [],
    updatedAt: row.updated_at
  };
}

export async function listOwnCompletionReportsForRequests(
  supabase: SupabaseClient,
  requestIds: string[]
): Promise<ServiceRequestCompletionReportList> {
  const uniqueRequestIds = Array.from(new Set(requestIds.filter(Boolean)));
  if (uniqueRequestIds.length === 0) {
    return { items: [], schemaReady: true };
  }

  const { data, error } = await supabase
    .from("service_request_completion_reports")
    .select([
      "id",
      "request_id",
      "request_type",
      "requester_company_id",
      "selected_partner_company_id",
      "status",
      "summary",
      "currency",
      "final_amount",
      "settlement_items",
      "timeline_events",
      "clearance_result",
      "freight_result",
      "source_snapshot",
      "submitted_at",
      "locked_at",
      "created_at",
      "updated_at"
    ].join(","))
    .in("request_id", uniqueRequestIds)
    .neq("status", "voided")
    .order("updated_at", { ascending: false });

  if (error) {
    if (error.code === "42P01" || error.code === "42703") {
      return { items: [], schemaReady: false };
    }
    throw new Error(error.message);
  }

  return {
    items: ((data ?? []) as unknown as CompletionReportRow[]).map(mapCompletionReport),
    schemaReady: true
  };
}

export async function saveServiceRequestCompletionReport(
  supabase: SupabaseClient,
  input: ServiceRequestCompletionReportInput
) {
  const { data, error } = await supabase.rpc("create_or_update_completion_report", {
    p_payload: {
      clearanceResult: input.clearanceResult,
      currency: input.currency,
      finalAmount: input.finalAmount,
      freightResult: input.freightResult,
      settlementItems: input.settlementItems,
      sourceSnapshot: input.sourceSnapshot,
      summary: input.summary,
      timelineEvents: input.timelineEvents
    },
    p_request_id: input.requestId
  });

  if (error) throw new Error(error.message);

  return {
    reportId: String(data ?? ""),
    requestId: input.requestId
  };
}

export async function listCompletionReportDocumentsForReports(
  supabase: SupabaseClient,
  reportIds: string[]
) {
  const uniqueReportIds = Array.from(new Set(reportIds.filter(Boolean)));
  if (uniqueReportIds.length === 0) {
    return { items: [], schemaReady: true };
  }

  const { data, error } = await supabase
    .from("service_request_completion_report_documents")
    .select("id,completion_report_id,request_document_id,document_role,required_for_archive,created_at")
    .in("completion_report_id", uniqueReportIds)
    .order("created_at", { ascending: false });

  if (error) {
    if (error.code === "42P01" || error.code === "42703") {
      return { items: [], schemaReady: false };
    }
    throw new Error(error.message);
  }

  return {
    items: ((data ?? []) as unknown as CompletionReportDocumentRow[]).map((row) => ({
      createdAt: row.created_at,
      documentRole: row.document_role,
      mappingId: row.id,
      reportId: row.completion_report_id,
      requestDocumentId: row.request_document_id,
      requiredForArchive: row.required_for_archive
    })),
    schemaReady: true
  };
}

export async function attachServiceRequestCompletionReportDocument(
  supabase: SupabaseClient,
  input: ServiceRequestCompletionReportDocumentInput
) {
  const { data, error } = await supabase.rpc("attach_completion_report_document", {
    p_document_role: input.documentRole,
    p_report_id: input.reportId,
    p_request_document_id: input.requestDocumentId,
    p_required_for_archive: input.requiredForArchive ?? false
  });

  if (error) throw new Error(error.message);

  return {
    mappingId: String(data ?? ""),
    reportId: input.reportId,
    requestId: input.requestId
  };
}

export async function transitionServiceRequestCompletionReport(
  supabase: SupabaseClient,
  input: ServiceRequestCompletionReportTransitionInput
) {
  if (input.transition === "submit") {
    const { data, error } = await supabase.rpc("submit_completion_report", {
      p_report_id: input.reportId
    });
    if (error) throw new Error(error.message);
    return { reportId: String(data ?? ""), requestId: input.requestId, transition: input.transition };
  }

  if (input.transition === "acknowledge") {
    const { data, error } = await supabase.rpc("acknowledge_completion_report", {
      p_report_id: input.reportId,
      p_role: input.acknowledgeRole
    });
    if (error) throw new Error(error.message);
    return { reportId: String(data ?? ""), requestId: input.requestId, transition: input.transition };
  }

  if (input.transition === "review") {
    const { data, error } = await supabase.rpc("review_completion_report", {
      p_report_id: input.reportId
    });
    if (error) throw new Error(error.message);
    return { reportId: String(data ?? ""), requestId: input.requestId, transition: input.transition };
  }

  const { data, error } = await supabase.rpc("lock_completion_report", {
    p_report_id: input.reportId
  });
  if (error) throw new Error(error.message);
  return { reportId: String(data ?? ""), requestId: input.requestId, transition: input.transition };
}
