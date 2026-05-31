import { describe, expect, it } from "vitest";
import { summarizeProtectedJobEvents, type ProtectedJobEventItem } from "@/server/repositories/protected-job-event.repository";

function event(overrides: Partial<ProtectedJobEventItem>): ProtectedJobEventItem {
  return {
    createdAt: "2026-05-31T00:00:00.000Z",
    durationMs: 100,
    id: crypto.randomUUID(),
    jobName: "exchange-rates",
    message: null,
    metadata: {},
    route: "/api/jobs/exchange-rates",
    status: "succeeded",
    ...overrides
  };
}

describe("protected job event repository helpers", () => {
  it("summarizes job failures by job route", () => {
    const summary = summarizeProtectedJobEvents([
      event({ status: "failed", createdAt: "2026-05-31T00:01:00.000Z", message: "API012 failed" }),
      event({ status: "failed", createdAt: "2026-05-31T00:02:00.000Z", message: "API012 failed" }),
      event({ status: "succeeded", createdAt: "2026-05-31T00:03:00.000Z" })
    ]);

    expect(summary.status).toBe("watch");
    expect(summary.failed).toBe(2);
    expect(summary.jobs[0]).toEqual({
      failed: 2,
      jobName: "exchange-rates",
      latestAt: "2026-05-31T00:03:00.000Z",
      latestStatus: "succeeded",
      route: "/api/jobs/exchange-rates",
      succeeded: 1,
      total: 3
    });
  });

  it("marks repeated failures as action needed", () => {
    expect(summarizeProtectedJobEvents([
      event({ status: "failed" }),
      event({ status: "failed" }),
      event({ status: "failed" })
    ]).status).toBe("action_needed");
  });
});
