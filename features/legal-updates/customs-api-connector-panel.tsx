"use client";

import { useActionState } from "react";
import { DatabaseZap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { probeCustomsApiAction } from "@/server/actions/customs-api-probe.actions";
import type { CustomsApiProbeActionState } from "@/features/legal-updates/customs-api-schemas";

const initialState: CustomsApiProbeActionState = { status: "idle" };

export function CustomsApiConnectorPanel() {
  const [state, formAction, pending] = useActionState(probeCustomsApiAction, initialState);

  return (
    <Card>
      <CardHeader
        title="관세청 OpenAPI 커넥터"
        description="공공데이터포털 service key와 endpoint URL 설정 후 공식 API 응답의 checksum과 snapshot metadata를 점검합니다."
        action={<Badge tone="info">official API probe</Badge>}
      />
      <CardBody>
        <form action={formAction} className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              API 자료
              <select className="focus-ring rounded-md border border-slate-300 bg-white px-3 py-2" disabled={pending} name="source" defaultValue="customs_confirmation">
                <option value="customs_confirmation">세관장확인대상물품</option>
                <option value="hs_code">HS부호검색</option>
                <option value="hs_code_navigation">HS CODE 내비게이션</option>
                <option value="tariff_rate">관세율</option>
                <option value="statistical_code">통계부호</option>
                <option value="exchange_rate">관세환율정보</option>
                <option value="cargo_progress">화물통관진행정보</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              HSK / 패턴
              <input className="focus-ring rounded-md border border-slate-300 px-3 py-2" disabled={pending} name="hskCode" placeholder="3304.99-1000 또는 4202290000" />
            </label>
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              수출입 구분
              <select className="focus-ring rounded-md border border-slate-300 bg-white px-3 py-2" disabled={pending} name="direction" defaultValue="import">
                <option value="import">수입</option>
                <option value="export">수출</option>
              </select>
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              품명
              <input className="focus-ring rounded-md border border-slate-300 px-3 py-2" disabled={pending} name="productName" placeholder="스콤버" />
            </label>
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              통계부호구분
              <input className="focus-ring rounded-md border border-slate-300 px-3 py-2" disabled={pending} name="statisticalCodeType" placeholder="A01" />
            </label>
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              환율 적용일
              <input className="focus-ring rounded-md border border-slate-300 px-3 py-2" disabled={pending} name="applyStartDate" type="date" />
            </label>
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              화물관리번호
              <input className="focus-ring rounded-md border border-slate-300 px-3 py-2" disabled={pending} name="cargoManagementNo" />
            </label>
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              Master B/L
              <input className="focus-ring rounded-md border border-slate-300 px-3 py-2" disabled={pending} name="masterBlNo" />
            </label>
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              House B/L
              <input className="focus-ring rounded-md border border-slate-300 px-3 py-2" disabled={pending} name="houseBlNo" />
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              className="focus-ring inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-white"
              disabled={pending}
              type="submit"
            >
              <DatabaseZap aria-hidden="true" size={18} />
              API 응답 점검
            </button>
            <p className="text-xs text-slate-500">응답은 바로 published 처리하지 않고 snapshot/staging/review 대상으로만 취급합니다.</p>
          </div>
        </form>

        {state.message ? (
          <div className={state.status === "success" ? "mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800" : "mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"}>
            {state.message}
          </div>
        ) : null}

        {state.snapshot ? (
          <div className="mt-4 grid gap-3">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <tbody>
                  <tr className="border-b border-slate-100"><th className="py-2 pr-4 text-slate-500">원천</th><td className="py-2 text-slate-900">{state.snapshot.sourceName}</td></tr>
                  <tr className="border-b border-slate-100"><th className="py-2 pr-4 text-slate-500">버전</th><td className="py-2 text-slate-900">{state.snapshot.sourceVersion}</td></tr>
                  <tr className="border-b border-slate-100"><th className="py-2 pr-4 text-slate-500">수집시각</th><td className="py-2 text-slate-900">{state.snapshot.retrievedAt}</td></tr>
                  <tr className="border-b border-slate-100"><th className="py-2 pr-4 text-slate-500">Checksum</th><td className="py-2 font-mono text-xs text-slate-700">{state.snapshot.checksum}</td></tr>
                  <tr className="border-b border-slate-100"><th className="py-2 pr-4 text-slate-500">Content-Type</th><td className="py-2 text-slate-900">{state.snapshot.contentType ?? "-"}</td></tr>
                  <tr><th className="py-2 pr-4 text-slate-500">URL</th><td className="py-2 break-all text-slate-700">{state.snapshot.sourceUrl}</td></tr>
                </tbody>
              </table>
            </div>
            <pre className="max-h-72 overflow-auto rounded-md bg-slate-950 p-3 text-xs leading-5 text-slate-100">{state.snapshot.preview}</pre>
          </div>
        ) : null}
      </CardBody>
    </Card>
  );
}
