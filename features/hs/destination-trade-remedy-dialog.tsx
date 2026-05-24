"use client";

import { Scale, X } from "lucide-react";
import { useRef } from "react";
import { exportCountryLabel } from "@/features/export-diagnosis/country-options";
import { formatHsCode } from "@/lib/hs-code";
import type { ExportDestinationTradeRemedyCaseItem } from "@/server/repositories/export-destination-import-data.repository";

type DestinationTradeRemedyDialogProps = {
  tradeRemedyCase: ExportDestinationTradeRemedyCaseItem;
};

function displayValue(value?: string | null) {
  return value?.trim() ? value : "-";
}

function remedyTypeLabel(type: string) {
  if (type === "AD") return "반덤핑";
  if (type === "CVD") return "상계관세";
  return "AD/CVD";
}

export function DestinationTradeRemedyDialog({ tradeRemedyCase }: DestinationTradeRemedyDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const origin = tradeRemedyCase.originCountryCode ? exportCountryLabel(tradeRemedyCase.originCountryCode) : "공통";
  const remedyLabel = remedyTypeLabel(tradeRemedyCase.remedyType);

  return (
    <>
      <button
        className="focus-ring inline-flex max-w-full flex-wrap items-center gap-1 rounded text-left font-semibold text-rose-700 underline-offset-2 hover:underline"
        onClick={() => dialogRef.current?.showModal()}
        type="button"
      >
        <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[11px] text-rose-700">범위 확인</span>
        <Scale aria-hidden="true" size={14} />
        <span>{origin} {remedyLabel}</span>
        <span className="font-mono">{tradeRemedyCase.caseNumber}</span>
        <span>{tradeRemedyCase.rateText ?? "세율 확인 필요"}</span>
      </button>
      <dialog className="w-[min(840px,calc(100vw-32px))] rounded-lg border border-slate-200 p-0 shadow-2xl backdrop:bg-slate-950/45" ref={dialogRef}>
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <div className="text-xs font-semibold text-slate-500">AD/CVD 후보</div>
            <h2 className="text-sm font-semibold text-slate-950">{tradeRemedyCase.caseTitle}</h2>
          </div>
          <button
            aria-label="닫기"
            className="focus-ring grid size-8 place-items-center rounded-md text-slate-700 hover:bg-slate-100"
            onClick={() => dialogRef.current?.close()}
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>
        <div className="p-4 text-sm">
          <dl className="grid grid-cols-[150px_1fr] overflow-hidden rounded-md border border-slate-200">
            <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">대상 HS</dt>
            <dd className="border-b border-slate-200 px-3 py-2 font-mono font-semibold">{formatHsCode(tradeRemedyCase.destinationHsCode)}</dd>
            <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">사건번호</dt>
            <dd className="border-b border-slate-200 px-3 py-2 font-mono font-semibold text-slate-950">{tradeRemedyCase.caseNumber}</dd>
            <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">구분</dt>
            <dd className="border-b border-slate-200 px-3 py-2">{remedyLabel}</dd>
            <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">원산지</dt>
            <dd className="border-b border-slate-200 px-3 py-2">{origin}</dd>
            <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">생산자/수출자</dt>
            <dd className="border-b border-slate-200 px-3 py-2">{displayValue(tradeRemedyCase.producerExporter)}</dd>
            <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">세율</dt>
            <dd className="border-b border-slate-200 px-3 py-2 font-semibold text-rose-700">{displayValue(tradeRemedyCase.rateText)}</dd>
            <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">범위</dt>
            <dd className="border-b border-slate-200 px-3 py-2 leading-6">{displayValue(tradeRemedyCase.scopeSummary)}</dd>
            <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">근거</dt>
            <dd className="border-b border-slate-200 px-3 py-2">{displayValue(tradeRemedyCase.legalBasis)}</dd>
            <dt className="bg-slate-50 px-3 py-2 font-semibold text-slate-600">원문/메모</dt>
            <dd className="whitespace-pre-wrap px-3 py-2 leading-6">{displayValue(tradeRemedyCase.notes)}</dd>
          </dl>
        </div>
      </dialog>
    </>
  );
}
