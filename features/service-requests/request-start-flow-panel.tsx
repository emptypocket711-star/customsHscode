import { ServiceRequestFlowPanel } from "@/features/service-requests/service-request-flow-panel";

const flowCopy = {
  clearance: {
    badge: "통관 의뢰",
    description: "HS, FTA, 요건 정보는 예비 참고값으로만 사용하고, 관세사무소 견적과 담당자 검토 흐름으로 이어집니다.",
    steps: [
      { detail: "품명, HS 입력 여부, 국가 역할, 희망 시작일을 저장합니다.", label: "1. 초안 저장" },
      { detail: "CI, PL, 사양서 등 공개 범위를 정해 추가합니다.", label: "2. 서류 보완" },
      { detail: "관세사무소 질문과 견적을 비교하고 선정합니다.", label: "3. 공개·선정" }
    ],
    title: "통관 의뢰 시작 흐름"
  },
  freight: {
    badge: "운송 견적",
    description: "화물이 완전히 확정되지 않아도 기본 조건을 먼저 저장하고, 서류와 공개 조건을 보완해 포워더 견적으로 연결합니다.",
    steps: [
      { detail: "출발·도착 국가, 운송 방식, 품명 요약을 저장합니다.", label: "1. 초안 저장" },
      { detail: "CI, PL, B/L 등 필요한 문서와 공개 범위를 정합니다.", label: "2. 서류 보완" },
      { detail: "조건에 맞는 포워더에게 공개하고 견적을 비교합니다.", label: "3. 공개·비교" }
    ],
    title: "운송 견적 시작 흐름"
  }
} as const;

export function RequestStartFlowPanel({
  kind
}: {
  kind: keyof typeof flowCopy;
}) {
  const copy = flowCopy[kind];

  const footer = (
      <div className="flex flex-wrap gap-2">
        <a className="focus-ring inline-flex h-9 items-center rounded-md bg-slate-950 px-3 text-xs font-semibold text-white" href="#request-draft-form">
          초안 작성으로 이동
        </a>
        <a className="focus-ring inline-flex h-9 items-center rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50" href="#my-service-requests">
          내 요청 보기
        </a>
      </div>
  );

  return (
    <ServiceRequestFlowPanel
      badge={copy.badge}
      description={copy.description}
      footer={footer}
      steps={copy.steps}
      title={copy.title}
    />
  );
}
