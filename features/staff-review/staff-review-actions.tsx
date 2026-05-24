"use client";

import { useActionState } from "react";
import type { DocumentLineItemReviewItem } from "@/features/staff-review/mock-staff-review-data";
import { correctDocumentLineItemAction } from "@/server/actions/document-line-correction.actions";
import { createHsRequestFromDocumentLineItemAction } from "@/server/actions/document-line-hs-request.actions";
import { applyStaffReviewDecisionAction } from "@/server/actions/staff-review.actions";
import type { StaffReviewActionState } from "@/features/staff-review/schemas";

const initialState: StaffReviewActionState = { status: "idle" };

export function StaffReviewActions({
  targetType,
  targetId,
  disabled = false
}: {
  targetType: "hs_candidate" | "hs_confirmation_request" | "report" | "legal_change";
  targetId: string;
  disabled?: boolean;
}) {
  const [state, formAction, pending] = useActionState(applyStaffReviewDecisionAction, initialState);

  return (
    <form action={formAction} className="mt-4 grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-3">
      <input name="targetType" type="hidden" value={targetType} />
      <input name="targetId" type="hidden" value={targetId} />
      <label className="grid gap-1 text-xs font-semibold text-slate-600">
        검토 메모
        <input
          className="focus-ring rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900"
          disabled={disabled || pending}
          name="note"
          placeholder="검토 근거 또는 반려 사유"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          className="focus-ring rounded-md bg-blue-700 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
          disabled={disabled || pending}
          name="decision"
          type="submit"
          value="approve"
        >
          승인 처리
        </button>
        <button
          className="focus-ring rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400"
          disabled={disabled || pending}
          name="decision"
          type="submit"
          value="reject"
        >
          반려 처리
        </button>
      </div>
      {disabled ? <p className="text-xs text-slate-500">mock 데이터에서는 실제 저장 액션을 비활성화합니다.</p> : null}
      {state.message ? (
        <p className={state.status === "success" ? "text-sm font-medium text-emerald-700" : "text-sm font-medium text-red-700"}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

export function DocumentLineHsRequestActions({
  lineItemId,
  basisDate,
  correctionCount,
  disabled = false
}: {
  lineItemId: string;
  basisDate: string;
  correctionCount: number;
  disabled?: boolean;
}) {
  const [state, formAction, pending] = useActionState(createHsRequestFromDocumentLineItemAction, initialState);
  const isBlocked = correctionCount > 0;
  const isDisabled = disabled || pending || isBlocked;

  return (
    <form action={formAction} className="mt-4 grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-3">
      <input name="lineItemId" type="hidden" value={lineItemId} />
      <input name="basisDate" type="hidden" value={basisDate} />
      <label className="grid gap-1 text-xs font-semibold text-slate-600">
        요청 생성 메모
        <input
          className="focus-ring rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900"
          disabled={isDisabled}
          name="note"
          placeholder="보정 완료 근거 또는 HS 추천 시 참고사항"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          className="focus-ring rounded-md bg-blue-700 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
          disabled={isDisabled}
          name="direction"
          type="submit"
          value="import"
        >
          수입 HS 요청 생성
        </button>
        <button
          className="focus-ring rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400"
          disabled={isDisabled}
          name="direction"
          type="submit"
          value="export"
        >
          수출 HS 요청 생성
        </button>
      </div>
      {disabled ? <p className="text-xs text-slate-500">mock 데이터에서는 실제 요청 생성 액션을 비활성화합니다.</p> : null}
      {isBlocked ? <p className="text-xs text-amber-700">남은 보정 항목 {correctionCount}개를 지운 뒤 HS 요청을 생성할 수 있습니다.</p> : null}
      {state.message ? (
        <p className={state.status === "success" ? "text-sm font-medium text-emerald-700" : "text-sm font-medium text-red-700"}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

function TextField({
  label,
  name,
  defaultValue,
  disabled,
  type = "text"
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  disabled?: boolean;
  type?: "text" | "number";
}) {
  return (
    <label className="grid gap-1 text-xs font-semibold text-slate-600">
      {label}
      <input
        className="focus-ring rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900"
        defaultValue={defaultValue ?? ""}
        disabled={disabled}
        name={name}
        step={type === "number" ? "any" : undefined}
        type={type}
      />
    </label>
  );
}

export function DocumentLineCorrectionForm({
  lineItem,
  disabled = false
}: {
  lineItem: DocumentLineItemReviewItem;
  disabled?: boolean;
}) {
  const [state, formAction, pending] = useActionState(correctDocumentLineItemAction, initialState);
  const isDisabled = disabled || pending;

  return (
    <form action={formAction} className="mt-4 grid gap-3 rounded-md border border-blue-100 bg-blue-50 p-3">
      <input name="lineItemId" type="hidden" value={lineItem.id} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <TextField defaultValue={lineItem.productName} disabled={isDisabled} label="품명" name="productName" />
        <TextField defaultValue={lineItem.modelName} disabled={isDisabled} label="모델" name="modelName" />
        <TextField defaultValue={lineItem.originCountry} disabled={isDisabled} label="원산지" name="originCountry" />
        <TextField defaultValue={lineItem.shipmentCountry} disabled={isDisabled} label="선적국" name="shipmentCountry" />
        <TextField defaultValue={lineItem.destinationCountry} disabled={isDisabled} label="목적국" name="destinationCountry" />
        <TextField defaultValue={lineItem.incoterms} disabled={isDisabled} label="Incoterms" name="incoterms" />
        <TextField defaultValue={lineItem.quantity} disabled={isDisabled} label="수량" name="quantity" type="number" />
        <TextField defaultValue={lineItem.unit} disabled={isDisabled} label="단위" name="unit" />
        <TextField defaultValue={lineItem.unitPrice} disabled={isDisabled} label="단가" name="unitPrice" type="number" />
        <TextField defaultValue={lineItem.totalAmount} disabled={isDisabled} label="총액" name="totalAmount" type="number" />
        <TextField defaultValue={lineItem.currency} disabled={isDisabled} label="통화" name="currency" />
      </div>
      <label className="grid gap-1 text-xs font-semibold text-slate-600">
        남은 보정 항목
        <textarea
          className="focus-ring min-h-20 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900"
          defaultValue={lineItem.requiredCorrections.join("\n")}
          disabled={isDisabled}
          name="requiredCorrectionsText"
        />
      </label>
      <label className="grid gap-1 text-xs font-semibold text-slate-600">
        보정 메모
        <input
          className="focus-ring rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900"
          disabled={isDisabled}
          name="note"
          placeholder="원문 대조 근거 또는 고객 확인 필요사항"
        />
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <button
          className="focus-ring rounded-md bg-blue-700 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
          disabled={isDisabled}
          type="submit"
        >
          보정값 저장
        </button>
        {disabled ? <p className="text-xs text-slate-500">mock 데이터에서는 실제 보정 저장 액션을 비활성화합니다.</p> : null}
      </div>
      {state.message ? (
        <p className={state.status === "success" ? "text-sm font-medium text-emerald-700" : "text-sm font-medium text-red-700"}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
