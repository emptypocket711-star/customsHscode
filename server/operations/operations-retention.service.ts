import type { SupabaseClient } from "@supabase/supabase-js";

const defaultOperationsAlertRetentionDays = 90;
const defaultBackgroundJobHistoryRetentionDays = 90;
const cleanupOperationsAlertEventsRpcName = "cleanup_operations_alert_events";
const cleanupBackgroundJobHistoryRpcName = "cleanup_background_job_history";

function positiveIntegerEnv(key: string, defaultValue: number) {
  const value = Number(process.env[key]);
  if (!Number.isFinite(value) || value < 1) return defaultValue;
  return Math.floor(value);
}

export function getOperationsAlertRetentionDays() {
  return positiveIntegerEnv("OPERATIONS_ALERT_RETENTION_DAYS", defaultOperationsAlertRetentionDays);
}

export function getBackgroundJobHistoryRetentionDays() {
  return positiveIntegerEnv("BACKGROUND_JOB_HISTORY_RETENTION_DAYS", defaultBackgroundJobHistoryRetentionDays);
}

export async function cleanupOperationsAlertEvents(
  supabase: SupabaseClient,
  input: {
    retentionDays?: number;
  } = {}
) {
  const retentionDays = input.retentionDays ?? getOperationsAlertRetentionDays();
  const { data, error } = await supabase.rpc(cleanupOperationsAlertEventsRpcName, {
    p_retention_days: retentionDays
  });

  if (error) throw new Error(error.message);

  return {
    retentionDays,
    deletedCount: typeof data === "number" ? data : 0
  };
}

function backgroundJobHistoryCleanupValue(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { deletedRuns: 0, deletedJobs: 0 };
  }

  const record = value as Record<string, unknown>;
  return {
    deletedRuns: typeof record.deletedRuns === "number" ? record.deletedRuns : 0,
    deletedJobs: typeof record.deletedJobs === "number" ? record.deletedJobs : 0
  };
}

export async function cleanupBackgroundJobHistory(
  supabase: SupabaseClient,
  input: {
    retentionDays?: number;
  } = {}
) {
  const retentionDays = input.retentionDays ?? getBackgroundJobHistoryRetentionDays();
  const { data, error } = await supabase.rpc(cleanupBackgroundJobHistoryRpcName, {
    p_retention_days: retentionDays
  });

  if (error) throw new Error(error.message);

  return {
    retentionDays,
    ...backgroundJobHistoryCleanupValue(data)
  };
}

export async function cleanupOperationsRetention(
  supabase: SupabaseClient,
  input: {
    operationsAlertRetentionDays?: number;
    backgroundJobHistoryRetentionDays?: number;
  } = {}
) {
  const [operationsAlertEvents, backgroundJobHistory] = await Promise.all([
    cleanupOperationsAlertEvents(supabase, { retentionDays: input.operationsAlertRetentionDays }),
    cleanupBackgroundJobHistory(supabase, { retentionDays: input.backgroundJobHistoryRetentionDays })
  ]);

  return {
    operationsAlertEvents,
    backgroundJobHistory
  };
}
