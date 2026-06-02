import { describe, expect, it } from "vitest";
import {
  getMarketplaceNotificationHref,
  marketplaceNotificationKindLabel,
  marketplaceNotificationRequestTypeLabel,
  marketplaceNotificationStatusLabel
} from "@/features/dashboard/marketplace-notification-inbox";

describe("marketplace notification inbox dashboard helpers", () => {
  it("links partner notifications to the matching opportunity workspace", () => {
    expect(getMarketplaceNotificationHref({
      channel: "in_app",
      requestId: "request-1",
      requestType: "freight"
    })).toBe("/requests/freight/opportunities/request-1");

    expect(getMarketplaceNotificationHref({
      channel: "in_app",
      requestId: "request-2",
      requestType: "clearance"
    })).toBe("/requests/clearance/opportunities/request-2");
  });

  it("keeps notification labels concise for dashboard display", () => {
    expect(marketplaceNotificationRequestTypeLabel("freight")).toBe("운송");
    expect(marketplaceNotificationRequestTypeLabel("clearance")).toBe("통관");
    expect(marketplaceNotificationKindLabel("deadline_reminder")).toBe("마감 임박");
    expect(marketplaceNotificationStatusLabel("claimed")).toBe("확인 필요");
  });
});
