import type { SupabaseClient } from "@supabase/supabase-js";

export type ProtectedJobEventItem = {
  createdAt: string;
  durationMs: number;
  id: string;
  jobName: string;
  message: string | null;
  metadata: Record<string, unknown>;
  route: string;
  status: "succeeded" | "failed";
};

type ProtectedJobEventRow = {
  created_at: string;
  duration_ms: number;
  id: string;
  job_name: string;
  message: string | null;
  metadata: Record<string, unknown> | null;
  route: string;
  status: "succeeded" | "failed";
};

export type ProtectedJobStatusSummary = {
  failed: number;
  jobName: string;
  latestAt: string | null;
  latestStatus: "succeeded" | "failed" | null;
  route: string;
  succeeded: number;
  total: number;
};

export type ProtectedJobEventSummary = {
  failed: number;
  jobs: ProtectedJobStatusSummary[];
  latestAt: string | null;
  status: "normal" | "watch" | "action_needed";
  total: number;
};

function mapProtectedJobEvent(row: ProtectedJobEventRow): ProtectedJobEventItem {
  return {
    createdAt: row.created_at,
    durationMs: row.duration_ms,
    id: row.id,
    jobName: row.job_name,
    message: row.message,
    metadata: row.metadata ?? {},
    route: row.route,
    status: row.status
  };
}

export async function listRecentProtectedJobEvents(
  supabase: SupabaseClient,
  limit = 100
): Promise<ProtectedJobEventItem[]> {
  const { data, error } = await supabase
    .from("protected_job_events")
    .select("id,job_name,route,status,duration_ms,message,metadata,created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return ((data ?? []) as ProtectedJobEventRow[]).map(mapProtectedJobEvent);
}

export function summarizeProtectedJobEvents(events: ProtectedJobEventItem[]): ProtectedJobEventSummary {
  const jobMap = new Map<string, ProtectedJobStatusSummary>();
  let latestAt: string | null = null;
  let failed = 0;

  for (const event of events) {
    if (!latestAt || new Date(event.createdAt).getTime() > new Date(latestAt).getTime()) {
      latestAt = event.createdAt;
    }
    if (event.status === "failed") failed += 1;

    const key = `${event.jobName}:${event.route}`;
    const current = jobMap.get(key) ?? {
      failed: 0,
      jobName: event.jobName,
      latestAt: null,
      latestStatus: null,
      route: event.route,
      succeeded: 0,
      total: 0
    };

    current.total += 1;
    if (event.status === "failed") current.failed += 1;
    if (event.status === "succeeded") current.succeeded += 1;
    if (!current.latestAt || new Date(event.createdAt).getTime() > new Date(current.latestAt).getTime()) {
      current.latestAt = event.createdAt;
      current.latestStatus = event.status;
    }
    jobMap.set(key, current);
  }

  const jobs = Array.from(jobMap.values())
    .sort((a, b) => b.failed - a.failed || b.total - a.total || a.jobName.localeCompare(b.jobName))
    .slice(0, 8);

  return {
    failed,
    jobs,
    latestAt,
    status: failed >= 3 ? "action_needed" : failed > 0 ? "watch" : "normal",
    total: events.length
  };
}
