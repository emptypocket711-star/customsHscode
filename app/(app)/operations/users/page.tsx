import { AccessDenied } from "@/components/access-denied";
import { PageHeading } from "@/components/page-heading";
import { CompanyMarketplaceManagementPanel } from "@/features/operations/company-marketplace-management-panel";
import { CompanyRoleRequestReviewPanel } from "@/features/operations/company-role-request-review-panel";
import { CompanyVerificationReviewPanel } from "@/features/operations/company-verification-review-panel";
import { OperationsUsersPriorityPanel } from "@/features/operations/operations-users-priority-panel";
import { PlatformRequestOperationsPanel } from "@/features/operations/platform-request-operations-panel";
import { UserManagementPanel } from "@/features/operations/user-management-panel";
import { requireDeveloperRole } from "@/server/auth/role-guard";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  listCompanyOperationsCompanies,
  listCompanyRoleRequestReviewQueue,
  listCompanyVerificationReviewQueue
} from "@/server/repositories/company-verification-review.repository";
import { getPlatformRequestOperationsSummary } from "@/server/repositories/platform-operations.repository";
import { listManagedUsers } from "@/server/rules/developer-users.service";

export default async function OperationsUsersPage() {
  const guard = await requireDeveloperRole();

  if (!guard.allowed) {
    return <AccessDenied message={guard.message} />;
  }

  const supabase = await createSupabaseServerClient();
  const [users, verificationQueue, companies, roleRequestQueue, platformRequestSummary] = await Promise.all([
    listManagedUsers(),
    listCompanyVerificationReviewQueue(),
    listCompanyOperationsCompanies(),
    listCompanyRoleRequestReviewQueue(),
    getPlatformRequestOperationsSummary(supabase)
  ]);
  const pendingRoleRequests = roleRequestQueue.items.filter((item) => item.status === "submitted").length;
  const pendingVerificationDocuments = verificationQueue.items.filter((item) => item.status === "submitted").length;
  const attentionCompanies = companies.items.filter((company) => (
    company.verificationStatus === "documents_submitted" ||
    company.verificationStatus === "email_verified" ||
    company.verificationStatus === "unverified" ||
    company.verificationStatus === "suspended" ||
    company.verificationStatus === "blocked"
  )).length;
  const defaultOpenSection = pendingRoleRequests > 0
    ? "role-requests"
    : pendingVerificationDocuments > 0
      ? "verification-documents"
      : attentionCompanies > 0
        ? "company-status"
        : null;

  return (
    <div className="grid gap-5">
      <PageHeading
        title="운영 관리 홈"
        description="역할 신청, 회사 검증, 플랫폼 요청 병목을 먼저 확인하고 사용자 상세는 문의 대응이 필요할 때만 펼칩니다."
      />
      <OperationsUsersPriorityPanel
        companies={companies}
        platformRequestSummary={platformRequestSummary}
        roleRequests={roleRequestQueue}
        users={users}
        verificationQueue={verificationQueue}
      />
      <PlatformRequestOperationsPanel summary={platformRequestSummary} />
      <details className="scroll-mt-6 rounded-lg border border-slate-200 bg-white shadow-sm" id="role-requests" open={defaultOpenSection === "role-requests"}>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4">
          <span>
            <span className="block text-base font-semibold text-slate-950">플랫폼 역할 신청 검토</span>
            <span className="mt-1 block text-sm text-slate-600">입찰·요청 권한을 열기 전 승인 또는 반려할 신청만 확인합니다.</span>
          </span>
          <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">{pendingRoleRequests}건</span>
        </summary>
        <div className="border-t border-slate-200 p-5">
          <CompanyRoleRequestReviewPanel queue={roleRequestQueue} />
        </div>
      </details>
      <details className="scroll-mt-6 rounded-lg border border-slate-200 bg-white shadow-sm" id="verification-documents" open={defaultOpenSection === "verification-documents"}>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4">
          <span>
            <span className="block text-base font-semibold text-slate-950">회사 검증 증빙 검토</span>
            <span className="mt-1 block text-sm text-slate-600">사업자·회사 증빙을 확인해 운영자 승인 여부를 판단합니다.</span>
          </span>
          <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">{pendingVerificationDocuments}건</span>
        </summary>
        <div className="border-t border-slate-200 p-5">
          <CompanyVerificationReviewPanel queue={verificationQueue} />
        </div>
      </details>
      <details className="scroll-mt-6 rounded-lg border border-slate-200 bg-white shadow-sm" id="company-status" open={defaultOpenSection === "company-status"}>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4">
          <span>
            <span className="block text-base font-semibold text-slate-950">업체 운영 관리</span>
            <span className="mt-1 block text-sm text-slate-600">미검증, 정지, 차단 등 요청 노출에 영향을 주는 업체 상태만 필요할 때 확인합니다.</span>
          </span>
          <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">{attentionCompanies}건</span>
        </summary>
        <div className="border-t border-slate-200 p-5">
          <CompanyMarketplaceManagementPanel companies={companies} />
        </div>
      </details>
      <details id="user-management" className="scroll-mt-6 rounded-lg border border-slate-200 bg-white shadow-sm">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4">
          <span>
            <span className="block text-base font-semibold text-slate-950">사용자 상세 관리</span>
            <span className="mt-1 block text-sm text-slate-600">문의 계정 검색, 테스트 로그인, 권한 변경, 삭제가 필요할 때만 펼칩니다.</span>
          </span>
          <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">상세</span>
        </summary>
        <div className="border-t border-slate-200 p-5">
          <UserManagementPanel users={users} />
        </div>
      </details>
    </div>
  );
}
