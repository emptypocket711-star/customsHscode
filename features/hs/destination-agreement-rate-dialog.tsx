"use client";

import { X } from "lucide-react";
import { useRef } from "react";
import type { DestinationAgreementRateDisplayItem } from "@/features/hs/export-destination-tariff-display";

type DestinationAgreementRateDialogProps = {
  items: DestinationAgreementRateDisplayItem[];
  label: string;
};

function AgreementRateDetailList({ items }: { items: DestinationAgreementRateDisplayItem[] }) {
  return (
    <ul className="grid gap-3">
      {items.map((item) => (
        <li className="overflow-hidden rounded-md border border-slate-200" key={item.sourceKey}>
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2">
            <span className="font-semibold text-slate-950">{item.label}</span>
            <span className="rounded bg-blue-50 px-2 py-0.5 font-semibold text-blue-700">{item.rateText}</span>
          </div>
          <dl className="grid text-sm sm:grid-cols-[130px_1fr]">
            <dt className="border-b border-slate-200 bg-white px-3 py-2 font-semibold text-slate-600">대상</dt>
            <dd className="border-b border-slate-200 px-3 py-2 leading-6">{item.targetSummary}</dd>
            <dt className="bg-white px-3 py-2 font-semibold text-slate-600">확인사항</dt>
            <dd className="px-3 py-2 leading-6">{item.conditionSummary}</dd>
          </dl>
        </li>
      ))}
    </ul>
  );
}

export function DestinationAgreementRateDialog({ items, label }: DestinationAgreementRateDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  if (!items.length) return <span>-</span>;

  return (
    <>
      <button
        className="focus-ring rounded text-left font-medium text-blue-700 underline-offset-2 hover:underline"
        onClick={() => dialogRef.current?.showModal()}
        type="button"
      >
        {label}
      </button>
      <dialog className="w-[min(820px,calc(100vw-32px))] rounded-lg border border-slate-200 p-0 shadow-2xl backdrop:bg-slate-950/45" ref={dialogRef}>
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-950">협정세율 상세</h2>
          <button
            aria-label="닫기"
            className="focus-ring grid size-8 place-items-center rounded-md text-slate-700 hover:bg-slate-100"
            onClick={() => dialogRef.current?.close()}
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>
        <div className="grid gap-3 p-4 text-sm">
          <AgreementRateDetailList items={items} />
        </div>
      </dialog>
    </>
  );
}
