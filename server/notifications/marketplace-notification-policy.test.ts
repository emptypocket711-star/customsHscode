import { describe, expect, it } from "vitest";
import {
  buildInitialMarketplaceNotificationTargets,
  buildMarketplaceDigestTargets,
  buildMarketplaceDeadlineReminderTargets,
  type MarketplaceMatchNotificationInput
} from "@/server/notifications/marketplace-notification-policy";

const now = new Date("2026-06-01T00:00:00.000Z");

function createMatch(overrides: Partial<MarketplaceMatchNotificationInput> = {}): MarketplaceMatchNotificationInput {
  return {
    digestEnabled: false,
    interestStatus: "none",
    matchId: "match-1",
    notificationEnabled: true,
    notificationStatus: "pending",
    partnerCompanyId: "partner-1",
    requestDeadlineAt: "2026-06-01T12:00:00.000Z",
    requestId: "request-1",
    requestStatus: "open",
    requestType: "freight",
    ...overrides
  };
}

describe("marketplace initial notification policy", () => {
  it("selects pending matched partners for one immediate notification", () => {
    const targets = buildInitialMarketplaceNotificationTargets([createMatch()], { now });

    expect(targets).toEqual([{
      matchId: "match-1",
      notificationKind: "initial",
      partnerCompanyId: "partner-1",
      reason: "matched_request_open",
      requestId: "request-1",
      requestType: "freight"
    }]);
  });

  it("skips digest, disabled, sent, declined, closed, and expired matches", () => {
    const targets = buildInitialMarketplaceNotificationTargets([
      createMatch({ digestEnabled: true, matchId: "digest" }),
      createMatch({ matchId: "disabled", notificationEnabled: false }),
      createMatch({ matchId: "sent", notificationStatus: "sent" }),
      createMatch({ interestStatus: "declined", matchId: "declined" }),
      createMatch({ matchId: "selected", requestStatus: "partner_selected" }),
      createMatch({ matchId: "expired", requestDeadlineAt: "2026-05-31T23:00:00.000Z" })
    ], { now });

    expect(targets).toEqual([]);
  });

  it("deduplicates repeated input rows and respects delivered initial state", () => {
    const targets = buildInitialMarketplaceNotificationTargets([
      createMatch({ matchId: "match-1" }),
      createMatch({ matchId: "match-1" }),
      createMatch({ deliveredNotificationKinds: ["initial"], matchId: "delivered" })
    ], { now });

    expect(targets).toHaveLength(1);
    expect(targets[0]?.matchId).toBe("match-1");
  });
});

describe("marketplace deadline reminder policy", () => {
  it("selects unbid matched partners inside the reminder window", () => {
    const targets = buildMarketplaceDeadlineReminderTargets([
      createMatch({
        interestStatus: "viewed",
        notificationStatus: "sent",
        requestDeadlineAt: "2026-06-01T03:00:00.000Z",
        requestType: "clearance"
      })
    ], {
      now,
      reminderWindowHours: 6
    });

    expect(targets).toEqual([{
      matchId: "match-1",
      notificationKind: "deadline_reminder",
      partnerCompanyId: "partner-1",
      reason: "deadline_near_without_active_bid",
      requestId: "request-1",
      requestType: "clearance"
    }]);
  });

  it("skips never-engaged partners, submitted bidders, and reminders outside the window", () => {
    const targets = buildMarketplaceDeadlineReminderTargets([
      createMatch({
        bidStatus: "submitted",
        bidderCompanyId: "partner-1",
        matchId: "bidder",
        requestDeadlineAt: "2026-06-01T03:00:00.000Z"
      }),
      createMatch({
        interestStatus: "none",
        matchId: "never-engaged",
        requestDeadlineAt: "2026-06-01T03:00:00.000Z"
      }),
      createMatch({
        matchId: "later",
        requestDeadlineAt: "2026-06-01T18:00:00.000Z"
      }),
      createMatch({
        interestStatus: "declined",
        matchId: "declined",
        requestDeadlineAt: "2026-06-01T03:00:00.000Z"
      }),
      createMatch({
        digestEnabled: true,
        matchId: "digest",
        requestDeadlineAt: "2026-06-01T03:00:00.000Z"
      })
    ], {
      now,
      reminderWindowHours: 6
    });

    expect(targets).toEqual([]);
  });

  it("does not suppress reminders for draft bids and skips delivered reminders", () => {
    const targets = buildMarketplaceDeadlineReminderTargets([
      createMatch({
        bidStatus: "draft",
        bidderCompanyId: "partner-1",
        interestStatus: "interested",
        matchId: "draft-bid",
        notificationStatus: "sent",
        requestDeadlineAt: "2026-06-01T03:00:00.000Z"
      }),
      createMatch({
        deliveredNotificationKinds: ["deadline_reminder"],
        interestStatus: "interested",
        matchId: "delivered",
        requestDeadlineAt: "2026-06-01T03:00:00.000Z"
      })
    ], {
      now,
      reminderWindowHours: 6
    });

    expect(targets).toHaveLength(1);
    expect(targets[0]?.matchId).toBe("draft-bid");
  });

  it("requires a sent initial notification before deadline reminders", () => {
    const targets = buildMarketplaceDeadlineReminderTargets([
      createMatch({
        interestStatus: "viewed",
        matchId: "pending-initial",
        notificationStatus: "pending",
        requestDeadlineAt: "2026-06-01T03:00:00.000Z"
      })
    ], {
      now,
      reminderWindowHours: 6
    });

    expect(targets).toEqual([]);
  });

  it("rejects invalid reminder windows", () => {
    expect(() =>
      buildMarketplaceDeadlineReminderTargets([createMatch()], {
        now,
        reminderWindowHours: 0
      })
    ).toThrow("reminderWindowHours");
  });
});

describe("marketplace digest notification policy", () => {
  it("groups digest-enabled matches by partner and digest window", () => {
    const targets = buildMarketplaceDigestTargets([
      createMatch({ digestEnabled: true, matchId: "match-1", requestId: "request-1", requestType: "freight" }),
      createMatch({ digestEnabled: true, matchId: "match-2", requestId: "request-2", requestType: "clearance" }),
      createMatch({ digestEnabled: true, matchId: "match-2", requestId: "request-2", requestType: "clearance" })
    ], {
      digestWindow: "2026-06-01",
      now
    });

    expect(targets).toEqual([{
      digestKey: "marketplace_digest:partner-1:2026-06-01",
      digestWindow: "2026-06-01",
      matchIds: ["match-1", "match-2"],
      notificationKind: "digest",
      partnerCompanyId: "partner-1",
      reason: "digest_matched_requests_open",
      requestCount: 2,
      requestIds: ["request-1", "request-2"],
      requestTypes: ["clearance", "freight"]
    }]);
  });

  it("skips digest targets that were already delivered as initial notifications", () => {
    const targets = buildMarketplaceDigestTargets([
      createMatch({
        deliveredNotificationKinds: ["initial"],
        digestEnabled: true,
        matchId: "delivered"
      })
    ], { now });

    expect(targets).toEqual([]);
  });
});
