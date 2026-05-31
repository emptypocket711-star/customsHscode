import { AccessDenied } from "@/components/access-denied";
import { PageHeading } from "@/components/page-heading";
import { StaffModeBanner } from "@/components/staff-mode-banner";
import { StaffReviewCenter } from "@/features/staff-review/staff-review-center";
import { requireStaffRole } from "@/server/auth/role-guard";

export default async function StaffReviewPage() {
  const guard = await requireStaffRole();

  return (
    <>
      <PageHeading
        title="내부 검토 보관함"
        description="고객에게 노출하지 않는 내부 운영 화면입니다. HS 후보, 문서 보정, 리포트 초안, 자료 변경 기록을 필요할 때만 확인합니다."
      />
      {!guard.allowed ? <AccessDenied message={guard.message} /> : null}
      {guard.allowed ? <StaffModeBanner message={guard.message} mode={guard.mode} /> : null}
      {guard.allowed ? <StaffReviewCenter /> : null}
    </>
  );
}
