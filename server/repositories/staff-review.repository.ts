import type { SupabaseClient } from "@supabase/supabase-js";
import type { LegalChangeEvent } from "@/features/legal-updates/mock-legal-update-data";
import type {
  DocumentLineItemReviewItem,
  HsConfirmationReviewItem,
  HsCandidateReviewItem
} from "@/features/staff-review/mock-staff-review-data";
import type { ReportReviewItem, StaffReviewQueue } from "@/server/rules/staff-review.service";

type RequestRow = {
  id: string;
  company_id: string;
  search_type: "hs_code" | "product_name" | "document";
  input_product_name: string | null;
  input_hs_code: string | null;
};

type CompanyRow = {
  id: string;
  name: string;
};

type CandidateRow = {
  id: string;
  request_id: string;
  hsk_code: string;
  hs6: string;
  candidate_rank: number;
  confidence_score: number;
  reason: string;
  required_questions: string[] | unknown;
  risk_notes: string;
  status: "suggested" | "selected" | "rejected" | "staff_confirmed";
  created_at: string;
};

type ReportRow = {
  id: string;
  company_id: string;
  report_type: string;
  basis_date: string;
  status: ReportReviewItem["status"];
  report_json: Record<string, unknown> | null;
  customer_summary: string | null;
};

type LegalChangeRow = {
  id: string;
  snapshot_id: string;
  source_type: string;
  law_name: string | null;
  article_no: string | null;
  notice_name: string | null;
  hsk_code: string | null;
  change_type: string;
  old_value: unknown;
  new_value: unknown;
  effective_from: string | null;
  effective_to: string | null;
  impact_area: string;
  risk_level: LegalChangeEvent["riskLevel"];
  review_status: LegalChangeEvent["reviewStatus"];
  created_at: string;
};

type ExtractedLineItemRow = {
  id: string;
  document_id: string;
  request_id: string;
  company_id: string;
  line_no: number;
  product_name: string | null;
  model_name: string | null;
  origin_country: string | null;
  shipment_country: string | null;
  destination_country: string | null;
  incoterms: string | null;
  quantity: number | string | null;
  unit: string | null;
  unit_price: number | string | null;
  total_amount: number | string | null;
  currency: string | null;
  confidence_score: number | string | null;
  required_corrections: string[] | unknown;
  raw_extraction: unknown;
  status: "pending_review" | "approved" | "rejected";
  created_at: string;
};

type HsConfirmationRequestRow = {
  id: string;
  company_id: string;
  hsk_code: string;
  basis_date: string;
  product_name: string | null;
  user_note: string | null;
  supplement_snapshot: unknown;
  status: "pending_review" | "approved" | "rejected";
  created_at: string;
};

type RawExtractionEvidence = {
  field?: unknown;
  value?: unknown;
  source_text?: unknown;
};

function asStringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function stringifyValue(value: unknown) {
  if (typeof value === "string") return value;
  if (value == null) return "";
  return JSON.stringify(value);
}

export function documentLineEvidenceFromRawExtraction(value: unknown) {
  if (!value || typeof value !== "object") return [];
  const evidence = (value as { evidence?: unknown }).evidence;
  if (!Array.isArray(evidence)) return [];

  return evidence
    .map((item) => {
      if (!item || typeof item !== "object") {
        return { field: "", value: "", sourceText: "" };
      }

      const evidenceItem = item as RawExtractionEvidence;
      return {
        field: typeof evidenceItem.field === "string" ? evidenceItem.field : "",
        value: typeof evidenceItem.value === "string" ? evidenceItem.value : "",
        sourceText: typeof evidenceItem.source_text === "string" ? evidenceItem.source_text : ""
      };
    })
    .filter((item) => item.field && item.sourceText)
    .slice(0, 6);
}

function stringArrayFromSnapshot(value: unknown, key: string) {
  if (!value || typeof value !== "object") return [];
  const raw = (value as Record<string, unknown>)[key];
  return Array.isArray(raw) ? raw.filter((item): item is string => typeof item === "string") : [];
}

function reportType(value: string): ReportReviewItem["reportType"] {
  if (value === "export" || value === "hs_lookup") return value;
  return "import";
}

function reportTitle(value: ReportReviewItem["reportType"]) {
  if (value === "export") return "수출 예비진단 리포트";
  if (value === "hs_lookup") return "HS CODE 예비조회 리포트";
  return "수입 예비진단 리포트";
}

async function getCompaniesById(supabase: SupabaseClient, companyIds: string[]) {
  if (!companyIds.length) return new Map<string, string>();

  const { data, error } = await supabase
    .from("companies")
    .select("id, name")
    .in("id", Array.from(new Set(companyIds)));

  if (error) throw new Error(error.message);

  return new Map(((data ?? []) as CompanyRow[]).map((company) => [company.id, company.name]));
}

export async function getStaffReviewQueueFromSupabase(
  supabase: SupabaseClient
): Promise<Pick<StaffReviewQueue, "hsCandidates" | "hsConfirmationRequests" | "documentLineItems" | "reports" | "legalChanges">> {
  const { data: candidateRows, error: candidateError } = await supabase
    .from("hs_candidates")
    .select("id, request_id, hsk_code, hs6, candidate_rank, confidence_score, reason, required_questions, risk_notes, status, created_at")
    .in("status", ["suggested", "selected"])
    .order("created_at", { ascending: false })
    .limit(20);

  if (candidateError) throw new Error(candidateError.message);

  const candidates = (candidateRows ?? []) as CandidateRow[];
  const requestIds = candidates.map((candidate) => candidate.request_id);
  const { data: requestRows, error: requestError } = requestIds.length
    ? await supabase
        .from("hs_search_requests")
        .select("id, company_id, search_type, input_product_name, input_hs_code")
        .in("id", requestIds)
    : { data: [], error: null };

  if (requestError) throw new Error(requestError.message);

  const requests = new Map(((requestRows ?? []) as RequestRow[]).map((request) => [request.id, request]));
  const companyNames = await getCompaniesById(
    supabase,
    (requestRows ?? []).map((request) => (request as RequestRow).company_id)
  );

  const hsCandidates: HsCandidateReviewItem[] = candidates.map((candidate) => {
    const request = requests.get(candidate.request_id);
    return {
      id: candidate.id,
      requestId: candidate.request_id,
      companyName: request ? (companyNames.get(request.company_id) ?? "회사명 확인 필요") : "요청 확인 필요",
      searchType: request?.search_type ?? "product_name",
      productName: request?.input_product_name ?? request?.input_hs_code ?? "품명 확인 필요",
      hskCode: candidate.hsk_code,
      hs6: candidate.hs6,
      rank: candidate.candidate_rank,
      confidenceScore: Number(candidate.confidence_score),
      reason: candidate.reason,
      requiredQuestions: asStringList(candidate.required_questions),
      riskNotes: candidate.risk_notes,
      status: candidate.status,
      createdAt: candidate.created_at
    };
  });

  const { data: confirmationRows, error: confirmationError } = await supabase
    .from("hs_confirmation_requests")
    .select("id, company_id, hsk_code, basis_date, product_name, user_note, supplement_snapshot, status, created_at")
    .eq("status", "pending_review")
    .order("created_at", { ascending: false })
    .limit(20);

  if (confirmationError) throw new Error(confirmationError.message);

  const confirmationsRaw = (confirmationRows ?? []) as HsConfirmationRequestRow[];
  const confirmationCompanyNames = await getCompaniesById(supabase, confirmationsRaw.map((item) => item.company_id));
  const hsConfirmationRequests: HsConfirmationReviewItem[] = confirmationsRaw.map((item) => ({
    id: item.id,
    companyName: confirmationCompanyNames.get(item.company_id) ?? "회사명 확인 필요",
    hskCode: item.hsk_code,
    basisDate: item.basis_date,
    productName: item.product_name,
    userNote: item.user_note,
    supplementQuestions: stringArrayFromSnapshot(item.supplement_snapshot, "questions"),
    recommendedMaterials: stringArrayFromSnapshot(item.supplement_snapshot, "recommendedMaterials"),
    status: item.status,
    createdAt: item.created_at
  }));

  const { data: lineItemRows, error: lineItemError } = await supabase
    .from("extracted_document_line_items")
    .select("id, document_id, request_id, company_id, line_no, product_name, model_name, origin_country, shipment_country, destination_country, incoterms, quantity, unit, unit_price, total_amount, currency, confidence_score, required_corrections, raw_extraction, status, created_at")
    .eq("status", "pending_review")
    .order("created_at", { ascending: false })
    .limit(20);

  if (lineItemError) throw new Error(lineItemError.message);

  const documentLineRows = (lineItemRows ?? []) as ExtractedLineItemRow[];
  const documentCompanyNames = await getCompaniesById(supabase, documentLineRows.map((lineItem) => lineItem.company_id));
  const documentLineItems: DocumentLineItemReviewItem[] = documentLineRows.map((lineItem) => {
    const amount = lineItem.total_amount == null ? "금액 확인 필요" : String(lineItem.total_amount);
    return {
      id: lineItem.id,
      requestId: lineItem.request_id,
      documentId: lineItem.document_id,
      companyName: documentCompanyNames.get(lineItem.company_id) ?? "회사명 확인 필요",
      lineNo: lineItem.line_no,
      productName: lineItem.product_name ?? "품명 확인 필요",
      modelName: lineItem.model_name,
      originCountry: lineItem.origin_country,
      shipmentCountry: lineItem.shipment_country,
      destinationCountry: lineItem.destination_country,
      incoterms: lineItem.incoterms,
      quantity: lineItem.quantity == null ? null : Number(lineItem.quantity),
      unit: lineItem.unit,
      unitPrice: lineItem.unit_price == null ? null : Number(lineItem.unit_price),
      totalAmount: lineItem.total_amount == null ? null : Number(lineItem.total_amount),
      currency: lineItem.currency,
      amountLabel: `${lineItem.currency ?? ""} ${amount}`.trim(),
      confidenceScore: Number(lineItem.confidence_score ?? 0),
      requiredCorrections: asStringList(lineItem.required_corrections),
      evidence: documentLineEvidenceFromRawExtraction(lineItem.raw_extraction),
      status: lineItem.status,
      createdAt: lineItem.created_at
    };
  });

  const { data: reportRows, error: reportError } = await supabase
    .from("ai_reports")
    .select("id, company_id, report_type, basis_date, status, report_json, customer_summary")
    .eq("status", "pending_review")
    .order("created_at", { ascending: false })
    .limit(20);

  if (reportError) throw new Error(reportError.message);

  const reportsRaw = (reportRows ?? []) as ReportRow[];
  const reportCompanyNames = await getCompaniesById(supabase, reportsRaw.map((report) => report.company_id));
  const reports: ReportReviewItem[] = reportsRaw.map((report) => {
    const type = reportType(report.report_type);
    return {
      id: report.id,
      companyName: reportCompanyNames.get(report.company_id) ?? "회사명 확인 필요",
      reportType: type,
      title: reportTitle(type),
      basisDate: report.basis_date,
      hskCode: typeof report.report_json?.hskCode === "string" ? report.report_json.hskCode : "HSK 확인 필요",
      customerSummary: report.customer_summary ?? "요약 확인 필요",
      status: report.status
    };
  });

  const { data: legalRows, error: legalError } = await supabase
    .from("legal_change_events")
    .select("id, snapshot_id, source_type, law_name, article_no, notice_name, hsk_code, change_type, old_value, new_value, effective_from, effective_to, impact_area, risk_level, review_status, created_at")
    .eq("review_status", "pending")
    .order("created_at", { ascending: false })
    .limit(20);

  if (legalError) throw new Error(legalError.message);

  const legalChanges: LegalChangeEvent[] = ((legalRows ?? []) as LegalChangeRow[]).map((change) => ({
    id: change.id,
    snapshotId: change.snapshot_id,
    sourceType: change.source_type,
    lawName: change.law_name,
    articleNo: change.article_no,
    noticeName: change.notice_name,
    hskCode: change.hsk_code,
    changeType: change.change_type,
    oldValue: stringifyValue(change.old_value),
    newValue: stringifyValue(change.new_value),
    effectiveFrom: change.effective_from ?? "시행일 확인 필요",
    effectiveTo: change.effective_to,
    impactArea: change.impact_area,
    riskLevel: change.risk_level,
    reviewStatus: change.review_status,
    createdAt: change.created_at
  }));

  return { hsCandidates, hsConfirmationRequests, documentLineItems, reports, legalChanges };
}
