import { describe, expect, it } from "vitest";
import {
  createMarketplaceNotificationProvider,
  marketplaceNotificationProviderNames
} from "@/server/jobs/marketplace-notification-provider";

describe("marketplace notification provider", () => {
  it("exposes the provider allowlist used by readiness checks", () => {
    expect(marketplaceNotificationProviderNames).toEqual(["internal_dry_run"]);
  });

  it("does not create a sender for unknown providers", () => {
    expect(createMarketplaceNotificationProvider(undefined)).toBeNull();
    expect(createMarketplaceNotificationProvider("email")).toBeNull();
  });

  it("creates an internal dry-run sender without external delivery", async () => {
    const sender = createMarketplaceNotificationProvider("internal_dry_run");

    await expect(sender?.({
      deliveryId: "delivery-1",
      target: {
        matchId: "match-1",
        notificationKind: "initial",
        partnerCompanyId: "partner-1",
        reason: "matched_request_open",
        requestId: "request-1",
        requestType: "freight"
      }
    })).resolves.toEqual({
      providerId: "internal_dry_run:initial:delivery-1"
    });
  });
});
