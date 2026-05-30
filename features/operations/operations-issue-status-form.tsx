"use client";

import { useActionState, useState } from "react";
import {
  updateOperationsIssueStatusWithStateAction,
  type OperationsIssueStatusActionState
} from "@/server/actions/operations-issue.actions";
import type {
  OperationsIssueEventItem,
  OperationsIssueStatus
} from "@/server/repositories/operations-issue.repository";

function statusButtonLabel(status: OperationsIssueStatus) {
  if (status === "resolved") return "해결";
  if (status === "ignored") return "제외";
  return "다시 열기";
}

function statusButtonSubLabel(status: OperationsIssueStatus) {
  if (status === "resolved") return "상태를 해결로 변경";
  if (status === "ignored") return "운영 대상에서 제외";
  return "미해결 상태로 재전환";
}

function statusButtonClassName(status: OperationsIssueStatus) {
  if (status === "resolved") {
    return "rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-left text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60";
  }

  if (status === "open") {
    return "rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-left text-xs font-semibold text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60";
  }

  return "rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-left text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60";
}

function statusActionHelp(status: OperationsIssueStatus) {
  if (status === "resolved") return "해결 처리 전 원인, 조치, 재발 방지 여부를 메모와 처리 사유에 남깁니다.";
  if (status === "ignored") return "제외 처리 전 운영 대상에서 제외하는 근거를 처리 사유에 남깁니다.";
  return "다시 열기 전 재확인 사유와 다음 담당 조치를 메모에 남깁니다.";
}

function inputStatusClassName(hasValue: boolean) {
  return hasValue
    ? "rounded-md border border-emerald-100 bg-emerald-50 px-2 py-1 text-emerald-800"
    : "rounded-md border border-amber-100 bg-amber-50 px-2 py-1 text-amber-800";
}

function inputStatusLabel(hasValue: boolean) {
  return hasValue ? "작성됨" : "미입력";
}

const initialOperationsIssueStatusActionState: OperationsIssueStatusActionState = {
  status: "idle",
  message: null,
  nextStep: null
};

type OperationsIssueStatusFormProps = {
  event: Pick<OperationsIssueEventItem, "id" | "status" | "assignedToLabel" | "operatorNote" | "resolutionReason">;
  triageFocus?: {
    reasonLabel: string;
    actionLabel: string;
  } | null;
};

export function OperationsIssueStatusForm({ event, triageFocus }: OperationsIssueStatusFormProps) {
  const [assignedToLabel, setAssignedToLabel] = useState(event.assignedToLabel ?? "");
  const [operatorNote, setOperatorNote] = useState(event.operatorNote ?? "");
  const [resolutionReason, setResolutionReason] = useState(event.resolutionReason ?? "");
  const [state, formAction, pending] = useActionState(
    updateOperationsIssueStatusWithStateAction,
    initialOperationsIssueStatusActionState
  );
  const nextStatuses: OperationsIssueStatus[] = [
    event.status !== "resolved" ? "resolved" : null,
    event.status !== "ignored" ? "ignored" : null,
    event.status !== "open" ? "open" : null
  ].filter((status): status is OperationsIssueStatus => Boolean(status));
  const primaryNextStatus = nextStatuses[0] ?? "resolved";
  const assignedToLabelReady = Boolean(assignedToLabel.trim());
  const operatorNoteReady = Boolean(operatorNote.trim());
  const resolutionReasonReady = Boolean(resolutionReason.trim());

  return (
    <form action={formAction} className="grid min-w-[260px] gap-2">
      <input name="issueId" type="hidden" value={event.id} />
      {triageFocus ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs leading-5 text-amber-900">
          <p className="font-semibold">우선 확인 대상 · {triageFocus.reasonLabel}</p>
          <p className="mt-1">{triageFocus.actionLabel}</p>
          <p className="mt-1 text-amber-800">처리 전 담당자와 메모에 확인 결과를 남깁니다.</p>
        </div>
      ) : null}
      <p className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs leading-5 text-slate-600">
        {statusActionHelp(primaryNextStatus)}
      </p>
      <label className="grid gap-1 text-xs font-semibold text-slate-600">
        담당자
        <input
          className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-normal text-slate-900 outline-none transition focus:border-blue-400 disabled:bg-slate-50 disabled:text-slate-500"
          disabled={pending}
          maxLength={120}
          name="assignedToLabel"
          onChange={(inputEvent) => setAssignedToLabel(inputEvent.currentTarget.value)}
          placeholder="예: 김운영, 플랫폼 운영"
          value={assignedToLabel}
        />
        <span className="font-normal text-slate-500">미입력 시 담당 미지정 이슈로 남습니다.</span>
      </label>
      <label className="grid gap-1 text-xs font-semibold text-slate-600">
        메모
        <textarea
          className="min-h-16 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-normal text-slate-900 outline-none transition focus:border-blue-400 disabled:bg-slate-50 disabled:text-slate-500"
          disabled={pending}
          maxLength={1000}
          name="operatorNote"
          onChange={(inputEvent) => setOperatorNote(inputEvent.currentTarget.value)}
          placeholder="확인한 원인, 후속 작업, 담당자 인계 내용을 기록"
          value={operatorNote}
        />
      </label>
      <label className="grid gap-1 text-xs font-semibold text-slate-600">
        처리 사유
        <textarea
          className="min-h-14 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-normal text-slate-900 outline-none transition focus:border-blue-400 disabled:bg-slate-50 disabled:text-slate-500"
          disabled={pending}
          maxLength={1000}
          name="resolutionReason"
          onChange={(inputEvent) => setResolutionReason(inputEvent.currentTarget.value)}
          placeholder="해결, 제외, 다시 열기 판단 근거"
          value={resolutionReason}
        />
      </label>
      <div className="grid gap-1 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs">
        <p className="font-semibold text-slate-600">저장 전 입력 확인</p>
        <div className="grid gap-1 sm:grid-cols-3">
          <span className={inputStatusClassName(assignedToLabelReady)}>담당자 {inputStatusLabel(assignedToLabelReady)}</span>
          <span className={inputStatusClassName(operatorNoteReady)}>메모 {inputStatusLabel(operatorNoteReady)}</span>
          <span className={inputStatusClassName(resolutionReasonReady)}>처리 사유 {inputStatusLabel(resolutionReasonReady)}</span>
        </div>
        {assignedToLabelReady && operatorNoteReady && resolutionReasonReady ? (
          <p className="text-emerald-700">처리 근거 입력 상태를 확인했습니다.</p>
        ) : (
          <p className="text-amber-700">미입력 항목은 저장은 가능하지만 담당자 인계와 사후 검토 품질이 낮아질 수 있습니다.</p>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {nextStatuses.map((status) => (
          <button
            className={statusButtonClassName(status)}
            disabled={pending}
            key={status}
            name="status"
            type="submit"
            value={status}
          >
            <span className="block">{pending ? "저장 중" : statusButtonLabel(status)}</span>
            <span className="mt-0.5 block text-[11px] font-normal opacity-80">{statusButtonSubLabel(status)}</span>
          </button>
        ))}
      </div>
      {state.message ? (
        <div aria-live="polite" className="grid gap-1">
          <p
            className={state.status === "success"
              ? "rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800"
              : "rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-800"}
          >
            {state.message}
          </p>
          {state.status === "success" && state.nextStep ? (
            <p className="rounded-md border border-blue-100 bg-blue-50 px-2 py-1 text-xs leading-5 text-blue-800">
              {state.nextStep}
            </p>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
