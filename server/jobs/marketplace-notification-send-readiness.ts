import { marketplaceNotificationProviderNames } from "@/server/jobs/marketplace-notification-provider";

export type MarketplaceNotificationSendReadiness = {
  enabled: boolean;
  ready: boolean;
  reasons: string[];
};

function isEnabled(value: string | undefined) {
  return value === "1" || value === "true";
}

function isSupportedProvider(value: string | undefined) {
  return marketplaceNotificationProviderNames.includes(value as typeof marketplaceNotificationProviderNames[number]);
}

export function getMarketplaceNotificationSendReadiness(
  env: Partial<Record<
    "MARKETPLACE_NOTIFICATIONS_SEND_ENABLED" |
    "MARKETPLACE_NOTIFICATIONS_PROVIDER" |
    "NOTIFICATION_FROM_EMAIL" |
    "RESEND_API_KEY",
    string | undefined
  >>
): MarketplaceNotificationSendReadiness {
  const enabled = isEnabled(env.MARKETPLACE_NOTIFICATIONS_SEND_ENABLED);
  const reasons: string[] = [];

  if (!enabled) {
    reasons.push("MARKETPLACE_NOTIFICATIONS_SEND_ENABLED is not enabled.");
  }

  if (!env.MARKETPLACE_NOTIFICATIONS_PROVIDER) {
    reasons.push("MARKETPLACE_NOTIFICATIONS_PROVIDER is not configured.");
  } else if (!isSupportedProvider(env.MARKETPLACE_NOTIFICATIONS_PROVIDER)) {
    reasons.push("MARKETPLACE_NOTIFICATIONS_PROVIDER is not supported.");
  } else if (env.MARKETPLACE_NOTIFICATIONS_PROVIDER === "transactional_email") {
    if (!env.RESEND_API_KEY) {
      reasons.push("RESEND_API_KEY is not configured.");
    }
    if (!env.NOTIFICATION_FROM_EMAIL) {
      reasons.push("NOTIFICATION_FROM_EMAIL is not configured.");
    }
  }

  return {
    enabled,
    ready: enabled && reasons.length === 0,
    reasons
  };
}
