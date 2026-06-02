import { AlertCircle, CheckCircle2 } from "lucide-react";
import {
  summarizeDraftReadiness,
  type DraftReadinessItem
} from "@/features/service-requests/request-draft-readiness";

export function RequestDraftReadinessPanel({
  items,
  publishLabel
}: {
  items: DraftReadinessItem[];
  publishLabel: string;
}) {
  const summary = summarizeDraftReadiness(items);
  const readyToSave = summary.missingRequired.length === 0;
  const recommendedPreview = summary.missingRecommended.slice(0, 4);

  return (
    <div
      className={
        readyToSave
          ? "grid gap-3 rounded-md border border-emerald-200 bg-emerald-50 p-3"
          : "grid gap-3 rounded-md border border-amber-200 bg-amber-50 p-3"
      }
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <p className={readyToSave ? "inline-flex items-center gap-2 text-sm font-semibold text-emerald-900" : "inline-flex items-center gap-2 text-sm font-semibold text-amber-950"}>
            {readyToSave ? <CheckCircle2 aria-hidden="true" size={17} /> : <AlertCircle aria-hidden="true" size={17} />}
            {readyToSave ? "초안 저장 필수값이 채워졌습니다." : "초안 저장 전 필수값을 확인해 주세요."}
          </p>
          <p className={readyToSave ? "text-xs leading-5 text-emerald-800" : "text-xs leading-5 text-amber-900"}>
            필수 {summary.satisfiedRequiredCount}/{summary.requiredCount} · 보완 추천 {summary.satisfiedRecommendedCount}/{summary.recommendedCount}
          </p>
        </div>
        <span className={readyToSave ? "rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-emerald-800" : "rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-amber-900"}>
          {readyToSave ? "저장 가능" : "필수값 필요"}
        </span>
      </div>

      {summary.missingRequired.length > 0 ? (
        <div className="grid gap-1 text-xs leading-5 text-amber-950">
          <p className="font-semibold">지금 필요한 값</p>
          <p>{summary.missingRequired.map((item) => item.label).join(", ")}</p>
        </div>
      ) : null}

      {recommendedPreview.length > 0 ? (
        <div className="grid gap-1 text-xs leading-5 text-slate-700">
          <p className="font-semibold">{publishLabel}</p>
          <p>{recommendedPreview.map((item) => item.label).join(", ")}</p>
          {recommendedPreview.some((item) => item.helper) ? (
            <p className="text-slate-500">
              {recommendedPreview.find((item) => item.helper)?.helper}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="text-xs leading-5 text-slate-700">{publishLabel}까지 모두 입력되어 파트너가 견적 판단을 시작하기 좋은 상태입니다.</p>
      )}
    </div>
  );
}
