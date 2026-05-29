import { AccessDenied } from "@/components/access-denied";
import { PageHeading } from "@/components/page-heading";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { requireDeveloperRole } from "@/server/auth/role-guard";
import { getEnvironmentHealthGroups, type EnvironmentHealthItem } from "@/server/operations/environment-health.service";
import { getProductionSchemaHealthReport } from "@/server/operations/schema-health.service";
import { createSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase/server";
import {
  classifyLookupTelemetryIssue,
  isLookupTelemetryIssue,
  listRecentLookupTelemetryEvents,
  summarizeLookupTelemetryDiagnostics,
  type LookupTelemetryEvent
} from "@/server/repositories/lookup-telemetry.repository";

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "short",
  timeStyle: "medium",
  timeZone: "Asia/Seoul"
});
const dayFormatter = new Intl.DateTimeFormat("ko-KR", {
  month: "2-digit",
  day: "2-digit",
  timeZone: "Asia/Seoul"
});

function statusLabel(status: EnvironmentHealthItem["status"]) {
  if (status === "ok") return "정상";
  if (status === "missing") return "필수 누락";
  return "선택 미설정";
}

function statusTone(status: EnvironmentHealthItem["status"]) {
  if (status === "ok") return "success";
  if (status === "missing") return "warning";
  return "neutral";
}

function formatDate(value: string) {
  return dateFormatter.format(new Date(value));
}

function eventLabel(eventType: string) {
  const labels: Record<string, string> = {
    product_search_normalized: "품명 AI 정규화",
    product_candidates_recommended: "품명 후보 생성"
  };

  return labels[eventType] ?? eventType;
}

function telemetryStatusLabel(status: string | null) {
  if (status === "success") return "정상";
  if (status === "fallback") return "Fallback";
  if (status === "error") return "오류";
  return status ?? "-";
}

function eventTone(event: LookupTelemetryEvent) {
  return isLookupTelemetryIssue(event) ? "warning" : "success";
}

function payloadValue(payload: Record<string, unknown>, key: string) {
  const value = payload[key];
  if (value === undefined || value === null || value === "") return "-";
  return typeof value === "boolean" ? (value ? "Y" : "N") : String(value);
}

function payloadNumber(payload: Record<string, unknown>, key: string) {
  const value = payload[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function payloadString(payload: Record<string, unknown>, key: string) {
  const value = payload[key];
  return typeof value === "string" && value.trim() ? value : null;
}

function normalizationStatusLabel(status: string | null) {
  if (status === "success") return "GPT 응답";
  if (status === "failed") return "GPT 실패";
  if (status === "skipped") return "GPT 미사용";
  return status ?? "-";
}

function normalizationStatusTone(status: string | null) {
  if (status === "success") return "success";
  if (status === "failed") return "warning";
  return "neutral";
}

function candidateQualityLabel(value: string | null) {
  const labels: Record<string, string> = {
    hsk10_candidates: "10자리 후보",
    hs6_only_provisional: "HS6 예비",
    non_hsk10_candidates: "10자리 미확장",
    no_candidates: "후보 없음"
  };

  return value ? labels[value] ?? value : "-";
}

function lookupBasisLabel(value: string | null) {
  const labels: Record<string, string> = {
    ai_normalized: "GPT 판단",
    ai_hint: "GPT 힌트",
    official: "공식 후보",
    fuzzy: "보정 검색",
    local: "로컬 후보"
  };

  return value ? labels[value] ?? value : "-";
}

function formatCandidateCounts(event: LookupTelemetryEvent) {
  const hs4 = payloadNumber(event.payload, "normalizationHs4Count") ?? 0;
  const hs6 = payloadNumber(event.payload, "normalizationHs6Count") ?? 0;
  const hsk10 = payloadNumber(event.payload, "normalizationHsk10Count") ?? 0;
  const finalHs6 = payloadNumber(event.payload, "finalHs6Count") ?? 0;
  const finalHsk10 = payloadNumber(event.payload, "finalHsk10Count") ?? 0;

  return { hs4, hs6, hsk10, finalHs6, finalHsk10 };
}

function summarizeLookupTelemetryByDay(events: LookupTelemetryEvent[]) {
  const rows = new Map<string, {
    day: string;
    total: number;
    issues: number;
    zeroResults: number;
    gptFailures: number;
    hs6Only: number;
  }>();

  for (const event of events) {
    const day = dayFormatter.format(new Date(event.createdAt));
    const current = rows.get(day) ?? {
      day,
      total: 0,
      issues: 0,
      zeroResults: 0,
      gptFailures: 0,
      hs6Only: 0
    };
    current.total += 1;
    current.issues += isLookupTelemetryIssue(event) ? 1 : 0;
    current.zeroResults += event.resultCount === 0 ? 1 : 0;
    current.gptFailures += payloadString(event.payload, "normalizationStatus") === "failed" ? 1 : 0;
    current.hs6Only += payloadString(event.payload, "candidateQualityType") === "hs6_only_provisional" ? 1 : 0;
    rows.set(day, current);
  }

  return [...rows.values()].slice(0, 5);
}

async function loadLookupTelemetryEvents() {
  if (!hasSupabaseEnv()) return [];

  const supabase = await createSupabaseServerClient();
  return listRecentLookupTelemetryEvents(supabase, 30).catch(() => []);
}

export default async function OperationsHealthPage() {
  const guard = await requireDeveloperRole();

  if (!guard.allowed) {
    return <AccessDenied message={guard.message} />;
  }

  const groups = getEnvironmentHealthGroups();
  const [lookupTelemetryEvents, schemaHealthReport] = await Promise.all([
    loadLookupTelemetryEvents(),
    getProductionSchemaHealthReport()
  ]);
  const lookupIssueCount = lookupTelemetryEvents.filter(isLookupTelemetryIssue).length;
  const lookupSuccessCount = lookupTelemetryEvents.length - lookupIssueCount;
  const zeroResultCount = lookupTelemetryEvents.filter((event) => event.resultCount === 0).length;
  const lookupDiagnosisSummary = summarizeLookupTelemetryDiagnostics(lookupTelemetryEvents);
  const lookupIssueSummary = lookupDiagnosisSummary.filter((item) => item.issueCount > 0).slice(0, 4);
  const lookupDailySummary = summarizeLookupTelemetryByDay(lookupTelemetryEvents);
  const items = groups.flatMap((group) => group.items);
  const missingRequiredCount = items.filter((item) => item.status === "missing").length;
  const configuredCount = items.filter((item) => item.status === "ok").length;
  const schemaStatusTone = schemaHealthReport.status === "ok" ? "success" : "warning";
  const schemaStatusLabel = schemaHealthReport.status === "ok" ? "정상" : schemaHealthReport.status === "warn" ? "주의" : "차단";

  return (
    <div className="grid gap-5">
      <PageHeading
        title="운영 점검"
        description="배포 환경에서 필요한 연결값과 운영 보호 설정을 확인합니다. 키 원문은 표시하지 않습니다."
      />

      <div className="grid gap-3 md:grid-cols-3">
        <Card>
          <CardBody>
            <p className="text-xs font-semibold text-slate-500">설정된 항목</p>
            <p className="mt-1 text-2xl font-semibold text-slate-950">{configuredCount}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs font-semibold text-slate-500">필수 누락</p>
            <p className={missingRequiredCount > 0 ? "mt-1 text-2xl font-semibold text-amber-700" : "mt-1 text-2xl font-semibold text-emerald-700"}>
              {missingRequiredCount}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs font-semibold text-slate-500">배포 판정</p>
            <p className="mt-2">
              <Badge tone={missingRequiredCount > 0 ? "warning" : "success"}>
                {missingRequiredCount > 0 ? "필수 환경변수 확인 필요" : "필수 환경변수 준비됨"}
              </Badge>
            </p>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="운영 DB 스키마 점검"
          description="현재 migration 파일 기준으로 운영 Supabase의 테이블, 컬럼, RPC/function, RLS 상태를 대조합니다."
          action={<Badge tone={schemaStatusTone}>{schemaStatusLabel}</Badge>}
        />
        <CardBody className="p-0">
          <div className="grid gap-2 border-b border-slate-200 bg-slate-50 p-3 text-sm md:grid-cols-4">
            <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
              <p className="text-xs font-semibold text-slate-500">테이블</p>
              <p className="mt-1 font-semibold text-slate-950">{schemaHealthReport.summary.actualTables}/{schemaHealthReport.summary.expectedTables}</p>
            </div>
            <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
              <p className="text-xs font-semibold text-slate-500">컬럼 점검</p>
              <p className="mt-1 font-semibold text-slate-950">{schemaHealthReport.summary.expectedColumns}</p>
            </div>
            <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
              <p className="text-xs font-semibold text-slate-500">RPC/function</p>
              <p className="mt-1 font-semibold text-slate-950">{schemaHealthReport.summary.actualFunctions}/{schemaHealthReport.summary.expectedFunctions}</p>
            </div>
            <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
              <p className="text-xs font-semibold text-slate-500">문제</p>
              <p className={schemaHealthReport.summary.blockerCount > 0 ? "mt-1 font-semibold text-red-700" : "mt-1 font-semibold text-emerald-700"}>
                차단 {schemaHealthReport.summary.blockerCount} / 주의 {schemaHealthReport.summary.warnCount}
              </p>
            </div>
          </div>
          {schemaHealthReport.issues.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-[920px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500">
                  <tr>
                    <th className="px-5 py-3">등급</th>
                    <th className="px-5 py-3">대상</th>
                    <th className="px-5 py-3">내용</th>
                    <th className="px-5 py-3">관련 migration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {schemaHealthReport.issues.map((issue) => (
                    <tr key={`${issue.type}-${issue.objectName}`}>
                      <td className="px-5 py-4">
                        <Badge tone="warning">{issue.severity === "blocker" ? "차단" : "주의"}</Badge>
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-800">{issue.objectName}</td>
                      <td className="px-5 py-4 text-slate-700">{issue.message}</td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-500">{issue.file}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-5 text-sm text-emerald-700">
              운영 DB 스키마가 현재 migration 기준과 일치합니다. 최근 점검: {formatDate(schemaHealthReport.checkedAt)}
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="최근 조회 품질 로그"
          description="품명 AI 검색과 후보 생성의 실패·무결과·fallback 흐름을 원문 없이 확인합니다. 원문 품명, 이메일, 문서 내용은 저장하지 않습니다."
          action={<Badge tone={lookupIssueCount > 0 ? "warning" : "success"}>점검 대상 {lookupIssueCount}건</Badge>}
        />
        <CardBody className="p-0">
          {lookupTelemetryEvents.length ? (
            <>
              <div className="grid gap-2 border-b border-slate-200 bg-slate-50 p-3 text-sm sm:grid-cols-3">
                <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
                  <p className="text-xs font-semibold text-slate-500">정상 처리</p>
                  <p className="mt-1 font-semibold text-emerald-700">{lookupSuccessCount}건</p>
                </div>
                <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
                  <p className="text-xs font-semibold text-slate-500">점검 대상</p>
                  <p className="mt-1 font-semibold text-amber-700">{lookupIssueCount}건</p>
                </div>
                <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
                  <p className="text-xs font-semibold text-slate-500">무결과</p>
                  <p className="mt-1 font-semibold text-slate-950">{zeroResultCount}건</p>
                </div>
              </div>
              {lookupIssueSummary.length ? (
                <div className="grid gap-2 border-b border-slate-200 bg-white p-3 text-sm lg:grid-cols-2">
                  {lookupIssueSummary.map((summary) => (
                    <div key={summary.diagnosis} className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-semibold text-amber-950">{summary.diagnosis}</p>
                        <Badge tone="warning">{summary.issueCount}건</Badge>
                      </div>
                      <p className="mt-1 text-xs leading-5 text-amber-900">{summary.action}</p>
                    </div>
                  ))}
                </div>
              ) : null}
              {lookupDailySummary.length ? (
                <div className="grid gap-2 border-b border-slate-200 bg-slate-50 p-3 text-sm md:grid-cols-5">
                  {lookupDailySummary.map((summary) => (
                    <div className="rounded-md border border-slate-200 bg-white px-3 py-2" key={summary.day}>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-slate-500">{summary.day}</p>
                        <Badge tone={summary.issues > 0 ? "warning" : "success"}>{summary.issues}건 점검</Badge>
                      </div>
                      <p className="mt-2 text-xs leading-5 text-slate-600">
                        전체 {summary.total} · 무결과 {summary.zeroResults}
                        <br />
                        GPT 실패 {summary.gptFailures} · HS6 예비 {summary.hs6Only}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
              <div className="overflow-x-auto">
                <table className="min-w-[1320px] text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500">
                    <tr>
                      <th className="px-5 py-3">시간</th>
                      <th className="px-5 py-3">이벤트</th>
                      <th className="px-5 py-3">상태</th>
                      <th className="px-5 py-3">결과</th>
                      <th className="px-5 py-3">진단</th>
                      <th className="px-5 py-3">GPT 단계</th>
                      <th className="px-5 py-3">후보 품질</th>
                      <th className="px-5 py-3">입력 형태</th>
                      <th className="px-5 py-3">처리</th>
                      <th className="px-5 py-3">오류</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lookupTelemetryEvents.map((event) => {
                      const counts = formatCandidateCounts(event);
                      const normalizationStatus = payloadString(event.payload, "normalizationStatus");
                      const normalizationErrorType = payloadString(event.payload, "normalizationErrorType");
                      const candidateQualityType = payloadString(event.payload, "candidateQualityType");
                      const topLookupBasis = payloadString(event.payload, "topLookupBasis");
                      const topHsLevel = payloadValue(event.payload, "topHsLevel");

                      return (
                        <tr key={event.id} className={isLookupTelemetryIssue(event) ? "bg-amber-50/45" : undefined}>
                          <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-600">{formatDate(event.createdAt)}</td>
                          <td className="px-5 py-4">
                            <p className="font-semibold text-slate-950">{eventLabel(event.eventType)}</p>
                            <p className="mt-1 font-mono text-xs text-slate-500">{event.sourceMode ?? payloadValue(event.payload, "provider")}</p>
                          </td>
                          <td className="px-5 py-4">
                            <Badge tone={eventTone(event)}>{telemetryStatusLabel(event.status)}</Badge>
                          </td>
                          <td className="whitespace-nowrap px-5 py-4 text-slate-700">
                            <span className="font-semibold text-slate-950">{event.resultCount ?? payloadValue(event.payload, "candidateCount")}</span>
                            <span className="ml-1 text-xs text-slate-500">건</span>
                          </td>
                          <td className="px-5 py-4">
                            <p className="font-semibold text-slate-800">{classifyLookupTelemetryIssue(event)}</p>
                            <p className="mt-1 text-xs text-slate-500">
                              AI {payloadValue(event.payload, "normalizationCandidateCount")} · 공식 {payloadValue(event.payload, "officialCandidateCount")} · 보조 {payloadValue(event.payload, "aiHintCount")}
                            </p>
                          </td>
                          <td className="px-5 py-4 text-xs leading-5 text-slate-600">
                            <Badge tone={normalizationStatusTone(normalizationStatus)}>{normalizationStatusLabel(normalizationStatus)}</Badge>
                            <p className="mt-2">
                              HS4 {counts.hs4} · HS6 {counts.hs6} · 10자리 {counts.hsk10}
                            </p>
                            {normalizationErrorType ? (
                              <p className="mt-1 font-medium text-amber-700">{normalizationErrorType}</p>
                            ) : null}
                          </td>
                          <td className="px-5 py-4 text-xs leading-5 text-slate-600">
                            <p className="font-semibold text-slate-800">{candidateQualityLabel(candidateQualityType)}</p>
                            <p className="mt-1">최종 HS6 {counts.finalHs6} · 10자리 {counts.finalHsk10}</p>
                            <p className="mt-1">
                              1순위 {lookupBasisLabel(topLookupBasis)} · HS{topHsLevel}
                            </p>
                          </td>
                          <td className="px-5 py-4 text-xs leading-5 text-slate-600">
                            길이 {payloadValue(event.payload, "productNameLength")} / 토큰 {payloadValue(event.payload, "tokenCount")}
                            <br />
                            한글 {payloadValue(event.payload, "hasHangul")} · 영문 {payloadValue(event.payload, "hasLatin")} · 숫자 {payloadValue(event.payload, "hasDigits")}
                          </td>
                          <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-600">
                            {event.durationMs ?? payloadValue(event.payload, "durationMs")}ms
                          </td>
                          <td className="max-w-[240px] px-5 py-4 text-xs font-medium text-slate-600">
                            {event.errorType ?? payloadValue(event.payload, "errorType")}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="p-5 text-sm text-slate-600">
              저장된 조회 품질 로그가 없습니다. 운영에서 `LOOKUP_TELEMETRY_ENABLED=true`와 `SUPABASE_SERVICE_ROLE_KEY`가 설정되어야 기록됩니다.
            </div>
          )}
        </CardBody>
      </Card>

      {groups.map((group) => (
        <Card key={group.title}>
          <CardHeader title={group.title} description={group.description} />
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500">
                  <tr>
                    <th className="px-5 py-3">항목</th>
                    <th className="px-5 py-3">상태</th>
                    <th className="px-5 py-3">값</th>
                    <th className="px-5 py-3">설명</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {group.items.map((item) => (
                    <tr key={item.key}>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-950">{item.label}</p>
                        <p className="mt-1 font-mono text-xs text-slate-500">{item.key}</p>
                      </td>
                      <td className="px-5 py-4">
                        <Badge tone={statusTone(item.status)}>{statusLabel(item.status)}</Badge>
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-700">{item.valuePreview}</td>
                      <td className="max-w-xl px-5 py-4 text-slate-600">{item.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
