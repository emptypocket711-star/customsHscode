import { Badge } from "@/components/ui/badge";
import {
  hasMarketplaceLookupPrefill,
  marketplacePrefillSnapshotRows,
  type MarketplaceRequestPrefill
} from "@/features/service-requests/marketplace-request-prefill";

export function MarketplacePrefillSourcePanel({
  prefill,
  requestKind
}: {
  prefill: MarketplaceRequestPrefill;
  requestKind: "clearance" | "freight";
}) {
  if (!hasMarketplaceLookupPrefill(prefill)) return null;

  const rows = marketplacePrefillSnapshotRows(prefill);
  const description = requestKind === "clearance"
    ? "통관 의뢰 초안에 참고값으로 반영됩니다. FTA 판단을 위해 원산지·수출국·선적국은 별도 확인이 필요합니다."
    : "운송 견적 초안에 화물 참고 정보로 반영됩니다. 포워더가 운임 조건을 보기 위한 예비 정보입니다.";

  return (
    <section className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-slate-950">HS 조회 결과에서 시작한 요청 초안입니다.</p>
          <p className="mt-1 text-xs leading-5 text-slate-600">{description}</p>
        </div>
        <Badge tone="info">예비값</Badge>
      </div>
      {rows.length ? (
        <dl className="mt-3 flex flex-wrap gap-2">
          {rows.map((row) => (
            <div className="rounded-md border border-slate-200 bg-white px-3 py-2" key={`${row.label}-${row.value}`}>
              <dt className="text-xs font-semibold text-slate-500">{row.label}</dt>
              <dd className="mt-1 break-words text-sm font-medium text-slate-900">{row.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      <p className="mt-3 text-xs leading-5 text-slate-600">
        이 값은 요청서 작성을 빠르게 시작하기 위한 예비진단 참고값이며, HSK 확정 및 법령·요건 적용 여부는 담당자 검토가 필요합니다.
      </p>
    </section>
  );
}
