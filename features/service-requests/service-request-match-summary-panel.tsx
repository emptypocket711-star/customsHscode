import { Badge } from "@/components/ui/badge";
import type { ServiceRequestMatchSummary } from "@/server/repositories/service-request-match-summary.repository";

export function ServiceRequestMatchSummaryPanel({
  kind,
  partnerLabel,
  status,
  summary
}: {
  kind: "freight" | "clearance";
  partnerLabel: string;
  status: string;
  summary: ServiceRequestMatchSummary;
}) {
  if (status === "draft") return null;

  const isZeroMatch = summary.matchedPartnerCount === 0;
  const zeroMatchGuidance =
    kind === "freight"
      ? "출발·도착 국가, 운송 방식, 위험물·온도관리·중고차 조건이 너무 좁으면 매칭이 없을 수 있습니다."
      : "목적국, HS/FTA/요건 확인 범위, 긴급 여부가 너무 좁으면 매칭이 없을 수 있습니다.";
  const hasNotificationState =
    summary.pendingNotificationCount > 0 ||
    summary.sentNotificationCount > 0 ||
    summary.skippedNotificationCount > 0 ||
    summary.failedNotificationCount > 0;

  return (
    <div
      className={`grid gap-2 rounded-md border p-3 text-xs leading-5 md:grid-cols-[1fr_auto] md:items-center ${
        isZeroMatch ? "border-amber-200 bg-amber-50 text-amber-800" : "border-slate-200 bg-slate-50 text-slate-600"
      }`}
    >
      <div>
        <p className="font-semibold text-slate-900">파트너 노출·알림 상태</p>
        <p className="mt-0.5">
          조건에 맞는 {partnerLabel} {summary.matchedPartnerCount}곳에 요청이 노출됩니다.
          {isZeroMatch ? ` ${zeroMatchGuidance} 운영자가 매칭 조건을 점검할 수 있도록 요청 상태를 유지하세요.` : null}
        </p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Badge tone={summary.matchedPartnerCount > 0 ? "info" : "warning"}>노출 {summary.matchedPartnerCount}곳</Badge>
        {isZeroMatch ? <Badge tone="warning">운영 점검 필요</Badge> : null}
        {hasNotificationState ? (
          <>
            <Badge tone={summary.pendingNotificationCount > 0 ? "warning" : "neutral"}>알림 대기 {summary.pendingNotificationCount}건</Badge>
            <Badge tone={summary.sentNotificationCount > 0 ? "success" : "neutral"}>발송 {summary.sentNotificationCount}건</Badge>
            <Badge tone="neutral">스킵 {summary.skippedNotificationCount}건</Badge>
            {summary.failedNotificationCount > 0 ? <Badge tone="warning">실패 {summary.failedNotificationCount}건</Badge> : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
