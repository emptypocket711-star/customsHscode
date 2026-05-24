"use client";

import { X } from "lucide-react";
import { useRef } from "react";
import type {
  ExportDestinationImportRequirementItem,
  ExportDestinationInternalTaxItem
} from "@/server/repositories/export-destination-import-data.repository";
import { DestinationImportRequirementDialog } from "@/features/hs/destination-import-requirement-dialog";
import { DestinationInternalTaxDialog } from "@/features/hs/destination-internal-tax-dialog";

type DestinationTariffDetailDialogProps = {
  countryLabel: string;
  koreanHs6: string;
  destinationHsCode: string;
  productName: string;
  baseRateText: string | null;
  agreementRates: Record<string, string>;
  internalTaxes: ExportDestinationInternalTaxItem[];
  requirements: ExportDestinationImportRequirementItem[];
  tariffYear: number;
};

function agreementRateText(agreementRates: Record<string, string>) {
  const entries = Object.entries(agreementRates);

  if (!entries.length) return "-";

  return entries.map(([name, rate]) => `${name}: ${rate}`).join(" / ");
}

function isAdditionalTariff(name: string) {
  return name.includes("추가관세") || name.includes("Chapter 99");
}

function isDisplayAgreement(name: string) {
  if (isAdditionalTariff(name)) return false;
  if (name === "미국 HTS 주석") return false;
  if (name === "Column 2 duty") return false;
  if (name.startsWith("Non preferential duty")) return false;
  return true;
}

export function DestinationTariffDetailDialog({
  countryLabel,
  koreanHs6,
  destinationHsCode,
  productName,
  baseRateText,
  agreementRates,
  internalTaxes,
  requirements,
  tariffYear
}: DestinationTariffDetailDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        className="focus-ring rounded text-left font-mono font-semibold text-blue-700 underline-offset-2 hover:underline"
        onClick={() => dialogRef.current?.showModal()}
        type="button"
      >
        {destinationHsCode}
      </button>
      <dialog className="w-[min(760px,calc(100vw-32px))] rounded-lg border border-slate-200 p-0 shadow-2xl backdrop:bg-slate-950/45" ref={dialogRef}>
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-950">상대국 수입 HS 상세</h2>
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
          <dl className="grid grid-cols-[150px_1fr] overflow-hidden rounded-md border border-slate-200">
            <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">국가</dt>
            <dd className="border-b border-slate-200 px-3 py-2">{countryLabel}</dd>
            <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">한국 HS6</dt>
            <dd className="border-b border-slate-200 px-3 py-2 font-mono font-semibold">{koreanHs6}</dd>
            <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">상대국 HS CODE</dt>
            <dd className="border-b border-slate-200 px-3 py-2 font-mono font-semibold text-slate-950">{destinationHsCode}</dd>
            <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">품명</dt>
            <dd className="border-b border-slate-200 px-3 py-2">{productName}</dd>
            <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">기본세율</dt>
            <dd className="border-b border-slate-200 px-3 py-2 font-semibold text-orange-600">{baseRateText ?? "-"}</dd>
            <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">협정세율</dt>
            <dd className="border-b border-slate-200 px-3 py-2 leading-6">
              {agreementRateText(Object.fromEntries(Object.entries(agreementRates).filter(([name]) => isDisplayAgreement(name))))}
            </dd>
            <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">추가관세</dt>
            <dd className="border-b border-slate-200 px-3 py-2 leading-6 text-rose-700">
              {agreementRateText(Object.fromEntries(Object.entries(agreementRates).filter(([name]) => isAdditionalTariff(name))))}
            </dd>
            <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">내국세</dt>
            <dd className="border-b border-slate-200 px-3 py-2">
              {internalTaxes.length ? (
                <ul className="grid gap-2">
                  {internalTaxes.map((tax) => (
                    <li key={`${tax.countryCode}-${tax.destinationHsCode}-${tax.taxType}-${tax.taxName}`}>
                      <DestinationInternalTaxDialog tax={tax} />
                      {tax.basis ? <span className="text-slate-500"> / {tax.basis}</span> : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-slate-500">표시할 상대국 내국세 데이터가 없습니다.</span>
              )}
            </dd>
            <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">수입요건</dt>
            <dd className="border-b border-slate-200 px-3 py-2">
              {requirements.length ? (
                <ul className="grid gap-2">
                  {requirements.map((requirement) => (
                    <li key={`${requirement.countryCode}-${requirement.destinationHsCode}-${requirement.requirementType}-${requirement.requirementName}`}>
                      <DestinationImportRequirementDialog requirement={requirement} />
                      <div className="text-slate-600">
                        {[requirement.agency, requirement.legalBasis].filter(Boolean).join(" / ")}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-slate-500">표시할 상대국 수입요건 데이터가 없습니다.</span>
              )}
            </dd>
            <dt className="bg-slate-50 px-3 py-2 font-semibold text-slate-600">자료연도</dt>
            <dd className="px-3 py-2">{tariffYear}년</dd>
          </dl>
        </div>
      </dialog>
    </>
  );
}
