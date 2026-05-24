"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import type { HsConfirmationRequestActionState } from "@/features/hs/schemas";
import { createHsConfirmationRequestAction } from "@/server/actions/hs-confirmation-request.actions";

const initialState: HsConfirmationRequestActionState = {
  status: "idle"
};

export function HsConfirmationRequestForm({
  hskCode,
  basisDate,
  productName,
  supplementSnapshot
}: {
  hskCode: string;
  basisDate: string;
  productName?: string;
  supplementSnapshot: string;
}) {
  const [state, formAction, pending] = useActionState(createHsConfirmationRequestAction, initialState);

  return (
    <form action={formAction} className="mt-3 grid gap-2">
      <input name="hskCode" type="hidden" value={hskCode} />
      <input name="basisDate" type="hidden" value={basisDate} />
      <input name="productName" type="hidden" value={productName ?? ""} />
      <input name="supplementSnapshot" type="hidden" value={supplementSnapshot} />
      <label className="grid gap-1 text-xs font-semibold text-blue-900">
        확정 요청 메모
        <input
          className="focus-ring rounded-md border border-blue-200 bg-white px-3 py-2 text-sm font-normal text-slate-900"
          disabled={pending}
          name="userNote"
          placeholder="예: 인보이스 기재 HS와 제품 카탈로그 기준으로 이 코드 검토 요청"
        />
      </label>
      <button
        className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-blue-700 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        disabled={pending}
        type="submit"
      >
        <CheckCircle2 aria-hidden="true" size={16} />
        이 HS CODE로 확정 요청
      </button>
      {state.message ? (
        <p className={state.status === "success" ? "text-xs font-medium text-emerald-700" : "text-xs font-medium text-red-700"}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
