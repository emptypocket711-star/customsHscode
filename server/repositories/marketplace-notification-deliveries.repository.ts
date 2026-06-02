import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  MarketplaceNotificationKind,
  MarketplaceServiceType
} from "@/server/notifications/marketplace-notification-policy";

export type MarketplaceNotificationChannel = "digest" | "email" | "in_app";

export type MarketplaceNotificationDeliveryClaimInput = {
  channel: MarketplaceNotificationChannel;
  digestKey?: string | null;
  deliveryWindow?: string | null;
  matchId?: string | null;
  metadata?: Record<string, unknown>;
  notificationKind: MarketplaceNotificationKind | "digest";
  partnerCompanyId: string;
  reason: string;
  requestId: string;
  requestType: MarketplaceServiceType;
};

type MarketplaceNotificationInboxRow = {
  channel: MarketplaceNotificationChannel;
  claimed_at: string;
  created_at: string;
  id: string;
  notification_kind: MarketplaceNotificationKind | "digest";
  read_at: string | null;
  reason: string | null;
  request_id: string;
  status: "claimed" | "failed" | "retryable_failed" | "sent" | "skipped";
  service_requests: {
    deadline_at: string | null;
    request_type: MarketplaceServiceType;
    status: string;
    title: string;
  } | null;
  sent_at: string | null;
};

export type MarketplaceNotificationInboxItem = {
  channel: MarketplaceNotificationChannel;
  claimedAt: string;
  createdAt: string;
  deliveryId: string;
  notificationKind: MarketplaceNotificationKind | "digest";
  readAt: string | null;
  reason: string | null;
  requestDeadlineAt: string | null;
  requestId: string;
  requestStatus: string | null;
  requestTitle: string | null;
  requestType: MarketplaceServiceType | null;
  sentAt: string | null;
  status: "claimed" | "failed" | "retryable_failed" | "sent" | "skipped";
};

const allowedMetadataKeys = new Set(["matchCount", "requestCount", "requestType", "templateId"]);

function isUniqueViolation(error: { code?: string }) {
  return error.code === "23505";
}

export function createMarketplaceNotificationDeliveryKey(input: {
  digestKey?: string | null;
  deliveryWindow?: string | null;
  matchId?: string | null;
  notificationKind: MarketplaceNotificationKind | "digest";
  partnerCompanyId: string;
  requestId: string;
}) {
  if (input.notificationKind === "digest") {
    return input.digestKey ?? `marketplace:digest:${input.partnerCompanyId}:${input.deliveryWindow ?? "default"}`;
  }

  const scope = input.matchId ?? `${input.partnerCompanyId}:${input.requestId}`;
  const window = input.deliveryWindow ?? "once";
  return `marketplace:${input.notificationKind}:${scope}:${window}`;
}

function sanitizeDeliveryMetadata(metadata: Record<string, unknown> | undefined, requestType: MarketplaceServiceType) {
  const sanitized: Record<string, unknown> = {
    requestType
  };

  for (const [key, value] of Object.entries(metadata ?? {})) {
    if (allowedMetadataKeys.has(key)) {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

function sanitizeProviderError(message: string) {
  const normalized = message.trim().slice(0, 160).toLowerCase();
  if (!normalized) return "unknown";
  if (normalized.includes("timeout")) return "provider_timeout";
  if (normalized.includes("rate")) return "provider_rate_limited";
  if (normalized.includes("auth") || normalized.includes("key")) return "provider_auth_error";
  return "provider_send_failed";
}

function mapMarketplaceNotificationInboxRow(row: MarketplaceNotificationInboxRow): MarketplaceNotificationInboxItem {
  return {
    channel: row.channel,
    claimedAt: row.claimed_at,
    createdAt: row.created_at,
    deliveryId: row.id,
    notificationKind: row.notification_kind,
    readAt: row.read_at,
    reason: row.reason,
    requestDeadlineAt: row.service_requests?.deadline_at ?? null,
    requestId: row.request_id,
    requestStatus: row.service_requests?.status ?? null,
    requestTitle: row.service_requests?.title ?? null,
    requestType: row.service_requests?.request_type ?? null,
    sentAt: row.sent_at,
    status: row.status
  };
}

export async function listMarketplaceNotificationInbox(
  supabase: SupabaseClient,
  input: {
    limit?: number;
  } = {}
) {
  const limit = input.limit ?? 20;
  const { data, error } = await supabase
    .from("marketplace_notification_deliveries")
    .select("id,request_id,notification_kind,channel,status,reason,claimed_at,sent_at,read_at,created_at,service_requests(title,request_type,status,deadline_at)")
    .eq("channel", "in_app")
    .in("status", ["claimed", "sent"])
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  return ((data ?? []) as unknown as MarketplaceNotificationInboxRow[]).map(mapMarketplaceNotificationInboxRow);
}

export async function markMarketplaceNotificationDeliveryRead(
  supabase: SupabaseClient,
  deliveryId: string
) {
  const { data, error } = await supabase.rpc("mark_marketplace_notification_delivery_read", {
    p_delivery_id: deliveryId
  });

  if (error) throw new Error(error.message);

  return typeof data === "string" ? data : deliveryId;
}

export async function claimMarketplaceNotificationDelivery(
  supabase: SupabaseClient,
  input: MarketplaceNotificationDeliveryClaimInput
) {
  if (input.matchId) {
    const { data, error } = await supabase.rpc("claim_marketplace_notification_delivery", {
      p_channel: input.channel,
      p_delivery_window: input.deliveryWindow ?? null,
      p_match_id: input.matchId,
      p_metadata: sanitizeDeliveryMetadata(input.metadata, input.requestType),
      p_notification_kind: input.notificationKind,
      p_reason: input.reason
    });

    if (error) throw error;
    return typeof data === "string" ? data : null;
  }

  const deliveryKey = createMarketplaceNotificationDeliveryKey(input);
  const { data, error } = await supabase
    .from("marketplace_notification_deliveries")
    .insert({
      channel: input.channel,
      delivery_key: deliveryKey,
      delivery_window: input.deliveryWindow ?? null,
      match_id: input.matchId ?? null,
      metadata: sanitizeDeliveryMetadata(input.metadata, input.requestType),
      notification_kind: input.notificationKind,
      partner_company_id: input.partnerCompanyId,
      reason: input.reason,
      request_id: input.requestId,
      status: "claimed"
    })
    .select("id")
    .single();

  if (error) {
    if (isUniqueViolation(error)) return null;
    throw error;
  }

  return typeof data?.id === "string" ? data.id : null;
}

export async function markMarketplaceNotificationDeliverySent(
  supabase: SupabaseClient,
  input: {
    deliveryId: string;
    providerId?: string | null;
  }
) {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("marketplace_notification_deliveries")
    .update({
      provider_id: input.providerId ?? null,
      sent_at: now,
      status: "sent",
      updated_at: now
    })
    .eq("id", input.deliveryId)
    .eq("status", "claimed")
    .select("id")
    .single();

  if (error) throw error;
}

export async function markMarketplaceNotificationDeliveryFailed(
  supabase: SupabaseClient,
  input: {
    deliveryId: string;
    errorMessage: string;
    retryable?: boolean;
  }
) {
  const now = new Date().toISOString();
  const status = input.retryable === false ? "failed" : "retryable_failed";
  const { error } = await supabase
    .from("marketplace_notification_deliveries")
    .update({
      error_message: sanitizeProviderError(input.errorMessage),
      failed_at: now,
      status,
      updated_at: now
    })
    .eq("id", input.deliveryId)
    .eq("status", "claimed")
    .select("id")
    .single();

  if (error) throw error;
}
