import { AccessDenied } from "@/components/access-denied";
import { PageHeading } from "@/components/page-heading";
import { StaffModeBanner } from "@/components/staff-mode-banner";
import { LegalUpdateCenter } from "@/features/legal-updates/legal-update-center";
import { requireStaffRole } from "@/server/auth/role-guard";

export default async function LegalUpdatesPage() {
  const guard = await requireStaffRole();

  return (
    <>
      <PageHeading title="자료 관리" description="HS, 세율, 수입요건, 원산지표시, 목적국 자료가 최신 원천 기준으로 준비되어 있는지 확인합니다. 갱신과 게시는 필요할 때만 실행합니다." />
      {!guard.allowed ? <AccessDenied message={guard.message} /> : null}
      {guard.allowed ? <StaffModeBanner message={guard.message} mode={guard.mode} /> : null}
      {guard.allowed ? <LegalUpdateCenter /> : null}
    </>
  );
}
