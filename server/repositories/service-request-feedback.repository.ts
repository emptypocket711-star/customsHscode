import type { SupabaseClient } from "@supabase/supabase-js";
import type { ServiceRequestFeedbackInput } from "@/features/service-requests/service-request-feedback-schemas";
import { serviceRequestFeedbackMapToRecord, shouldLoadServiceRequestFeedback } from "@/server/repositories/service-request-list-view";

export type PartnerFeedbackSummary = {
  avgCommunication: number | null;
  avgDocumentQuality: number | null;
  avgRating: number | null;
  avgResponseSpeed: number | null;
  companyId: string;
  feedbackCount: number;
};

export type PartnerTrustSummary = {
  companyId: string;
  trustScore: number;
  verificationStatus: string;
};

export type OwnServiceRequestFeedback = {
  createdAt: string;
  feedbackId: string;
  rating: number;
  requestId: string;
};

export async function submitServiceRequestFeedback(
  supabase: SupabaseClient,
  input: ServiceRequestFeedbackInput
): Promise<{ feedbackId: string; requestId: string }> {
  const { data, error } = await supabase.rpc("submit_service_request_feedback", {
    p_comment: input.comment ?? null,
    p_communication_score: input.communicationScore ?? null,
    p_document_quality_score: input.documentQualityScore ?? null,
    p_rating: input.rating,
    p_request_id: input.requestId,
    p_response_speed_score: input.responseSpeedScore ?? null
  });

  if (error) throw new Error(error.message);

  return {
    feedbackId: String(data),
    requestId: input.requestId
  };
}

export async function listPartnerFeedbackSummaries(
  supabase: SupabaseClient,
  companyIds: string[]
): Promise<Map<string, PartnerFeedbackSummary>> {
  const uniqueCompanyIds = Array.from(new Set(companyIds)).filter(Boolean);
  if (uniqueCompanyIds.length === 0) return new Map();

  const { data, error } = await supabase.rpc("get_partner_feedback_summaries", {
    p_company_ids: uniqueCompanyIds
  });

  if (error) throw new Error(error.message);

  return new Map(((data ?? []) as Array<{
    avg_communication: number | null;
    avg_document_quality: number | null;
    avg_rating: number | null;
    avg_response_speed: number | null;
    company_id: string;
    feedback_count: number;
  }>).map((row) => [row.company_id, {
    avgCommunication: row.avg_communication,
    avgDocumentQuality: row.avg_document_quality,
    avgRating: row.avg_rating,
    avgResponseSpeed: row.avg_response_speed,
    companyId: row.company_id,
    feedbackCount: Number(row.feedback_count)
  }]));
}

export async function listPartnerTrustSummaries(
  supabase: SupabaseClient,
  companyIds: string[]
): Promise<Map<string, PartnerTrustSummary>> {
  const uniqueCompanyIds = Array.from(new Set(companyIds)).filter(Boolean);
  if (uniqueCompanyIds.length === 0) return new Map();

  const { data, error } = await supabase.rpc("get_partner_trust_summaries", {
    p_company_ids: uniqueCompanyIds
  });

  if (error) throw new Error(error.message);

  return new Map(((data ?? []) as Array<{
    company_id: string;
    trust_score: number;
    verification_status: string;
  }>).map((row) => [row.company_id, {
    companyId: row.company_id,
    trustScore: Number(row.trust_score ?? 0),
    verificationStatus: row.verification_status
  }]));
}

export async function listOwnServiceRequestFeedbacks(
  supabase: SupabaseClient,
  requestIds: string[]
): Promise<Map<string, OwnServiceRequestFeedback>> {
  const uniqueRequestIds = Array.from(new Set(requestIds)).filter(Boolean);
  if (uniqueRequestIds.length === 0) return new Map();

  const { data: companyId, error: companyError } = await supabase.rpc("current_company_id");
  if (companyError) throw new Error(companyError.message);

  const { data, error } = await supabase
    .from("service_request_feedbacks")
    .select("id,request_id,rating,created_at")
    .eq("reviewer_company_id", String(companyId))
    .in("request_id", uniqueRequestIds)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const feedbackByRequestId = new Map<string, OwnServiceRequestFeedback>();
  for (const row of (data ?? []) as Array<{
    created_at: string;
    id: string;
    rating: number;
    request_id: string;
  }>) {
    if (!feedbackByRequestId.has(row.request_id)) {
      feedbackByRequestId.set(row.request_id, {
        createdAt: row.created_at,
        feedbackId: row.id,
        rating: row.rating,
        requestId: row.request_id
      });
    }
  }

  return feedbackByRequestId;
}

export async function listOwnServiceRequestFeedbackRecordForRequest(
  supabase: SupabaseClient,
  request: { id: string; status: string }
): Promise<Record<string, OwnServiceRequestFeedback>> {
  if (!shouldLoadServiceRequestFeedback(request.status)) return {};

  const feedbackByRequestId = await listOwnServiceRequestFeedbacks(supabase, [request.id]);
  return serviceRequestFeedbackMapToRecord(feedbackByRequestId);
}
