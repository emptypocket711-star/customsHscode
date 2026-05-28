import { AccessDenied } from "@/components/access-denied";
import { PageHeading } from "@/components/page-heading";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { requireDeveloperRole } from "@/server/auth/role-guard";
import { getEnvironmentHealthGroups, type EnvironmentHealthItem } from "@/server/operations/environment-health.service";
import { createSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase/server";
import {
  isLookupTelemetryIssue,
  listRecentLookupTelemetryEvents,
  type LookupTelemetryEvent
} from "@/server/repositories/lookup-telemetry.repository";

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "short",
  timeStyle: "medium",
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
  const lookupTelemetryEvents = await loadLookupTelemetryEvents();
  const lookupIssueCount = lookupTelemetryEvents.filter(isLookupTelemetryIssue).length;
  const lookupSuccessCount = lookupTelemetryEvents.length - lookupIssueCount;
  const zeroResultCount = lookupTelemetryEvents.filter((event) => event.resultCount === 0).length;
  const items = groups.flatMap((group) => group.items);
  const missingRequiredCount = items.filter((item) => item.status === "missing").length;
  const configuredCount = items.filter((item) => item.status === "ok").length;

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
              <div className="overflow-x-auto">
                <table className="min-w-[980px] text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500">
                    <tr>
                      <th className="px-5 py-3">시간</th>
                      <th className="px-5 py-3">이벤트</th>
                      <th className="px-5 py-3">상태</th>
                      <th className="px-5 py-3">결과</th>
                      <th className="px-5 py-3">입력 형태</th>
                      <th className="px-5 py-3">처리</th>
                      <th className="px-5 py-3">오류</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lookupTelemetryEvents.map((event) => (
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
                    ))}
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
