import type { SupabaseClient } from "@supabase/supabase-js";

export type BackgroundJobType =
  | "document_extraction"
  | "hs_batch_lookup"
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

export type BackgroundJobOperationsItem = {
  id: string;
  jobType: BackgroundJobType;
  status: BackgroundJobStatus;
  attempts: number;
  maxAttempts: number;
  errorMessage: string | null;
  availableAt: string;
  createdAt: string;
  updatedAt: string;
};

type BackgroundJobOperationsRow = {
  id: string;
  job_type: BackgroundJobType;
  status: BackgroundJobStatus;
  attempts: number;
  max_attempts: number;
  error_message: string | null;
  available_at: string;
  created_at: string;
  updated_at: string;
};

export type BackgroundJobOperationsSummary = {
  total: number;
  queued: number;
  running: number;
  retryWaiting: number;
  failed: number;
  dead: number;
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

export type HsBatchLookupJobPayload = {
  basisDate: string;
  destinationCountry: string;
  rows: Array<{
    rowNumber: number;
    hskCode: string;
    productName?: string;
    memo?: string;
  }>;
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

export function createHsBatchLookupJobPayload(payload: HsBatchLookupJobPayload) {
  return {
    kind: "hs_batch_lookup",
    basisDate: payload.basisDate,
    destinationCountry: payload.destinationCountry,
    rows: payload.rows.map((row) => ({
      rowNumber: row.rowNumber,
      hskCode: row.hskCode,
      productName: row.productName ?? "",
      memo: row.memo ?? ""
    }))
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

function mapBackgroundJobOperationsRow(row: BackgroundJobOperationsRow): BackgroundJobOperationsItem {
  return {
    id: row.id,
    jobType: row.job_type,
    status: row.status,
    attempts: row.attempts,
    maxAttempts: row.max_attempts,
    errorMessage: row.error_message,
    availableAt: row.available_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function listRecentBackgroundJobOperations(
  supabase: SupabaseClient,
  limit = 20
): Promise<BackgroundJobOperationsItem[]> {
  const { data, error } = await supabase
    .from("background_jobs")
    .select("id,job_type,status,attempts,max_attempts,error_message,available_at,created_at,updated_at")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return ((data ?? []) as BackgroundJobOperationsRow[]).map(mapBackgroundJobOperationsRow);
}

export function summarizeBackgroundJobOperations(jobs: BackgroundJobOperationsItem[]): BackgroundJobOperationsSummary {
  const now = Date.now();

  return jobs.reduce<BackgroundJobOperationsSummary>((summary, job) => {
    summary.total += 1;
    if (job.status === "queued") summary.queued += 1;
    if (job.status === "running") summary.running += 1;
    if (job.status === "failed") {
      summary.failed += 1;
      if (new Date(job.availableAt).getTime() > now && job.attempts < job.maxAttempts) {
        summary.retryWaiting += 1;
      }
    }
    if (job.status === "dead") summary.dead += 1;
    return summary;
  }, {
    total: 0,
    queued: 0,
    running: 0,
    retryWaiting: 0,
    failed: 0,
    dead: 0
  });
}
