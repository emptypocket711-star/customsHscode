"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { CheckCircle2, ClipboardCheck, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import type { CompanyRoleRequestReviewActionState } from "@/features/company-verification/company-role-request-schemas";
import { reviewCompanyRoleRequestAction } from "@/server/actions/company-verification.actions";
import type {
  CompanyRoleRequestReviewQueue,
  CompanyRoleRequestReviewQueueItem
} from "@/server/repositories/company-verification-review.repository";

const initialState: CompanyRoleRequestReviewActionState = {
  status: "idle"
};

const roleLabels: Record<string, string> = {
  customs_broker: "관세사무소",
  domestic_shipper: "국내 수출입 화주",
  foreign_shipper: "해외 수출입 파트너",
  forwarder: "포워더",
  support_partner: "기타 실무 파트너"
};

const statusLabels: Record<string, { label: string; tone: "neutral" | "warning" | "info" | "success" }> = {
  approved: { label: "승인", tone: "success" },
  cancelled: { label: "취소", tone: "neutral" },
  rejected: { label: "반려", tone: "warning" },
  submitted: { label: "검토 대기", tone: "info" }
};

type QueueFilter = "all" | "submitted" | "approved" | "rejected";

function formatBusinessNo(value: string | null) {
  if (!value) return "사업자번호 미입력";
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

function filterLabel(filter: QueueFilter) {
  if (filter === "submitted") return "검토 대기";
  if (filter === "approved") return "승인";
  if (filter === "rejected") return "반려";
  return "전체";
}

function RequestReviewForm({ item }: { item: CompanyRoleRequestReviewQueueItem }) {
  const [state, action, pending] = useActionState(reviewCompanyRoleRequestAction, initialState);
  const canReview = item.status === "submitted";

  useEffect(() => {
    if (state.status !== "idle") {
      window.dispatchEvent(new Event("hsfinder:navigation-progress-done"));
    }
  }, [state.status]);

  return (
    <form action={action} className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
      <input name="requestId" type="hidden" value={item.id} />
      <label className="grid gap-1 text-sm font-medium text-slate-700">
        검토 메모
        <textarea
          className="focus-ring min-h-20 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950"
          defaultValue={item.reviewNote ?? ""}
          disabled={!canReview || pending}
          maxLength={1000}
          name="reviewNote"
          placeholder="승인 또는 반려 사유를 내부 기준으로 간단히 남깁니다."
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-500"
          disabled={!canReview || pending}
          name="decision"
          type="submit"
          value="approved"
        >
          <CheckCircle2 aria-hidden="true" size={16} />
          승인 및 역할 반영
        </button>
        <button
          className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-md bg-red-700 px-4 text-sm font-semibold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-slate-500"
          disabled={!canReview || pending}
          name="decision"
          type="submit"
          value="rejected"
        >
          <XCircle aria-hidden="true" size={16} />
          반려
        </button>
      </div>
      {state.message && state.requestId === item.id ? (
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

function RequestRow({ item }: { item: CompanyRoleRequestReviewQueueItem }) {
  const status = statusLabels[item.status] ?? statusLabels.submitted;

  return (
    <div className="grid gap-3 rounded-md border border-slate-200 bg-white p-4">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold text-slate-950">{item.companyName}</p>
            <Badge tone={status.tone}>{status.label}</Badge>
            <Badge tone="neutral">{item.verificationStatus}</Badge>
          </div>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            {formatBusinessNo(item.businessNo)} / 신청자 {item.requestedByName ?? item.requestedByEmail ?? "미확인"} / 신청일 {item.createdAt.slice(0, 10)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {item.requestedPartyTypes.map((role) => (
            <Badge key={role} tone="neutral">{roleLabels[role] ?? role}</Badge>
          ))}
        </div>
      </div>

      {item.reason ? (
        <p className="rounded-md bg-slate-50 p-3 text-sm leading-6 text-slate-700">{item.reason}</p>
      ) : (
        <p className="rounded-md bg-slate-50 p-3 text-sm leading-6 text-slate-500">신청 사유가 입력되지 않았습니다.</p>
      )}

      <RequestReviewForm item={item} />
    </div>
  );
}

export function CompanyRoleRequestReviewPanel({
  queue
}: {
  queue: CompanyRoleRequestReviewQueue;
}) {
  const [activeFilter, setActiveFilter] = useState<QueueFilter>("submitted");
  const submittedCount = queue.items.filter((item) => item.status === "submitted").length;
  const filters: QueueFilter[] = ["submitted", "all", "approved", "rejected"];
  const visibleItems = useMemo(
    () => queue.items.filter((item) => activeFilter === "all" || item.status === activeFilter),
    [activeFilter, queue.items]
  );

  return (
    <Card>
      <CardHeader
        action={(
          <div className="flex items-center gap-2">
            <ClipboardCheck aria-hidden="true" className="text-blue-700" size={20} />
            <Badge tone={submittedCount > 0 ? "warning" : "neutral"}>{submittedCount}건 대기</Badge>
          </div>
        )}
        description="회사 역할 신청을 승인하면 실제 플랫폼 역할에 반영됩니다. 포워더·관세사무소 역할은 입찰 권한에 직접 영향을 줍니다."
        title="플랫폼 역할 신청 검토"
      />
      <CardBody className="grid gap-3">
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600">
          <p className="font-semibold text-slate-800">검토 기준</p>
          <p>승인은 회사 검증 자료와 신청 사유를 확인한 뒤 처리합니다. 승인된 역할은 `company_party_types`에 반영되어 요청 노출·입찰 조건에 사용됩니다.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              className={
                activeFilter === filter
                  ? "focus-ring rounded-md bg-slate-950 px-3 py-2 text-xs font-semibold text-white"
                  : "focus-ring rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              }
              key={filter}
              onClick={() => setActiveFilter(filter)}
              type="button"
            >
              {filterLabel(filter)}
            </button>
          ))}
        </div>

        {!queue.schemaReady ? (
          <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
            현재 이 환경에서는 플랫폼 역할 신청 검토 데이터가 준비되지 않아 검토 큐를 불러올 수 없습니다.
          </p>
        ) : null}

        {queue.schemaReady && queue.items.length === 0 ? (
          <p className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            접수된 플랫폼 역할 신청이 없습니다.
          </p>
        ) : null}

        {queue.schemaReady && queue.items.length > 0 && visibleItems.length === 0 ? (
          <p className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            {filterLabel(activeFilter)} 상태의 역할 신청이 없습니다.
          </p>
        ) : null}

        {visibleItems.map((item) => (
          <RequestRow item={item} key={item.id} />
        ))}
      </CardBody>
    </Card>
  );
}
