"use client";

import { useActionState } from "react";
import { Save, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import {
  deleteManagedUserAction,
  updateManagedUserAction,
  type DeveloperUserActionState
} from "@/server/actions/developer-user-management.actions";
import type { ManagedUser } from "@/server/rules/developer-users.service";

const initialState: DeveloperUserActionState = { status: "idle" };

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Seoul"
  }).format(new Date(value));
}

function formatBusinessNo(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
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
  const [updateState, updateAction, updatePending] = useActionState(updateManagedUserAction, initialState);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteManagedUserAction, initialState);

  return (
    <div className="grid gap-5">
      <Card>
        <CardHeader
          title="가입 사용자 관리"
          description="Supabase Auth 사용자와 앱 프로필, 회사 정보를 연결해 조회합니다. 수정·삭제는 개발자 계정에서만 실행됩니다."
          action={<Badge tone="warning">developer only</Badge>}
        />
        <CardBody className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold text-slate-500">전체 Auth 유저</p>
              <p className="mt-1 text-2xl font-semibold text-slate-950">{users.length}</p>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold text-slate-500">가입 완료</p>
              <p className="mt-1 text-2xl font-semibold text-slate-950">{users.filter((user) => user.onboardingCompletedAt).length}</p>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold text-slate-500">기업회원</p>
              <p className="mt-1 text-2xl font-semibold text-slate-950">{users.filter((user) => user.accountType === "company").length}</p>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold text-slate-500">개인회원</p>
              <p className="mt-1 text-2xl font-semibold text-slate-950">{users.filter((user) => user.accountType === "personal").length}</p>
            </div>
          </div>
          <StatusMessage state={updateState} />
          <StatusMessage state={deleteState} />
        </CardBody>
      </Card>

      <div className="grid gap-3">
        {users.length === 0 ? (
          <Card>
            <CardBody>
              <p className="text-sm text-slate-600">가입된 사용자가 없습니다.</p>
            </CardBody>
          </Card>
        ) : null}

        {users.map((user) => (
          <Card key={user.id}>
            <CardBody className="grid gap-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-semibold text-slate-950">{user.email}</p>
                    <Badge tone={user.onboardingCompletedAt ? "success" : "warning"}>
                      {user.onboardingCompletedAt ? "가입 완료" : "추가정보 미완료"}
                    </Badge>
                    <Badge tone={user.accountType === "company" ? "info" : "neutral"}>
                      {user.accountType === "company" ? "기업회원" : "개인회원"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">사용자 ID {user.id}</p>
                </div>
                <div className="grid gap-1 text-sm text-slate-600 lg:text-right">
                  <span>가입 {formatDate(user.authCreatedAt)}</span>
                  <span>마지막 로그인 {formatDate(user.lastSignInAt)}</span>
                </div>
              </div>

              <form action={updateAction} className="grid gap-4">
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
                      <option value="client">client</option>
                      <option value="customs_staff">customs_staff</option>
                      <option value="admin">admin</option>
                      <option value="developer">developer</option>
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
                      <option value="member">member</option>
                      <option value="admin">admin</option>
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

                <div className="grid gap-2 rounded-md bg-slate-50 p-3 text-xs text-slate-600 md:grid-cols-3">
                  <span>이메일 인증: {formatDate(user.emailConfirmedAt)}</span>
                  <span>온보딩 완료: {formatDate(user.onboardingCompletedAt)}</span>
                  <span>회사 타입: {user.companyType || "-"}</span>
                </div>

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
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
