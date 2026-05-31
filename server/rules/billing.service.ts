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
    remainingCases: number;
    remainingReportCredits: number;
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
      remainingCases: Math.max(0, currentPlan.caseLimit - mockCompanySubscription.usedCases),
      remainingReportCredits: Math.max(0, currentPlan.reportCredits - mockCompanySubscription.usedReportCredits)
    },
    policyNotes: [
      "리포트 생성량은 예비 요약과 출처 잠금 미리보기 생성에 사용하는 사용량 단위입니다.",
      "요금제는 HS CODE 판정 대행을 포함하지 않으며, 결과는 셀프서브 예비 조회로 제공됩니다.",
      "케이스 한도 초과 시 신규 예비진단 요청 생성 전에 플랜 변경 또는 사용량 한도 조정이 필요합니다."
    ]
  };
}

export const billingInternals = {
  percent
};
