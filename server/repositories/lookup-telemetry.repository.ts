import type { SupabaseClient } from "@supabase/supabase-js";

export type LookupTelemetryEvent = {
  id: string;
  eventType: string;
  status: string | null;
  sourceMode: string | null;
  route: string | null;
  resultCount: number | null;
  durationMs: number | null;
  errorType: string | null;
  payload: Record<string, unknown>;
  createdAt: string;
};

type LookupTelemetryEventRow = {
  id: string;
  event_type: string;
  status: string | null;
  source_mode: string | null;
  route: string | null;
  result_count: number | null;
  duration_ms: number | null;
  error_type: string | null;
  payload: Record<string, unknown>;
  created_at: string;
};

function mapLookupTelemetryEvent(row: LookupTelemetryEventRow): LookupTelemetryEvent {
  return {
    id: row.id,
    eventType: row.event_type,
    status: row.status,
    sourceMode: row.source_mode,
    route: row.route,
    resultCount: row.result_count,
    durationMs: row.duration_ms,
    errorType: row.error_type,
    payload: row.payload,
    createdAt: row.created_at
  };
}

const lookupTelemetrySelect = "id,event_type,status,source_mode,route,result_count,duration_ms,error_type,payload,created_at";

export async function listRecentLookupTelemetryEvents(supabase: SupabaseClient, limit = 50): Promise<LookupTelemetryEvent[]> {
  const { data, error } = await supabase
    .from("lookup_telemetry_events")
    .select(lookupTelemetrySelect)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return ((data ?? []) as LookupTelemetryEventRow[]).map(mapLookupTelemetryEvent);
}

export function isLookupTelemetryIssue(event: LookupTelemetryEvent) {
  return event.status === "error"
    || event.status === "fallback"
    || event.resultCount === 0
    || Boolean(event.errorType);
}
