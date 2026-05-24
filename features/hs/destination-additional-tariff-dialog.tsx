"use client";

import { X } from "lucide-react";
import { useRef } from "react";
import { exportCountryLabel } from "@/features/export-diagnosis/country-options";
import { formatHsCode } from "@/lib/hs-code";
import type { ExportDestinationAdditionalTariffItem } from "@/server/repositories/export-destination-import-data.repository";

type DestinationAdditionalTariffDialogProps = {
  tariff: ExportDestinationAdditionalTariffItem;
};

export function DestinationAdditionalTariffDialog({ tariff }: DestinationAdditionalTariffDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const origin = tariff.originCountryCode ? exportCountryLabel(tariff.originCountryCode) : "공통";
  const applicabilityLabel = tariff.tariffProgram.includes("Section 232") ? "조건 확인" : "조건부";

  return (
    <>
      <button
        className="focus-ring inline-flex max-w-full flex-wrap items-center gap-1 rounded text-left font-semibold text-rose-700 underline-offset-2 hover:underline"
        onClick={() => dialogRef.current?.showModal()}
        type="button"
      >
        <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[11px] text-rose-700">{applicabilityLabel}</span>
        <span>{origin} {tariff.tariffProgram}</span>
        <span className="font-mono">{tariff.additionalTariffCode}</span>
        <span>{tariff.rateText ?? "-"}</span>
      </button>
      <dialog className="w-[min(820px,calc(100vw-32px))] rounded-lg border border-slate-200 p-0 shadow-2xl backdrop:bg-slate-950/45" ref={dialogRef}>
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-950">추가관세 상세</h2>
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
            <dd className="border-b border-slate-200 px-3 py-2 font-mono font-semibold">{formatHsCode(tariff.destinationHsCode)}</dd>
            <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">Chapter 99</dt>
            <dd className="border-b border-slate-200 px-3 py-2 font-mono font-semibold text-slate-950">{tariff.additionalTariffCode}</dd>
            <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">구분</dt>
            <dd className="border-b border-slate-200 px-3 py-2">{tariff.tariffProgram}</dd>
            <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">원산지</dt>
            <dd className="border-b border-slate-200 px-3 py-2">{origin}</dd>
            <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">세율</dt>
            <dd className="border-b border-slate-200 px-3 py-2 font-semibold text-rose-700">{tariff.rateText ?? "-"}</dd>
            <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">조건</dt>
            <dd className="border-b border-slate-200 px-3 py-2 leading-6">{tariff.conditionSummary ?? "-"}</dd>
            <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">근거</dt>
            <dd className="border-b border-slate-200 px-3 py-2">{tariff.legalBasis ?? "-"}</dd>
            <dt className="bg-slate-50 px-3 py-2 font-semibold text-slate-600">원문/메모</dt>
            <dd className="whitespace-pre-wrap px-3 py-2 leading-6">{tariff.notes ?? "-"}</dd>
          </dl>
        </div>
      </dialog>
    </>
  );
}
