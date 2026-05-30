"use client";

import { useActionState } from "react";
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

const initialOperationsIssueStatusActionState: OperationsIssueStatusActionState = {
  status: "idle",
  message: null
};

type OperationsIssueStatusFormProps = {
  event: Pick<OperationsIssueEventItem, "id" | "status" | "assignedToLabel" | "operatorNote" | "resolutionReason">;
};

export function OperationsIssueStatusForm({ event }: OperationsIssueStatusFormProps) {
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

  return (
    <form action={formAction} className="grid min-w-[260px] gap-2">
      <input name="issueId" type="hidden" value={event.id} />
      <p className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs leading-5 text-slate-600">
        {statusActionHelp(primaryNextStatus)}
      </p>
      <label className="grid gap-1 text-xs font-semibold text-slate-600">
        담당자
        <input
          className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-normal text-slate-900 outline-none transition focus:border-blue-400 disabled:bg-slate-50 disabled:text-slate-500"
          defaultValue={event.assignedToLabel ?? ""}
          disabled={pending}
          maxLength={120}
          name="assignedToLabel"
          placeholder="예: 김운영, 플랫폼 운영"
        />
        <span className="font-normal text-slate-500">미입력 시 담당 미지정 이슈로 남습니다.</span>
      </label>
      <label className="grid gap-1 text-xs font-semibold text-slate-600">
        메모
        <textarea
          className="min-h-16 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-normal text-slate-900 outline-none transition focus:border-blue-400 disabled:bg-slate-50 disabled:text-slate-500"
          defaultValue={event.operatorNote ?? ""}
          disabled={pending}
          maxLength={1000}
          name="operatorNote"
          placeholder="확인한 원인, 후속 작업, 담당자 인계 내용을 기록"
        />
      </label>
      <label className="grid gap-1 text-xs font-semibold text-slate-600">
        처리 사유
        <textarea
          className="min-h-14 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-normal text-slate-900 outline-none transition focus:border-blue-400 disabled:bg-slate-50 disabled:text-slate-500"
          defaultValue={event.resolutionReason ?? ""}
          disabled={pending}
          maxLength={1000}
          name="resolutionReason"
          placeholder="해결, 제외, 다시 열기 판단 근거"
        />
      </label>
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
        <p
          aria-live="polite"
          className={state.status === "success"
            ? "rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800"
            : "rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-800"}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
