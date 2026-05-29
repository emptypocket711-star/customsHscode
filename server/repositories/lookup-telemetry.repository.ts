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

function numericPayloadValue(payload: Record<string, unknown>, key: string) {
  const value = payload[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function booleanPayloadValue(payload: Record<string, unknown>, key: string) {
  const value = payload[key];
  return typeof value === "boolean" ? value : false;
}

export function classifyLookupTelemetryIssue(event: LookupTelemetryEvent) {
  if (event.status === "error" || event.errorType) return "오류";
  if (booleanPayloadValue(event.payload, "bareProductCodeWithoutSource")) return "제품코드 식별 실패";
  if (event.status === "fallback") return "Fallback 처리";

  const resultCount = event.resultCount ?? numericPayloadValue(event.payload, "resultCount");
  const candidateCount = numericPayloadValue(event.payload, "candidateCount");
  const normalizationCandidateCount = numericPayloadValue(event.payload, "normalizationCandidateCount");
  const aiHintCount = numericPayloadValue(event.payload, "aiHintCount");
  const officialCandidateCount = numericPayloadValue(event.payload, "officialCandidateCount");
  const hasNormalization = booleanPayloadValue(event.payload, "hasNormalization");

  if (event.eventType === "product_search_normalized" && candidateCount === 0) {
    return "GPT 후보 없음";
  }

  if (event.eventType === "product_candidates_recommended" && resultCount === 0) {
    if (hasNormalization && (normalizationCandidateCount ?? 0) > 0 && (aiHintCount ?? 0) === 0 && (officialCandidateCount ?? 0) === 0) {
      return "GPT 후보 후처리 확인";
    }
    if ((normalizationCandidateCount ?? 0) === 0) return "GPT 후보 없음";
    return "최종 후보 0건";
  }

  return isLookupTelemetryIssue(event) ? "확인 필요" : "정상";
}
