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
  const candidateCount = numericPayloadValue(event.payload, "candidateCount");

  return event.status === "error"
    || event.status === "fallback"
    || event.resultCount === 0
    || candidateCount === 0
    || booleanPayloadValue(event.payload, "onlyProvisionalHs6")
    || stringPayloadValue(event.payload, "candidateQualityType") === "non_hsk10_candidates"
    || stringPayloadValue(event.payload, "candidateQualityType") === "hs6_only_provisional"
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

function stringPayloadValue(payload: Record<string, unknown>, key: string) {
  const value = payload[key];
  return typeof value === "string" && value.trim() ? value : null;
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
  const candidateQualityType = stringPayloadValue(event.payload, "candidateQualityType");
  const onlyProvisionalHs6 = booleanPayloadValue(event.payload, "onlyProvisionalHs6");
  const finalHsk10Count = numericPayloadValue(event.payload, "finalHsk10Count");

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

  if (event.eventType === "product_candidates_recommended" && (onlyProvisionalHs6 || candidateQualityType === "hs6_only_provisional")) {
    return "HS6 예비후보만 표시";
  }

  if (event.eventType === "product_candidates_recommended" && resultCount && finalHsk10Count === 0) {
    return "10자리 확장 필요";
  }

  return isLookupTelemetryIssue(event) ? "확인 필요" : "정상";
}

export function lookupTelemetryIssueAction(diagnosis: string) {
  const actions: Record<string, string> = {
    "GPT 후보 없음": "프롬프트·모델 응답 확인. 외국어·브랜드·제품코드 입력이면 제품군 추론 지시를 보강합니다.",
    "GPT 후보 후처리 확인": "GPT가 준 HS 힌트가 후처리에서 사라진 상태입니다. 후보 필터·conflict filter·AI hint 표시 경로를 점검합니다.",
    "제품코드 식별 실패": "브랜드/모델 코드만 입력된 케이스입니다. 웹 근거가 없으면 제품명·카탈로그·스펙 요청 문구를 강화합니다.",
    "Fallback 처리": "Supabase 또는 외부 의존 경로 실패입니다. DB 연결, 검색 인덱스, fallback 빈도를 확인합니다.",
    "최종 후보 0건": "AI 후보와 공식 후보 결합 경로를 확인합니다. HS4/HS6 provisional 후보가 화면에 남는지 점검합니다.",
    "HS6 예비후보만 표시": "GPT가 HS6까지는 제시했지만 10자리 확장이 남은 상태입니다. 하위 HSK 선택 UI와 보완 질문을 점검합니다.",
    "10자리 확장 필요": "후보는 있으나 HSK 10자리 확정 후보가 없습니다. 하위 세번 확장과 사용자 선택 흐름을 확인합니다.",
    "오류": "서버 오류 로그와 환경변수를 우선 확인합니다.",
    "확인 필요": "동일 유형 로그가 반복되는지 확인한 뒤 후보 생성 단계별 수치를 비교합니다.",
    "정상": "추가 조치가 필요 없습니다."
  };

  return actions[diagnosis] ?? actions["확인 필요"];
}

export type LookupTelemetryDiagnosisSummary = {
  diagnosis: string;
  count: number;
  issueCount: number;
  action: string;
};

export function summarizeLookupTelemetryDiagnostics(events: LookupTelemetryEvent[]): LookupTelemetryDiagnosisSummary[] {
  const summaries = new Map<string, LookupTelemetryDiagnosisSummary>();

  for (const event of events) {
    const diagnosis = classifyLookupTelemetryIssue(event);
    const current = summaries.get(diagnosis) ?? {
      diagnosis,
      count: 0,
      issueCount: 0,
      action: lookupTelemetryIssueAction(diagnosis)
    };
    current.count += 1;
    current.issueCount += isLookupTelemetryIssue(event) ? 1 : 0;
    summaries.set(diagnosis, current);
  }

  return [...summaries.values()].sort((a, b) => {
    if (b.issueCount !== a.issueCount) return b.issueCount - a.issueCount;
    if (b.count !== a.count) return b.count - a.count;
    return a.diagnosis.localeCompare(b.diagnosis);
  });
}
