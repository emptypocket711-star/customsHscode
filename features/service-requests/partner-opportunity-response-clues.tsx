import { Badge } from "@/components/ui/badge";
import type { PartnerOpportunityResponseClue } from "@/server/repositories/service-request-list-view";

export function PartnerOpportunityResponseClues({
  clues
}: {
  clues: PartnerOpportunityResponseClue[];
}) {
  return (
    <div className="grid gap-3 rounded-md border border-slate-200 bg-white p-3">
      <div>
        <p className="text-sm font-semibold text-slate-950">응답 판단 단서</p>
        <p className="mt-1 text-xs leading-5 text-slate-600">견적 제출 전 확인해야 할 상태를 요약합니다.</p>
      </div>
      <div className="grid gap-2 md:grid-cols-3">
        {clues.map((clue) => (
          <a
            className="focus-ring grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-left hover:bg-slate-100"
            href={clue.href}
            key={clue.label}
          >
            <span className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-800">{clue.label}</span>
              <Badge tone={clue.tone}>{clue.value}</Badge>
            </span>
            <span className="text-xs leading-5 text-slate-600">{clue.detail}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
