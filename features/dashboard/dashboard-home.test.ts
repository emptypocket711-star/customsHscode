import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  DashboardHome,
  buildBrokerDashboardMilestones,
  buildForwarderDashboardMilestones,
  buildMarketplaceNextActions,
  buildRequesterDashboardMilestones,
  type DashboardMarketplaceActivitySummary,
  type DashboardMarketplaceSummary
} from "@/features/dashboard/dashboard-home";

function activityFixture(overrides: Partial<DashboardMarketplaceActivitySummary> = {}): DashboardMarketplaceActivitySummary {
  return {
    bidsReceived: 0,
    clearancePartnerActionRequestId: null,
    clearancePartnerActionStatus: null,
    clearancePartnerActions: 0,
    clearanceRequesterActionRequestId: null,
    clearanceRequesterActionStatus: null,
    clearanceRequesterActions: 0,
    completionReportPending: 0,
    completedRequests: 0,
    draftRequests: 0,
    feedbackPending: 0,
    freightPartnerActionRequestId: null,
    freightPartnerActionStatus: null,
    freightPartnerActions: 0,
    freightRequesterActionRequestId: null,
    freightRequesterActionStatus: null,
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
      clearanceRequesterActionStatus: "open",
      clearanceRequesterActions: 1,
      freightRequesterActionRequestId: "freight-1",
      freightRequesterActionStatus: "bids_received",
      freightRequesterActions: 1
    }), summaryFixture);

    expect(actions[0]).toMatchObject({
      description: "운송 요청의 견적 비교, 업체 선정, 진행 상태, 완료 리포트와 피드백을 처리합니다.",
      href: "/requests/freight/freight-1#request-bids",
      title: "내 운송 요청 처리"
    });
    expect(actions[1]).toMatchObject({
      href: "/requests/clearance/clearance-1#request-bids",
      title: "내 통관 의뢰 처리"
    });
  });

  it("keeps completed handoff work in requester next actions", () => {
    const actions = buildMarketplaceNextActions(activityFixture({
      completionReportPending: 1,
      completedRequests: 1,
      feedbackPending: 1,
      freightRequesterActionRequestId: "completed-freight-1",
      freightRequesterActionStatus: "completed",
      freightRequesterActions: 1
    }), summaryFixture);

    expect(actions[0]).toMatchObject({
      href: "/requests/freight/completed-freight-1#request-completion",
      label: "화주 업무",
      title: "내 운송 요청 처리"
    });
    expect(actions[0].description).toContain("완료 리포트");
    expect(actions[0].description).toContain("피드백");
  });

  it("summarizes shipper dashboard work into request, bid, progress, and completion milestones", () => {
    const milestones = buildRequesterDashboardMilestones(activityFixture({
      bidsReceived: 2,
      clearanceRequesterActionRequestId: "clearance-progress-1",
      clearanceRequesterActionStatus: "in_progress",
      completionReportPending: 1,
      draftRequests: 3,
      feedbackPending: 1,
      freightRequesterActionRequestId: "freight-bids-1",
      freightRequesterActionStatus: "bids_received",
      inProgressRequests: 1,
      selectedRequests: 1
    }));

    expect(milestones.map((item) => item.label)).toEqual([
      "요청하기",
      "견적 도착",
      "진행중",
      "완료 대기"
    ]);
    expect(milestones[0]).toMatchObject({ href: "/requests", value: "3건" });
    expect(milestones[1]).toMatchObject({ href: "/requests/freight/freight-bids-1#request-bids", value: "2건" });
    expect(milestones[2]).toMatchObject({ href: "/requests/clearance/clearance-progress-1#request-lifecycle", value: "2건" });
    expect(milestones[3]).toMatchObject({ value: "2건" });
  });

  it("keeps workspace fallback links when no first request id is available", () => {
    const actions = buildMarketplaceNextActions(activityFixture({
      freightPartnerActions: 1,
      freightRequesterActions: 1
    }), summaryFixture);

    expect(actions.map((action) => action.href)).toContain("/requests/freight?workspace=requester");
    expect(actions.map((action) => action.href)).toContain("/requests/freight?workspace=forwarder");
  });

  it("labels partner next actions as ongoing partner work, not only bid availability", () => {
    const actions = buildMarketplaceNextActions(activityFixture({
      freightPartnerActionRequestId: "selected-freight-1",
      freightPartnerActionStatus: "partner_selected",
      freightPartnerActions: 1
    }), {
      ...summaryFixture,
      partyTypes: ["forwarder"]
    });

    expect(actions[0]).toMatchObject({
      description: "매칭된 운송 요청의 견적 제출, 선정 후 진행, 완료 전환 업무를 처리합니다.",
      href: "/requests/freight/opportunities/selected-freight-1#request-lifecycle",
      label: "파트너 업무",
      title: "운송 파트너 업무 확인"
    });
  });

  it("summarizes forwarder dashboard work into opportunity, submitted, selected, and completed milestones", () => {
    const milestones = buildForwarderDashboardMilestones(activityFixture({
      freightPartnerActionRequestId: "selected-freight-1",
      freightPartnerActionStatus: "partner_selected",
      freightPartnerActions: 2,
      partnerOpportunities: 5
    }));

    expect(milestones.map((item) => item.label)).toEqual([
      "새 기회",
      "제출 견적",
      "선정 건",
      "완료 건"
    ]);
    expect(milestones[0]).toMatchObject({ href: "/requests/freight?workspace=forwarder", value: "5건" });
    expect(milestones[1]).toMatchObject({ href: "/requests/freight/opportunities/selected-freight-1#request-lifecycle", value: "2건" });
    expect(milestones[2]).toMatchObject({ value: "2건" });
    expect(milestones[3]).toMatchObject({ value: "0건" });
  });

  it("summarizes broker dashboard work into clearance opportunity, submitted, selected, and completed milestones", () => {
    const milestones = buildBrokerDashboardMilestones(activityFixture({
      clearancePartnerActionRequestId: "completed-clearance-1",
      clearancePartnerActionStatus: "completed",
      clearancePartnerActions: 1,
      partnerOpportunities: 4
    }));

    expect(milestones.map((item) => item.label)).toEqual([
      "통관 의뢰 기회",
      "제출 견적",
      "선정 건",
      "완료 건"
    ]);
    expect(milestones[0]).toMatchObject({ href: "/requests/clearance?workspace=broker", value: "4건" });
    expect(milestones[1]).toMatchObject({ href: "/requests/clearance/opportunities/completed-clearance-1#request-completion", value: "1건" });
    expect(milestones[2]).toMatchObject({ value: "0건" });
    expect(milestones[3]).toMatchObject({ value: "1건" });
  });

  it("sends active partner bid work to the bid section", () => {
    const actions = buildMarketplaceNextActions(activityFixture({
      clearancePartnerActionRequestId: "open-clearance-1",
      clearancePartnerActionStatus: "open",
      clearancePartnerActions: 1
    }), {
      ...summaryFixture,
      partyTypes: ["customs_broker"]
    });

    expect(actions[0]).toMatchObject({
      href: "/requests/clearance/opportunities/open-clearance-1#opportunity-bid",
      label: "파트너 업무",
      title: "통관 파트너 업무 확인"
    });
  });

  it("shows role setup instead of request creation cards before marketplace roles are approved", () => {
    const html = renderToStaticMarkup(
      createElement(DashboardHome, {
        basisDate: "2026-06-03",
        cargoWatches: [],
        favorites: [],
        locale: "ko-KR",
        lookupHistory: [],
        marketplaceActivity: activityFixture(),
        marketplaceNotifications: [],
        marketplaceSummary: {
          ...summaryFixture,
          partyTypes: [],
          roleIntents: []
        },
        notices: []
      })
    );

    expect(html).toContain("플랫폼 역할 설정");
    expect(html).not.toContain("운송 견적 요청</span>");
    expect(html).not.toContain("통관 의뢰 요청</span>");
    expect(html).not.toContain("운송·통관 요청 시작");
    expect(html).not.toContain("내 운송 요청");
    expect(html).not.toContain("운송 입찰 가능");
  });

  it("routes new requester creation to the combined request hub", () => {
    const actions = buildMarketplaceNextActions(activityFixture(), summaryFixture);

    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({
      href: "/requests",
      label: "요청 시작",
      title: "운송·통관 요청 시작"
    });
  });
});
