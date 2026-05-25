"use client";

import { useActionState } from "react";
import { Building2, Lock, LogIn, Mail, User, UserPlus, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { authenticateAction } from "@/server/actions/auth.actions";
import type { AuthActionState } from "@/features/auth/schemas";

const initialState: AuthActionState = {
  status: "idle",
  mode: "login"
};

export function AuthForm({ initialMode = "login" }: { initialMode?: "login" | "signup" }) {
  const [state, formAction, pending] = useActionState(authenticateAction, initialState);
  const mode = state.status === "idle" ? initialMode : state.mode;
  const isLogin = mode === "login";

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white/85 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur sm:p-8">
      <div className="text-center">
        <h1 className="text-3xl font-semibold tracking-normal text-slate-950">{isLogin ? "로그인" : "회원가입"}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {isLogin ? "HS FINDER에 오신 것을 환영합니다." : "HS FINDER 업무 공간을 생성합니다."}
        </p>
      </div>

      <div className="mt-7 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
        <Link
          className={`focus-ring rounded-lg px-3 py-2.5 text-center text-sm font-semibold transition ${isLogin ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-950"}`}
          href="/login?mode=login"
        >
          로그인
        </Link>
        <Link
          className={`focus-ring rounded-lg px-3 py-2.5 text-center text-sm font-semibold transition ${!isLogin ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-950"}`}
          href="/login?mode=signup"
        >
          회원가입
        </Link>
      </div>

      <form action={formAction} className="mt-7 grid gap-5">
        <input name="mode" type="hidden" value={mode} />
        <AuthInput
          autoComplete="email"
          disabled={pending}
          icon={Mail}
          label="이메일"
          name="email"
          placeholder="이메일을 입력하세요"
          type="email"
        />
        <AuthInput
          autoComplete={isLogin ? "current-password" : "new-password"}
          disabled={pending}
          icon={Lock}
          label="비밀번호"
          name="password"
          placeholder="비밀번호를 입력하세요"
          type="password"
        />
        {!isLogin ? (
          <>
            <AuthInput
              autoComplete="name"
              disabled={pending}
              icon={User}
              label="이름"
              name="fullName"
              placeholder="이름을 입력하세요"
            />
            <AuthInput
              autoComplete="organization"
              disabled={pending}
              icon={Building2}
              label="회사명"
              name="companyName"
              placeholder="회사명을 입력하세요"
            />
          </>
        ) : null}

        {isLogin ? (
          <div className="flex items-center justify-between text-sm">
            <label className="inline-flex items-center gap-2 text-slate-600">
              <input className="size-4 rounded border-slate-300" disabled={pending} name="rememberSession" type="checkbox" />
              로그인 상태 유지
            </label>
            <span className="font-semibold text-blue-700">비밀번호 찾기</span>
          </div>
        ) : null}

        <button
          className="focus-ring inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-100 transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-500"
          disabled={pending}
          type="submit"
        >
          {isLogin ? <LogIn aria-hidden="true" size={17} /> : <UserPlus aria-hidden="true" size={17} />}
          {pending ? "처리 중" : isLogin ? "로그인" : "회원가입"}
        </button>

        {state.message ? (
          <p className={state.status === "error" ? "rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" : "rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"}>
            {state.message}
          </p>
        ) : null}
      </form>
    </div>
  );
}

function AuthInput({
  autoComplete,
  disabled,
  icon: Icon,
  label,
  name,
  placeholder,
  type = "text"
}: {
  autoComplete?: string;
  disabled?: boolean;
  icon: LucideIcon;
  label: string;
  name: string;
  placeholder: string;
  type?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-800">
      {label}
      <span className="relative">
        <Icon aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={19} />
        <input
          autoComplete={autoComplete}
          className="focus-ring h-12 w-full rounded-lg border border-slate-200 bg-white pl-12 pr-4 text-base font-medium text-slate-950 shadow-sm placeholder:text-slate-400"
          disabled={disabled}
          name={name}
          placeholder={placeholder}
          type={type}
        />
      </span>
    </label>
  );
}
