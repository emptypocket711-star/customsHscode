import { ServiceRequestFlowPanel } from "@/features/service-requests/service-request-flow-panel";

const opportunityCopy = {
  clearance: {
    badge: "관세사무소",
    description: "공개된 통관 조건과 서류 범위를 확인한 뒤, 필요한 질문을 남기고 예비 견적을 제출합니다.",
    steps: [
      { detail: "요청 방향, HS 입력 여부, 국가 역할, 첨부 서류 수를 먼저 확인합니다.", label: "1. 조건 확인" },
      { detail: "품목, 원산지, 서류가 부족하면 견적 전 질문을 등록합니다.", label: "2. 질문 등록" },
      { detail: "수수료, 예상 리드타임, 추가서류 요청을 포함해 제안합니다.", label: "3. 예비 견적 제출" }
    ],
    title: "통관 입찰 작업 흐름"
  },
  freight: {
    badge: "포워더",
    description: "매칭된 운송 요청의 공개 조건을 확인하고, 필요한 질문 후 운송 견적을 제출합니다.",
    steps: [
      { detail: "출발·도착, 운송 방식, 공개 서류와 마감 시간을 확인합니다.", label: "1. 조건 확인" },
      { detail: "중량, CBM, Incoterms, 위험물 여부가 부족하면 질문합니다.", label: "2. 질문 등록" },
      { detail: "운임 조건, 리드타임, 유효기간을 포함해 견적을 제출합니다.", label: "3. 견적 제출" }
    ],
    title: "운송 입찰 작업 흐름"
  }
} as const;

export function PartnerOpportunityFlowPanel({
  kind
}: {
  kind: keyof typeof opportunityCopy;
}) {
  const copy = opportunityCopy[kind];

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
