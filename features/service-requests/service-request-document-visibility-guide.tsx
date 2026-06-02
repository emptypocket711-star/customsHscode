type ServiceRequestDocumentVisibilityGuideProps = {
  kind: "freight" | "clearance";
};

const visibilityGuideCopy = {
  freight: {
    partner: "포워더",
    matched: "매칭된 포워더에게 공개",
    selected: "선정된 포워더에게만 공개",
    purpose: "운송 견적 산정에 필요한 범위만 공개합니다."
  },
  clearance: {
    partner: "관세사무소",
    matched: "매칭된 관세사무소에게 공개",
    selected: "선정된 관세사무소에게만 공개",
    purpose: "통관 수수료와 필요서류 산정에 필요한 범위만 공개합니다."
  }
} as const;

export function ServiceRequestDocumentVisibilityGuide({ kind }: ServiceRequestDocumentVisibilityGuideProps) {
  const copy = visibilityGuideCopy[kind];

  return (
    <div className="grid gap-3 rounded-md border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-600">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold text-slate-900">공개 범위 선택 기준</p>
        <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-medium text-slate-600">
          민감 서류 보호
        </span>
      </div>
      <p>{copy.purpose} 단가, 거래처명, 원본 계약 조건이 포함된 서류는 공개 범위를 먼저 보수적으로 선택하세요.</p>
      <div className="grid gap-2 md:grid-cols-2">
        <VisibilityGuideItem label="나와 운영자만" text="초안 보관, 내부 확인, 공개 전 검토에 적합합니다." />
        <VisibilityGuideItem label={copy.matched} text={`${copy.partner}가 견적을 계산해야 할 때만 사용합니다.`} />
        <VisibilityGuideItem label={copy.selected} text="파트너 선정 이후 상세 서류를 넘길 때 권장합니다." />
        <VisibilityGuideItem label="운영자만" text="운영 확인용 민감 메모나 비공개 보완 자료에 사용합니다." />
      </div>
    </div>
  );
}

export function PartnerVisibleDocumentNotice({ kind }: ServiceRequestDocumentVisibilityGuideProps) {
  const copy = visibilityGuideCopy[kind];

  return (
    <p className="rounded-md border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-600">
      이 목록에는 화주가 {copy.partner}에게 공개한 서류만 표시됩니다. 비공개 또는 운영자 전용 서류는 보이지 않으며,
      추가 서류가 필요하면 질문·견적 메시지에서 요청하세요.
    </p>
  );
}

function VisibilityGuideItem({ label, text }: { label: string; text: string }) {
  return (
    <div className="grid gap-1 rounded-md bg-slate-50 p-2">
      <span className="font-semibold text-slate-800">{label}</span>
      <span>{text}</span>
    </div>
  );
}
