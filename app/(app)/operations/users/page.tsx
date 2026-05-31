import { AccessDenied } from "@/components/access-denied";
import { PageHeading } from "@/components/page-heading";
import { UserManagementPanel } from "@/features/operations/user-management-panel";
import { requireDeveloperRole } from "@/server/auth/role-guard";
import { listManagedUsers } from "@/server/rules/developer-users.service";

export default async function OperationsUsersPage() {
  const guard = await requireDeveloperRole();

  if (!guard.allowed) {
    return <AccessDenied message={guard.message} />;
  }

  const users = await listManagedUsers();

  return (
    <div>
      <PageHeading
        title="고객 계정 관리"
        description="가입자 상태와 테스트 계정만 빠르게 확인합니다. 권한·삭제 같은 위험 작업은 사용자를 펼친 뒤 실행합니다."
      />
      <UserManagementPanel users={users} />
    </div>
  );
}
