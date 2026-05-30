import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanupOperationsAlertEvents,
  getOperationsAlertRetentionDays
} from "@/server/operations/operations-retention.service";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("operations retention service", () => {
  it("defaults alert event retention to 90 days", () => {
    expect(getOperationsAlertRetentionDays()).toBe(90);
  });

  it("reads a positive integer retention period from the environment", () => {
    vi.stubEnv("OPERATIONS_ALERT_RETENTION_DAYS", "45.9");

    expect(getOperationsAlertRetentionDays()).toBe(45);
  });

  it("falls back to the default for invalid retention values", () => {
    vi.stubEnv("OPERATIONS_ALERT_RETENTION_DAYS", "0");
    expect(getOperationsAlertRetentionDays()).toBe(90);

    vi.stubEnv("OPERATIONS_ALERT_RETENTION_DAYS", "not-a-number");
    expect(getOperationsAlertRetentionDays()).toBe(90);
  });

  it("calls the cleanup RPC and returns the deleted count", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: 7, error: null });
    const supabase = { rpc };

    await expect(cleanupOperationsAlertEvents(supabase as never, { retentionDays: 30 })).resolves.toEqual({
      retentionDays: 30,
      deletedCount: 7
    });

    expect(rpc).toHaveBeenCalledWith("cleanup_operations_alert_events", {
      p_retention_days: 30
    });
  });

  it("surfaces cleanup RPC errors", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: "retention failed" } });
    const supabase = { rpc };

    await expect(cleanupOperationsAlertEvents(supabase as never, { retentionDays: 30 }))
      .rejects
      .toThrow("retention failed");
  });
});
