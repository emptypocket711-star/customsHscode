"use client";

import { Building2, UserRound } from "lucide-react";

export type SignupAccountType = "personal" | "company";

const accountTypeOptions = [
  {
    value: "personal" as const,
    label: "개인회원",
    description: "이메일 인증 후 바로 사용합니다.",
    price: "가격 미정",
    limits: ["동일 아이디 중복 로그인 제한 예정", "장소 제한 없이 접속 가능", "개인 업무 기록 기준으로 저장"],
    icon: UserRound
  },
  {
    value: "company" as const,
    label: "기업회원",
    description: "회사명 기준으로 업무공간을 생성합니다.",
    price: "가격 미정",
    limits: ["접속 IP 5개 기본 제공 예정", "추후 10개 이상 유료 확장 예정", "기업 사용자·권한 관리 확장 예정"],
    icon: Building2
  }
];

export function AccountTypeSelector({
  disabled,
  onChange,
  value
}: {
  disabled?: boolean;
  onChange: (value: SignupAccountType) => void;
  value: SignupAccountType | null;
}) {
  return (
    <fieldset className="grid gap-3">
      <legend className="text-sm font-semibold text-slate-800">회원 유형을 선택하세요</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {accountTypeOptions.map((option) => {
          const selected = value === option.value;
          const Icon = option.icon;

          return (
            <button
              className={`focus-ring min-h-52 rounded-2xl border p-5 text-left transition ${
                selected
                  ? "border-blue-500 bg-blue-50 text-blue-950 shadow-[0_18px_45px_rgba(37,99,235,0.14)]"
                  : "border-slate-200 bg-white text-slate-800 shadow-sm hover:border-blue-200 hover:bg-slate-50"
              }`}
              disabled={disabled}
              key={option.value}
              onClick={() => onChange(option.value)}
              type="button"
            >
              <span
                className={`grid size-11 place-items-center rounded-xl ${
                  selected ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                <Icon aria-hidden="true" size={22} />
              </span>
              <span className="mt-4 block text-lg font-semibold">{option.label}</span>
              <span className="mt-1 block text-sm leading-6 text-slate-600">{option.description}</span>
              <span className="mt-4 inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                {option.price}
              </span>
              <span className="mt-4 grid gap-1.5 text-xs leading-5 text-slate-600">
                {option.limits.map((limit) => (
                  <span className="flex gap-2" key={limit}>
                    <span aria-hidden="true" className={selected ? "text-blue-700" : "text-slate-400"}>
                      •
                    </span>
                    {limit}
                  </span>
                ))}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
