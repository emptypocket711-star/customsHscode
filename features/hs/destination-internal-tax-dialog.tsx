"use client";

import { ReceiptText, X } from "lucide-react";
import { useRef } from "react";
import { formatHsCode } from "@/lib/hs-code";
import type { ExportDestinationInternalTaxItem } from "@/server/repositories/export-destination-import-data.repository";

type DestinationInternalTaxDialogProps = {
  tax: ExportDestinationInternalTaxItem;
};

function displayValue(value?: string | null) {
  return value?.trim() ? value : "-";
}

export function destinationInternalTaxText(tax: ExportDestinationInternalTaxItem) {
  const rateText = tax.rateText ?? "-";
  if (tax.countryCode === "GBR" && tax.taxType === "vat" && rateText.trim().startsWith("0")) {
    return `${tax.taxName}(조건부) ${rateText}`;
  }

  return `${tax.taxName} ${rateText}`;
}

export function DestinationInternalTaxDialog({ tax }: DestinationInternalTaxDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        className="focus-ring inline-flex items-center gap-1 rounded text-left font-semibold text-blue-700 underline-offset-2 hover:underline"
        onClick={() => dialogRef.current?.showModal()}
        type="button"
      >
        <ReceiptText aria-hidden="true" size={14} />
        {destinationInternalTaxText(tax)}
      </button>
      <dialog className="w-[min(700px,calc(100vw-32px))] rounded-lg border border-slate-200 p-0 shadow-2xl backdrop:bg-slate-950/45" ref={dialogRef}>
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <div className="text-xs font-semibold text-slate-500">{tax.taxType}</div>
            <h2 className="text-sm font-semibold text-slate-950">{tax.taxName}</h2>
          </div>
          <button
            aria-label="닫기"
            className="focus-ring grid size-8 place-items-center rounded-md text-slate-500 hover:bg-slate-100"
            onClick={() => dialogRef.current?.close()}
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>
        <div className="grid gap-4 p-4 text-sm">
          <dl className="grid grid-cols-[130px_1fr] overflow-hidden rounded-md border border-slate-200">
            <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">적용 HS</dt>
            <dd className="border-b border-slate-200 px-3 py-2 font-mono font-semibold">{formatHsCode(tax.destinationHsCode)}</dd>
            <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">세율</dt>
            <dd className="border-b border-slate-200 px-3 py-2 font-semibold text-slate-950">{displayValue(tax.rateText)}</dd>
            <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">기준</dt>
            <dd className="border-b border-slate-200 px-3 py-2 leading-6">{displayValue(tax.basis)}</dd>
            <dt className="bg-slate-50 px-3 py-2 font-semibold text-slate-600">비고</dt>
            <dd className="px-3 py-2 leading-6">{displayValue(tax.notes)}</dd>
          </dl>
        </div>
      </dialog>
    </>
  );
}
