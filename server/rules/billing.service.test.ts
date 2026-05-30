import { describe, expect, it } from "vitest";
import { getBillingDashboard, billingInternals } from "@/server/rules/billing.service";

describe("billing service", () => {
  it("calculates usage and remaining credits for current company", () => {
    const dashboard = getBillingDashboard();

    expect(dashboard.currentPlan.id).toBe("team");
    expect(dashboard.usage.remainingCases).toBeGreaterThan(0);
    expect(dashboard.usage.reportCreditUsagePercent).toBeGreaterThan(0);
  });

  it("caps usage percentage at 100", () => {
    expect(billingInternals.percent(150, 100)).toBe(100);
  });

  it("does not describe paid reports as legal confirmation", () => {
    const dashboard = getBillingDashboard();
    const policyText = dashboard.policyNotes.join(" ");

    expect(policyText).toContain("예비 조회");
    expect(policyText).not.toContain("보장");
    expect(policyText).not.toContain("검토 크레딧");
  });
});
