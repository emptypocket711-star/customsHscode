"use client";

import { useActionState } from "react";
import { Building2, FileUp, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import {
  uploadCompanyVerificationDocumentAction
} from "@/server/actions/company-verification.actions";
import type {
  CompanyVerificationUploadActionState
} from "@/features/company-verification/schemas";
import type { CompanyVerificationDashboard } from "@/server/repositories/company-verification-status.repository";

const initialState: CompanyVerificationUploadActionState = {
  status: "idle"
};

const documentTypeOptions = [
  { label: "사업자등록증", value: "business_registration" },
  { label: "회사등록증", value: "company_registration" },
  { label: "관세사 등록증", value: "customs_broker_license" },
  { label: "포워더 등록증", value: "forwarder_license" },
  { label: "담당자 확인자료", value: "identity_or_contact_proof" },
  { label: "기타 증빙", value: "other" }
];

const verificationStatusLabels: Record<string, { label: string; tone: "neutral" | "warning" | "info" | "success" }> = {
  blocked: { label: "차단", tone: "warning" },
  documents_submitted: { label: "서류 제출", tone: "info" },
  email_verified: { label: "이메일 인증", tone: "neutral" },
  operator_approved: { label: "운영자 승인", tone: "success" },
  recommended_partner: { label: "추천 파트너", tone: "success" },
  suspended: { label: "정지", tone: "warning" },
  trade_history: { label: "거래 이력 있음", tone: "success" },
  unverified: { label: "미검증", tone: "warning" }
};

const documentStatusLabels: Record<string, string> = {
  approved: "승인",
  rejected: "반려",
  submitted: "제출"
};

export function CompanyVerificationPanel({
  dashboard
}: {
  dashboard: CompanyVerificationDashboard;
}) {
  const [state, action, pending] = useActionState(uploadCompanyVerificationDocumentAction, initialState);
  const status = verificationStatusLabels[dashboard.verificationStatus] ?? verificationStatusLabels.unverified;
  const canUpload = dashboard.accountType === "company" && dashboard.companyRole === "admin" && dashboard.schemaReady;

  return (
    <div className="grid gap-5">
      <Card>
        <CardHeader
          action={<ShieldCheck aria-hidden="true" className="text-blue-700" size={22} />}
          description="운송 견적과 통관 의뢰 매칭에 사용할 회사 검증 상태입니다."
          title="회사 검증"
        />
        <CardBody className="grid gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold text-slate-950">
                {dashboard.companyName ?? "회사명 확인 필요"}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                회사 권한 {dashboard.companyRole === "admin" ? "관리자" : "구성원"} / 신뢰 점수 {dashboard.trustScore}
              </p>
            </div>
            <Badge tone={status.tone}>{status.label}</Badge>
          </div>

          {!dashboard.schemaReady ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
              현재 이 환경에서는 회사 검증 자료 제출 기능이 준비 중입니다. 로그인 문제는 아니며, 플랫폼 검증 데이터 준비 후 업로드가 활성화됩니다.
            </p>
          ) : null}
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          action={<FileUp aria-hidden="true" className="text-blue-700" size={22} />}
          description="PDF 또는 이미지 파일만 업로드할 수 있으며, 원문은 private bucket에 저장됩니다."
          title="검증 증빙 제출"
        />
        <CardBody>
          <form action={action} className="grid gap-4">
            <label className="grid gap-2 text-sm font-semibold text-slate-800">
              증빙 유형
              <select
                className="focus-ring h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950"
                disabled={!canUpload || pending}
                name="documentType"
                required
              >
                {documentTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-semibold text-slate-800">
              증빙 파일
              <input
                accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
                className="focus-ring rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-blue-800"
                disabled={!canUpload || pending}
                name="file"
                required
                type="file"
              />
            </label>

            <button
              className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-500"
              disabled={!canUpload || pending}
              type="submit"
            >
              <FileUp aria-hidden="true" size={17} />
              {pending ? "업로드 중" : "증빙 제출"}
            </button>

            {!canUpload ? (
              <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-600">
                회사 관리자만 검증 증빙을 제출할 수 있습니다.
              </p>
            ) : null}

            {state.message ? (
              <p
                className={
                  state.status === "success"
                    ? "rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
                    : "rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
                }
              >
                {state.message}
              </p>
            ) : null}
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          action={<Building2 aria-hidden="true" className="text-blue-700" size={22} />}
          description="제출된 파일 원문은 목록에 노출하지 않습니다."
          title="제출 이력"
        />
        <CardBody>
          {dashboard.documents.length > 0 ? (
            <div className="grid gap-2">
              {dashboard.documents.map((document) => (
                <div
                  className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm sm:grid-cols-[1fr_auto]"
                  key={document.id}
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-950">{document.fileName}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {documentTypeOptions.find((option) => option.value === document.documentType)?.label ?? "증빙"} / {document.createdAt.slice(0, 10)}
                    </p>
                  </div>
                  <Badge tone={document.status === "approved" ? "success" : document.status === "rejected" ? "warning" : "info"}>
                    {documentStatusLabels[document.status] ?? document.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              제출된 회사 검증 증빙이 없습니다.
            </p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
