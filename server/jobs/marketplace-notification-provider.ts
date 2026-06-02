import type {
  MarketplaceNotificationSendInput,
  MarketplaceNotificationSender
} from "@/server/jobs/marketplace-notification-worker.service";

export const marketplaceNotificationProviderNames = ["internal_dry_run"] as const;
export type MarketplaceNotificationProviderName = typeof marketplaceNotificationProviderNames[number];

export function createMarketplaceNotificationProvider(
  provider: string | undefined
): MarketplaceNotificationSender | null {
  if (provider !== marketplaceNotificationProviderNames[0]) return null;

  return async (input: MarketplaceNotificationSendInput) => ({
    providerId: `internal_dry_run:${input.target.notificationKind}:${input.deliveryId}`
  });
}
