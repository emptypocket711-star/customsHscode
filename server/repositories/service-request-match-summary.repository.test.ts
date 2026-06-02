import { describe, expect, it, vi } from "vitest";
import {
  emptyServiceRequestMatchSummary,
  listServiceRequestMatchSummaries
} from "@/server/repositories/service-request-match-summary.repository";

function createSupabaseMock(data: unknown[] | null, error: { code?: string; message: string } | null = null) {
  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        in: vi.fn(async () => ({ data, error }))
      }))
    }))
  };
}

describe("service request match summary repository", () => {
  it("counts partner matches and notification states by request", async () => {
    const supabase = createSupabaseMock([
      { notification_status: "pending", request_id: "request-1" },
      { notification_status: "sent", request_id: "request-1" },
      { notification_status: "skipped", request_id: "request-1" },
      { notification_status: "failed", request_id: "request-2" }
    ]);

    const summaries = await listServiceRequestMatchSummaries(supabase as never, ["request-1", "request-2", "request-3"]);

    expect(summaries.get("request-1")).toEqual({
      failedNotificationCount: 0,
      matchedPartnerCount: 3,
      pendingNotificationCount: 1,
      sentNotificationCount: 1,
      skippedNotificationCount: 1
    });
    expect(summaries.get("request-2")).toEqual({
      failedNotificationCount: 1,
      matchedPartnerCount: 1,
      pendingNotificationCount: 0,
      sentNotificationCount: 0,
      skippedNotificationCount: 0
    });
    expect(summaries.get("request-3")).toEqual(emptyServiceRequestMatchSummary);
  });

  it("returns empty summaries when marketplace match schema is unavailable", async () => {
    const supabase = createSupabaseMock(null, { code: "42P01", message: "missing table" });

    const summaries = await listServiceRequestMatchSummaries(supabase as never, ["request-1"]);

    expect(summaries.get("request-1")).toEqual(emptyServiceRequestMatchSummary);
  });
});
