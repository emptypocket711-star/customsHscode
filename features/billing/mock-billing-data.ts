export type BillingPlan = {
  id: "starter" | "team" | "brokerage";
  name: string;
  monthlyPriceKrw: number;
  caseLimit: number;
  reportCredits: number;
  staffReviewCredits: number;
  features: string[];
  recommendedFor: string;
};

export type CompanySubscription = {
  companyId: string;
  companyName: string;
  planId: BillingPlan["id"];
  status: "trialing" | "active" | "past_due" | "canceled";
  currentPeriodStart: string;
  currentPeriodEnd: string;
  usedCases: number;
  usedReportCredits: number;
  usedStaffReviewCredits: number;
};

export type CheckoutIntent = {
  id: string;
  planId: BillingPlan["id"];
  amountKrw: number;
  status: "draft" | "pending_payment" | "paid" | "expired";
  note: string;
};

export const mockBillingPlans: BillingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    monthlyPriceKrw: 99000,
    caseLimit: 30,
    reportCredits: 10,
    staffReviewCredits: 3,
    features: ["HS CODE 직접조회", "품명 기반 HS 후보", "수입/수출 예비진단", "source-locked report preview"],
    recommendedFor: "소규모 수입업체 또는 해외구매대행"
  },
  {
    id: "team",
    name: "Team",
    monthlyPriceKrw: 299000,
    caseLimit: 120,
    reportCredits: 50,
    staffReviewCredits: 15,
    features: ["선적서류 진단", "리포트 source lock", "법령 변경 영향 알림", "담당자 검토 큐"],
    recommendedFor: "제조업 무역팀 또는 중소 수출입 업체"
  },
  {
    id: "brokerage",
    name: "Brokerage",
    monthlyPriceKrw: 790000,
    caseLimit: 500,
    reportCredits: 250,
    staffReviewCredits: 80,
    features: ["다중 고객사 케이스", "대량 문서 진단", "검토 승인 워크플로", "감사 로그"],
    recommendedFor: "관세사무소와 물류/포워딩 팀"
  }
];

export const mockCompanySubscription: CompanySubscription = {
  companyId: "company-mock-001",
  companyName: "샘플무역 주식회사",
  planId: "team",
  status: "trialing",
  currentPeriodStart: "2026-05-01",
  currentPeriodEnd: "2026-05-31",
  usedCases: 47,
  usedReportCredits: 18,
  usedStaffReviewCredits: 4
};

export const mockCheckoutIntents: CheckoutIntent[] = [
  {
    id: "checkout-team-202605",
    planId: "team",
    amountKrw: 299000,
    status: "pending_payment",
    note: "외부 결제 PG 연동 전 mock checkout 상태"
  }
];
