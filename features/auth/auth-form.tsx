"use client";

import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Building2, CheckCircle2, Lock, LogIn, Mail, User, UserPlus, type LucideIcon } from "lucide-react";
import Link from "next/link";
import {
  authenticateAction,
  checkSignupEmailAvailabilityAction,
  sendSignupEmailOtpAction,
  verifySignupEmailOtpAction
} from "@/server/actions/auth.actions";
import { AccountTypeSelector, type SignupAccountType } from "@/features/auth/account-type-selector";
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
  const [emailCheckPending, startEmailCheckTransition] = useTransition();
  const [signupEmail, setSignupEmail] = useState(sendState.email ?? "");
  const [emailAvailability, setEmailAvailability] = useState<SignupOtpActionState>({ status: "idle" });
  const [otpToken, setOtpToken] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupPasswordConfirm, setSignupPasswordConfirm] = useState("");
  const [signupFullName, setSignupFullName] = useState("");
  const [accountType, setAccountType] = useState<SignupAccountType | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [businessNo, setBusinessNo] = useState("");
  const [selectedBusinessTypes, setSelectedBusinessTypes] = useState<string[]>([]);
  const [resendCooldown, setResendCooldown] = useState(0);
  const lastCooldownMessageRef = useRef<string | undefined>(undefined);
  const emailCheckRequestRef = useRef(0);

  const mode = authState.status === "idle" ? initialMode : authState.mode;
  const isLogin = mode === "login";
  const isSignup = mode === "signup";
  const isReset = mode === "reset";
  const normalizedSignupEmail = signupEmail.trim().toLowerCase();
  const verifiedSignupEmail = Boolean(isSignup && verifyState.verified && verifyState.email?.toLowerCase() === normalizedSignupEmail);
  const sendStateMatchesEmail = sendState.email?.toLowerCase() === normalizedSignupEmail;
  const activeEmail = verifiedSignupEmail ? verifyState.email : sendStateMatchesEmail ? sendState.email : signupEmail;
  const pending = authPending || sendPending || verifyPending;
  const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupEmail.trim());
  const isSignupEmailAvailable = emailAvailability.status === "success" && emailAvailability.email?.toLowerCase() === normalizedSignupEmail;
  const isSignupEmailBlocked = emailAvailability.status === "error" && emailAvailability.email?.toLowerCase() === normalizedSignupEmail;

  useEffect(() => {
    if (sendState.status !== "success" || lastCooldownMessageRef.current === sendState.message) return;

    lastCooldownMessageRef.current = sendState.message;
    const startTimer = window.setTimeout(() => setResendCooldown(60), 0);
    const timer = window.setInterval(() => {
      setResendCooldown((value) => {
        if (value <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return value - 1;
      });
    }, 1000);

    return () => {
      window.clearTimeout(startTimer);
      window.clearInterval(timer);
    };
  }, [sendState.status, sendState.message]);

  useEffect(() => {
    if (!isSignup || !accountType || verifiedSignupEmail) return;

    const requestId = emailCheckRequestRef.current + 1;
    emailCheckRequestRef.current = requestId;

    if (!emailLooksValid) return;

    const timer = window.setTimeout(() => {
      startEmailCheckTransition(async () => {
        const result = await checkSignupEmailAvailabilityAction(signupEmail);
        if (emailCheckRequestRef.current === requestId) {
          setEmailAvailability(result);
        }
      });
    }, 450);

    return () => window.clearTimeout(timer);
  }, [accountType, emailLooksValid, isSignup, signupEmail, verifiedSignupEmail]);

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
  const signupPasswordChecks = passwordChecks(signupPassword);
  const isSignupPasswordStrong = Object.values(signupPasswordChecks).every(Boolean);
  const isSignupPasswordConfirmValid = signupPassword.length > 0 && signupPassword === signupPasswordConfirm;
  const isCompanySignup = accountType === "company";
  const isBusinessNoValid = businessNo.replace(/\D/g, "").length === 10;
  const canCompleteSignup =
    accountType !== null &&
    verifiedSignupEmail &&
    isSignupPasswordStrong &&
    isSignupPasswordConfirmValid &&
    signupFullName.trim().length > 0 &&
    (!isCompanySignup || (companyName.trim().length > 0 && isBusinessNoValid && selectedBusinessTypes.length > 0)) &&
    !authPending;

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
          <AccountTypeSelector disabled={pending} value={accountType} onChange={setAccountType} />

          {accountType ? (
            <div className="grid gap-5 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <form action={sendAction} className="grid gap-3">
                <input name="accountType" type="hidden" value={accountType} />
                <AuthInput
                  autoComplete="email"
                  disabled={pending || verifiedSignupEmail}
                  icon={Mail}
                  label="이메일"
                  name="email"
                  onChange={(value) => {
                    setSignupEmail(value);
                    setOtpToken("");
                  }}
                  placeholder="이메일을 입력하세요"
                  type="email"
                  value={signupEmail}
                />
                {emailCheckPending ? (
                  <p className="rounded-lg border border-slate-200 bg-white p-3 text-sm font-medium text-slate-600">이메일 중복 여부를 확인하고 있습니다.</p>
                ) : emailAvailability.message && emailAvailability.email?.toLowerCase() === normalizedSignupEmail ? (
                  <StatusMessage state={emailAvailability} />
                ) : null}
                <button
                  className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 text-sm font-semibold text-blue-800 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                  disabled={pending || verifiedSignupEmail || !isSignupEmailAvailable || isSignupEmailBlocked || resendCooldown > 0}
                  type="submit"
                >
                  <Mail aria-hidden="true" size={16} />
                  {sendPending
                    ? "전송 중"
                    : verifiedSignupEmail
                      ? "이메일 인증 완료"
                      : resendCooldown > 0
                        ? `재전송 대기 ${resendCooldown}초`
                        : "인증번호 전송"}
                </button>
              </form>

              {sendState.message && sendStateMatchesEmail ? <StatusMessage state={sendState} /> : null}

              {sendState.status === "success" && sendStateMatchesEmail && !verifiedSignupEmail ? (
                <form action={verifyAction} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4">
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

              <form action={authAction} className="grid gap-5">
              <input name="mode" type="hidden" value="signup" />
              <input name="email" type="hidden" value={activeEmail} />
              <input name="accountType" type="hidden" value={accountType} />
              {!verifiedSignupEmail ? (
                <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-900">
                  이메일 인증을 완료하면 아래 가입 정보를 입력할 수 있습니다.
                </p>
              ) : null}
              <AuthInput
                autoComplete="new-password"
                disabled={authPending || !verifiedSignupEmail}
                icon={Lock}
                label="비밀번호"
                name="password"
                onChange={setSignupPassword}
                placeholder="숫자, 영문 대소문자, 특수문자 포함"
                type="password"
                value={signupPassword}
              />
              <PasswordRules checks={signupPasswordChecks} />
              <AuthInput
                autoComplete="new-password"
                disabled={authPending || !verifiedSignupEmail}
                icon={Lock}
                label="비밀번호 확인"
                name="passwordConfirm"
                onChange={setSignupPasswordConfirm}
                placeholder="비밀번호를 다시 입력하세요"
                type="password"
                value={signupPasswordConfirm}
              />
              {signupPasswordConfirm ? (
                <p className={`text-xs font-semibold ${isSignupPasswordConfirmValid ? "text-emerald-700" : "text-red-700"}`}>
                  {isSignupPasswordConfirmValid ? "비밀번호가 일치합니다." : "비밀번호가 일치하지 않습니다."}
                </p>
              ) : null}
              <AuthInput
                autoComplete="name"
                disabled={authPending || !verifiedSignupEmail}
                icon={User}
                label="이름"
                name="fullName"
                onChange={setSignupFullName}
                placeholder="이름을 입력하세요"
                value={signupFullName}
              />
              {isCompanySignup ? (
                <>
                  <CompanyNameInput
                    companyName={companyName}
                    disabled={authPending || !verifiedSignupEmail}
                    onValueChange={setCompanyName}
                  />
                  <AuthInput
                    autoComplete="off"
                    disabled={authPending || !verifiedSignupEmail}
                    icon={Building2}
                    inputMode="numeric"
                    label="사업자등록번호"
                    maxLength={12}
                    name="businessNo"
                    onChange={(value) => setBusinessNo(formatBusinessNo(value))}
                    placeholder="000-00-00000"
                    value={businessNo}
                  />
                  <BusinessTypeCheckboxes disabled={authPending || !verifiedSignupEmail} selectedValues={selectedBusinessTypes} onChange={setSelectedBusinessTypes} />
                </>
              ) : null}

              <button
                className="focus-ring inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-100 transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-500"
                disabled={!canCompleteSignup}
                type="submit"
              >
                <UserPlus aria-hidden="true" size={17} />
                {authPending ? "처리 중" : "회원가입 완료"}
              </button>

              {authState.message ? <StatusMessage state={authState} /> : null}
            </form>
            </div>
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

function passwordChecks(password: string) {
  return {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password)
  };
}

function formatBusinessNo(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

function PasswordRules({ checks }: { checks: ReturnType<typeof passwordChecks> }) {
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
