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
  env: Partial<Record<"MARKETPLACE_NOTIFICATIONS_SEND_ENABLED" | "MARKETPLACE_NOTIFICATIONS_PROVIDER", string | undefined>>
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
  }

  return {
    enabled,
    ready: enabled && reasons.length === 0,
    reasons
  };
}
