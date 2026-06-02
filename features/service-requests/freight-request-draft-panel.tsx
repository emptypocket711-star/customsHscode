"use client";

import { useActionState, useEffect, useState } from "react";
import { CheckCircle2, FileUp, PackagePlus, RadioTower, Save } from "lucide-react";
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
import { ServiceRequestMatchSummaryPanel } from "@/features/service-requests/service-request-match-summary-panel";
import {
  PartnerVisibleDocumentNotice,
  ServiceRequestDocumentVisibilityGuide
} from "@/features/service-requests/service-request-document-visibility-guide";
import { ServiceRequestFeedbackForm } from "@/features/service-requests/service-request-feedback-form";
import {
  countServiceRequestStatuses,
  isSelectedOrLaterStatus,
  serviceRequestBidStatusLabel,
  serviceRequestBidStatusTone,
  serviceRequestDocumentTypeLabel
} from "@/features/service-requests/service-request-status";
import {
  answerFreightRequestQuestionAction,
  askFreightRequestQuestionAction,
  completeSelectedFreightRequestAction,
  createFreightRequestDraftAction,
  publishFreightRequestAction,
  selectFreightBidAction,
  startSelectedFreightRequestAction,
  submitFreightBidAction,
  uploadFreightRequestDocumentAction
} from "@/server/actions/freight-requests.actions";
import type { FreightRequestDocumentUploadActionState } from "@/features/service-requests/freight-request-document-schemas";
import type { FreightRequestQuestionActionState } from "@/features/service-requests/freight-request-question-schemas";
import type {
  FreightBidSelectActionState,
  FreightBidSubmitActionState
} from "@/features/service-requests/freight-bid-schemas";
import type {
  FreightRequestDraftActionState,
  FreightRequestPublishActionState
} from "@/features/service-requests/freight-request-schemas";
import type { ServiceRequestLifecycleActionState } from "@/features/service-requests/service-request-lifecycle-schemas";
import type {
  FreightOpportunityItem,
  FreightRequestDocumentItem,
  FreightRequestQuestionItem,
  ReceivedFreightBidItem,
  FreightRequestListItem
} from "@/server/repositories/freight-requests.repository";
import type {
  ServiceRequestCompletionReport,
  ServiceRequestCompletionReportDocument
} from "@/server/repositories/service-request-completion-report.repository";
import type { OwnServiceRequestFeedback } from "@/server/repositories/service-request-feedback.repository";

const draftInitialState: FreightRequestDraftActionState = {
  status: "idle"
};

const publishInitialState: FreightRequestPublishActionState = {
  status: "idle"
};

const bidInitialState: FreightBidSubmitActionState = {
  status: "idle"
};

const selectBidInitialState: FreightBidSelectActionState = {
  status: "idle"
};
const lifecycleInitialState: ServiceRequestLifecycleActionState = {
  status: "idle"
};

const documentUploadInitialState: FreightRequestDocumentUploadActionState = {
  status: "idle"
};

const questionInitialState: FreightRequestQuestionActionState = {
  status: "idle"
};

const freightDraftReadinessFields = [
  "title",
  "productSummary",
  "direction",
  "originCountryCode",
  "destinationCountryCode",
  "transportMode",
  "originPlace",
  "destinationPlace",
  "incoterms",
  "packageCount",
  "grossWeight",
  "cbm"
] as const;

function readFormValues(form: HTMLFormElement, fields: readonly string[]) {
  const formData = new FormData(form);
  return Object.fromEntries(fields.map((field) => [field, String(formData.get(field) ?? "")]));
}

function visibilityLabel(visibility: string) {
  if (visibility === "requester_only") return "나와 운영자만";
  if (visibility === "matched_partner_after_interest") return "매칭된 포워더에게 공개";
  if (visibility === "selected_partner") return "선정된 포워더에게만 공개";
  if (visibility === "operator_only") return "운영자만";
  return visibility;
}

function formatAmount(amount: number | null, currency: string | null) {
  if (amount === null) return "-";
  return `${currency ?? ""} ${amount.toLocaleString("ko-KR")}`.trim();
}

function partnerFeedbackLabel(feedback: ReceivedFreightBidItem["partnerFeedback"]) {
  if (!feedback || feedback.feedbackCount === 0 || feedback.avgRating === null) return "거래 후기 없음";
  return `거래 후기 ${feedback.feedbackCount}건 / 평균 ${feedback.avgRating.toFixed(1)}점`;
}

function partnerTrustLabel(trust: ReceivedFreightBidItem["partnerTrust"]) {
  if (!trust) return "검증 정보 확인중";
  if (trust.verificationStatus === "recommended_partner") return `추천 파트너 · 신뢰 ${trust.trustScore}`;
  if (trust.verificationStatus === "operator_approved") return `운영 검증 · 신뢰 ${trust.trustScore}`;
  if (trust.verificationStatus === "trade_history") return `거래 이력 · 신뢰 ${trust.trustScore}`;
  return `검증 ${trust.verificationStatus}`;
}

function FreightBidComparisonGuide({ bids }: { bids: ReceivedFreightBidItem[] }) {
  const reviewedCount = bids.filter((bid) => bid.partnerFeedback && bid.partnerFeedback.feedbackCount > 0).length;
  const pricedBids = bids.filter((bid) => bid.totalAmount !== null);
  const lowestBid = pricedBids.length > 0
    ? pricedBids.reduce((lowest, bid) => (bid.totalAmount !== null && lowest.totalAmount !== null && bid.totalAmount < lowest.totalAmount ? bid : lowest))
    : null;

  return (
    <div className="grid gap-2 rounded-md border border-blue-100 bg-blue-50 p-3 text-xs leading-5 text-blue-950 md:grid-cols-4">
      <p className="font-semibold md:col-span-4">견적 비교 기준</p>
      <p className="rounded-md bg-white p-2">총액: {lowestBid ? `최저 ${formatAmount(lowestBid.totalAmount, lowestBid.currency)}` : "금액 입력 대기"}</p>
      <p className="rounded-md bg-white p-2">리드타임: 선적 가능일과 운송일수 확인</p>
      <p className="rounded-md bg-white p-2">후기: 거래 후기 보유 {reviewedCount}/{bids.length}곳</p>
      <p className="rounded-md bg-white p-2">조건: 포함·제외 비용, free time, 특수화물 조건 확인</p>
    </div>
  );
}

function FreightPreSelectChecklist({ bid }: { bid: ReceivedFreightBidItem }) {
  const items = [
    { done: bid.totalAmount !== null, label: "총액" },
    { done: bid.leadTimeDays !== null || bid.transitTimeDays !== null, label: "일정" },
    { done: Boolean(bid.partnerTrust), label: "검증" },
    { done: Boolean(bid.partnerFeedback && bid.partnerFeedback.feedbackCount > 0), label: "후기" },
    { done: Boolean(bid.message || bid.carrierNote || bid.freeTimeNote), label: "조건" }
  ];

  return (
    <div className="grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold text-slate-800">선정 전 확인</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            className={item.done ? "rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800" : "rounded-md bg-white px-2 py-1 text-xs font-medium text-slate-500"}
            key={item.label}
          >
            {item.done ? "확인" : "미확인"} · {item.label}
          </span>
        ))}
      </div>
      <p className="text-xs leading-5 text-slate-600">
        선택 전 총액, 일정, 검증 상태, 후기, 포함·제외 조건을 함께 확인해 주세요.
      </p>
    </div>
  );
}

function freightBidComparisonBadges(bid: ReceivedFreightBidItem, bids: ReceivedFreightBidItem[]) {
  const pricedBids = bids.filter((item) => item.totalAmount !== null);
  const leadTimeBids = bids.filter((item) => item.leadTimeDays !== null);
  const lowestAmount = pricedBids.length > 0 ? Math.min(...pricedBids.map((item) => item.totalAmount ?? Infinity)) : null;
  const shortestLeadTime = leadTimeBids.length > 0 ? Math.min(...leadTimeBids.map((item) => item.leadTimeDays ?? Infinity)) : null;
  const badges = [];

  if (bid.totalAmount !== null && bid.totalAmount === lowestAmount) badges.push({ label: "최저 총액", tone: "success" as const });
  if (bid.leadTimeDays !== null && bid.leadTimeDays === shortestLeadTime) badges.push({ label: "최단 리드타임", tone: "info" as const });
  if (bid.partnerFeedback && bid.partnerFeedback.feedbackCount > 0) badges.push({ label: "후기 보유", tone: "info" as const });

  return badges;
}

function statusLabel(status: string) {
  if (status === "draft") return "임시저장";
  if (status === "open") return "모집중";
  if (status === "bids_received") return "견적 도착";
  if (status === "partner_selected") return "업체 선정";
  if (status === "in_progress") return "진행중";
  if (status === "completed") return "완료";
  if (status === "cancelled") return "취소";
  if (status === "expired") return "만료";
  return status;
}

function statusTone(status: string): "neutral" | "warning" | "info" | "success" {
  if (status === "draft") return "neutral";
  if (status === "open") return "info";
  if (status === "bids_received") return "warning";
  if (status === "partner_selected" || status === "in_progress" || status === "completed") return "success";
  return "neutral";
}

function nextActionLabel(input: {
  bids: ReceivedFreightBidItem[];
  documents: FreightRequestDocumentItem[];
  hasPublishFields: boolean;
  questions: FreightRequestQuestionItem[];
  status: string;
}) {
  if (input.status === "draft" && !input.hasPublishFields) return "공개 필수 조건 입력 필요";
  if (input.status === "draft") return "포워더에게 견적 요청 공개 가능";
  if (input.status === "partner_selected") return "선정 포워더와 진행 시작";
  if (input.status === "in_progress") return "운송 완료 처리와 리포트 준비";
  if (input.status === "completed") return "완료 리포트·후기 확인";
  if (input.questions.some((question) => !question.answer)) return "포워더 질문 답변 필요";
  if (input.status === "bids_received" && input.bids.length > 0) return "견적 비교 후 포워더 선정";
  if (input.status === "open") return "마감 전 질문·견적 대기";
  return "상태 확인 필요";
}

function missingFreightPublishFieldLabels(request: FreightRequestListItem) {
  return [
    { label: "출발 국가", value: request.originCountryCode },
    { label: "도착 국가", value: request.destinationCountryCode },
    { label: "운송 방식", value: request.transportMode }
  ]
    .filter((item) => !item.value)
    .map((item) => item.label);
}

function FreightLifecycleControls({
  compact = false,
  completionReport,
  completionReportDocuments = [],
  documents,
  existingFeedback,
  requestId,
  status,
  viewerRole
}: {
  compact?: boolean;
  completionReport?: ServiceRequestCompletionReport;
  completionReportDocuments?: ServiceRequestCompletionReportDocument[];
  documents: FreightRequestDocumentItem[];
  existingFeedback?: OwnServiceRequestFeedback;
  requestId: string;
  status: string;
  viewerRole: "partner" | "requester";
}) {
  const router = useRouter();
  const [startState, startAction, startPending] = useActionState(startSelectedFreightRequestAction, lifecycleInitialState);
  const [completeState, completeAction, completePending] = useActionState(completeSelectedFreightRequestAction, lifecycleInitialState);

  useEffect(() => {
    if (startState.status !== "idle" || completeState.status !== "idle") {
      window.dispatchEvent(new Event("hsfinder:navigation-progress-done"));
    }
    if (startState.status === "success" || completeState.status === "success") {
      router.refresh();
    }
  }, [completeState.status, router, startState.status]);

  if (status === "completed") {
    if (compact) {
      return (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs leading-5 text-emerald-900">
          완료 리포트, 보관 서류, 거래 피드백은 상세 작업에서 확인합니다.
        </p>
      );
    }

    return (
      <div className="grid scroll-mt-6 gap-3" id="request-completion">
        <p className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          운송 요청이 완료 처리되었습니다. 완료 리포트와 보관 서류를 확인하고, 거래 품질 피드백을 남길 수 있습니다.
        </p>
        <ServiceRequestCompletionReportPanel documents={documents} kind="freight" report={completionReport} reportDocuments={completionReportDocuments} requestId={requestId} viewerRole={viewerRole} />
        <ServiceRequestFeedbackForm existingFeedback={existingFeedback} requestId={requestId} />
      </div>
    );
  }

  if (status === "partner_selected") {
    return (
      <form action={startAction} className="flex scroll-mt-6 flex-wrap items-center gap-3" id="request-lifecycle">
        <input name="requestId" type="hidden" value={requestId} />
        <button className="focus-ring inline-flex h-10 items-center justify-center rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-500" disabled={startPending} type="submit">
          {startPending ? "처리 중" : "운송 진행 시작"}
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
          {completePending ? "완료 처리 중" : "운송 완료 처리"}
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

function RequestProgress({
  bids,
  documents,
  hasPublishFields,
  questions,
  status
}: {
  bids: ReceivedFreightBidItem[];
  documents: FreightRequestDocumentItem[];
  hasPublishFields: boolean;
  questions: FreightRequestQuestionItem[];
  status: string;
}) {
  const steps = [
    { done: true, label: "초안" },
    { done: documents.length > 0, label: "서류" },
    { done: status !== "draft", label: "공개" },
    { done: questions.length > 0 && questions.every((question) => question.answer), label: "질문" },
    { done: bids.length > 0, label: "견적" },
    { done: isSelectedOrLaterStatus(status), label: "선정" }
  ];

  return (
    <div className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
      <div className="flex flex-wrap items-center gap-2">
        {steps.map((step, index) => (
          <span
            className={
              step.done
                ? "inline-flex items-center rounded-md bg-blue-700 px-2.5 py-1 text-xs font-semibold text-white"
                : "inline-flex items-center rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600"
            }
            key={step.label}
          >
            {index + 1}. {step.label}
          </span>
        ))}
      </div>
      <p className="text-xs font-semibold text-slate-700">
        다음 작업: {nextActionLabel({ bids, documents, hasPublishFields, questions, status })}
      </p>
    </div>
  );
}

function ReceivedFreightBidRow({
  bid,
  bids,
  requestStatus
}: {
  bid: ReceivedFreightBidItem;
  bids: ReceivedFreightBidItem[];
  requestStatus: string;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(selectFreightBidAction, selectBidInitialState);
  const canSelect = requestStatus !== "partner_selected" && (bid.status === "submitted" || bid.status === "shortlisted");
  const comparisonBadges = freightBidComparisonBadges(bid, bids);

  useEffect(() => {
    if (state.status !== "idle") {
      window.dispatchEvent(new Event("hsfinder:navigation-progress-done"));
    }
    if (state.status === "success") {
      router.refresh();
    }
  }, [router, state.status]);

  return (
    <div className="grid gap-3 rounded-md border border-slate-200 bg-white p-3">
      <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-slate-950">
              {formatAmount(bid.totalAmount, bid.currency)}
            </p>
            <Badge tone={serviceRequestBidStatusTone(bid.status)}>{serviceRequestBidStatusLabel(bid.status)}</Badge>
            <Badge tone="neutral">업체 {bid.bidderCompanyId.slice(0, 8)}</Badge>
            <Badge tone={bid.partnerTrust?.verificationStatus === "recommended_partner" ? "success" : bid.partnerTrust ? "info" : "neutral"}>{partnerTrustLabel(bid.partnerTrust)}</Badge>
            <Badge tone={bid.partnerFeedback ? "info" : "neutral"}>{partnerFeedbackLabel(bid.partnerFeedback)}</Badge>
            {comparisonBadges.map((badge) => (
              <Badge key={badge.label} tone={badge.tone}>{badge.label}</Badge>
            ))}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            유효기한 {bid.validUntil ?? "-"} / 리드타임 {bid.leadTimeDays ?? "-"}일 / 운송 {bid.transitTimeDays ?? "-"}일
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
            {bid.status === "selected" ? "선정됨" : pending ? "선정 중" : "이 포워더 선정"}
          </button>
        </form>
      </div>
      <div className="grid gap-2 rounded-md bg-slate-50 p-3 text-xs text-slate-600 md:grid-cols-3">
        <span>운임 {formatAmount(bid.freightRateAmount, bid.currency)}</span>
        <span>로컬 {formatAmount(bid.localChargeAmount, bid.currency)}</span>
        <span>부대비용 {formatAmount(bid.surchargeAmount, bid.currency)}</span>
      </div>
      <FreightPreSelectChecklist bid={bid} />
      {bid.message ? <p className="text-sm leading-6 text-slate-600">{bid.message}</p> : null}
      {state.message && state.bidId === bid.bidId ? (
        <p
          className={
            state.status === "success"
              ? "rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
              : "rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"
          }
        >
          {state.message}
        </p>
      ) : null}
    </div>
  );
}

function SelectedFreightPartnerNextSteps({
  documents,
  selectedBid
}: {
  documents: FreightRequestDocumentItem[];
  selectedBid?: ReceivedFreightBidItem;
}) {
  const selectedPartnerDocuments = documents.filter((document) => document.visibility === "selected_partner").length;

  return (
    <div className="grid gap-3 rounded-md border border-emerald-200 bg-emerald-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-emerald-950">포워더 선정 후 다음 업무</p>
          <p className="mt-1 text-xs leading-5 text-emerald-900">
            선정된 포워더와 운송 일정, 비용 포함 범위, 서류 전달 범위를 확정해 주세요.
          </p>
        </div>
        <Badge tone="success">선정 완료</Badge>
      </div>
      {selectedBid ? (
        <div className="grid gap-2 rounded-md bg-white p-3 text-xs text-slate-700 md:grid-cols-3">
          <span>선정 견적 {formatAmount(selectedBid.totalAmount, selectedBid.currency)}</span>
          <span>리드타임 {selectedBid.leadTimeDays ?? "-"}일</span>
          <span>운송일수 {selectedBid.transitTimeDays ?? "-"}일</span>
        </div>
      ) : null}
      <div className="grid gap-2 text-xs leading-5 text-emerald-950 md:grid-cols-3">
        <p className="rounded-md bg-white p-3">1. 최종 선적 일정, Incoterms, 비용 포함·제외 범위를 포워더와 확인합니다.</p>
        <p className="rounded-md bg-white p-3">2. Commercial Invoice, Packing List, B/L 또는 AWB 등 필요한 서류를 선정 포워더 공개 범위로 첨부합니다.</p>
        <p className="rounded-md bg-white p-3">3. 위험물, 온도관리, 중고차 등 특수 조건은 운송 전 별도 확인이 필요합니다.</p>
      </div>
      <SelectedPartnerDocumentHandoff count={selectedPartnerDocuments} kind="freight" />
      <p className="text-xs leading-5 text-emerald-900">
        선정 포워더 전용 공개 서류 {selectedPartnerDocuments}건입니다. 민감 단가가 포함된 서류는 공개 범위를 확인한 뒤 첨부하세요.
      </p>
    </div>
  );
}

function FreightQuestionAnswerRow({ question }: { question: FreightRequestQuestionItem }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(answerFreightRequestQuestionAction, questionInitialState);

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
      <div>
        <p className="text-xs font-semibold text-slate-500">업체 {question.bidderCompanyId.slice(0, 8)} 질문</p>
        <p className="mt-1 text-sm leading-6 text-slate-800">{question.question}</p>
      </div>
      {question.answer ? (
        <p className="rounded-md border border-emerald-100 bg-emerald-50 p-3 text-sm leading-6 text-emerald-900">
          {question.answer}
        </p>
      ) : (
        <form action={action} className="grid gap-2 md:grid-cols-[1fr_auto]">
          <input name="questionId" type="hidden" value={question.questionId} />
          <textarea
            className="focus-ring min-h-16 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950"
            disabled={pending}
            name="answer"
            placeholder="견적 산정에 필요한 조건을 답변해 주세요."
            required
          />
          <button
            className="focus-ring inline-flex h-10 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500"
            disabled={pending}
            type="submit"
          >
            {pending ? "등록 중" : "답변 등록"}
          </button>
        </form>
      )}
      {state.message && state.questionId === question.questionId ? (
        <p
          className={
            state.status === "success"
              ? "rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
              : "rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"
          }
        >
          {state.message}
        </p>
      ) : null}
    </div>
  );
}

export function FreightRequestRow({
  anchorPrefix,
  bids,
  compact = false,
  completionReport,
  completionReportDocuments = [],
  documents,
  questions,
  feedbackByRequestId = {},
  request
}: {
  anchorPrefix?: string;
  bids: ReceivedFreightBidItem[];
  compact?: boolean;
  completionReport?: ServiceRequestCompletionReport;
  completionReportDocuments?: ServiceRequestCompletionReportDocument[];
  documents: FreightRequestDocumentItem[];
  feedbackByRequestId?: Record<string, OwnServiceRequestFeedback>;
  questions: FreightRequestQuestionItem[];
  request: FreightRequestListItem;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(publishFreightRequestAction, publishInitialState);
  const [documentState, documentAction, documentPending] = useActionState(uploadFreightRequestDocumentAction, documentUploadInitialState);
  const hasPublishFields = Boolean(request.originCountryCode && request.destinationCountryCode && request.transportMode);
  const missingPublishFields = missingFreightPublishFieldLabels(request);
  const canPublish = request.status === "draft" && hasPublishFields;
  const hasBids = bids.length > 0;
  const unansweredQuestionCount = questions.filter((question) => !question.answer).length;
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
      <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold text-slate-950">{request.title}</p>
            <Badge tone={statusTone(request.status)}>{statusLabel(request.status)}</Badge>
            <Badge tone="neutral">{request.direction === "export" ? "수출" : "수입"}</Badge>
            {unansweredQuestionCount > 0 ? <Badge tone="warning">미답변 질문 {unansweredQuestionCount}건</Badge> : null}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {request.originCountryCode ?? "-"} -&gt; {request.destinationCountryCode ?? "-"} / {request.originPort ?? "-"} -&gt; {request.destinationPort ?? "-"} / {request.transportMode ?? "운송 방식 미정"}
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-[150px_auto]">
          <Link
            className="focus-ring inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:col-span-2"
            href={`/requests/freight/${request.id}`}
          >
            상세 작업
          </Link>
          {!compact ? (
            <form action={action} className="grid scroll-mt-6 gap-2 sm:col-span-2 sm:grid-cols-[150px_auto]" id={anchorPrefix ? `${anchorPrefix}-publish` : undefined}>
              <input name="requestId" type="hidden" value={request.id} />
              <label className="grid gap-1 text-xs font-semibold text-slate-600">
                견적 접수 마감
                <select
                  className="focus-ring h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 disabled:bg-slate-100 disabled:text-slate-400"
                  disabled={!canPublish || pending}
                  name="deadlineHours"
                  defaultValue="24"
                >
                  <option value="24">24시간</option>
                  <option value="48">48시간</option>
                </select>
              </label>
              <button
                className="focus-ring mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-500"
                disabled={!canPublish || pending}
                type="submit"
              >
                <RadioTower aria-hidden="true" size={16} />
                {pending ? "공개 중" : "포워더에게 견적 요청 공개"}
              </button>
            </form>
          ) : null}
        </div>
      </div>
      <RequestProgress
        bids={bids}
        documents={documents}
        hasPublishFields={hasPublishFields}
        questions={questions}
        status={request.status}
      />
      <ServiceRequestMatchSummaryPanel kind="freight" partnerLabel="포워더" status={request.status} summary={request.matchSummary} />
      {!compact && (request.status === "partner_selected" || request.status === "in_progress" || request.status === "completed") ? (
        <SelectedFreightPartnerNextSteps documents={documents} selectedBid={selectedBid} />
      ) : null}
      <FreightLifecycleControls compact={compact} completionReport={completionReport} completionReportDocuments={completionReportDocuments} documents={documents} existingFeedback={feedbackByRequestId[request.id]} requestId={request.id} status={request.status} viewerRole="requester" />
      {request.status === "draft" && !hasPublishFields ? (
        <div className="grid gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <p className="font-semibold">포워더 공개 전 필수값을 보완해야 합니다.</p>
            <p>누락값: {missingPublishFields.join(", ")}</p>
          </div>
          <a
            className="focus-ring inline-flex h-9 items-center justify-center rounded-md border border-amber-300 bg-white px-3 text-xs font-semibold text-amber-900 hover:bg-amber-100"
            href="#request-draft-form"
          >
            초안 작성으로 이동
          </a>
        </div>
      ) : null}
      <div className="grid gap-2 rounded-md bg-slate-50 p-3 text-xs text-slate-600 md:grid-cols-4">
        <span>중량 {request.grossWeight ?? "-"} KG</span>
        <span>CBM {request.cbm ?? "-"}</span>
        <span>생성 {request.createdAt.slice(0, 10)}</span>
        <span>마감 {request.deadlineAt ? request.deadlineAt.slice(0, 10) : "-"}</span>
      </div>
      {request.productSummary ? <p className="text-sm leading-6 text-slate-600">{request.productSummary}</p> : null}
      {compact ? (
        <p className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600">
          서류 {documents.length}건 / 질문 {questions.length}건 / 견적 {bids.length}건입니다. 첨부, 답변, 견적 비교와 공개 설정은 상세 작업에서 처리합니다.
        </p>
      ) : null}
      {compact && (request.status === "partner_selected" || request.status === "in_progress" || request.status === "completed") ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs leading-5 text-emerald-900">
          선정된 포워더와 후속 일정, 비용 포함 범위, 선정 파트너 전용 서류를 상세 작업에서 관리합니다.
        </p>
      ) : null}
      {compact ? null : (
        <>
      <div id={anchorPrefix ? `${anchorPrefix}-documents` : undefined} className="scroll-mt-6 grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-slate-900">첨부 서류</p>
          <Badge tone={documents.length > 0 ? "info" : "neutral"}>{documents.length}건</Badge>
        </div>
        <p className="text-xs leading-5 text-slate-600">
          민감 단가가 포함된 서류는 공개 범위를 확인하세요.
        </p>
        <ServiceRequestDocumentVisibilityGuide kind="freight" />
        {documents.length > 0 ? (
          <div className="grid gap-2">
            {documents.map((document) => (
              <div className="grid gap-1 rounded-md bg-white p-3 text-sm text-slate-700 md:grid-cols-[1fr_auto] md:items-center" key={document.documentId}>
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-950">{document.fileName}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {serviceRequestDocumentTypeLabel(document.documentType)} / {visibilityLabel(document.visibility)} / {document.createdAt.slice(0, 10)}
                  </p>
                </div>
                <span className="text-xs text-slate-500">{document.fileSize ? `${Math.ceil(document.fileSize / 1024).toLocaleString("ko-KR")} KB` : "-"}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-md bg-white p-3 text-sm text-slate-600">아직 첨부된 요청 서류가 없습니다.</p>
        )}
        <details className="rounded-md border border-slate-200 bg-white">
          <summary className="cursor-pointer list-none px-3 py-2 text-sm font-semibold text-slate-800">
            서류 추가하기
          </summary>
          <form action={documentAction} className="grid gap-3 border-t border-slate-200 p-3 md:grid-cols-[160px_180px_1fr_auto] md:items-end" encType="multipart/form-data">
            <input name="requestId" type="hidden" value={request.id} />
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              서류 유형
              <select className="focus-ring h-10 rounded-md border border-slate-300 bg-white px-3 text-slate-950" disabled={documentPending} name="documentType" required>
                <option value="commercial_invoice">Commercial Invoice</option>
                <option value="packing_list">Packing List</option>
                <option value="bill_of_lading">B/L</option>
                <option value="air_waybill">AWB</option>
                <option value="certificate_of_origin">C/O</option>
                <option value="catalog">카탈로그</option>
                <option value="spec_sheet">사양서</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              공개 범위
              <select className="focus-ring h-10 rounded-md border border-slate-300 bg-white px-3 text-slate-950" disabled={documentPending} name="visibility" required>
                <option value="requester_only">나와 운영자만</option>
                <option value="matched_partner_after_interest">매칭된 포워더에게 공개</option>
                <option value="selected_partner">선정된 포워더에게만 공개</option>
                <option value="operator_only">운영자만</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              파일
              <input className="focus-ring h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950" disabled={documentPending} name="file" required type="file" />
            </label>
            <button
              className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500"
              disabled={documentPending}
              type="submit"
            >
              <FileUp aria-hidden="true" size={16} />
              {documentPending ? "업로드 중" : "서류 첨부"}
            </button>
          </form>
        </details>
        {documentState.message && documentState.requestId === request.id ? (
          <p
            className={
              documentState.status === "success"
                ? "rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
                : "rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"
            }
          >
          {documentState.message}
        </p>
      ) : null}
      </div>
      <div id={anchorPrefix ? `${anchorPrefix}-questions` : undefined} className="scroll-mt-6 grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-slate-900">포워더 질문</p>
          <Badge tone={unansweredQuestionCount > 0 ? "warning" : questions.length > 0 ? "success" : "neutral"}>
            {questions.length > 0 ? `${questions.length}건` : "대기"}
          </Badge>
        </div>
        {questions.length > 0 ? (
          <div className="grid gap-2">
            {questions.map((question) => (
              <FreightQuestionAnswerRow key={question.questionId} question={question} />
            ))}
          </div>
        ) : (
          <p className="rounded-md bg-white p-3 text-sm text-slate-600">
            아직 포워더 질문이 없습니다. 요청 공개 후 포워더가 조건 확인 질문을 남길 수 있습니다.
          </p>
        )}
      </div>
      {hasBids ? (
        <div id={anchorPrefix ? `${anchorPrefix}-bids` : undefined} className="scroll-mt-6 grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-slate-900">받은 견적</p>
            <Badge tone={bids.some((bid) => bid.status === "selected") ? "success" : "info"}>{bids.length}건</Badge>
          </div>
          <div className="grid gap-2">
            <FreightBidComparisonGuide bids={bids} />
            {bids.map((bid) => (
              <ReceivedFreightBidRow key={bid.bidId} bid={bid} bids={bids} requestStatus={request.status} />
            ))}
          </div>
        </div>
      ) : (
        <div id={anchorPrefix ? `${anchorPrefix}-bids` : undefined} className="scroll-mt-6 grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-slate-900">받은 견적</p>
            <Badge tone="neutral">대기</Badge>
          </div>
          <p className="rounded-md bg-white p-3 text-sm text-slate-600">
            아직 제출된 견적이 없습니다. 공개 후 마감 전까지 포워더 견적이 도착하면 비교할 수 있습니다.
          </p>
        </div>
      )}
      {state.message && state.requestId === request.id ? (
        <p
          className={
            state.status === "success"
              ? "rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
              : "rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"
          }
        >
          {state.message}
        </p>
      ) : null}
        </>
      )}
    </div>
  );
}

export function FreightOpportunityRow({
  anchorPrefix,
  compact = false,
  completionReport,
  completionReportDocuments = [],
  documents = [],
  feedbackByRequestId = {},
  opportunity,
  questions = []
}: {
  anchorPrefix?: string;
  compact?: boolean;
  completionReport?: ServiceRequestCompletionReport;
  completionReportDocuments?: ServiceRequestCompletionReportDocument[];
  documents?: FreightRequestDocumentItem[];
  feedbackByRequestId?: Record<string, OwnServiceRequestFeedback>;
  opportunity: FreightOpportunityItem;
  questions?: FreightRequestQuestionItem[];
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(submitFreightBidAction, bidInitialState);
  const [questionState, questionAction, questionPending] = useActionState(askFreightRequestQuestionAction, questionInitialState);
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
    <div className="grid gap-3 rounded-md border border-slate-200 bg-white p-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-semibold text-slate-950">{opportunity.title}</p>
              <Badge tone={statusTone(opportunity.status)}>{statusLabel(opportunity.status)}</Badge>
              <Badge tone="neutral">{opportunity.direction === "export" ? "수출" : "수입"}</Badge>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {opportunity.originCountryCode ?? "-"} -&gt; {opportunity.destinationCountryCode ?? "-"} / {opportunity.originPort ?? "-"} -&gt; {opportunity.destinationPort ?? "-"} / {opportunity.transportMode ?? "운송 방식 미정"}
            </p>
          </div>
          <Link
            className="focus-ring inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            href={`/requests/freight/opportunities/${opportunity.id}`}
          >
            입찰 작업
          </Link>
        </div>
      </div>

      {compact ? (
        <p className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600">
          공개 서류 {documents.length}건 / 질문 {questions.length}건입니다. {opportunity.status === "partner_selected" || opportunity.status === "in_progress" || opportunity.status === "completed" ? "선정 후 업무는 입찰 작업에서 확인합니다." : "조건 확인, 질문 등록, 운송 견적 제출은 입찰 작업에서 처리합니다."}
        </p>
      ) : null}

      {compact ? null : (
        <>
      {opportunity.status === "partner_selected" || opportunity.status === "in_progress" || opportunity.status === "completed" ? (
        <div className="grid gap-3 rounded-md border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-emerald-950">선정된 운송 요청</p>
              <p className="mt-1 text-xs leading-5 text-emerald-900">
                {opportunity.status === "completed"
                  ? "운송 요청이 완료 처리되었습니다."
                  : opportunity.status === "in_progress"
                    ? "선정된 운송 요청이 진행 중입니다. 완료 시 완료 처리를 진행해 주세요."
                    : "화주가 귀사를 포워더로 선정했습니다. 최종 선적 일정, 비용 포함 범위, 필요 서류 전달 방식을 확정해 주세요."}
              </p>
            </div>
            <Badge tone="success">{statusLabel(opportunity.status)}</Badge>
          </div>
          <div className="grid gap-2 text-xs leading-5 text-emerald-950 md:grid-cols-3">
            <p className="rounded-md bg-white p-3">1. 선적 가능 일정과 운송 조건을 화주와 확정합니다.</p>
            <p className="rounded-md bg-white p-3">2. 선정 포워더 공개 범위로 첨부된 CI/PL/B/L/AWB 등 서류를 확인합니다.</p>
            <p className="rounded-md bg-white p-3">3. 위험물, 온도관리, 중고차 등 특수 조건은 진행 전 추가 확인합니다.</p>
          </div>
          <SelectedPartnerDocumentHandoff count={selectedPartnerDocuments} kind="freight" />
        </div>
      ) : null}
      <FreightLifecycleControls completionReport={completionReport} completionReportDocuments={completionReportDocuments} documents={documents} existingFeedback={feedbackByRequestId[opportunity.id]} requestId={opportunity.id} status={opportunity.status} viewerRole="partner" />
      <div id={anchorPrefix ? `${anchorPrefix}-documents` : undefined} className="scroll-mt-6 grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold text-slate-800">공개된 요청 서류</p>
          <Badge tone={documents.length > 0 ? "info" : "neutral"}>{documents.length}건</Badge>
        </div>
        <PartnerVisibleDocumentNotice kind="freight" />
        {documents.length > 0 ? (
          <div className="grid gap-2">
            {documents.map((document) => (
              <p className="rounded-md bg-white p-2 text-xs leading-5 text-slate-600" key={document.documentId}>
                <span className="font-semibold text-slate-900">{serviceRequestDocumentTypeLabel(document.documentType)}</span> · {document.fileName} · {visibilityLabel(document.visibility)}
              </p>
            ))}
          </div>
        ) : (
          <p className="rounded-md bg-white p-2 text-xs leading-5 text-slate-600">
            화주가 포워더에게 공개한 서류가 아직 없습니다. 견적 메시지에서 필요한 운송 서류를 요청해 주세요.
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
      </div>

      {opportunity.status === "partner_selected" || opportunity.status === "in_progress" || opportunity.status === "completed" ? null : (
      <form id={anchorPrefix ? `${anchorPrefix}-bid` : undefined} action={action} className="scroll-mt-6 grid gap-3 rounded-md bg-slate-50 p-3">
        <input name="requestId" type="hidden" value={opportunity.id} />
        <div className="grid gap-1">
          <p className="text-sm font-semibold text-slate-950">포워더 운송 견적 제출</p>
          <p className="text-xs leading-5 text-slate-500">
            총액, 포함·제외 비용, 유효기한, 리드타임을 함께 입력해 주세요. 위험물, 온도관리, 중고차 등 특수 조건은 견적 메모에 남기거나 제출 전 질문으로 확인합니다.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            통화
            <input className="focus-ring h-10 rounded-md border border-slate-300 bg-white px-3 text-slate-950" defaultValue="USD" disabled={pending} name="currency" required />
          </label>
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            총 견적 금액
            <input className="focus-ring h-10 rounded-md border border-slate-300 bg-white px-3 text-slate-950" disabled={pending} min="0" name="totalAmount" required step="0.01" type="number" />
          </label>
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            운임
            <input className="focus-ring h-10 rounded-md border border-slate-300 bg-white px-3 text-slate-950" disabled={pending} min="0" name="freightRateAmount" step="0.01" type="number" />
          </label>
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            로컬 비용
            <input className="focus-ring h-10 rounded-md border border-slate-300 bg-white px-3 text-slate-950" disabled={pending} min="0" name="localChargeAmount" step="0.01" type="number" />
          </label>
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            유효기한
            <input className="focus-ring h-10 rounded-md border border-slate-300 bg-white px-3 text-slate-950" disabled={pending} name="validUntil" type="date" />
          </label>
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            리드타임
            <input className="focus-ring h-10 rounded-md border border-slate-300 bg-white px-3 text-slate-950" disabled={pending} min="1" name="leadTimeDays" type="number" />
          </label>
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            운송일수
            <input className="focus-ring h-10 rounded-md border border-slate-300 bg-white px-3 text-slate-950" disabled={pending} min="1" name="transitTimeDays" type="number" />
          </label>
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            부대비용
            <input className="focus-ring h-10 rounded-md border border-slate-300 bg-white px-3 text-slate-950" disabled={pending} min="0" name="surchargeAmount" step="0.01" type="number" />
          </label>
        </div>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          견적 메모
          <textarea className="focus-ring min-h-20 rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950" disabled={pending} name="message" placeholder="포함/제외 비용, 조건, 필요 서류 등을 간단히 적어 주세요." />
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <button
            className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-md bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-500"
            disabled={pending}
            type="submit"
          >
            <RadioTower aria-hidden="true" size={16} />
            {pending ? "제출 중" : "견적 제출"}
          </button>
          <span className="text-xs leading-5 text-slate-500">
            운송 가능 여부를 보장하는 확정서가 아니라 화주가 비교할 운송 조건 제안입니다.
          </span>
        </div>
        {state.message && state.requestId === opportunity.id ? (
          <p
            className={
              state.status === "success"
                ? "rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
                : "rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"
            }
          >
            {state.message}
          </p>
        ) : null}
      </form>
      )}
      <form action={questionAction} className="grid gap-2 rounded-md border border-slate-200 bg-white p-3 md:grid-cols-[1fr_auto]">
        <input name="requestId" type="hidden" value={opportunity.id} />
        <textarea
          className="focus-ring min-h-16 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950"
          disabled={questionPending}
          name="question"
          placeholder="견적 산정 전에 확인할 운송 조건을 질문해 주세요."
          required
        />
        <button
          className="focus-ring inline-flex h-10 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500"
          disabled={questionPending}
          type="submit"
        >
          {questionPending ? "등록 중" : "질문 등록"}
        </button>
        {questionState.message && questionState.requestId === opportunity.id ? (
          <p
            className={
              questionState.status === "success"
                ? "rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 md:col-span-2"
                : "rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 md:col-span-2"
            }
          >
            {questionState.message}
          </p>
        ) : null}
      </form>
        </>
      )}
    </div>
  );
}

export function FreightRequestDraftPanel({
  bidsByRequestId,
  completionReportsByRequestId = {},
  documentsByRequestId,
  feedbackByRequestId,
  opportunities,
  questionsByRequestId,
  requests,
  schemaReady
}: {
  bidsByRequestId: Record<string, ReceivedFreightBidItem[]>;
  completionReportsByRequestId?: Record<string, ServiceRequestCompletionReport>;
  documentsByRequestId: Record<string, FreightRequestDocumentItem[]>;
  feedbackByRequestId: Record<string, OwnServiceRequestFeedback>;
  opportunities: FreightOpportunityItem[];
  questionsByRequestId: Record<string, FreightRequestQuestionItem[]>;
  requests: FreightRequestListItem[];
  schemaReady: boolean;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(createFreightRequestDraftAction, draftInitialState);
  const searchParams = useSearchParams();
  const initialWorkspace = searchParams.get("workspace") === "forwarder" ? "forwarder" : "requester";
  const [activeWorkspace, setActiveWorkspace] = useState<"requester" | "forwarder">(initialWorkspace);
  const prefill = marketplaceRequestPrefillFromSearchParams(searchParams);
  const prefilledProductSummary = marketplacePrefilledProductSummary(prefill);
  const prefilledTitle = marketplacePrefilledTitle(prefill, "freight");
  const counts = countServiceRequestStatuses(requests, opportunities);
  const unansweredQuestionCount = Object.values(questionsByRequestId)
    .flat()
    .filter((question) => !question.answer).length;
  const [draftValues, setDraftValues] = useState(() => ({
    cbm: "",
    destinationCountryCode: prefill.destinationCountryCode ?? "",
    destinationPlace: "",
    direction: prefill.direction ?? "export",
    grossWeight: "",
    incoterms: "",
    originCountryCode: prefill.originCountryCode ?? "",
    originPlace: "",
    packageCount: "",
    productSummary: prefilledProductSummary,
    title: prefilledTitle,
    transportMode: ""
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
          <span className="mt-1 block text-xs font-normal opacity-80">초안 작성, 서류 첨부, 공개, 질문 답변, 견적 선정</span>
        </button>
        <button
          className={
            activeWorkspace === "forwarder"
              ? "focus-ring rounded-md bg-blue-700 px-4 py-3 text-left text-sm font-semibold text-white"
              : "focus-ring rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100"
          }
          onClick={() => setActiveWorkspace("forwarder")}
          type="button"
        >
          입찰 가능 요청
          <span className="mt-1 block text-xs font-normal opacity-80">매칭 요청 확인, 질문 등록, 운송 견적 제출</span>
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
              description="출발 국가, 도착 국가, 운송 방식은 포워더에게 공개하기 위한 필수 조건입니다."
              title="운송 견적 요청 초안"
            />
            <CardBody>
              {!schemaReady ? (
                <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
                  로그인은 정상입니다. 현재 이 환경에서는 플랫폼 요청 기능이 준비 중이라 운송 초안 저장과 포워더 공개 모집이 제한됩니다.
                </p>
              ) : null}
          <form
            action={action}
            className="grid gap-5"
            onChange={(event) => setDraftValues(readFormValues(event.currentTarget, freightDraftReadinessFields) as typeof draftValues)}
          >
          <MarketplacePrefillSourcePanel prefill={prefill} requestKind="freight" />
          <OverseasPartnerRequestHint prefill={prefill} requestKind="freight" />
          <RequestDraftReadinessPanel
            items={[
              { label: "요청 제목", required: true, value: draftValues.title },
              { label: "요청 방향", required: true, value: draftValues.direction },
              { helper: "이 3개 값은 초안 저장 후 포워더에게 공개할 때 반드시 필요합니다.", label: "출발 국가", value: draftValues.originCountryCode },
              { label: "도착 국가", value: draftValues.destinationCountryCode },
              { label: "운송 방식", value: draftValues.transportMode },
              { helper: "품목·수량·중량이 있으면 포워더가 단가를 더 빨리 산정할 수 있습니다.", label: "품목 요약", value: draftValues.productSummary },
              { label: "출발지", value: draftValues.originPlace },
              { label: "도착지", value: draftValues.destinationPlace },
              { label: "Incoterms", value: draftValues.incoterms },
              { label: "포장 수량", value: draftValues.packageCount },
              { label: "총중량", value: draftValues.grossWeight },
              { label: "CBM", value: draftValues.cbm }
            ]}
            publishLabel="공개 전 반드시 채우거나 보완할 값"
          />
          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              요청 방향
              <select className="focus-ring h-10 rounded-md border border-slate-300 bg-white px-3 text-slate-950" defaultValue={prefill.direction ?? "export"} disabled={pending} name="direction" required>
                <option value="export">수출</option>
                <option value="import">수입</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              요청 제목
              <input className="focus-ring h-10 rounded-md border border-slate-300 px-3 text-slate-950" defaultValue={prefilledTitle} disabled={pending} name="title" placeholder="예: 중고차 해상 운송 견적 요청" required />
            </label>
            <label className="grid gap-1 text-sm font-medium text-slate-700 md:col-span-2">
              품목 요약
              <textarea className="focus-ring min-h-24 rounded-md border border-slate-300 px-3 py-2 text-slate-950" defaultValue={prefilledProductSummary} disabled={pending} name="productSummary" placeholder="품명, 모델, 수량, 특이사항을 간단히 적어 주세요." />
            </label>
          </div>

          <div className="grid gap-3 rounded-md border border-blue-100 bg-blue-50 p-3 md:grid-cols-3">
            <p className="text-sm font-semibold text-blue-900 md:col-span-3">모집 공개 필수 조건</p>
            <p className="text-xs leading-5 text-blue-800 md:col-span-3">아래 3개 값이 있어야 검증 포워더에게 요청을 공개할 수 있습니다.</p>
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              출발 국가 <span className="text-xs font-semibold text-blue-700">공개 필수</span>
              <input className="focus-ring h-10 rounded-md border border-slate-300 px-3 text-slate-950" defaultValue={prefill.originCountryCode ?? ""} disabled={pending} name="originCountryCode" placeholder="KR" />
            </label>
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              도착 국가 <span className="text-xs font-semibold text-blue-700">공개 필수</span>
              <input className="focus-ring h-10 rounded-md border border-slate-300 px-3 text-slate-950" defaultValue={prefill.destinationCountryCode ?? ""} disabled={pending} name="destinationCountryCode" placeholder="US" />
            </label>
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              운송 방식 <span className="text-xs font-semibold text-blue-700">공개 필수</span>
              <select className="focus-ring h-10 rounded-md border border-slate-300 bg-white px-3 text-slate-950" disabled={pending} name="transportMode" defaultValue="">
                <option value="">미정</option>
                <option value="sea">해상</option>
                <option value="air">항공</option>
                <option value="express">특송</option>
                <option value="truck">내륙</option>
                <option value="rail">철도</option>
              </select>
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              Incoterms
              <input className="focus-ring h-10 rounded-md border border-slate-300 px-3 text-slate-950" disabled={pending} name="incoterms" placeholder="예: FOB Busan, CIF LA" />
            </label>
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              출발지
              <input className="focus-ring h-10 rounded-md border border-slate-300 px-3 text-slate-950" disabled={pending} name="originPlace" placeholder="서울, 부산" />
            </label>
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              도착지
              <input className="focus-ring h-10 rounded-md border border-slate-300 px-3 text-slate-950" disabled={pending} name="destinationPlace" placeholder="Los Angeles" />
            </label>
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              출발 항구/공항
              <input className="focus-ring h-10 rounded-md border border-slate-300 px-3 text-slate-950" disabled={pending} name="originPort" placeholder="BUSAN" />
            </label>
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              도착 항구/공항
              <input className="focus-ring h-10 rounded-md border border-slate-300 px-3 text-slate-950" disabled={pending} name="destinationPort" placeholder="LAX" />
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              포장 수량
              <input className="focus-ring h-10 rounded-md border border-slate-300 px-3 text-slate-950" disabled={pending} min="0" name="packageCount" step="0.01" type="number" />
            </label>
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              포장 단위
              <input className="focus-ring h-10 rounded-md border border-slate-300 px-3 text-slate-950" disabled={pending} name="packageUnit" placeholder="CT, PKG" />
            </label>
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              총중량
              <input className="focus-ring h-10 rounded-md border border-slate-300 px-3 text-slate-950" disabled={pending} min="0" name="grossWeight" step="0.01" type="number" />
            </label>
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              중량 단위
              <input className="focus-ring h-10 rounded-md border border-slate-300 px-3 text-slate-950" disabled={pending} name="weightUnit" placeholder="KG" />
            </label>
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              CBM
              <input className="focus-ring h-10 rounded-md border border-slate-300 px-3 text-slate-950" disabled={pending} min="0" name="cbm" step="0.001" type="number" />
            </label>
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              적재 형태
              <input className="focus-ring h-10 rounded-md border border-slate-300 px-3 text-slate-950" disabled={pending} name="loadType" placeholder="예: LCL / FCL" />
            </label>
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              컨테이너
              <input className="focus-ring h-10 rounded-md border border-slate-300 px-3 text-slate-950" disabled={pending} name="containerType" placeholder="20FT, 40HQ" />
            </label>
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              차량 VIN
              <input className="focus-ring h-10 rounded-md border border-slate-300 px-3 text-slate-950" disabled={pending} name="vehicleVin" />
            </label>
          </div>

          <div className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 md:grid-cols-3">
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input className="size-4 rounded border-slate-300" disabled={pending} name="hazardous" type="checkbox" />
              위험물 가능성 있음
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input className="size-4 rounded border-slate-300" disabled={pending} name="temperatureControlled" type="checkbox" />
              온도 관리 필요
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input className="size-4 rounded border-slate-300" disabled={pending} name="usedCar" type="checkbox" />
              중고차 수출입 건
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-md bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-500" disabled={pending} type="submit">
              <Save aria-hidden="true" size={17} />
              {pending ? "저장 중" : "초안 저장"}
            </button>
            <span className="inline-flex items-center gap-2 text-xs text-slate-500">
              <PackagePlus aria-hidden="true" size={15} />
              저장 후 서류를 첨부하고 포워더에게 견적 요청을 공개합니다.
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
              description="초안 작성부터 서류 첨부, 포워더 공개, 질문 답변, 견적 비교, 업체 선정까지 한 곳에서 관리합니다."
              title="내 운송 견적 요청"
            />
            <CardBody className="grid gap-3">
              {!schemaReady ? (
                <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
                  현재 이 환경에서는 플랫폼 요청 목록 데이터가 준비되지 않아 내 운송 요청을 불러올 수 없습니다. 계정 문제는 아니며, HS 조회와 일반 대시보드는 사용할 수 있습니다.
                </p>
              ) : null}
              {schemaReady && requests.length === 0 ? (
                <p className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  저장된 운송 견적 요청이 없습니다. 위 초안 저장부터 시작해 주세요.
                </p>
              ) : null}
              {requests.map((request) => (
                <FreightRequestRow
                  compact
                  key={request.id}
                  bids={bidsByRequestId[request.id] ?? []}
                  completionReport={completionReportsByRequestId[request.id]}
                  documents={documentsByRequestId[request.id] ?? []}
                  feedbackByRequestId={feedbackByRequestId}
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
            description="회사 관심 조건과 검증 상태에 따라 매칭된 운송 요청입니다. 조건 확인 질문 후 견적을 제출할 수 있습니다."
            title="입찰 가능 운송 요청"
          />
          <CardBody className="grid gap-3">
            <PartnerOpportunityFlowPanel kind="freight" />
            {!schemaReady ? (
              <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
                현재 이 환경에서는 포워더 입찰 데이터가 준비되지 않아 입찰 가능 요청을 불러올 수 없습니다. 역할 권한 확인은 플랫폼 데이터 준비 후 진행합니다.
              </p>
            ) : null}
            {schemaReady && opportunities.length === 0 ? (
              <p className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                현재 입찰 가능한 운송 요청이 없습니다.
              </p>
            ) : null}
            {opportunities.map((opportunity) => (
              <FreightOpportunityRow
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
