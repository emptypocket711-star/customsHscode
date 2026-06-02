import { describe, expect, it, vi } from "vitest";
import { runMarketplaceNotificationWorker } from "@/server/jobs/marketplace-notification-worker.service";

function createQuery(data: unknown[] = []) {
  return {
    in: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data, error: null }),
    order: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis()
  };
}

describe("marketplace notification worker", () => {
  it("builds dry-run targets without claiming deliveries", async () => {
    const matchQuery = createQuery([{
      id: "match-1",
      interest_status: "none",
      notification_status: "pending",
      partner_company_id: "partner-1",
      service_requests: {
        deadline_at: "2026-06-01T12:00:00.000Z",
        id: "request-1",
        request_type: "freight",
        status: "open"
      }
    }]);
    const bidQuery = { in: vi.fn().mockResolvedValue({ data: [], error: null }), select: vi.fn().mockReturnThis() };
    const deliveryQuery = { in: vi.fn().mockReturnThis(), select: vi.fn().mockReturnThis() };
    deliveryQuery.in.mockReturnValueOnce(deliveryQuery).mockResolvedValueOnce({ data: [], error: null });

    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "service_request_partner_matches") return matchQuery;
        if (table === "service_bids") return bidQuery;
        if (table === "marketplace_notification_deliveries") return deliveryQuery;
        throw new Error(`unexpected table ${table}`);
      }),
      rpc: vi.fn()
    };

    const result = await runMarketplaceNotificationWorker(supabase as never, {
      dryRun: true,
      now: new Date("2026-06-01T00:00:00.000Z")
    });

    expect(result).toMatchObject({
      claimedCount: 0,
      claimedWithoutSenderCount: 0,
      dryRun: true,
      initialTargetCount: 1,
      targetCount: 1
    });
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it("claims eligible initial targets through the claim RPC", async () => {
    const matchQuery = createQuery([{
      id: "match-1",
      interest_status: "none",
      notification_status: "pending",
      partner_company_id: "partner-1",
      service_requests: {
        deadline_at: "2026-06-01T12:00:00.000Z",
        id: "request-1",
        request_type: "clearance",
        status: "open"
      }
    }]);
    const bidQuery = { in: vi.fn().mockResolvedValue({ data: [], error: null }), select: vi.fn().mockReturnThis() };
    const deliveryQuery = { in: vi.fn().mockReturnThis(), select: vi.fn().mockReturnThis() };
    deliveryQuery.in.mockReturnValueOnce(deliveryQuery).mockResolvedValueOnce({ data: [], error: null });

    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "service_request_partner_matches") return matchQuery;
        if (table === "service_bids") return bidQuery;
        if (table === "marketplace_notification_deliveries") return deliveryQuery;
        throw new Error(`unexpected table ${table}`);
      }),
      rpc: vi.fn().mockResolvedValue({ data: "delivery-1", error: null })
    };

    const result = await runMarketplaceNotificationWorker(supabase as never, {
      now: new Date("2026-06-01T00:00:00.000Z")
    });

    expect(result).toMatchObject({
      claimedCount: 1,
      claimedWithoutSenderCount: 1,
      dryRun: false,
      skippedDuplicateCount: 0,
      targetCount: 1
    });
    expect(supabase.rpc).toHaveBeenCalledWith("claim_marketplace_notification_delivery", expect.objectContaining({
      p_match_id: "match-1",
      p_notification_kind: "initial"
    }));
  });

  it("uses an injected sender after a delivery is claimed", async () => {
    const matchQuery = createQuery([{
      id: "match-1",
      interest_status: "none",
      notification_status: "pending",
      partner_company_id: "partner-1",
      service_requests: {
        deadline_at: "2026-06-01T12:00:00.000Z",
        id: "request-1",
        request_type: "freight",
        status: "open"
      }
    }]);
    const bidQuery = { in: vi.fn().mockResolvedValue({ data: [], error: null }), select: vi.fn().mockReturnThis() };
    const deliveryQuery = {
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: "delivery-1" }, error: null }),
      update: vi.fn().mockReturnThis()
    };
    deliveryQuery.in.mockReturnValueOnce(deliveryQuery).mockResolvedValueOnce({ data: [], error: null });
    const sender = vi.fn().mockResolvedValue({ providerId: "provider-1" });

    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "service_request_partner_matches") return matchQuery;
        if (table === "service_bids") return bidQuery;
        if (table === "marketplace_notification_deliveries") return deliveryQuery;
        throw new Error(`unexpected table ${table}`);
      }),
      rpc: vi.fn().mockResolvedValue({ data: "delivery-1", error: null })
    };

    const result = await runMarketplaceNotificationWorker(supabase as never, {
      now: new Date("2026-06-01T00:00:00.000Z"),
      sender
    });

    expect(result).toMatchObject({
      claimedCount: 1,
      claimedWithoutSenderCount: 0,
      failedSendCount: 0,
      sentCount: 1,
      targetCount: 1
    });
    expect(sender).toHaveBeenCalledWith({
      deliveryId: "delivery-1",
      target: expect.objectContaining({
        matchId: "match-1",
        notificationKind: "initial",
        requestId: "request-1"
      })
    });
    expect(deliveryQuery.update).toHaveBeenCalledWith(expect.objectContaining({
      provider_id: "provider-1",
      status: "sent"
    }));
  });

  it("marks a claimed delivery as failed when the injected sender fails", async () => {
    const matchQuery = createQuery([{
      id: "match-1",
      interest_status: "none",
      notification_status: "pending",
      partner_company_id: "partner-1",
      service_requests: {
        deadline_at: "2026-06-01T12:00:00.000Z",
        id: "request-1",
        request_type: "freight",
        status: "open"
      }
    }]);
    const bidQuery = { in: vi.fn().mockResolvedValue({ data: [], error: null }), select: vi.fn().mockReturnThis() };
    const deliveryQuery = {
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: "delivery-1" }, error: null }),
      update: vi.fn().mockReturnThis()
    };
    deliveryQuery.in.mockReturnValueOnce(deliveryQuery).mockResolvedValueOnce({ data: [], error: null });
    const sender = vi.fn().mockRejectedValue(new Error("provider timeout while sending"));

    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "service_request_partner_matches") return matchQuery;
        if (table === "service_bids") return bidQuery;
        if (table === "marketplace_notification_deliveries") return deliveryQuery;
        throw new Error(`unexpected table ${table}`);
      }),
      rpc: vi.fn().mockResolvedValue({ data: "delivery-1", error: null })
    };

    const result = await runMarketplaceNotificationWorker(supabase as never, {
      now: new Date("2026-06-01T00:00:00.000Z"),
      sender
    });

    expect(result).toMatchObject({
      claimedCount: 1,
      claimedWithoutSenderCount: 0,
      failedSendCount: 1,
      sentCount: 0,
      targetCount: 1
    });
    expect(deliveryQuery.update).toHaveBeenCalledWith(expect.objectContaining({
      error_message: "provider_timeout",
      status: "retryable_failed"
    }));
  });
});
