import type { SupabaseClient } from "@supabase/supabase-js";

export type BackgroundJobType =
  | "document_extraction"
  | "ai_product_search"
  | "report_generation"
  | "source_ingestion"
  | "source_publish";

export type BackgroundJobStatus =
  | "queued"
  | "running"
  | "succeeded"
  | "failed"
  | "canceled"
  | "dead";

export type BackgroundJobRecord = {
  id: string;
  company_id: string | null;
  created_by: string | null;
  job_type: BackgroundJobType;
  status: BackgroundJobStatus;
  priority: number;
  payload: Record<string, unknown>;
  result: Record<string, unknown>;
  error_message: string | null;
  attempts: number;
  max_attempts: number;
  available_at: string;
  created_at: string;
  updated_at: string;
};

export type EnqueueBackgroundJobInput = {
  companyId: string;
  createdBy: string;
  jobType: BackgroundJobType;
  payload: Record<string, unknown>;
  priority?: number;
  maxAttempts?: number;
  availableAt?: string;
};

export type DocumentExtractionJobPayload = {
  documentId: string;
  requestId: string;
  storageBucket: string;
  storagePath: string;
  mimeType: string | null;
  fileName: string;
};

export const claimBackgroundJobsRpcName = "claim_background_jobs";

export function isBackgroundQueueEnabled() {
  return process.env.BACKGROUND_JOBS_ENABLED === "true";
}

export function createDocumentExtractionJobPayload(payload: DocumentExtractionJobPayload) {
  return {
    kind: "uploaded_document",
    documentId: payload.documentId,
    requestId: payload.requestId,
    storageBucket: payload.storageBucket,
    storagePath: payload.storagePath,
    mimeType: payload.mimeType,
    fileName: payload.fileName
  };
}

export async function enqueueBackgroundJob(
  supabase: SupabaseClient,
  input: EnqueueBackgroundJobInput
) {
  const { data, error } = await supabase
    .from("background_jobs")
    .insert({
      company_id: input.companyId,
      created_by: input.createdBy,
      job_type: input.jobType,
      status: "queued",
      priority: input.priority ?? 100,
      payload: input.payload,
      max_attempts: input.maxAttempts ?? 3,
      available_at: input.availableAt ?? new Date().toISOString()
    })
    .select("id,status")
    .single();

  if (error) throw new Error(error.message);

  return {
    jobId: String(data.id),
    status: String(data.status) as BackgroundJobStatus
  };
}

export async function claimBackgroundJobs(
  supabase: SupabaseClient,
  input: {
    workerId: string;
    limit?: number;
    jobTypes?: BackgroundJobType[];
  }
) {
  const { data, error } = await supabase.rpc(claimBackgroundJobsRpcName, {
    p_worker_id: input.workerId,
    p_limit: input.limit ?? 5,
    p_job_types: input.jobTypes ?? null
  });

  if (error) throw new Error(error.message);
  return (data ?? []) as BackgroundJobRecord[];
}

export async function markBackgroundJobSucceeded(
  supabase: SupabaseClient,
  jobId: string,
  result: Record<string, unknown>
) {
  const { error } = await supabase
    .from("background_jobs")
    .update({
      status: "succeeded",
      result,
      finished_at: new Date().toISOString(),
      locked_by: null,
      locked_at: null,
      updated_at: new Date().toISOString()
    })
    .eq("id", jobId);

  if (error) throw new Error(error.message);
}

export async function markBackgroundJobFailed(
  supabase: SupabaseClient,
  input: {
    jobId: string;
    errorMessage: string;
    retryAt?: string;
    dead?: boolean;
  }
) {
  const { error } = await supabase
    .from("background_jobs")
    .update({
      status: input.dead ? "dead" : "failed",
      error_message: input.errorMessage.slice(0, 2000),
      available_at: input.retryAt ?? new Date(Date.now() + 60_000).toISOString(),
      finished_at: input.dead ? new Date().toISOString() : null,
      locked_by: null,
      locked_at: null,
      updated_at: new Date().toISOString()
    })
    .eq("id", input.jobId);

  if (error) throw new Error(error.message);
}
