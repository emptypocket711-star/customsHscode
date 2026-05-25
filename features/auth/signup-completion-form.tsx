"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { Building2, Lock, User, UserPlus, type LucideIcon } from "lucide-react";
import { authenticateAction, searchCompanySuggestionsAction } from "@/server/actions/auth.actions";
import type { AuthActionState } from "@/features/auth/schemas";

const initialAuthState: AuthActionState = {
  status: "idle",
  mode: "signup"
};

const businessTypeOptions = [
  { value: "customs_broker", label: "관세사무소" },
  { value: "forwarder", label: "포워더" },
  { value: "exporter", label: "수출기업" },
  { value: "importer", label: "수입기업" }
];

export function SignupCompletionForm({ email }: { email: string }) {
  const [authState, authAction, authPending] = useActionState(authenticateAction, initialAuthState);
  const [companyName, setCompanyName] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestPending, startSuggestTransition] = useTransition();

  useEffect(() => {
    const term = companyName.trim();
    if (term.length < 2) return;

    const timer = window.setTimeout(() => {
      startSuggestTransition(async () => {
        const result = await searchCompanySuggestionsAction(term);
        setSuggestions(result.filter((name) => name !== companyName));
      });
    }, 220);

    return () => window.clearTimeout(timer);
  }, [companyName]);

  const visibleSuggestions = companyName.trim().length >= 2 ? suggestions : [];

  return (
    <form action={authAction} className="grid gap-5">
      <input name="mode" type="hidden" value="signup" />
      <input name="email" type="hidden" value={email} />
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
