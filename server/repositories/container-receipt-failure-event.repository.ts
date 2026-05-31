import type { SupabaseClient } from "@supabase/supabase-js";

export type ContainerReceiptFailureEventItem = {
  createdAt: string;
  failureCode: string;
  id: string;
  message: string | null;
  metadata: Record<string, unknown>;
  terminalCode: string;
  userId: string | null;
};

type ContainerReceiptFailureEventRow = {
  created_at: string;
  failure_code: string;
  id: string;
  message: string | null;
  metadata: Record<string, unknown> | null;
  terminal_code: string;
  user_id: string | null;
};

export type ContainerReceiptFailureBucket = {
  failureCode: string;
  latestAt: string | null;
  terminalCode: string;
  total: number;
};

export type ContainerReceiptFailureSummary = {
  latestAt: string | null;
  repeatedBucketCount: number;
  status: "normal" | "watch" | "action_needed";
  topBuckets: ContainerReceiptFailureBucket[];
  total: number;
};

function mapContainerReceiptFailureEvent(row: ContainerReceiptFailureEventRow): ContainerReceiptFailureEventItem {
  return {
    createdAt: row.created_at,
    failureCode: row.failure_code,
    id: row.id,
    message: row.message,
    metadata: row.metadata ?? {},
    terminalCode: row.terminal_code,
    userId: row.user_id
  };
}

export async function listRecentContainerReceiptFailureEvents(
  supabase: SupabaseClient,
  limit = 100
): Promise<ContainerReceiptFailureEventItem[]> {
  const { data, error } = await supabase
    .from("container_receipt_failure_events")
    .select("id,terminal_code,failure_code,user_id,message,metadata,created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return ((data ?? []) as ContainerReceiptFailureEventRow[]).map(mapContainerReceiptFailureEvent);
}

export function summarizeContainerReceiptFailureEvents(
  events: ContainerReceiptFailureEventItem[]
): ContainerReceiptFailureSummary {
  const bucketMap = new Map<string, ContainerReceiptFailureBucket>();
  let latestAt: string | null = null;

  for (const event of events) {
    if (!latestAt || new Date(event.createdAt).getTime() > new Date(latestAt).getTime()) {
      latestAt = event.createdAt;
    }

    const key = `${event.terminalCode}:${event.failureCode}`;
    const current = bucketMap.get(key) ?? {
      failureCode: event.failureCode,
      latestAt: null,
      terminalCode: event.terminalCode,
      total: 0
    };
    current.total += 1;
    if (!current.latestAt || new Date(event.createdAt).getTime() > new Date(current.latestAt).getTime()) {
      current.latestAt = event.createdAt;
    }
    bucketMap.set(key, current);
  }

  const topBuckets = Array.from(bucketMap.values())
    .sort((a, b) => b.total - a.total || a.terminalCode.localeCompare(b.terminalCode) || a.failureCode.localeCompare(b.failureCode))
    .slice(0, 6);
  const repeatedBucketCount = topBuckets.filter((bucket) => bucket.total >= 3).length;
  const status = events.length >= 10 || repeatedBucketCount > 0
    ? "action_needed"
    : events.length > 0
      ? "watch"
      : "normal";

  return {
    latestAt,
    repeatedBucketCount,
    status,
    topBuckets,
    total: events.length
  };
}
