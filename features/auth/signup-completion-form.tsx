"use client";

import { useActionState, useState } from "react";
import { Building2, Lock, User, UserPlus, type LucideIcon } from "lucide-react";
import { authenticateAction } from "@/server/actions/auth.actions";
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
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [fullName, setFullName] = useState("");
  const [accountType, setAccountType] = useState<"personal" | "company">("personal");
  const [companyName, setCompanyName] = useState("");
  const [selectedBusinessTypes, setSelectedBusinessTypes] = useState<string[]>([]);

  const passwordChecks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password)
  };
  const isPasswordStrong = Object.values(passwordChecks).every(Boolean);
  const isPasswordConfirmValid = password.length > 0 && password === passwordConfirm;
  const isCompanySignup = accountType === "company";
  const canSubmit =
    isPasswordStrong &&
    isPasswordConfirmValid &&
    fullName.trim().length > 0 &&
    (!isCompanySignup || (companyName.trim().length > 0 && selectedBusinessTypes.length > 0)) &&
    !authPending;

  return (
    <form action={authAction} className="grid gap-5">
      <input name="mode" type="hidden" value="signup" />
      <input name="email" type="hidden" value={email} />
      <input name="accountType" type="hidden" value={accountType} />
      <AccountTypeSelector disabled={authPending} value={accountType} onChange={setAccountType} />
      <AuthInput
        autoComplete="new-password"
        disabled={authPending}
        icon={Lock}
        label="비밀번호"
        name="password"
        onChange={setPassword}
        placeholder="숫자, 영문 대소문자, 특수문자 포함"
        type="password"
        value={password}
      />
      <PasswordRules checks={passwordChecks} />
      <AuthInput
        autoComplete="new-password"
        disabled={authPending}
        icon={Lock}
        label="비밀번호 확인"
        name="passwordConfirm"
        onChange={setPasswordConfirm}
        placeholder="비밀번호를 다시 입력하세요"
        type="password"
        value={passwordConfirm}
      />
      {passwordConfirm ? (
        <p className={`text-xs font-semibold ${isPasswordConfirmValid ? "text-emerald-700" : "text-red-700"}`}>
          {isPasswordConfirmValid ? "비밀번호가 일치합니다." : "비밀번호가 일치하지 않습니다."}
        </p>
      ) : null}
      <AuthInput
        autoComplete="name"
        disabled={authPending}
        icon={User}
        label="이름"
        name="fullName"
        onChange={setFullName}
        placeholder="이름을 입력하세요"
        value={fullName}
      />
      {isCompanySignup ? (
        <>
          <CompanyNameInput companyName={companyName} disabled={authPending} onValueChange={setCompanyName} />
          <BusinessTypeCheckboxes disabled={authPending} selectedValues={selectedBusinessTypes} onChange={setSelectedBusinessTypes} />
        </>
      ) : null}

      <button
        className="focus-ring inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-100 transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-500"
        disabled={!canSubmit}
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

function AccountTypeSelector({
  disabled,
  onChange,
  value
}: {
  disabled?: boolean;
  onChange: (value: "personal" | "company") => void;
  value: "personal" | "company";
}) {
  const options = [
    { value: "personal" as const, label: "개인회원", description: "이메일 인증 후 바로 사용" },
    { value: "company" as const, label: "기업회원", description: "회사명 기준 업무공간 생성" }
  ];

  return (
    <fieldset className="grid gap-2">
      <legend className="text-sm font-semibold text-slate-800">회원 유형</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => {
          const selected = value === option.value;

          return (
            <button
              className={`focus-ring rounded-lg border px-4 py-3 text-left transition ${
                selected ? "border-blue-500 bg-blue-50 text-blue-950" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
              disabled={disabled}
              key={option.value}
              onClick={() => onChange(option.value)}
              type="button"
            >
              <span className="block text-sm font-semibold">{option.label}</span>
              <span className="mt-1 block text-xs text-slate-500">{option.description}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function CompanyNameInput({
  companyName,
  disabled,
  onValueChange
}: {
  companyName: string;
  disabled?: boolean;
  onValueChange: (value: string) => void;
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
    </div>
  );
}

function PasswordRules({ checks }: { checks: { length: boolean; lowercase: boolean; uppercase: boolean; number: boolean; special: boolean } }) {
  const rules = [
    { passed: checks.length, label: "8자 이상" },
    { passed: checks.lowercase, label: "영문 소문자" },
    { passed: checks.uppercase, label: "영문 대문자" },
    { passed: checks.number, label: "숫자" },
    { passed: checks.special, label: "특수문자" }
  ];

  return (
    <div className="grid grid-cols-2 gap-1.5 text-xs sm:grid-cols-5">
      {rules.map((rule) => (
        <span
          className={`rounded-md px-2 py-1 text-center font-semibold ${rule.passed ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
          key={rule.label}
        >
          {rule.label}
        </span>
      ))}
    </div>
  );
}

function BusinessTypeCheckboxes({
  disabled,
  onChange,
  selectedValues
}: {
  disabled?: boolean;
  onChange: (values: string[]) => void;
  selectedValues: string[];
}) {
  function toggle(value: string, checked: boolean) {
    onChange(checked ? [...selectedValues, value] : selectedValues.filter((item) => item !== value));
  }

  return (
    <fieldset className="grid gap-3">
      <legend className="text-sm font-semibold text-slate-800">업무 유형</legend>
      <div className="grid grid-cols-2 gap-2">
        {businessTypeOptions.map((option) => (
          <label
            className="flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm"
            key={option.value}
          >
            <input
              checked={selectedValues.includes(option.value)}
              className="size-4 rounded border-slate-300"
              disabled={disabled}
              name="businessTypes"
              onChange={(event) => toggle(option.value, event.target.checked)}
              type="checkbox"
              value={option.value}
            />
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
