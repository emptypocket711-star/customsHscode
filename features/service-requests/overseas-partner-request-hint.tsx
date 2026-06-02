import { Badge } from "@/components/ui/badge";
import type { MarketplaceRequestPrefill } from "@/features/service-requests/marketplace-request-prefill";

export function OverseasPartnerRequestHint({
  prefill,
  requestKind
}: {
  prefill: MarketplaceRequestPrefill;
  requestKind: "clearance" | "freight";
}) {
  const isKoreaImportRequest = prefill.direction === "import" && prefill.destinationCountryCode === "KR";
  if (!isKoreaImportRequest) return null;

  const title = requestKind === "clearance"
    ? "한국 통관 연결 요청으로 시작했습니다."
    : "한국 운송 연결 요청으로 시작했습니다.";
  const requiredFields = requestKind === "clearance"
    ? "품목 요약, 원산지, 수출국, 선적국, 목적국 KR, 예상 신고 일정"
    : "출발 국가, 도착 국가 KR, 운송 방식, 출발지·도착지, 화물 조건";
  const documentGuide = requestKind === "clearance"
    ? "Commercial Invoice, Packing List, C/O 가능 여부, 제품 카탈로그 또는 사양서"
    : "Commercial Invoice, Packing List, 화물 중량·부피, 픽업 가능일, 위험물·온도관리 여부";
  const roleGuide = requestKind === "clearance"
    ? "원산지·수출국·선적국·한국 도착지가 서로 다를 수 있으므로 각각 구분해 입력합니다."
    : "출발지, 선적지, 도착지, 최종 수하인을 분리하면 포워더가 견적 조건을 더 정확히 볼 수 있습니다.";

  return (
    <section className="rounded-md border border-blue-100 bg-blue-50 p-3 text-sm leading-6 text-blue-950">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold">{title}</p>
          <p className="mt-1 text-xs leading-5">
            해외 파트너는 한국 사업자등록번호 없이 요청 초안을 작성할 수 있습니다. 운영자 검증 상태와 서류 확인에 따라 공개·매칭이 제한될 수 있습니다.
          </p>
        </div>
        <Badge tone="info">해외 파트너</Badge>
      </div>
      <p className="mt-3 text-xs leading-5">
        보완할 정보: <span className="font-semibold">{requiredFields}</span>
      </p>
      <div className="mt-3 grid gap-2 text-xs leading-5 sm:grid-cols-3">
        <div className="rounded-md bg-white p-2 ring-1 ring-blue-100">
          <p className="font-semibold text-blue-900">검증</p>
          <p className="mt-1 text-blue-800">회사명, 국가, 웹사이트 또는 담당자 연락처를 확인할 수 있어야 합니다.</p>
        </div>
        <div className="rounded-md bg-white p-2 ring-1 ring-blue-100">
          <p className="font-semibold text-blue-900">서류</p>
          <p className="mt-1 text-blue-800">{documentGuide}</p>
        </div>
        <div className="rounded-md bg-white p-2 ring-1 ring-blue-100">
          <p className="font-semibold text-blue-900">국가 역할</p>
          <p className="mt-1 text-blue-800">{roleGuide}</p>
        </div>
      </div>
    </section>
  );
}
