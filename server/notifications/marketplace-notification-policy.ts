export type MarketplaceServiceType = "clearance" | "freight";

export type MarketplaceMatchNotificationInput = {
  bidStatus?: string | null;
  bidderCompanyId?: string | null;
  deliveredNotificationKinds?: MarketplaceNotificationKind[];
  digestEnabled?: boolean;
  interestStatus: string;
  matchId: string;
  notificationEnabled: boolean;
  notificationStatus: "failed" | "pending" | "sent" | "skipped";
  partnerCompanyId: string;
  requestDeadlineAt: string | null;
  requestId: string;
  requestStatus: string;
  requestType: MarketplaceServiceType;
};

export type MarketplaceNotificationKind = "deadline_reminder" | "initial";

export type MarketplaceNotificationTarget = {
  matchId: string;
  notificationKind: MarketplaceNotificationKind;
  partnerCompanyId: string;
  reason: string;
  requestId: string;
  requestType: MarketplaceServiceType;
};

export type MarketplaceDigestTarget = {
  digestKey: string;
  digestWindow: string;
  matchIds: string[];
  notificationKind: "digest";
  partnerCompanyId: string;
  reason: string;
  requestCount: number;
  requestIds: string[];
  requestTypes: MarketplaceServiceType[];
};

export type MarketplaceNotificationPolicyOptions = {
  digestWindow?: string;
  now?: Date;
  reminderWindowHours?: number;
};

const biddableRequestStatuses = new Set(["open", "bids_received"]);
const reminderEligibleInterestStatuses = new Set(["viewed", "interested"]);
const submittedBidStatuses = new Set(["submitted", "shortlisted", "selected"]);

function parseDate(value: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getNow(options?: MarketplaceNotificationPolicyOptions) {
  return options?.now ?? new Date();
}

function getReminderWindowMs(options?: MarketplaceNotificationPolicyOptions) {
  const hours = options?.reminderWindowHours ?? 6;
  if (!Number.isFinite(hours) || hours <= 0 || hours > 48) {
    throw new Error("reminderWindowHours must be greater than 0 and no more than 48.");
  }
  return hours * 60 * 60 * 1000;
}

function isOpenForPartner(match: MarketplaceMatchNotificationInput, now: Date) {
  const deadline = parseDate(match.requestDeadlineAt);
  return (
    biddableRequestStatuses.has(match.requestStatus) &&
    deadline !== null &&
    deadline.getTime() > now.getTime()
  );
}

function hasSubmittedBid(match: MarketplaceMatchNotificationInput) {
  return (
    match.bidderCompanyId === match.partnerCompanyId &&
    typeof match.bidStatus === "string" &&
    submittedBidStatuses.has(match.bidStatus)
  );
}

function wasDelivered(match: MarketplaceMatchNotificationInput, kind: MarketplaceNotificationKind) {
  return match.deliveredNotificationKinds?.includes(kind) ?? false;
}

function uniqueTargets(targets: MarketplaceNotificationTarget[]) {
  const seen = new Set<string>();
  return targets.filter((target) => {
    const key = `${target.matchId}:${target.notificationKind}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getDigestWindow(options?: MarketplaceNotificationPolicyOptions) {
  return options?.digestWindow ?? getNow(options).toISOString().slice(0, 10);
}

export function buildInitialMarketplaceNotificationTargets(
  matches: MarketplaceMatchNotificationInput[],
  options?: MarketplaceNotificationPolicyOptions
): MarketplaceNotificationTarget[] {
  const now = getNow(options);

  return uniqueTargets(matches
    .filter((match) =>
      match.notificationEnabled &&
      !match.digestEnabled &&
      match.notificationStatus === "pending" &&
      match.interestStatus !== "declined" &&
      isOpenForPartner(match, now) &&
      !wasDelivered(match, "initial")
    )
    .map((match) => ({
      matchId: match.matchId,
      notificationKind: "initial" as const,
      partnerCompanyId: match.partnerCompanyId,
      reason: "matched_request_open",
      requestId: match.requestId,
      requestType: match.requestType
    })));
}

export function buildMarketplaceDeadlineReminderTargets(
  matches: MarketplaceMatchNotificationInput[],
  options?: MarketplaceNotificationPolicyOptions
): MarketplaceNotificationTarget[] {
  const now = getNow(options);
  const reminderWindowMs = getReminderWindowMs(options);

  return uniqueTargets(matches
    .filter((match) => {
      const deadline = parseDate(match.requestDeadlineAt);
      if (!deadline) return false;
      const msUntilDeadline = deadline.getTime() - now.getTime();

      return (
        match.notificationEnabled &&
        !match.digestEnabled &&
        match.notificationStatus === "sent" &&
        !wasDelivered(match, "deadline_reminder") &&
        reminderEligibleInterestStatuses.has(match.interestStatus) &&
        biddableRequestStatuses.has(match.requestStatus) &&
        msUntilDeadline > 0 &&
        msUntilDeadline <= reminderWindowMs &&
        !hasSubmittedBid(match)
      );
    })
    .map((match) => ({
      matchId: match.matchId,
      notificationKind: "deadline_reminder" as const,
      partnerCompanyId: match.partnerCompanyId,
      reason: "deadline_near_without_active_bid",
      requestId: match.requestId,
      requestType: match.requestType
    })));
}

export function buildMarketplaceDigestTargets(
  matches: MarketplaceMatchNotificationInput[],
  options?: MarketplaceNotificationPolicyOptions
): MarketplaceDigestTarget[] {
  const now = getNow(options);
  const digestWindow = getDigestWindow(options);
  const groups = new Map<string, MarketplaceMatchNotificationInput>();

  for (const match of matches) {
    if (
      !match.notificationEnabled ||
      !match.digestEnabled ||
      match.interestStatus === "declined" ||
      !isOpenForPartner(match, now) ||
      wasDelivered(match, "initial")
    ) {
      continue;
    }

    const key = `${match.partnerCompanyId}:${match.requestType}:${match.matchId}`;
    if (!groups.has(key)) {
      groups.set(key, match);
    }
  }

  const byPartner = new Map<string, MarketplaceMatchNotificationInput[]>();
  for (const match of groups.values()) {
    const key = `${match.partnerCompanyId}:${digestWindow}`;
    byPartner.set(key, [...(byPartner.get(key) ?? []), match]);
  }

  return Array.from(byPartner.entries()).map(([key, group]) => {
    const [partnerCompanyId] = key.split(":");
    const requestTypes = Array.from(new Set(group.map((match) => match.requestType))).sort() as MarketplaceServiceType[];

    return {
      digestKey: `marketplace_digest:${partnerCompanyId}:${digestWindow}`,
      digestWindow,
      matchIds: group.map((match) => match.matchId).sort(),
      notificationKind: "digest" as const,
      partnerCompanyId,
      reason: "digest_matched_requests_open",
      requestCount: group.length,
      requestIds: group.map((match) => match.requestId).sort(),
      requestTypes
    };
  });
}
