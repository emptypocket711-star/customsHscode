"use client";

import { useActionState, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, FileCheck2, FileUp, Save } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import {
  marketplacePrefilledProductSummary,
  marketplacePrefilledTitle,
  marketplaceRequestPrefillFromSearchParams
} from "@/features/service-requests/marketplace-request-prefill";
import { MarketplacePrefillSourcePanel } from "@/features/service-requests/marketplace-prefill-source-panel";
import { OverseasPartnerRequestHint } from "@/features/service-requests/overseas-partner-request-hint";
import { PartnerOpportunityFlowPanel } from "@/features/service-requests/partner-opportunity-flow-panel";
import { RequestDraftReadinessPanel } from "@/features/service-requests/request-draft-readiness-panel";
import { SelectedPartnerDocumentHandoff } from "@/features/service-requests/selected-partner-document-handoff";
import { ServiceRequestCompletionReportPanel } from "@/features/service-requests/service-request-completion-report-panel";
import { ServiceRequestFeedbackForm } from "@/features/service-requests/service-request-feedback-form";
import {
  answerClearanceRequestQuestionAction,
  askClearanceRequestQuestionAction,
  completeSelectedClearanceRequestAction,
  createClearanceRequestDraftAction,
  publishClearanceRequestAction,
  selectClearanceBidAction,
  startSelectedClearanceRequestAction,
  submitClearanceBidAction,
  uploadClearanceRequestDocumentAction
} from "@/server/actions/clearance-requests.actions";
import type {
  ClearanceBidSelectActionState,
  ClearanceBidSubmitActionState,
  ClearanceRequestPublishActionState
} from "@/features/service-requests/clearance-bid-schemas";
import type { ClearanceRequestDocumentUploadActionState } from "@/features/service-requests/clearance-request-document-schemas";
import type { ClearanceRequestQuestionActionState } from "@/features/service-requests/clearance-request-question-schemas";
import type { ClearanceRequestDraftActionState } from "@/features/service-requests/clearance-request-schemas";
import type { ServiceRequestLifecycleActionState } from "@/features/service-requests/service-request-lifecycle-schemas";
import type {
  ClearanceOpportunityItem,
  ClearanceRequestDocumentItem,
  ClearanceRequestQuestionItem,
  ClearanceRequestListItem,
  ReceivedClearanceBidItem
} from "@/server/repositories/clearance-requests.repository";
import type {
  ServiceRequestCompletionReport,
  ServiceRequestCompletionReportDocument
} from "@/server/repositories/service-request-completion-report.repository";
import type { OwnServiceRequestFeedback } from "@/server/repositories/service-request-feedback.repository";

const initialState: ClearanceRequestDraftActionState = {
  status: "idle"
};

const publishInitialState: ClearanceRequestPublishActionState = {
  status: "idle"
};

const bidInitialState: ClearanceBidSubmitActionState = {
  status: "idle"
};

const selectBidInitialState: ClearanceBidSelectActionState = {
  status: "idle"
};

const lifecycleInitialState: ServiceRequestLifecycleActionState = {
  status: "idle"
};

const documentUploadInitialState: ClearanceRequestDocumentUploadActionState = {
  status: "idle"
};

const questionInitialState: ClearanceRequestQuestionActionState = {
  status: "idle"
};

const clearanceDraftReadinessFields = [
  "title",
  "productSummary",
  "direction",
  "hskCode",
  "hs6",
  "modelName",
  "productMaterial",
  "productUsage",
  "originCountryCode",
  "exportCountryCode",
  "shipmentCountryCode",
  "destinationCountryCode",
  "preferredStartDate",
  "estimatedDeclarationCount"
] as const;

function readFormValues(form: HTMLFormElement, fields: readonly string[]) {
  const formData = new FormData(form);
  return Object.fromEntries(fields.map((field) => [field, String(formData.get(field) ?? "")]));
}

function statusLabel(status: string) {
  if (status === "draft") return "임시저장";
  if (status === "open") return "모집중";
  if (status === "bids_received") return "견적 도착";
  if (status === "partner_selected") return "관세사무소 선정";
  if (status === "in_progress") return "진행중";
  if (status === "completed") return "완료";
  if (status === "cancelled") return "취소";
  if (status === "expired") return "만료";
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
  if (visibility === "requester_only") return "나와 운영자만";
  if (visibility === "matched_partner_after_interest") return "매칭된 관세사무소에게 공개";
  if (visibility === "selected_partner") return "선정된 관세사무소에게만 공개";
  if (visibility === "operator_only") return "운영자만";
  return visibility;
}

function statusTone(status: string): "neutral" | "warning" | "info" | "success" {
  if (status === "draft") return "neutral";
  if (status === "open") return "info";
  if (status === "bids_received") return "warning";
  if (status === "partner_selected" || status === "in_progress" || status === "completed") return "success";
  return "neutral";
}

function bidStatusLabel(status: string) {
  if (status === "submitted") return "제출";
  if (status === "shortlisted") return "검토중";
  if (status === "selected") return "선정";
  if (status === "rejected") return "미선정";
  if (status === "withdrawn") return "철회";
  if (status === "expired") return "만료";
  return status;
}

function bidStatusTone(status: string): "neutral" | "warning" | "info" | "success" {
  if (status === "selected") return "success";
  if (status === "submitted") return "info";
  if (status === "shortlisted") return "warning";
  return "neutral";
}

function formatAmount(amount: number | null, currency: string | null) {
  if (amount === null) return "-";
  return `${currency ?? ""} ${amount.toLocaleString("ko-KR")}`.trim();
}

function partnerFeedbackLabel(feedback: ReceivedClearanceBidItem["partnerFeedback"]) {
  if (!feedback || feedback.feedbackCount === 0 || feedback.avgRating === null) return "거래 후기 없음";
  return `거래 후기 ${feedback.feedbackCount}건 / 평균 ${feedback.avgRating.toFixed(1)}점`;
}

function partnerTrustLabel(trust: ReceivedClearanceBidItem["partnerTrust"]) {
  if (!trust) return "검증 정보 확인중";
  if (trust.verificationStatus === "recommended_partner") return `추천 파트너 · 신뢰 ${trust.trustScore}`;
  if (trust.verificationStatus === "operator_approved") return `운영 검증 · 신뢰 ${trust.trustScore}`;
  if (trust.verificationStatus === "trade_history") return `거래 이력 · 신뢰 ${trust.trustScore}`;
  return `검증 ${trust.verificationStatus}`;
}

function ClearanceBidComparisonGuide({ bids }: { bids: ReceivedClearanceBidItem[] }) {
  const reviewedCount = bids.filter((bid) => bid.partnerFeedback && bid.partnerFeedback.feedbackCount > 0).length;
  const pricedBids = bids.filter((bid) => bid.totalAmount !== null);
  const lowestBid = pricedBids.length > 0
    ? pricedBids.reduce((lowest, bid) => (bid.totalAmount !== null && lowest.totalAmount !== null && bid.totalAmount < lowest.totalAmount ? bid : lowest))
    : null;

  return (
    <div className="grid gap-2 rounded-md border border-blue-100 bg-blue-50 p-3 text-xs leading-5 text-blue-950 md:grid-cols-4">
      <p className="font-semibold md:col-span-4">견적 비교 기준</p>
      <p className="rounded-md bg-white p-2">총액: {lowestBid ? `최저 ${formatAmount(lowestBid.totalAmount, lowestBid.currency)}` : "금액 입력 대기"}</p>
      <p className="rounded-md bg-white p-2">리드타임: 예상 통관일수와 시작 가능일 확인</p>
      <p className="rounded-md bg-white p-2">후기: 거래 후기 보유 {reviewedCount}/{bids.length}곳</p>
      <p className="rounded-md bg-white p-2">조건: 요청 서류, 예비 검토 가능 여부, 리스크 메모 확인</p>
    </div>
  );
}

function ClearancePreSelectChecklist({ bid }: { bid: ReceivedClearanceBidItem }) {
  const items = [
    { done: bid.totalAmount !== null || bid.brokerageFeeAmount !== null, label: "금액" },
    { done: bid.leadTimeDays !== null || bid.expectedClearanceDays !== null, label: "일정" },
    { done: Boolean(bid.partnerTrust), label: "검증" },
    { done: Boolean(bid.partnerFeedback && bid.partnerFeedback.feedbackCount > 0), label: "후기" },
    { done: bid.reviewAvailable || bid.additionalDocumentsRequired.length > 0 || Boolean(bid.riskNote), label: "검토조건" }
  ];

  return (
    <div className="grid gap-2 rounded-md border border-slate-200 bg-white p-3">
      <p className="text-xs font-semibold text-slate-800">선정 전 확인</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            className={item.done ? "rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800" : "rounded-md bg-slate-50 px-2 py-1 text-xs font-medium text-slate-500"}
            key={item.label}
          >
            {item.done ? "확인" : "미확인"} · {item.label}
          </span>
        ))}
      </div>
      <p className="text-xs leading-5 text-slate-600">
        선택 전 금액, 예상 통관일수, 검증 상태, 후기, 추가 요청 서류와 리스크 메모를 함께 확인해 주세요.
      </p>
    </div>
  );
}

function nextClearanceActionLabel(
  request: ClearanceRequestListItem,
  documents: ClearanceRequestDocumentItem[],
  questions: ClearanceRequestQuestionItem[],
  bids: ReceivedClearanceBidItem[]
) {
  if (request.status === "draft" && !request.destinationCountryCode) return "목적국 입력 후 공개 가능";
  if (request.status === "draft" && documents.length === 0) return "CI/PL/사양서 등 서류 첨부 권장";
  if (request.status === "draft") return "검증 관세사무소에 견적 요청 공개 가능";
  if (questions.some((question) => !question.answer)) return "관세사무소 질문 답변 필요";
  if (request.status === "open") return "마감 전 통관 견적 대기";
  if (request.status === "bids_received" && bids.length > 0) return "견적 비교 후 관세사무소 선정";
  if (request.status === "bids_received") return "견적 도착 상태 확인 필요";
  if (request.status === "partner_selected") return "진행 시작 대기";
  if (request.status === "in_progress") return "통관 진행 후 완료 처리";
  if (request.status === "completed") return "완료됨";
  return "상태 확인 필요";
}

function ClearanceLifecycleControls({
  completionReport,
  completionReportDocuments = [],
  documents,
  existingFeedback,
  requestId,
  status,
  viewerRole
}: {
  completionReport?: ServiceRequestCompletionReport;
  completionReportDocuments?: ServiceRequestCompletionReportDocument[];
  documents: ClearanceRequestDocumentItem[];
  existingFeedback?: OwnServiceRequestFeedback;
  requestId: string;
  status: string;
  viewerRole: "partner" | "requester";
}) {
  const router = useRouter();
  const [startState, startAction, startPending] = useActionState(startSelectedClearanceRequestAction, lifecycleInitialState);
  const [completeState, completeAction, completePending] = useActionState(completeSelectedClearanceRequestAction, lifecycleInitialState);

  useEffect(() => {
    if (startState.status !== "idle" || completeState.status !== "idle") {
      window.dispatchEvent(new Event("hsfinder:navigation-progress-done"));
    }
    if (startState.status === "success" || completeState.status === "success") {
      router.refresh();
    }
  }, [completeState.status, router, startState.status]);

  if (status === "completed") {
    return (
      <div className="grid scroll-mt-6 gap-3" id="request-completion">
        <p className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          통관 의뢰가 완료 처리되었습니다. 완료 리포트와 보관 서류를 확인하고, 거래 품질 피드백을 남길 수 있습니다.
        </p>
        <ServiceRequestCompletionReportPanel documents={documents} kind="clearance" report={completionReport} reportDocuments={completionReportDocuments} requestId={requestId} viewerRole={viewerRole} />
        <ServiceRequestFeedbackForm existingFeedback={existingFeedback} requestId={requestId} />
      </div>
    );
  }

  if (status === "partner_selected") {
    return (
      <form action={startAction} className="flex scroll-mt-6 flex-wrap items-center gap-3" id="request-lifecycle">
        <input name="requestId" type="hidden" value={requestId} />
        <button className="focus-ring inline-flex h-10 items-center justify-center rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-500" disabled={startPending} type="submit">
          {startPending ? "처리 중" : "통관 진행 시작"}
        </button>
        {startState.message && startState.requestId === requestId ? (
          <span className={startState.status === "success" ? "text-sm font-medium text-emerald-800" : "text-sm font-medium text-red-700"}>
            {startState.message}
          </span>
        ) : null}
      </form>
    );
  }

  if (status === "in_progress") {
    return (
      <form action={completeAction} className="grid scroll-mt-6 gap-2 md:grid-cols-[1fr_auto]" id="request-lifecycle">
        <input name="requestId" type="hidden" value={requestId} />
        <input className="focus-ring h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950" disabled={completePending} name="completionNote" placeholder="완료 메모(선택, 민감정보 제외)" />
        <button className="focus-ring inline-flex h-10 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500" disabled={completePending} type="submit">
          {completePending ? "완료 처리 중" : "통관 완료 처리"}
        </button>
        {completeState.message && completeState.requestId === requestId ? (
          <p className={completeState.status === "success" ? "text-sm font-medium text-emerald-800 md:col-span-2" : "text-sm font-medium text-red-700 md:col-span-2"}>
            {completeState.message}
          </p>
        ) : null}
      </form>
    );
  }

  return null;
}

function ClearanceProgress({
  bids,
  documents,
  questions,
  request
}: {
  bids: ReceivedClearanceBidItem[];
  documents: ClearanceRequestDocumentItem[];
  questions: ClearanceRequestQuestionItem[];
  request: ClearanceRequestListItem;
}) {
  const steps = [
    { done: true, label: "초안" },
    { done: documents.length > 0, label: "서류" },
    { done: request.status !== "draft", label: "공개" },
    { done: questions.length > 0 && questions.every((question) => question.answer), label: "질문" },
    { done: request.status === "bids_received" || request.status === "partner_selected", label: "견적" },
    { done: request.status === "partner_selected", label: "선정" }
  ];

  return (
    <div className="grid gap-3 border-t border-slate-100 pt-3">
      <div className="grid gap-2 text-xs text-slate-600 md:grid-cols-6">
        {steps.map((step, index) => (
          <span
            className={
              step.done
                ? "rounded-md bg-blue-50 px-2 py-1 font-medium text-blue-800"
                : "rounded-md bg-slate-50 px-2 py-1 text-slate-500"
            }
            key={step.label}
          >
            {index + 1}. {step.label}
          </span>
        ))}
      </div>
      <p className="text-xs font-medium text-slate-700">다음 작업: {nextClearanceActionLabel(request, documents, questions, bids)}</p>
    </div>
  );
}

function requestStatusCounts(requests: ClearanceRequestListItem[], opportunities: ClearanceOpportunityItem[]) {
  return {
    bidsReceived: requests.filter((request) => request.status === "bids_received").length,
    drafts: requests.filter((request) => request.status === "draft").length,
    inProgress: requests.filter((request) => request.status === "in_progress").length,
    open: requests.filter((request) => request.status === "open").length,
    opportunities: opportunities.length,
    selected: requests.filter((request) => request.status === "partner_selected").length
  };
}

function ReceivedClearanceBidRow({
  bid,
  requestStatus
}: {
  bid: ReceivedClearanceBidItem;
  requestStatus: string;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(selectClearanceBidAction, selectBidInitialState);
  const canSelect = requestStatus !== "partner_selected" && (bid.status === "submitted" || bid.status === "shortlisted");

  useEffect(() => {
    if (state.status !== "idle") {
      window.dispatchEvent(new Event("hsfinder:navigation-progress-done"));
    }
    if (state.status === "success") {
      router.refresh();
    }
  }, [router, state.status]);

  return (
    <div className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
      <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-slate-950">{formatAmount(bid.totalAmount, bid.currency)}</p>
            <Badge tone={bidStatusTone(bid.status)}>{bidStatusLabel(bid.status)}</Badge>
            <Badge tone="neutral">업체 {bid.bidderCompanyId.slice(0, 8)}</Badge>
            <Badge tone={bid.partnerTrust?.verificationStatus === "recommended_partner" ? "success" : bid.partnerTrust ? "info" : "neutral"}>{partnerTrustLabel(bid.partnerTrust)}</Badge>
            <Badge tone={bid.partnerFeedback ? "info" : "neutral"}>{partnerFeedbackLabel(bid.partnerFeedback)}</Badge>
            {bid.reviewAvailable ? <Badge tone="info">예비 검토 가능</Badge> : null}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            유효기한 {bid.validUntil ?? "-"} / 리드타임 {bid.leadTimeDays ?? "-"}일 / 예상 통관 {bid.expectedClearanceDays ?? "-"}일
          </p>
        </div>
        <form action={action}>
          <input name="bidId" type="hidden" value={bid.bidId} />
          <button
            className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={!canSelect || pending}
            type="submit"
          >
            <CheckCircle2 aria-hidden="true" size={16} />
            {bid.status === "selected" ? "선정됨" : pending ? "선정 중" : "이 관세사무소 선정"}
          </button>
        </form>
      </div>
      <div className="grid gap-2 rounded-md bg-white p-3 text-xs text-slate-600 md:grid-cols-3">
        <span>통관 수수료 {formatAmount(bid.brokerageFeeAmount, bid.currency)}</span>
        <span>총액 {formatAmount(bid.totalAmount, bid.currency)}</span>
        <span>제출 {bid.submittedAt?.slice(0, 10) ?? bid.createdAt.slice(0, 10)}</span>
      </div>
      <ClearancePreSelectChecklist bid={bid} />
      {bid.additionalDocumentsRequired.length > 0 ? (
        <p className="text-xs leading-5 text-slate-600">
          추가 요청 서류: {bid.additionalDocumentsRequired.join(", ")}
        </p>
      ) : null}
      {bid.riskNote ? <p className="text-xs leading-5 text-amber-800">검토 메모: {bid.riskNote}</p> : null}
      {bid.message ? <p className="text-sm leading-6 text-slate-600">{bid.message}</p> : null}
      {state.message && state.bidId === bid.bidId ? (
        <p className={state.status === "success" ? "rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800" : "rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"}>
          {state.message}
        </p>
      ) : null}
    </div>
  );
}

function SelectedClearanceBrokerNextSteps({
  documents,
  selectedBid
}: {
  documents: ClearanceRequestDocumentItem[];
  selectedBid?: ReceivedClearanceBidItem;
}) {
  const selectedPartnerDocuments = documents.filter((document) => document.visibility === "selected_partner").length;

  return (
    <div className="grid gap-3 rounded-md border border-emerald-200 bg-emerald-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-emerald-950">관세사무소 선정 후 다음 업무</p>
          <p className="mt-1 text-xs leading-5 text-emerald-900">
            선정된 관세사무소와 신고 일정, 필요서류, HS/FTA/요건 검토 범위를 확정해 주세요.
          </p>
        </div>
        <Badge tone="success">선정 완료</Badge>
      </div>
      {selectedBid ? (
        <div className="grid gap-2 rounded-md bg-white p-3 text-xs text-slate-700 md:grid-cols-3">
          <span>선정 견적 {formatAmount(selectedBid.totalAmount, selectedBid.currency)}</span>
          <span>통관 수수료 {formatAmount(selectedBid.brokerageFeeAmount, selectedBid.currency)}</span>
          <span>예상 통관 {selectedBid.expectedClearanceDays ?? "-"}일</span>
        </div>
      ) : null}
      <div className="grid gap-2 text-xs leading-5 text-emerald-950 md:grid-cols-3">
        <p className="rounded-md bg-white p-3">1. CI, PL, C/O, 제품 사양서 등 관세사무소가 요청한 서류를 선정 관세사무소 공개 범위로 첨부합니다.</p>
        <p className="rounded-md bg-white p-3">2. HSK, FTA, 세관장확인, 통합공고·개별법령 요건은 담당자 검토 필요 상태로 확인합니다.</p>
        <p className="rounded-md bg-white p-3">3. 신고 예정일과 물류 일정이 바뀌면 기준일과 서류 버전을 다시 확인합니다.</p>
      </div>
      <SelectedPartnerDocumentHandoff count={selectedPartnerDocuments} kind="clearance" />
      <p className="text-xs leading-5 text-emerald-900">
        선정 관세사무소 전용 공개 서류 {selectedPartnerDocuments}건입니다. 세관장확인대상이 아니더라도 통합공고, 개별법령, 표시·인증·유통규제 의무가 존재할 수 있습니다.
      </p>
    </div>
  );
}

function ClearanceQuestionAnswerRow({ question }: { question: ClearanceRequestQuestionItem }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(answerClearanceRequestQuestionAction, questionInitialState);

  useEffect(() => {
    if (state.status !== "idle") {
      window.dispatchEvent(new Event("hsfinder:navigation-progress-done"));
    }
    if (state.status === "success") {
      router.refresh();
    }
  }, [router, state.status]);

  return (
    <div className="grid gap-3 rounded-md bg-white p-3">
      <div className="grid gap-1">
        <p className="text-xs text-slate-500">관세사무소 {question.bidderCompanyId.slice(0, 8)} / {question.createdAt.slice(0, 10)}</p>
        <p className="text-sm leading-6 text-slate-700">{question.question}</p>
      </div>
      {question.answer ? (
        <p className="rounded-md bg-emerald-50 p-3 text-sm leading-6 text-emerald-800">
          답변: {question.answer}
        </p>
      ) : (
        <form action={action} className="grid gap-2 md:grid-cols-[1fr_auto]">
          <input name="questionId" type="hidden" value={question.questionId} />
          <textarea
            className="focus-ring min-h-16 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950"
            disabled={pending}
            name="answer"
            placeholder="관세사무소가 견적 산정에 필요한 정보를 답변해 주세요."
            required
          />
          <button className="focus-ring inline-flex h-10 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500" disabled={pending} type="submit">
            {pending ? "답변 중" : "답변 등록"}
          </button>
        </form>
      )}
      {state.message && state.questionId === question.questionId ? (
        <p className={state.status === "success" ? "rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800" : "rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"}>
          {state.message}
        </p>
      ) : null}
    </div>
  );
}

export function ClearanceRequestRow({
  anchorPrefix,
  bids,
  compact = false,
  completionReport,
  completionReportDocuments = [],
  documents,
  feedbackByRequestId = {},
  questions,
  request
}: {
  anchorPrefix?: string;
  bids: ReceivedClearanceBidItem[];
  compact?: boolean;
  completionReport?: ServiceRequestCompletionReport;
  completionReportDocuments?: ServiceRequestCompletionReportDocument[];
  documents: ClearanceRequestDocumentItem[];
  feedbackByRequestId?: Record<string, OwnServiceRequestFeedback>;
  questions: ClearanceRequestQuestionItem[];
  request: ClearanceRequestListItem;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(publishClearanceRequestAction, publishInitialState);
  const [documentState, documentAction, documentPending] = useActionState(uploadClearanceRequestDocumentAction, documentUploadInitialState);
  const canPublish = request.status === "draft";
  const selectedBid = bids.find((bid) => bid.status === "selected");

  useEffect(() => {
    if (state.status !== "idle" || documentState.status !== "idle") {
      window.dispatchEvent(new Event("hsfinder:navigation-progress-done"));
    }
    if (state.status === "success" || documentState.status === "success") {
      router.refresh();
    }
  }, [documentState.status, router, state.status]);

  return (
    <div className="grid gap-3 rounded-md border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-semibold text-slate-950">{request.title}</p>
        <Badge tone={statusTone(request.status)}>{statusLabel(request.status)}</Badge>
        <Badge tone="neutral">{request.direction === "export" ? "수출통관" : "수입통관"}</Badge>
        {request.urgent ? <Badge tone="warning">긴급</Badge> : null}
        <Link
          className="focus-ring inline-flex h-8 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          href={`/requests/clearance/${request.id}`}
        >
          상세 작업
        </Link>
      </div>
      <p className="text-xs text-slate-500">
        목적국 {request.destinationCountryCode ?? "-"} / HSK {request.hskCode ?? "미정"} / 신고 예상 {request.estimatedDeclarationCount ?? "-"}건
      </p>
      <div className="grid gap-2 rounded-md bg-slate-50 p-3 text-xs text-slate-600 md:grid-cols-4">
        <span>HS 확인 {request.hsCodeKnown ? "보유" : "필요"}</span>
        <span>FTA 희망 {request.ftaPreferenceRequested ? "있음" : "없음"}</span>
        <span>요건 확인 {request.requirementsCheckNeeded ? "필요" : "요건 미검토"}</span>
        <span>생성 {request.createdAt.slice(0, 10)}</span>
      </div>
      {request.productSummary ? <p className="text-sm leading-6 text-slate-600">{request.productSummary}</p> : null}
      <ClearanceProgress bids={bids} documents={documents} questions={questions} request={request} />
      {request.status === "partner_selected" || request.status === "in_progress" || request.status === "completed" ? (
        <SelectedClearanceBrokerNextSteps documents={documents} selectedBid={selectedBid} />
      ) : null}
      <ClearanceLifecycleControls completionReport={completionReport} completionReportDocuments={completionReportDocuments} documents={documents} existingFeedback={feedbackByRequestId[request.id]} requestId={request.id} status={request.status} viewerRole="requester" />
      {compact ? (
        <p className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600">
          서류 {documents.length}건 / 질문 {questions.length}건 / 견적 {bids.length}건입니다. 첨부, 답변, 견적 비교와 공개 설정은 상세 작업에서 처리합니다.
        </p>
      ) : null}
      {compact ? null : (
      <>
      <div id={anchorPrefix ? `${anchorPrefix}-documents` : undefined} className="scroll-mt-6 grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-slate-950">통관 의뢰 서류</p>
          <Badge tone={documents.length > 0 ? "info" : "neutral"}>{documents.length}건</Badge>
        </div>
        {documents.length > 0 ? (
          <div className="grid gap-2">
            {documents.map((document) => (
              <div className="grid gap-1 rounded-md bg-white p-3 text-xs text-slate-600 md:grid-cols-[1fr_auto] md:items-center" key={document.documentId}>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">{document.fileName}</p>
                  <p>
                    {documentTypeLabel(document.documentType)} / {visibilityLabel(document.visibility)} / {(document.fileSize ?? 0).toLocaleString("ko-KR")} bytes
                  </p>
                </div>
                <span className="text-slate-500">{document.createdAt.slice(0, 10)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-md bg-white p-3 text-xs leading-5 text-slate-600">
            아직 첨부된 서류가 없습니다. Commercial Invoice, Packing List, 원산지증명서, 제품 사양서를 첨부하면 관세사무소가 수수료와 필요서류를 더 정확히 제안할 수 있습니다.
          </p>
        )}
        <details className="rounded-md border border-slate-200 bg-white">
          <summary className="cursor-pointer list-none px-3 py-2 text-sm font-semibold text-slate-800">
            서류 추가하기
          </summary>
          <form action={documentAction} className="grid gap-3 border-t border-slate-200 p-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <input name="requestId" type="hidden" value={request.id} />
            <label className="grid gap-1 text-xs font-medium text-slate-600">
              서류 유형
              <select className="focus-ring h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950" disabled={documentPending} name="documentType" required>
                <option value="commercial_invoice">Commercial Invoice</option>
                <option value="packing_list">Packing List</option>
                <option value="bill_of_lading">B/L</option>
                <option value="air_waybill">AWB</option>
                <option value="certificate_of_origin">C/O</option>
                <option value="catalog">카탈로그</option>
                <option value="spec_sheet">사양서</option>
              </select>
            </label>
            <label className="grid gap-1 text-xs font-medium text-slate-600">
              공개 범위
              <select className="focus-ring h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950" disabled={documentPending} name="visibility" required>
                <option value="requester_only">나와 운영자만</option>
                <option value="matched_partner_after_interest">매칭된 관세사무소에게 공개</option>
                <option value="selected_partner">선정된 관세사무소에게만 공개</option>
                <option value="operator_only">운영자만</option>
              </select>
            </label>
            <label className="grid gap-1 text-xs font-medium text-slate-600 md:col-span-2">
              파일
              <input className="focus-ring h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950" disabled={documentPending} name="file" required type="file" />
            </label>
            <button className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500" disabled={documentPending} type="submit">
              <FileUp aria-hidden="true" size={16} />
              {documentPending ? "업로드 중" : "서류 첨부"}
            </button>
          </form>
        </details>
        {documentState.message && documentState.requestId === request.id ? (
          <p className={documentState.status === "success" ? "rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800" : "rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"}>
            {documentState.message}
          </p>
        ) : null}
      </div>
      <div id={anchorPrefix ? `${anchorPrefix}-questions` : undefined} className="scroll-mt-6 grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-slate-950">관세사무소 질문</p>
          <Badge tone={questions.some((question) => !question.answer) ? "warning" : "neutral"}>{questions.length}건</Badge>
        </div>
        {questions.length > 0 ? (
          <div className="grid gap-2">
            {questions.map((question) => (
              <ClearanceQuestionAnswerRow key={question.questionId} question={question} />
            ))}
          </div>
        ) : (
          <p className="rounded-md bg-white p-3 text-xs leading-5 text-slate-600">
            아직 관세사무소 질문이 없습니다. 요청 공개 후 견적 산정에 필요한 품목, 원산지, 서류 확인 질문이 표시됩니다.
          </p>
        )}
      </div>
      <div id={anchorPrefix ? `${anchorPrefix}-bids` : undefined} className="scroll-mt-6 grid gap-3 rounded-md border border-slate-200 bg-white p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-slate-950">받은 견적</p>
          <Badge tone={bids.length > 0 ? "warning" : "neutral"}>{bids.length}건</Badge>
        </div>
        {bids.length > 0 ? (
          <div className="grid gap-3">
            <ClearanceBidComparisonGuide bids={bids} />
            {bids.map((bid) => (
              <ReceivedClearanceBidRow bid={bid} key={bid.bidId} requestStatus={request.status} />
            ))}
          </div>
        ) : (
          <p className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600">
            아직 제출된 통관 견적이 없습니다. 요청을 공개하면 조건에 맞는 관세사무소가 수수료, 필요서류, 리드타임을 제안합니다.
          </p>
        )}
      </div>
      {canPublish ? (
        <details id={anchorPrefix ? `${anchorPrefix}-publish` : undefined} className="scroll-mt-6 rounded-md border border-slate-200 bg-slate-50">
          <summary className="cursor-pointer list-none px-3 py-2 text-sm font-semibold text-slate-800">
            관세사무소 공개 설정
          </summary>
          <form action={action} className="grid gap-3 border-t border-slate-200 p-3">
            <input name="requestId" type="hidden" value={request.id} />
            <div className="grid gap-1 text-xs leading-5 text-slate-600">
              <p className="font-semibold text-slate-800">공개 전 확인</p>
              <p>공개 대상: 검증된 관세사무소</p>
              <p>공개 정보: 요청 제목, 품목 요약, 국가, HSK/HS6 입력값, 일정, 검토 요청 범위</p>
              <p>비공개 정보: 아직 첨부하지 않은 원본 서류, 민감 단가, 내부 메모</p>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <label className="grid gap-1 text-xs font-medium text-slate-600">
                견적 접수 마감
                <select className="focus-ring h-9 rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-950" disabled={pending} name="deadlineHours">
                  <option value="24">24시간</option>
                  <option value="48">48시간</option>
                </select>
              </label>
              <button className="focus-ring inline-flex h-9 items-center justify-center rounded-md bg-slate-950 px-3 text-xs font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500" disabled={pending} type="submit">
                {pending ? "공개 중" : "검증 관세사무소에 견적 요청 공개"}
              </button>
            </div>
          </form>
        </details>
      ) : null}
      {state.message && state.requestId === request.id ? (
        <p className={state.status === "success" ? "rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800" : "rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"}>
          {state.message}
        </p>
      ) : null}
      </>
      )}
    </div>
  );
}

export function ClearanceOpportunityRow({
  anchorPrefix,
  compact = false,
  completionReport,
  completionReportDocuments = [],
  documents,
  feedbackByRequestId = {},
  opportunity,
  questions
}: {
  anchorPrefix?: string;
  compact?: boolean;
  completionReport?: ServiceRequestCompletionReport;
  completionReportDocuments?: ServiceRequestCompletionReportDocument[];
  documents: ClearanceRequestDocumentItem[];
  feedbackByRequestId?: Record<string, OwnServiceRequestFeedback>;
  opportunity: ClearanceOpportunityItem;
  questions: ClearanceRequestQuestionItem[];
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(submitClearanceBidAction, bidInitialState);
  const [questionState, questionAction, questionPending] = useActionState(askClearanceRequestQuestionAction, questionInitialState);
  const selectedPartnerDocuments = documents.filter((document) => document.visibility === "selected_partner").length;

  useEffect(() => {
    if (state.status !== "idle" || questionState.status !== "idle") {
      window.dispatchEvent(new Event("hsfinder:navigation-progress-done"));
    }
    if (state.status === "success" || questionState.status === "success") {
      router.refresh();
    }
  }, [questionState.status, router, state.status]);

  return (
    <div className="grid gap-4 rounded-md border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-slate-950">{opportunity.title}</p>
            <Badge tone={statusTone(opportunity.status)}>{statusLabel(opportunity.status)}</Badge>
            <Badge tone="neutral">{opportunity.direction === "export" ? "수출통관" : "수입통관"}</Badge>
            {opportunity.urgent ? <Badge tone="warning">긴급</Badge> : null}
          </div>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            목적국 {opportunity.destinationCountryCode ?? "-"} / HSK {opportunity.hskCode ?? "미정"} / FTA 희망 {opportunity.ftaPreferenceRequested ? "있음" : "없음"} / 요건 확인 {opportunity.requirementsCheckNeeded ? "필요" : "요건 미검토"}
          </p>
        </div>
        <Link
          className="focus-ring inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          href={`/requests/clearance/opportunities/${opportunity.id}`}
        >
          입찰 작업
        </Link>
      </div>
      {opportunity.productSummary ? <p className="text-sm leading-6 text-slate-600">{opportunity.productSummary}</p> : null}
      {compact ? (
        <p className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600">
          공개 서류 {documents.length}건 / 질문 {questions.length}건입니다. {opportunity.status === "partner_selected" || opportunity.status === "in_progress" || opportunity.status === "completed" ? "선정 후 업무는 입찰 작업에서 확인합니다." : "조건 확인, 질문 등록, 통관 견적 제출은 입찰 작업에서 처리합니다."}
        </p>
      ) : null}
      {compact ? null : (
        <>
      {opportunity.status === "partner_selected" || opportunity.status === "in_progress" || opportunity.status === "completed" ? (
        <div className="grid gap-3 rounded-md border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-emerald-950">선정된 통관 의뢰</p>
              <p className="mt-1 text-xs leading-5 text-emerald-900">
                {opportunity.status === "completed"
                  ? "통관 의뢰가 완료 처리되었습니다."
                  : opportunity.status === "in_progress"
                    ? "선정된 통관 의뢰가 진행 중입니다. 완료 시 완료 처리를 진행해 주세요."
                    : "화주가 귀사를 관세사무소로 선정했습니다. 신고 일정, 필요서류, HS/FTA/요건 검토 범위를 확인해 주세요."}
              </p>
            </div>
            <Badge tone="success">{statusLabel(opportunity.status)}</Badge>
          </div>
          <div className="grid gap-2 text-xs leading-5 text-emerald-950 md:grid-cols-3">
            <p className="rounded-md bg-white p-3">1. 신고 예정일과 서류 수령 일정을 화주와 확정합니다.</p>
            <p className="rounded-md bg-white p-3">2. 선정 관세사무소 공개 범위로 첨부된 CI/PL/C/O/사양서를 확인합니다.</p>
            <p className="rounded-md bg-white p-3">3. HSK, FTA, 세관장확인, 통합공고·개별법령 요건은 담당자 검토 필요 상태로 안내합니다.</p>
          </div>
          <SelectedPartnerDocumentHandoff count={selectedPartnerDocuments} kind="clearance" />
        </div>
      ) : null}
      <ClearanceLifecycleControls completionReport={completionReport} completionReportDocuments={completionReportDocuments} documents={documents} existingFeedback={feedbackByRequestId[opportunity.id]} requestId={opportunity.id} status={opportunity.status} viewerRole="partner" />
      <div id={anchorPrefix ? `${anchorPrefix}-documents` : undefined} className="scroll-mt-6 grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold text-slate-800">공개된 요청 서류</p>
          <Badge tone={documents.length > 0 ? "info" : "neutral"}>{documents.length}건</Badge>
        </div>
        {documents.length > 0 ? (
          <div className="grid gap-2">
            {documents.map((document) => (
              <p className="rounded-md bg-white p-2 text-xs leading-5 text-slate-600" key={document.documentId}>
                <span className="font-semibold text-slate-900">{documentTypeLabel(document.documentType)}</span> · {document.fileName} · {visibilityLabel(document.visibility)}
              </p>
            ))}
          </div>
        ) : (
          <p className="rounded-md bg-white p-2 text-xs leading-5 text-slate-600">
            화주가 관세사무소에 공개한 서류가 아직 없습니다. 견적 메시지에서 필요한 서류를 요청해 주세요.
          </p>
        )}
      </div>
      <div id={anchorPrefix ? `${anchorPrefix}-questions` : undefined} className="scroll-mt-6 grid gap-3 rounded-md border border-slate-200 bg-white p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold text-slate-800">질문·답변</p>
          <Badge tone={questions.some((question) => !question.answer) ? "warning" : "neutral"}>{questions.length}건</Badge>
        </div>
        {questions.length > 0 ? (
          <div className="grid gap-2">
            {questions.map((question) => (
              <div className="rounded-md bg-slate-50 p-2 text-xs leading-5 text-slate-600" key={question.questionId}>
                <p className="font-semibold text-slate-900">질문: {question.question}</p>
                <p>{question.answer ? `답변: ${question.answer}` : "답변 대기 중"}</p>
              </div>
            ))}
          </div>
        ) : null}
        <form action={questionAction} className="grid gap-2 md:grid-cols-[1fr_auto]">
          <input name="requestId" type="hidden" value={opportunity.id} />
          <textarea
            className="focus-ring min-h-16 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950"
            disabled={questionPending}
            name="question"
            placeholder="견적 산정 전에 확인할 통관 조건이나 서류를 질문해 주세요."
            required
          />
          <button className="focus-ring inline-flex h-10 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500" disabled={questionPending} type="submit">
            {questionPending ? "등록 중" : "질문 등록"}
          </button>
          {questionState.message && questionState.requestId === opportunity.id ? (
            <p className={questionState.status === "success" ? "rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 md:col-span-2" : "rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 md:col-span-2"}>
              {questionState.message}
            </p>
          ) : null}
        </form>
      </div>
      {opportunity.status === "partner_selected" || opportunity.status === "in_progress" || opportunity.status === "completed" ? null : (
      <form id={anchorPrefix ? `${anchorPrefix}-bid` : undefined} action={action} className="scroll-mt-6 grid gap-3 rounded-md bg-slate-50 p-3 md:grid-cols-2 xl:grid-cols-4">
        <input name="requestId" type="hidden" value={opportunity.id} />
        <div className="grid gap-1 md:col-span-2 xl:col-span-4">
          <p className="text-sm font-semibold text-slate-950">관세사무소 예비 견적 제출</p>
          <p className="text-xs leading-5 text-slate-500">
            이 견적은 통관 가능 여부 확정이 아니라 수수료, 필요서류, 예상 리드타임 제안입니다. HS/FTA/요건은 담당자 검토가 필요합니다.
          </p>
        </div>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          통화
          <input className="focus-ring h-10 rounded-md border border-slate-300 px-3 text-slate-950" defaultValue="KRW" disabled={pending} name="currency" required />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          총 견적 금액
          <input className="focus-ring h-10 rounded-md border border-slate-300 px-3 text-slate-950" disabled={pending} min="1" name="totalAmount" required type="number" />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          통관 수수료
          <input className="focus-ring h-10 rounded-md border border-slate-300 px-3 text-slate-950" disabled={pending} min="1" name="brokerageFeeAmount" type="number" />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          견적 유효기한
          <input className="focus-ring h-10 rounded-md border border-slate-300 px-3 text-slate-950" disabled={pending} name="validUntil" type="date" />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          응답 리드타임(일)
          <input className="focus-ring h-10 rounded-md border border-slate-300 px-3 text-slate-950" disabled={pending} min="1" name="leadTimeDays" type="number" />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          예상 통관일수
          <input className="focus-ring h-10 rounded-md border border-slate-300 px-3 text-slate-950" disabled={pending} min="1" name="expectedClearanceDays" type="number" />
        </label>
        <label className="inline-flex items-center gap-2 self-end text-sm text-slate-700">
          <input className="size-4 rounded border-slate-300" defaultChecked disabled={pending} name="reviewAvailable" type="checkbox" />
          HS/FTA/요건 예비 검토 가능
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700 md:col-span-2">
          추가 요청 서류
          <textarea className="focus-ring min-h-20 rounded-md border border-slate-300 px-3 py-2 text-slate-950" disabled={pending} name="additionalDocumentsRequired" placeholder="예: Commercial Invoice, Packing List, 원산지증명서, 제품 사양서" />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700 md:col-span-2">
          리스크/검토 메모
          <textarea className="focus-ring min-h-20 rounded-md border border-slate-300 px-3 py-2 text-slate-950" disabled={pending} name="riskNote" placeholder="예: HSK 확정 후 세율·요건 재조회 필요" />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700 md:col-span-2 xl:col-span-4">
          화주에게 보낼 메시지
          <textarea className="focus-ring min-h-20 rounded-md border border-slate-300 px-3 py-2 text-slate-950" disabled={pending} name="message" />
        </label>
        <div className="flex flex-wrap items-center gap-3 md:col-span-2 xl:col-span-4">
          <button className="focus-ring inline-flex h-10 items-center justify-center rounded-md bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-500" disabled={pending} type="submit">
            {pending ? "제출 중" : "예비 통관 견적 제출"}
          </button>
          <span className="text-xs leading-5 text-slate-500">
            이 견적은 통관 가능 여부 확정이 아니라 수수료, 필요서류, 예상 리드타임 제안입니다.
          </span>
        </div>
        {state.message && state.requestId === opportunity.id ? (
          <p className={state.status === "success" ? "rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 md:col-span-2 xl:col-span-4" : "rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 md:col-span-2 xl:col-span-4"}>
            {state.message}
          </p>
        ) : null}
      </form>
      )}
        </>
      )}
    </div>
  );
}

export function ClearanceRequestDraftPanel({
  bidsByRequestId,
  completionReportsByRequestId = {},
  documentsByRequestId,
  feedbackByRequestId,
  opportunities,
  questionsByRequestId,
  requests,
  schemaReady
}: {
  bidsByRequestId: Record<string, ReceivedClearanceBidItem[]>;
  completionReportsByRequestId?: Record<string, ServiceRequestCompletionReport>;
  documentsByRequestId: Record<string, ClearanceRequestDocumentItem[]>;
  feedbackByRequestId: Record<string, OwnServiceRequestFeedback>;
  opportunities: ClearanceOpportunityItem[];
  questionsByRequestId: Record<string, ClearanceRequestQuestionItem[]>;
  requests: ClearanceRequestListItem[];
  schemaReady: boolean;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(createClearanceRequestDraftAction, initialState);
  const searchParams = useSearchParams();
  const initialWorkspace = searchParams.get("workspace") === "broker" ? "broker" : "requester";
  const [activeWorkspace, setActiveWorkspace] = useState<"broker" | "requester">(initialWorkspace);
  const prefill = marketplaceRequestPrefillFromSearchParams(searchParams);
  const prefilledProductSummary = marketplacePrefilledProductSummary(prefill);
  const prefilledTitle = marketplacePrefilledTitle(prefill, "clearance");
  const counts = requestStatusCounts(requests, opportunities);
  const unansweredQuestionCount = Object.values(questionsByRequestId)
    .flat()
    .filter((question) => !question.answer).length;
  const [draftValues, setDraftValues] = useState(() => ({
    destinationCountryCode: prefill.destinationCountryCode ?? "",
    direction: prefill.direction ?? "import",
    estimatedDeclarationCount: "",
    exportCountryCode: prefill.originCountryCode ?? "",
    hs6: prefill.hs6 ?? "",
    hskCode: prefill.hskCode ?? "",
    modelName: "",
    originCountryCode: prefill.originCountryCode ?? "",
    preferredStartDate: prefill.basisDate ?? "",
    productMaterial: "",
    productSummary: prefilledProductSummary,
    productUsage: "",
    shipmentCountryCode: prefill.originCountryCode ?? "",
    title: prefilledTitle
  }));

  useEffect(() => {
    if (state.status !== "idle") {
      window.dispatchEvent(new Event("hsfinder:navigation-progress-done"));
    }
    if (state.status === "success") {
      router.refresh();
    }
  }, [router, state.status]);

  return (
    <div className="grid gap-5">
      <div className="grid gap-3 rounded-md border border-slate-200 bg-white p-3 md:grid-cols-2">
        <button
          className={
            activeWorkspace === "requester"
              ? "focus-ring rounded-md bg-blue-700 px-4 py-3 text-left text-sm font-semibold text-white"
              : "focus-ring rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100"
          }
          onClick={() => setActiveWorkspace("requester")}
          type="button"
        >
          내 요청 관리
          <span className="mt-1 block text-xs font-normal opacity-80">화주: 초안 작성, 공개, 견적 비교, 관세사무소 선정</span>
        </button>
        <button
          className={
            activeWorkspace === "broker"
              ? "focus-ring rounded-md bg-blue-700 px-4 py-3 text-left text-sm font-semibold text-white"
              : "focus-ring rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100"
          }
          onClick={() => setActiveWorkspace("broker")}
          type="button"
        >
          관세사 입찰
          <span className="mt-1 block text-xs font-normal opacity-80">관세사무소: 공개 요청 확인, 예비 견적 제출</span>
        </button>
      </div>

      <div className="grid gap-2 rounded-md border border-slate-200 bg-white p-3 text-xs text-slate-600 md:grid-cols-6">
        <span className="rounded-md bg-slate-50 px-3 py-2">초안 {counts.drafts}건</span>
        <span className="rounded-md bg-slate-50 px-3 py-2">공개중 {counts.open}건</span>
        <span className="rounded-md bg-slate-50 px-3 py-2">견적 도착 {counts.bidsReceived}건</span>
        <span className="rounded-md bg-slate-50 px-3 py-2">선정 완료 {counts.selected}건</span>
        <span className="rounded-md bg-slate-50 px-3 py-2">진행중 {counts.inProgress}건</span>
        <span className="rounded-md bg-slate-50 px-3 py-2">입찰 가능 {counts.opportunities}건</span>
        <span className={unansweredQuestionCount > 0 ? "rounded-md bg-amber-50 px-3 py-2 font-semibold text-amber-900 md:col-span-6" : "rounded-md bg-slate-50 px-3 py-2 md:col-span-6"}>
          미답변 질문 {unansweredQuestionCount}건
        </span>
      </div>

      {activeWorkspace === "requester" ? (
        <>
          <Card id="request-draft-form">
        <CardHeader
          action={<Badge tone="info">초안</Badge>}
          description="관세사무소에 공개하기 전 통관 방향, HS 정보 여부, FTA 희망, 요건 확인 필요 여부를 정리합니다."
          title="통관 의뢰 요청 초안"
        />
        <CardBody>
          <div className="mb-5 grid gap-2 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
            <p className="inline-flex items-center gap-2 font-semibold">
              <AlertTriangle aria-hidden="true" size={17} />
              통관 의뢰 초안 작성 단계
            </p>
            <p>
              본 화면은 통관 의뢰 초안 작성 단계입니다. HS, FTA, 요건 및 인허가 적용 여부는 예비진단이며 담당자 검토가 필요합니다.
            </p>
            <p>
              세관장확인대상이 아니더라도 통합공고, 개별법령, 표시·인증·유통규제 의무가 존재할 수 있습니다.
            </p>
          </div>
          {!schemaReady ? (
            <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
              로그인은 정상입니다. 현재 이 환경에서는 플랫폼 요청 기능이 준비 중이라 통관 의뢰 초안 저장과 관세사무소 공개 모집이 제한됩니다.
            </p>
          ) : null}
          <form
            action={action}
            className="grid gap-5"
            onChange={(event) => setDraftValues(readFormValues(event.currentTarget, clearanceDraftReadinessFields) as typeof draftValues)}
          >
            <MarketplacePrefillSourcePanel prefill={prefill} requestKind="clearance" />
            <OverseasPartnerRequestHint prefill={prefill} requestKind="clearance" />
            <RequestDraftReadinessPanel
              items={[
                { label: "요청 제목", required: true, value: draftValues.title },
                { label: "통관 방향", required: true, value: draftValues.direction },
                { helper: "목적국은 초안 저장 후 관세사무소에 공개할 때 반드시 필요합니다.", label: "목적국", value: draftValues.destinationCountryCode },
                { label: "품목 요약", value: draftValues.productSummary },
                { label: "HSK 10자리 또는 HS6", value: draftValues.hskCode || draftValues.hs6 },
                { label: "용도", value: draftValues.productUsage },
                { label: "재질/성분", value: draftValues.productMaterial },
                { label: "원산지", value: draftValues.originCountryCode },
                { label: "수출국", value: draftValues.exportCountryCode },
                { label: "선적국", value: draftValues.shipmentCountryCode },
                { label: "신고 예정일", value: draftValues.preferredStartDate },
                { label: "예상 신고 건수", value: draftValues.estimatedDeclarationCount }
              ]}
              publishLabel="관세사무소 공개 전 보완하면 좋은 값"
            />
            <div className="grid gap-3 md:grid-cols-2">
              <p className="text-sm font-semibold text-slate-950 md:col-span-2">기본 정보</p>
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                통관 방향
                <select className="focus-ring h-10 rounded-md border border-slate-300 bg-white px-3 text-slate-950" defaultValue={prefill.direction ?? "import"} disabled={pending} name="direction" required>
                  <option value="import">수입통관</option>
                  <option value="export">수출통관</option>
                </select>
              </label>
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                요청 제목
                <input className="focus-ring h-10 rounded-md border border-slate-300 px-3 text-slate-950" defaultValue={prefilledTitle} disabled={pending} name="title" placeholder="예: 화장품 수입 통관 의뢰" required />
              </label>
              <label className="grid gap-1 text-sm font-medium text-slate-700 md:col-span-2">
                품목 요약
                <textarea className="focus-ring min-h-24 rounded-md border border-slate-300 px-3 py-2 text-slate-950" defaultValue={prefilledProductSummary} disabled={pending} name="productSummary" placeholder="품명, 모델, 용도, 성분, 수량, 특이사항을 간단히 적어 주세요." />
              </label>
            </div>

            <div className="grid gap-3 rounded-md border border-blue-100 bg-blue-50 p-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="grid gap-1 md:col-span-2 xl:col-span-4">
                <p className="text-sm font-semibold text-blue-900">품목 및 HS 정보</p>
                <p className="text-xs leading-5 text-blue-900">
                  HSK/HS6를 입력한 경우에도 담당자 검토 전 확정값으로 표시하지 않습니다. HS CODE 보유 항목은 실제로 받은 코드가 있을 때만 선택해 주세요.
                </p>
              </div>
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                HSK 10자리
                <input className="focus-ring h-10 rounded-md border border-slate-300 px-3 text-slate-950" defaultValue={prefill.hskCode ?? ""} disabled={pending} name="hskCode" placeholder="예: 3304991000" />
              </label>
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                HS6
                <input className="focus-ring h-10 rounded-md border border-slate-300 px-3 text-slate-950" defaultValue={prefill.hs6 ?? ""} disabled={pending} name="hs6" placeholder="예: 330499" />
              </label>
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                모델명
                <input className="focus-ring h-10 rounded-md border border-slate-300 px-3 text-slate-950" disabled={pending} name="modelName" />
              </label>
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                재질/성분
                <input className="focus-ring h-10 rounded-md border border-slate-300 px-3 text-slate-950" disabled={pending} name="productMaterial" />
              </label>
              <label className="grid gap-1 text-sm font-medium text-slate-700 md:col-span-2 xl:col-span-4">
                용도
                <input className="focus-ring h-10 rounded-md border border-slate-300 px-3 text-slate-950" disabled={pending} name="productUsage" placeholder="예: 피부 보습용 화장품, 산업용 부품 등" />
              </label>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="grid gap-1 md:col-span-2 xl:col-span-4">
                <p className="text-sm font-semibold text-slate-950">국가·원산지·FTA 정보</p>
                <p className="text-xs leading-5 text-slate-500">
                  국가 코드는 중국 CN, 대한민국 KR처럼 ISO 2자리로 입력합니다. FTA 적용 가능성은 선적국만으로 판단하지 않으며, 원산지·수출국·직접운송·증빙 검토가 필요합니다.
                </p>
              </div>
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                원산지
                <input className="focus-ring h-10 rounded-md border border-slate-300 px-3 text-slate-950" defaultValue={prefill.originCountryCode ?? ""} disabled={pending} name="originCountryCode" placeholder="예: CN" />
                <span className="text-xs font-normal text-slate-500">제품 원산지 또는 원산지증명서 기준 국가</span>
              </label>
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                수출국
                <input className="focus-ring h-10 rounded-md border border-slate-300 px-3 text-slate-950" defaultValue={prefill.originCountryCode ?? ""} disabled={pending} name="exportCountryCode" placeholder="예: CN" />
                <span className="text-xs font-normal text-slate-500">수출 신고 또는 판매자가 수출하는 국가</span>
              </label>
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                선적국
                <input className="focus-ring h-10 rounded-md border border-slate-300 px-3 text-slate-950" defaultValue={prefill.originCountryCode ?? ""} disabled={pending} name="shipmentCountryCode" placeholder="예: CN" />
                <span className="text-xs font-normal text-slate-500">실제 운송이 출발하는 국가</span>
              </label>
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                목적국
                <input className="focus-ring h-10 rounded-md border border-slate-300 px-3 text-slate-950" defaultValue={prefill.destinationCountryCode ?? ""} disabled={pending} name="destinationCountryCode" placeholder="예: KR" />
                <span className="text-xs font-normal text-slate-500">통관 또는 도착 기준 국가</span>
              </label>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <p className="text-sm font-semibold text-slate-950 md:col-span-2 xl:col-span-4">일정 및 물류 정보</p>
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                예상 신고 건수
                <input className="focus-ring h-10 rounded-md border border-slate-300 px-3 text-slate-950" disabled={pending} min="1" name="estimatedDeclarationCount" type="number" />
              </label>
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                Incoterms
                <input className="focus-ring h-10 rounded-md border border-slate-300 px-3 text-slate-950" disabled={pending} name="incoterms" placeholder="예: FOB, CIF" />
              </label>
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                신고 예정일(검토 기준일)
                <input className="focus-ring h-10 rounded-md border border-slate-300 px-3 text-slate-950" defaultValue={prefill.basisDate ?? ""} disabled={pending} name="preferredStartDate" type="date" />
                <span className="text-xs font-normal text-slate-500">관세율, 요건, 인허가 판단은 이 날짜를 기준으로 조회합니다.</span>
              </label>
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                입항/선적 예정일
                <input className="focus-ring h-10 rounded-md border border-slate-300 px-3 text-slate-950" disabled={pending} name="preferredArrivalDate" type="date" />
              </label>
            </div>

            <div className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 md:grid-cols-4">
              <p className="text-sm font-semibold text-slate-950 md:col-span-4">검토 요청 범위</p>
              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input className="size-4 rounded border-slate-300" disabled={pending} name="hsCodeKnown" type="checkbox" />
                확정 또는 제공받은 HS CODE가 있음
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input className="size-4 rounded border-slate-300" disabled={pending} name="ftaPreferenceRequested" type="checkbox" />
                FTA 적용 희망
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input className="size-4 rounded border-slate-300" defaultChecked={prefill.source === "hs_lookup"} disabled={pending} name="requirementsCheckNeeded" type="checkbox" />
                요건 확인 필요
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input className="size-4 rounded border-slate-300" disabled={pending} name="urgent" type="checkbox" />
                긴급 의뢰
              </label>
              <p className="text-xs leading-5 text-slate-500 md:col-span-4">
                HS 조회에서 넘어온 코드는 예비 참고값으로만 전달됩니다. 확정 또는 제공받은 HS CODE가 있을 때만 “확정 또는 제공받은 HS CODE가 있음”을 선택해 주세요. 요건 확인 필요를 선택하지 않아도 통합공고, 개별법령, 표시·인증·유통규제 검토가 별도로 필요할 수 있습니다.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-md bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-500" disabled={pending} type="submit">
                <Save aria-hidden="true" size={17} />
                {pending ? "저장 중" : "초안 저장"}
              </button>
              <span className="inline-flex items-center gap-2 text-xs text-slate-500">
                <FileCheck2 aria-hidden="true" size={15} />
                저장 후 검증 관세사무소에 견적 요청을 공개할 수 있습니다.
              </span>
            </div>

            {state.message ? (
              <p className={state.status === "success" ? "rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800" : "rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"}>
                {state.message}
              </p>
            ) : null}
          </form>
        </CardBody>
      </Card>

      <Card id="my-service-requests">
        <CardHeader
          action={<Badge tone={requests.some((request) => request.status === "draft") ? "warning" : "neutral"}>{requests.filter((request) => request.status === "draft").length}건 초안</Badge>}
          description="저장된 통관 의뢰 요청입니다. 다음 단계에서 서류 첨부와 관세사무소 공개를 연결합니다."
          title="내 통관 의뢰 요청"
        />
        <CardBody className="grid gap-3">
          <PartnerOpportunityFlowPanel kind="clearance" />
          {!schemaReady ? (
            <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
              현재 이 환경에서는 플랫폼 요청 목록 데이터가 준비되지 않아 내 통관 의뢰를 불러올 수 없습니다. 계정 문제는 아니며, HS 조회와 일반 대시보드는 사용할 수 있습니다.
            </p>
          ) : null}
          {schemaReady && requests.length === 0 ? (
            <p className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              저장된 통관 의뢰 요청이 없습니다. 위 초안 저장부터 시작해 주세요.
            </p>
          ) : null}
          {requests.map((request) => (
            <ClearanceRequestRow
              bids={bidsByRequestId[request.id] ?? []}
              compact
              completionReport={completionReportsByRequestId[request.id]}
              documents={documentsByRequestId[request.id] ?? []}
              feedbackByRequestId={feedbackByRequestId}
              key={request.id}
              questions={questionsByRequestId[request.id] ?? []}
              request={request}
            />
          ))}
        </CardBody>
      </Card>
        </>
      ) : (
        <Card>
        <CardHeader
          action={<Badge tone={opportunities.length > 0 ? "info" : "neutral"}>{opportunities.length}건</Badge>}
          description="조건에 맞게 공개된 통관 의뢰입니다. 관세사무소는 수수료, 필요서류, 예상 리드타임을 제안합니다."
          title="입찰 가능 통관 의뢰"
        />
        <CardBody className="grid gap-3">
          {!schemaReady ? (
            <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
              현재 이 환경에서는 관세사무소 입찰 데이터가 준비되지 않아 입찰 가능 요청을 불러올 수 없습니다. 역할 권한 확인은 플랫폼 데이터 준비 후 진행합니다.
            </p>
          ) : null}
          {schemaReady && opportunities.length === 0 ? (
            <p className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              관심 조건과 회사 검증 상태에 맞는 공개 요청이 생기면 표시됩니다.
            </p>
          ) : null}
          {opportunities.map((opportunity) => (
            <ClearanceOpportunityRow
              compact
              completionReport={completionReportsByRequestId[opportunity.id]}
              documents={documentsByRequestId[opportunity.id] ?? []}
              feedbackByRequestId={feedbackByRequestId}
              key={opportunity.matchId}
              opportunity={opportunity}
              questions={questionsByRequestId[opportunity.id] ?? []}
            />
          ))}
        </CardBody>
      </Card>
      )}
    </div>
  );
}
