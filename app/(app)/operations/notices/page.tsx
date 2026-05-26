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
        title="공지사항 관리"
        description="대시보드 공지사항을 작성, 수정, 삭제합니다. 이 화면은 지정된 개발자 계정만 사용할 수 있습니다."
      />
      <NoticeManagementPanel notices={notices} />
    </div>
  );
}
