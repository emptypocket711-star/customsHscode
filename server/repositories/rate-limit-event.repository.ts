export type RateLimitEventItem = {
  createdAt: string;
  id: string;
  limitCount: number;
  metadata: Record<string, unknown>;
  retryAfterSeconds: number;
  route: string;
  scope: string;
  userId: string | null;
  windowMs: number;
};

type RateLimitEventRow = {
  created_at: string;
  id: string;
  limit_count: number;
  metadata: Record<string, unknown> | null;
  retry_after_seconds: number;
  route: string;
  scope: string;
  user_id: string | null;
  window_ms: number;
};

export type RateLimitRouteSummary = {
  latestAt: string | null;
  route: string;
  scope: string;
  total: number;
};

export type RateLimitEventSummary = {
  latestAt: string | null;
  routes: RateLimitRouteSummary[];
  total: number;
};

function mapRateLimitEvent(row: RateLimitEventRow): RateLimitEventItem {
  return {
    createdAt: row.created_at,
    id: row.id,
    limitCount: row.limit_count,
    metadata: row.metadata ?? {},
    retryAfterSeconds: row.retry_after_seconds,
    route: row.route,
    scope: row.scope,
    userId: row.user_id,
    windowMs: row.window_ms
  };
}

export async function listRecentRateLimitEvents(
  supabase: SupabaseClient,
  limit = 100
): Promise<RateLimitEventItem[]> {
  const { data, error } = await supabase
    .from("rate_limit_events")
    .select("id,scope,route,user_id,limit_count,window_ms,retry_after_seconds,metadata,created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return ((data ?? []) as RateLimitEventRow[]).map(mapRateLimitEvent);
}

export function summarizeRateLimitEvents(events: RateLimitEventItem[]): RateLimitEventSummary {
  const routeMap = new Map<string, RateLimitRouteSummary>();
  let latestAt: string | null = null;

  for (const event of events) {
    if (!latestAt || new Date(event.createdAt).getTime() > new Date(latestAt).getTime()) {
      latestAt = event.createdAt;
    }

    const key = `${event.scope}:${event.route}`;
    const current = routeMap.get(key) ?? {
      latestAt: null,
      route: event.route,
      scope: event.scope,
      total: 0
    };

    current.total += 1;
    if (!current.latestAt || new Date(event.createdAt).getTime() > new Date(current.latestAt).getTime()) {
      current.latestAt = event.createdAt;
    }
    routeMap.set(key, current);
  }

  return {
    latestAt,
    routes: Array.from(routeMap.values()).sort((a, b) => b.total - a.total || a.route.localeCompare(b.route)).slice(0, 6),
    total: events.length
  };
}
import type { SupabaseClient } from "@supabase/supabase-js";
