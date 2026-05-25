"use client";

import { useActionState } from "react";
import { Check, Clock, ShieldCheck, UserRound, X } from "lucide-react";
import {
  reviewCompanyJoinRequestAction,
  type CompanyJoinRequestItem,
  type CompanyMemberItem,
  type CompanyMembershipData,
  type CompanyJoinReviewState
} from "@/server/actions/company-membership.actions";

const initialState: CompanyJoinReviewState = {
  status: "idle"
};

const businessTypeLabels: Record<string, string> = {
  customs_broker: "관세사무소",
  forwarder: "포워더",
  exporter: "수출기업",
  importer: "수입기업"
};

export function CompanyMembershipPanel({ data }: { data: CompanyMembershipData }) {
  const [state, formAction, pending] = useActionState(reviewCompanyJoinRequestAction, initialState);

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500">회사</p>
            <h2 className="mt-1 text-xl font-semibold tracking-normal text-slate-950">{data.companyName ?? "회사 정보 없음"}</h2>
          </div>
          <span
            className={
              data.canManage
                ? "inline-flex w-fit items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800"
                : "inline-flex w-fit items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
            }
          >
            <ShieldCheck aria-hidden="true" size={14} />
            {data.isDeveloper ? "개발자 운영 권한" : data.canManage ? "회사 관리자" : "일반 구성원"}
          </span>
        </div>
        {data.message ? (
          <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">{data.message}</p>
        ) : null}
      </section>

      {data.canManage ? (
        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-base font-semibold tracking-normal text-slate-950">합류 요청</h2>
            <p className="mt-1 text-sm text-slate-600">
              {data.isDeveloper
                ? "전체 회사의 대기 중인 합류 요청을 승인하거나 거절합니다."
                : "같은 회사명으로 가입한 사용자의 소속 요청을 승인하거나 거절합니다."}
            </p>
          </div>
          {state.message ? (
            <p
              className={
                state.status === "error"
                  ? "mx-5 mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-800"
                  : "mx-5 mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800"
              }
            >
              {state.message}
            </p>
          ) : null}
          <JoinRequestList formAction={formAction} pending={pending} requests={data.requests} showCompanyName={data.isDeveloper} />
        </section>
      ) : null}

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-semibold tracking-normal text-slate-950">회사 구성원</h2>
          <p className="mt-1 text-sm text-slate-600">현재 회사에 소속된 사용자 목록입니다.</p>
        </div>
        <MemberList members={data.members} />
      </section>
    </div>
  );
}

function JoinRequestList({
  formAction,
  pending,
  requests,
  showCompanyName
}: {
  formAction: (payload: FormData) => void;
  pending: boolean;
  requests: CompanyJoinRequestItem[];
  showCompanyName?: boolean;
}) {
  if (requests.length === 0) {
    return (
      <div className="grid place-items-center px-5 py-12 text-center">
        <Clock aria-hidden="true" className="text-slate-400" size={28} />
        <p className="mt-3 text-sm font-semibold text-slate-700">대기 중인 합류 요청이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-200">
      {requests.map((request) => (
        <div className="grid gap-4 px-5 py-4 lg:grid-cols-[1fr_auto]" key={request.id}>
          <div>
            {showCompanyName ? (
              <p className="mb-2 w-fit rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800">
                {request.companyName ?? "회사명 확인 필요"}
              </p>
            ) : null}
            <p className="text-sm font-semibold text-slate-950">{request.fullName}</p>
            <p className="mt-1 text-sm text-slate-600">{request.email}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {request.requestedBusinessTypes.length > 0 ? (
                request.requestedBusinessTypes.map((type) => (
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700" key={type}>
                    {businessTypeLabels[type] ?? type}
                  </span>
                ))
              ) : (
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500">업무 유형 미입력</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <form action={formAction}>
              <input name="requestId" type="hidden" value={request.id} />
              <input name="decision" type="hidden" value="approved" />
              <button
                className="focus-ring inline-flex h-10 items-center gap-2 rounded-md bg-blue-700 px-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                disabled={pending}
                type="submit"
              >
                <Check aria-hidden="true" size={16} />
                승인
              </button>
            </form>
            <form action={formAction}>
              <input name="requestId" type="hidden" value={request.id} />
              <input name="decision" type="hidden" value="rejected" />
              <button
                className="focus-ring inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100"
                disabled={pending}
                type="submit"
              >
                <X aria-hidden="true" size={16} />
                거절
              </button>
            </form>
          </div>
        </div>
      ))}
    </div>
  );
}

function MemberList({ members }: { members: CompanyMemberItem[] }) {
  if (members.length === 0) {
    return <p className="px-5 py-10 text-center text-sm font-medium text-slate-500">등록된 구성원이 없습니다.</p>;
  }

  return (
    <div className="divide-y divide-slate-200">
      {members.map((member) => (
        <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between" key={member.id}>
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-slate-100 text-slate-600">
              <UserRound aria-hidden="true" size={18} />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-950">{member.fullName}</p>
              <p className="mt-1 text-sm text-slate-600">{member.email}</p>
            </div>
          </div>
          <span
            className={
              member.companyRole === "admin"
                ? "inline-flex w-fit items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800"
                : "inline-flex w-fit items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
            }
          >
            {member.companyRole === "admin" ? "회사 관리자" : "구성원"}
          </span>
        </div>
      ))}
    </div>
  );
}
