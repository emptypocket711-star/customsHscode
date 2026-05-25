import { PageHeading } from "@/components/page-heading";
import { CompanyMembershipPanel } from "@/features/company/company-membership-panel";
import { loadCompanyMembershipData } from "@/server/actions/company-membership.actions";

export default async function CompanyMembersPage() {
  const data = await loadCompanyMembershipData();

  return (
    <>
      <PageHeading
        title="회사 구성원 관리"
        description="회사 최초 가입자 또는 회사 관리자가 같은 회사로 가입한 사용자의 합류 요청을 승인하거나 거절합니다."
      />
      <CompanyMembershipPanel data={data} />
    </>
  );
}
