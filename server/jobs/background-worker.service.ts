import type { SupabaseClient } from "@supabase/supabase-js";
import {
  claimBackgroundJobs,
  markBackgroundJobFailed,
  markBackgroundJobSucceeded,
  type BackgroundJobRecord,
  type BackgroundJobType
} from "@/server/repositories/background-job.repository";

export type BackgroundJobHandlerResult = {
  result?: Record<string, unknown>;
};

export type BackgroundJobHandler = (job: BackgroundJobRecord) => Promise<BackgroundJobHandlerResult>;

export type BackgroundJobHandlers = Partial<Record<BackgroundJobType, BackgroundJobHandler>>;

export function getBackgroundJobRetryAt(attempts: number) {
  const delayMs = Math.min(15 * 60_000, 30_000 * Math.max(1, attempts) ** 2);
  return new Date(Date.now() + delayMs).toISOString();
}

export async function runBackgroundJobBatch(
  supabase: SupabaseClient,
  input: {
    workerId: string;
    handlers: BackgroundJobHandlers;
    limit?: number;
    jobTypes?: BackgroundJobType[];
  }
) {
  const jobs = await claimBackgroundJobs(supabase, {
    workerId: input.workerId,
    limit: input.limit,
    jobTypes: input.jobTypes
  });

  const outcomes = [];

  for (const job of jobs) {
    const handler = input.handlers[job.job_type];

    if (!handler) {
      await markBackgroundJobFailed(supabase, {
        jobId: job.id,
        errorMessage: `No handler registered for ${job.job_type}`,
        dead: job.attempts >= job.max_attempts
      });
      outcomes.push({ jobId: job.id, status: "failed", reason: "missing_handler" });
      continue;
    }

    try {
      const handled = await handler(job);
      await markBackgroundJobSucceeded(supabase, job.id, handled.result ?? {});
      outcomes.push({ jobId: job.id, status: "succeeded" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Background job failed";
      await markBackgroundJobFailed(supabase, {
        jobId: job.id,
        errorMessage: message,
        retryAt: getBackgroundJobRetryAt(job.attempts),
        dead: job.attempts >= job.max_attempts
      });
      outcomes.push({ jobId: job.id, status: "failed", reason: message });
    }
  }

  return {
    claimed: jobs.length,
    outcomes
  };
}
