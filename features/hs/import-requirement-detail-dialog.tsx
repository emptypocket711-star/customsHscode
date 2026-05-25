"use client";

import { Clipboard, X } from "lucide-react";
import type { ReactNode } from "react";
import { useRef, useState } from "react";

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
    category: string | null;
    riskLevel: string | null;
    workflowType: string | null;
    workflowSteps: string[];
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

type RequirementDetailTab = "summary" | "workflow" | "documents" | "supplement" | "agencies" | "request";

const tabs: Array<{ key: RequirementDetailTab; label: string }> = [
  { key: "summary", label: "일반안내" },
  { key: "workflow", label: "처리흐름" },
  { key: "documents", label: "필요서류" },
  { key: "supplement", label: "보완사유" },
  { key: "agencies", label: "기관문의" },
  { key: "request", label: "요청문구" }
];

function FieldRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-2 border-b border-slate-100 px-3 py-3 last:border-b-0 sm:grid-cols-[140px_1fr]">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="leading-6 text-slate-800">{children}</div>
    </div>
  );
}

function riskLabel(value?: string | null) {
  if (value === "high") return "높음";
  if (value === "medium") return "중간";
  if (value === "low") return "낮음";
  return "-";
}

function riskClassName(value?: string | null) {
  if (value === "high") return "bg-rose-50 text-rose-700 ring-rose-200";
  if (value === "medium") return "bg-amber-50 text-amber-800 ring-amber-200";
  if (value === "low") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  return "bg-slate-100 text-slate-600 ring-slate-200";
}

function WorkflowSteps({ steps }: { steps: string[] }) {
  if (!steps.length) return <span className="text-slate-500">-</span>;

  return (
    <ol className="grid gap-2">
      {steps.map((step, index) => (
        <li className="flex gap-3 rounded-md border border-slate-200 bg-white p-3" key={`${index}-${step}`}>
          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-blue-700 text-xs font-semibold text-white">{index + 1}</span>
          <span className="leading-6 text-slate-800">{step}</span>
        </li>
      ))}
    </ol>
  );
}

function TabButton({
  active,
  children,
  onClick
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className={[
        "focus-ring whitespace-nowrap border-b-2 px-3 py-2 text-sm font-semibold transition",
        active ? "border-blue-700 text-blue-700" : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-900"
      ].join(" ")}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function AgenciesPanel({ agencies }: { agencies: ImportRequirementDetailDialogProps["agencies"] }) {
  if (!agencies.length) {
    return <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-slate-500">기관 데이터가 없습니다.</div>;
  }

  return (
    <div className="grid gap-2">
      {agencies.map((agency) => (
        <div className="rounded-md border border-slate-200 bg-white p-3" key={`${agency.code ?? ""}-${agency.name}`}>
          <div className="flex flex-wrap items-center gap-1.5">
            <AgencyDisplay agency={agency} />
            {agency.code ? <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-500">{agency.code}</span> : null}
          </div>
          {agency.contact ? (
            <div className="mt-2 grid gap-1 text-xs leading-5 text-slate-600">
              {agency.contact.phone ? <span>전화 {agency.contact.phone}</span> : null}
              {agency.contact.email ? <span>이메일 {agency.contact.email}</span> : null}
              {agency.contact.note ? <span>{agency.contact.note}</span> : null}
            </div>
          ) : (
            <div className="mt-2 text-xs text-slate-400">연락처 데이터 없음</div>
          )}
        </div>
      ))}
    </div>
  );
}

export function ImportRequirementDetailDialog({ type, name, relatedLaw, agencies, procedureSummary, playbook }: ImportRequirementDetailDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [activeTab, setActiveTab] = useState<RequirementDetailTab>("summary");

  async function copyRequestTemplate() {
    const text = playbook?.customerRequestTemplate?.trim();
    if (!text) return;
    await navigator.clipboard.writeText(text);
  }

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
        <div className="max-h-[78vh] overflow-auto text-sm">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div className="grid gap-2 sm:grid-cols-3">
              <div>
                <div className="text-xs font-semibold text-slate-500">구분</div>
                <div className="mt-1 font-semibold text-slate-900">{type}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500">관련법령</div>
                <div className="mt-1 font-semibold text-slate-900">{relatedLaw}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500">기관</div>
                <div className="mt-1 font-semibold text-slate-900">{agencies.length ? `${agencies.length}개 기관` : "-"}</div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto border-b border-slate-200 px-2">
            <div className="flex min-w-max gap-1">
              {tabs.map((tab) => (
                <TabButton active={activeTab === tab.key} key={tab.key} onClick={() => setActiveTab(tab.key)}>
                  {tab.label}
                </TabButton>
              ))}
            </div>
          </div>

          <div className="p-4">
            {activeTab === "summary" ? (
              <section className="overflow-hidden rounded-md border border-slate-200">
                <FieldRow label="분류">
                  <div className="flex flex-wrap gap-1.5">
                    <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-200">
                      {displayValue(playbook?.category)}
                    </span>
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                      {displayValue(playbook?.workflowType)}
                    </span>
                    <span className={["rounded px-2 py-0.5 text-xs font-semibold ring-1", riskClassName(playbook?.riskLevel)].join(" ")}>
                      위험도 {riskLabel(playbook?.riskLevel)}
                    </span>
                  </div>
                </FieldRow>
                <FieldRow label="요건 내용">{displayValue(procedureSummary)}</FieldRow>
                <FieldRow label="적용 내용">{displayValue(playbook?.applicationMethod)}</FieldRow>
                <FieldRow label="처리/검사">{displayValue(playbook?.expectedLeadTime)}</FieldRow>
                <FieldRow label="대상 제외 가능성">{displayValue(playbook?.exemptionPossibility)}</FieldRow>
                <FieldRow label="근거">
                  {playbook ? (
                    <a className="font-medium text-blue-700 underline-offset-2 hover:underline" href={playbook.sourceUrl} rel="noreferrer" target="_blank">
                      {playbook.sourceName}
                    </a>
                  ) : (
                    "-"
                  )}
                </FieldRow>
              </section>
            ) : null}

            {activeTab === "workflow" ? (
              <section className="overflow-hidden rounded-md border border-slate-200">
                <FieldRow label="처리 흐름"><WorkflowSteps steps={playbook?.workflowSteps ?? []} /></FieldRow>
              </section>
            ) : null}

            {activeTab === "documents" ? (
              <section className="overflow-hidden rounded-md border border-slate-200">
                <FieldRow label="필요 서류"><DetailList items={playbook?.requiredDocuments ?? []} /></FieldRow>
                <FieldRow label="확인 항목"><DetailList items={playbook?.staffChecklist ?? []} /></FieldRow>
              </section>
            ) : null}

            {activeTab === "supplement" ? (
              <section className="overflow-hidden rounded-md border border-slate-200">
                <FieldRow label="주요 보완 사유"><DetailList items={playbook?.commonRejectionReasons ?? []} /></FieldRow>
              </section>
            ) : null}

            {activeTab === "agencies" ? <AgenciesPanel agencies={agencies} /> : null}

            {activeTab === "request" ? (
              <section className="grid gap-3">
                <div className="rounded-md border border-slate-200 bg-white p-3 leading-6 text-slate-800">
                  {displayValue(playbook?.customerRequestTemplate)}
                </div>
                <button
                  className="focus-ring inline-flex w-fit items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!playbook?.customerRequestTemplate?.trim()}
                  onClick={copyRequestTemplate}
                  type="button"
                >
                  <Clipboard aria-hidden="true" size={16} />
                  요청문구 복사
                </button>
              </section>
            ) : null}

            {!playbook ? (
              <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 leading-6 text-amber-900">
                현행 법령 상세 playbook이 아직 연결되지 않은 요건입니다. 관련법령과 관할기관 기준으로 세부 대상, 예외, 제출서류를 확인해야 합니다.
              </div>
            ) : null}
          </div>
        </div>
      </dialog>
    </>
  );
}
