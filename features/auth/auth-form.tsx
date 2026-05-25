"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { Building2, CheckCircle2, Lock, LogIn, Mail, User, UserPlus, type LucideIcon } from "lucide-react";
import Link from "next/link";
import {
  authenticateAction,
  searchCompanySuggestionsAction,
  sendSignupEmailOtpAction,
  verifySignupEmailOtpAction
} from "@/server/actions/auth.actions";
import type { AuthActionState, SignupOtpActionState } from "@/features/auth/schemas";

const initialAuthState: AuthActionState = {
  status: "idle",
  mode: "login"
};

const initialOtpState: SignupOtpActionState = {
  status: "idle"
};

const businessTypeOptions = [
  { value: "customs_broker", label: "관세사무소" },
  { value: "forwarder", label: "포워더" },
  { value: "exporter", label: "수출기업" },
  { value: "importer", label: "수입기업" }
];

export function AuthForm({ initialMode = "login" }: { initialMode?: "login" | "signup" | "reset" }) {
  const [authState, authAction, authPending] = useActionState(authenticateAction, initialAuthState);
  const [sendState, sendAction, sendPending] = useActionState(sendSignupEmailOtpAction, initialOtpState);
  const [verifyState, verifyAction, verifyPending] = useActionState(verifySignupEmailOtpAction, initialOtpState);
  const [signupEmail, setSignupEmail] = useState(sendState.email ?? "");
  const [otpToken, setOtpToken] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestPending, startSuggestTransition] = useTransition();

  const mode = authState.status === "idle" ? initialMode : authState.mode;
  const isLogin = mode === "login";
  const isSignup = mode === "signup";
  const isReset = mode === "reset";
  const verifiedSignupEmail = Boolean(isSignup && verifyState.verified);
  const activeEmail = verifyState.email || sendState.email || signupEmail;
  const pending = authPending || sendPending || verifyPending;

  useEffect(() => {
    const term = companyName.trim();
    if (!verifiedSignupEmail || term.length < 2) return;

    const timer = window.setTimeout(() => {
      startSuggestTransition(async () => {
        const result = await searchCompanySuggestionsAction(term);
        setSuggestions(result.filter((name) => name !== companyName));
      });
    }, 220);

    return () => window.clearTimeout(timer);
  }, [companyName, verifiedSignupEmail]);

  const title = useMemo(() => {
    if (isReset) return "비밀번호 찾기";
    if (isSignup) return "회원가입";
    return "로그인";
  }, [isReset, isSignup]);

  const subtitle = useMemo(() => {
    if (isReset) return "가입 이메일로 비밀번호 재설정 링크를 보내드립니다.";
    if (isSignup) return "이메일 인증 후 업무 공간을 생성합니다.";
    return "HS FINDER에 오신 것을 환영합니다.";
  }, [isReset, isSignup]);
  const visibleSuggestions = verifiedSignupEmail && companyName.trim().length >= 2 ? suggestions : [];

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white/85 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur sm:p-8">
      <div className="text-center">
        <h1 className="text-3xl font-semibold tracking-normal text-slate-950">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{subtitle}</p>
      </div>

      <div className="mt-7 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
        <Link
          className={`focus-ring rounded-lg px-3 py-2.5 text-center text-sm font-semibold transition ${isLogin ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-950"}`}
          href="/login?mode=login"
        >
          로그인
        </Link>
        <Link
          className={`focus-ring rounded-lg px-3 py-2.5 text-center text-sm font-semibold transition ${isSignup ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-950"}`}
          href="/login?mode=signup"
        >
          회원가입
        </Link>
      </div>

      {isSignup ? (
        <div className="mt-7 grid gap-5">
          <form action={sendAction} className="grid gap-3">
            <AuthInput
              autoComplete="email"
              disabled={pending || verifiedSignupEmail}
              icon={Mail}
              label="이메일"
              name="email"
              onChange={(value) => setSignupEmail(value)}
              placeholder="이메일을 입력하세요"
              type="email"
              value={signupEmail}
            />
            <button
              className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 text-sm font-semibold text-blue-800 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
              disabled={pending || verifiedSignupEmail || !signupEmail}
              type="submit"
            >
              <Mail aria-hidden="true" size={16} />
              {sendPending ? "전송 중" : verifiedSignupEmail ? "이메일 인증 완료" : "인증번호 전송"}
            </button>
          </form>

          {sendState.message ? <StatusMessage state={sendState} /> : null}

          {sendState.status === "success" && !verifiedSignupEmail ? (
            <form action={verifyAction} className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <input name="email" type="hidden" value={activeEmail} />
              <input name="otp" type="hidden" value={otpToken.replace(/\D/g, "")} />
              <AuthInput
                autoComplete="one-time-code"
                disabled={pending}
                icon={CheckCircle2}
                inputMode="numeric"
                label="이메일 인증번호"
                maxLength={10}
                name="token"
                onChange={(value) => setOtpToken(value.replace(/\D/g, "").slice(0, 8))}
                placeholder="이메일 인증번호"
                type="text"
                value={otpToken}
              />
              <button
                className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500"
                disabled={pending}
                type="submit"
              >
                {verifyPending ? "확인 중" : "이메일 인증 확인"}
              </button>
              {verifyState.message ? <StatusMessage state={verifyState} /> : null}
            </form>
          ) : null}

          {verifiedSignupEmail ? (
            <form action={authAction} className="grid gap-5">
              <input name="mode" type="hidden" value="signup" />
              <input name="email" type="hidden" value={activeEmail} />
              <AuthInput
                autoComplete="new-password"
                disabled={authPending}
                icon={Lock}
                label="비밀번호"
                name="password"
                placeholder="8자 이상 입력하세요"
                type="password"
              />
              <AuthInput
                autoComplete="new-password"
                disabled={authPending}
                icon={Lock}
                label="비밀번호 확인"
                name="passwordConfirm"
                placeholder="비밀번호를 다시 입력하세요"
                type="password"
              />
              <AuthInput
                autoComplete="name"
                disabled={authPending}
                icon={User}
                label="이름"
                name="fullName"
                placeholder="이름을 입력하세요"
              />
              <CompanyNameInput
                companyName={companyName}
                disabled={authPending}
                onSelect={setCompanyName}
                onValueChange={setCompanyName}
                suggestions={visibleSuggestions}
                suggestPending={suggestPending}
              />
              <BusinessTypeCheckboxes disabled={authPending} />

              <button
                className="focus-ring inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-100 transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-500"
                disabled={authPending}
                type="submit"
              >
                <UserPlus aria-hidden="true" size={17} />
                {authPending ? "처리 중" : "회원가입 완료"}
              </button>

              {authState.message ? <StatusMessage state={authState} /> : null}
            </form>
          ) : null}
        </div>
      ) : (
        <form action={authAction} className="mt-7 grid gap-5">
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
          {!isReset ? (
            <AuthInput
              autoComplete="current-password"
              disabled={pending}
              icon={Lock}
              label="비밀번호"
              name="password"
              placeholder="비밀번호를 입력하세요"
              type="password"
            />
          ) : null}

          {isLogin ? (
            <div className="flex items-center justify-between text-sm">
              <label className="inline-flex items-center gap-2 text-slate-600">
                <input className="size-4 rounded border-slate-300" disabled={pending} name="rememberSession" type="checkbox" />
                로그인 상태 유지
              </label>
              <Link className="font-semibold text-blue-700 hover:text-blue-900" href="/login?mode=reset">
                비밀번호 찾기
              </Link>
            </div>
          ) : null}

          <button
            className="focus-ring inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-100 transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-500"
            disabled={pending}
            type="submit"
          >
            {isReset ? <Mail aria-hidden="true" size={17} /> : <LogIn aria-hidden="true" size={17} />}
            {pending ? "처리 중" : isReset ? "재설정 메일 보내기" : "로그인"}
          </button>

          {authState.message ? <StatusMessage state={authState} /> : null}
        </form>
      )}
    </div>
  );
}

function StatusMessage({ state }: { state: { status: "idle" | "success" | "error"; message?: string } }) {
  if (!state.message) return null;

  return (
    <p
      className={
        state.status === "error"
          ? "rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
          : "rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
      }
    >
      {state.message}
    </p>
  );
}

function CompanyNameInput({
  companyName,
  disabled,
  onSelect,
  onValueChange,
  suggestions,
  suggestPending
}: {
  companyName: string;
  disabled?: boolean;
  onSelect: (value: string) => void;
  onValueChange: (value: string) => void;
  suggestions: string[];
  suggestPending: boolean;
}) {
  return (
    <div className="grid gap-2">
      <AuthInput
        autoComplete="organization"
        disabled={disabled}
        icon={Building2}
        label="회사명"
        name="companyName"
        onChange={onValueChange}
        placeholder="회사명을 입력하세요"
        value={companyName}
      />
      {suggestPending ? <p className="text-xs font-medium text-slate-500">기존 회사명을 확인 중입니다.</p> : null}
      {suggestions.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-blue-100 bg-blue-50/70">
          <p className="border-b border-blue-100 px-3 py-2 text-xs font-semibold text-blue-900">기존에 가입된 기업명이 있습니다.</p>
          <div className="grid">
            {suggestions.map((name) => (
              <button
                className="px-3 py-2 text-left text-sm font-semibold text-slate-800 transition hover:bg-white"
                key={name}
                onClick={() => onSelect(name)}
                type="button"
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function BusinessTypeCheckboxes({ disabled }: { disabled?: boolean }) {
  return (
    <fieldset className="grid gap-3">
      <legend className="text-sm font-semibold text-slate-800">업무 유형</legend>
      <div className="grid grid-cols-2 gap-2">
        {businessTypeOptions.map((option) => (
          <label
            className="flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm"
            key={option.value}
          >
            <input className="size-4 rounded border-slate-300" disabled={disabled} name="businessTypes" type="checkbox" value={option.value} />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function AuthInput({
  autoComplete,
  disabled,
  icon: Icon,
  label,
  inputMode,
  maxLength,
  name,
  onChange,
  placeholder,
  type = "text",
  value
}: {
  autoComplete?: string;
  disabled?: boolean;
  icon: LucideIcon;
  label: string;
  inputMode?: "none" | "text" | "tel" | "url" | "email" | "numeric" | "decimal" | "search";
  maxLength?: number;
  name: string;
  onChange?: (value: string) => void;
  placeholder: string;
  type?: string;
  value?: string;
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
          inputMode={inputMode}
          maxLength={maxLength}
          name={name}
          onChange={onChange ? (event) => onChange(event.target.value) : undefined}
          placeholder={placeholder}
          type={type}
          value={value}
        />
      </span>
    </label>
  );
}
