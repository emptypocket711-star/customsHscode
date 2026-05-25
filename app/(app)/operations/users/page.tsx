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
        title="사용자 관리"
        description="개발자 계정에서 가입된 Auth 사용자, 앱 프로필, 회사 정보를 조회하고 수정·삭제합니다."
      />
      <UserManagementPanel users={users} />
    </div>
  );
}
