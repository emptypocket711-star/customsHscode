import { describe, expect, it, vi } from "vitest";
import {
  claimMarketplaceNotificationDelivery,
  createMarketplaceNotificationDeliveryKey,
  listMarketplaceNotificationInbox,
  markMarketplaceNotificationDeliveryRead,
  markMarketplaceNotificationDeliveryFailed,
  markMarketplaceNotificationDeliverySent
} from "@/server/repositories/marketplace-notification-deliveries.repository";

describe("marketplace notification delivery repository", () => {
  it("builds stable per-kind delivery keys", () => {
    expect(createMarketplaceNotificationDeliveryKey({
      deliveryWindow: "2026-06-01",
      matchId: "match-1",
      notificationKind: "deadline_reminder",
      partnerCompanyId: "partner-1",
      requestId: "request-1"
    })).toBe("marketplace:deadline_reminder:match-1:2026-06-01");
  });

  it("uses canonical digest delivery keys by partner and window", () => {
    expect(createMarketplaceNotificationDeliveryKey({
      deliveryWindow: "2026-06-01",
      notificationKind: "digest",
      partnerCompanyId: "partner-1",
      requestId: "request-1"
    })).toBe("marketplace:digest:partner-1:2026-06-01");
  });

  it("returns null when a delivery has already been claimed", async () => {
    const supabase = {
      rpc: vi.fn(),
      from: vi.fn(() => ({
        insert: () => ({
          select: () => ({
            single: async () => ({
              data: null,
              error: { code: "23505", message: "duplicate key" }
            })
          })
        })
      }))
    };

    await expect(claimMarketplaceNotificationDelivery(supabase as never, {
      channel: "in_app",
      notificationKind: "initial",
      partnerCompanyId: "partner-1",
      reason: "matched_request_open",
      requestId: "request-1",
      requestType: "freight"
    })).resolves.toBeNull();
  });

  it("uses the claim RPC when a match id is available", async () => {
    const supabase = {
      rpc: vi.fn(async () => ({ data: "delivery-1", error: null }))
    };

    await expect(claimMarketplaceNotificationDelivery(supabase as never, {
      channel: "in_app",
      matchId: "match-1",
      metadata: { invoiceText: "secret invoice", requestCount: 1 },
      notificationKind: "initial",
      partnerCompanyId: "partner-1",
      reason: "matched_request_open",
      requestId: "request-1",
      requestType: "freight"
    })).resolves.toBe("delivery-1");

    expect(supabase.rpc).toHaveBeenCalledWith("claim_marketplace_notification_delivery", expect.objectContaining({
      p_match_id: "match-1",
      p_metadata: {
        requestCount: 1,
        requestType: "freight"
      }
    }));
  });

  it("claims a delivery with redacted metadata", async () => {
    const insertedRows: Array<Record<string, unknown>> = [];
    const supabase = {
      rpc: vi.fn(),
      from: vi.fn(() => ({
        insert: (row: Record<string, unknown>) => {
          insertedRows.push(row);
          return {
            select: () => ({
              single: async () => ({
                data: { id: "delivery-1" },
                error: null
              })
            })
          };
        }
      }))
    };

    const deliveryId = await claimMarketplaceNotificationDelivery(supabase as never, {
      channel: "email",
      deliveryWindow: "2026-06-01",
      digestKey: "marketplace:digest:partner-1:2026-06-01",
      metadata: { invoiceText: "secret invoice", requestCount: 1 },
      notificationKind: "digest",
      partnerCompanyId: "partner-1",
      reason: "digest_matched_requests_open",
      requestId: "request-1",
      requestType: "clearance"
    });

    expect(deliveryId).toBe("delivery-1");
    expect(insertedRows[0]).toMatchObject({
      channel: "email",
      delivery_key: "marketplace:digest:partner-1:2026-06-01",
      notification_kind: "digest",
      status: "claimed"
    });
    expect(JSON.stringify(insertedRows[0])).not.toContain("invoice");
  });

  it("lists in-app inbox deliveries with request summary fields only", async () => {
    const calls: Array<[string, unknown]> = [];
    const selectedColumns: string[] = [];
    const supabase = {
      from: vi.fn((table: string) => {
        calls.push(["from", table]);
        return {
          select: (columns: string) => {
            selectedColumns.push(columns);
            return {
              eq: (column: string, value: string) => {
                calls.push(["eq", { column, value }]);
                return {
                  in: (nextColumn: string, values: string[]) => {
                    calls.push(["in", { column: nextColumn, values }]);
                    return {
                      order: (orderColumn: string, options: { ascending: boolean }) => {
                        calls.push(["order", { column: orderColumn, options }]);
                        return {
                          limit: async (limit: number) => {
                            calls.push(["limit", limit]);
                            return {
                              data: [{
                                channel: "in_app",
                                claimed_at: "2026-06-01T01:00:00.000Z",
                                created_at: "2026-06-01T00:00:00.000Z",
                                id: "delivery-1",
                                notification_kind: "initial",
                                read_at: null,
                                reason: "matched_request_open",
                                request_id: "request-1",
                                sent_at: null,
                                service_requests: {
                                  deadline_at: "2026-06-03T00:00:00.000Z",
                                  request_type: "freight",
                                  status: "open",
                                  title: "부산항 수입 운송 견적"
                                },
                                status: "claimed"
                              }],
                              error: null
                            };
                          }
                        };
                      }
                    };
                  }
                };
              }
            };
          }
        };
      })
    };

    await expect(listMarketplaceNotificationInbox(supabase as never, { limit: 5 })).resolves.toEqual([{
      channel: "in_app",
      claimedAt: "2026-06-01T01:00:00.000Z",
      createdAt: "2026-06-01T00:00:00.000Z",
      deliveryId: "delivery-1",
      notificationKind: "initial",
      readAt: null,
      reason: "matched_request_open",
      requestDeadlineAt: "2026-06-03T00:00:00.000Z",
      requestId: "request-1",
      requestStatus: "open",
      requestTitle: "부산항 수입 운송 견적",
      requestType: "freight",
      sentAt: null,
      status: "claimed"
    }]);
    expect(calls).toContainEqual(["from", "marketplace_notification_deliveries"]);
    expect(calls).toContainEqual(["eq", { column: "channel", value: "in_app" }]);
    expect(calls).toContainEqual(["in", { column: "status", values: ["claimed", "sent"] }]);
    expect(calls).toContainEqual(["limit", 5]);
    expect(selectedColumns[0]).toContain("service_requests(title,request_type,status,deadline_at)");
    expect(selectedColumns[0]).not.toContain("description");
    expect(selectedColumns[0]).not.toContain("documents");
    expect(selectedColumns[0]).not.toContain("metadata");
  });

  it("marks an in-app delivery as read through the guarded RPC", async () => {
    const supabase = {
      rpc: vi.fn(async () => ({ data: "delivery-1", error: null }))
    };

    await expect(markMarketplaceNotificationDeliveryRead(supabase as never, "delivery-1")).resolves.toBe("delivery-1");
    expect(supabase.rpc).toHaveBeenCalledWith("mark_marketplace_notification_delivery_read", {
      p_delivery_id: "delivery-1"
    });
  });

  it("marks claimed deliveries as sent or failed only from claimed state", async () => {
    const updates: Array<Record<string, unknown>> = [];
    const eqCalls: Array<[string, string]> = [];
    const supabase = {
      from: vi.fn(() => ({
        update: (row: Record<string, unknown>) => {
          updates.push(row);
          return {
            eq: (column: string, value: string) => {
              eqCalls.push([column, value]);
              return {
                eq: (nextColumn: string, nextValue: string) => {
                  eqCalls.push([nextColumn, nextValue]);
                  return {
                    select: () => ({
                      single: async () => ({ data: { id: "delivery" }, error: null })
                    })
                  };
                }
              };
            }
          };
        }
      }))
    };

    await markMarketplaceNotificationDeliverySent(supabase as never, {
      deliveryId: "delivery-1",
      providerId: "provider-1"
    });
    await markMarketplaceNotificationDeliveryFailed(supabase as never, {
      deliveryId: "delivery-2",
      errorMessage: "timeout while sending invoice payload"
    });
    await markMarketplaceNotificationDeliveryFailed(supabase as never, {
      deliveryId: "delivery-3",
      errorMessage: "recipient_missing"
    });

    expect(updates[0]).toMatchObject({ provider_id: "provider-1", status: "sent" });
    expect(updates[1]).toMatchObject({ error_message: "provider_timeout", status: "retryable_failed" });
    expect(updates[2]).toMatchObject({ error_message: "provider_recipient_missing", status: "retryable_failed" });
    expect(eqCalls).toContainEqual(["status", "claimed"]);
  });

  it("throws when a claimed delivery transition does not update a row", async () => {
    const supabase = {
      from: vi.fn(() => ({
        update: () => ({
          eq: () => ({
            eq: () => ({
              select: () => ({
                single: async () => ({ data: null, error: { message: "No rows" } })
              })
            })
          })
        })
      }))
    };

    await expect(markMarketplaceNotificationDeliverySent(supabase as never, {
      deliveryId: "missing"
    })).rejects.toThrow("No rows");
  });
});
