"use client";

import { X } from "lucide-react";
import { useRef } from "react";

type ImportRequirementDetailDialogProps = {
  type: string;
  name: string;
  relatedLaw: string;
  agencies: Array<{
    code: string | null;
    name: string;
    contact: {
      phone: string | null;
      email: string | null;
      websiteUrl: string | null;
      note: string | null;
    } | null;
  }>;
  procedureSummary: string | null;
};

function displayValue(value?: string | null) {
  return value?.trim() ? value : "-";
}

function agencyDisplayText(agency: ImportRequirementDetailDialogProps["agencies"][number]) {
  return agency.contact?.websiteUrl?.trim() || agency.name;
}

function AgencyDisplay({ agency }: { agency: ImportRequirementDetailDialogProps["agencies"][number] }) {
  const websiteUrl = agency.contact?.websiteUrl?.trim();

  if (websiteUrl) {
    return (
      <a className="font-semibold text-blue-700 underline-offset-2 hover:underline" href={websiteUrl} rel="noreferrer" target="_blank">
        {websiteUrl}
      </a>
    );
  }

  return <span className="font-semibold text-slate-900">{agencyDisplayText(agency)}</span>;
}

export function ImportRequirementDetailDialog({ type, name, relatedLaw, agencies, procedureSummary }: ImportRequirementDetailDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        className="focus-ring rounded text-left font-semibold text-blue-700 underline-offset-2 hover:underline"
        onClick={() => dialogRef.current?.showModal()}
        type="button"
      >
        {name}
      </button>
      <dialog className="w-[min(720px,calc(100vw-32px))] rounded-lg border border-slate-200 p-0 shadow-2xl backdrop:bg-slate-950/45" ref={dialogRef}>
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-950">{name}</h2>
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
          <dl className="grid grid-cols-[120px_1fr] overflow-hidden rounded-md border border-slate-200">
            <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">구분</dt>
            <dd className="border-b border-slate-200 px-3 py-2">{type}</dd>
            <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">관련법령</dt>
            <dd className="border-b border-slate-200 px-3 py-2">{relatedLaw}</dd>
            <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">내용</dt>
            <dd className="border-b border-slate-200 px-3 py-2 leading-6">{displayValue(procedureSummary)}</dd>
            <dt className="bg-slate-50 px-3 py-2 font-semibold text-slate-600">기관</dt>
            <dd className="px-3 py-2">
              {agencies.length ? (
                <div className="grid gap-2">
                  {agencies.map((agency) => (
                    <div className="rounded-md bg-slate-50 p-2" key={`${agency.code ?? ""}-${agency.name}`}>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <AgencyDisplay agency={agency} />
                        {agency.code ? <span className="rounded bg-white px-1.5 py-0.5 font-mono text-xs text-slate-500">{agency.code}</span> : null}
                      </div>
                      {agency.contact ? (
                        <div className="mt-1 grid gap-1 text-xs leading-5 text-slate-600">
                          {agency.contact.phone ? <span>전화 {agency.contact.phone}</span> : null}
                          {agency.contact.email ? <span>이메일 {agency.contact.email}</span> : null}
                          {agency.contact.note ? <span>{agency.contact.note}</span> : null}
                        </div>
                      ) : (
                        <div className="mt-1 text-xs text-slate-400">연락처 데이터 없음</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                "-"
              )}
            </dd>
          </dl>
        </div>
      </dialog>
    </>
  );
}
