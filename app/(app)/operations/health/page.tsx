import { AccessDenied } from "@/components/access-denied";
import { PageHeading } from "@/components/page-heading";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { requireDeveloperRole } from "@/server/auth/role-guard";
import { OperationsIssueStatusForm } from "@/features/operations/operations-issue-status-form";
import {
  getEnvironmentHealthGroups,
  getExternalIntegrationHealthItems,
  type EnvironmentHealthItem
} from "@/server/operations/environment-health.service";
import {
  getOperationsRetentionStatus,
  type OperationsRetentionStatus
} from "@/server/operations/operations-retention.service";
import { getProductionSchemaHealthReport } from "@/server/operations/schema-health.service";
import { createSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase/server";
import {
  listRecentBackgroundJobRuns,
  listRecentOperationsAlertEvents,
  listRecentBackgroundJobOperations,
  summarizeBackgroundJobRuns,
  summarizeOperationsAlertEvents,
  summarizeBackgroundJobOperations,
  type BackgroundJobRunItem,
  type OperationsAlertEventItem,
  type BackgroundJobOperationsItem
} from "@/server/repositories/background-job.repository";
import {
  filterOperationsIssueEvents,
  getOpenOperationsIssueAgeStatus,
  getOperationsIssueStatusChangeSummary,
  buildOperationsIssueActiveFilterLabels,
  buildOperationsIssueResultSummaryMetrics,
  buildOperationsIssueQuickFilterPresets,
  buildOperationsIssueTriageFocus,
  isUnassignedOperationsIssueOwnerFilter,
  operationsIssueFiltersMatch,
  listRecentOperationsIssueEvents,
  sortOperationsIssueEventsForTriage,
  summarizeOpenOperationsIssuesByOwner,
  summarizeOperationsIssueResolutionOutcomes,
  summarizeOperationsIssueEvents,
  type OperationsIssueEventItem,
  type OperationsIssueEventFilters,
  type OperationsIssueQuickFilterPreset,
  type OperationsIssueSeverity,
  type OperationsIssueStatus
} from "@/server/repositories/operations-issue.repository";
import {
  getDomesticHsLookupSnapshotCoverageFromSupabase,
  type DomesticHsLookupSnapshotCoverage,
} from "@/server/repositories/source-inventory.repository";
import {
  buildOperationsIssueLookupDrilldown,
  classifyLookupTelemetryBucket,
  classifyLookupTelemetryIssue,
  isLookupTelemetryIssue,
  listRecentLookupTelemetryEvents,
  summarizeRecurringLookupTelemetryIssues,
  summarizeLookupTelemetryBuckets,
  summarizeLookupTelemetryDiagnostics,
  type LookupTelemetryEvent
} from "@/server/repositories/lookup-telemetry.repository";
import { getSeoulDateString } from "@/lib/utils";

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

const operationsManualCommands = [
  {
    label: "worker 즉시 실행",
    command: "vercel env run -e production -- npm run ops:job:background",
    useWhen: "대기 중인 백그라운드 작업을 cron 전 즉시 처리해야 할 때 사용합니다.",
    purpose: "대기 중인 document_extraction, hs_batch_lookup 백그라운드 작업을 즉시 처리합니다.",
    expected: "claimed, outcomes, alert 결과가 JSON으로 표시됩니다."
  },
  {
    label: "worker 실패 알림 리허설",
    command: "vercel env run -e production -- npm run ops:job:background-failure-rehearsal",
    useWhen: "운영 실패 알림 메일과 run 이력 저장 경로를 배포 후 확인할 때 사용합니다.",
    purpose: "임시 실패 job으로 실패 처리, run 이력, 운영 메일 알림 경로를 검증합니다.",
    expected: "alert.sent가 true이고 임시 job은 스크립트가 삭제합니다."
  },
  {
    label: "HS snapshot 갱신",
    command: "vercel env run -e production -- npm run ops:job:hs-lookup-snapshots",
    useWhen: "HS 10자리/4자리/6자리 조회 snapshot 기준일이 오늘이 아니거나 refresh cron을 배포 후 즉시 검증할 때 사용합니다.",
    purpose: "국내 HS lookup read model 3종을 함께 갱신합니다.",
    expected: "refreshed true, snapshotBasisDate가 오늘 KST 날짜, HTTP 200이면 정상입니다."
  },
  {
    label: "운영 이력 정리",
    command: "vercel env run -e production -- npm run ops:job:operations-retention",
    useWhen: "보존 상태 카드의 정리 후보가 누적되었거나 정리 cron을 수동 확인할 때 사용합니다.",
    purpose: "운영 알림 이력, worker 실행 이력, 완료된 background job 이력을 보존 기간 기준으로 정리합니다.",
    expected: "deletedCount, deletedRuns, deletedJobs가 JSON으로 표시됩니다."
  },
  {
    label: "운영 이슈 동기화",
    command: "vercel env run -e production -- npm run ops:job:operations-issues",
    useWhen: "운영 이슈 목록이 0건이거나 최근 반복 조회 품질 이슈를 즉시 반영해야 할 때 사용합니다.",
    purpose: "반복 조회 품질 이슈를 operations issue로 저장해 처리 상태를 추적합니다.",
    expected: "scannedEvents, recurringIssues, syncedIssues가 JSON으로 표시됩니다."
  },
  {
    label: "운영 이슈 리허설",
    command: "vercel env run -e production -- npm run ops:job:operations-issues-rehearsal",
    useWhen: "원문 없는 synthetic 데이터로 운영 이슈 생성, 상태 변경, cleanup 경로를 검증할 때 사용합니다.",
    purpose: "원문 없는 synthetic telemetry로 반복 이슈 생성, 상태 변경, cleanup 경로를 검증합니다.",
    expected: "ok가 true이고 cleanupOk 값들이 true로 표시됩니다."
  },
  {
    label: "운영 스키마 점검",
    command: "vercel env run -e production -- npm run health:db",
    useWhen: "migration 반영 후 production Supabase schema drift 여부를 확인할 때 사용합니다.",
    purpose: "현재 migration 파일 기준으로 production Supabase schema drift를 확인합니다.",
    expected: "Issues 0 blocker, 0 warning이면 정상입니다."
  },
  {
    label: "production smoke",
    command: "SMOKE_BASE_URL=https://hsfinder.co.kr npm run smoke:production",
    useWhen: "배포 후 실제 도메인의 로그인 보호와 주요 route 응답을 확인할 때 사용합니다.",
    purpose: "로그인 보호와 주요 route 응답 상태를 빠르게 확인합니다.",
    expected: "summary total=10 success=10 failed=0이면 정상입니다."
  }
];

const occasionalManagementLinks = [
  {
    href: "/operations/notices",
    label: "공지 관리",
    detail: "대시보드 공지·팝업"
  },
  {
    href: "/operations/users",
    label: "고객 계정",
    detail: "가입자·테스트 계정"
  },
  {
    href: "/legal-updates",
    label: "자료 관리",
    detail: "법령·뉴스·자료 수집"
  }
];

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

function backgroundJobStatusLabel(status: string) {
  const labels: Record<string, string> = {
    queued: "대기",
    running: "실행 중",
    succeeded: "성공",
    failed: "재시도 대기",
    canceled: "취소",
    dead: "최종 실패"
  };

  return labels[status] ?? status;
}

function backgroundJobStatusTone(status: string) {
  if (status === "succeeded") return "success";
  if (status === "failed" || status === "dead") return "warning";
  return "neutral";
}

function backgroundJobRunStatusLabel(status: string) {
  if (status === "succeeded") return "정상";
  if (status === "failed") return "실패";
  return status;
}

function backgroundJobRunStatusTone(status: string) {
  return status === "failed" ? "warning" : "success";
}

function operationsAlertStatusLabel(status: string) {
  if (status === "sent") return "발송";
  if (status === "skipped") return "생략";
  if (status === "failed") return "발송 실패";
  return status;
}

function operationsAlertStatusTone(status: string) {
  if (status === "sent") return "success";
  if (status === "failed") return "warning";
  return "neutral";
}

function operationsIssueStatusLabel(status: OperationsIssueStatus) {
  if (status === "open") return "미해결";
  if (status === "resolved") return "해결";
  if (status === "ignored") return "제외";
  return status;
}

function operationsIssueStatusTone(status: OperationsIssueStatus) {
  if (status === "open") return "warning";
  if (status === "resolved") return "success";
  return "neutral";
}

function operationsIssueSeverityLabel(severity: OperationsIssueSeverity) {
  if (severity === "blocker") return "차단";
  if (severity === "warning") return "주의";
  return "정보";
}

function operationsIssueAgeTone(level: "normal" | "watch" | "stale") {
  if (level === "stale") return "warning";
  if (level === "watch") return "neutral";
  return "success";
}

function searchParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseOperationsIssueFilters(params: {
  issueStatus?: string | string[];
  issueSeverity?: string | string[];
  issueAge?: string | string[];
  issueOwner?: string | string[];
  issueQuery?: string | string[];
}): OperationsIssueEventFilters {
  const rawStatus = searchParamValue(params.issueStatus);
  const rawSeverity = searchParamValue(params.issueSeverity);
  const rawAge = searchParamValue(params.issueAge);

  return {
    status: rawStatus === "open" || rawStatus === "resolved" || rawStatus === "ignored" ? rawStatus : "all",
    severity: rawSeverity === "info" || rawSeverity === "warning" || rawSeverity === "blocker" ? rawSeverity : "all",
    ageLevel: rawAge === "normal" || rawAge === "watch" || rawAge === "stale" ? rawAge : "all",
    assignedToLabel: searchParamValue(params.issueOwner)?.trim() ?? "",
    query: searchParamValue(params.issueQuery)?.trim() ?? ""
  };
}

function operationsIssueFilterHref(filters: OperationsIssueEventFilters) {
  const params = new URLSearchParams();
  if (filters.status && filters.status !== "all") params.set("issueStatus", filters.status);
  if (filters.severity && filters.severity !== "all") params.set("issueSeverity", filters.severity);
  if (filters.ageLevel && filters.ageLevel !== "all") params.set("issueAge", filters.ageLevel);
  if (filters.assignedToLabel) params.set("issueOwner", filters.assignedToLabel);
  if (filters.query) params.set("issueQuery", filters.query);

  const query = params.toString();
  return query ? `/operations/health?${query}#issue-events` : "/operations/health#issue-events";
}

function operationsIssueFilterHrefWithout(
  filters: OperationsIssueEventFilters,
  key: "status" | "severity" | "ageLevel" | "assignedToLabel" | "query"
) {
  return operationsIssueFilterHref({
    ...filters,
    [key]: key === "status" || key === "severity" || key === "ageLevel" ? "all" : ""
  });
}

function operationsIssueQuickFilterClassName(preset: OperationsIssueQuickFilterPreset, active = false) {
  if (active) {
    return "rounded-md border border-blue-300 bg-blue-50 px-3 py-2 text-left ring-2 ring-blue-100 transition hover:bg-blue-100";
  }

  if (preset.tone === "warning") {
    return "rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-left transition hover:bg-amber-100";
  }

  if (preset.tone === "success") {
    return "rounded-md border border-emerald-100 bg-emerald-50 px-3 py-2 text-left transition hover:bg-emerald-100";
  }

  return "rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-left transition hover:bg-slate-100";
}

function operationsIssueResultMetricClassName(tone: "neutral" | "info" | "warning") {
  if (tone === "warning") {
    return "rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900";
  }

  if (tone === "info") {
    return "rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-blue-900";
  }

  return "rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700";
}

function shortOperationsIssueKey(issueKey: string) {
  return issueKey.length > 42 ? `${issueKey.slice(0, 39)}...` : issueKey;
}

function operationsIssueDisplayValue(value: string | null | undefined) {
  return value?.trim() || "미입력";
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

function formatPercent(part: number, total: number) {
  if (total <= 0) return "0%";
  return `${Math.round((part / total) * 100)}%`;
}

function formatMs(value: number | null) {
  return value === null ? "-" : `${Math.round(value)}ms`;
}

function retentionTone(count: number) {
  return count > 0 ? "warning" : "success";
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

function sourceModeLabel(value: string | null) {
  const labels: Record<string, string> = {
    snapshot_rpc: "snapshot RPC",
    source_tables: "source table fallback",
    mock: "mock",
    openai: "OpenAI",
    supabase_gpt_only: "GPT 중심",
    local: "local"
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

function summarizeLookupTelemetryByRoute(events: LookupTelemetryEvent[]) {
  const rows = new Map<string, {
    route: string;
    total: number;
    issues: number;
    durationTotal: number;
    durationCount: number;
    maxDuration: number | null;
  }>();

  for (const event of events) {
    const route = event.route ?? event.eventType;
    const current = rows.get(route) ?? {
      route,
      total: 0,
      issues: 0,
      durationTotal: 0,
      durationCount: 0,
      maxDuration: null
    };
    const duration = event.durationMs ?? payloadNumber(event.payload, "durationMs");
    current.total += 1;
    current.issues += isLookupTelemetryIssue(event) ? 1 : 0;
    if (duration !== null) {
      current.durationTotal += duration;
      current.durationCount += 1;
      current.maxDuration = current.maxDuration === null ? duration : Math.max(current.maxDuration, duration);
    }
    rows.set(route, current);
  }

  return [...rows.values()].map((row) => ({
    route: row.route,
    total: row.total,
    issues: row.issues,
    failureRate: formatPercent(row.issues, row.total),
    averageDurationMs: row.durationCount > 0 ? row.durationTotal / row.durationCount : null,
    maxDurationMs: row.maxDuration
  })).sort((a, b) => {
    if (b.issues !== a.issues) return b.issues - a.issues;
    if (b.total !== a.total) return b.total - a.total;
    return a.route.localeCompare(b.route);
  }).slice(0, 6);
}

function summarizeHsDirectLookupSources(events: LookupTelemetryEvent[]) {
  const rows = new Map<string, {
    sourceMode: string;
    total: number;
    fallback: number;
    failed: number;
    durationTotal: number;
    durationCount: number;
    maxDuration: number | null;
  }>();

  for (const event of events) {
    if (event.eventType !== "hs_direct_lookup_resolved") continue;
    const sourceMode = event.sourceMode ?? "unknown";
    const current = rows.get(sourceMode) ?? {
      sourceMode,
      total: 0,
      fallback: 0,
      failed: 0,
      durationTotal: 0,
      durationCount: 0,
      maxDuration: null
    };
    const duration = event.durationMs ?? payloadNumber(event.payload, "durationMs");
    current.total += 1;
    current.fallback += event.status === "fallback" ? 1 : 0;
    current.failed += event.status === "failed" || event.status === "error" ? 1 : 0;
    if (duration !== null) {
      current.durationTotal += duration;
      current.durationCount += 1;
      current.maxDuration = current.maxDuration === null ? duration : Math.max(current.maxDuration, duration);
    }
    rows.set(sourceMode, current);
  }

  const total = [...rows.values()].reduce((sum, row) => sum + row.total, 0);

  return [...rows.values()].map((row) => ({
    sourceMode: row.sourceMode,
    label: sourceModeLabel(row.sourceMode),
    total: row.total,
    share: formatPercent(row.total, total),
    fallback: row.fallback,
    failed: row.failed,
    averageDurationMs: row.durationCount > 0 ? row.durationTotal / row.durationCount : null,
    maxDurationMs: row.maxDuration
  })).sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total;
    return a.sourceMode.localeCompare(b.sourceMode);
  });
}

function summarizeProductRecommendationCacheImpact(events: LookupTelemetryEvent[]) {
  const productRecommendationEvents = events.filter((event) => event.eventType === "product_candidates_recommended");
  const emptyEvents = productRecommendationEvents.filter((event) => event.resultCount === 0);
  const durationValues = emptyEvents
    .map((event) => event.durationMs ?? payloadNumber(event.payload, "durationMs"))
    .filter((value): value is number => value !== null);
  const gptFailedEmpty = emptyEvents.filter((event) => payloadString(event.payload, "normalizationStatus") === "failed").length;

  return {
    total: productRecommendationEvents.length,
    empty: emptyEvents.length,
    gptFailedEmpty,
    averageEmptyDurationMs: durationValues.length
      ? durationValues.reduce((sum, value) => sum + value, 0) / durationValues.length
      : null
  };
}

async function loadLookupTelemetryEvents() {
  if (!hasSupabaseEnv()) return [];

  const supabase = await createSupabaseServerClient();
  return listRecentLookupTelemetryEvents(supabase, 30).catch(() => []);
}

async function loadBackgroundJobOperations() {
  if (!hasSupabaseEnv()) return [];

  const supabase = await createSupabaseServerClient();
  return listRecentBackgroundJobOperations(supabase, 20).catch(() => []);
}

async function loadBackgroundJobRuns() {
  if (!hasSupabaseEnv()) return [];

  const supabase = await createSupabaseServerClient();
  return listRecentBackgroundJobRuns(supabase, 20).catch(() => []);
}

async function loadOperationsAlertEvents() {
  if (!hasSupabaseEnv()) return [];

  const supabase = await createSupabaseServerClient();
  return listRecentOperationsAlertEvents(supabase, 20).catch(() => []);
}

async function loadOperationsIssueEvents() {
  if (!hasSupabaseEnv()) return [];

  const supabase = await createSupabaseServerClient();
  return listRecentOperationsIssueEvents(supabase, 100).catch(() => []);
}

async function loadOperationsRetentionStatus(): Promise<OperationsRetentionStatus | null> {
  if (!hasSupabaseEnv()) return null;

  const supabase = await createSupabaseServerClient();
  return getOperationsRetentionStatus(supabase).catch(() => null);
}

async function loadDomesticLookupSnapshotCoverage(): Promise<DomesticHsLookupSnapshotCoverage | null> {
  if (!hasSupabaseEnv()) return null;

  const supabase = await createSupabaseServerClient();
  return getDomesticHsLookupSnapshotCoverageFromSupabase(supabase).catch(() => null);
}

export default async function OperationsHealthPage({
  searchParams
}: {
  searchParams?: Promise<{
    issueStatus?: string | string[];
    issueSeverity?: string | string[];
    issueAge?: string | string[];
    issueOwner?: string | string[];
    issueQuery?: string | string[];
  }>;
}) {
  const guard = await requireDeveloperRole();

  if (!guard.allowed) {
    return <AccessDenied message={guard.message} />;
  }

  const issueFilters = parseOperationsIssueFilters((await searchParams) ?? {});
  const groups = getEnvironmentHealthGroups();
  const integrationHealthItems = getExternalIntegrationHealthItems();
  const [
    lookupTelemetryEvents,
    backgroundJobs,
    backgroundJobRuns,
    operationsAlertEvents,
    operationsIssueEvents,
    operationsRetentionStatus,
    schemaHealthReport,
    domesticLookupSnapshotCoverage
  ] = await Promise.all([
    loadLookupTelemetryEvents(),
    loadBackgroundJobOperations(),
    loadBackgroundJobRuns(),
    loadOperationsAlertEvents(),
    loadOperationsIssueEvents(),
    loadOperationsRetentionStatus(),
    getProductionSchemaHealthReport(),
    loadDomesticLookupSnapshotCoverage()
  ]);
  const todayKst = getSeoulDateString();
  const snapshotBasisDate = domesticLookupSnapshotCoverage?.snapshotBasisDate ?? null;
  const snapshotIsToday = snapshotBasisDate === todayKst;
  const lookupIssueCount = lookupTelemetryEvents.filter(isLookupTelemetryIssue).length;
  const lookupSuccessCount = lookupTelemetryEvents.length - lookupIssueCount;
  const zeroResultCount = lookupTelemetryEvents.filter((event) => event.resultCount === 0).length;
  const lookupDiagnosisSummary = summarizeLookupTelemetryDiagnostics(lookupTelemetryEvents);
  const lookupBucketSummary = summarizeLookupTelemetryBuckets(lookupTelemetryEvents);
  const lookupIssueSummary = lookupDiagnosisSummary.filter((item) => item.issueCount > 0).slice(0, 4);
  const lookupDailySummary = summarizeLookupTelemetryByDay(lookupTelemetryEvents);
  const lookupRouteSummary = summarizeLookupTelemetryByRoute(lookupTelemetryEvents);
  const hsDirectSourceSummary = summarizeHsDirectLookupSources(lookupTelemetryEvents);
  const productRecommendationCacheImpact = summarizeProductRecommendationCacheImpact(lookupTelemetryEvents);
  const recurringLookupIssues = summarizeRecurringLookupTelemetryIssues(lookupTelemetryEvents, 3);
  const priorityLookupEvents = lookupTelemetryEvents.filter(isLookupTelemetryIssue).slice(0, 8);
  const normalLookupSamples = lookupTelemetryEvents.filter((event) => !isLookupTelemetryIssue(event)).slice(0, 3);
  const backgroundJobSummary = summarizeBackgroundJobOperations(backgroundJobs);
  const backgroundJobRunSummary = summarizeBackgroundJobRuns(backgroundJobRuns);
  const operationsAlertSummary = summarizeOperationsAlertEvents(operationsAlertEvents);
  const filteredOperationsIssueEvents = sortOperationsIssueEventsForTriage(
    filterOperationsIssueEvents(operationsIssueEvents, issueFilters)
  );
  const operationsIssueSummary = summarizeOperationsIssueEvents(operationsIssueEvents);
  const filteredOperationsIssueSummary = summarizeOperationsIssueEvents(filteredOperationsIssueEvents);
  const operationsIssueOwnerSummary = summarizeOpenOperationsIssuesByOwner(operationsIssueEvents).slice(0, 6);
  const operationsIssueResolutionSummary = summarizeOperationsIssueResolutionOutcomes(operationsIssueEvents);
  const operationsIssueQuickFilterPresets = buildOperationsIssueQuickFilterPresets(operationsIssueEvents);
  const operationsIssueActiveFilterLabels = buildOperationsIssueActiveFilterLabels(issueFilters);
  const operationsIssueDrilldowns = new Map(operationsIssueEvents.map((issue) => [
    issue.id,
    buildOperationsIssueLookupDrilldown(issue, lookupTelemetryEvents)
  ]));
  const operationsIssueAgeStatuses = new Map(operationsIssueEvents.map((issue) => [
    issue.id,
    getOpenOperationsIssueAgeStatus(issue)
  ]));
  const hasOperationsIssueFilters = Boolean(
    (issueFilters.status && issueFilters.status !== "all")
      || (issueFilters.severity && issueFilters.severity !== "all")
      || (issueFilters.ageLevel && issueFilters.ageLevel !== "all")
      || issueFilters.assignedToLabel
      || issueFilters.query
  );
  const operationsIssueResultSummaryMetrics = buildOperationsIssueResultSummaryMetrics(
    filteredOperationsIssueSummary,
    operationsIssueSummary,
    hasOperationsIssueFilters
  );
  const operationsIssueTriageFocus = buildOperationsIssueTriageFocus(filteredOperationsIssueEvents);
  const hasStoredOperationsIssues = operationsIssueSummary.total > 0;
  const hasOpenOperationsIssues = operationsIssueSummary.open > 0;
  const operationsIssueOwnerFilterHelp = isUnassignedOperationsIssueOwnerFilter(issueFilters.assignedToLabel)
    ? "담당자 값이 비어 있는 미해결 이슈만 확인할 때 사용하는 조건입니다."
    : "미지정 입력 시 담당자 없는 이슈만 필터링합니다.";
  const totalRetentionCandidates = operationsRetentionStatus
    ? operationsRetentionStatus.operationsAlertEvents.pruneCandidateCount
      + operationsRetentionStatus.backgroundJobHistory.runPruneCandidateCount
      + operationsRetentionStatus.backgroundJobHistory.jobPruneCandidateCount
      + operationsRetentionStatus.operationsIssueEvents.pruneCandidateCount
    : 0;
  const items = groups.flatMap((group) => group.items);
  const missingRequiredCount = items.filter((item) => item.status === "missing").length;
  const schemaStatusTone = schemaHealthReport.status === "ok" ? "success" : "warning";
  const schemaStatusLabel = schemaHealthReport.status === "ok" ? "정상" : schemaHealthReport.status === "warn" ? "주의" : "차단";
  const advancedDiagnosticsWarningCount = [
    missingRequiredCount > 0,
    schemaHealthReport.status !== "ok",
    !snapshotIsToday,
    totalRetentionCandidates > 0,
    backgroundJobSummary.dead > 0 || backgroundJobSummary.failed > 0 || backgroundJobRunSummary.failedRuns > 0 || backgroundJobRunSummary.failedJobs > 0 || backgroundJobRunSummary.latestStatus === "failed",
    operationsAlertSummary.failed > 0
  ].filter(Boolean).length;
  const operationalSummary = [
    {
      label: "서비스 준비",
      value: missingRequiredCount > 0 || schemaHealthReport.summary.blockerCount > 0 ? "확인 필요" : "정상",
      detail: `설정 누락 ${missingRequiredCount} / DB 차단 ${schemaHealthReport.summary.blockerCount}`,
      tone: missingRequiredCount > 0 || schemaHealthReport.summary.blockerCount > 0 ? "warning" : "success"
    },
    {
      label: "HS 데이터",
      value: snapshotBasisDate ?? "미확인",
      detail: domesticLookupSnapshotCoverage
        ? `HSK ${domesticLookupSnapshotCoverage.totalHsk10.toLocaleString("ko-KR")}건 / 갱신 ${domesticLookupSnapshotCoverage.lastRefreshedAt ? formatDate(domesticLookupSnapshotCoverage.lastRefreshedAt) : "-"}`
        : "coverage RPC 미확인",
      tone: snapshotIsToday ? "success" : "warning"
    },
    {
      label: "자동 작업",
      value: backgroundJobRunSummary.latestStatus ? backgroundJobRunStatusLabel(backgroundJobRunSummary.latestStatus) : "이력 없음",
      detail: `진행 ${backgroundJobSummary.queued + backgroundJobSummary.running} / 실패 ${backgroundJobSummary.dead + backgroundJobRunSummary.failedJobs}`,
      tone: backgroundJobSummary.dead > 0 || backgroundJobSummary.failed > 0 || backgroundJobRunSummary.failedJobs > 0 || backgroundJobRunSummary.latestStatus === "failed" ? "warning" : "success"
    },
    {
      label: "조치할 일",
      value: `${operationsIssueSummary.open}건 미해결`,
      detail: `이슈 ${operationsIssueSummary.open} / 알림 실패 ${operationsAlertSummary.failed}`,
      tone: operationsIssueSummary.open > 0 || operationsAlertSummary.failed > 0 ? "warning" : "success"
    },
    {
      label: "조회 품질",
      value: recurringLookupIssues.length ? `반복 ${recurringLookupIssues.length}개` : `${lookupIssueCount}건 점검`,
      detail: recurringLookupIssues.length
        ? `최다 ${recurringLookupIssues[0].label} ${recurringLookupIssues[0].issueCount}건`
        : `정상 ${lookupSuccessCount}건 / 무결과 ${zeroResultCount}건`,
      tone: lookupIssueCount > 0 ? "warning" : "success"
    }
  ] satisfies Array<{
    label: string;
    value: string;
    detail: string;
    tone: "success" | "warning";
  }>;
  const operatorActionItems = [
    {
      href: "#issue-events",
      label: "운영 이슈",
      value: operationsIssueSummary.open > 0 ? `${operationsIssueSummary.open}건 처리 필요` : "처리할 이슈 없음",
      detail: operationsIssueSummary.open > 0
        ? "반복 조회 문제나 장애 징후를 먼저 확인합니다."
        : "미해결 운영 이슈가 없습니다.",
      tone: operationsIssueSummary.open > 0 ? "warning" : "success"
    },
    {
      href: "#lookup-quality",
      label: "조회 품질",
      value: lookupIssueCount > 0 ? `${lookupIssueCount}건 점검` : "정상 처리",
      detail: lookupIssueCount > 0
        ? "무결과, fallback, GPT 실패 흐름을 확인합니다."
        : `최근 로그 정상 ${lookupSuccessCount}건입니다.`,
      tone: lookupIssueCount > 0 ? "warning" : "success"
    },
    {
      href: "#advanced-operations",
      label: "상세 진단",
      value: advancedDiagnosticsWarningCount > 0 ? `${advancedDiagnosticsWarningCount}건 확인` : "배포 후 점검 정상",
      detail: advancedDiagnosticsWarningCount > 0
        ? "환경, DB, snapshot, worker, 알림 중 확인할 항목이 있습니다."
        : "장애 대응이나 배포 직후에만 펼쳐 확인하면 됩니다.",
      tone: advancedDiagnosticsWarningCount > 0 ? "warning" : "success"
    }
  ] satisfies Array<{
    href: string;
    label: string;
    value: string;
    detail: string;
    tone: "success" | "warning";
  }>;

  return (
    <div className="grid gap-5">
      <PageHeading
        title="운영 점검"
        description="배포 환경에서 필요한 연결값과 운영 보호 설정을 확인합니다. 키 원문은 표시하지 않습니다."
      />

      <Card>
        <CardHeader
          title="핵심 운영 요약"
          description="매일 볼 판단 항목만 표시합니다. 세부 환경값, 스키마, worker 이력은 상세 진단에 접어 두었습니다."
          action={<Badge tone={operationalSummary.some((item) => item.tone === "warning") ? "warning" : "success"}>점검 {operationalSummary.filter((item) => item.tone === "warning").length}건</Badge>}
        />
        <CardBody>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-5">
            {operationalSummary.map((item) => (
              <div key={item.label} className="rounded-md border border-slate-200 bg-white px-3 py-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-500">{item.label}</p>
                  <Badge tone={item.tone}>{item.tone === "warning" ? "확인" : "정상"}</Badge>
                </div>
                <p className="mt-2 text-lg font-semibold text-slate-950">{item.value}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{item.detail}</p>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="오늘 할 일"
          description="1인 운영자가 먼저 판단할 항목입니다. 정상인 항목은 확인만 하고 넘어가면 됩니다."
        />
        <CardBody>
          <nav className="grid gap-2 lg:grid-cols-3" aria-label="운영 오늘 할 일">
            {operatorActionItems.map((item) => (
              <a
                className={item.tone === "warning"
                  ? "rounded-md border border-amber-200 bg-amber-50 px-3 py-3 text-sm transition hover:border-amber-300 hover:bg-amber-100/70"
                  : "rounded-md border border-emerald-100 bg-emerald-50 px-3 py-3 text-sm transition hover:border-emerald-200 hover:bg-emerald-100/70"}
                href={item.href}
                key={item.href}
              >
                <span className="flex items-start justify-between gap-2">
                  <span className="font-semibold text-slate-950">{item.label}</span>
                  <Badge tone={item.tone}>{item.tone === "warning" ? "확인" : "정상"}</Badge>
                </span>
                <span className="mt-2 block text-base font-semibold text-slate-950">{item.value}</span>
                <span className="mt-1 block text-xs leading-5 text-slate-600">{item.detail}</span>
              </a>
            ))}
          </nav>
        </CardBody>
      </Card>

      <details className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4">
          <span>
            <span className="block text-base font-semibold text-slate-950">가끔 쓰는 관리</span>
            <span className="mt-1 block text-sm text-slate-500">공지, 계정, 자료 수집은 필요할 때만 펼쳐서 이동합니다.</span>
          </span>
          <Badge tone="neutral">{occasionalManagementLinks.length}개</Badge>
        </summary>
        <div className="border-t border-slate-200 p-4">
          <nav className="grid gap-2 sm:grid-cols-3" aria-label="운영 보조 관리">
            {occasionalManagementLinks.map((item) => (
              <a
                className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-sm transition hover:border-blue-200 hover:bg-blue-50"
                href={item.href}
                key={item.href}
              >
                <span className="font-semibold text-slate-950">{item.label}</span>
                <span className="mt-1 block text-xs text-slate-500">{item.detail}</span>
              </a>
            ))}
          </nav>
        </div>
      </details>

      <details id="advanced-operations" className="scroll-mt-6 rounded-lg border border-slate-200 bg-white shadow-sm">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4">
          <span>
            <span className="block text-base font-semibold text-slate-950">상세 진단</span>
            <span className="mt-1 block text-sm text-slate-500">환경변수, 스키마, snapshot, worker, 알림, 수동 명령은 필요할 때만 펼쳐 확인합니다.</span>
          </span>
          <Badge tone={advancedDiagnosticsWarningCount > 0 ? "warning" : "success"}>
            상세 확인 {advancedDiagnosticsWarningCount}건
          </Badge>
        </summary>
        <div className="grid gap-5 border-t border-slate-200 bg-slate-50/45 p-4">
          <details className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
              <span>
                <span className="block text-sm font-semibold text-slate-950">배포 후 확인</span>
                <span className="mt-1 block text-xs text-slate-500">외부 연동, DB 스키마, HS snapshot, 수동 명령은 배포 직후나 장애 대응 때만 확인합니다.</span>
              </span>
              <Badge tone={schemaHealthReport.summary.blockerCount > 0 || !snapshotIsToday ? "warning" : "success"}>4개 항목</Badge>
            </summary>
            <div className="grid gap-5 border-t border-slate-200 bg-slate-50/45 p-4">
      <Card id="integrations" className="scroll-mt-6">
        <CardHeader
          title="외부 연동 준비 상태"
          description="개별 환경변수가 아니라 실제 기능 단위로 호출 경로, 누락값, 운영 주의사항을 확인합니다."
        />
        <CardBody>
          <div className="grid gap-3 lg:grid-cols-2">
            {integrationHealthItems.map((item) => (
              <div
                className="rounded-lg border border-slate-200 bg-white p-4"
                key={item.key}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">{item.label}</p>
                    <p className="mt-1 text-xs font-medium text-slate-500">{item.path}</p>
                  </div>
                  <Badge tone={statusTone(item.status)}>{statusLabel(item.status)}</Badge>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{item.message}</p>
                <div className="mt-3 grid gap-2 text-xs md:grid-cols-2">
                  <div className="rounded-md bg-slate-50 px-3 py-2">
                    <p className="font-semibold text-slate-500">설정됨</p>
                    <p className="mt-1 break-all font-mono text-slate-700">
                      {item.configuredKeys.length ? item.configuredKeys.join(", ") : "-"}
                    </p>
                  </div>
                  <div className="rounded-md bg-slate-50 px-3 py-2">
                    <p className="font-semibold text-slate-500">확인 필요</p>
                    <p className="mt-1 break-all font-mono text-slate-700">
                      {item.missingKeys.length ? item.missingKeys.join(", ") : "-"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card id="schema-health" className="scroll-mt-6">
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

      <Card id="hs-lookup-snapshot" className="scroll-mt-6">
        <CardHeader
          title="HS lookup snapshot 상태"
          description="10자리 상세조회와 4/6자리 탐색이 사용하는 read model 기준일과 coverage를 확인합니다."
          action={<Badge tone={snapshotIsToday ? "success" : "warning"}>{snapshotIsToday ? "오늘 기준" : "갱신 확인"}</Badge>}
        />
        <CardBody>
          {domesticLookupSnapshotCoverage ? (
            <div className="grid gap-3 lg:grid-cols-4">
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold text-slate-500">snapshot 기준일</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{domesticLookupSnapshotCoverage.snapshotBasisDate ?? "-"}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">앱 기본 기준일: {todayKst}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold text-slate-500">마지막 refresh</p>
                <p className="mt-2 text-sm font-semibold text-slate-950">
                  {domesticLookupSnapshotCoverage.lastRefreshedAt ? formatDate(domesticLookupSnapshotCoverage.lastRefreshedAt) : "-"}
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">cron: 매일 00:10 KST</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold text-slate-500">HSK 10자리 snapshot</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{domesticLookupSnapshotCoverage.totalHsk10.toLocaleString("ko-KR")}건</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">관세율 누락 {domesticLookupSnapshotCoverage.missingTariffRates.toLocaleString("ko-KR")}건</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold text-slate-500">coverage</p>
                <p className="mt-2 text-sm font-semibold text-slate-950">
                  관세 {domesticLookupSnapshotCoverage.withTariffRates.toLocaleString("ko-KR")} / 요건 {domesticLookupSnapshotCoverage.withCustomsRequirements.toLocaleString("ko-KR")}
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  통합공고 {domesticLookupSnapshotCoverage.withPublicNoticeRequirements.toLocaleString("ko-KR")} / 내국세 {domesticLookupSnapshotCoverage.withInternalTaxes.toLocaleString("ko-KR")}
                </p>
              </div>
              {!snapshotIsToday ? (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-3 text-sm leading-6 text-amber-900 lg:col-span-4">
                  snapshot 기준일이 오늘 KST 기준일과 다릅니다. `vercel env run -e production -- npm run ops:job:hs-lookup-snapshots`로 refresh job을 수동 실행해 확인하세요.
                </div>
              ) : null}
            </div>
          ) : (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-3 text-sm leading-6 text-amber-900">
              HS lookup snapshot coverage를 조회하지 못했습니다. Supabase 연결 또는 `get_domestic_hs_lookup_snapshot_coverage` RPC를 확인하세요.
            </div>
          )}
        </CardBody>
      </Card>

      <Card id="manual-commands" className="scroll-mt-6">
        <CardHeader
          title="수동 운영 명령"
          description="장애 대응, 정리 작업, 배포 후 검증에 사용하는 보호된 운영 명령입니다. secret 값은 Vercel production 환경변수에서 주입됩니다."
        />
        <CardBody>
          <div className="grid gap-3 xl:grid-cols-2">
            {operationsManualCommands.map((item) => (
              <div key={item.label} className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">{item.label}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{item.purpose}</p>
                  </div>
                  <Badge tone="neutral">수동</Badge>
                </div>
                <p className="mt-3 rounded-md border border-blue-100 bg-blue-50 px-2 py-1.5 text-xs leading-5 text-blue-900">
                  실행 시점: {item.useWhen}
                </p>
                <pre className="mt-3 overflow-x-auto rounded-md bg-slate-950 px-3 py-2 text-xs leading-5 text-slate-50">
                  <code>{item.command}</code>
                </pre>
                <p className="mt-3 text-xs leading-5 text-slate-500">예상 결과: {item.expected}</p>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
            </div>
          </details>

          <details className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
              <span>
                <span className="block text-sm font-semibold text-slate-950">작업·알림 이력</span>
                <span className="mt-1 block text-xs text-slate-500">보존 상태, worker queue, worker 실행, 운영 알림 이력은 실패나 정리 후보가 있을 때 확인합니다.</span>
              </span>
              <Badge tone={totalRetentionCandidates > 0 || backgroundJobSummary.dead > 0 || backgroundJobRunSummary.failedRuns > 0 || operationsAlertSummary.failed > 0 ? "warning" : "success"}>4개 항목</Badge>
            </summary>
            <div className="grid gap-5 border-t border-slate-200 bg-slate-50/45 p-4">
      <Card id="retention-health" className="scroll-mt-6">
        <CardHeader
          title="운영 이력 보존 상태"
          description="운영 알림, worker 실행 이력, 완료된 백그라운드 작업의 보존 기간과 정리 후보 건수를 확인합니다."
          action={<Badge tone={totalRetentionCandidates > 0 ? "warning" : "success"}>정리 후보 {totalRetentionCandidates}건</Badge>}
        />
        <CardBody>
          {operationsRetentionStatus ? (
            <div className="grid gap-3 lg:grid-cols-4">
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">운영 알림 이력</p>
                    <p className="mt-1 text-xs text-slate-500">보존 {operationsRetentionStatus.operationsAlertEvents.retentionDays}일</p>
                  </div>
                  <Badge tone={retentionTone(operationsRetentionStatus.operationsAlertEvents.pruneCandidateCount)}>
                    후보 {operationsRetentionStatus.operationsAlertEvents.pruneCandidateCount}건
                  </Badge>
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-600">
                  cutoff: {formatDate(operationsRetentionStatus.operationsAlertEvents.cutoffAt)}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">worker 실행 이력</p>
                    <p className="mt-1 text-xs text-slate-500">보존 {operationsRetentionStatus.backgroundJobHistory.retentionDays}일</p>
                  </div>
                  <Badge tone={retentionTone(operationsRetentionStatus.backgroundJobHistory.runPruneCandidateCount)}>
                    후보 {operationsRetentionStatus.backgroundJobHistory.runPruneCandidateCount}건
                  </Badge>
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-600">
                  cutoff: {formatDate(operationsRetentionStatus.backgroundJobHistory.cutoffAt)}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">완료 작업 이력</p>
                    <p className="mt-1 text-xs text-slate-500">성공·취소·최종 실패만 정리</p>
                  </div>
                  <Badge tone={retentionTone(operationsRetentionStatus.backgroundJobHistory.jobPruneCandidateCount)}>
                    후보 {operationsRetentionStatus.backgroundJobHistory.jobPruneCandidateCount}건
                  </Badge>
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-600">
                  대기·실행 중·재시도 대기 작업은 정리 대상에서 제외됩니다.
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">운영 이슈 이력</p>
                    <p className="mt-1 text-xs text-slate-500">보존 {operationsRetentionStatus.operationsIssueEvents.retentionDays}일</p>
                  </div>
                  <Badge tone={retentionTone(operationsRetentionStatus.operationsIssueEvents.pruneCandidateCount)}>
                    후보 {operationsRetentionStatus.operationsIssueEvents.pruneCandidateCount}건
                  </Badge>
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-600">
                  해결·제외 상태만 정리 대상입니다. cutoff: {formatDate(operationsRetentionStatus.operationsIssueEvents.cutoffAt)}
                </p>
              </div>
              <p className="text-xs text-slate-500 lg:col-span-4">
                최근 확인: {formatDate(operationsRetentionStatus.checkedAt)}. 정리는 `/api/jobs/operations-retention` cron 또는 수동 실행 시 반영됩니다.
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-600">
              운영 이력 보존 상태를 불러오지 못했습니다. Supabase 환경변수와 retention RPC 배포 상태를 확인해 주세요.
            </p>
          )}
        </CardBody>
      </Card>

      <Card id="background-jobs" className="scroll-mt-6">
        <CardHeader
          title="백그라운드 작업 상태"
          description="문서 추출, 소스 수집, 보고서 생성처럼 웹 요청에서 분리되는 작업의 최근 상태를 확인합니다."
          action={<Badge tone={backgroundJobSummary.dead > 0 || backgroundJobSummary.failed > 0 ? "warning" : "success"}>점검 대상 {backgroundJobSummary.failed + backgroundJobSummary.dead}건</Badge>}
        />
        <CardBody className="p-0">
          <div className="grid gap-2 border-b border-slate-200 bg-slate-50 p-3 text-sm md:grid-cols-5">
            <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
              <p className="text-xs font-semibold text-slate-500">최근 작업</p>
              <p className="mt-1 font-semibold text-slate-950">{backgroundJobSummary.total}건</p>
            </div>
            <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
              <p className="text-xs font-semibold text-slate-500">대기</p>
              <p className="mt-1 font-semibold text-slate-950">{backgroundJobSummary.queued}건</p>
            </div>
            <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
              <p className="text-xs font-semibold text-slate-500">실행 중</p>
              <p className="mt-1 font-semibold text-blue-700">{backgroundJobSummary.running}건</p>
            </div>
            <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
              <p className="text-xs font-semibold text-slate-500">재시도 대기</p>
              <p className="mt-1 font-semibold text-amber-700">{backgroundJobSummary.retryWaiting}건</p>
            </div>
            <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
              <p className="text-xs font-semibold text-slate-500">최종 실패</p>
              <p className={backgroundJobSummary.dead > 0 ? "mt-1 font-semibold text-red-700" : "mt-1 font-semibold text-emerald-700"}>{backgroundJobSummary.dead}건</p>
            </div>
          </div>
          {backgroundJobs.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-[960px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500">
                  <tr>
                    <th className="px-5 py-3">수정 시간</th>
                    <th className="px-5 py-3">작업</th>
                    <th className="px-5 py-3">상태</th>
                    <th className="px-5 py-3">시도</th>
                    <th className="px-5 py-3">다음 실행</th>
                    <th className="px-5 py-3">오류</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {backgroundJobs.map((job: BackgroundJobOperationsItem) => (
                    <tr key={job.id} className={job.status === "dead" || job.status === "failed" ? "bg-amber-50/45" : undefined}>
                      <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-600">{formatDate(job.updatedAt)}</td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-950">{job.jobType}</p>
                        <p className="mt-1 font-mono text-xs text-slate-500">{job.id}</p>
                      </td>
                      <td className="px-5 py-4">
                        <Badge tone={backgroundJobStatusTone(job.status)}>{backgroundJobStatusLabel(job.status)}</Badge>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-slate-700">{job.attempts}/{job.maxAttempts}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-600">{formatDate(job.availableAt)}</td>
                      <td className="max-w-[360px] truncate px-5 py-4 text-xs font-medium text-slate-600">{job.errorMessage ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-5 text-sm text-slate-600">
              최근 백그라운드 작업이 없습니다. `BACKGROUND_JOBS_ENABLED=true`와 worker/cron 설정 후 작업 이력이 표시됩니다.
            </div>
          )}
        </CardBody>
      </Card>

      <Card id="worker-runs" className="scroll-mt-6">
        <CardHeader
          title="백그라운드 worker 실행 이력"
          description="Vercel Cron 또는 수동 실행으로 `/api/jobs/run`이 호출된 시각, 처리 건수, 실패 여부를 확인합니다."
          action={<Badge tone={backgroundJobRunSummary.failedRuns > 0 ? "warning" : "success"}>실패 실행 {backgroundJobRunSummary.failedRuns}건</Badge>}
        />
        <CardBody className="p-0">
          <div className="grid gap-2 border-b border-slate-200 bg-slate-50 p-3 text-sm md:grid-cols-5">
            <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
              <p className="text-xs font-semibold text-slate-500">최근 실행</p>
              <p className="mt-1 font-semibold text-slate-950">{backgroundJobRunSummary.total}건</p>
            </div>
            <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
              <p className="text-xs font-semibold text-slate-500">마지막 실행</p>
              <p className="mt-1 font-semibold text-slate-950">
                {backgroundJobRunSummary.latestRunAt ? formatDate(backgroundJobRunSummary.latestRunAt) : "-"}
              </p>
            </div>
            <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
              <p className="text-xs font-semibold text-slate-500">마지막 상태</p>
              <p className="mt-1">
                <Badge tone={backgroundJobRunSummary.latestStatus === "failed" ? "warning" : "success"}>
                  {backgroundJobRunSummary.latestStatus ? backgroundJobRunStatusLabel(backgroundJobRunSummary.latestStatus) : "-"}
                </Badge>
              </p>
            </div>
            <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
              <p className="text-xs font-semibold text-slate-500">처리 작업</p>
              <p className="mt-1 font-semibold text-blue-700">{backgroundJobRunSummary.claimedJobs}건</p>
            </div>
            <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
              <p className="text-xs font-semibold text-slate-500">작업 실패</p>
              <p className={backgroundJobRunSummary.failedJobs > 0 ? "mt-1 font-semibold text-amber-700" : "mt-1 font-semibold text-emerald-700"}>
                {backgroundJobRunSummary.failedJobs}건
              </p>
            </div>
          </div>
          {backgroundJobRuns.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-[980px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500">
                  <tr>
                    <th className="px-5 py-3">실행 시간</th>
                    <th className="px-5 py-3">상태</th>
                    <th className="px-5 py-3">worker</th>
                    <th className="px-5 py-3">처리</th>
                    <th className="px-5 py-3">소요</th>
                    <th className="px-5 py-3">오류</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {backgroundJobRuns.map((run: BackgroundJobRunItem) => (
                    <tr key={run.id} className={run.status === "failed" ? "bg-amber-50/45" : undefined}>
                      <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-600">{formatDate(run.createdAt)}</td>
                      <td className="px-5 py-4">
                        <Badge tone={backgroundJobRunStatusTone(run.status)}>{backgroundJobRunStatusLabel(run.status)}</Badge>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-mono text-xs font-semibold text-slate-800">{run.workerId}</p>
                        <p className="mt-1 text-xs text-slate-500">{run.route}</p>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-slate-700">
                        claimed {run.claimedCount} / 성공 {run.succeededCount} / 실패 {run.failedCount}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-600">{formatMs(run.durationMs)}</td>
                      <td className="max-w-[360px] truncate px-5 py-4 text-xs font-medium text-slate-600">{run.errorMessage ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-5 text-sm text-slate-600">
              아직 worker 실행 이력이 없습니다. `/api/jobs/run` cron 또는 수동 실행 후 표시됩니다.
            </div>
          )}
        </CardBody>
      </Card>

      <Card id="alert-events" className="scroll-mt-6">
        <CardHeader
          title="운영 알림 이력"
          description="백그라운드 worker 실패 알림의 발송, throttle 생략, 발송 실패 이력을 확인합니다."
          action={<Badge tone={operationsAlertSummary.failed > 0 ? "warning" : "success"}>발송 실패 {operationsAlertSummary.failed}건</Badge>}
        />
        <CardBody className="p-0">
          <div className="grid gap-2 border-b border-slate-200 bg-slate-50 p-3 text-sm md:grid-cols-5">
            <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
              <p className="text-xs font-semibold text-slate-500">최근 알림</p>
              <p className="mt-1 font-semibold text-slate-950">{operationsAlertSummary.total}건</p>
            </div>
            <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
              <p className="text-xs font-semibold text-slate-500">마지막 알림</p>
              <p className="mt-1 font-semibold text-slate-950">
                {operationsAlertSummary.latestAlertAt ? formatDate(operationsAlertSummary.latestAlertAt) : "-"}
              </p>
            </div>
            <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
              <p className="text-xs font-semibold text-slate-500">발송</p>
              <p className="mt-1 font-semibold text-emerald-700">{operationsAlertSummary.sent}건</p>
            </div>
            <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
              <p className="text-xs font-semibold text-slate-500">생략</p>
              <p className="mt-1 font-semibold text-slate-700">{operationsAlertSummary.skipped}건</p>
            </div>
            <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
              <p className="text-xs font-semibold text-slate-500">마지막 상태</p>
              <p className="mt-1">
                <Badge tone={operationsAlertSummary.latestStatus ? operationsAlertStatusTone(operationsAlertSummary.latestStatus) : "neutral"}>
                  {operationsAlertSummary.latestStatus ? operationsAlertStatusLabel(operationsAlertSummary.latestStatus) : "-"}
                </Badge>
              </p>
            </div>
          </div>
          {operationsAlertEvents.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-[980px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500">
                  <tr>
                    <th className="px-5 py-3">시각</th>
                    <th className="px-5 py-3">상태</th>
                    <th className="px-5 py-3">유형</th>
                    <th className="px-5 py-3">수신자</th>
                    <th className="px-5 py-3">사유</th>
                    <th className="px-5 py-3">키</th>
                    <th className="px-5 py-3">처리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {operationsAlertEvents.map((event: OperationsAlertEventItem) => (
                    <tr key={event.id} className={event.status === "failed" ? "bg-amber-50/45" : undefined}>
                      <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-600">{formatDate(event.createdAt)}</td>
                      <td className="px-5 py-4">
                        <Badge tone={operationsAlertStatusTone(event.status)}>{operationsAlertStatusLabel(event.status)}</Badge>
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-800">{event.alertType}</td>
                      <td className="px-5 py-4 text-xs text-slate-600">{event.recipient ?? "-"}</td>
                      <td className="max-w-[300px] truncate px-5 py-4 text-xs font-medium text-slate-600">{event.reason ?? event.message ?? event.providerId ?? "-"}</td>
                      <td className="max-w-[300px] truncate px-5 py-4 font-mono text-xs text-slate-500">{event.alertKey}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-5 text-sm text-slate-600">
              아직 운영 알림 이력이 없습니다. worker 실패 알림 발송 또는 throttle 생략 후 표시됩니다.
            </div>
          )}
        </CardBody>
      </Card>
            </div>
          </details>
        </div>
      </details>

      <Card id="issue-events" className="scroll-mt-6">
        <CardHeader
          title="운영 이슈 처리 상태"
          description="반복 조회 품질 이슈처럼 운영자가 후속 조치해야 하는 항목을 상태와 함께 확인합니다."
          action={<Badge tone={operationsIssueSummary.open > 0 ? "warning" : "success"}>미해결 {operationsIssueSummary.open}건</Badge>}
        />
        <CardBody className="p-0">
          <div className="grid gap-2 border-b border-slate-200 bg-slate-50 p-3 text-sm md:grid-cols-5">
            <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
              <p className="text-xs font-semibold text-slate-500">최근 이슈</p>
              <p className="mt-1 font-semibold text-slate-950">{operationsIssueSummary.total}건</p>
            </div>
            <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
              <p className="text-xs font-semibold text-slate-500">미해결</p>
              <p className="mt-1 font-semibold text-amber-700">{operationsIssueSummary.open}건</p>
            </div>
            <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
              <p className="text-xs font-semibold text-slate-500">해결</p>
              <p className="mt-1 font-semibold text-emerald-700">{operationsIssueSummary.resolved}건</p>
            </div>
            <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
              <p className="text-xs font-semibold text-slate-500">제외</p>
              <p className="mt-1 font-semibold text-slate-700">{operationsIssueSummary.ignored}건</p>
            </div>
            <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
              <p className="text-xs font-semibold text-slate-500">최근 갱신</p>
              <p className="mt-1 font-semibold text-slate-950">{operationsIssueSummary.latestIssueAt ? formatDate(operationsIssueSummary.latestIssueAt) : "-"}</p>
            </div>
          </div>
          <div className="border-b border-slate-200 bg-white p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-slate-950">운영 판단 흐름</p>
                <p className="mt-1 text-xs text-slate-500">우선 확인, 담당 분배, 목록 좁히기 순서로 처리 대상을 정합니다.</p>
              </div>
              <Badge tone={operationsIssueSummary.open > 0 ? "warning" : "success"}>
                {operationsIssueSummary.open > 0 ? "조치 필요" : "미해결 없음"}
              </Badge>
            </div>
            <div className="grid gap-2 md:grid-cols-3">
              <div className={operationsIssueTriageFocus
                ? "rounded-md border border-amber-200 bg-amber-50 px-3 py-2"
                : "rounded-md border border-emerald-100 bg-emerald-50 px-3 py-2"}
              >
                <p className={operationsIssueTriageFocus
                  ? "text-xs font-semibold text-amber-800"
                  : "text-xs font-semibold text-emerald-800"}
                >
                  1. 우선 확인
                </p>
                <p className="mt-1 break-words text-sm font-semibold text-slate-950">
                  {operationsIssueTriageFocus ? operationsIssueTriageFocus.reasonLabel : "대상 없음"}
                </p>
                <p className="mt-1 break-words text-xs leading-5 text-slate-600">
                  {operationsIssueTriageFocus
                    ? operationsIssueTriageFocus.actionLabel
                    : "현재 필터 기준 미해결 운영 이슈가 없습니다."}
                </p>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-xs font-semibold text-slate-600">2. 담당 분배</p>
                <p className="mt-1 text-sm font-semibold text-slate-950">담당 {operationsIssueOwnerSummary.length}명</p>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  차단 담당 {operationsIssueOwnerSummary.filter((item) => item.blocker > 0).length}명 · 미지정 {operationsIssueOwnerSummary.some((item) => item.assignedToLabel === "미지정") ? "있음" : "없음"}
                </p>
              </div>
              <div className="rounded-md border border-blue-100 bg-blue-50 px-3 py-2">
                <p className="text-xs font-semibold text-blue-800">3. 목록 좁히기</p>
                <p className="mt-1 text-sm font-semibold text-blue-950">
                  표시 {filteredOperationsIssueSummary.total}건
                </p>
                <p className="mt-1 text-xs leading-5 text-blue-900">
                  {hasOperationsIssueFilters ? "필터 적용 중입니다. 결과 요약과 우선 확인 카드를 먼저 확인합니다." : "빠른 필터 또는 상세 필터로 처리 대상을 좁힙니다."}
                </p>
              </div>
            </div>
          </div>
          <details className="border-b border-slate-200 bg-white" open={hasOperationsIssueFilters}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
              <span>
                <span className="block text-sm font-semibold text-slate-950">상세 목록·필터·처리</span>
                <span className="mt-1 block text-xs text-slate-500">전체 테이블, 상세 필터, 상태 처리 폼은 운영 이슈를 실제로 처리할 때만 펼칩니다.</span>
              </span>
              <Badge tone={filteredOperationsIssueSummary.total > 0 ? "neutral" : "success"}>표시 {filteredOperationsIssueSummary.total}건</Badge>
            </summary>
            <div className="border-t border-slate-200">
          {operationsIssueResolutionSummary.closed > 0 ? (
            <div className="border-b border-slate-200 bg-white p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-950">처리 결과 요약</p>
                  <p className="mt-1 text-xs text-slate-500">해결·제외된 운영 이슈의 처리 속도와 최근 처리 시각을 확인합니다.</p>
                </div>
                <Badge tone="success">닫힘 {operationsIssueResolutionSummary.closed}건</Badge>
              </div>
              <div className="grid gap-2 md:grid-cols-4">
                <div className="rounded-md border border-emerald-100 bg-emerald-50 px-3 py-2">
                  <p className="text-xs font-semibold text-emerald-800">해결</p>
                  <p className="mt-1 font-semibold text-emerald-900">{operationsIssueResolutionSummary.resolved}건</p>
                </div>
                <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="text-xs font-semibold text-slate-600">제외</p>
                  <p className="mt-1 font-semibold text-slate-900">{operationsIssueResolutionSummary.ignored}건</p>
                </div>
                <div className="rounded-md border border-blue-100 bg-blue-50 px-3 py-2">
                  <p className="text-xs font-semibold text-blue-800">평균 처리 기간</p>
                  <p className="mt-1 font-semibold text-blue-950">
                    {operationsIssueResolutionSummary.averageCloseAgeDays !== null
                      ? `${operationsIssueResolutionSummary.averageCloseAgeDays}일`
                      : "-"}
                  </p>
                </div>
                <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="text-xs font-semibold text-slate-600">최근 처리</p>
                  <p className="mt-1 font-semibold text-slate-950">
                    {operationsIssueResolutionSummary.latestClosedAt ? formatDate(operationsIssueResolutionSummary.latestClosedAt) : "-"}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
          {operationsIssueOwnerSummary.length ? (
            <div className="border-b border-slate-200 bg-white p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-950">2. 담당자별 미해결 분배</p>
                  <p className="mt-1 text-xs text-slate-500">미해결 운영 이슈를 담당자 기준으로 묶어 우선 확인 대상을 표시합니다.</p>
                </div>
                <Badge tone={operationsIssueOwnerSummary.some((item) => item.blocker > 0) ? "warning" : "neutral"}>담당 {operationsIssueOwnerSummary.length}명</Badge>
              </div>
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {operationsIssueOwnerSummary.map((owner) => {
                  const ownerFilterUrl = owner.assignedToLabel === "미지정"
                    ? "/operations/health?issueStatus=open&issueOwner=%EB%AF%B8%EC%A7%80%EC%A0%95#issue-events"
                    : `/operations/health?issueStatus=open&issueOwner=${encodeURIComponent(owner.assignedToLabel)}#issue-events`;
                  return (
                    <a
                      className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 transition hover:border-blue-200 hover:bg-blue-50"
                      href={ownerFilterUrl}
                      key={owner.assignedToLabel}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-950">{owner.assignedToLabel}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            오래 열린 이슈 {owner.oldestOpenAgeDays ?? "-"}일
                          </p>
                        </div>
                        <Badge tone={owner.blocker > 0 ? "warning" : "neutral"}>미해결 {owner.open}건</Badge>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <p className="rounded border border-white bg-white px-2 py-1 text-slate-600">
                          차단 <span className="font-semibold text-amber-700">{owner.blocker}</span>
                        </p>
                        <p className="rounded border border-white bg-white px-2 py-1 text-slate-600">
                          주의 <span className="font-semibold text-slate-950">{owner.warning}</span>
                        </p>
                        <p className="col-span-2 rounded border border-white bg-white px-2 py-1 text-slate-600">
                          최근 갱신 <span className="font-semibold text-slate-950">{owner.latestIssueAt ? formatDate(owner.latestIssueAt) : "-"}</span>
                        </p>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          ) : null}
          <div className="border-b border-slate-200 bg-white p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-slate-950">3. 빠른 필터로 목록 좁히기</p>
                <p className="mt-1 text-xs text-slate-500">운영자가 자주 보는 처리 대상을 바로 좁혀 봅니다.</p>
              </div>
              {hasOperationsIssueFilters ? (
                <a className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100" href="/operations/health#issue-events">
                  전체 보기
                </a>
              ) : null}
            </div>
            <div className="grid gap-2 md:grid-cols-5">
              {operationsIssueQuickFilterPresets.map((preset) => {
                const presetActive = operationsIssueFiltersMatch(issueFilters, preset.filters);

                return (
                  <a className={operationsIssueQuickFilterClassName(preset, presetActive)} href={operationsIssueFilterHref(preset.filters)} key={preset.id}>
                    <span className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-600">
                      <span>{preset.label}</span>
                      {presetActive ? <Badge tone="info">선택됨</Badge> : null}
                    </span>
                    <span className="mt-1 block text-lg font-semibold text-slate-950">{preset.count}건</span>
                    <span className="mt-1 block text-xs leading-5 text-slate-500">{preset.description}</span>
                    <span className="mt-2 block rounded-md border border-white/70 bg-white/70 px-2 py-1 text-xs font-semibold leading-5 text-slate-700">
                      {preset.actionLabel}
                    </span>
                  </a>
                );
              })}
            </div>
          </div>
          <form className="grid gap-3 border-b border-slate-200 bg-white p-4 text-sm lg:grid-cols-[1fr_1fr_1fr_1fr_1.5fr_auto]" action="/operations/health#issue-events">
            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 lg:col-span-6">
              <p className="text-xs font-semibold text-slate-500">4. 현재 목록 기준</p>
              {operationsIssueActiveFilterLabels.length ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {operationsIssueActiveFilterLabels.map((filter) => (
                    <span className="inline-flex items-center gap-2 rounded-md border border-blue-100 bg-white px-2 py-1 text-xs font-semibold text-blue-800" key={filter.key}>
                      <span>{filter.label}</span>
                      <a className="text-slate-500 underline-offset-2 hover:text-blue-800 hover:underline" href={operationsIssueFilterHrefWithout(issueFilters, filter.key)}>
                        해제
                      </a>
                    </span>
                  ))}
                  <a className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 underline-offset-2 hover:bg-slate-100 hover:underline" href="/operations/health#issue-events">
                    전체 초기화
                  </a>
                </div>
              ) : (
                <p className="mt-1 text-xs text-slate-600">전체 운영 이슈를 우선순위순으로 표시합니다.</p>
              )}
            </div>
            <label className="grid gap-1 text-xs font-semibold text-slate-600">
              상태
              <select
                className="rounded-md border border-slate-200 bg-white px-2 py-2 text-sm font-normal text-slate-900 outline-none transition focus:border-blue-400"
                defaultValue={issueFilters.status ?? "all"}
                name="issueStatus"
              >
                <option value="all">전체</option>
                <option value="open">미해결</option>
                <option value="resolved">해결</option>
                <option value="ignored">제외</option>
              </select>
            </label>
            <label className="grid gap-1 text-xs font-semibold text-slate-600">
              심각도
              <select
                className="rounded-md border border-slate-200 bg-white px-2 py-2 text-sm font-normal text-slate-900 outline-none transition focus:border-blue-400"
                defaultValue={issueFilters.severity ?? "all"}
                name="issueSeverity"
              >
                <option value="all">전체</option>
                <option value="blocker">차단</option>
                <option value="warning">주의</option>
                <option value="info">정보</option>
              </select>
            </label>
            <label className="grid gap-1 text-xs font-semibold text-slate-600">
              경과
              <select
                className="rounded-md border border-slate-200 bg-white px-2 py-2 text-sm font-normal text-slate-900 outline-none transition focus:border-blue-400"
                defaultValue={issueFilters.ageLevel ?? "all"}
                name="issueAge"
              >
                <option value="all">전체</option>
                <option value="stale">장기 미해결</option>
                <option value="watch">지연 확인</option>
                <option value="normal">열림</option>
              </select>
            </label>
            <label className="grid gap-1 text-xs font-semibold text-slate-600">
              담당자
              <input
                className="rounded-md border border-slate-200 bg-white px-2 py-2 text-sm font-normal text-slate-900 outline-none transition focus:border-blue-400"
                defaultValue={issueFilters.assignedToLabel ?? ""}
                name="issueOwner"
                placeholder="담당자명 또는 미지정"
              />
              <span className="text-[11px] font-normal leading-relaxed text-slate-500">
                {operationsIssueOwnerFilterHelp}
              </span>
            </label>
            <label className="grid gap-1 text-xs font-semibold text-slate-600">
              검색
              <input
                className="rounded-md border border-slate-200 bg-white px-2 py-2 text-sm font-normal text-slate-900 outline-none transition focus:border-blue-400"
                defaultValue={issueFilters.query ?? ""}
                name="issueQuery"
                placeholder="제목, 키, 조치, 메모, 처리 사유"
              />
            </label>
            <div className="flex items-end gap-2">
              <button className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-800 transition hover:bg-blue-100" type="submit">
                필터 적용
              </button>
              {hasOperationsIssueFilters ? (
                <a className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100" href="/operations/health#issue-events">
                  초기화
                </a>
              ) : null}
            </div>
            <p className="text-xs text-slate-500 lg:col-span-6">
              표시 {filteredOperationsIssueSummary.total}건 / 최근 이슈 {operationsIssueSummary.total}건 · 우선순위순
              {hasOperationsIssueFilters ? " · 필터 적용 중" : ""}
            </p>
            <div className="grid gap-2 sm:grid-cols-5 lg:col-span-6">
              {operationsIssueResultSummaryMetrics.map((metric) => (
                <div className={operationsIssueResultMetricClassName(metric.tone)} key={metric.label}>
                  <p className="text-[11px] font-semibold">{metric.label}</p>
                  <p className="mt-1 text-sm font-semibold">{metric.value}</p>
                </div>
              ))}
            </div>
            {operationsIssueTriageFocus ? (
              <div className={operationsIssueTriageFocus.tone === "warning"
                ? "rounded-md border border-amber-200 bg-amber-50 px-3 py-2 lg:col-span-6"
                : "rounded-md border border-blue-200 bg-blue-50 px-3 py-2 lg:col-span-6"}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className={operationsIssueTriageFocus.tone === "warning"
                      ? "text-xs font-semibold text-amber-800"
                      : "text-xs font-semibold text-blue-800"}
                    >
                      우선 확인 · {operationsIssueTriageFocus.reasonLabel}
                    </p>
                    <p className="mt-1 break-words text-sm font-semibold text-slate-950">
                      {operationsIssueTriageFocus.title}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-600">
                      담당 {operationsIssueTriageFocus.ownerLabel} · 반복 {operationsIssueTriageFocus.occurrenceCount}건
                      {operationsIssueTriageFocus.ageLabel ? ` · ${operationsIssueTriageFocus.ageLabel}` : ""}
                    </p>
                  </div>
                  <a
                    className="rounded-md border border-white/80 bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-800 transition hover:bg-white"
                    href={operationsIssueFilterHref(operationsIssueTriageFocus.filters)}
                  >
                    같은 기준 보기
                  </a>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-700">{operationsIssueTriageFocus.actionLabel}</p>
                <p className="mt-1 break-words font-mono text-[11px] text-slate-500">
                  {shortOperationsIssueKey(operationsIssueTriageFocus.issueKey)}
                </p>
              </div>
            ) : (
              <div className="rounded-md border border-emerald-100 bg-emerald-50 px-3 py-2 lg:col-span-6">
                <p className="text-xs font-semibold text-emerald-800">우선 확인 대상 없음</p>
                <p className="mt-1 text-xs leading-5 text-emerald-900">
                  {hasStoredOperationsIssues
                    ? "현재 목록에는 우선 처리할 미해결 이슈가 없습니다. 닫힌 이슈는 처리 근거와 상태 변경 이력 위주로 검토합니다."
                    : "아직 동기화된 운영 이슈가 없어 우선 확인 대상도 없습니다."}
                </p>
              </div>
            )}
          </form>
          {filteredOperationsIssueEvents.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-[1480px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500">
                  <tr>
                    <th className="w-[130px] px-5 py-3">상태</th>
                    <th className="w-[430px] px-5 py-3">이슈</th>
                    <th className="w-[100px] px-5 py-3">반복</th>
                    <th className="w-[180px] px-5 py-3">발생</th>
                    <th className="w-[270px] px-5 py-3">조치</th>
                    <th className="w-[320px] px-5 py-3">담당·메모</th>
                    <th className="w-[220px] px-5 py-3">키</th>
                    <th className="w-[360px] px-5 py-3">처리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOperationsIssueEvents.map((event: OperationsIssueEventItem) => {
                      const drilldown = operationsIssueDrilldowns.get(event.id);
                      const ageStatus = operationsIssueAgeStatuses.get(event.id);
                      const statusChangeSummary = getOperationsIssueStatusChangeSummary(event);
                      const isTriageFocus = operationsIssueTriageFocus?.eventId === event.id;

                      return (
                        <tr
                          key={event.id}
                          className={isTriageFocus
                            ? "border-l-4 border-amber-400 bg-amber-100/70"
                            : event.status === "open"
                              ? "bg-amber-50/45"
                              : undefined}
                        >
                          <td className="px-5 py-4 align-top">
                            <div className="grid gap-2">
                              <Badge tone={operationsIssueStatusTone(event.status)}>{operationsIssueStatusLabel(event.status)}</Badge>
                              {isTriageFocus ? (
                                <Badge tone="warning">우선 확인</Badge>
                              ) : null}
                              <span className="rounded-md border border-slate-200 bg-white/80 px-2 py-1 text-xs font-semibold text-slate-600">
                                {operationsIssueSeverityLabel(event.severity)}
                              </span>
                              {ageStatus ? (
                                <Badge tone={operationsIssueAgeTone(ageStatus.level)}>{ageStatus.label}</Badge>
                              ) : null}
                            </div>
                          </td>
                          <td className="max-w-[430px] px-5 py-4 align-top">
                            {isTriageFocus ? (
                              <p className="mb-2 break-words rounded-md border border-amber-200 bg-white/80 px-2 py-1 text-xs font-semibold text-amber-900">
                                상단 우선 확인 대상 · {operationsIssueTriageFocus.reasonLabel}
                              </p>
                            ) : null}
                            <p className="break-words font-semibold text-slate-950">{event.title}</p>
                            <p className="mt-1 break-words text-xs leading-5 text-slate-600">{event.summary}</p>
                            {drilldown ? (
                              <div className="mt-3 rounded-md border border-amber-200 bg-white px-3 py-2 text-xs leading-5 text-slate-600">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <p className="font-semibold text-amber-900">원인 드릴다운</p>
                                  <Badge tone="warning">관련 로그 {drilldown.relatedEventCount}건</Badge>
                                </div>
                                  <p className="mt-2 break-words">
                                  진단: {drilldown.diagnoses.join(", ")}
                                  <br />
                                  경로: {drilldown.routes.join(", ")}
                                </p>
                                <div className="mt-2 grid gap-1">
                                  {drilldown.samples.map((sample) => (
                                    <p className="break-words rounded border border-slate-100 bg-slate-50 px-2 py-1" key={sample.id}>
                                      {formatDate(sample.createdAt)} · {sample.diagnosis} · 결과 {sample.resultCount ?? "-"}건 · AI {sample.normalizationCandidateCount ?? "-"} / 공식 {sample.officialCandidateCount ?? "-"} / HS6 {sample.finalHs6Count ?? "-"} / 10자리 {sample.finalHsk10Count ?? "-"}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            ) : null}
                          </td>
                          <td className="px-5 py-4 align-top text-slate-700">
                            <div className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-center">
                              <p className="text-[11px] font-semibold text-slate-500">반복 발생</p>
                              <p className="mt-1 whitespace-nowrap text-sm font-semibold text-slate-950">{event.occurrenceCount}건</p>
                            </div>
                          </td>
                          <td className="px-5 py-4 align-top text-xs leading-5 text-slate-600">
                            <div className="grid gap-2">
                              <div className="rounded-md border border-slate-200 bg-white px-2 py-1.5">
                                <p className="font-semibold text-slate-500">최초</p>
                                <p className="mt-0.5 whitespace-nowrap text-slate-800">{formatDate(event.firstSeenAt)}</p>
                              </div>
                              <div className="rounded-md border border-slate-200 bg-white px-2 py-1.5">
                                <p className="font-semibold text-slate-500">최근</p>
                                <p className="mt-0.5 whitespace-nowrap text-slate-800">{formatDate(event.lastSeenAt)}</p>
                              </div>
                            </div>
                          </td>
                          <td className="max-w-[270px] px-5 py-4 align-top text-xs leading-5 text-slate-600">
                            <div className="rounded-md border border-slate-200 bg-white px-2 py-1.5">
                              <p className="font-semibold text-slate-500">다음 조치</p>
                              <p className="mt-0.5 break-words text-slate-700">{event.action}</p>
                            </div>
                          </td>
                          <td className="max-w-[320px] px-5 py-4 align-top text-xs leading-5 text-slate-600">
                            <div className="grid min-w-0 gap-2">
                              <div className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5">
                                <p className="font-semibold text-slate-500">담당자</p>
                                <p className="mt-0.5 break-words text-slate-900">{operationsIssueDisplayValue(event.assignedToLabel)}</p>
                              </div>
                              <div className="rounded-md border border-slate-200 bg-white px-2 py-1.5">
                                <p className="font-semibold text-slate-500">메모</p>
                                <p className="mt-0.5 break-words text-slate-700">{operationsIssueDisplayValue(event.operatorNote)}</p>
                              </div>
                              <div className="rounded-md border border-slate-200 bg-white px-2 py-1.5">
                                <p className="font-semibold text-slate-500">처리 사유</p>
                                <p className="mt-0.5 break-words text-slate-700">{operationsIssueDisplayValue(event.resolutionReason)}</p>
                              </div>
                            </div>
                            {statusChangeSummary ? (
                              <p className="mt-2 break-words rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-slate-500">
                                <span className="font-semibold text-slate-700">{statusChangeSummary.changeLabel}</span>
                                <br />
                                {formatDate(statusChangeSummary.changedAt)}
                                <br />
                                {statusChangeSummary.changedByLabel}
                              </p>
                            ) : (
                              <p className="mt-1 text-slate-500">상태 변경 이력 없음</p>
                            )}
                          </td>
                          <td className="max-w-[220px] px-5 py-4 align-top font-mono text-xs text-slate-500">
                            <span className="block break-all rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5" title={event.issueKey}>
                              {shortOperationsIssueKey(event.issueKey)}
                            </span>
                          </td>
                          <td className="px-5 py-4 align-top">
                            <OperationsIssueStatusForm
                              event={event}
                              triageFocus={isTriageFocus && operationsIssueTriageFocus
                                ? {
                                    reasonLabel: operationsIssueTriageFocus.reasonLabel,
                                    actionLabel: operationsIssueTriageFocus.actionLabel
                                  }
                                : null}
                            />
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid gap-3 p-5 text-sm text-slate-600">
              {hasOperationsIssueFilters ? (
                <>
                  <div className="rounded-md border border-blue-100 bg-blue-50 px-3 py-2">
                    <p className="font-semibold text-blue-950">필터 결과 0건</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {hasOpenOperationsIssues
                        ? "전체 미해결 이슈는 남아 있습니다. 조건을 일부 해제하거나 미해결 전체 보기로 우선순위순 목록을 다시 확인합니다."
                        : "전체 기준 미해결 이슈도 없습니다. 조건을 초기화해 해결·제외 이슈의 처리 근거를 확인합니다."}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <a className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-800 transition hover:bg-blue-100" href="/operations/health#issue-events">
                      전체 초기화
                    </a>
                    {hasOpenOperationsIssues ? (
                      <a className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 transition hover:bg-amber-100" href="/operations/health?issueStatus=open#issue-events">
                        미해결 전체 보기
                      </a>
                    ) : null}
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-md border border-emerald-100 bg-emerald-50 px-3 py-2">
                    <p className="font-semibold text-emerald-900">저장된 운영 이슈 0건</p>
                    <p className="mt-1 text-xs leading-5 text-emerald-900">
                      반복 조회 품질 이슈가 아직 동기화되지 않았습니다. 운영 이슈 동기화 job이 새 반복 이슈를 감지하면 이 목록에 표시됩니다.
                    </p>
                  </div>
                  <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
                    수동 확인이 필요하면 운영 명령 `vercel env run -e production -- npm run ops:job:operations-issues`를 실행한 뒤 이 화면을 다시 확인합니다.
                  </div>
                  <div>
                    <a className="inline-flex rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-800 transition hover:bg-blue-100" href="#manual-commands">
                      운영 이슈 동기화 명령 보기
                    </a>
                  </div>
                </>
              )}
            </div>
          )}
            </div>
          </details>
        </CardBody>
      </Card>

      <details id="lookup-quality" className="scroll-mt-6 rounded-lg border border-slate-200 bg-white shadow-sm" open={lookupIssueCount > 0}>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4">
          <span>
            <span className="block text-base font-semibold text-slate-950">조회 품질 로그</span>
            <span className="mt-1 block text-sm text-slate-500">
              점검 대상이 있을 때만 자동으로 펼칩니다. 정상 로그와 원시 telemetry 표는 필요할 때 확인합니다.
            </span>
          </span>
          <Badge tone={lookupIssueCount > 0 ? "warning" : "success"}>점검 대상 {lookupIssueCount}건</Badge>
        </summary>
        <div className="border-t border-slate-200 bg-slate-50/45 p-4">
          <Card>
            <CardHeader
              title="최근 조회 품질 로그"
              description="품명 AI 검색과 후보 생성의 실패·무결과·fallback 흐름을 원문 없이 확인합니다. 원문 품명, 이메일, 문서 내용은 저장하지 않습니다."
              action={<Badge tone={lookupIssueCount > 0 ? "warning" : "success"}>점검 대상 {lookupIssueCount}건</Badge>}
            />
            <CardBody className="p-0">
          {lookupTelemetryEvents.length ? (
            <>
              <div className="grid gap-2 border-b border-slate-200 bg-slate-50 p-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
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
                <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2">
                  <p className="text-xs font-semibold text-blue-800">무결과 단기 캐시 대상</p>
                  <p className="mt-1 font-semibold text-blue-950">{productRecommendationCacheImpact.empty}건</p>
                  <p className="mt-1 text-xs leading-5 text-blue-900">
                    평균 {formatMs(productRecommendationCacheImpact.averageEmptyDurationMs)} · GPT 실패 {productRecommendationCacheImpact.gptFailedEmpty}건
                  </p>
                </div>
              </div>
              {recurringLookupIssues.length ? (
                <div className="border-b border-amber-200 bg-amber-50 p-3">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-amber-900">반복 이슈 개선 큐 후보</p>
                      <p className="mt-1 text-xs text-amber-800">최근 로그에서 같은 분류가 3회 이상 반복된 항목입니다.</p>
                    </div>
                    <Badge tone="warning">{recurringLookupIssues.length}개 분류</Badge>
                  </div>
                  <div className="grid gap-2 lg:grid-cols-2">
                    {recurringLookupIssues.map((issue) => (
                      <div className="rounded-md border border-amber-200 bg-white px-3 py-3 text-sm" key={issue.key}>
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-slate-950">{issue.label}</p>
                            <p className="mt-1 text-xs text-slate-500">최근 발생 {formatDate(issue.latestAt)}</p>
                          </div>
                          <Badge tone="warning">{issue.issueCount}건</Badge>
                        </div>
                        <p className="mt-2 text-xs leading-5 text-slate-600">
                          진단: {issue.diagnoses.join(", ")}
                          <br />
                          경로: {issue.routes.join(", ")}
                        </p>
                        <p className="mt-2 text-xs leading-5 text-amber-900">{issue.action}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              {lookupBucketSummary.length ? (
                <div className="border-b border-slate-200 bg-white p-3">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-500">빠른 분류</p>
                    <p className="text-xs text-slate-500">최근 {lookupTelemetryEvents.length}건 기준</p>
                  </div>
                  <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-5">
                    {lookupBucketSummary.map((summary) => (
                      <div
                        className={summary.issueCount > 0 ? "rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm" : "rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm"}
                        key={summary.key}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-slate-950">{summary.label}</p>
                          <Badge tone={summary.tone}>{summary.count}건</Badge>
                        </div>
                        <p className="mt-1 text-xs leading-5 text-slate-600">{summary.action}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              {hsDirectSourceSummary.length ? (
                <div className="border-b border-slate-200 bg-white p-3">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-500">HS 직접조회 source 경로</p>
                    <p className="text-xs text-slate-500">최근 `hs_direct_lookup_resolved` 이벤트 기준</p>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                    {hsDirectSourceSummary.map((summary) => (
                      <div
                        className={summary.fallback > 0 || summary.failed > 0 ? "rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm" : "rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm"}
                        key={summary.sourceMode}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-slate-950">{summary.label}</p>
                          <Badge tone={summary.fallback > 0 || summary.failed > 0 ? "warning" : "success"}>{summary.share}</Badge>
                        </div>
                        <p className="mt-1 text-xs leading-5 text-slate-600">
                          전체 {summary.total} · fallback {summary.fallback} · 실패 {summary.failed}
                          <br />
                          평균 {formatMs(summary.averageDurationMs)} · 최대 {formatMs(summary.maxDurationMs)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              {priorityLookupEvents.length ? (
                <div className="border-b border-slate-200 bg-amber-50/40 p-3">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-amber-900">우선 점검 로그</p>
                    <Badge tone="warning">최근 이슈 {priorityLookupEvents.length}건</Badge>
                  </div>
                  <div className="grid gap-2 lg:grid-cols-2">
                    {priorityLookupEvents.map((event) => {
                      const bucket = classifyLookupTelemetryBucket(event);
                      const diagnosis = classifyLookupTelemetryIssue(event);
                      const counts = formatCandidateCounts(event);

                      return (
                        <div className="rounded-md border border-amber-200 bg-white px-3 py-3 text-sm" key={event.id}>
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold text-slate-950">{diagnosis}</p>
                              <p className="mt-1 font-mono text-xs text-slate-500">{formatDate(event.createdAt)} · {event.route ?? event.eventType}</p>
                            </div>
                            <Badge tone={bucket.tone}>{bucket.label}</Badge>
                          </div>
                          <p className="mt-2 text-xs leading-5 text-slate-600">
                            상태 {telemetryStatusLabel(event.status)} · 결과 {event.resultCount ?? payloadValue(event.payload, "candidateCount")}건 · 처리 {event.durationMs ?? payloadValue(event.payload, "durationMs")}ms
                            <br />
                            AI {payloadValue(event.payload, "normalizationCandidateCount")} · 공식 {payloadValue(event.payload, "officialCandidateCount")} · HS6 {counts.finalHs6} · 10자리 {counts.finalHsk10}
                          </p>
                          <p className="mt-2 text-xs leading-5 text-amber-900">{bucket.action}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : normalLookupSamples.length ? (
                <div className="border-b border-slate-200 bg-emerald-50/40 p-3">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-emerald-900">정상 로그 샘플</p>
                    <Badge tone="success">최근 정상 {normalLookupSamples.length}건</Badge>
                  </div>
                  <div className="grid gap-2 lg:grid-cols-3">
                    {normalLookupSamples.map((event) => (
                      <div className="rounded-md border border-emerald-200 bg-white px-3 py-2 text-xs leading-5 text-slate-600" key={event.id}>
                        <p className="font-semibold text-slate-950">{eventLabel(event.eventType)}</p>
                        <p className="font-mono text-slate-500">{formatDate(event.createdAt)} · {event.route ?? "-"}</p>
                        <p>결과 {event.resultCount ?? payloadValue(event.payload, "candidateCount")}건 · 처리 {event.durationMs ?? payloadValue(event.payload, "durationMs")}ms</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
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
              <details className="border-b border-slate-200 bg-white">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
                  <span>
                    <span className="block text-sm font-semibold text-slate-950">일자·경로·원시 로그</span>
                    <span className="mt-1 block text-xs text-slate-500">상세 통계와 전체 telemetry 표는 지연 원인을 추적할 때만 펼칩니다.</span>
                  </span>
                  <Badge tone="neutral">로그 {lookupTelemetryEvents.length}건</Badge>
                </summary>
                <div className="border-t border-slate-200">
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
              {lookupRouteSummary.length ? (
                <div className="border-b border-slate-200 bg-white p-3">
                  <p className="mb-2 text-xs font-semibold text-slate-500">경로별 실패율·응답시간</p>
                  <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                    {lookupRouteSummary.map((summary) => (
                      <div className="rounded-md border border-slate-200 px-3 py-2 text-sm" key={summary.route}>
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-mono text-xs font-semibold text-slate-800">{summary.route}</p>
                          <Badge tone={summary.issues > 0 ? "warning" : "success"}>{summary.failureRate}</Badge>
                        </div>
                        <p className="mt-2 text-xs leading-5 text-slate-600">
                          전체 {summary.total} · 점검 {summary.issues}
                          <br />
                          평균 {formatMs(summary.averageDurationMs)} · 최대 {formatMs(summary.maxDurationMs)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="overflow-x-auto">
                <table className="min-w-[1420px] text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500">
                    <tr>
                      <th className="px-5 py-3">시간</th>
                      <th className="px-5 py-3">이벤트</th>
                      <th className="px-5 py-3">상태</th>
                      <th className="px-5 py-3">분류</th>
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
                      const bucket = classifyLookupTelemetryBucket(event);
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
                            <p className="mt-1 font-mono text-xs text-slate-500">{sourceModeLabel(event.sourceMode ?? payloadString(event.payload, "provider"))}</p>
                          </td>
                          <td className="px-5 py-4">
                            <Badge tone={eventTone(event)}>{telemetryStatusLabel(event.status)}</Badge>
                          </td>
                          <td className="px-5 py-4">
                            <Badge tone={bucket.tone}>{bucket.label}</Badge>
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
                </div>
              </details>
            </>
          ) : (
            <div className="p-5 text-sm text-slate-600">
              저장된 조회 품질 로그가 없습니다. 운영에서 `LOOKUP_TELEMETRY_ENABLED=true`와 `SUPABASE_SERVICE_ROLE_KEY`가 설정되어야 기록됩니다.
            </div>
          )}
            </CardBody>
          </Card>
        </div>
      </details>

      {groups.map((group) => (
        <details className="rounded-lg border border-slate-200 bg-white shadow-sm" key={group.title}>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4">
            <span>
              <span className="block font-semibold text-slate-950">{group.title}</span>
              <span className="mt-1 block text-sm text-slate-500">{group.description}</span>
            </span>
            <Badge tone={group.items.some((item) => item.status === "missing") ? "warning" : "neutral"}>{group.items.length}개 항목</Badge>
          </summary>
          <div className="overflow-x-auto border-t border-slate-200">
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
        </details>
      ))}
    </div>
  );
}
