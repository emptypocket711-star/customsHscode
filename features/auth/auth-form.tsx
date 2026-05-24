"use client";

import { useActionState, useState } from "react";
import { LogIn, UserPlus } from "lucide-react";
import { authenticateAction } from "@/server/actions/auth.actions";
import type { AuthActionState } from "@/features/auth/schemas";

const initialState: AuthActionState = {
  status: "idle",
  mode: "login"
};

export function AuthForm() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [state, formAction, pending] = useActionState(authenticateAction, initialState);

  return (
    <div className="mx-auto w-full max-w-md rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid grid-cols-2 rounded-md bg-slate-100 p-1">
        <button
          className={`focus-ring rounded-md px-3 py-2 text-sm font-semibold ${mode === "login" ? "bg-white text-slate-950 shadow-sm" : "text-slate-600"}`}
          onClick={() => setMode("login")}
          type="button"
        >
          로그인
        </button>
        <button
          className={`focus-ring rounded-md px-3 py-2 text-sm font-semibold ${mode === "signup" ? "bg-white text-slate-950 shadow-sm" : "text-slate-600"}`}
          onClick={() => setMode("signup")}
          type="button"
        >
          회원가입
        </button>
      </div>

      <form action={formAction} className="mt-5 grid gap-4">
        <input name="mode" type="hidden" value={mode} />
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          이메일
          <input
            autoComplete="email"
            className="focus-ring rounded-md border border-slate-300 px-3 py-2"
            disabled={pending}
            name="email"
            type="email"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          비밀번호
          <input
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            className="focus-ring rounded-md border border-slate-300 px-3 py-2"
            disabled={pending}
            name="password"
            type="password"
          />
        </label>
        {mode === "signup" ? (
          <>
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              이름
              <input
                autoComplete="name"
                className="focus-ring rounded-md border border-slate-300 px-3 py-2"
                disabled={pending}
                name="fullName"
              />
            </label>
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              회사명
              <input
                autoComplete="organization"
                className="focus-ring rounded-md border border-slate-300 px-3 py-2"
                disabled={pending}
                name="companyName"
              />
            </label>
          </>
        ) : null}
        <button
          className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-white"
          disabled={pending}
          type="submit"
        >
          {mode === "login" ? <LogIn aria-hidden="true" size={17} /> : <UserPlus aria-hidden="true" size={17} />}
          {mode === "login" ? "로그인" : "회원가입"}
        </button>
        {state.message ? (
          <p className={state.status === "error" ? "rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800" : "rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"}>
            {state.message}
          </p>
        ) : null}
      </form>
    </div>
  );
}
