import { Suspense } from "react";
import { PageHeading } from "@/components/page-heading";
import { DutyEstimatorPanel } from "@/features/duty-estimator/duty-estimator-panel";

export default function DutyEstimatorPage() {
  return (
    <>
      <PageHeading
        title="예상 납세액 계산"
        description="물품가격과 관세율을 입력해 관세, 내국세, 부가세, 총 납세액을 계산합니다."
      />
      <Suspense>
        <DutyEstimatorPanel />
      </Suspense>
    </>
  );
}
