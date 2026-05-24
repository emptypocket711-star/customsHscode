import { AccessDenied } from "@/components/access-denied";
import { PageHeading } from "@/components/page-heading";
import { StaffModeBanner } from "@/components/staff-mode-banner";
import { LegalUpdateCenter } from "@/features/legal-updates/legal-update-center";
import { requireStaffRole } from "@/server/auth/role-guard";

export default async function LegalUpdatesPage() {
  const guard = await requireStaffRole();

  return (
    <>
      <PageHeading title="법령 업데이트 센터" description="법령, 세율, FTA, 수출입요건, 전략물자 원천 데이터를 버전 단위로 적재하고 검토 후 게시하는 운영 화면입니다." />
      {!guard.allowed ? <AccessDenied message={guard.message} /> : null}
      {guard.allowed ? <StaffModeBanner message={guard.message} mode={guard.mode} /> : null}
      {guard.allowed ? <LegalUpdateCenter /> : null}
    </>
  );
}
