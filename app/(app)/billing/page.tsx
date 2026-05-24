import { PageHeading } from "@/components/page-heading";
import { BillingDashboard } from "@/features/billing/billing-dashboard";

export default function BillingPage() {
  return (
    <>
      <PageHeading
        title="플랜 및 크레딧"
        description="케이스 한도, 리포트 크레딧, 담당자 검토 크레딧을 관리합니다. 결제 상태는 예비진단/담당자 검토 상태와 분리됩니다."
      />
      <BillingDashboard />
    </>
  );
}
