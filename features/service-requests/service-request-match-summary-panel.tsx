import { Badge } from "@/components/ui/badge";
import type { ServiceRequestMatchSummary } from "@/server/repositories/service-request-match-summary.repository";

export function ServiceRequestMatchSummaryPanel({
  partnerLabel,
  status,
  summary
}: {
  partnerLabel: string;
  status: string;
  summary: ServiceRequestMatchSummary;
}) {
  if (status === "draft") return null;

  const hasNotificationState =
    summary.pendingNotificationCount > 0 ||
    summary.sentNotificationCount > 0 ||
    summary.skippedNotificationCount > 0 ||
    summary.failedNotificationCount > 0;

  return (
    <div className="grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600 md:grid-cols-[1fr_auto] md:items-center">
      <div>
        <p className="font-semibold text-slate-900">파트너 노출·알림 상태</p>
        <p className="mt-0.5">
          조건에 맞는 {partnerLabel} {summary.matchedPartnerCount}곳에 요청이 노출됩니다.
          {summary.matchedPartnerCount === 0 ? " 관심 조건을 넓히거나 운영자에게 매칭 조건 점검을 요청하세요." : null}
        </p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Badge tone={summary.matchedPartnerCount > 0 ? "info" : "warning"}>노출 {summary.matchedPartnerCount}곳</Badge>
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
