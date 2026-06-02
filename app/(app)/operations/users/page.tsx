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

  return (
    <div className="grid gap-5">
      <PageHeading
        title="고객 계정 관리"
        description="먼저 처리할 역할 신청과 검증 큐를 확인한 뒤, 필요할 때만 업체 상태와 사용자 상세를 봅니다."
      />
      <OperationsUsersPriorityPanel
        companies={companies}
        roleRequests={roleRequestQueue}
        users={users}
        verificationQueue={verificationQueue}
      />
      <PlatformRequestOperationsPanel summary={platformRequestSummary} />
      <div id="role-requests" className="scroll-mt-6">
        <CompanyRoleRequestReviewPanel queue={roleRequestQueue} />
      </div>
      <div id="verification-documents" className="scroll-mt-6">
        <CompanyVerificationReviewPanel queue={verificationQueue} />
      </div>
      <div id="company-status" className="scroll-mt-6">
        <CompanyMarketplaceManagementPanel companies={companies} />
      </div>
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
