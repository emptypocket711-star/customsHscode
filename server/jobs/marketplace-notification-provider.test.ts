import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createMarketplaceNotificationProvider,
  marketplaceNotificationProviderNames
} from "@/server/jobs/marketplace-notification-provider";
import { listMarketplaceNotificationRecipientsForPartner } from "@/server/jobs/marketplace-notification-recipients";
import { sendTransactionalEmail } from "@/server/notifications/email";

vi.mock("@/server/jobs/marketplace-notification-recipients", () => ({
  listMarketplaceNotificationRecipientsForPartner: vi.fn()
}));

vi.mock("@/server/notifications/email", () => ({
  sendTransactionalEmail: vi.fn()
}));

describe("marketplace notification provider", () => {
  beforeEach(() => {
    vi.mocked(listMarketplaceNotificationRecipientsForPartner).mockReset();
    vi.mocked(sendTransactionalEmail).mockReset();
  });

  it("exposes the provider allowlist used by readiness checks", () => {
    expect(marketplaceNotificationProviderNames).toEqual(["internal_dry_run", "transactional_email"]);
  });

  it("does not create a sender for unknown providers", () => {
    expect(createMarketplaceNotificationProvider(undefined)).toBeNull();
    expect(createMarketplaceNotificationProvider("email")).toBeNull();
    expect(createMarketplaceNotificationProvider("transactional_email")).toBeNull();
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

  it("creates a transactional email sender with a resolved partner recipient", async () => {
    vi.mocked(listMarketplaceNotificationRecipientsForPartner).mockResolvedValueOnce([{
      companyRole: "admin",
      email: "partner-admin@example.test",
      userId: "user-1"
    }]);
    vi.mocked(sendTransactionalEmail).mockResolvedValueOnce({
      providerId: "resend-1",
      sent: true
    });
    const sender = createMarketplaceNotificationProvider("transactional_email", { supabase: {} as never });

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
      providerId: "resend-1"
    });

    expect(listMarketplaceNotificationRecipientsForPartner).toHaveBeenCalledWith({}, "partner-1", {
      limit: 1,
      requireEmailOptInForKind: "initial"
    });
    expect(sendTransactionalEmail).toHaveBeenCalledWith(expect.objectContaining({
      subject: "[HS FINDER] 운송 견적 알림: 신규 요청",
      to: "partner-admin@example.test"
    }));
    expect(vi.mocked(sendTransactionalEmail).mock.calls[0][0].text).not.toContain("request-1");
  });

  it("fails before sending email when a partner recipient is missing", async () => {
    vi.mocked(listMarketplaceNotificationRecipientsForPartner).mockResolvedValueOnce([]);
    const sender = createMarketplaceNotificationProvider("transactional_email", { supabase: {} as never });

    await expect(sender?.({
      deliveryId: "delivery-1",
      target: {
        matchId: "match-1",
        notificationKind: "deadline_reminder",
        partnerCompanyId: "partner-1",
        reason: "deadline_reminder",
        requestId: "request-1",
        requestType: "clearance"
      }
    })).rejects.toThrow("recipient_missing");

    expect(sendTransactionalEmail).not.toHaveBeenCalled();
  });
});
