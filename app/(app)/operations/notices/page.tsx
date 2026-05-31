import { AccessDenied } from "@/components/access-denied";
import { PageHeading } from "@/components/page-heading";
import { NoticeManagementPanel } from "@/features/operations/notice-management-panel";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { requireDeveloperRole } from "@/server/auth/role-guard";
import { listAllAppNotices } from "@/server/repositories/app-notice.repository";

export default async function OperationsNoticesPage() {
  const guard = await requireDeveloperRole();

  if (!guard.allowed) {
    return <AccessDenied message={guard.message} />;
  }

  const notices = await listAllAppNotices(createSupabaseServiceRoleClient(), 50);

  return (
    <div>
      <PageHeading
        title="공지 관리"
        description="대시보드 공지와 접속 팝업만 관리합니다. 평소에는 노출 상태를 확인하고, 수정이 필요할 때 항목을 펼칩니다."
      />
      <NoticeManagementPanel notices={notices} />
    </div>
  );
}
