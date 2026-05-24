"use client";

import { Info, X } from "lucide-react";
import { useRef } from "react";
import { importTariffDetailDescription } from "@/features/hs/import-tariff-display";

type TariffRateDetailDialogProps = {
  label: string;
  rateText: string;
  rateType: string;
  priority: string;
  countryGroup: string | null;
  usageRateType: string | null;
  countryCode?: string;
};

function displayValue(value: string | null) {
  return value?.trim() ? value : "-";
}

export function TariffRateDetailDialog({ label, rateText, rateType, priority, countryGroup, usageRateType, countryCode }: TariffRateDetailDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const description = importTariffDetailDescription({ rateType, label }, label, countryCode);

  return (
    <>
      <button
        className="focus-ring inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        onClick={() => dialogRef.current?.showModal()}
        type="button"
      >
        <Info aria-hidden="true" size={13} />
        상세
      </button>
      <dialog className="w-[min(640px,calc(100vw-32px))] rounded-lg border border-slate-200 p-0 shadow-2xl backdrop:bg-slate-950/45" ref={dialogRef}>
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-950">{description.title}</h2>
          <button
            aria-label="닫기"
            className="focus-ring grid size-8 place-items-center rounded-md text-slate-700 hover:bg-slate-100"
            onClick={() => dialogRef.current?.close()}
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>
        <div className="grid gap-4 p-4 text-sm">
          <div className="rounded-md bg-blue-50 p-3">
            <p className="font-semibold text-blue-950">{description.summary}</p>
            <p className="mt-2 leading-6 text-blue-900">{description.detail}</p>
          </div>
          <dl className="grid grid-cols-[120px_1fr] overflow-hidden rounded-md border border-slate-200">
            <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">세율</dt>
            <dd className="border-b border-slate-200 px-3 py-2 font-semibold text-orange-600">{rateText}</dd>
            <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">세율코드</dt>
            <dd className="border-b border-slate-200 px-3 py-2 font-mono">{rateType}</dd>
            <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">적용 순위</dt>
            <dd className="border-b border-slate-200 px-3 py-2">{priority}</dd>
            <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">적용국가구분</dt>
            <dd className="border-b border-slate-200 px-3 py-2">{displayValue(countryGroup)}</dd>
            <dt className="bg-slate-50 px-3 py-2 font-semibold text-slate-600">용도세율구분</dt>
            <dd className="px-3 py-2">{displayValue(usageRateType)}</dd>
          </dl>
        </div>
      </dialog>
    </>
  );
}
