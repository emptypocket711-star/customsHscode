import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildMarketplaceDigestTargets,
  buildInitialMarketplaceNotificationTargets,
  buildMarketplaceDeadlineReminderTargets,
  type MarketplaceMatchNotificationInput,
  type MarketplaceDigestTarget,
  type MarketplaceNotificationTarget
} from "@/server/notifications/marketplace-notification-policy";
import {
  claimMarketplaceNotificationDelivery,
  markMarketplaceNotificationDeliveryFailed,
  markMarketplaceNotificationDeliverySent
} from "@/server/repositories/marketplace-notification-deliveries.repository";

type MarketplaceNotificationMatchRow = {
  id: string;
  interest_status: string;
  notification_status: "failed" | "pending" | "sent" | "skipped";
  partner_company_id: string;
  service_requests: {
    deadline_at: string | null;
    id: string;
    request_type: "clearance" | "freight";
    status: string;
  } | null;
};

type MarketplaceNotificationBidRow = {
  bidder_company_id: string;
  request_id: string;
  status: string;
};

type MarketplaceNotificationDeliveryRow = {
  match_id: string | null;
  notification_kind: "deadline_reminder" | "digest" | "initial";
};

type MarketplaceNotificationPreferenceRow = {
  company_id: string;
  digest_enabled: boolean | null;
  service_type: "clearance" | "freight";
};

type MarketplaceNotificationWorkerTarget = MarketplaceNotificationTarget | MarketplaceDigestTarget;

export type MarketplaceNotificationWorkerResult = {
  claimedCount: number;
  claimedWithoutSenderCount: number;
  digestTargetCount: number;
  dryRun: boolean;
  failedSendCount: number;
  initialTargetCount: number;
  reminderTargetCount: number;
  sentCount: number;
  skippedDuplicateCount: number;
  targetCount: number;
};

export type MarketplaceNotificationSendInput = {
  deliveryId: string;
  target: MarketplaceNotificationWorkerTarget;
};

export type MarketplaceNotificationSender = (
  input: MarketplaceNotificationSendInput
) => Promise<{ providerId?: string | null }>;

function mapMatches(
  matches: MarketplaceNotificationMatchRow[],
  bids: MarketplaceNotificationBidRow[],
  deliveries: MarketplaceNotificationDeliveryRow[],
  preferences: MarketplaceNotificationPreferenceRow[]
): MarketplaceMatchNotificationInput[] {
  const preferenceByCompanyAndType = new Map(preferences.map((preference) => [
    `${preference.company_id}:${preference.service_type}`,
    preference
  ]));

  return matches
    .filter((match) => match.service_requests)
    .map((match) => {
      const request = match.service_requests as NonNullable<MarketplaceNotificationMatchRow["service_requests"]>;
      const preference = preferenceByCompanyAndType.get(`${match.partner_company_id}:${request.request_type}`);
      const bid = bids.find((item) =>
        item.request_id === request.id &&
        item.bidder_company_id === match.partner_company_id
      );
      const deliveredNotificationKinds = deliveries
        .filter((delivery) => delivery.match_id === match.id)
        .map((delivery) => delivery.notification_kind)
        .filter((kind): kind is "deadline_reminder" | "initial" => kind === "deadline_reminder" || kind === "initial");

      return {
        bidStatus: bid?.status ?? null,
        bidderCompanyId: bid?.bidder_company_id ?? null,
        deliveredNotificationKinds,
        digestEnabled: Boolean(preference?.digest_enabled),
        interestStatus: match.interest_status,
        matchId: match.id,
        notificationEnabled: match.notification_status !== "skipped",
        notificationStatus: match.notification_status,
        partnerCompanyId: match.partner_company_id,
        requestDeadlineAt: request.deadline_at,
        requestId: request.id,
        requestStatus: request.status,
        requestType: request.request_type
      };
    });
}

export async function runMarketplaceNotificationWorker(
  supabase: SupabaseClient,
  input: {
    dryRun?: boolean;
    limit?: number;
    now?: Date;
    reminderWindowHours?: number;
    sender?: MarketplaceNotificationSender;
  } = {}
): Promise<MarketplaceNotificationWorkerResult> {
  const limit = input.limit ?? 50;
  const { data: matchRows, error: matchesError } = await supabase
    .from("service_request_partner_matches")
    .select("id,request_id,partner_company_id,interest_status,notification_status,service_requests(id,request_type,status,deadline_at)")
    .in("notification_status", ["pending", "sent", "skipped"])
    .order("created_at", { ascending: true })
    .limit(limit);

  if (matchesError) throw new Error(matchesError.message);

  const matches = (matchRows ?? []) as unknown as MarketplaceNotificationMatchRow[];
  const requestIds = matches
    .map((match) => match.service_requests?.id)
    .filter((id): id is string => typeof id === "string");
  const matchIds = matches.map((match) => match.id);
  const partnerCompanyIds = Array.from(new Set(matches.map((match) => match.partner_company_id)));

  const [
    { data: bidRows, error: bidsError },
    { data: deliveryRows, error: deliveriesError },
    { data: preferenceRows, error: preferencesError }
  ] = await Promise.all([
    requestIds.length
      ? supabase
        .from("service_bids")
        .select("request_id,bidder_company_id,status")
        .in("request_id", requestIds)
      : Promise.resolve({ data: [], error: null }),
    matchIds.length
      ? supabase
        .from("marketplace_notification_deliveries")
        .select("match_id,notification_kind")
        .in("match_id", matchIds)
        .in("status", ["claimed", "sent"])
      : Promise.resolve({ data: [], error: null }),
    partnerCompanyIds.length
      ? supabase
        .from("partner_service_preferences")
        .select("company_id,service_type,digest_enabled")
        .in("company_id", partnerCompanyIds)
      : Promise.resolve({ data: [], error: null })
  ]);

  if (bidsError) throw new Error(bidsError.message);
  if (deliveriesError) throw new Error(deliveriesError.message);
  if (preferencesError) throw new Error(preferencesError.message);

  const policyInput = mapMatches(
    matches,
    (bidRows ?? []) as MarketplaceNotificationBidRow[],
    (deliveryRows ?? []) as MarketplaceNotificationDeliveryRow[],
    (preferenceRows ?? []) as MarketplaceNotificationPreferenceRow[]
  );
  const initialTargets = buildInitialMarketplaceNotificationTargets(policyInput, { now: input.now });
  const reminderTargets = buildMarketplaceDeadlineReminderTargets(policyInput, {
    now: input.now,
    reminderWindowHours: input.reminderWindowHours
  });
  const digestTargets = buildMarketplaceDigestTargets(policyInput, { now: input.now });
  const targets: MarketplaceNotificationWorkerTarget[] = [...initialTargets, ...reminderTargets, ...digestTargets];

  if (input.dryRun) {
    return {
      claimedCount: 0,
      claimedWithoutSenderCount: 0,
      digestTargetCount: digestTargets.length,
      dryRun: true,
      failedSendCount: 0,
      initialTargetCount: initialTargets.length,
      reminderTargetCount: reminderTargets.length,
      sentCount: 0,
      skippedDuplicateCount: 0,
      targetCount: targets.length
    };
  }

  let claimedCount = 0;
  let claimedWithoutSenderCount = 0;
  let failedSendCount = 0;
  let sentCount = 0;
  let skippedDuplicateCount = 0;
  for (const target of targets) {
    const isDigest = target.notificationKind === "digest";
    const deliveryId = await claimMarketplaceNotificationDelivery(supabase, {
      channel: isDigest ? "digest" : "in_app",
      deliveryWindow: isDigest
        ? target.digestWindow
        : target.notificationKind === "deadline_reminder"
          ? target.requestId
          : null,
      digestKey: isDigest ? target.digestKey : null,
      matchId: isDigest ? null : target.matchId,
      metadata: {
        matchCount: isDigest ? target.matchIds.length : 1,
        requestCount: isDigest ? target.requestCount : 1
      },
      notificationKind: target.notificationKind,
      partnerCompanyId: target.partnerCompanyId,
      reason: target.reason,
      requestId: isDigest ? target.requestIds[0] : target.requestId,
      requestType: isDigest ? target.requestTypes[0] : target.requestType
    });

    if (deliveryId) {
      claimedCount += 1;
      if (input.sender) {
        try {
          const sendResult = await input.sender({ deliveryId, target });
          await markMarketplaceNotificationDeliverySent(supabase, {
            deliveryId,
            providerId: sendResult.providerId ?? null
          });
          sentCount += 1;
        } catch (error) {
          const message = error instanceof Error ? error.message : "marketplace notification sender failed";
          await markMarketplaceNotificationDeliveryFailed(supabase, {
            deliveryId,
            errorMessage: message
          });
          failedSendCount += 1;
        }
      } else {
        claimedWithoutSenderCount += 1;
      }
    } else {
      skippedDuplicateCount += 1;
    }
  }

  return {
    claimedCount,
    claimedWithoutSenderCount,
    digestTargetCount: digestTargets.length,
    dryRun: false,
    failedSendCount,
    initialTargetCount: initialTargets.length,
    reminderTargetCount: reminderTargets.length,
    sentCount,
    skippedDuplicateCount,
    targetCount: targets.length
  };
}
