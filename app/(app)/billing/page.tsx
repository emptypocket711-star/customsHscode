import { PageHeading } from "@/components/page-heading";
import { BillingDashboard } from "@/features/billing/billing-dashboard";

export default function BillingPage() {
  return (
    <>
      <PageHeading
        title="플랜 및 사용량"
        description="케이스 한도, 리포트 생성량, 일괄 조회와 실무 보조 기능 사용량을 관리합니다. 결제 상태는 예비진단 결과와 분리됩니다."
      />
      <BillingDashboard />
    </>
  );
}
