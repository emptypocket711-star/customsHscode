"use client";

import { useActionState } from "react";
import { Lock, Save } from "lucide-react";
import { updatePasswordAction } from "@/server/actions/auth.actions";
import type { UpdatePasswordActionState } from "@/features/auth/schemas";

const initialState: UpdatePasswordActionState = {
  status: "idle"
};

export function UpdatePasswordForm() {
  const [state, formAction, pending] = useActionState(updatePasswordAction, initialState);

  return (
    <form action={formAction} className="grid gap-5">
      <label className="grid gap-2 text-sm font-semibold text-slate-800">
        새 비밀번호
        <span className="relative">
          <Lock aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={19} />
          <input
            autoComplete="new-password"
            className="focus-ring h-12 w-full rounded-lg border border-slate-200 bg-white pl-12 pr-4 text-base font-medium text-slate-950 shadow-sm placeholder:text-slate-400"
            disabled={pending}
            name="password"
            placeholder="8자 이상 입력하세요"
            type="password"
          />
        </span>
      </label>
      <label className="grid gap-2 text-sm font-semibold text-slate-800">
        새 비밀번호 확인
        <span className="relative">
          <Lock aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={19} />
          <input
            autoComplete="new-password"
            className="focus-ring h-12 w-full rounded-lg border border-slate-200 bg-white pl-12 pr-4 text-base font-medium text-slate-950 shadow-sm placeholder:text-slate-400"
            disabled={pending}
            name="passwordConfirm"
            placeholder="비밀번호를 다시 입력하세요"
            type="password"
          />
        </span>
      </label>
      <button
        className="focus-ring inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-100 transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-500"
        disabled={pending}
        type="submit"
      >
        <Save aria-hidden="true" size={17} />
        {pending ? "저장 중" : "새 비밀번호 저장"}
      </button>
      {state.message ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{state.message}</p>
      ) : null}
    </form>
  );
}
