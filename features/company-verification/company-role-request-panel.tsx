"use client";

import { useActionState, useEffect } from "react";
import { ClipboardCheck, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import type { CompanyRoleRequestActionState } from "@/features/company-verification/company-role-request-schemas";
import { createCompanyRoleRequestAction } from "@/server/actions/company-verification.actions";
import type {
  CompanyRoleRequestItem,
  CompanyRoleRequestsDashboard
} from "@/server/repositories/company-role-requests.repository";

const initialState: CompanyRoleRequestActionState = {
  status: "idle"
};

const roleOptions = [
  {
    description: "운송 견적 또는 통관 의뢰를 요청하는 국내 화주 계정입니다.",
    label: "국내 수출입 화주",
    value: "domestic_shipper"
  },
  {
    description: "해외에서 한국 포워더 또는 관세사무소 연결을 요청하는 파트너 계정입니다.",
    label: "해외 수출입 파트너",
    value: "foreign_shipper"
  },
  {
    description: "공개된 운송 견적 요청에 입찰하는 포워딩 업체 계정입니다.",
    label: "포워더",
    value: "forwarder"
  },
  {
    description: "공개된 통관 의뢰 요청에 수수료 견적을 제안하는 관세사무소 계정입니다.",
    label: "관세사무소",
    value: "customs_broker"
  },
  {
    description: "창고, 보험, 검사 등 향후 실무 연계에 사용할 파트너 계정입니다.",
    label: "기타 실무 파트너",
    value: "support_partner"
  }
];

const overseasVerificationChecklist = [
  "회사명과 실제 사업 국가",
  "담당자 이메일 또는 웹사이트",
  "거래 서류, 제품 자료, 선적 예정 정보"
];

const overseasPendingReasons = [
  "국가·회사 정보가 부족한 경우",
  "담당자 연락처 검증이 어려운 경우",
  "요청 공개 전 민감 서류 확인이 필요한 경우"
];

const statusLabels: Record<string, { label: string; tone: "neutral" | "warning" | "info" | "success" }> = {
  approved: { label: "승인", tone: "success" },
  cancelled: { label: "취소", tone: "neutral" },
  rejected: { label: "반려", tone: "warning" },
  submitted: { label: "검토 대기", tone: "info" }
};

function roleLabel(value: string) {
  return roleOptions.find((option) => option.value === value)?.label ?? value;
}

export function companyRoleRequestDisabledMessage(
  dashboard: Pick<CompanyRoleRequestsDashboard, "companyRole" | "schemaReady">
) {
  if (!dashboard.schemaReady) {
    return "현재 환경에서는 역할 신청 데이터가 준비되지 않아 신청할 수 없습니다. 로그인 문제는 아니며, 운영자에게 역할 승인 데이터 적용 여부를 확인해 주세요.";
  }

  if (dashboard.companyRole !== "admin") {
    return "회사 관리자만 플랫폼 역할을 신청할 수 있습니다. 회사 관리자에게 국내 수출입 화주 또는 필요한 플랫폼 역할 신청을 요청해 주세요.";
  }

  return null;
}

function RequestRow({ request }: { request: CompanyRoleRequestItem }) {
  const status = statusLabels[request.status] ?? statusLabels.submitted;

  return (
    <div className="grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm sm:grid-cols-[1fr_auto]">
      <div className="min-w-0">
        <div className="flex flex-wrap gap-2">
          {request.requestedPartyTypes.map((role) => (
            <Badge key={role} tone="neutral">{roleLabel(role)}</Badge>
          ))}
        </div>
        {request.reason ? (
          <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-600">{request.reason}</p>
        ) : null}
        <p className="mt-2 text-xs text-slate-500">신청일 {request.createdAt.slice(0, 10)}</p>
      </div>
      <Badge tone={status.tone}>{status.label}</Badge>
    </div>
  );
}

export function CompanyRoleRequestPanel({
  dashboard
}: {
  dashboard: CompanyRoleRequestsDashboard;
}) {
  const [state, action, pending] = useActionState(createCompanyRoleRequestAction, initialState);
  const canRequest = dashboard.schemaReady && dashboard.companyRole === "admin";
  const disabledMessage = companyRoleRequestDisabledMessage(dashboard);

  useEffect(() => {
    if (state.status !== "idle") {
      window.dispatchEvent(new Event("hsfinder:navigation-progress-done"));
    }
  }, [state.status]);

  return (
    <Card>
      <CardHeader
        action={<ClipboardCheck aria-hidden="true" className="text-blue-700" size={22} />}
        description="필요한 플랫폼 역할을 신청합니다. 신청만으로 입찰·요청 권한이 바로 부여되지는 않습니다."
        title="플랫폼 역할 신청"
      />
      <CardBody className="grid gap-4">
        {!dashboard.schemaReady ? (
          <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
            현재 이 환경에서는 플랫폼 역할 신청 데이터가 준비되지 않았습니다. 로그인 문제는 아니며, 운영자에게 역할 승인 데이터 적용 여부를 확인해 주세요.
          </p>
        ) : null}

        <form action={action} className="grid gap-4 rounded-md border border-slate-200 bg-slate-50 p-4">
          <fieldset className="grid gap-3">
            <legend className="text-sm font-semibold text-slate-950">신청 역할</legend>
            <div className="grid gap-2 md:grid-cols-2">
              {roleOptions.map((option) => (
                <label
                  className="grid gap-1 rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-700"
                  key={option.value}
                >
                  <span className="inline-flex items-center gap-2 font-semibold text-slate-950">
                    <input
                      className="size-4 rounded border-slate-300"
                      disabled={!canRequest || pending}
                      name="requestedPartyTypes"
                      type="checkbox"
                      value={option.value}
                    />
                    {option.label}
                  </span>
                  <span className="pl-6 text-xs leading-5 text-slate-500">{option.description}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="grid gap-2 text-sm font-semibold text-slate-800">
            신청 사유
            <textarea
              className="focus-ring min-h-28 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal leading-6 text-slate-950"
              disabled={!canRequest || pending}
              maxLength={1000}
              name="reason"
              placeholder="예: 미국 수출 화물 운송 견적을 요청하고, 향후 포워더 입찰도 검토할 예정입니다."
            />
          </label>

          <div className="grid gap-3 rounded-md border border-blue-100 bg-blue-50 p-3 text-sm leading-6 text-blue-950">
            <p>
              운영자가 회사 검증 자료와 신청 사유를 확인한 뒤 역할을 반영합니다. 포워더와 관세사무소 역할은 검증 전까지 입찰 권한으로 사용되지 않습니다.
            </p>
            <p>
              해외 수출입 파트너는 한국 사업자등록번호가 없어도 신청할 수 있습니다. 회사명, 국가, 담당자 정보, 거래 서류 등으로 운영자가 보류·승인 여부를 확인합니다.
            </p>
            <div className="grid gap-2 md:grid-cols-2">
              <div className="rounded-md bg-white p-3">
                <p className="text-xs font-semibold text-blue-900">해외 파트너 확인 자료</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {overseasVerificationChecklist.map((item) => (
                    <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-800" key={item}>{item}</span>
                  ))}
                </div>
              </div>
              <div className="rounded-md bg-white p-3">
                <p className="text-xs font-semibold text-blue-900">보류될 수 있는 경우</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {overseasPendingReasons.map((item) => (
                    <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800" key={item}>{item}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <button
            className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-md bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-500 sm:w-fit"
            disabled={!canRequest || pending}
            type="submit"
          >
            <Send aria-hidden="true" size={16} />
            {pending ? "신청 접수 중" : "역할 신청"}
          </button>

          {disabledMessage ? (
            <p className="rounded-md border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-600">
              {disabledMessage}
            </p>
          ) : null}

          {state.message ? (
            <p
              className={
                state.status === "success"
                  ? "rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
                  : "rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"
              }
            >
              {state.message}
            </p>
          ) : null}
        </form>

        <div className="grid gap-3">
          <p className="text-sm font-semibold text-slate-950">최근 신청 이력</p>
          {dashboard.requests.length ? (
            <div className="grid gap-2">
              {dashboard.requests.map((request) => (
                <RequestRow key={request.id} request={request} />
              ))}
            </div>
          ) : (
            <p className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              아직 접수된 플랫폼 역할 신청이 없습니다.
            </p>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
