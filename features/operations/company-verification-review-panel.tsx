"use client";

import { useActionState, useEffect } from "react";
import { CheckCircle2, ExternalLink, FileCheck2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import type { CompanyVerificationReviewActionState } from "@/features/company-verification/schemas";
import { reviewCompanyVerificationDocumentAction } from "@/server/actions/company-verification.actions";
import type {
  CompanyVerificationReviewQueue,
  CompanyVerificationReviewQueueItem
} from "@/server/repositories/company-verification-review.repository";

const initialState: CompanyVerificationReviewActionState = {
  status: "idle"
};

const documentTypeLabels: Record<string, string> = {
  business_registration: "사업자등록증",
  company_registration: "회사등록증",
  customs_broker_license: "관세사 등록증",
  forwarder_license: "포워더 등록증",
  identity_or_contact_proof: "담당자 확인자료",
  other: "기타 증빙"
};

const verificationStatusLabels: Record<string, string> = {
  blocked: "차단",
  documents_submitted: "서류 제출",
  email_verified: "이메일 인증",
  operator_approved: "운영자 승인",
  recommended_partner: "추천 파트너",
  suspended: "정지",
  trade_history: "거래 이력 있음",
  unverified: "미검증"
};

function formatFileSize(value: number | null) {
  if (!value) return "-";
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))}KB`;
  return `${(value / 1024 / 1024).toFixed(1)}MB`;
}

function formatBusinessNo(value: string | null) {
  if (!value) return "사업자번호 미입력";
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

function statusTone(status: string): "neutral" | "warning" | "info" | "success" {
  if (status === "approved") return "success";
  if (status === "rejected") return "warning";
  if (status === "submitted") return "info";
  return "neutral";
}

function ReviewForm({ item }: { item: CompanyVerificationReviewQueueItem }) {
  const [state, action, pending] = useActionState(reviewCompanyVerificationDocumentAction, initialState);
  const isSubmitted = item.status === "submitted";

  useEffect(() => {
    if (state.status !== "idle") {
      window.dispatchEvent(new Event("hsfinder:navigation-progress-done"));
    }
  }, [state.status]);

  return (
    <form action={action} className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
      <input name="documentId" type="hidden" value={item.id} />
      <label className="grid gap-1 text-sm font-medium text-slate-700">
        검토 메모
        <textarea
          className="focus-ring min-h-20 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950"
          defaultValue={item.reviewNote ?? ""}
          disabled={pending}
          maxLength={1000}
          name="reviewNote"
          placeholder="승인 또는 반려 사유를 내부 운영 기준으로 간단히 남깁니다."
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-500"
          disabled={!isSubmitted || pending}
          name="decision"
          type="submit"
          value="approved"
        >
          <CheckCircle2 aria-hidden="true" size={16} />
          승인
        </button>
        <button
          className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-md bg-red-700 px-4 text-sm font-semibold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-slate-500"
          disabled={!isSubmitted || pending}
          name="decision"
          type="submit"
          value="rejected"
        >
          <XCircle aria-hidden="true" size={16} />
          반려
        </button>
      </div>
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
  );
}

export function CompanyVerificationReviewPanel({
  queue
}: {
  queue: CompanyVerificationReviewQueue;
}) {
  const submittedCount = queue.items.filter((item) => item.status === "submitted").length;

  return (
    <Card>
      <CardHeader
        action={<Badge tone={submittedCount > 0 ? "warning" : "neutral"}>{submittedCount}건 대기</Badge>}
        description="회사 검증 증빙 원문은 10분 signed URL로만 열람합니다. 승인 시 회사 검증 상태가 운영자 승인으로 갱신됩니다."
        title="회사 검증 증빙 검토"
      />
      <CardBody className="grid gap-3">
        {!queue.schemaReady ? (
          <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
            현재 이 환경에서는 회사 검증 검토 데이터가 준비되지 않아 검토 큐를 불러올 수 없습니다.
          </p>
        ) : null}

        {queue.schemaReady && queue.items.length === 0 ? (
          <p className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            제출된 회사 검증 증빙이 없습니다.
          </p>
        ) : null}

        {queue.items.map((item) => (
          <div className="grid gap-3 rounded-md border border-slate-200 bg-white p-4" key={item.id}>
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-semibold text-slate-950">{item.companyName}</p>
                  <Badge tone={statusTone(item.status)}>{item.status === "submitted" ? "제출" : item.status === "approved" ? "승인" : "반려"}</Badge>
                  <Badge tone="neutral">{verificationStatusLabels[item.verificationStatus] ?? item.verificationStatus}</Badge>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {formatBusinessNo(item.businessNo)} / 신뢰 점수 {item.trustScore} / 제출일 {item.createdAt.slice(0, 10)}
                </p>
              </div>
              <a
                className={
                  item.signedUrl
                    ? "focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                    : "inline-flex h-10 cursor-not-allowed items-center justify-center gap-2 rounded-md border border-slate-200 bg-slate-100 px-4 text-sm font-semibold text-slate-400"
                }
                href={item.signedUrl ?? undefined}
                rel="noreferrer"
                target="_blank"
              >
                <ExternalLink aria-hidden="true" size={16} />
                원문 열기
              </a>
            </div>

            <div className="grid gap-2 rounded-md bg-slate-50 p-3 text-xs text-slate-600 md:grid-cols-3">
              <span className="inline-flex items-center gap-2 font-medium text-slate-800">
                <FileCheck2 aria-hidden="true" size={15} />
                {documentTypeLabels[item.documentType] ?? "증빙"}
              </span>
              <span className="truncate">{item.fileName}</span>
              <span>{formatFileSize(item.fileSize)} / {item.mimeType ?? "MIME 미확인"}</span>
              <span className="truncate md:col-span-3">checksum {item.checksum ?? "-"}</span>
            </div>

            <ReviewForm item={item} />
          </div>
        ))}
      </CardBody>
    </Card>
  );
}
