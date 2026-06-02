"use client";

import { useActionState, useEffect } from "react";
import { FileCheck2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  attachServiceRequestCompletionReportDocumentAction,
  saveServiceRequestCompletionReportAction,
  transitionServiceRequestCompletionReportAction
} from "@/server/actions/service-request-completion-report.actions";
import {
  buildCompletionReportWorkflow,
  type CompletionReportViewerRole
} from "@/features/service-requests/service-request-completion-report-workflow";
import {
  completionReportArchiveGuide,
  completionReportDocumentRoleLabel,
  completionReportDocumentRoleOptions,
  type CompletionReportKind
} from "@/features/service-requests/service-request-completion-report-labels";
import type {
  ServiceRequestCompletionReportActionState,
  ServiceRequestCompletionReportDocumentActionState,
  ServiceRequestCompletionReportTransitionActionState
} from "@/features/service-requests/service-request-completion-report-schemas";
import type {
  ServiceRequestCompletionReport,
  ServiceRequestCompletionReportDocument
} from "@/server/repositories/service-request-completion-report.repository";

const reportInitialState: ServiceRequestCompletionReportActionState = {
  status: "idle"
};

const documentInitialState: ServiceRequestCompletionReportDocumentActionState = {
  status: "idle"
};

const transitionInitialState: ServiceRequestCompletionReportTransitionActionState = {
  status: "idle"
};

type CompletionReportSourceDocument = {
  documentId: string;
  documentType: string;
  fileName: string;
  visibility: string;
};

function reportStatusLabel(status?: string) {
  if (!status) return "미작성";
  if (status === "draft") return "초안";
  if (status === "submitted") return "제출";
  if (status === "requester_acknowledged") return "화주 확인";
  if (status === "partner_acknowledged") return "파트너 확인";
  if (status === "operator_reviewed") return "운영 검토";
  if (status === "locked") return "잠금";
  return status;
}

function documentTypeLabel(type: string) {
  if (type === "commercial_invoice") return "Commercial Invoice";
  if (type === "packing_list") return "Packing List";
  if (type === "bill_of_lading") return "B/L";
  if (type === "air_waybill") return "AWB";
  if (type === "certificate_of_origin") return "C/O";
  if (type === "catalog") return "카탈로그";
  if (type === "spec_sheet") return "사양서";
  return type;
}

function visibilityLabel(visibility: string) {
  if (visibility === "requester_only") return "화주·운영자";
  if (visibility === "matched_partner_after_interest") return "매칭 파트너";
  if (visibility === "selected_partner") return "선정 파트너";
  if (visibility === "operator_only") return "운영자";
  return visibility;
}

export function ServiceRequestCompletionReportPanel({
  documents = [],
  kind,
  report,
  reportDocuments = [],
  requestId,
  viewerRole = "requester"
}: {
  documents?: CompletionReportSourceDocument[];
  kind: CompletionReportKind;
  report?: ServiceRequestCompletionReport;
  reportDocuments?: ServiceRequestCompletionReportDocument[];
  requestId: string;
  viewerRole?: CompletionReportViewerRole;
}) {
  const [state, action, pending] = useActionState(saveServiceRequestCompletionReportAction, reportInitialState);
  const [documentState, documentAction, documentPending] = useActionState(attachServiceRequestCompletionReportDocumentAction, documentInitialState);
  const [transitionState, transitionAction, transitionPending] = useActionState(transitionServiceRequestCompletionReportAction, transitionInitialState);
  const copy = completionReportArchiveGuide[kind];
  const currentStatus = state.status === "success" && state.reportId ? "draft" : report?.status;
  const activeReportId = state.status === "success" && state.reportId ? state.reportId : report?.reportId;
  const sourceDocumentsById = new Map(documents.map((document) => [document.documentId, document]));
  const requiredDocumentCount = Math.max(reportDocuments.filter((document) => document.requiredForArchive).length, 1);
  const workflowSteps = buildCompletionReportWorkflow({
    hasReport: Boolean(activeReportId),
    linkedDocumentCount: reportDocuments.length,
    requiredDocumentCount,
    status: currentStatus,
    viewerRole
  });

  useEffect(() => {
    if (state.status !== "idle" || documentState.status !== "idle" || transitionState.status !== "idle") {
      window.dispatchEvent(new Event("hsfinder:navigation-progress-done"));
    }
  }, [documentState.status, state.status, transitionState.status]);

  return (
    <section className="grid gap-3 rounded-md border border-slate-200 bg-white p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-950">
            <FileCheck2 aria-hidden="true" size={16} />
            {copy.title}
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-600">
            완료된 거래의 정산 요약과 최종 보관 서류를 묶는 초안입니다. 통관 결과는 실제 신고 결과와 예비 조회 출처를 구분해 기록합니다.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {activeReportId ? (
            <Link
              className="focus-ring inline-flex h-8 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              href={`/requests/${kind}/${requestId}/completion-report/preview`}
            >
              미리보기
            </Link>
          ) : null}
          <Badge tone={currentStatus ? "info" : "neutral"}>{reportStatusLabel(currentStatus)}</Badge>
        </div>
      </div>

      <div className="grid gap-2 text-xs leading-5 text-slate-600 md:grid-cols-3">
        <p className="rounded-md bg-slate-50 p-2">보관 서류: {copy.documents}</p>
        <p className="rounded-md bg-slate-50 p-2">정산: {copy.amountLabel}와 세부 항목을 원문 없이 요약합니다.</p>
        <p className="rounded-md bg-slate-50 p-2">출처: 요청, 선정 견적, 조회 snapshot, 실제 업무 결과를 분리합니다.</p>
      </div>

      <div className="grid gap-2 rounded-md border border-blue-100 bg-blue-50 p-3 text-xs leading-5 text-blue-950 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <p className="font-semibold">완료 후 다음 행동</p>
          <p className="mt-1">
            먼저 완료 리포트 초안을 저장하고, 요청 서류를 최종 보관 역할로 연결한 뒤 제출·확인·운영 검토·잠금 순서로 마감합니다.
          </p>
        </div>
        {!activeReportId ? (
          <a className="focus-ring inline-flex h-8 items-center justify-center rounded-md bg-blue-700 px-3 text-xs font-semibold text-white hover:bg-blue-800" href="#completion-report-draft">
            초안 작성으로 이동
          </a>
        ) : null}
      </div>

      {report ? (
        <div className="grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600 md:grid-cols-3">
          <span>상태 {reportStatusLabel(report.status)}</span>
          <span>금액 {report.currency && report.finalAmount !== null ? `${report.currency} ${report.finalAmount.toLocaleString("ko-KR")}` : "-"}</span>
          <span>수정 {report.updatedAt.slice(0, 10)}</span>
          {report.summary ? <p className="md:col-span-3">{report.summary}</p> : null}
        </div>
      ) : null}

      <div className="grid gap-3 rounded-md border border-blue-100 bg-blue-50 p-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-blue-950">제출·확인 진행</p>
            <p className="mt-1 text-xs leading-5 text-blue-900">
              초안, 보관 서류, 제출, 확인, 운영 검토, 잠금 순서로 완료 기록을 확정합니다. 잠금 전까지는 보관 서류와 완료 요약을 다시 확인해야 합니다.
            </p>
          </div>
          <Badge tone={currentStatus === "locked" ? "success" : currentStatus ? "info" : "neutral"}>{reportStatusLabel(currentStatus)}</Badge>
        </div>
        <div className="grid gap-2 md:grid-cols-5">
          {workflowSteps.map((step) => (
            <div className="grid gap-2 rounded-md bg-white p-3 text-xs leading-5 text-slate-600" key={step.label}>
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-slate-950">{step.label}</span>
                <Badge tone={step.state === "done" ? "success" : step.state === "current" ? "warning" : step.state === "blocked" ? "warning" : "neutral"}>
                  {step.state === "done" ? "완료" : step.state === "current" ? "다음" : step.state === "blocked" ? "대기" : "예정"}
                </Badge>
              </div>
              <p>{step.description}</p>
              {activeReportId && step.state === "current" && step.label === "리포트 제출" ? (
                <form action={transitionAction}>
                  <input name="reportId" type="hidden" value={activeReportId} />
                  <input name="requestId" type="hidden" value={requestId} />
                  <input name="requestType" type="hidden" value={kind} />
                  <input name="transition" type="hidden" value="submit" />
                  <button className="focus-ring inline-flex h-8 w-full items-center justify-center rounded-md bg-blue-700 px-2 text-xs font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-500" disabled={transitionPending} type="submit">
                    {transitionPending ? "처리 중" : "리포트 제출"}
                  </button>
                </form>
              ) : activeReportId && step.state === "current" && (step.label === "화주 확인" || step.label === "파트너 확인") ? (
                <form action={transitionAction}>
                  <input name="acknowledgeRole" type="hidden" value={viewerRole === "partner" ? "partner" : "requester"} />
                  <input name="reportId" type="hidden" value={activeReportId} />
                  <input name="requestId" type="hidden" value={requestId} />
                  <input name="requestType" type="hidden" value={kind} />
                  <input name="transition" type="hidden" value="acknowledge" />
                  <button className="focus-ring inline-flex h-8 w-full items-center justify-center rounded-md bg-blue-700 px-2 text-xs font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-500" disabled={transitionPending} type="submit">
                    {transitionPending ? "처리 중" : step.label}
                  </button>
                </form>
              ) : activeReportId && viewerRole === "staff" && step.state === "current" && step.label === "운영 검토" ? (
                <form action={transitionAction}>
                  <input name="reportId" type="hidden" value={activeReportId} />
                  <input name="requestId" type="hidden" value={requestId} />
                  <input name="requestType" type="hidden" value={kind} />
                  <input name="transition" type="hidden" value="review" />
                  <button className="focus-ring inline-flex h-8 w-full items-center justify-center rounded-md bg-blue-700 px-2 text-xs font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-500" disabled={transitionPending} type="submit">
                    {transitionPending ? "처리 중" : "운영 검토"}
                  </button>
                </form>
              ) : activeReportId && viewerRole === "staff" && step.state === "current" && step.label === "보관 잠금" ? (
                <form action={transitionAction}>
                  <input name="reportId" type="hidden" value={activeReportId} />
                  <input name="requestId" type="hidden" value={requestId} />
                  <input name="requestType" type="hidden" value={kind} />
                  <input name="transition" type="hidden" value="lock" />
                  <button className="focus-ring inline-flex h-8 w-full items-center justify-center rounded-md bg-blue-700 px-2 text-xs font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-500" disabled={transitionPending} type="submit">
                    {transitionPending ? "처리 중" : "보관 잠금"}
                  </button>
                </form>
              ) : (
                <button className="focus-ring inline-flex h-8 items-center justify-center rounded-md border border-slate-300 bg-slate-50 px-2 text-xs font-semibold text-slate-500 disabled:cursor-not-allowed" disabled type="button">
                  {step.disabledReason ?? "상태 확인 완료"}
                </button>
              )}
            </div>
          ))}
        </div>
        {transitionState.message && transitionState.requestId === requestId ? (
          <p className={transitionState.status === "success" ? "rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800" : "rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"}>
            {transitionState.message}
          </p>
        ) : null}
        <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
          잠금 후에는 완료 리포트와 보관 서류 연결을 수정할 수 없습니다. 통관 결과에 HS/FTA/요건 내용이 포함되면 신고 결과 기준과 예비 조회 출처를 분리해 표시해야 합니다.
        </p>
      </div>

      <div className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-slate-900">최종 보관 서류</p>
          <Badge tone={reportDocuments.length > 0 ? "success" : "neutral"}>{reportDocuments.length}건</Badge>
        </div>
        {reportDocuments.length > 0 ? (
          <div className="grid gap-2">
            {reportDocuments.map((mapping) => {
              const document = sourceDocumentsById.get(mapping.requestDocumentId);
              return (
                <p className="rounded-md bg-white p-2 text-xs leading-5 text-slate-600" key={mapping.mappingId}>
                  <span className="font-semibold text-slate-950">{completionReportDocumentRoleLabel(kind, mapping.documentRole)}</span>
                  {" · "}
                  {document ? `${documentTypeLabel(document.documentType)} / ${document.fileName}` : "요청 서류"}
                  {mapping.requiredForArchive ? " · 필수" : ""}
                </p>
              );
            })}
          </div>
        ) : (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
            <p className="font-semibold">최종 보관 서류 연결이 필요합니다.</p>
            <p className="mt-1">
              완료 리포트 초안만으로는 거래 보관 기록이 완성되지 않습니다. 요청 서류를 첨부한 뒤 {copy.documents} 역할로 연결하고 제출 단계로 넘어가세요.
            </p>
          </div>
        )}
        {activeReportId ? (
          <details className="rounded-md border border-slate-200 bg-white" open={reportDocuments.length === 0}>
            <summary className="cursor-pointer list-none px-3 py-2 text-sm font-semibold text-slate-800">
              요청 서류를 보관 서류로 연결
            </summary>
            {documents.length > 0 ? (
              <form action={documentAction} className="grid gap-3 border-t border-slate-200 p-3 md:grid-cols-[1fr_180px_auto] md:items-end">
                <input name="reportId" type="hidden" value={activeReportId} />
                <input name="requestId" type="hidden" value={requestId} />
                <input name="requestType" type="hidden" value={kind} />
                <label className="grid gap-1 text-xs font-semibold text-slate-600">
                  요청 서류
                  <select className="focus-ring h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950" disabled={documentPending} name="requestDocumentId" required>
                    {documents.map((document) => (
                      <option key={document.documentId} value={document.documentId}>
                        {documentTypeLabel(document.documentType)} / {document.fileName} / {visibilityLabel(document.visibility)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1 text-xs font-semibold text-slate-600">
                  보관 역할
                  <select className="focus-ring h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950" disabled={documentPending} name="documentRole" required>
                    {completionReportDocumentRoleOptions[kind].map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <button className="focus-ring inline-flex h-10 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500" disabled={documentPending} type="submit">
                  {documentPending ? "연결 중" : "서류 연결"}
                </button>
                <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 md:col-span-3">
                  <input className="size-4 rounded border-slate-300" disabled={documentPending} name="requiredForArchive" type="checkbox" />
                  완료 리포트 잠금 전 반드시 포함해야 하는 서류로 표시
                </label>
              </form>
            ) : (
              <p className="border-t border-slate-200 p-3 text-xs leading-5 text-slate-600">
                먼저 요청 상세의 첨부 서류 영역에서 요청 서류를 추가해야 완료 리포트 보관 서류로 연결할 수 있습니다. 서류가 없는 거래는 리포트 제출 전 최종 보관 근거가 부족합니다.
              </p>
            )}
          </details>
        ) : (
          <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
            완료 리포트 초안을 먼저 저장해야 요청 서류를 최종 보관 역할로 연결할 수 있습니다. 초안 저장 후 {copy.documents} 역할을 최소 1건 이상 연결하세요.
          </p>
        )}
        {documentState.message && documentState.requestId === requestId ? (
          <p className={documentState.status === "success" ? "rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800" : "rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"}>
            {documentState.message}
          </p>
        ) : null}
      </div>

      <details className="scroll-mt-6 rounded-md border border-slate-200 bg-slate-50" id="completion-report-draft" open={!report}>
        <summary className="cursor-pointer list-none px-3 py-2 text-sm font-semibold text-slate-800">
          {report ? "완료 리포트 초안 수정" : "완료 리포트 초안 작성"}
        </summary>
        <form action={action} className="grid gap-3 border-t border-slate-200 p-3 md:grid-cols-[160px_160px_1fr_auto] md:items-end">
          <input name="requestId" type="hidden" value={requestId} />
          <input name="requestType" type="hidden" value={kind} />
          <label className="grid gap-1 text-xs font-semibold text-slate-600">
            통화
            <input className="focus-ring h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950" defaultValue={report?.currency ?? ""} disabled={pending} name="currency" placeholder="KRW" />
          </label>
          <label className="grid gap-1 text-xs font-semibold text-slate-600">
            최종 금액
            <input className="focus-ring h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950" defaultValue={report?.finalAmount ?? ""} disabled={pending} inputMode="numeric" name="finalAmount" placeholder="0" />
          </label>
          <label className="grid gap-1 text-xs font-semibold text-slate-600">
            완료 요약
            <input className="focus-ring h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950" defaultValue={report?.summary ?? ""} disabled={pending} name="summary" placeholder="민감 원문 없이 완료 결과를 요약" />
          </label>
          <button className="focus-ring inline-flex h-10 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500" disabled={pending} type="submit">
            {pending ? "저장 중" : "초안 저장"}
          </button>
        </form>
      </details>
      {state.message && state.requestId === requestId ? (
        <p className={state.status === "success" ? "rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800" : "rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"}>
          {state.message}
        </p>
      ) : null}
    </section>
  );
}
