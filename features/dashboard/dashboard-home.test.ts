import { describe, expect, it } from "vitest";
import {
  buildMarketplaceNextActions,
  type DashboardMarketplaceActivitySummary,
  type DashboardMarketplaceSummary
} from "@/features/dashboard/dashboard-home";

function activityFixture(overrides: Partial<DashboardMarketplaceActivitySummary> = {}): DashboardMarketplaceActivitySummary {
  return {
    bidsReceived: 0,
    clearancePartnerActionRequestId: null,
    clearancePartnerActions: 0,
    clearanceRequesterActionRequestId: null,
    clearanceRequesterActions: 0,
    completedRequests: 0,
    draftRequests: 0,
    feedbackPending: 0,
    freightPartnerActionRequestId: null,
    freightPartnerActions: 0,
    freightRequesterActionRequestId: null,
    freightRequesterActions: 0,
    inProgressRequests: 0,
    openRequests: 0,
    partnerOpportunities: 0,
    schemaReady: true,
    selectedRequests: 0,
    ...overrides
  };
}

const summaryFixture: DashboardMarketplaceSummary = {
  companyName: "테스트 회사",
  companyRole: "admin",
  partyTypes: ["domestic_shipper"],
  roleIntents: [],
  schemaReady: true,
  trustScore: 0,
  verificationStatus: "operator_approved"
};

describe("dashboard marketplace next actions", () => {
  it("links requester work directly to the first actionable request detail", () => {
    const actions = buildMarketplaceNextActions(activityFixture({
      clearanceRequesterActionRequestId: "clearance-1",
      clearanceRequesterActions: 1,
      freightRequesterActionRequestId: "freight-1",
      freightRequesterActions: 1
    }), summaryFixture);

    expect(actions[0]).toMatchObject({
      href: "/requests/freight/freight-1",
      title: "내 운송 요청 처리"
    });
    expect(actions[1]).toMatchObject({
      href: "/requests/clearance/clearance-1",
      title: "내 통관 의뢰 처리"
    });
  });

  it("keeps workspace fallback links when no first request id is available", () => {
    const actions = buildMarketplaceNextActions(activityFixture({
      freightPartnerActions: 1,
      freightRequesterActions: 1
    }), summaryFixture);

    expect(actions.map((action) => action.href)).toContain("/requests/freight?workspace=requester");
    expect(actions.map((action) => action.href)).toContain("/requests/freight?workspace=forwarder");
  });
});
