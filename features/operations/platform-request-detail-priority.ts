import type { PlatformRequestOperationsDetail } from "@/server/repositories/platform-operations.repository";

export type PlatformRequestDetailPrioritySignal = {
  detail: string;
  label: string;
  tone: "neutral" | "warning" | "info" | "success";
  value: string;
};

export function buildPlatformRequestDetailPrioritySignals(
  detail: PlatformRequestOperationsDetail
): PlatformRequestDetailPrioritySignal[] {
  const requestStatus = detail.request?.status ?? "unknown";
  const completed = requestStatus === "completed";
  const activeBids = detail.bids.filter((bid) => (
    bid.status !== "hidden" &&
    bid.status !== "withdrawn" &&
    bid.status !== "rejected" &&
    bid.status !== "expired"
  ));
  const sentNotifications = detail.matchSummary?.sentNotificationCount ?? 0;

  const completionSignal: PlatformRequestDetailPrioritySignal = !completed
    ? {
      detail: "아직 완료 거래가 아니므로 완료 리포트보다 견적·진행 상태를 먼저 봅니다.",
      label: "완료 리포트",
      tone: "neutral",
      value: "대기"
    }
    : !detail.completionReport
      ? {
        detail: "완료 거래인데 완료 리포트가 없습니다. 사용자 상세의 초안 저장 CTA와 보관 서류 연결 흐름을 먼저 확인합니다.",
        label: "완료 리포트",
        tone: "warning",
        value: "없음"
      }
      : detail.completionReport.status === "locked"
        ? {
          detail: "완료 리포트가 잠금 완료 상태입니다. 후속 작업은 피드백과 낮은 점수 여부를 봅니다.",
          label: "완료 리포트",
          tone: "success",
          value: "잠금"
        }
        : {
          detail: "완료 리포트가 있으나 확인, 운영 검토, 잠금 중 하나가 남아 있습니다.",
          label: "완료 리포트",
          tone: "warning",
          value: detail.completionReport.status
        };

  const feedbackSignal: PlatformRequestDetailPrioritySignal = !completed
    ? {
      detail: "완료 전에는 피드백보다 진행 시작과 완료 전환을 먼저 봅니다.",
      label: "피드백",
      tone: "neutral",
      value: "대기"
    }
    : detail.feedbackSummary.lowScoreCount > 0
      ? {
        detail: "낮은 점수가 있는 완료 거래입니다. 파트너 비교 기준과 후속 관리 흐름을 같이 점검합니다.",
        label: "피드백",
        tone: "warning",
        value: `${detail.feedbackSummary.lowScoreCount}건`
      }
      : detail.feedbackSummary.count === 0
        ? {
          detail: "완료 거래인데 피드백이 없습니다. 후기 요청 CTA가 사용자 상세에 표시되는지 확인합니다.",
          label: "피드백",
          tone: "warning",
          value: "없음"
        }
        : {
          detail: "피드백 데이터가 쌓이고 있습니다. 낮은 점수 경고는 없습니다.",
          label: "피드백",
          tone: "success",
          value: `${detail.feedbackSummary.count}건`
        };

  const partnerSignal: PlatformRequestDetailPrioritySignal = !detail.matchSummary
    ? {
      detail: "파트너 매칭 요약을 읽을 수 없습니다. schema와 매칭 row부터 확인합니다.",
      label: "파트너 응답",
      tone: "warning",
      value: "확인"
    }
    : detail.matchSummary.matchedPartnerCount === 0
      ? {
        detail: "노출된 파트너가 없습니다. 요청 조건, 파트너 관심 조건, 업체 검증 상태를 먼저 봅니다.",
        label: "파트너 응답",
        tone: "warning",
        value: "노출 0"
      }
      : sentNotifications > 0 && activeBids.length === 0
        ? {
          detail: "알림은 발송됐지만 활성 견적이 없습니다. 질문, 공개 서류, 파트너 열람 상태를 확인합니다.",
          label: "파트너 응답",
          tone: "warning",
          value: "무응답"
        }
        : activeBids.length > 0
          ? {
            detail: "활성 견적이 있습니다. 화주가 비교 후 선정으로 넘어갈 수 있는지 봅니다.",
            label: "파트너 응답",
            tone: "info",
            value: `${activeBids.length}건`
          }
          : {
            detail: "파트너 노출은 있으나 아직 활성 견적이 없습니다. 알림 상태와 관심 상태를 확인합니다.",
            label: "파트너 응답",
            tone: "neutral",
            value: "대기"
          };

  return [completionSignal, feedbackSignal, partnerSignal];
}
