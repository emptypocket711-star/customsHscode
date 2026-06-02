import { Badge } from "@/components/ui/badge";

const handoffCopy = {
  clearance: {
    empty: "선정 관세사무소에게만 공개된 서류가 아직 없습니다.",
    recommended: ["Commercial Invoice", "Packing List", "C/O", "제품 사양서", "신고필증 보관본"],
    title: "선정 관세사무소 서류 handoff"
  },
  freight: {
    empty: "선정 포워더에게만 공개된 서류가 아직 없습니다.",
    recommended: ["Commercial Invoice", "Packing List", "B/L 또는 AWB", "보험·위험물 자료", "최종 선적 일정"],
    title: "선정 포워더 서류 handoff"
  }
} as const;

export function SelectedPartnerDocumentHandoff({
  count,
  kind
}: {
  count: number;
  kind: keyof typeof handoffCopy;
}) {
  const copy = handoffCopy[kind];
  const hasDocuments = count > 0;

  return (
    <div className="grid gap-2 rounded-md bg-white p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold text-slate-950">{copy.title}</p>
        <Badge tone={hasDocuments ? "success" : "warning"}>{count}건</Badge>
      </div>
      {!hasDocuments ? (
        <p className="text-xs leading-5 text-amber-800">{copy.empty} 서류 첨부 시 공개 범위를 선정 파트너 전용으로 지정해 주세요.</p>
      ) : null}
      <p className="text-xs leading-5 text-slate-600">
        추천 handoff: {copy.recommended.join(", ")}
      </p>
    </div>
  );
}
