import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { CopyOperationsRequestButton } from "@/features/operations/copy-operations-request-button";
import type { PlatformRequestOperationsSummary } from "@/server/repositories/platform-operations.repository";

function tone(count: number): "neutral" | "warning" | "info" | "success" {
  if (count > 0) return "warning";
  return "success";
}

function buildOwnerActionQueue(summary: PlatformRequestOperationsSummary) {
  if (!summary.schemaReady) {
    return [{
      action: "플랫폼 요청 데이터 준비 상태 확인",
      detail: "요청 운영 통계를 계산할 수 없어 기능 개선보다 데이터 준비 상태 점검이 우선입니다.",
      label: "데이터 준비",
      owner: "개발자",
      reason: "운영 지표 계산 불가",
      tone: "warning" as const,
      value: "필수"
    }];
  }

  const queue = [
    {
      action: "질문 답변 위치와 알림 흐름 개선 요청",
      count: summary.unansweredQuestions,
      detail: "화주 답변이 없으면 파트너 견적 제출과 후속 협의가 멈춥니다.",
      label: "미답변 질문",
      owner: "개발자",
      reason: "견적 제출 전 병목",
      tone: "warning" as const
    },
    {
      action: "견적 비교·선택 화면 개선 요청",
      count: summary.bidsReceived,
      detail: "견적이 도착했는데 선택으로 이어지지 않는 구간을 먼저 봅니다.",
      label: "견적 도착",
      owner: "개발자",
      reason: "선정 전환 병목",
      tone: "warning" as const
    },
    {
      action: "완료 처리와 후속 피드백 흐름 개선 요청",
      count: summary.staleInProgress,
      detail: "선정 이후 진행중 상태가 오래 지속되면 거래 완료 데이터가 쌓이지 않습니다.",
      label: "오래 진행중",
      owner: "운영자",
      reason: "완료 전환 지연",
      tone: "info" as const
    },
    {
      action: "파트너 신뢰 표시와 거래 후속 관리 개선 요청",
      count: summary.lowFeedbacks,
      detail: "낮은 후기가 있는 완료 거래는 파트너 비교 기준과 후속 관리 흐름을 함께 봅니다.",
      label: "낮은 후기",
      owner: "운영자",
      reason: "신뢰 품질 저하",
      tone: "warning" as const
    },
    {
      action: "완료 리포트와 최종 보관 서류 흐름 개선 요청",
      count: summary.completedWithoutReport,
      detail: "완료됐지만 리포트가 없으면 정산·서류 보관·후속 확인이 끊깁니다.",
      label: "완료 리포트 없음",
      owner: "운영자",
      reason: "완료 기록 누락",
      tone: "info" as const
    },
    {
      action: "완료 리포트 확인 CTA와 알림 흐름 개선 요청",
      count: summary.completionReportsSubmitted,
      detail: "제출된 리포트가 상대방 확인으로 이어지지 않으면 거래 종료 기록이 잠기지 못합니다.",
      label: "리포트 확인 대기",
      owner: "개발자",
      reason: "상대방 확인 지연",
      tone: "warning" as const
    },
    {
      action: "완료 리포트 운영 검토 큐 개선 요청",
      count: summary.completionReportsAcknowledged,
      detail: "확인된 리포트는 운영자가 민감정보와 보관 서류를 점검해야 잠금 단계로 넘어갑니다.",
      label: "운영 검토 필요",
      owner: "운영자",
      reason: "운영 검토 대기",
      tone: "warning" as const
    },
    {
      action: "완료 리포트 잠금 전 점검 흐름 개선 요청",
      count: summary.completionReportsReadyToLock,
      detail: "운영 검토 후 잠금 대기 리포트는 금지 표현과 최종 보관 서류 연결을 마무리해야 합니다.",
      label: "잠금 대기",
      owner: "운영자",
      reason: "최종 보관 전 점검",
      tone: "info" as const
    },
    {
      action: "완료 후 후기 요청 CTA 개선 요청",
      count: summary.completedWithoutFeedback,
      detail: "완료 거래에 피드백이 없으면 파트너 신뢰 지표와 추천 품질이 쌓이지 않습니다.",
      label: "후기 미제출",
      owner: "개발자",
      reason: "신뢰 데이터 누락",
      tone: "info" as const
    },
    {
      action: "파트너 매칭 조건과 관심 조건 점검 요청",
      count: summary.openWithoutMatches,
      detail: "노출 0건은 견적 전환 문제가 아니라 매칭 조건 자체가 맞지 않는 상태일 수 있습니다.",
      label: "노출 0건",
      owner: "운영자",
      reason: "파트너 매칭 없음",
      tone: "warning" as const
    },
    {
      action: "알림 후 파트너 무응답 운영 후속 조치 요청",
      count: summary.notifiedWithoutBids,
      detail: "알림이 전달됐는데도 견적이 없으면 요청 조건보다 파트너 응답 유도와 후속 알림 기준을 먼저 봅니다.",
      label: "알림 후 무응답",
      owner: "운영자",
      reason: "파트너 응답 지연",
      tone: "warning" as const
    },
    {
      action: "파트너 매칭 조건과 알림 worker 점검 요청",
      count: summary.openWithoutBids,
      detail: "공개됐지만 견적이 없으면 요청 품질, 관심 조건, 알림 중복 방지가 같이 점검 대상입니다.",
      label: "견적 없는 공개",
      owner: "운영자",
      reason: "매칭·알림 점검",
      tone: "warning" as const
    },
    {
      action: "초안 작성 완료 CTA와 필수값 안내 개선 요청",
      count: summary.staleDrafts,
      detail: "초안이 오래 남으면 사용자가 요청 공개 전 어디서 막혔는지 확인해야 합니다.",
      label: "오래된 초안",
      owner: "개발자",
      reason: "공개 전환 지연",
      tone: "neutral" as const
    },
    {
      action: "마감 이후 연장·재공개·종료 안내 개선 요청",
      count: summary.staleOpen,
      detail: "마감이 지난 공개 요청은 상태 정리와 후속 안내가 필요합니다.",
      label: "마감 지난 공개",
      owner: "운영자",
      reason: "마감 후 상태 정리",
      tone: "neutral" as const
    }
  ]
    .filter((item) => item.count > 0)
    .slice(0, 3)
    .map((item) => ({
      action: item.action,
      detail: item.detail,
      label: item.label,
      owner: item.owner,
      reason: item.reason,
      tone: item.tone,
      value: `${item.count}건`
    }));

  return queue.length ? queue : [{
    action: "다음 MVP 기능 구현 계속 진행",
    detail: "즉시 막힌 운영 병목은 적습니다. 요청 생성부터 완료 피드백까지 다음 기능 레일을 이어갑니다.",
    label: "즉시 병목 적음",
    owner: "개발자",
    reason: "새 병목 선정",
    tone: "success" as const,
    value: "정상"
  }];
}

function buildCopyReadyOperationsRequest(
  summary: PlatformRequestOperationsSummary,
  ownerActionQueue: ReturnType<typeof buildOwnerActionQueue>
) {
  const lines = [
    "운영 개선 요청",
    "",
    summary.actionRequest,
    "",
    "대표 우선순위:",
    ...ownerActionQueue.map((item, index) => `${index + 1}. ${item.label} ${item.value} - ${item.action} / 담당 ${item.owner} / 이유 ${item.reason}`),
    "",
    "핵심 지표:",
    `- 전체 요청: ${summary.total}건`,
    `- 진행 요청: ${summary.open + summary.bidsReceived}건`,
    `- 선정 후 진행: ${summary.inProgress}건`,
    `- 완료: ${summary.completed}건`,
    `- 파트너 노출 0건: ${summary.openWithoutMatches}건`,
    `- 알림 후 무응답: ${summary.notifiedWithoutBids}건`,
    `- 완료 리포트 없음: ${summary.completedWithoutReport}건`,
    `- 완료 후 피드백 없음: ${summary.completedWithoutFeedback}건`,
    "",
    "확인 샘플:",
    ...(summary.actionItems.length > 0
      ? summary.actionItems.map((item) => `- ${item.label}: ${item.requestType} / ${item.status} / ${item.requestId}`)
      : ["- 샘플 요청 없음"]),
    "",
    "주의: 서류 원문, 파일명, 단가 원문, 개인정보는 프롬프트나 로그에 포함하지 말고 건수와 상태만 사용해."
  ];

  return lines.join("\n");
}

function buildTrustMetricGuidance(summary: PlatformRequestOperationsSummary) {
  if (!summary.schemaReady) {
    return {
      detail: "요청 스키마가 적용된 뒤 완료 거래와 후기 품질을 함께 볼 수 있습니다.",
      label: "신뢰지표 대기",
      tone: "neutral" as const,
      value: "대기"
    };
  }

  if (summary.lowFeedbacks > 0) {
    return {
      detail: "낮은 후기가 있는 거래는 파트너 비교 기준, 선정 전 안내, 완료 후 후속 관리가 같이 점검 대상입니다.",
      label: "낮은 후기 우선 확인",
      tone: "warning" as const,
      value: `${summary.lowFeedbacks}건`
    };
  }

  if (summary.completedWithoutFeedback > 0) {
    return {
      detail: "완료 거래가 있어도 피드백이 없으면 추천 품질을 판단할 데이터가 쌓이지 않습니다.",
      label: "후기 요청 흐름 확인",
      tone: "info" as const,
      value: `${summary.completedWithoutFeedback}건`
    };
  }

  if (summary.feedbackCount > 0) {
    return {
      detail: "현재 완료 거래의 후기 데이터는 큰 경고 없이 쌓이고 있습니다. 다음 병목을 우선 처리해도 됩니다.",
      label: "후기 품질 안정",
      tone: "success" as const,
      value: `${summary.averageFeedbackRating ?? "-"}점`
    };
  }

  return {
    detail: "완료 거래가 쌓이면 후기 요청 CTA와 파트너 신뢰 지표가 실제 비교 기준으로 작동하는지 확인합니다.",
    label: "완료 거래 대기",
    tone: "neutral" as const,
    value: "대기"
  };
}

type OperationsMetricCard = {
  detail: string;
  label: string;
  tone: "neutral" | "warning" | "info" | "success";
  value: string;
};

export function buildPlatformRequestOperationsMetricGroups(summary: PlatformRequestOperationsSummary): {
  diagnosticMetrics: OperationsMetricCard[];
  primaryMetrics: OperationsMetricCard[];
} {
  return {
    diagnosticMetrics: [
      { detail: "완료 후 정산·보관 서류 리포트가 비어있는 거래", label: "리포트 없음", tone: tone(summary.completedWithoutReport), value: `${summary.completedWithoutReport}건` },
      { detail: "제출 후 화주 또는 파트너 확인이 필요한 리포트", label: "리포트 확인 대기", tone: tone(summary.completionReportsSubmitted), value: `${summary.completionReportsSubmitted}건` },
      { detail: "상대방 확인 후 운영자가 검토해야 하는 리포트", label: "운영 검토 필요", tone: tone(summary.completionReportsAcknowledged), value: `${summary.completionReportsAcknowledged}건` },
      { detail: "운영 검토 후 최종 보관 잠금이 필요한 리포트", label: "잠금 대기", tone: tone(summary.completionReportsReadyToLock), value: `${summary.completionReportsReadyToLock}건` },
      { detail: "수정 불가한 최종 보관 리포트", label: "잠금 완료", tone: summary.completionReportsLocked > 0 ? "success" as const : "neutral" as const, value: `${summary.completionReportsLocked}건` },
      { detail: "완료 후 신뢰 데이터가 비어있는 거래", label: "후기 미제출", tone: tone(summary.completedWithoutFeedback), value: `${summary.completedWithoutFeedback}건` },
      { detail: "화주 답변이 필요한 질문", label: "미답변 질문", tone: tone(summary.unansweredQuestions), value: `${summary.unansweredQuestions}건` },
      { detail: "파트너 관심 조건과 맞지 않아 노출되지 않은 공개 요청", label: "노출 0건", tone: tone(summary.openWithoutMatches), value: `${summary.openWithoutMatches}건` },
      { detail: "알림 전달 후에도 견적이 없는 공개 요청", label: "알림 후 무응답", tone: tone(summary.notifiedWithoutBids), value: `${summary.notifiedWithoutBids}건` },
      { detail: "매칭·알림 점검 대상", label: "견적 없는 공개", tone: tone(summary.openWithoutBids), value: `${summary.openWithoutBids}건` },
      { detail: "저장 후 다음 행동 안내 대상", label: "오래된 초안", tone: tone(summary.staleDrafts), value: `${summary.staleDrafts}건` },
      { detail: "완료 처리·후속 안내 점검 대상", label: "오래 진행중", tone: tone(summary.staleInProgress), value: `${summary.staleInProgress}건` },
      { detail: "만료 처리 점검 대상", label: "마감 지난 공개", tone: tone(summary.staleOpen), value: `${summary.staleOpen}건` }
    ],
    primaryMetrics: [
      { detail: `운송 ${summary.freight} / 통관 ${summary.clearance}`, label: "전체 요청", tone: "info" as const, value: `${summary.total}건` },
      { detail: `공개중 ${summary.open} / 견적도착 ${summary.bidsReceived}`, label: "진행 요청", tone: summary.open + summary.bidsReceived > 0 ? "warning" as const : "neutral" as const, value: `${summary.open + summary.bidsReceived}건` },
      { detail: `선정 ${summary.partnerSelected} / 완료 ${summary.completed}`, label: "선정 후 진행", tone: summary.inProgress + summary.partnerSelected > 0 ? "info" as const : "neutral" as const, value: `${summary.inProgress}건` },
      { detail: `평균 ${summary.averageFeedbackRating ?? "-"}점 / 낮은 후기 ${summary.lowFeedbacks}건`, label: "거래 후기", tone: summary.lowFeedbacks > 0 ? "warning" as const : "success" as const, value: `${summary.feedbackCount}건` }
    ]
  };
}

export function PlatformRequestOperationsPanel({
  summary
}: {
  summary: PlatformRequestOperationsSummary;
}) {
  const ownerActionQueue = buildOwnerActionQueue(summary);
  const primaryOwnerAction = ownerActionQueue[0];
  const secondaryOwnerActions = ownerActionQueue.slice(1);
  const copyReadyRequest = buildCopyReadyOperationsRequest(summary, ownerActionQueue);
  const trustMetricGuidance = buildTrustMetricGuidance(summary);
  const { diagnosticMetrics, primaryMetrics } = buildPlatformRequestOperationsMetricGroups(summary);

  return (
    <div id="platform-request-operations" className="scroll-mt-6">
      <Card>
        <CardHeader
          action={<Badge tone={summary.schemaReady ? "info" : "warning"}>{summary.schemaReady ? "요청 운영" : "스키마 확인"}</Badge>}
          description="대표가 통계를 해석하지 않아도 먼저 맡길 개선 작업과 복사용 요청문만 확인할 수 있게 정리합니다."
          title="플랫폼 요청 운영 상태"
        />
        <CardBody className="grid gap-4">
          {!summary.schemaReady ? (
            <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
              현재 이 환경에서는 플랫폼 요청 운영 데이터가 준비되지 않아 요청 통계를 계산할 수 없습니다. 로그인 문제는 아니며, 요청·입찰 기능 데이터 준비 후 운영 큐가 표시됩니다.
            </p>
          ) : null}
          <div className="rounded-md border border-slate-200 bg-white p-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-950">대표 우선순위 큐</p>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  지금 바로 맡길 1순위만 먼저 보여주고, 다음 후보는 접어둡니다.
                </p>
              </div>
              <Badge tone={primaryOwnerAction?.tone ?? "neutral"}>{primaryOwnerAction?.value ?? "확인"}</Badge>
            </div>
            {primaryOwnerAction ? (
              <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-950">{primaryOwnerAction.label}</p>
                  <Badge tone={primaryOwnerAction.tone}>{primaryOwnerAction.value}</Badge>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-slate-700">담당 {primaryOwnerAction.owner}</span>
                  <span className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-slate-700">이유 {primaryOwnerAction.reason}</span>
                </div>
                <p className="mt-2 text-xs font-semibold leading-5 text-slate-800">{primaryOwnerAction.action}</p>
                <p className="mt-1 text-xs leading-5 text-slate-600">{primaryOwnerAction.detail}</p>
              </div>
            ) : null}
            {secondaryOwnerActions.length > 0 ? (
              <details className="mt-3 rounded-md border border-slate-200 bg-white">
                <summary className="cursor-pointer list-none px-3 py-2 text-xs font-semibold text-slate-700">
                  다음 후보 {secondaryOwnerActions.length}개 보기
                </summary>
                <div className="grid gap-2 border-t border-slate-200 p-3 lg:grid-cols-2">
                  {secondaryOwnerActions.map((item) => (
                    <div className="rounded-md bg-slate-50 p-3" key={item.label}>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-950">{item.label}</p>
                        <Badge tone={item.tone}>{item.value}</Badge>
                      </div>
                      <p className="mt-2 text-xs font-semibold leading-5 text-slate-800">담당 {item.owner} · 이유 {item.reason}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-600">{item.action}</p>
                    </div>
                  ))}
                </div>
              </details>
            ) : null}
            {summary.actionItems.length > 0 ? (
              <div className="mt-3 rounded-md border border-blue-100 bg-blue-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-blue-950">바로 확인할 운영 샘플</p>
                  <Badge tone="info">{summary.actionItems.length}건</Badge>
                </div>
                <div className="mt-2 grid gap-2 lg:grid-cols-3">
                  {summary.actionItems.map((item) => (
                    <Link
                      className="focus-ring rounded-md border border-blue-100 bg-white p-3 text-sm transition hover:border-blue-300 hover:bg-blue-50"
                      href={item.href}
                      key={`priority-${item.requestId}-${item.label}`}
                    >
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-slate-950">{item.label}</span>
                        <Badge tone={item.requestType === "freight" ? "info" : "neutral"}>{item.requestType === "freight" ? "운송" : "통관"}</Badge>
                        <span className="font-mono text-xs text-slate-500">{item.requestId.slice(0, 8)}</span>
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-slate-600">{item.detail}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
          <div className="grid gap-3 rounded-md border border-slate-200 bg-white p-4 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-slate-950">거래 신뢰지표 해석</p>
                <Badge tone={trustMetricGuidance.tone}>{trustMetricGuidance.value}</Badge>
              </div>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-800">{trustMetricGuidance.label}</p>
              <p className="mt-1 text-xs leading-5 text-slate-600">{trustMetricGuidance.detail}</p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-md bg-slate-50 p-2">
                <p className="font-semibold text-slate-950">{summary.feedbackCount}건</p>
                <p className="mt-1 text-slate-500">후기</p>
              </div>
              <div className="rounded-md bg-slate-50 p-2">
                <p className="font-semibold text-slate-950">{summary.averageFeedbackRating ?? "-"}점</p>
                <p className="mt-1 text-slate-500">평균</p>
              </div>
              <div className="rounded-md bg-slate-50 p-2">
                <p className="font-semibold text-slate-950">{summary.completedWithoutFeedback}건</p>
                <p className="mt-1 text-slate-500">미제출</p>
              </div>
            </div>
          </div>
          <div className="rounded-md border border-blue-100 bg-blue-50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold text-blue-900">다음에 바로 요청할 작업</p>
                <p className="mt-2 text-sm leading-6 text-blue-950">{summary.actionRequest}</p>
              </div>
              <CopyOperationsRequestButton text={copyReadyRequest} />
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {primaryMetrics.map((metric) => (
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3" key={metric.label}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-950">{metric.label}</p>
                  <Badge tone={metric.tone}>{metric.value}</Badge>
                </div>
                <p className="mt-1 text-xs leading-5 text-slate-600">{metric.detail}</p>
              </div>
            ))}
          </div>
          <details className="rounded-md border border-slate-200 bg-white">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
              <span>
                <span className="block text-sm font-semibold text-slate-950">상세 진단 지표와 확인 샘플</span>
                <span className="mt-1 block text-xs leading-5 text-slate-600">리포트, 후기, 질문, 마감 등 세부 병목은 필요할 때만 펼쳐서 확인합니다.</span>
              </span>
              <Badge tone="neutral">{diagnosticMetrics.length}개 지표</Badge>
            </summary>
            <div className="grid gap-4 border-t border-slate-200 p-4">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {diagnosticMetrics.map((metric) => (
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-3" key={metric.label}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-950">{metric.label}</p>
                      <Badge tone={metric.tone}>{metric.value}</Badge>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-slate-600">{metric.detail}</p>
                  </div>
                ))}
              </div>
              <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-md border border-blue-100 bg-blue-50 p-3 text-xs leading-5 text-slate-700">
                {copyReadyRequest}
              </pre>
              {summary.actionItems.length > 0 ? (
                <div className="grid gap-2 rounded-md border border-slate-200 bg-white p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-950">우선 확인 샘플</p>
                    <Badge tone="neutral">{summary.actionItems.length}건</Badge>
                  </div>
                  <div className="grid gap-2">
                    {summary.actionItems.map((item) => (
                      <Link
                        className="focus-ring grid gap-1 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm transition hover:border-blue-200 hover:bg-blue-50"
                        href={item.href}
                        key={`${item.requestId}-${item.label}`}
                      >
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-slate-950">{item.label}</span>
                          <Badge tone={item.requestType === "freight" ? "info" : "neutral"}>{item.requestType === "freight" ? "운송" : "통관"}</Badge>
                          <span className="font-mono text-xs text-slate-500">{item.requestId.slice(0, 8)}</span>
                        </span>
                        <span className="text-xs leading-5 text-slate-600">{item.detail}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </details>
        </CardBody>
      </Card>
    </div>
  );
}
