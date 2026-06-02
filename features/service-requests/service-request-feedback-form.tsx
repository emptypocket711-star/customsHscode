"use client";

import { useActionState, useEffect } from "react";
import { Send } from "lucide-react";
import { submitServiceRequestFeedbackAction } from "@/server/actions/service-request-feedback.actions";
import type { ServiceRequestFeedbackActionState } from "@/features/service-requests/service-request-feedback-schemas";
import type { OwnServiceRequestFeedback } from "@/server/repositories/service-request-feedback.repository";

const feedbackInitialState: ServiceRequestFeedbackActionState = {
  status: "idle"
};

export function ServiceRequestFeedbackForm({
  existingFeedback,
  requestId
}: {
  existingFeedback?: OwnServiceRequestFeedback;
  requestId: string;
}) {
  const [state, action, pending] = useActionState(submitServiceRequestFeedbackAction, feedbackInitialState);

  useEffect(() => {
    if (state.status !== "idle") {
      window.dispatchEvent(new Event("hsfinder:navigation-progress-done"));
    }
  }, [state.status]);

  if (existingFeedback) {
    return (
      <div className="grid gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-emerald-950">완료 요청 피드백 제출됨</p>
            <p className="mt-1 text-xs leading-5 text-emerald-900">
              {existingFeedback.createdAt.slice(0, 10)}에 {existingFeedback.rating}점 피드백을 제출했습니다. 같은 요청에는 회사별로 한 번만 피드백을 남길 수 있습니다.
            </p>
          </div>
          <span className="rounded-md bg-white px-3 py-2 text-xs font-semibold text-emerald-900">
            평점 {existingFeedback.rating}점
          </span>
        </div>
        <p className="rounded-md bg-white p-3 text-xs leading-5 text-emerald-900">
          추가 제출은 필요하지 않습니다. 완료 리포트와 최종 보관 서류 상태만 확인하면 됩니다.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-4">
      <div className="grid gap-1">
        <p className="text-sm font-semibold text-slate-950">완료 요청 피드백</p>
        <p className="text-xs leading-5 text-slate-600">
          거래 품질 지표를 쌓기 위한 최소 피드백입니다. 이 평점은 다음 견적 비교에서 파트너 신뢰 지표로 활용됩니다. 민감 서류 내용, 단가 원문, 개인정보는 입력하지 마세요.
        </p>
      </div>
      <form action={action} className="grid gap-3 md:grid-cols-4">
        <input name="requestId" type="hidden" value={requestId} />
        <label className="grid gap-1 text-xs font-medium text-slate-600">
          전체 평점
          <select className="focus-ring h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950" disabled={pending} name="rating" required>
            <option value="5">5점</option>
            <option value="4">4점</option>
            <option value="3">3점</option>
            <option value="2">2점</option>
            <option value="1">1점</option>
          </select>
        </label>
        <label className="grid gap-1 text-xs font-medium text-slate-600">
          응답 속도
          <select className="focus-ring h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950" disabled={pending} name="responseSpeedScore">
            <option value="">선택 안 함</option>
            <option value="5">5점</option>
            <option value="4">4점</option>
            <option value="3">3점</option>
            <option value="2">2점</option>
            <option value="1">1점</option>
          </select>
        </label>
        <label className="grid gap-1 text-xs font-medium text-slate-600">
          소통
          <select className="focus-ring h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950" disabled={pending} name="communicationScore">
            <option value="">선택 안 함</option>
            <option value="5">5점</option>
            <option value="4">4점</option>
            <option value="3">3점</option>
            <option value="2">2점</option>
            <option value="1">1점</option>
          </select>
        </label>
        <label className="grid gap-1 text-xs font-medium text-slate-600">
          서류 품질
          <select className="focus-ring h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950" disabled={pending} name="documentQualityScore">
            <option value="">선택 안 함</option>
            <option value="5">5점</option>
            <option value="4">4점</option>
            <option value="3">3점</option>
            <option value="2">2점</option>
            <option value="1">1점</option>
          </select>
        </label>
        <label className="grid gap-1 text-xs font-medium text-slate-600 md:col-span-3">
          메모
          <input className="focus-ring h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950" disabled={pending} maxLength={500} name="comment" placeholder="선택 입력, 민감정보 제외" />
        </label>
        <button className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500" disabled={pending} type="submit">
          <Send aria-hidden="true" size={16} />
          {pending ? "제출 중" : "피드백 제출"}
        </button>
        {state.message && state.requestId === requestId ? (
          <p className={state.status === "success" ? "text-sm font-medium text-emerald-800 md:col-span-4" : "text-sm font-medium text-red-700 md:col-span-4"}>
            {state.message}
          </p>
        ) : null}
      </form>
    </div>
  );
}
