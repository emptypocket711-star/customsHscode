import { ServiceRequestFlowPanel } from "@/features/service-requests/service-request-flow-panel";

const requesterDetailCopy = {
  clearance: {
    badge: "화주 작업",
    description: "통관 의뢰 상세에서는 서류 보완, 관세사무소 질문 답변, 견적 비교와 선정 작업을 순서대로 처리합니다.",
    steps: [
      { detail: "CI, PL, 사양서 등 통관 검토에 필요한 서류를 공개 범위와 함께 정리합니다.", href: "#request-documents", label: "1. 서류 보완" },
      { detail: "관세사무소 질문이 있으면 상세 화면에서 답변 상태를 먼저 확인합니다.", href: "#request-questions", label: "2. 질문 답변" },
      { detail: "수수료, 리드타임, 요청서류를 비교한 뒤 관세사무소를 선정합니다.", href: "#request-bids", label: "3. 견적 비교" }
    ],
    title: "통관 의뢰 상세 작업 흐름"
  },
  freight: {
    badge: "화주 작업",
    description: "운송 견적 상세에서는 서류 보완, 포워더 질문 답변, 견적 비교와 선정 작업을 순서대로 처리합니다.",
    steps: [
      { detail: "CI, PL, B/L 등 운임 산정에 필요한 서류를 공개 범위와 함께 정리합니다.", href: "#request-documents", label: "1. 서류 보완" },
      { detail: "포워더 질문이 있으면 견적 비교 전에 답변 상태를 확인합니다.", href: "#request-questions", label: "2. 질문 답변" },
      { detail: "가격, 리드타임, 조건, 후기 지표를 함께 보고 포워더를 선정합니다.", href: "#request-bids", label: "3. 견적 비교" }
    ],
    title: "운송 견적 상세 작업 흐름"
  }
} as const;

export function RequesterDetailFlowPanel({
  kind
}: {
  kind: keyof typeof requesterDetailCopy;
}) {
  const copy = requesterDetailCopy[kind];

  return (
    <ServiceRequestFlowPanel
      background="muted"
      badge={copy.badge}
      description={copy.description}
      steps={copy.steps}
      title={copy.title}
    />
  );
}
