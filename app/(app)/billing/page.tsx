import { PageHeading } from "@/components/page-heading";
import { BillingDashboard } from "@/features/billing/billing-dashboard";

export default function BillingPage() {
  return (
    <>
      <PageHeading
        title="사용량"
        description="현재 이용 범위와 리포트 생성량을 확인합니다. 요금 및 결제 안내는 정책 확정 후 별도로 제공합니다."
      />
      <BillingDashboard />
    </>
  );
}
