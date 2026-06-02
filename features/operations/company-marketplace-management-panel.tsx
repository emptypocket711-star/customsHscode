"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { Ban, CheckCircle2, PauseCircle, ShieldCheck, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import type { CompanyOperationsStatusActionState } from "@/features/company-verification/schemas";
import { updateCompanyOperationsStatusAction } from "@/server/actions/company-verification.actions";
import type {
  CompanyOperationsCompanyItem,
  CompanyOperationsCompanyList
} from "@/server/repositories/company-verification-review.repository";

const initialState: CompanyOperationsStatusActionState = {
  status: "idle"
};

const statusLabels: Record<string, string> = {
  blocked: "차단",
  documents_submitted: "서류 제출",
  email_verified: "이메일 인증",
  operator_approved: "운영자 승인",
  recommended_partner: "추천 파트너",
  suspended: "숨김/정지",
  trade_history: "거래 이력",
  unverified: "미검증"
};

const partyTypeLabels: Record<string, string> = {
  customs_broker: "관세사",
  exporter_importer: "화주",
  forwarder: "포워더",
  overseas_partner: "해외 파트너"
};

type CompanyFilter = "active" | "attention" | "all" | "blocked" | "suspended";

const attentionStatuses = new Set(["documents_submitted", "email_verified", "unverified"]);

function statusTone(status: string): "neutral" | "warning" | "info" | "success" {
  if (status === "operator_approved" || status === "recommended_partner" || status === "trade_history") return "success";
  if (status === "documents_submitted" || status === "email_verified") return "info";
  if (status === "suspended" || status === "blocked") return "warning";
  return "neutral";
}

function needsAttention(company: CompanyOperationsCompanyItem) {
  return attentionStatuses.has(company.verificationStatus) || company.verificationStatus === "suspended" || company.verificationStatus === "blocked";
}

function businessNoLabel(value: string | null) {
  if (!value) return "사업자번호 없음";
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

function actionSummary(status: string) {
  if (status === "operator_approved") return "마켓플레이스 참여 허용";
  if (status === "recommended_partner") return "추천 파트너로 우선 관리";
  if (status === "suspended") return "요청 노출과 입찰을 임시 차단";
  if (status === "blocked") return "요청 노출과 입찰을 차단";
  return "검증 상태를 미검증으로 되돌림";
}

function statusEffectText(status: string) {
  if (status === "operator_approved") return "요청 공개와 입찰 참여가 가능합니다.";
  if (status === "recommended_partner") return "요청 공개와 입찰 참여가 가능하며 추천 파트너로 관리합니다.";
  if (status === "suspended") return "요청 노출과 입찰 참여를 임시로 막습니다.";
  if (status === "blocked") return "요청 노출과 입찰 참여를 차단합니다.";
  return "검증 전 상태입니다. 공개 요청 매칭 대상에서 제외됩니다.";
}

function filterLabel(filter: CompanyFilter) {
  if (filter === "attention") return "먼저 볼 업체";
  if (filter === "active") return "활성";
  if (filter === "suspended") return "숨김/정지";
  if (filter === "blocked") return "차단";
  return "전체";
}

function matchesFilter(company: CompanyOperationsCompanyItem, filter: CompanyFilter) {
  if (filter === "attention") return needsAttention(company);
  if (filter === "active") return company.verificationStatus === "operator_approved" || company.verificationStatus === "recommended_partner";
  if (filter === "suspended") return company.verificationStatus === "suspended";
  if (filter === "blocked") return company.verificationStatus === "blocked";
  return true;
}

function sortOperationsCompanies(a: CompanyOperationsCompanyItem, b: CompanyOperationsCompanyItem) {
  const priority = (company: CompanyOperationsCompanyItem) => {
    if (company.verificationStatus === "documents_submitted") return 0;
    if (company.verificationStatus === "suspended" || company.verificationStatus === "blocked") return 1;
    if (company.verificationStatus === "email_verified" || company.verificationStatus === "unverified") return 2;
    return 3;
  };

  return priority(a) - priority(b) || b.createdAt.localeCompare(a.createdAt);
}

function filterCount(companies: CompanyOperationsCompanyItem[], filter: CompanyFilter) {
  return companies.filter((company) => matchesFilter(company, filter)).length;
}

function CompanyStatusForm({ company }: { company: CompanyOperationsCompanyItem }) {
  const [state, action, pending] = useActionState(updateCompanyOperationsStatusAction, initialState);

  useEffect(() => {
    if (state.status !== "idle") {
      window.dispatchEvent(new Event("hsfinder:navigation-progress-done"));
    }
  }, [state.status]);

  return (
    <details className="rounded-md border border-slate-200 bg-slate-50">
      <summary className="cursor-pointer px-3 py-2 text-xs font-semibold text-slate-700">
        상태 변경
      </summary>
      <form action={action} className="grid gap-2 border-t border-slate-200 p-3">
        <input name="companyId" type="hidden" value={company.id} />
        <div className="grid gap-2 md:grid-cols-[minmax(180px,220px)_1fr]">
          <label className="grid gap-1 text-xs font-semibold text-slate-600">
            변경 상태
            <select className="focus-ring h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950" defaultValue={company.verificationStatus} disabled={pending} name="status">
              <option value="operator_approved">운영자 승인</option>
              <option value="recommended_partner">추천 파트너</option>
              <option value="suspended">숨김/정지</option>
              <option value="blocked">차단</option>
              <option value="unverified">미검증</option>
            </select>
          </label>
          <label className="grid gap-1 text-xs font-semibold text-slate-600">
            내부 메모
            <input className="focus-ring h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950" disabled={pending} maxLength={1000} name="note" placeholder="상태 변경 사유를 간단히 남깁니다." />
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button className="focus-ring inline-flex h-9 items-center justify-center rounded-md bg-slate-950 px-3 text-xs font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500" disabled={pending} type="submit">
            {pending ? "변경 중" : "상태 변경"}
          </button>
          <span className="text-xs leading-5 text-slate-500">현재 상태 효과: {statusEffectText(company.verificationStatus)}</span>
        </div>
        {state.message && state.companyId === company.id ? (
          <p className={state.status === "success" ? "rounded-md border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-800" : "rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-800"}>
            {state.message}
          </p>
        ) : null}
      </form>
    </details>
  );
}

export function CompanyMarketplaceManagementPanel({
  companies
}: {
  companies: CompanyOperationsCompanyList;
}) {
  const [activeFilter, setActiveFilter] = useState<CompanyFilter>("attention");
  const counts = companies.items.reduce((summary, company) => {
    summary.total += 1;
    if (company.verificationStatus === "operator_approved" || company.verificationStatus === "recommended_partner") summary.active += 1;
    if (company.verificationStatus === "suspended") summary.suspended += 1;
    if (company.verificationStatus === "blocked") summary.blocked += 1;
    if (needsAttention(company)) summary.attention += 1;
    return summary;
  }, { active: 0, attention: 0, blocked: 0, suspended: 0, total: 0 });
  const visibleCompanies = useMemo(
    () => companies.items.filter((company) => matchesFilter(company, activeFilter)).sort(sortOperationsCompanies),
    [activeFilter, companies.items]
  );
  const filters: CompanyFilter[] = ["attention", "all", "active", "suspended", "blocked"];

  return (
    <Card>
      <CardHeader
        action={<Badge tone="info">{counts.total}개 업체</Badge>}
        description="회사 단위로 마켓플레이스 참여 가능 여부를 관리합니다. 숨김/정지 또는 차단 상태의 업체는 요청 노출·입찰 흐름에서 제외됩니다."
        title="업체 운영 관리"
      />
      <CardBody className="grid gap-3">
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600">
          <p className="font-semibold text-slate-800">상태 기준</p>
          <p>운영자 승인·추천 파트너: 요청 공개와 입찰 참여 가능 / 숨김·정지: 임시 제외 / 차단: 강제 제외 / 미검증: 검증 전 제외</p>
        </div>

        <div className="grid gap-2 text-xs text-slate-600 md:grid-cols-4">
          <span className="rounded-md bg-slate-50 px-3 py-2">전체 {counts.total}</span>
          <span className="rounded-md bg-slate-50 px-3 py-2">먼저 볼 업체 {counts.attention}</span>
          <span className="rounded-md bg-slate-50 px-3 py-2">활성 {counts.active}</span>
          <span className="rounded-md bg-slate-50 px-3 py-2">제외 {counts.suspended + counts.blocked}</span>
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
              {filterLabel(filter)} {filterCount(companies.items, filter)}
            </button>
          ))}
        </div>

        {!companies.schemaReady ? (
          <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
            현재 이 환경에서는 플랫폼 업체 운영 데이터가 준비되지 않아 업체 상태 변경 큐를 불러올 수 없습니다.
          </p>
        ) : null}

        {companies.schemaReady && companies.items.length === 0 ? (
          <p className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            관리할 회사가 없습니다.
          </p>
        ) : null}

        {companies.schemaReady && companies.items.length > 0 && visibleCompanies.length === 0 ? (
          <p className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            {filterLabel(activeFilter)} 조건에 해당하는 회사가 없습니다.
          </p>
        ) : null}

        {visibleCompanies.map((company) => (
          <div className="grid gap-3 rounded-md border border-slate-200 bg-white p-4" key={company.id}>
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-semibold text-slate-950">{company.name}</p>
                  <Badge tone={statusTone(company.verificationStatus)}>
                    {statusLabels[company.verificationStatus] ?? company.verificationStatus}
                  </Badge>
                  {company.partyTypes.map((partyType) => (
                    <Badge key={partyType} tone="neutral">{partyTypeLabels[partyType] ?? partyType}</Badge>
                  ))}
                </div>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {businessNoLabel(company.businessNo)} / 국가 {company.countryCode ?? "-"} / 신뢰 점수 {company.trustScore} / 가입 {company.createdAt.slice(0, 10)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                {company.verificationStatus === "operator_approved" ? <CheckCircle2 aria-label="승인" className="text-emerald-700" size={18} /> : null}
                {company.verificationStatus === "recommended_partner" ? <Star aria-label="추천" className="text-amber-600" size={18} /> : null}
                {company.verificationStatus === "suspended" ? <PauseCircle aria-label="숨김/정지" className="text-amber-700" size={18} /> : null}
                {company.verificationStatus === "blocked" ? <Ban aria-label="차단" className="text-red-700" size={18} /> : null}
                  {company.verificationStatus === "unverified" ? <ShieldCheck aria-label="미검증" className="text-slate-400" size={18} /> : null}
                <span className="sr-only">{actionSummary(company.verificationStatus)}</span>
              </div>
            </div>
            <CompanyStatusForm company={company} />
          </div>
        ))}
      </CardBody>
    </Card>
  );
}
