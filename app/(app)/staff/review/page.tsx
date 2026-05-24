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
        title="담당자 검토 센터"
        description="HS 후보, 리포트, 법령 변경 이벤트를 검토합니다. 고객 화면의 예비진단은 담당자 승인과 분리됩니다."
      />
      {!guard.allowed ? <AccessDenied message={guard.message} /> : null}
      {guard.allowed ? <StaffModeBanner message={guard.message} mode={guard.mode} /> : null}
      {guard.allowed ? <StaffReviewCenter /> : null}
    </>
  );
}
