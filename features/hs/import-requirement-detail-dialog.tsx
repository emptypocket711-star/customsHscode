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
  playbook: {
    applicationMethod: string | null;
    requiredDocuments: string[];
    expectedLeadTime: string | null;
    exemptionPossibility: string | null;
    commonRejectionReasons: string[];
    customerRequestTemplate: string | null;
    staffChecklist: string[];
    sourceName: string;
    sourceUrl: string;
    sourceVersion: string;
  } | null;
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

function DetailList({ items }: { items: string[] }) {
  if (!items.length) return <span className="text-slate-500">-</span>;

  return (
    <ul className="list-disc space-y-1 pl-5">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export function ImportRequirementDetailDialog({ type, name, relatedLaw, agencies, procedureSummary, playbook }: ImportRequirementDetailDialogProps) {
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
      <dialog className="w-[min(920px,calc(100vw-32px))] rounded-lg border border-slate-200 p-0 shadow-2xl backdrop:bg-slate-950/45" ref={dialogRef}>
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
        <div className="max-h-[78vh] overflow-auto p-4 text-sm">
          <div className="grid gap-4">
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

          {playbook ? (
            <section className="overflow-hidden rounded-md border border-slate-200">
              <div className="border-b border-slate-200 bg-blue-700 px-3 py-2 text-sm font-semibold text-white">법령 상세</div>
              <dl className="grid grid-cols-[140px_1fr] text-sm">
                <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">적용 내용</dt>
                <dd className="border-b border-slate-200 px-3 py-2 leading-6">{displayValue(playbook.applicationMethod)}</dd>
                <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">필요 서류</dt>
                <dd className="border-b border-slate-200 px-3 py-2 leading-6"><DetailList items={playbook.requiredDocuments} /></dd>
                <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">처리/검사</dt>
                <dd className="border-b border-slate-200 px-3 py-2 leading-6">{displayValue(playbook.expectedLeadTime)}</dd>
                <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">대상 제외 가능성</dt>
                <dd className="border-b border-slate-200 px-3 py-2 leading-6">{displayValue(playbook.exemptionPossibility)}</dd>
                <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">주요 보완 사유</dt>
                <dd className="border-b border-slate-200 px-3 py-2 leading-6"><DetailList items={playbook.commonRejectionReasons} /></dd>
                <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">요청 문구</dt>
                <dd className="border-b border-slate-200 px-3 py-2 leading-6">{displayValue(playbook.customerRequestTemplate)}</dd>
                <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">확인 항목</dt>
                <dd className="border-b border-slate-200 px-3 py-2 leading-6"><DetailList items={playbook.staffChecklist} /></dd>
                <dt className="bg-slate-50 px-3 py-2 font-semibold text-slate-600">근거</dt>
                <dd className="px-3 py-2 leading-6">
                  <a className="font-medium text-blue-700 underline-offset-2 hover:underline" href={playbook.sourceUrl} rel="noreferrer" target="_blank">
                    {playbook.sourceName}
                  </a>
                </dd>
              </dl>
            </section>
          ) : (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 leading-6 text-amber-900">
              현행 법령 상세 playbook이 아직 연결되지 않은 요건입니다. 관련법령과 관할기관 기준으로 세부 대상, 예외, 제출서류를 확인해야 합니다.
            </div>
          )}
          </div>
        </div>
      </dialog>
    </>
  );
}
