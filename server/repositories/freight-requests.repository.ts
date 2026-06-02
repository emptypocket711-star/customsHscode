import { createHash, randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { sanitizeStorageFileName } from "@/server/repositories/document-upload.repository";
import type {
  FreightRequestDraftInput,
  FreightRequestPublishInput
} from "@/features/service-requests/freight-request-schemas";
import type {
  FreightBidSelectInput,
  FreightBidSubmitInput
} from "@/features/service-requests/freight-bid-schemas";
import type { FreightRequestDocumentUploadInput } from "@/features/service-requests/freight-request-document-schemas";
import type {
  FreightRequestQuestionAnswerInput,
  FreightRequestQuestionAskInput
} from "@/features/service-requests/freight-request-question-schemas";
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

export const serviceRequestDocumentsBucket = "service-request-documents";
export const serviceRequestListLimit = 20;
export const serviceRequestOpportunityScanLimit = 60;

export type FreightRequestListItem = {
  id: string;
  cbm: number | null;
  createdAt: string;
  deadlineAt: string | null;
  destinationCountryCode: string | null;
  destinationPort: string | null;
  direction: "import" | "export";
  grossWeight: number | null;
  originCountryCode: string | null;
  originPort: string | null;
  productSummary: string | null;
  matchSummary: ServiceRequestMatchSummary;
  status: string;
  title: string;
  transportMode: string | null;
};

export type FreightRequestList = {
  items: FreightRequestListItem[];
  schemaReady: boolean;
};

export type FreightOpportunityItem = FreightRequestListItem & {
  matchId: string;
  interestStatus: string;
};

export type FreightOpportunityList = {
  items: FreightOpportunityItem[];
  schemaReady: boolean;
};

export type ReceivedFreightBidItem = {
  bidId: string;
  bidderCompanyId: string;
  carrierNote: string | null;
  createdAt: string;
  currency: string | null;
  freeTimeNote: string | null;
  freightRateAmount: number | null;
  leadTimeDays: number | null;
  localChargeAmount: number | null;
  message: string | null;
  partnerFeedback: PartnerFeedbackSummary | null;
  partnerTrust: PartnerTrustSummary | null;
  requestId: string;
  selectedAt: string | null;
  status: string;
  submittedAt: string | null;
  surchargeAmount: number | null;
  totalAmount: number | null;
  transitTimeDays: number | null;
  validUntil: string | null;
};

export type ReceivedFreightBidList = {
  items: ReceivedFreightBidItem[];
  schemaReady: boolean;
};

export type FreightRequestDocumentItem = {
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

export type FreightRequestDocumentList = {
  items: FreightRequestDocumentItem[];
  schemaReady: boolean;
};

export type FreightRequestQuestionItem = {
  answer: string | null;
  answeredAt: string | null;
  createdAt: string;
  bidderCompanyId: string;
  question: string;
  questionId: string;
  requestId: string;
};

export type FreightRequestQuestionList = {
  items: FreightRequestQuestionItem[];
  schemaReady: boolean;
};

type ServiceRequestRow = {
  id: string;
  created_at: string;
  deadline_at: string | null;
  destination_country_code: string | null;
  direction: "import" | "export";
  origin_country_code: string | null;
  product_summary: string | null;
  status: string;
  title: string;
};

type FreightDetailRow = {
  cbm: number | null;
  destination_port: string | null;
  gross_weight: number | null;
  origin_port: string | null;
  request_id: string;
  transport_mode: string | null;
};

type FreightMatchRow = {
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

type FreightBidDetailRow = {
  bid_id: string;
  carrier_note: string | null;
  free_time_note: string | null;
  freight_rate_amount: number | null;
  local_charge_amount: number | null;
  surcharge_amount: number | null;
  transit_time_days: number | null;
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

async function getCurrentCompanyId(supabase: SupabaseClient) {
  const { data, error } = await supabase.rpc("current_company_id");
  if (error) throw new Error(error.message);
  return String(data);
}

export function calculateServiceRequestDocumentSha256(buffer: Buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

export function createServiceRequestDocumentStoragePath(input: {
  companyId: string;
  fileName: string;
  requestId: string;
}) {
  return `${input.companyId}/${input.requestId}/${randomUUID()}-${sanitizeStorageFileName(input.fileName)}`;
}

export function assertUploadableServiceRequestDocument(file: File) {
  if (!file.size) {
    throw new Error("업로드할 요청 서류를 선택해 주세요.");
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error("요청 서류는 10MB 이하만 업로드할 수 있습니다.");
  }

  const allowedMimeTypes = new Set([
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "text/csv",
    "application/csv",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ]);
  const lowerName = file.name.toLowerCase();
  const hasAllowedExtension = [".pdf", ".jpg", ".jpeg", ".png", ".webp", ".xls", ".xlsx", ".csv"].some((extension) =>
    lowerName.endsWith(extension)
  );

  if (!hasAllowedExtension || (file.type && !allowedMimeTypes.has(file.type))) {
    throw new Error("요청 서류는 PDF, 이미지, XLS, XLSX, CSV 형식만 업로드할 수 있습니다.");
  }
}

export async function createFreightRequestDraft(
  supabase: SupabaseClient,
  input: FreightRequestDraftInput
) {
  const { data, error } = await supabase.rpc("create_freight_request_draft", {
    p_cbm: numberOrNull(input.cbm),
    p_container_type: valueOrNull(input.containerType),
    p_destination_country_code: valueOrNull(input.destinationCountryCode),
    p_destination_place: valueOrNull(input.destinationPlace),
    p_destination_port: valueOrNull(input.destinationPort),
    p_direction: input.direction,
    p_gross_weight: numberOrNull(input.grossWeight),
    p_hazardous: input.hazardous,
    p_incoterms: valueOrNull(input.incoterms),
    p_load_type: valueOrNull(input.loadType),
    p_origin_country_code: valueOrNull(input.originCountryCode),
    p_origin_place: valueOrNull(input.originPlace),
    p_origin_port: valueOrNull(input.originPort),
    p_package_count: numberOrNull(input.packageCount),
    p_package_unit: valueOrNull(input.packageUnit),
    p_preferred_arrival_date: valueOrNull(input.preferredArrivalDate),
    p_preferred_start_date: valueOrNull(input.preferredStartDate),
    p_product_summary: valueOrNull(input.productSummary),
    p_temperature_controlled: input.temperatureControlled,
    p_title: input.title,
    p_transport_mode: valueOrNull(input.transportMode),
    p_used_car: input.usedCar,
    p_vehicle_vin: valueOrNull(input.vehicleVin),
    p_weight_unit: valueOrNull(input.weightUnit)
  });

  if (error) throw new Error(error.message);
  return String(data);
}

export async function publishFreightRequest(
  supabase: SupabaseClient,
  input: FreightRequestPublishInput
) {
  const deadlineAt = new Date(Date.now() + input.deadlineHours * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase.rpc("publish_freight_request", {
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

export async function listOwnFreightRequests(supabase: SupabaseClient): Promise<FreightRequestList> {
  const { data: requests, error: requestsError } = await supabase
    .from("service_requests")
    .select("id,title,product_summary,direction,status,origin_country_code,destination_country_code,deadline_at,created_at")
    .eq("request_type", "freight")
    .eq("requester_company_id", await getCurrentCompanyId(supabase))
    .order("created_at", { ascending: false })
    .limit(serviceRequestListLimit);

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
  const detailByRequestId = new Map<string, FreightDetailRow>();
  const matchSummaryByRequestId = await listServiceRequestMatchSummaries(supabase, requestIds);

  if (requestIds.length > 0) {
    const { data: details, error: detailsError } = await supabase
      .from("freight_request_details")
      .select("request_id,transport_mode,origin_port,destination_port,gross_weight,cbm")
      .in("request_id", requestIds);

    if (detailsError) throw new Error(detailsError.message);

    for (const detail of (details ?? []) as FreightDetailRow[]) {
      detailByRequestId.set(detail.request_id, detail);
    }
  }

  return {
    items: rows.map((request) => {
      const detail = detailByRequestId.get(request.id);

      return {
        cbm: detail?.cbm ?? null,
        createdAt: request.created_at,
        deadlineAt: request.deadline_at,
        destinationCountryCode: request.destination_country_code,
        destinationPort: detail?.destination_port ?? null,
        direction: request.direction,
        grossWeight: detail?.gross_weight ?? null,
        id: request.id,
        originCountryCode: request.origin_country_code,
        originPort: detail?.origin_port ?? null,
        productSummary: request.product_summary,
        matchSummary: matchSummaryByRequestId.get(request.id) ?? emptyServiceRequestMatchSummary,
        status: request.status,
        title: request.title,
        transportMode: detail?.transport_mode ?? null
      };
    }),
    schemaReady: true
  };
}

export async function getOwnFreightRequest(
  supabase: SupabaseClient,
  requestId: string
): Promise<{ item: FreightRequestListItem | null; schemaReady: boolean }> {
  const { data: request, error: requestError } = await supabase
    .from("service_requests")
    .select("id,title,product_summary,direction,status,origin_country_code,destination_country_code,deadline_at,created_at")
    .eq("id", requestId)
    .eq("request_type", "freight")
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
    .from("freight_request_details")
    .select("request_id,transport_mode,origin_port,destination_port,gross_weight,cbm")
    .eq("request_id", requestId)
    .maybeSingle();

  if (detailError) throw new Error(detailError.message);

  const detailRow = detail as FreightDetailRow | null;
  const matchSummaryByRequestId = await listServiceRequestMatchSummaries(supabase, [row.id]);

  return {
    item: {
      cbm: detailRow?.cbm ?? null,
      createdAt: row.created_at,
      deadlineAt: row.deadline_at,
      destinationCountryCode: row.destination_country_code,
      destinationPort: detailRow?.destination_port ?? null,
      direction: row.direction,
      grossWeight: detailRow?.gross_weight ?? null,
      id: row.id,
      originCountryCode: row.origin_country_code,
      originPort: detailRow?.origin_port ?? null,
      productSummary: row.product_summary,
      matchSummary: matchSummaryByRequestId.get(row.id) ?? emptyServiceRequestMatchSummary,
      status: row.status,
      title: row.title,
      transportMode: detailRow?.transport_mode ?? null
    },
    schemaReady: true
  };
}

export async function listMatchedFreightOpportunities(supabase: SupabaseClient): Promise<FreightOpportunityList> {
  const { data: matches, error: matchesError } = await supabase
    .from("service_request_partner_matches")
    .select("id,request_id,interest_status")
    .order("created_at", { ascending: false })
    .limit(serviceRequestOpportunityScanLimit);

  if (matchesError) {
    if (isMissingMarketplaceSchemaError(matchesError)) {
      return {
        items: [],
        schemaReady: false
      };
    }

    throw new Error(matchesError.message);
  }

  const matchRows = (matches ?? []) as FreightMatchRow[];
  const requestIds = matchRows.map((match) => match.request_id);
  if (requestIds.length === 0) {
    return {
      items: [],
      schemaReady: true
    };
  }

  const { data: requests, error: requestsError } = await supabase
    .from("service_requests")
    .select("id,title,product_summary,direction,status,origin_country_code,destination_country_code,deadline_at,created_at")
    .eq("request_type", "freight")
    .in("id", requestIds)
    .in("status", ["open", "bids_received", "partner_selected"]);

  if (requestsError) throw new Error(requestsError.message);

  const requestRows = (requests ?? []) as ServiceRequestRow[];
  const visibleRequestIds = requestRows.map((request) => request.id);
  if (visibleRequestIds.length === 0) {
    return {
      items: [],
      schemaReady: true
    };
  }

  const { data: details, error: detailsError } = await supabase
    .from("freight_request_details")
    .select("request_id,transport_mode,origin_port,destination_port,gross_weight,cbm")
    .in("request_id", visibleRequestIds);

  if (detailsError) throw new Error(detailsError.message);

  const requestById = new Map(requestRows.map((request) => [request.id, request]));
  const detailByRequestId = new Map(((details ?? []) as FreightDetailRow[]).map((detail) => [detail.request_id, detail]));

  return {
    items: matchRows
      .map((match) => {
        const request = requestById.get(match.request_id);
        if (!request) return null;
        const detail = detailByRequestId.get(request.id);

        return {
          cbm: detail?.cbm ?? null,
          createdAt: request.created_at,
          deadlineAt: request.deadline_at,
          destinationCountryCode: request.destination_country_code,
          destinationPort: detail?.destination_port ?? null,
          direction: request.direction,
          grossWeight: detail?.gross_weight ?? null,
          id: request.id,
          interestStatus: match.interest_status,
          matchSummary: emptyServiceRequestMatchSummary,
          matchId: match.id,
          originCountryCode: request.origin_country_code,
          originPort: detail?.origin_port ?? null,
          productSummary: request.product_summary,
          status: request.status,
          title: request.title,
          transportMode: detail?.transport_mode ?? null
        } satisfies FreightOpportunityItem;
      })
      .filter((item): item is FreightOpportunityItem => Boolean(item)),
    schemaReady: true
  };
}

export async function getMatchedFreightOpportunity(
  supabase: SupabaseClient,
  requestId: string
): Promise<{ item: FreightOpportunityItem | null; schemaReady: boolean }> {
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

  const matchRow = match as FreightMatchRow;
  const { data: request, error: requestError } = await supabase
    .from("service_requests")
    .select("id,title,product_summary,direction,status,origin_country_code,destination_country_code,deadline_at,created_at")
    .eq("id", requestId)
    .eq("request_type", "freight")
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
    .from("freight_request_details")
    .select("request_id,transport_mode,origin_port,destination_port,gross_weight,cbm")
    .eq("request_id", requestId)
    .maybeSingle();

  if (detailError) throw new Error(detailError.message);

  const detailRow = detail as FreightDetailRow | null;

  return {
    item: {
      cbm: detailRow?.cbm ?? null,
      createdAt: row.created_at,
      deadlineAt: row.deadline_at,
      destinationCountryCode: row.destination_country_code,
      destinationPort: detailRow?.destination_port ?? null,
      direction: row.direction,
      grossWeight: detailRow?.gross_weight ?? null,
      id: row.id,
      interestStatus: matchRow.interest_status,
      matchSummary: emptyServiceRequestMatchSummary,
      matchId: matchRow.id,
      originCountryCode: row.origin_country_code,
      originPort: detailRow?.origin_port ?? null,
      productSummary: row.product_summary,
      status: row.status,
      title: row.title,
      transportMode: detailRow?.transport_mode ?? null
    },
    schemaReady: true
  };
}

export async function submitFreightBid(
  supabase: SupabaseClient,
  input: FreightBidSubmitInput
) {
  const { data, error } = await supabase.rpc("submit_freight_bid", {
    p_carrier_note: valueOrNull(input.carrierNote),
    p_currency: input.currency,
    p_free_time_note: valueOrNull(input.freeTimeNote),
    p_freight_rate_amount: numberOrNull(input.freightRateAmount),
    p_lead_time_days: numberOrNull(input.leadTimeDays),
    p_local_charge_amount: numberOrNull(input.localChargeAmount),
    p_message: valueOrNull(input.message),
    p_request_id: input.requestId,
    p_surcharge_amount: numberOrNull(input.surchargeAmount),
    p_total_amount: input.totalAmount,
    p_transit_time_days: numberOrNull(input.transitTimeDays),
    p_valid_until: valueOrNull(input.validUntil)
  });

  if (error) throw new Error(error.message);

  const result = data as { bid_id?: unknown; request_id?: unknown } | null;
  return {
    bidId: String(result?.bid_id ?? ""),
    requestId: String(result?.request_id ?? input.requestId)
  };
}

export async function listReceivedFreightBids(
  supabase: SupabaseClient,
  requestIds: string[]
): Promise<ReceivedFreightBidList> {
  if (requestIds.length === 0) {
    return {
      items: [],
      schemaReady: true
    };
  }

  const { data: bids, error: bidsError } = await supabase
    .from("service_bids")
    .select("id,request_id,bidder_company_id,status,currency,total_amount,valid_until,lead_time_days,message,created_at,submitted_at,selected_at")
    .eq("bid_type", "freight")
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
  const detailByBidId = new Map<string, FreightBidDetailRow>();

  if (bidIds.length > 0) {
    const { data: details, error: detailsError } = await supabase
      .from("freight_bid_details")
      .select("bid_id,freight_rate_amount,local_charge_amount,surcharge_amount,transit_time_days,free_time_note,carrier_note")
      .in("bid_id", bidIds);

    if (detailsError) throw new Error(detailsError.message);

    for (const detail of (details ?? []) as FreightBidDetailRow[]) {
      detailByBidId.set(detail.bid_id, detail);
    }
  }

  return {
    items: bidRows.map((bid) => {
      const detail = detailByBidId.get(bid.id);

      return {
        bidId: bid.id,
        bidderCompanyId: bid.bidder_company_id,
        carrierNote: detail?.carrier_note ?? null,
        createdAt: bid.created_at,
        currency: bid.currency,
        freeTimeNote: detail?.free_time_note ?? null,
        freightRateAmount: detail?.freight_rate_amount ?? null,
        leadTimeDays: bid.lead_time_days,
        localChargeAmount: detail?.local_charge_amount ?? null,
        message: bid.message,
        partnerFeedback: feedbackByCompanyId.get(bid.bidder_company_id) ?? null,
        partnerTrust: trustByCompanyId.get(bid.bidder_company_id) ?? null,
        requestId: bid.request_id,
        selectedAt: bid.selected_at,
        status: bid.status,
        submittedAt: bid.submitted_at,
        surchargeAmount: detail?.surcharge_amount ?? null,
        totalAmount: bid.total_amount,
        transitTimeDays: detail?.transit_time_days ?? null,
        validUntil: bid.valid_until
      };
    }),
    schemaReady: true
  };
}

export async function listFreightRequestDocuments(
  supabase: SupabaseClient,
  requestIds: string[]
): Promise<FreightRequestDocumentList> {
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

export async function uploadFreightRequestDocument(
  supabase: SupabaseClient,
  input: FreightRequestDocumentUploadInput,
  file: File
) {
  assertUploadableServiceRequestDocument(file);

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("로그인 후 요청 서류를 업로드할 수 있습니다.");
  }

  const { data: request, error: requestError } = await supabase
    .from("service_requests")
    .select("id,requester_company_id,request_type,status")
    .eq("id", input.requestId)
    .eq("request_type", "freight")
    .in("status", ["draft", "open", "bids_received", "partner_selected"])
    .single();

  if (requestError || !request?.requester_company_id) {
    throw new Error("운송 견적 요청을 확인할 수 없습니다.");
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
      throw new Error(`요청 서류 업로드 실패 후 정리에 실패했습니다: ${cleanupMessages}`);
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

export async function listFreightRequestQuestions(
  supabase: SupabaseClient,
  requestIds: string[]
): Promise<FreightRequestQuestionList> {
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

export async function askFreightRequestQuestion(
  supabase: SupabaseClient,
  input: FreightRequestQuestionAskInput
) {
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

export async function answerFreightRequestQuestion(
  supabase: SupabaseClient,
  input: FreightRequestQuestionAnswerInput
) {
  const { data, error } = await supabase.rpc("answer_service_request_question", {
    p_answer: input.answer,
    p_question_id: input.questionId
  });

  if (error) throw new Error(error.message);

  return {
    questionId: String(data ?? input.questionId)
  };
}

export async function selectFreightBid(
  supabase: SupabaseClient,
  input: FreightBidSelectInput
) {
  const { data, error } = await supabase.rpc("select_service_bid", {
    p_bid_id: input.bidId
  });

  if (error) throw new Error(error.message);

  return {
    bidId: String(data ?? input.bidId)
  };
}

export async function startSelectedServiceRequest(
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

export async function completeSelectedServiceRequest(
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
