"use client";

import type { ReactNode } from "react";
import { useActionState, useEffect, useMemo, useState } from "react";
import { Activity, ChevronDown, ExternalLink, Filter, KeyRound, Network, Save, Search, Trash2, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import {
  createManagedUserAction,
  deleteManagedUserAction,
  generateManagedUserTestLoginLinkAction,
  updateManagedUserAction,
  type DeveloperUserActionState
} from "@/server/actions/developer-user-management.actions";
import type { ManagedUser } from "@/server/rules/developer-users.service";

const initialState: DeveloperUserActionState = { status: "idle" };

const userManagementPurposeGuide = [
  {
    label: "평소",
    title: "가입자 상태 확인",
    detail: "전체 사용자, 가입 완료 여부, 기업회원 여부, 마지막 로그인만 빠르게 확인합니다."
  },
  {
    label: "지원할 때",
    title: "검색 후 한 명만 펼치기",
    detail: "고객 문의가 들어온 계정만 검색해 권한, 회사 정보, IP 사용 현황을 확인합니다."
  },
  {
    label: "주의",
    title: "권한·삭제는 위험 작업",
    detail: "테스트 로그인, 권한 변경, 삭제는 해당 사용자를 펼친 뒤 필요한 경우에만 실행합니다."
  }
];

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Seoul"
});

function formatDate(value: string | null) {
  if (!value) return "-";
  return dateFormatter.format(new Date(value));
}

function formatBusinessNo(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

function formatEventType(value: string) {
  const labels: Record<string, string> = {
    login_success: "로그인 성공",
    login_failure: "로그인 실패",
    signup_otp_requested: "가입 인증번호 요청",
    signup_email_verified: "이메일 인증",
    signup_completed: "가입 완료",
    password_reset_requested: "비밀번호 재설정 요청",
    password_updated: "비밀번호 변경",
    sign_out: "로그아웃"
  };

  return labels[value] ?? value;
}

function formatMetadata(metadata: Record<string, unknown> | null) {
  if (!metadata) return "";
  const reason = typeof metadata.reason === "string" ? metadata.reason : "";
  const stage = typeof metadata.stage === "string" ? metadata.stage : "";
  const details = [stage, reason].filter(Boolean);
  return details.length > 0 ? details.join(" / ") : "";
}

function truncate(value: string | null, maxLength: number) {
  if (!value) return "-";
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}...` : value;
}

function roleLabel(role: ManagedUser["role"]) {
  if (role === "client") return "일반 사용자";
  if (role === "customs_staff") return "검토 담당";
  if (role === "admin") return "운영 관리자";
  if (role === "developer") return "개발자";
  return role;
}

function companyRoleLabel(role: string) {
  if (role === "admin") return "회사 관리자";
  if (role === "member") return "일반 구성원";
  return role;
}

function StatusMessage({ state }: { state: DeveloperUserActionState }) {
  if (!state.message) return null;

  return (
    <div
      className={
        state.status === "success"
          ? "rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-800"
          : "rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-800"
      }
    >
      {state.message}
    </div>
  );
}

export function UserManagementPanel({ users }: { users: ManagedUser[] }) {
  const [createState, createAction, createPending] = useActionState(createManagedUserAction, initialState);
  const [updateState, updateAction, updatePending] = useActionState(updateManagedUserAction, initialState);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteManagedUserAction, initialState);
  const [testLoginState, testLoginAction, testLoginPending] = useActionState(generateManagedUserTestLoginLinkAction, initialState);
  const [query, setQuery] = useState("");
  const [accountTypeFilter, setAccountTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createAccountType, setCreateAccountType] = useState<"personal" | "company">("company");

  useEffect(() => {
    if (createState.status === "idle" && updateState.status === "idle" && deleteState.status === "idle" && testLoginState.status === "idle") return;
    window.dispatchEvent(new Event("hsfinder:navigation-progress-done"));
  }, [createState.status, deleteState.status, testLoginState.status, updateState.status]);

  const userSummary = useMemo(() => ({
    completed: users.filter((user) => user.onboardingCompletedAt).length,
    company: users.filter((user) => user.accountType === "company").length,
    staff: users.filter((user) => user.role === "customs_staff" || user.role === "admin" || user.role === "developer").length
  }), [users]);

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return users.filter((user) => {
      const matchesQuery =
        !normalizedQuery ||
        [
          user.email,
          user.fullName,
          user.companyName,
          user.businessNo,
          user.id
        ].some((value) => value.toLowerCase().includes(normalizedQuery));
      const matchesAccountType = accountTypeFilter === "all" || user.accountType === accountTypeFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "completed" && user.onboardingCompletedAt) ||
        (statusFilter === "incomplete" && !user.onboardingCompletedAt);
      const matchesRole = roleFilter === "all" || user.role === roleFilter;

      return matchesQuery && matchesAccountType && matchesStatus && matchesRole;
    });
  }, [accountTypeFilter, query, roleFilter, statusFilter, users]);
  const hasDetailedFilters = accountTypeFilter !== "all" || statusFilter !== "all" || roleFilter !== "all";

  return (
    <div className="grid gap-5">
      <Card>
        <CardHeader
          title="고객 계정 요약"
          description="평소에는 사용자 수와 검색만 확인합니다. 회원 유형, 가입 상태, 권한 조건은 필요할 때만 상세 필터를 펼칩니다."
          action={<Badge tone="warning">운영자 전용</Badge>}
        />
        <CardBody className="grid gap-4">
          <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
              <span>
                <span className="font-semibold text-slate-950">전체 {users.length}명</span>
              </span>
              <span className="text-slate-600">가입 완료 {userSummary.completed}명</span>
              <span className="text-slate-600">기업회원 {userSummary.company}명</span>
              <span className="text-slate-600">운영 권한 {userSummary.staff}명</span>
            </div>
          </div>
          <div className="grid gap-3 rounded-md border border-slate-200 bg-white p-3">
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              검색
              <span className="relative">
                <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                <input
                  className="focus-ring h-10 w-full rounded-md border border-slate-300 pl-9 pr-3 text-slate-950"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="이메일, 이름, 회사명, 사업자번호"
                  value={query}
                />
              </span>
            </label>
            <details className="rounded-md border border-slate-200 bg-slate-50" open={hasDetailedFilters}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-sm font-semibold text-slate-700">
                <span className="inline-flex items-center gap-2">
                  <Filter aria-hidden="true" size={16} />
                  상세 필터
                </span>
                <Badge tone={hasDetailedFilters ? "info" : "neutral"}>{hasDetailedFilters ? "적용 중" : "전체"}</Badge>
              </summary>
              <div className="grid gap-3 border-t border-slate-200 bg-white p-3 lg:grid-cols-3">
                <FilterSelect label="회원 유형" onChange={setAccountTypeFilter} value={accountTypeFilter}>
                  <option value="all">전체</option>
                  <option value="personal">개인회원</option>
                  <option value="company">기업회원</option>
                </FilterSelect>
                <FilterSelect label="가입 상태" onChange={setStatusFilter} value={statusFilter}>
                  <option value="all">전체</option>
                  <option value="completed">가입 완료</option>
                  <option value="incomplete">추가정보 미완료</option>
                </FilterSelect>
                <FilterSelect label="권한" onChange={setRoleFilter} value={roleFilter}>
                  <option value="all">전체</option>
                  <option value="client">일반 사용자</option>
                  <option value="customs_staff">검토 담당</option>
                  <option value="admin">운영 관리자</option>
                  <option value="developer">개발자</option>
                </FilterSelect>
              </div>
            </details>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Filter aria-hidden="true" size={16} />
            <span>표시 중 {filteredUsers.length}명 / 전체 {users.length}명</span>
            {query || hasDetailedFilters ? (
              <span className="rounded bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">필터 적용</span>
            ) : null}
          </div>
          <StatusMessage state={updateState} />
          <StatusMessage state={deleteState} />
          <StatusMessage state={testLoginState} />
          <details className="rounded-md border border-slate-200 bg-slate-50">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-sm font-semibold text-slate-700">
              <span>운영 기준 보기</span>
              <Badge tone="neutral">도움말</Badge>
            </summary>
            <div className="grid gap-2 border-t border-slate-200 bg-white p-3 lg:grid-cols-3">
              {userManagementPurposeGuide.map((item) => (
                <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-sm" key={item.label}>
                  <p className="text-xs font-semibold text-slate-500">{item.label}</p>
                  <p className="mt-1 font-semibold text-slate-950">{item.title}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{item.detail}</p>
                </div>
              ))}
            </div>
          </details>
        </CardBody>
      </Card>

      <Card>
        <button
          aria-expanded={showCreateForm}
          className="focus-ring flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-blue-50/60"
          onClick={() => setShowCreateForm((current) => !current)}
          type="button"
        >
          <span>
            <span className="inline-flex items-center gap-2 text-base font-semibold text-slate-950">
              <UserPlus aria-hidden="true" size={18} />
              테스트·수동 계정 발급
            </span>
            <span className="mt-1 block text-sm text-slate-600">
              테스트 계정이나 수동 지원이 필요할 때만 펼쳐서 사용합니다. 생성 내역은 감사 로그에 기록됩니다.
            </span>
          </span>
          <ChevronDown
            aria-hidden="true"
            className={showCreateForm ? "shrink-0 rotate-180 text-blue-700 transition-transform" : "shrink-0 text-slate-500 transition-transform"}
            size={20}
          />
        </button>
        <div className={showCreateForm ? "grid grid-rows-[1fr] transition-[grid-template-rows] duration-300 ease-out" : "grid grid-rows-[0fr] transition-[grid-template-rows] duration-300 ease-out"}>
          <div className="overflow-hidden">
            <CardBody className="grid gap-4 border-t border-slate-200">
              <StatusMessage state={createState} />
              <form action={createAction} className="grid gap-4">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <label className="grid gap-1 text-sm font-medium text-slate-700">
                    회원 유형
                    <select
                      className="focus-ring rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950"
                      name="accountType"
                      onChange={(event) => setCreateAccountType(event.target.value === "personal" ? "personal" : "company")}
                      value={createAccountType}
                    >
                      <option value="company">기업회원</option>
                      <option value="personal">개인회원</option>
                    </select>
                  </label>
                  <label className="grid gap-1 text-sm font-medium text-slate-700">
                    이메일 로그인 ID
                    <input
                      autoComplete="off"
                      className="focus-ring rounded-md border border-slate-300 px-3 py-2 text-slate-950"
                      name="email"
                      placeholder="user@example.com"
                      required
                      type="email"
                    />
                  </label>
                  <label className="grid gap-1 text-sm font-medium text-slate-700">
                    이름
                    <input
                      className="focus-ring rounded-md border border-slate-300 px-3 py-2 text-slate-950"
                      name="fullName"
                      placeholder="사용자 이름"
                      required
                    />
                  </label>
                  <label className="grid gap-1 text-sm font-medium text-slate-700">
                    앱 권한
                    <select className="focus-ring rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950" name="role" defaultValue="client">
                      <option value="client">일반 사용자</option>
                      <option value="customs_staff">검토 담당</option>
                      <option value="admin">운영 관리자</option>
                    </select>
                  </label>
                  <label className="grid gap-1 text-sm font-medium text-slate-700">
                    임시 비밀번호
                    <input
                      autoComplete="new-password"
                      className="focus-ring rounded-md border border-slate-300 px-3 py-2 text-slate-950"
                      minLength={8}
                      name="password"
                      placeholder="8자 이상"
                      required
                      type="password"
                    />
                  </label>
                  <label className="grid gap-1 text-sm font-medium text-slate-700">
                    비밀번호 확인
                    <input
                      autoComplete="new-password"
                      className="focus-ring rounded-md border border-slate-300 px-3 py-2 text-slate-950"
                      minLength={8}
                      name="passwordConfirm"
                      required
                      type="password"
                    />
                  </label>
                  <label className="grid gap-1 text-sm font-medium text-slate-700">
                    회사/공간명
                    <input
                      className="focus-ring rounded-md border border-slate-300 px-3 py-2 text-slate-950"
                      name="companyName"
                      placeholder={createAccountType === "company" ? "회사명" : "미입력 시 개인 공간명 자동 생성"}
                      required={createAccountType === "company"}
                    />
                  </label>
                  <label className="grid gap-1 text-sm font-medium text-slate-700">
                    사업자등록번호
                    <input
                      className="focus-ring rounded-md border border-slate-300 px-3 py-2 text-slate-950 disabled:bg-slate-100 disabled:text-slate-400"
                      disabled={createAccountType === "personal"}
                      name="businessNo"
                      placeholder="000-00-00000"
                      required={createAccountType === "company"}
                    />
                  </label>
                  <label className="grid gap-1 text-sm font-medium text-slate-700">
                    회사 내 권한
                    <select
                      className="focus-ring rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 disabled:bg-slate-100 disabled:text-slate-400"
                      disabled={createAccountType === "personal"}
                      name="companyRole"
                      defaultValue="member"
                    >
                      <option value="member">일반 구성원</option>
                      <option value="admin">회사 관리자</option>
                    </select>
                  </label>
                  <label className="grid gap-1 text-sm font-medium text-slate-700">
                    허용 IP 수
                    <input
                      className="focus-ring rounded-md border border-slate-300 px-3 py-2 text-slate-950 disabled:bg-slate-100 disabled:text-slate-400"
                      disabled={createAccountType === "personal"}
                      max={100}
                      min={1}
                      name="allowedIpCount"
                      defaultValue={createAccountType === "personal" ? 1 : 5}
                      type="number"
                    />
                  </label>
                </div>
                {createAccountType === "personal" ? (
                  <>
                    <input name="companyRole" type="hidden" value="member" />
                    <input name="allowedIpCount" type="hidden" value="1" />
                  </>
                ) : null}
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
                  비밀번호는 숫자, 영문 대문자, 영문 소문자, 특수문자를 모두 포함한 8자 이상이어야 합니다. 개발자 계정은 이 화면에서 새로 만들지 않습니다.
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    className="focus-ring inline-flex items-center gap-2 rounded-md bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-500"
                    disabled={createPending}
                    type="submit"
                  >
                    <UserPlus aria-hidden="true" size={16} />
                    {createPending ? "생성 중" : "사용자 생성"}
                  </button>
                </div>
              </form>
            </CardBody>
          </div>
        </div>
      </Card>

      <div className="grid gap-3">
        {filteredUsers.length === 0 ? (
          <Card>
            <CardBody>
              <p className="text-sm text-slate-600">{users.length === 0 ? "가입된 사용자가 없습니다." : "조건에 맞는 사용자가 없습니다."}</p>
            </CardBody>
          </Card>
        ) : null}

        {filteredUsers.length > 0 ? (
          <div className="hidden rounded-md border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-500 lg:grid lg:grid-cols-[minmax(260px,1.4fr)_140px_140px_160px_160px_36px] lg:items-center">
            <span>사용자</span>
            <span>회원 유형</span>
            <span>권한</span>
            <span>회사/공간</span>
            <span>마지막 로그인</span>
            <span />
          </div>
        ) : null}

        {filteredUsers.map((user) => (
          <Card className="overflow-hidden" key={user.id}>
            <button
              aria-expanded={expandedUserId === user.id}
              className="focus-ring grid w-full gap-3 px-4 py-3 text-left transition hover:bg-blue-50/60 lg:grid-cols-[minmax(260px,1.4fr)_140px_140px_160px_160px_36px] lg:items-center"
              onClick={() => setExpandedUserId((current) => current === user.id ? null : user.id)}
              type="button"
            >
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-sm font-semibold text-slate-950">{user.email}</span>
                  <Badge tone={user.onboardingCompletedAt ? "success" : "warning"}>
                    {user.onboardingCompletedAt ? "가입 완료" : "추가정보 미완료"}
                  </Badge>
                </span>
                <span className="mt-1 block truncate text-xs text-slate-500">{user.fullName || "이름 미입력"} · {user.id}</span>
              </span>
              <span className="flex items-center gap-2 lg:block">
                <span className="text-xs font-semibold text-slate-500 lg:hidden">회원 유형</span>
                <Badge tone={user.accountType === "company" ? "info" : "neutral"}>
                  {user.accountType === "company" ? "기업회원" : "개인회원"}
                </Badge>
              </span>
              <span className="flex items-center gap-2 text-sm font-medium text-slate-700 lg:block">
                <span className="text-xs font-semibold text-slate-500 lg:hidden">권한</span>
                <Badge tone={user.role === "client" ? "neutral" : "info"}>{roleLabel(user.role)}</Badge>
              </span>
              <span className="flex min-w-0 items-center gap-2 text-sm text-slate-700 lg:block">
                <span className="shrink-0 text-xs font-semibold text-slate-500 lg:hidden">회사/공간</span>
                <span className="truncate">{user.companyName || "-"}</span>
              </span>
              <span className="flex items-center gap-2 text-sm text-slate-600 lg:block">
                <span className="text-xs font-semibold text-slate-500 lg:hidden">마지막 로그인</span>
                <span>{formatDate(user.lastSignInAt)}</span>
                <span className="mt-1 block text-xs text-slate-500">로그 {user.recentAccessEvents.length}건 · IP {user.usedLoginIps.length}개</span>
              </span>
              <span className="flex justify-end">
                <ChevronDown
                  aria-hidden="true"
                  className={expandedUserId === user.id ? "text-blue-700 transition-transform rotate-180" : "text-slate-500 transition-transform"}
                  size={18}
                />
              </span>
            </button>

            <div className={expandedUserId === user.id ? "grid grid-rows-[1fr] transition-[grid-template-rows] duration-300 ease-out" : "grid grid-rows-[0fr] transition-[grid-template-rows] duration-300 ease-out"}>
              <div className="overflow-hidden">
                <CardBody className="grid gap-4 border-t border-slate-200 bg-white">
                  <div className="grid gap-2 rounded-md bg-slate-50 p-3 text-xs text-slate-600 md:grid-cols-3">
                    <span>사용자 ID: {user.id}</span>
                    <span>가입: {formatDate(user.authCreatedAt)}</span>
                    <span>마지막 로그인: {formatDate(user.lastSignInAt)}</span>
                  </div>

              <details className="rounded-md border border-slate-200 bg-white">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-sm font-semibold text-slate-800">
                  <span className="inline-flex items-center gap-2">
                    <Save aria-hidden="true" size={16} />
                    기본정보 수정
                  </span>
                  <Badge tone="neutral">필요할 때</Badge>
                </summary>
                <form action={updateAction} className="grid gap-4 border-t border-slate-200 bg-slate-50/60 p-3">
                  <input name="userId" type="hidden" value={user.id} />
                  <input name="companyId" type="hidden" value={user.companyId} />
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <label className="grid gap-1 text-sm font-medium text-slate-700">
                      이메일
                      <input className="focus-ring rounded-md border border-slate-300 px-3 py-2 text-slate-950" name="email" defaultValue={user.email} type="email" />
                    </label>
                    <label className="grid gap-1 text-sm font-medium text-slate-700">
                      이름
                      <input className="focus-ring rounded-md border border-slate-300 px-3 py-2 text-slate-950" name="fullName" defaultValue={user.fullName} />
                    </label>
                    <label className="grid gap-1 text-sm font-medium text-slate-700">
                      권한
                      <select className="focus-ring rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950" name="role" defaultValue={user.role}>
                        <option value="client">일반 사용자</option>
                        <option value="customs_staff">검토 담당</option>
                        <option value="admin">운영 관리자</option>
                        <option value="developer">개발자</option>
                      </select>
                    </label>
                    <label className="grid gap-1 text-sm font-medium text-slate-700">
                      회원 유형
                      <select className="focus-ring rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950" name="accountType" defaultValue={user.accountType}>
                        <option value="personal">개인회원</option>
                        <option value="company">기업회원</option>
                      </select>
                    </label>
                    <label className="grid gap-1 text-sm font-medium text-slate-700">
                      회사/공간명
                      <input className="focus-ring rounded-md border border-slate-300 px-3 py-2 text-slate-950" name="companyName" defaultValue={user.companyName} />
                    </label>
                    <label className="grid gap-1 text-sm font-medium text-slate-700">
                      사업자등록번호
                      <input
                        className="focus-ring rounded-md border border-slate-300 px-3 py-2 text-slate-950"
                        name="businessNo"
                        defaultValue={formatBusinessNo(user.businessNo)}
                        placeholder="000-00-00000"
                      />
                    </label>
                    <label className="grid gap-1 text-sm font-medium text-slate-700">
                      회사 내 권한
                      <select className="focus-ring rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950" name="companyRole" defaultValue={user.companyRole}>
                        <option value="member">일반 구성원</option>
                        <option value="admin">회사 관리자</option>
                      </select>
                    </label>
                    <label className="grid gap-1 text-sm font-medium text-slate-700">
                      허용 IP 수
                      <input
                        className="focus-ring rounded-md border border-slate-300 px-3 py-2 text-slate-950"
                        min={1}
                        max={100}
                        name="allowedIpCount"
                        defaultValue={user.allowedIpCount}
                        type="number"
                      />
                    </label>
                  </div>

                  <div className="grid gap-2 rounded-md bg-white p-3 text-xs text-slate-600 md:grid-cols-3">
                    <span>이메일 인증: {formatDate(user.emailConfirmedAt)}</span>
                    <span>온보딩 완료: {formatDate(user.onboardingCompletedAt)}</span>
                    <span>회사 내 권한: {companyRoleLabel(user.companyRole)}</span>
                  </div>

                  {user.accountType === "company" ? (
                    <div className="rounded-md border border-slate-200 bg-white p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
                          <Network aria-hidden="true" size={16} />
                          기업회원 IP 사용 현황
                        </p>
                        <Badge tone={user.usedLoginIps.length > user.allowedIpCount ? "warning" : "neutral"}>
                          {user.usedLoginIps.length} / {user.allowedIpCount}
                        </Badge>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {user.usedLoginIps.length === 0 ? (
                          <span className="text-xs text-slate-500">로그인 성공 IP가 아직 없습니다.</span>
                        ) : (
                          user.usedLoginIps.map((ip) => (
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700" key={ip}>
                              {ip}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-2">
                    <button
                      className="focus-ring inline-flex items-center gap-2 rounded-md bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-500"
                      disabled={updatePending}
                      type="submit"
                    >
                      <Save aria-hidden="true" size={16} />
                      저장
                    </button>
                  </div>
                </form>
              </details>

                <details className="rounded-md border border-slate-200 bg-white">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-sm font-semibold text-slate-800">
                    <span className="inline-flex items-center gap-2">
                      <Activity aria-hidden="true" size={16} />
                      최근 접속 이력
                    </span>
                    <span className="text-xs font-medium text-slate-500">{user.recentAccessEvents.length}건</span>
                  </summary>
                  <div className="border-t border-slate-200">
                    {user.recentAccessEvents.length === 0 ? (
                      <p className="px-3 py-3 text-sm text-slate-500">접속 이력이 없습니다.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-500">
                            <tr>
                              <th className="px-3 py-2 font-semibold">시간</th>
                              <th className="px-3 py-2 font-semibold">이벤트</th>
                              <th className="px-3 py-2 font-semibold">IP</th>
                              <th className="px-3 py-2 font-semibold">환경</th>
                              <th className="px-3 py-2 font-semibold">메모</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700">
                            {user.recentAccessEvents.map((event) => (
                              <tr key={event.id}>
                                <td className="whitespace-nowrap px-3 py-2">{formatDate(event.createdAt)}</td>
                                <td className="whitespace-nowrap px-3 py-2 font-medium text-slate-900">{formatEventType(event.eventType)}</td>
                                <td className="whitespace-nowrap px-3 py-2">{event.ipAddress ?? "-"}</td>
                                <td className="max-w-[280px] px-3 py-2">{truncate(event.userAgent, 96)}</td>
                                <td className="max-w-[220px] px-3 py-2">{formatMetadata(event.metadata) || "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </details>

              <details className="rounded-md border border-slate-200 bg-slate-50">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-sm font-semibold text-slate-800">
                  <span>테스트·위험 작업</span>
                  <Badge tone="warning">필요할 때만</Badge>
                </summary>
                <div className="grid gap-3 border-t border-slate-200 p-3">
                  <form action={testLoginAction} className="grid gap-3 rounded-md border border-amber-200 bg-amber-50 p-3">
                    <input name="userId" type="hidden" value={user.id} />
                    <input name="email" type="hidden" value={user.email} />
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="inline-flex items-center gap-2 text-sm font-semibold text-amber-950">
                          <KeyRound aria-hidden="true" size={16} />
                          테스트 로그인 링크
                        </p>
                        <p className="mt-1 text-xs leading-5 text-amber-900">
                          개발자 테스트 전용입니다. 링크를 받은 사람은 비밀번호 없이 해당 계정으로 접속할 수 있으므로 공유하지 마세요.
                        </p>
                      </div>
                      <button
                        className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-md bg-amber-700 px-4 text-sm font-semibold text-white hover:bg-amber-800 disabled:cursor-not-allowed disabled:bg-slate-500"
                        disabled={testLoginPending}
                        type="submit"
                      >
                        <KeyRound aria-hidden="true" size={16} />
                        {testLoginPending ? "생성 중" : "링크 생성"}
                      </button>
                    </div>
                    {testLoginState.status === "success" && testLoginState.targetUserId === user.id && testLoginState.testLoginUrl ? (
                      <div className="grid gap-2 rounded-md border border-amber-300 bg-white p-3">
                        <label className="grid gap-1 text-xs font-semibold text-slate-700">
                          생성된 링크
                          <input
                            className="focus-ring rounded-md border border-slate-300 px-3 py-2 font-mono text-xs text-slate-950"
                            readOnly
                            value={testLoginState.testLoginUrl}
                          />
                        </label>
                        <a
                          className="focus-ring inline-flex h-10 w-fit items-center gap-2 rounded-md bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800"
                          href={testLoginState.testLoginUrl}
                          rel="noreferrer"
                          target="_blank"
                        >
                          <ExternalLink aria-hidden="true" size={16} />
                          새 창에서 테스트 로그인
                        </a>
                      </div>
                    ) : null}
                  </form>

                  <form
                    action={deleteAction}
                    className="grid gap-3 rounded-md border border-red-200 bg-red-50 p-3"
                    onSubmit={(event) => {
                      if (!window.confirm(`${user.email} 사용자를 삭제할까요? 이 작업은 되돌릴 수 없습니다.`)) {
                        event.preventDefault();
                      }
                    }}
                  >
                    <input name="userId" type="hidden" value={user.id} />
                    <input name="companyId" type="hidden" value={user.companyId} />
                    <div className="grid gap-2 md:grid-cols-[1fr_auto] md:items-end">
                      <label className="grid gap-1 text-sm font-medium text-red-900">
                        삭제 확인
                        <input className="focus-ring rounded-md border border-red-200 bg-white px-3 py-2 text-slate-950" name="confirmation" placeholder="DELETE 입력" />
                      </label>
                      <button
                        className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-md bg-red-700 px-4 text-sm font-semibold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-slate-500"
                        disabled={deletePending}
                        type="submit"
                      >
                        <Trash2 aria-hidden="true" size={16} />
                        사용자 삭제
                      </button>
                    </div>
                    <p className="text-xs text-red-800">Auth 사용자 삭제 후 연결된 프로필은 자동 삭제됩니다. 남은 사용자가 없는 회사 공간은 함께 정리됩니다.</p>
                  </form>
                </div>
              </details>
                </CardBody>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function FilterSelect({
  children,
  label,
  onChange,
  value
}: {
  children: ReactNode;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="grid gap-1 text-sm font-medium text-slate-700">
      {label}
      <select
        className="focus-ring h-10 rounded-md border border-slate-300 bg-white px-3 text-slate-950"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {children}
      </select>
    </label>
  );
}
