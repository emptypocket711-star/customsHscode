import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ServiceRequestMatchSummaryPanel } from "@/features/service-requests/service-request-match-summary-panel";

describe("ServiceRequestMatchSummaryPanel", () => {
  it("hides match summary while the request is still a draft", () => {
    const html = renderToStaticMarkup(createElement(ServiceRequestMatchSummaryPanel, {
      kind: "freight",
      partnerLabel: "포워더",
      status: "draft",
      summary: {
        failedNotificationCount: 0,
        matchedPartnerCount: 2,
        pendingNotificationCount: 2,
        sentNotificationCount: 0,
        skippedNotificationCount: 0
      }
    }));

    expect(html).toBe("");
  });

  it("renders requester-visible match and notification counts after publish", () => {
    const html = renderToStaticMarkup(createElement(ServiceRequestMatchSummaryPanel, {
      kind: "clearance",
      partnerLabel: "관세사무소",
      status: "open",
      summary: {
        failedNotificationCount: 1,
        matchedPartnerCount: 3,
        pendingNotificationCount: 1,
        sentNotificationCount: 1,
        skippedNotificationCount: 1
      }
    }));

    expect(html).toContain("파트너 노출·알림 상태");
    expect(html).toContain("조건에 맞는 관세사무소 3곳");
    expect(html).toContain("알림 대기 1건");
    expect(html).toContain("발송 1건");
    expect(html).toContain("스킵 1건");
    expect(html).toContain("실패 1건");
  });

  it("shows a specific operation review hint when no partner is matched", () => {
    const html = renderToStaticMarkup(createElement(ServiceRequestMatchSummaryPanel, {
      kind: "freight",
      partnerLabel: "포워더",
      status: "open",
      summary: {
        failedNotificationCount: 0,
        matchedPartnerCount: 0,
        pendingNotificationCount: 0,
        sentNotificationCount: 0,
        skippedNotificationCount: 0
      }
    }));

    expect(html).toContain("조건에 맞는 포워더 0곳");
    expect(html).toContain("위험물·온도관리·중고차 조건");
    expect(html).toContain("운영 점검 필요");
  });
});
