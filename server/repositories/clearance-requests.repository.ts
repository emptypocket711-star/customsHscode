import type { SupabaseClient } from "@supabase/supabase-js";
import {
  assertUploadableServiceRequestDocument,
  calculateServiceRequestDocumentSha256,
  createServiceRequestDocumentStoragePath,
  serviceRequestDocumentsBucket
} from "@/server/repositories/freight-requests.repository";
import type { ClearanceRequestDraftInput } from "@/features/service-requests/clearance-request-schemas";
import type { ClearanceRequestDocumentUploadInput } from "@/features/service-requests/clearance-request-document-schemas";
import type {
  ClearanceRequestQuestionAnswerInput,
  ClearanceRequestQuestionAskInput
} from "@/features/service-requests/clearance-request-question-schemas";
import type {
  ClearanceBidSelectInput,
  ClearanceBidSubmitInput,
  ClearanceRequestPublishInput
} from "@/features/service-requests/clearance-bid-schemas";
import type {
  ServiceRequestCompleteInput,
  ServiceRequestStartInput
} from "@/features/service-requests/service-request-lifecycle-schemas";
import {
  listPartnerFeedbackSummaries,
  listPartnerTrustSummaries,
  type PartnerFeedbackSummary,
  type PartnerTrustSummary
} from "@/server/repositories/service-request-feedback.repository";
import {
  emptyServiceRequestMatchSummary,
  listServiceRequestMatchSummaries,
  type ServiceRequestMatchSummary
} from "@/server/repositories/service-request-match-summary.repository";

export const clearanceServiceRequestListLimit = 20;
export const clearanceServiceRequestOpportunityScanLimit = 60;

export type ClearanceRequestListItem = {
  createdAt: string;
  destinationCountryCode: string | null;
  direction: "import" | "export";
  estimatedDeclarationCount: number | null;
  ftaPreferenceRequested: boolean;
  hsCodeKnown: boolean;
  hskCode: string | null;
  id: string;
  matchSummary: ServiceRequestMatchSummary;
  productSummary: string | null;
  requirementsCheckNeeded: boolean;
  status: string;
  title: string;
  urgent: boolean;
};

export type ClearanceRequestList = {
  items: ClearanceRequestListItem[];
  schemaReady: boolean;
};

export type ClearanceOpportunityItem = ClearanceRequestListItem & {
  matchId: string;
  interestStatus: string;
};

export type ClearanceOpportunityList = {
  items: ClearanceOpportunityItem[];
  schemaReady: boolean;
};

export type ReceivedClearanceBidItem = {
  additionalDocumentsRequired: string[];
  bidId: string;
  bidderCompanyId: string;
  brokerageFeeAmount: number | null;
  createdAt: string;
  currency: string | null;
  expectedClearanceDays: number | null;
  leadTimeDays: number | null;
  message: string | null;
  partnerFeedback: PartnerFeedbackSummary | null;
  partnerTrust: PartnerTrustSummary | null;
  requestId: string;
  reviewAvailable: boolean;
  riskNote: string | null;
  selectedAt: string | null;
  status: string;
  submittedAt: string | null;
  totalAmount: number | null;
  validUntil: string | null;
};

export type ReceivedClearanceBidList = {
  items: ReceivedClearanceBidItem[];
  schemaReady: boolean;
};

export type ClearanceRequestDocumentItem = {
  checksum: string | null;
  createdAt: string;
  documentId: string;
  documentType: string;
  fileName: string;
  fileSize: number | null;
  mimeType: string | null;
  requestId: string;
  visibility: string;
};

export type ClearanceRequestDocumentList = {
  items: ClearanceRequestDocumentItem[];
  schemaReady: boolean;
};

export type ClearanceRequestQuestionItem = {
  answer: string | null;
  answeredAt: string | null;
  bidderCompanyId: string;
  createdAt: string;
  question: string;
  questionId: string;
  requestId: string;
};

export type ClearanceRequestQuestionList = {
  items: ClearanceRequestQuestionItem[];
  schemaReady: boolean;
};

type ServiceRequestRow = {
  created_at: string;
  destination_country_code: string | null;
  direction: "import" | "export";
  hsk_code: string | null;
  id: string;
  product_summary: string | null;
  status: string;
  title: string;
};

type ClearanceDetailRow = {
  estimated_declaration_count: number | null;
  fta_preference_requested: boolean;
  hs_code_known: boolean;
  request_id: string;
  requirements_check_needed: boolean;
  urgent: boolean;
};

type ClearanceMatchRow = {
  id: string;
  interest_status: string;
  request_id: string;
};

type ServiceBidRow = {
  bidder_company_id: string;
  created_at: string;
  currency: string | null;
  id: string;
  lead_time_days: number | null;
  message: string | null;
  request_id: string;
  selected_at: string | null;
  status: string;
  submitted_at: string | null;
  total_amount: number | null;
  valid_until: string | null;
};

type ClearanceBidDetailRow = {
  additional_documents_required: unknown;
  bid_id: string;
  brokerage_fee_amount: number | null;
  expected_clearance_days: number | null;
  review_available: boolean;
  risk_note: string | null;
};

type ServiceRequestDocumentRow = {
  checksum: string | null;
  created_at: string;
  document_type: string;
  file_name: string;
  file_size: number | null;
  id: string;
  mime_type: string | null;
  request_id: string;
  visibility: string;
};

type ServiceRequestQuestionRow = {
  answer: string | null;
  answered_at: string | null;
  bidder_company_id: string;
  created_at: string;
  id: string;
  question: string;
  request_id: string;
};

function isMissingMarketplaceSchemaError(error: { code?: string; message?: string }) {
  const message = error.message ?? "";
  return (
    error.code === "42703" ||
    error.code === "42P01" ||
    (error.code === "PGRST205" && message.toLowerCase().includes("schema cache"))
  );
}

function valueOrNull(value: string | undefined) {
  return value && value.trim().length > 0 ? value.trim() : null;
}

function numberOrNull(value: number | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function textListToJsonArray(value: string | undefined) {
  if (!value?.trim()) return [];
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function asStringList(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
}

async function getCurrentCompanyId(supabase: SupabaseClient) {
  const { data, error } = await supabase.rpc("current_company_id");
  if (error) throw new Error(error.message);
  return String(data);
}

export async function createClearanceRequestDraft(
  supabase: SupabaseClient,
  input: ClearanceRequestDraftInput
) {
  const { data, error } = await supabase.rpc("create_clearance_request_draft", {
    p_destination_country_code: valueOrNull(input.destinationCountryCode),
    p_direction: input.direction,
    p_estimated_declaration_count: numberOrNull(input.estimatedDeclarationCount),
    p_export_country_code: valueOrNull(input.exportCountryCode),
    p_fta_preference_requested: input.ftaPreferenceRequested,
    p_hs6: valueOrNull(input.hs6),
    p_hs_code_known: input.hsCodeKnown,
    p_hsk_code: valueOrNull(input.hskCode),
    p_incoterms: valueOrNull(input.incoterms),
    p_model_name: valueOrNull(input.modelName),
    p_origin_country_code: valueOrNull(input.originCountryCode),
    p_preferred_arrival_date: valueOrNull(input.preferredArrivalDate),
    p_preferred_start_date: valueOrNull(input.preferredStartDate),
    p_product_material: valueOrNull(input.productMaterial),
    p_product_summary: valueOrNull(input.productSummary),
    p_product_usage: valueOrNull(input.productUsage),
    p_requirements_check_needed: input.requirementsCheckNeeded,
    p_required_review_points: [],
    p_shipment_country_code: valueOrNull(input.shipmentCountryCode),
    p_title: input.title,
    p_urgent: input.urgent
  });

  if (error) throw new Error(error.message);
  return String(data);
}

export async function listOwnClearanceRequests(supabase: SupabaseClient): Promise<ClearanceRequestList> {
  const { data: requests, error: requestsError } = await supabase
    .from("service_requests")
    .select("id,title,product_summary,direction,status,hsk_code,destination_country_code,created_at")
    .eq("request_type", "clearance")
    .eq("requester_company_id", await getCurrentCompanyId(supabase))
    .order("created_at", { ascending: false })
    .limit(clearanceServiceRequestListLimit);

  if (requestsError) {
    if (isMissingMarketplaceSchemaError(requestsError)) {
      return {
        items: [],
        schemaReady: false
      };
    }

    throw new Error(requestsError.message);
  }

  const rows = (requests ?? []) as ServiceRequestRow[];
  const requestIds = rows.map((request) => request.id);
  const detailByRequestId = new Map<string, ClearanceDetailRow>();
  const matchSummaryByRequestId = await listServiceRequestMatchSummaries(supabase, requestIds);

  if (requestIds.length > 0) {
    const { data: details, error: detailsError } = await supabase
      .from("clearance_request_details")
      .select("request_id,hs_code_known,fta_preference_requested,requirements_check_needed,urgent,estimated_declaration_count")
      .in("request_id", requestIds);

    if (detailsError) throw new Error(detailsError.message);

    for (const detail of (details ?? []) as ClearanceDetailRow[]) {
      detailByRequestId.set(detail.request_id, detail);
    }
  }

  return {
    items: rows.map((request) => {
      const detail = detailByRequestId.get(request.id);

      return {
        createdAt: request.created_at,
        destinationCountryCode: request.destination_country_code,
        direction: request.direction,
        estimatedDeclarationCount: detail?.estimated_declaration_count ?? null,
        ftaPreferenceRequested: detail?.fta_preference_requested ?? false,
        hsCodeKnown: detail?.hs_code_known ?? false,
        hskCode: request.hsk_code,
        id: request.id,
        matchSummary: matchSummaryByRequestId.get(request.id) ?? emptyServiceRequestMatchSummary,
        productSummary: request.product_summary,
        requirementsCheckNeeded: detail?.requirements_check_needed ?? false,
        status: request.status,
        title: request.title,
        urgent: detail?.urgent ?? false
      };
    }),
    schemaReady: true
  };
}

export async function getOwnClearanceRequest(
  supabase: SupabaseClient,
  requestId: string
): Promise<{ item: ClearanceRequestListItem | null; schemaReady: boolean }> {
  const { data: request, error: requestError } = await supabase
    .from("service_requests")
    .select("id,title,product_summary,direction,status,hsk_code,destination_country_code,created_at")
    .eq("id", requestId)
    .eq("request_type", "clearance")
    .eq("requester_company_id", await getCurrentCompanyId(supabase))
    .maybeSingle();

  if (requestError) {
    if (isMissingMarketplaceSchemaError(requestError)) {
      return {
        item: null,
        schemaReady: false
      };
    }

    throw new Error(requestError.message);
  }

  if (!request) {
    return {
      item: null,
      schemaReady: true
    };
  }

  const row = request as ServiceRequestRow;
  const { data: detail, error: detailError } = await supabase
    .from("clearance_request_details")
    .select("request_id,hs_code_known,fta_preference_requested,requirements_check_needed,urgent,estimated_declaration_count")
    .eq("request_id", requestId)
    .maybeSingle();

  if (detailError) throw new Error(detailError.message);

  const detailRow = detail as ClearanceDetailRow | null;
  const matchSummaryByRequestId = await listServiceRequestMatchSummaries(supabase, [row.id]);

  return {
    item: {
      createdAt: row.created_at,
      destinationCountryCode: row.destination_country_code,
      direction: row.direction,
      estimatedDeclarationCount: detailRow?.estimated_declaration_count ?? null,
      ftaPreferenceRequested: detailRow?.fta_preference_requested ?? false,
      hsCodeKnown: detailRow?.hs_code_known ?? false,
      hskCode: row.hsk_code,
      id: row.id,
      matchSummary: matchSummaryByRequestId.get(row.id) ?? emptyServiceRequestMatchSummary,
      productSummary: row.product_summary,
      requirementsCheckNeeded: detailRow?.requirements_check_needed ?? false,
      status: row.status,
      title: row.title,
      urgent: detailRow?.urgent ?? false
    },
    schemaReady: true
  };
}

export async function publishClearanceRequest(
  supabase: SupabaseClient,
  input: ClearanceRequestPublishInput
) {
  const deadlineAt = new Date(Date.now() + input.deadlineHours * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase.rpc("publish_clearance_request", {
    p_deadline_at: deadlineAt,
    p_request_id: input.requestId
  });

  if (error) throw new Error(error.message);

  const result = data as { matched_count?: unknown; request_id?: unknown } | null;
  return {
    matchedCount: Number(result?.matched_count ?? 0),
    requestId: String(result?.request_id ?? input.requestId)
  };
}

export async function listClearanceRequestDocuments(
  supabase: SupabaseClient,
  requestIds: string[]
): Promise<ClearanceRequestDocumentList> {
  if (requestIds.length === 0) {
    return {
      items: [],
      schemaReady: true
    };
  }

  const { data: documents, error } = await supabase
    .from("service_request_documents")
    .select("id,request_id,document_type,file_name,mime_type,file_size,checksum,visibility,created_at")
    .in("request_id", requestIds)
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingMarketplaceSchemaError(error)) {
      return {
        items: [],
        schemaReady: false
      };
    }

    throw new Error(error.message);
  }

  return {
    items: ((documents ?? []) as ServiceRequestDocumentRow[]).map((document) => ({
      checksum: document.checksum,
      createdAt: document.created_at,
      documentId: document.id,
      documentType: document.document_type,
      fileName: document.file_name,
      fileSize: document.file_size,
      mimeType: document.mime_type,
      requestId: document.request_id,
      visibility: document.visibility
    })),
    schemaReady: true
  };
}

export async function listClearanceRequestQuestions(
  supabase: SupabaseClient,
  requestIds: string[]
): Promise<ClearanceRequestQuestionList> {
  if (requestIds.length === 0) {
    return {
      items: [],
      schemaReady: true
    };
  }

  const { data: questions, error } = await supabase
    .from("service_request_questions")
    .select("id,request_id,bidder_company_id,question,answer,answered_at,created_at")
    .in("request_id", requestIds)
    .order("created_at", { ascending: true });

  if (error) {
    if (isMissingMarketplaceSchemaError(error)) {
      return {
        items: [],
        schemaReady: false
      };
    }

    throw new Error(error.message);
  }

  return {
    items: ((questions ?? []) as ServiceRequestQuestionRow[]).map((question) => ({
      answer: question.answer,
      answeredAt: question.answered_at,
      bidderCompanyId: question.bidder_company_id,
      createdAt: question.created_at,
      question: question.question,
      questionId: question.id,
      requestId: question.request_id
    })),
    schemaReady: true
  };
}

export async function listMatchedClearanceOpportunities(supabase: SupabaseClient): Promise<ClearanceOpportunityList> {
  const { data: matches, error: matchesError } = await supabase
    .from("service_request_partner_matches")
    .select("id,request_id,interest_status")
    .order("created_at", { ascending: false })
    .limit(clearanceServiceRequestOpportunityScanLimit);

  if (matchesError) {
    if (isMissingMarketplaceSchemaError(matchesError)) {
      return {
        items: [],
        schemaReady: false
      };
    }

    throw new Error(matchesError.message);
  }

  const matchRows = (matches ?? []) as ClearanceMatchRow[];
  const requestIds = matchRows.map((match) => match.request_id);
  if (requestIds.length === 0) {
    return {
      items: [],
      schemaReady: true
    };
  }

  const { data: requests, error: requestsError } = await supabase
    .from("service_requests")
    .select("id,title,product_summary,direction,status,hsk_code,destination_country_code,created_at")
    .eq("request_type", "clearance")
    .in("id", requestIds)
    .in("status", ["open", "bids_received", "partner_selected"]);

  if (requestsError) throw new Error(requestsError.message);

  const requestRows = (requests ?? []) as ServiceRequestRow[];
  const visibleRequestIds = requestRows.map((request) => request.id);
  const detailByRequestId = new Map<string, ClearanceDetailRow>();

  if (visibleRequestIds.length > 0) {
    const { data: details, error: detailsError } = await supabase
      .from("clearance_request_details")
      .select("request_id,hs_code_known,fta_preference_requested,requirements_check_needed,urgent,estimated_declaration_count")
      .in("request_id", visibleRequestIds);

    if (detailsError) throw new Error(detailsError.message);

    for (const detail of (details ?? []) as ClearanceDetailRow[]) {
      detailByRequestId.set(detail.request_id, detail);
    }
  }

  const requestById = new Map(requestRows.map((request) => [request.id, request]));

  return {
    items: matchRows
      .map((match) => {
        const request = requestById.get(match.request_id);
        if (!request) return null;
        const detail = detailByRequestId.get(request.id);

        return {
          createdAt: request.created_at,
          destinationCountryCode: request.destination_country_code,
          direction: request.direction,
          estimatedDeclarationCount: detail?.estimated_declaration_count ?? null,
          ftaPreferenceRequested: detail?.fta_preference_requested ?? false,
          hsCodeKnown: detail?.hs_code_known ?? false,
          hskCode: request.hsk_code,
          id: request.id,
          interestStatus: match.interest_status,
          matchSummary: emptyServiceRequestMatchSummary,
          matchId: match.id,
          productSummary: request.product_summary,
          requirementsCheckNeeded: detail?.requirements_check_needed ?? false,
          status: request.status,
          title: request.title,
          urgent: detail?.urgent ?? false
        } satisfies ClearanceOpportunityItem;
      })
      .filter((item): item is ClearanceOpportunityItem => Boolean(item)),
    schemaReady: true
  };
}

export async function getMatchedClearanceOpportunity(
  supabase: SupabaseClient,
  requestId: string
): Promise<{ item: ClearanceOpportunityItem | null; schemaReady: boolean }> {
  const { data: match, error: matchError } = await supabase
    .from("service_request_partner_matches")
    .select("id,request_id,interest_status")
    .eq("request_id", requestId)
    .maybeSingle();

  if (matchError) {
    if (isMissingMarketplaceSchemaError(matchError)) {
      return {
        item: null,
        schemaReady: false
      };
    }

    throw new Error(matchError.message);
  }

  if (!match) {
    return {
      item: null,
      schemaReady: true
    };
  }

  const matchRow = match as ClearanceMatchRow;
  const { data: request, error: requestError } = await supabase
    .from("service_requests")
    .select("id,title,product_summary,direction,status,hsk_code,destination_country_code,created_at")
    .eq("id", requestId)
    .eq("request_type", "clearance")
    .in("status", ["open", "bids_received", "partner_selected"])
    .maybeSingle();

  if (requestError) throw new Error(requestError.message);

  if (!request) {
    return {
      item: null,
      schemaReady: true
    };
  }

  const row = request as ServiceRequestRow;
  const { data: detail, error: detailError } = await supabase
    .from("clearance_request_details")
    .select("request_id,hs_code_known,fta_preference_requested,requirements_check_needed,urgent,estimated_declaration_count")
    .eq("request_id", requestId)
    .maybeSingle();

  if (detailError) throw new Error(detailError.message);

  const detailRow = detail as ClearanceDetailRow | null;

  return {
    item: {
      createdAt: row.created_at,
      destinationCountryCode: row.destination_country_code,
      direction: row.direction,
      estimatedDeclarationCount: detailRow?.estimated_declaration_count ?? null,
      ftaPreferenceRequested: detailRow?.fta_preference_requested ?? false,
      hsCodeKnown: detailRow?.hs_code_known ?? false,
      hskCode: row.hsk_code,
      id: row.id,
      interestStatus: matchRow.interest_status,
      matchSummary: emptyServiceRequestMatchSummary,
      matchId: matchRow.id,
      productSummary: row.product_summary,
      requirementsCheckNeeded: detailRow?.requirements_check_needed ?? false,
      status: row.status,
      title: row.title,
      urgent: detailRow?.urgent ?? false
    },
    schemaReady: true
  };
}

export async function submitClearanceBid(
  supabase: SupabaseClient,
  input: ClearanceBidSubmitInput
) {
  const { data, error } = await supabase.rpc("submit_clearance_bid", {
    p_additional_documents_required: textListToJsonArray(input.additionalDocumentsRequired),
    p_brokerage_fee_amount: numberOrNull(input.brokerageFeeAmount),
    p_currency: input.currency,
    p_expected_clearance_days: numberOrNull(input.expectedClearanceDays),
    p_lead_time_days: numberOrNull(input.leadTimeDays),
    p_message: valueOrNull(input.message),
    p_request_id: input.requestId,
    p_review_available: input.reviewAvailable,
    p_risk_note: valueOrNull(input.riskNote),
    p_total_amount: input.totalAmount,
    p_valid_until: valueOrNull(input.validUntil)
  });

  if (error) throw new Error(error.message);

  const result = data as { bid_id?: unknown; request_id?: unknown } | null;
  return {
    bidId: String(result?.bid_id ?? ""),
    requestId: String(result?.request_id ?? input.requestId)
  };
}

export async function listReceivedClearanceBids(
  supabase: SupabaseClient,
  requestIds: string[]
): Promise<ReceivedClearanceBidList> {
  if (requestIds.length === 0) {
    return {
      items: [],
      schemaReady: true
    };
  }

  const { data: bids, error: bidsError } = await supabase
    .from("service_bids")
    .select("id,request_id,bidder_company_id,status,currency,total_amount,valid_until,lead_time_days,message,created_at,submitted_at,selected_at")
    .eq("bid_type", "clearance")
    .neq("status", "hidden")
    .in("request_id", requestIds)
    .order("total_amount", { ascending: true })
    .order("created_at", { ascending: true });

  if (bidsError) {
    if (isMissingMarketplaceSchemaError(bidsError)) {
      return {
        items: [],
        schemaReady: false
      };
    }

    throw new Error(bidsError.message);
  }

  const bidRows = (bids ?? []) as ServiceBidRow[];
  const bidIds = bidRows.map((bid) => bid.id);
  const bidderCompanyIds = bidRows.map((bid) => bid.bidder_company_id);
  const [feedbackByCompanyId, trustByCompanyId] = await Promise.all([
    listPartnerFeedbackSummaries(supabase, bidderCompanyIds),
    listPartnerTrustSummaries(supabase, bidderCompanyIds)
  ]);
  const detailByBidId = new Map<string, ClearanceBidDetailRow>();

  if (bidIds.length > 0) {
    const { data: details, error: detailsError } = await supabase
      .from("clearance_bid_details")
      .select("bid_id,brokerage_fee_amount,expected_clearance_days,review_available,additional_documents_required,risk_note")
      .in("bid_id", bidIds);

    if (detailsError) throw new Error(detailsError.message);

    for (const detail of (details ?? []) as ClearanceBidDetailRow[]) {
      detailByBidId.set(detail.bid_id, detail);
    }
  }

  return {
    items: bidRows.map((bid) => {
      const detail = detailByBidId.get(bid.id);

      return {
        additionalDocumentsRequired: asStringList(detail?.additional_documents_required),
        bidId: bid.id,
        bidderCompanyId: bid.bidder_company_id,
        brokerageFeeAmount: detail?.brokerage_fee_amount ?? null,
        createdAt: bid.created_at,
        currency: bid.currency,
        expectedClearanceDays: detail?.expected_clearance_days ?? null,
        leadTimeDays: bid.lead_time_days,
        message: bid.message,
        partnerFeedback: feedbackByCompanyId.get(bid.bidder_company_id) ?? null,
        partnerTrust: trustByCompanyId.get(bid.bidder_company_id) ?? null,
        requestId: bid.request_id,
        reviewAvailable: detail?.review_available ?? false,
        riskNote: detail?.risk_note ?? null,
        selectedAt: bid.selected_at,
        status: bid.status,
        submittedAt: bid.submitted_at,
        totalAmount: bid.total_amount,
        validUntil: bid.valid_until
      };
    }),
    schemaReady: true
  };
}

export async function selectClearanceBid(
  supabase: SupabaseClient,
  input: ClearanceBidSelectInput
) {
  const { data: bid, error: bidError } = await supabase
    .from("service_bids")
    .select("id,bid_type")
    .eq("id", input.bidId)
    .eq("bid_type", "clearance")
    .single();

  if (bidError || !bid) {
    throw new Error("선택할 통관 견적을 확인할 수 없습니다.");
  }

  const { data, error } = await supabase.rpc("select_service_bid", {
    p_bid_id: input.bidId
  });

  if (error) throw new Error(error.message);

  return {
    bidId: String(data ?? input.bidId)
  };
}

export async function startSelectedClearanceRequest(
  supabase: SupabaseClient,
  input: ServiceRequestStartInput
) {
  const { data, error } = await supabase.rpc("start_selected_service_request", {
    p_request_id: input.requestId
  });

  if (error) throw new Error(error.message);

  const result = data as { request_id?: unknown; status?: unknown } | null;
  return {
    requestId: String(result?.request_id ?? input.requestId),
    status: String(result?.status ?? "in_progress")
  };
}

export async function completeSelectedClearanceRequest(
  supabase: SupabaseClient,
  input: ServiceRequestCompleteInput
) {
  const { data, error } = await supabase.rpc("complete_selected_service_request", {
    p_completion_note: valueOrNull(input.completionNote),
    p_request_id: input.requestId
  });

  if (error) throw new Error(error.message);

  const result = data as { request_id?: unknown; status?: unknown } | null;
  return {
    requestId: String(result?.request_id ?? input.requestId),
    status: String(result?.status ?? "completed")
  };
}

export async function askClearanceRequestQuestion(
  supabase: SupabaseClient,
  input: ClearanceRequestQuestionAskInput
) {
  const { data: request, error: requestError } = await supabase
    .from("service_requests")
    .select("id,request_type")
    .eq("id", input.requestId)
    .eq("request_type", "clearance")
    .single();

  if (requestError || !request) {
    throw new Error("질문을 등록할 통관 의뢰 요청을 확인할 수 없습니다.");
  }

  const { data, error } = await supabase.rpc("ask_service_request_question", {
    p_question: input.question,
    p_request_id: input.requestId
  });

  if (error) throw new Error(error.message);

  return {
    questionId: String(data ?? ""),
    requestId: input.requestId
  };
}

export async function answerClearanceRequestQuestion(
  supabase: SupabaseClient,
  input: ClearanceRequestQuestionAnswerInput
) {
  const { data: question, error: questionError } = await supabase
    .from("service_request_questions")
    .select("id,request_id")
    .eq("id", input.questionId)
    .single();

  if (questionError || !question) {
    throw new Error("답변할 통관 의뢰 질문을 확인할 수 없습니다.");
  }

  const { data: request, error: requestError } = await supabase
    .from("service_requests")
    .select("id,request_type")
    .eq("id", String(question.request_id))
    .eq("request_type", "clearance")
    .single();

  if (requestError || !request) {
    throw new Error("답변할 통관 의뢰 질문을 확인할 수 없습니다.");
  }

  const { data, error } = await supabase.rpc("answer_service_request_question", {
    p_answer: input.answer,
    p_question_id: input.questionId
  });

  if (error) throw new Error(error.message);

  return {
    questionId: String(data ?? input.questionId)
  };
}

export async function uploadClearanceRequestDocument(
  supabase: SupabaseClient,
  input: ClearanceRequestDocumentUploadInput,
  file: File
) {
  assertUploadableServiceRequestDocument(file);

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("로그인 후 통관 의뢰 서류를 업로드할 수 있습니다.");
  }

  const { data: request, error: requestError } = await supabase
    .from("service_requests")
    .select("id,requester_company_id,request_type,status")
    .eq("id", input.requestId)
    .eq("request_type", "clearance")
    .in("status", ["draft", "open", "bids_received", "partner_selected"])
    .single();

  if (requestError || !request?.requester_company_id) {
    throw new Error("통관 의뢰 요청을 확인할 수 없습니다.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const checksum = calculateServiceRequestDocumentSha256(buffer);
  const storagePath = createServiceRequestDocumentStoragePath({
    companyId: String(request.requester_company_id),
    fileName: file.name,
    requestId: input.requestId
  });

  const { data: document, error: documentError } = await supabase
    .from("service_request_documents")
    .insert({
      request_id: input.requestId,
      requester_company_id: request.requester_company_id,
      uploaded_by: user.id,
      document_type: input.documentType,
      file_name: file.name,
      storage_bucket: serviceRequestDocumentsBucket,
      storage_path: storagePath,
      mime_type: file.type || null,
      file_size: file.size,
      checksum,
      visibility: input.visibility
    })
    .select("id")
    .single();

  if (documentError) throw new Error(documentError.message);

  const { error: uploadError } = await supabase.storage
    .from(serviceRequestDocumentsBucket)
    .upload(storagePath, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false
    });

  if (uploadError) {
    const { error: objectCleanupError } = await supabase.storage
      .from(serviceRequestDocumentsBucket)
      .remove([storagePath]);

    const { error: cleanupError } = await supabase
      .from("service_request_documents")
      .delete()
      .eq("id", document.id);

    if (objectCleanupError || cleanupError) {
      const cleanupMessages = [objectCleanupError?.message, cleanupError?.message].filter(Boolean).join("; ");
      throw new Error(`통관 의뢰 서류 업로드 실패 후 정리에 실패했습니다: ${cleanupMessages}`);
    }

    throw new Error(uploadError.message);
  }

  return {
    checksum,
    documentId: document.id as string,
    documentType: input.documentType,
    fileName: file.name,
    mimeType: file.type || null,
    requestId: input.requestId,
    storageBucket: serviceRequestDocumentsBucket,
    storagePath,
    uploadedBy: user.id
  };
}
