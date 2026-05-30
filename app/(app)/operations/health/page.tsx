import { AccessDenied } from "@/components/access-denied";
import { PageHeading } from "@/components/page-heading";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { requireDeveloperRole } from "@/server/auth/role-guard";
import { updateOperationsIssueStatusAction } from "@/server/actions/operations-issue.actions";
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
  listRecentOperationsIssueEvents,
  summarizeOpenOperationsIssuesByOwner,
  summarizeOperationsIssueEvents,
  type OperationsIssueEventItem,
  type OperationsIssueEventFilters,
  type OperationsIssueSeverity,
  type OperationsIssueStatus
} from "@/server/repositories/operations-issue.repository";
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
    purpose: "대기 중인 document_extraction, hs_batch_lookup 백그라운드 작업을 즉시 처리합니다.",
    expected: "claimed, outcomes, alert 결과가 JSON으로 표시됩니다."
  },
  {
    label: "worker 실패 알림 리허설",
    command: "vercel env run -e production -- npm run ops:job:background-failure-rehearsal",
    purpose: "임시 실패 job으로 실패 처리, run 이력, 운영 메일 알림 경로를 검증합니다.",
    expected: "alert.sent가 true이고 임시 job은 스크립트가 삭제합니다."
  },
  {
    label: "운영 이력 정리",
    command: "vercel env run -e production -- npm run ops:job:operations-retention",
    purpose: "운영 알림 이력, worker 실행 이력, 완료된 background job 이력을 보존 기간 기준으로 정리합니다.",
    expected: "deletedCount, deletedRuns, deletedJobs가 JSON으로 표시됩니다."
  },
  {
    label: "운영 이슈 동기화",
    command: "vercel env run -e production -- npm run ops:job:operations-issues",
    purpose: "반복 조회 품질 이슈를 operations issue로 저장해 처리 상태를 추적합니다.",
    expected: "scannedEvents, recurringIssues, syncedIssues가 JSON으로 표시됩니다."
  },
  {
    label: "운영 이슈 리허설",
    command: "vercel env run -e production -- npm run ops:job:operations-issues-rehearsal",
    purpose: "원문 없는 synthetic telemetry로 반복 이슈 생성, 상태 변경, cleanup 경로를 검증합니다.",
    expected: "ok가 true이고 cleanupOk 값들이 true로 표시됩니다."
  },
  {
    label: "운영 스키마 점검",
    command: "vercel env run -e production -- npm run health:db",
    purpose: "현재 migration 파일 기준으로 production Supabase schema drift를 확인합니다.",
    expected: "Issues 0 blocker, 0 warning이면 정상입니다."
  },
  {
    label: "production smoke",
    command: "SMOKE_BASE_URL=https://hsfinder.co.kr npm run smoke:production",
    purpose: "로그인 보호와 주요 route 응답 상태를 빠르게 확인합니다.",
    expected: "summary total=10 success=10 failed=0이면 정상입니다."
  }
];

const operationsSectionLinks = [
  {
    href: "#manual-commands",
    label: "수동 명령",
    detail: "장애 대응·검증 명령"
  },
  {
    href: "#integrations",
    label: "외부 연동",
    detail: "환경변수·호출 경로"
  },
  {
    href: "#schema-health",
    label: "DB 스키마",
    detail: "migration drift"
  },
  {
    href: "#retention-health",
    label: "보존 상태",
    detail: "정리 후보"
  },
  {
    href: "#background-jobs",
    label: "작업 큐",
    detail: "대기·실패 job"
  },
  {
    href: "#worker-runs",
    label: "worker 실행",
    detail: "cron 실행 이력"
  },
  {
    href: "#alert-events",
    label: "운영 알림",
    detail: "발송·생략·실패"
  },
  {
    href: "#issue-events",
    label: "운영 이슈",
    detail: "반복 이슈·처리 상태"
  },
  {
    href: "#lookup-quality",
    label: "조회 품질",
    detail: "무결과·fallback"
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

function searchParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseOperationsIssueFilters(params: {
  issueStatus?: string | string[];
  issueSeverity?: string | string[];
  issueOwner?: string | string[];
  issueQuery?: string | string[];
}): OperationsIssueEventFilters {
  const rawStatus = searchParamValue(params.issueStatus);
  const rawSeverity = searchParamValue(params.issueSeverity);

  return {
    status: rawStatus === "open" || rawStatus === "resolved" || rawStatus === "ignored" ? rawStatus : "all",
    severity: rawSeverity === "info" || rawSeverity === "warning" || rawSeverity === "blocker" ? rawSeverity : "all",
    assignedToLabel: searchParamValue(params.issueOwner)?.trim() ?? "",
    query: searchParamValue(params.issueQuery)?.trim() ?? ""
  };
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

export default async function OperationsHealthPage({
  searchParams
}: {
  searchParams?: Promise<{
    issueStatus?: string | string[];
    issueSeverity?: string | string[];
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
  const [lookupTelemetryEvents, backgroundJobs, backgroundJobRuns, operationsAlertEvents, operationsIssueEvents, operationsRetentionStatus, schemaHealthReport] = await Promise.all([
    loadLookupTelemetryEvents(),
    loadBackgroundJobOperations(),
    loadBackgroundJobRuns(),
    loadOperationsAlertEvents(),
    loadOperationsIssueEvents(),
    loadOperationsRetentionStatus(),
    getProductionSchemaHealthReport()
  ]);
  const lookupIssueCount = lookupTelemetryEvents.filter(isLookupTelemetryIssue).length;
  const lookupSuccessCount = lookupTelemetryEvents.length - lookupIssueCount;
  const zeroResultCount = lookupTelemetryEvents.filter((event) => event.resultCount === 0).length;
  const lookupDiagnosisSummary = summarizeLookupTelemetryDiagnostics(lookupTelemetryEvents);
  const lookupBucketSummary = summarizeLookupTelemetryBuckets(lookupTelemetryEvents);
  const lookupIssueSummary = lookupDiagnosisSummary.filter((item) => item.issueCount > 0).slice(0, 4);
  const lookupDailySummary = summarizeLookupTelemetryByDay(lookupTelemetryEvents);
  const lookupRouteSummary = summarizeLookupTelemetryByRoute(lookupTelemetryEvents);
  const recurringLookupIssues = summarizeRecurringLookupTelemetryIssues(lookupTelemetryEvents, 3);
  const priorityLookupEvents = lookupTelemetryEvents.filter(isLookupTelemetryIssue).slice(0, 8);
  const normalLookupSamples = lookupTelemetryEvents.filter((event) => !isLookupTelemetryIssue(event)).slice(0, 3);
  const backgroundJobSummary = summarizeBackgroundJobOperations(backgroundJobs);
  const backgroundJobRunSummary = summarizeBackgroundJobRuns(backgroundJobRuns);
  const operationsAlertSummary = summarizeOperationsAlertEvents(operationsAlertEvents);
  const filteredOperationsIssueEvents = filterOperationsIssueEvents(operationsIssueEvents, issueFilters);
  const operationsIssueSummary = summarizeOperationsIssueEvents(operationsIssueEvents);
  const filteredOperationsIssueSummary = summarizeOperationsIssueEvents(filteredOperationsIssueEvents);
  const operationsIssueOwnerSummary = summarizeOpenOperationsIssuesByOwner(operationsIssueEvents).slice(0, 6);
  const operationsIssueDrilldowns = new Map(operationsIssueEvents.map((issue) => [
    issue.id,
    buildOperationsIssueLookupDrilldown(issue, lookupTelemetryEvents)
  ]));
  const hasOperationsIssueFilters = Boolean(
    (issueFilters.status && issueFilters.status !== "all")
      || (issueFilters.severity && issueFilters.severity !== "all")
      || issueFilters.assignedToLabel
      || issueFilters.query
  );
  const totalRetentionCandidates = operationsRetentionStatus
    ? operationsRetentionStatus.operationsAlertEvents.pruneCandidateCount
      + operationsRetentionStatus.backgroundJobHistory.runPruneCandidateCount
      + operationsRetentionStatus.backgroundJobHistory.jobPruneCandidateCount
      + operationsRetentionStatus.operationsIssueEvents.pruneCandidateCount
    : 0;
  const items = groups.flatMap((group) => group.items);
  const missingRequiredCount = items.filter((item) => item.status === "missing").length;
  const configuredCount = items.filter((item) => item.status === "ok").length;
  const schemaStatusTone = schemaHealthReport.status === "ok" ? "success" : "warning";
  const schemaStatusLabel = schemaHealthReport.status === "ok" ? "정상" : schemaHealthReport.status === "warn" ? "주의" : "차단";
  const operationalSummary = [
    {
      label: "배포 설정",
      value: missingRequiredCount > 0 ? `${missingRequiredCount}건 확인` : "준비됨",
      detail: `설정됨 ${configuredCount}건`,
      tone: missingRequiredCount > 0 ? "warning" : "success"
    },
    {
      label: "DB 스키마",
      value: schemaStatusLabel,
      detail: `차단 ${schemaHealthReport.summary.blockerCount} / 주의 ${schemaHealthReport.summary.warnCount}`,
      tone: schemaStatusTone
    },
    {
      label: "worker",
      value: backgroundJobRunSummary.latestStatus ? backgroundJobRunStatusLabel(backgroundJobRunSummary.latestStatus) : "-",
      detail: `작업 실패 ${backgroundJobRunSummary.failedJobs}건`,
      tone: backgroundJobRunSummary.failedJobs > 0 || backgroundJobRunSummary.latestStatus === "failed" ? "warning" : "success"
    },
    {
      label: "작업 큐",
      value: `${backgroundJobSummary.queued + backgroundJobSummary.running}건 진행`,
      detail: `최종 실패 ${backgroundJobSummary.dead}건`,
      tone: backgroundJobSummary.dead > 0 || backgroundJobSummary.failed > 0 ? "warning" : "success"
    },
    {
      label: "운영 알림",
      value: operationsAlertSummary.latestStatus ? operationsAlertStatusLabel(operationsAlertSummary.latestStatus) : "-",
      detail: `발송 실패 ${operationsAlertSummary.failed}건`,
      tone: operationsAlertSummary.failed > 0 ? "warning" : "success"
    },
    {
      label: "운영 이슈",
      value: `${operationsIssueSummary.open}건 미해결`,
      detail: `차단 ${operationsIssueSummary.blocker} / 주의 ${operationsIssueSummary.warning}`,
      tone: operationsIssueSummary.open > 0 ? "warning" : "success"
    },
    {
      label: "정리 후보",
      value: `${totalRetentionCandidates}건`,
      detail: operationsRetentionStatus ? `최근 확인 ${formatDate(operationsRetentionStatus.checkedAt)}` : "상태 미확인",
      tone: totalRetentionCandidates > 0 || !operationsRetentionStatus ? "warning" : "success"
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

  return (
    <div className="grid gap-5">
      <PageHeading
        title="운영 점검"
        description="배포 환경에서 필요한 연결값과 운영 보호 설정을 확인합니다. 키 원문은 표시하지 않습니다."
      />

      <Card>
        <CardHeader
          title="핵심 운영 요약"
          description="배포 설정, 스키마, worker, 알림, 보존 정책, 조회 품질을 한 번에 확인합니다."
          action={<Badge tone={operationalSummary.some((item) => item.tone === "warning") ? "warning" : "success"}>점검 {operationalSummary.filter((item) => item.tone === "warning").length}건</Badge>}
        />
        <CardBody>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
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
          title="상세 점검 바로가기"
          description="요약에서 확인이 필요한 항목을 발견하면 해당 상세 섹션으로 바로 이동합니다."
        />
        <CardBody>
          <nav className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4" aria-label="운영 상세 섹션">
            {operationsSectionLinks.map((item) => (
              <a
                className="rounded-md border border-slate-200 bg-white px-3 py-3 text-sm transition hover:border-blue-200 hover:bg-blue-50"
                href={item.href}
                key={item.href}
              >
                <span className="font-semibold text-slate-950">{item.label}</span>
                <span className="mt-1 block text-xs text-slate-500">{item.detail}</span>
              </a>
            ))}
          </nav>
        </CardBody>
      </Card>

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
                <pre className="mt-3 overflow-x-auto rounded-md bg-slate-950 px-3 py-2 text-xs leading-5 text-slate-50">
                  <code>{item.command}</code>
                </pre>
                <p className="mt-3 text-xs leading-5 text-slate-500">예상 결과: {item.expected}</p>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

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
          {operationsIssueOwnerSummary.length ? (
            <div className="border-b border-slate-200 bg-white p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-950">담당자별 미해결 요약</p>
                  <p className="mt-1 text-xs text-slate-500">미해결 운영 이슈를 담당자 기준으로 묶어 우선 확인 대상을 표시합니다.</p>
                </div>
                <Badge tone={operationsIssueOwnerSummary.some((item) => item.blocker > 0) ? "warning" : "neutral"}>담당 {operationsIssueOwnerSummary.length}명</Badge>
              </div>
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {operationsIssueOwnerSummary.map((owner) => {
                  const ownerFilterUrl = owner.assignedToLabel === "미지정"
                    ? "/operations/health?issueStatus=open#issue-events"
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
          <form className="grid gap-3 border-b border-slate-200 bg-white p-4 text-sm lg:grid-cols-[1fr_1fr_1fr_1.5fr_auto]" action="/operations/health#issue-events">
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
              담당자
              <input
                className="rounded-md border border-slate-200 bg-white px-2 py-2 text-sm font-normal text-slate-900 outline-none transition focus:border-blue-400"
                defaultValue={issueFilters.assignedToLabel ?? ""}
                name="issueOwner"
                placeholder="담당자명"
              />
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
            <p className="text-xs text-slate-500 lg:col-span-5">
              표시 {filteredOperationsIssueSummary.total}건 / 최근 이슈 {operationsIssueSummary.total}건
              {hasOperationsIssueFilters ? " · 필터 적용 중" : ""}
            </p>
          </form>
          {filteredOperationsIssueEvents.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-[1480px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500">
                  <tr>
                    <th className="px-5 py-3">상태</th>
                    <th className="px-5 py-3">이슈</th>
                    <th className="px-5 py-3">반복</th>
                    <th className="px-5 py-3">발생</th>
                    <th className="px-5 py-3">조치</th>
                    <th className="px-5 py-3">담당·메모</th>
                    <th className="px-5 py-3">키</th>
                    <th className="px-5 py-3">처리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOperationsIssueEvents.map((event: OperationsIssueEventItem) => {
                      const drilldown = operationsIssueDrilldowns.get(event.id);

                      return (
                        <tr key={event.id} className={event.status === "open" ? "bg-amber-50/45" : undefined}>
                          <td className="px-5 py-4">
                            <Badge tone={operationsIssueStatusTone(event.status)}>{operationsIssueStatusLabel(event.status)}</Badge>
                            <p className="mt-2 text-xs font-semibold text-slate-500">{operationsIssueSeverityLabel(event.severity)}</p>
                          </td>
                          <td className="px-5 py-4">
                            <p className="font-semibold text-slate-950">{event.title}</p>
                            <p className="mt-1 text-xs leading-5 text-slate-600">{event.summary}</p>
                            {drilldown ? (
                              <div className="mt-3 rounded-md border border-amber-200 bg-white px-3 py-2 text-xs leading-5 text-slate-600">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <p className="font-semibold text-amber-900">원인 드릴다운</p>
                                  <Badge tone="warning">관련 로그 {drilldown.relatedEventCount}건</Badge>
                                </div>
                                <p className="mt-2">
                                  진단: {drilldown.diagnoses.join(", ")}
                                  <br />
                                  경로: {drilldown.routes.join(", ")}
                                </p>
                                <div className="mt-2 grid gap-1">
                                  {drilldown.samples.map((sample) => (
                                    <p className="rounded border border-slate-100 bg-slate-50 px-2 py-1" key={sample.id}>
                                      {formatDate(sample.createdAt)} · {sample.diagnosis} · 결과 {sample.resultCount ?? "-"}건 · AI {sample.normalizationCandidateCount ?? "-"} / 공식 {sample.officialCandidateCount ?? "-"} / HS6 {sample.finalHs6Count ?? "-"} / 10자리 {sample.finalHsk10Count ?? "-"}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            ) : null}
                          </td>
                          <td className="whitespace-nowrap px-5 py-4 text-slate-700">
                            <span className="font-semibold text-slate-950">{event.occurrenceCount}</span>
                            <span className="ml-1 text-xs text-slate-500">건</span>
                          </td>
                          <td className="whitespace-nowrap px-5 py-4 text-xs leading-5 text-slate-600">
                            최초 {formatDate(event.firstSeenAt)}
                            <br />
                            최근 {formatDate(event.lastSeenAt)}
                          </td>
                          <td className="max-w-[320px] px-5 py-4 text-xs leading-5 text-slate-600">{event.action}</td>
                          <td className="max-w-[320px] px-5 py-4 text-xs leading-5 text-slate-600">
                            <p>
                              <span className="font-semibold text-slate-500">담당자</span>
                              <span className="ml-2 text-slate-900">{event.assignedToLabel || "-"}</span>
                            </p>
                            <p className="mt-1">
                              <span className="font-semibold text-slate-500">메모</span>
                              <span className="ml-2 text-slate-700">{event.operatorNote || "-"}</span>
                            </p>
                            <p className="mt-1">
                              <span className="font-semibold text-slate-500">처리 사유</span>
                              <span className="ml-2 text-slate-700">{event.resolutionReason || "-"}</span>
                            </p>
                            <p className="mt-1 text-slate-500">
                              상태 변경 {event.statusUpdatedAt ? formatDate(event.statusUpdatedAt) : "-"}
                            </p>
                          </td>
                          <td className="max-w-[280px] truncate px-5 py-4 font-mono text-xs text-slate-500">{event.issueKey}</td>
                          <td className="px-5 py-4">
                            <form action={updateOperationsIssueStatusAction} className="grid min-w-[260px] gap-2">
                              <input name="issueId" type="hidden" value={event.id} />
                              <label className="grid gap-1 text-xs font-semibold text-slate-600">
                                담당자
                                <input
                                  className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-normal text-slate-900 outline-none transition focus:border-blue-400"
                                  defaultValue={event.assignedToLabel ?? ""}
                                  maxLength={120}
                                  name="assignedToLabel"
                                  placeholder="예: 운영 담당자"
                                />
                              </label>
                              <label className="grid gap-1 text-xs font-semibold text-slate-600">
                                메모
                                <textarea
                                  className="min-h-16 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-normal text-slate-900 outline-none transition focus:border-blue-400"
                                  defaultValue={event.operatorNote ?? ""}
                                  maxLength={1000}
                                  name="operatorNote"
                                  placeholder="확인한 원인 또는 후속 작업"
                                />
                              </label>
                              <label className="grid gap-1 text-xs font-semibold text-slate-600">
                                처리 사유
                                <textarea
                                  className="min-h-14 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-normal text-slate-900 outline-none transition focus:border-blue-400"
                                  defaultValue={event.resolutionReason ?? ""}
                                  maxLength={1000}
                                  name="resolutionReason"
                                  placeholder="해결·제외·재오픈 판단 근거"
                                />
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {event.status !== "resolved" ? (
                                  <button
                                    className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100"
                                    name="status"
                                    type="submit"
                                    value="resolved"
                                  >
                                    해결
                                  </button>
                                ) : null}
                                {event.status !== "ignored" ? (
                                  <button
                                    className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                                    name="status"
                                    type="submit"
                                    value="ignored"
                                  >
                                    제외
                                  </button>
                                ) : null}
                                {event.status !== "open" ? (
                                  <button
                                    className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 transition hover:bg-amber-100"
                                    name="status"
                                    type="submit"
                                    value="open"
                                  >
                                    다시 열기
                                  </button>
                                ) : null}
                              </div>
                            </form>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-5 text-sm text-slate-600">
              {hasOperationsIssueFilters
                ? "현재 필터에 맞는 운영 이슈가 없습니다. 필터를 조정하거나 초기화해 주세요."
                : "저장된 운영 이슈가 없습니다. `operations-issues` job이 반복 조회 품질 이슈를 감지하면 표시됩니다."}
            </div>
          )}
        </CardBody>
      </Card>

      <Card id="lookup-quality" className="scroll-mt-6">
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
                            <p className="mt-1 font-mono text-xs text-slate-500">{event.sourceMode ?? payloadValue(event.payload, "provider")}</p>
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
