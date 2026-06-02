import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ServiceRequestMatchSummaryPanel } from "@/features/service-requests/service-request-match-summary-panel";

describe("ServiceRequestMatchSummaryPanel", () => {
  it("hides match summary while the request is still a draft", () => {
    const html = renderToStaticMarkup(createElement(ServiceRequestMatchSummaryPanel, {
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
});
