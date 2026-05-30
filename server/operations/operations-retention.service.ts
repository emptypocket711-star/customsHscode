import type { SupabaseClient } from "@supabase/supabase-js";

const defaultOperationsAlertRetentionDays = 90;
const cleanupOperationsAlertEventsRpcName = "cleanup_operations_alert_events";

export function getOperationsAlertRetentionDays() {
  const value = Number(process.env.OPERATIONS_ALERT_RETENTION_DAYS);
  if (!Number.isFinite(value) || value < 1) return defaultOperationsAlertRetentionDays;
  return Math.floor(value);
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
