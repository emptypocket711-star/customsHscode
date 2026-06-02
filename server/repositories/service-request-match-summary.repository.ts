import type { SupabaseClient } from "@supabase/supabase-js";

export type ServiceRequestMatchSummary = {
  failedNotificationCount: number;
  matchedPartnerCount: number;
  pendingNotificationCount: number;
  sentNotificationCount: number;
  skippedNotificationCount: number;
};

type ServiceRequestMatchSummaryRow = {
  notification_status: string | null;
  request_id: string;
};

export const emptyServiceRequestMatchSummary: ServiceRequestMatchSummary = {
  failedNotificationCount: 0,
  matchedPartnerCount: 0,
  pendingNotificationCount: 0,
  sentNotificationCount: 0,
  skippedNotificationCount: 0
};

function isMissingMarketplaceSchemaError(error: { code?: string; message?: string }) {
  const message = error.message ?? "";
  return (
    error.code === "42703" ||
    error.code === "42P01" ||
    (error.code === "PGRST205" && message.toLowerCase().includes("schema cache"))
  );
}

function incrementNotificationStatus(summary: ServiceRequestMatchSummary, status: string | null) {
  if (status === "pending") summary.pendingNotificationCount += 1;
  if (status === "sent") summary.sentNotificationCount += 1;
  if (status === "skipped") summary.skippedNotificationCount += 1;
  if (status === "failed") summary.failedNotificationCount += 1;
}

export async function listServiceRequestMatchSummaries(
  supabase: SupabaseClient,
  requestIds: string[]
) {
  const summaryByRequestId = new Map<string, ServiceRequestMatchSummary>();

  for (const requestId of requestIds) {
    summaryByRequestId.set(requestId, { ...emptyServiceRequestMatchSummary });
  }

  if (requestIds.length === 0) {
    return summaryByRequestId;
  }

  const { data, error } = await supabase
    .from("service_request_partner_matches")
    .select("request_id,notification_status")
    .in("request_id", requestIds);

  if (error) {
    if (isMissingMarketplaceSchemaError(error)) {
      return summaryByRequestId;
    }

    throw new Error(error.message);
  }

  for (const match of (data ?? []) as ServiceRequestMatchSummaryRow[]) {
    const summary = summaryByRequestId.get(match.request_id) ?? { ...emptyServiceRequestMatchSummary };
    summary.matchedPartnerCount += 1;
    incrementNotificationStatus(summary, match.notification_status);
    summaryByRequestId.set(match.request_id, summary);
  }

  return summaryByRequestId;
}
