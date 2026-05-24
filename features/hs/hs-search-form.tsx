"use client";

import { useActionState } from "react";
import { ClipboardCheck } from "lucide-react";
import { createHsSearchRequestAction } from "@/server/actions/hs-search.actions";
import type { HsSearchActionState } from "@/features/hs/schemas";
import { getSeoulDateString } from "@/lib/utils";

const initialState: HsSearchActionState = { status: "idle" };

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) {
    return null;
  }

  return <p className="mt-1 text-sm font-medium text-red-700">{errors[0]}</p>;
}

export function HsSearchForm({ defaultSearchType = "hs_code" }: { defaultSearchType?: "hs_code" | "product_name" | "document" }) {
  const [state, formAction, pending] = useActionState(createHsSearchRequestAction, initialState);

  return (
    <form action={formAction} className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          업무 구분
          <select className="focus-ring rounded-md border border-slate-300 bg-white px-3 py-2" name="direction" defaultValue="import">
            <option value="import">수입 조회</option>
            <option value="export">수출 조회</option>
          </select>
          <FieldError errors={state.fieldErrors?.direction} />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          조회 방식
          <select className="focus-ring rounded-md border border-slate-300 bg-white px-3 py-2" name="searchType" defaultValue={defaultSearchType}>
            <option value="hs_code">HS CODE로 조회</option>
            <option value="product_name">품명으로 HS 추천</option>
            <option value="document">선적서류 기반 조회</option>
          </select>
          <FieldError errors={state.fieldErrors?.searchType} />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          조회기준일
          <input className="focus-ring rounded-md border border-slate-300 px-3 py-2" name="basisDate" type="date" defaultValue={getSeoulDateString()} />
          <FieldError errors={state.fieldErrors?.basisDate} />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          HS/HSK 코드
          <input className="focus-ring rounded-md border border-slate-300 px-3 py-2" name="inputHsCode" placeholder="예: 3304.99-1000" />
          <FieldError errors={state.fieldErrors?.inputHsCode} />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          품명
          <input className="focus-ring rounded-md border border-slate-300 px-3 py-2" name="inputProductName" placeholder="예: 보습 크림" />
          <FieldError errors={state.fieldErrors?.inputProductName} />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          용도
          <textarea className="focus-ring min-h-24 rounded-md border border-slate-300 px-3 py-2" name="productUsage" placeholder="제품 사용 목적과 주요 판매 채널" />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          재질/성분
          <textarea className="focus-ring min-h-24 rounded-md border border-slate-300 px-3 py-2" name="material" placeholder="주요 재질, 성분, 함량 정보" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          구성/기능
          <input className="focus-ring rounded-md border border-slate-300 px-3 py-2" name="functions" placeholder="핵심 기능, 작동 방식" />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          모델명
          <input className="focus-ring rounded-md border border-slate-300 px-3 py-2" name="modelName" placeholder="모델명 또는 규격" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          원산지
          <input className="focus-ring rounded-md border border-slate-300 px-3 py-2" name="originCountry" placeholder="KR" />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          수출국
          <input className="focus-ring rounded-md border border-slate-300 px-3 py-2" name="exportCountry" placeholder="CN" />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          선적국
          <input className="focus-ring rounded-md border border-slate-300 px-3 py-2" name="shipmentCountry" placeholder="CN" />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          제조국
          <input className="focus-ring rounded-md border border-slate-300 px-3 py-2" name="manufacturingCountry" placeholder="CN" />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          판매국
          <input className="focus-ring rounded-md border border-slate-300 px-3 py-2" name="sellerCountry" placeholder="HK" />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          목적국
          <input className="focus-ring rounded-md border border-slate-300 px-3 py-2" name="destinationCountry" placeholder="KR" />
        </label>
      </div>

      <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        입력한 조건은 HS CODE, 관세율, FTA, 수출입요건 조회에 사용됩니다.
      </div>

      {state.message ? (
        <div className={state.status === "success" ? "rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900" : "rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800"}>
          {state.message}
          {state.requestId ? <span className="block pt-1">요청 ID: {state.requestId}</span> : null}
        </div>
      ) : null}

      <button
        className="focus-ring inline-flex w-full items-center justify-center gap-2 rounded-md bg-blue-700 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400 sm:w-fit"
        disabled={pending}
        type="submit"
      >
        <ClipboardCheck aria-hidden="true" size={18} />
        {pending ? "조회 조건 저장 중" : "조회 조건 저장"}
      </button>
    </form>
  );
}
