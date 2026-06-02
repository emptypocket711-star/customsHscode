import { describe, expect, it } from "vitest";
import { getMarketplaceNotificationSendReadiness } from "@/server/jobs/marketplace-notification-send-readiness";

describe("marketplace notification send readiness", () => {
  it("keeps actual sending disabled unless explicitly enabled and configured", () => {
    expect(getMarketplaceNotificationSendReadiness({})).toEqual({
      enabled: false,
      ready: false,
      reasons: [
        "MARKETPLACE_NOTIFICATIONS_SEND_ENABLED is not enabled.",
        "MARKETPLACE_NOTIFICATIONS_PROVIDER is not configured."
      ]
    });
  });

  it("requires a provider even when sending is enabled", () => {
    expect(getMarketplaceNotificationSendReadiness({
      MARKETPLACE_NOTIFICATIONS_SEND_ENABLED: "true"
    })).toEqual({
      enabled: true,
      ready: false,
      reasons: ["MARKETPLACE_NOTIFICATIONS_PROVIDER is not configured."]
    });
  });

  it("reports ready only when the send flag and provider are configured", () => {
    expect(getMarketplaceNotificationSendReadiness({
      MARKETPLACE_NOTIFICATIONS_PROVIDER: "internal_dry_run",
      MARKETPLACE_NOTIFICATIONS_SEND_ENABLED: "1"
    })).toEqual({
      enabled: true,
      ready: true,
      reasons: []
    });
  });

  it("requires email environment for the transactional email provider", () => {
    expect(getMarketplaceNotificationSendReadiness({
      MARKETPLACE_NOTIFICATIONS_PROVIDER: "transactional_email",
      MARKETPLACE_NOTIFICATIONS_SEND_ENABLED: "true"
    })).toEqual({
      enabled: true,
      ready: false,
      reasons: [
        "RESEND_API_KEY is not configured.",
        "NOTIFICATION_FROM_EMAIL is not configured."
      ]
    });

    expect(getMarketplaceNotificationSendReadiness({
      MARKETPLACE_NOTIFICATIONS_PROVIDER: "transactional_email",
      MARKETPLACE_NOTIFICATIONS_SEND_ENABLED: "true",
      NOTIFICATION_FROM_EMAIL: "HS Finder <noreply@example.test>",
      RESEND_API_KEY: "resend-key"
    })).toEqual({
      enabled: true,
      ready: true,
      reasons: []
    });
  });

  it("rejects unsupported providers even when sending is enabled", () => {
    expect(getMarketplaceNotificationSendReadiness({
      MARKETPLACE_NOTIFICATIONS_PROVIDER: "email",
      MARKETPLACE_NOTIFICATIONS_SEND_ENABLED: "true"
    })).toEqual({
      enabled: true,
      ready: false,
      reasons: ["MARKETPLACE_NOTIFICATIONS_PROVIDER is not supported."]
    });
  });
});
