import type { SupabaseClient } from "@supabase/supabase-js";
import type { HsBatchQueuedLookupJob, HsBatchResultRow } from "@/features/hs-batch/schemas";

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

type HsBatchLookupJobRow = {
  id: string;
  status: BackgroundJobStatus;
  payload: Record<string, unknown>;
  result: Record<string, unknown>;
  error_message: string | null;
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

export type BackgroundJobRunRecordInput = {
  workerId: string;
  route?: string;
  status: "succeeded" | "failed";
  claimedCount: number;
  succeededCount: number;
  failedCount: number;
  durationMs: number;
  errorMessage?: string | null;
  result?: Record<string, unknown>;
};

export type BackgroundJobRunItem = {
  id: string;
  workerId: string;
  route: string;
  status: "succeeded" | "failed";
  claimedCount: number;
  succeededCount: number;
  failedCount: number;
  durationMs: number;
  errorMessage: string | null;
  createdAt: string;
};

type BackgroundJobRunRow = {
  id: string;
  worker_id: string;
  route: string;
  status: "succeeded" | "failed";
  claimed_count: number;
  succeeded_count: number;
  failed_count: number;
  duration_ms: number;
  error_message: string | null;
  created_at: string;
};

export type BackgroundJobRunSummary = {
  total: number;
  succeededRuns: number;
  failedRuns: number;
  claimedJobs: number;
  succeededJobs: number;
  failedJobs: number;
  latestRunAt: string | null;
  latestStatus: "succeeded" | "failed" | null;
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

function recordValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function stringRecordValue(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "string" ? value : "";
}

function numberRecordValue(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function hsBatchSummaryValue(value: unknown) {
  const summary = recordValue(value);
  if (!Object.keys(summary).length) return undefined;
  return {
    total: numberRecordValue(summary, "total"),
    success: numberRecordValue(summary, "success"),
    warning: numberRecordValue(summary, "warning"),
    error: numberRecordValue(summary, "error")
  };
}

function hsBatchResultsValue(value: unknown): HsBatchResultRow[] | undefined {
  if (!Array.isArray(value)) return undefined;

  const rows: HsBatchResultRow[] = [];

  for (const row of value) {
    const record = recordValue(row);
    const status = stringRecordValue(record, "status");
    if (typeof record.rowNumber !== "number" || !["success", "warning", "error"].includes(status)) {
      continue;
    }

    rows.push({
      rowNumber: record.rowNumber,
      inputHskCode: stringRecordValue(record, "inputHskCode"),
      normalizedHskCode: stringRecordValue(record, "normalizedHskCode"),
      productName: stringRecordValue(record, "productName"),
      basisDate: stringRecordValue(record, "basisDate") || undefined,
      matchedHskCode: stringRecordValue(record, "matchedHskCode"),
      matchedName: stringRecordValue(record, "matchedName"),
      countryCode: stringRecordValue(record, "countryCode"),
      basicTariff: stringRecordValue(record, "basicTariff") || "-",
      ftaTariff: stringRecordValue(record, "ftaTariff") || "-",
      lowestTariff: stringRecordValue(record, "lowestTariff") || "-",
      internalTax: stringRecordValue(record, "internalTax") || "-",
      importRequirements: stringRecordValue(record, "importRequirements") || "-",
      originMarking: stringRecordValue(record, "originMarking") || "-",
      status: status as HsBatchResultRow["status"],
      message: stringRecordValue(record, "message"),
      candidateOptions: Array.isArray(record.candidateOptions) ? record.candidateOptions as HsBatchResultRow["candidateOptions"] : undefined,
      missingQuestions: Array.isArray(record.missingQuestions) ? record.missingQuestions.filter((question): question is string => typeof question === "string") : undefined,
      aiSuggestedCodes: Array.isArray(record.aiSuggestedCodes) ? record.aiSuggestedCodes as HsBatchResultRow["aiSuggestedCodes"] : undefined
    });
  }

  return rows;
}

function mapHsBatchLookupJobRow(row: HsBatchLookupJobRow): HsBatchQueuedLookupJob {
  const payload = recordValue(row.payload);
  const result = recordValue(row.result);
  const summary = hsBatchSummaryValue(result.summary);
  const results = hsBatchResultsValue(result.results);
  const rowCount = numberRecordValue(result, "rowCount")
    || (Array.isArray(payload.rows) ? payload.rows.length : 0)
    || summary?.total
    || 0;

  return {
    jobId: row.id,
    status: row.status,
    rowCount,
    basisDate: stringRecordValue(result, "basisDate") || stringRecordValue(payload, "basisDate"),
    destinationCountry: stringRecordValue(result, "destinationCountry") || stringRecordValue(payload, "destinationCountry") || "ALL",
    summary,
    results,
    errorMessage: row.error_message,
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

function mapBackgroundJobRunRow(row: BackgroundJobRunRow): BackgroundJobRunItem {
  return {
    id: row.id,
    workerId: row.worker_id,
    route: row.route,
    status: row.status,
    claimedCount: row.claimed_count,
    succeededCount: row.succeeded_count,
    failedCount: row.failed_count,
    durationMs: row.duration_ms,
    errorMessage: row.error_message,
    createdAt: row.created_at
  };
}

export async function recordBackgroundJobRun(
  supabase: SupabaseClient,
  input: BackgroundJobRunRecordInput
) {
  const { error } = await supabase
    .from("background_job_runs")
    .insert({
      worker_id: input.workerId,
      route: input.route ?? "/api/jobs/run",
      status: input.status,
      claimed_count: input.claimedCount,
      succeeded_count: input.succeededCount,
      failed_count: input.failedCount,
      duration_ms: input.durationMs,
      error_message: input.errorMessage ? input.errorMessage.slice(0, 2000) : null,
      result: input.result ?? {}
    });

  if (error) throw new Error(error.message);
}

export async function listRecentBackgroundJobRuns(
  supabase: SupabaseClient,
  limit = 20
): Promise<BackgroundJobRunItem[]> {
  const { data, error } = await supabase
    .from("background_job_runs")
    .select("id,worker_id,route,status,claimed_count,succeeded_count,failed_count,duration_ms,error_message,created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return ((data ?? []) as BackgroundJobRunRow[]).map(mapBackgroundJobRunRow);
}

export async function listRecentHsBatchLookupJobs(
  supabase: SupabaseClient,
  limit = 10
): Promise<HsBatchQueuedLookupJob[]> {
  const { data, error } = await supabase
    .from("background_jobs")
    .select("id,status,payload,result,error_message,created_at,updated_at")
    .eq("job_type", "hs_batch_lookup")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return ((data ?? []) as HsBatchLookupJobRow[]).map(mapHsBatchLookupJobRow);
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

export function summarizeBackgroundJobRuns(runs: BackgroundJobRunItem[]): BackgroundJobRunSummary {
  return runs.reduce<BackgroundJobRunSummary>((summary, run, index) => {
    summary.total += 1;
    summary.claimedJobs += run.claimedCount;
    summary.succeededJobs += run.succeededCount;
    summary.failedJobs += run.failedCount;
    if (run.status === "succeeded") summary.succeededRuns += 1;
    if (run.status === "failed") summary.failedRuns += 1;
    if (index === 0) {
      summary.latestRunAt = run.createdAt;
      summary.latestStatus = run.status;
    }
    return summary;
  }, {
    total: 0,
    succeededRuns: 0,
    failedRuns: 0,
    claimedJobs: 0,
    succeededJobs: 0,
    failedJobs: 0,
    latestRunAt: null,
    latestStatus: null
  });
}
