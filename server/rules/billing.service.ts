import {
  mockBillingPlans,
  mockCheckoutIntents,
  mockCompanySubscription,
  type BillingPlan
} from "@/features/billing/mock-billing-data";

export type BillingDashboard = {
  plans: BillingPlan[];
  currentPlan: BillingPlan;
  subscription: typeof mockCompanySubscription;
  checkoutIntent: (typeof mockCheckoutIntents)[number] | null;
  usage: {
    caseUsagePercent: number;
    reportCreditUsagePercent: number;
    staffReviewUsagePercent: number;
    remainingCases: number;
    remainingReportCredits: number;
    remainingStaffReviewCredits: number;
  };
  policyNotes: string[];
};

function percent(used: number, limit: number) {
  if (limit <= 0) return 100;
  return Math.min(100, Math.round((used / limit) * 100));
}

export function getBillingDashboard(): BillingDashboard {
  const currentPlan = mockBillingPlans.find((plan) => plan.id === mockCompanySubscription.planId);

  if (!currentPlan) {
    throw new Error("mock billing plan is unavailable");
  }

  return {
    plans: mockBillingPlans,
    currentPlan,
    subscription: mockCompanySubscription,
    checkoutIntent: mockCheckoutIntents[0] ?? null,
    usage: {
      caseUsagePercent: percent(mockCompanySubscription.usedCases, currentPlan.caseLimit),
      reportCreditUsagePercent: percent(mockCompanySubscription.usedReportCredits, currentPlan.reportCredits),
      staffReviewUsagePercent: percent(mockCompanySubscription.usedStaffReviewCredits, currentPlan.staffReviewCredits),
      remainingCases: Math.max(0, currentPlan.caseLimit - mockCompanySubscription.usedCases),
      remainingReportCredits: Math.max(0, currentPlan.reportCredits - mockCompanySubscription.usedReportCredits),
      remainingStaffReviewCredits: Math.max(0, currentPlan.staffReviewCredits - mockCompanySubscription.usedStaffReviewCredits)
    },
    policyNotes: [
      "리포트 크레딧은 source-locked report 생성에 사용되며 담당자 검토 상태를 우회하지 않습니다.",
      "staff review credit은 담당자 승인 워크플로를 추적하기 위한 과금 단위이며 법적 확정을 의미하지 않습니다.",
      "케이스 한도 초과 시 신규 예비진단 요청 생성 전에 플랜 변경 또는 크레딧 충전이 필요합니다."
    ]
  };
}

export const billingInternals = {
  percent
};
