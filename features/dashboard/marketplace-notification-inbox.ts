import type {
  MarketplaceNotificationChannel,
  MarketplaceNotificationInboxItem
} from "@/server/repositories/marketplace-notification-deliveries.repository";

export function marketplaceNotificationRequestTypeLabel(requestType: MarketplaceNotificationInboxItem["requestType"]) {
  if (requestType === "freight") return "운송";
  if (requestType === "clearance") return "통관";
  return "요청";
}

export function marketplaceNotificationKindLabel(kind: MarketplaceNotificationInboxItem["notificationKind"]) {
  if (kind === "initial") return "새 요청";
  if (kind === "deadline_reminder") return "마감 임박";
  if (kind === "digest") return "요약";
  return "알림";
}

export function marketplaceNotificationStatusLabel(status: MarketplaceNotificationInboxItem["status"]) {
  if (status === "sent") return "안내 완료";
  if (status === "claimed") return "확인 필요";
  if (status === "retryable_failed") return "재시도 예정";
  if (status === "failed") return "발송 실패";
  if (status === "skipped") return "건너뜀";
  return "알림";
}

export function getMarketplaceNotificationHref(item: {
  channel: MarketplaceNotificationChannel;
  requestId: string;
  requestStatus?: MarketplaceNotificationInboxItem["requestStatus"];
  requestType: MarketplaceNotificationInboxItem["requestType"];
}) {
  const anchor = item.requestStatus === "completed"
    ? "#request-completion"
    : item.requestStatus === "partner_selected" || item.requestStatus === "in_progress"
      ? "#request-lifecycle"
      : "#opportunity-bid";
  if (item.requestType === "freight") return `/requests/freight/opportunities/${item.requestId}${anchor}`;
  if (item.requestType === "clearance") return `/requests/clearance/opportunities/${item.requestId}${anchor}`;
  return "/dashboard";
}
