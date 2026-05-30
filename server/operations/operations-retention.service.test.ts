import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanupBackgroundJobHistory,
  cleanupOperationsAlertEvents,
  cleanupOperationsIssueEvents,
  cleanupOperationsRetention,
  getBackgroundJobHistoryRetentionDays,
  getOperationsAlertRetentionDays,
  getOperationsIssueRetentionDays,
  getOperationsRetentionStatus
} from "@/server/operations/operations-retention.service";

function createCountBuilder(count: number) {
  return {
    select: vi.fn().mockReturnThis(),
    lt: vi.fn().mockResolvedValue({ count, error: null }),
    in: vi.fn().mockReturnThis()
  };
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("operations retention service", () => {
  it("defaults alert event retention to 90 days", () => {
    expect(getOperationsAlertRetentionDays()).toBe(90);
  });

  it("defaults background job history retention to 90 days", () => {
    expect(getBackgroundJobHistoryRetentionDays()).toBe(90);
  });

  it("defaults operations issue retention to 180 days", () => {
    expect(getOperationsIssueRetentionDays()).toBe(180);
  });

  it("reads a positive integer retention period from the environment", () => {
    vi.stubEnv("OPERATIONS_ALERT_RETENTION_DAYS", "45.9");
    vi.stubEnv("BACKGROUND_JOB_HISTORY_RETENTION_DAYS", "60.9");
    vi.stubEnv("OPERATIONS_ISSUE_RETENTION_DAYS", "120.9");

    expect(getOperationsAlertRetentionDays()).toBe(45);
    expect(getBackgroundJobHistoryRetentionDays()).toBe(60);
    expect(getOperationsIssueRetentionDays()).toBe(120);
  });

  it("falls back to the default for invalid retention values", () => {
    vi.stubEnv("OPERATIONS_ALERT_RETENTION_DAYS", "0");
    expect(getOperationsAlertRetentionDays()).toBe(90);

    vi.stubEnv("OPERATIONS_ALERT_RETENTION_DAYS", "not-a-number");
    expect(getOperationsAlertRetentionDays()).toBe(90);

    vi.stubEnv("BACKGROUND_JOB_HISTORY_RETENTION_DAYS", "-1");
    expect(getBackgroundJobHistoryRetentionDays()).toBe(90);

    vi.stubEnv("OPERATIONS_ISSUE_RETENTION_DAYS", "not-a-number");
    expect(getOperationsIssueRetentionDays()).toBe(180);
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

  it("calls the background job history cleanup RPC and maps delete counts", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: { deletedRuns: 4, deletedJobs: 2 },
      error: null
    });
    const supabase = { rpc };

    await expect(cleanupBackgroundJobHistory(supabase as never, { retentionDays: 60 })).resolves.toEqual({
      retentionDays: 60,
      deletedRuns: 4,
      deletedJobs: 2
    });

    expect(rpc).toHaveBeenCalledWith("cleanup_background_job_history", {
      p_retention_days: 60
    });
  });

  it("calls the operations issue cleanup RPC and returns the deleted count", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: 6, error: null });
    const supabase = { rpc };

    await expect(cleanupOperationsIssueEvents(supabase as never, { retentionDays: 120 })).resolves.toEqual({
      retentionDays: 120,
      deletedCount: 6
    });

    expect(rpc).toHaveBeenCalledWith("cleanup_operations_issue_events", {
      p_retention_days: 120
    });
  });

  it("runs all operations retention cleanups with separate retention periods", async () => {
    const rpc = vi.fn()
      .mockResolvedValueOnce({ data: 3, error: null })
      .mockResolvedValueOnce({ data: { deletedRuns: 5, deletedJobs: 1 }, error: null })
      .mockResolvedValueOnce({ data: 2, error: null });
    const supabase = { rpc };

    await expect(cleanupOperationsRetention(supabase as never, {
      operationsAlertRetentionDays: 30,
      backgroundJobHistoryRetentionDays: 45,
      operationsIssueRetentionDays: 120
    })).resolves.toEqual({
      operationsAlertEvents: {
        retentionDays: 30,
        deletedCount: 3
      },
      backgroundJobHistory: {
        retentionDays: 45,
        deletedRuns: 5,
        deletedJobs: 1
      },
      operationsIssueEvents: {
        retentionDays: 120,
        deletedCount: 2
      }
    });
  });

  it("reports retention status with configured cutoffs and prune candidates", async () => {
    vi.stubEnv("OPERATIONS_ALERT_RETENTION_DAYS", "30");
    vi.stubEnv("BACKGROUND_JOB_HISTORY_RETENTION_DAYS", "45");
    vi.stubEnv("OPERATIONS_ISSUE_RETENTION_DAYS", "120");
    const alertEvents = createCountBuilder(2);
    const jobRuns = createCountBuilder(3);
    const jobs = createCountBuilder(4);
    const issueEvents = createCountBuilder(5);
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "operations_alert_events") return alertEvents;
        if (table === "background_job_runs") return jobRuns;
        if (table === "background_jobs") return jobs;
        if (table === "operations_issue_events") return issueEvents;
        throw new Error(`Unexpected table ${table}`);
      })
    };

    await expect(getOperationsRetentionStatus(supabase as never, {
      now: new Date("2026-05-30T00:00:00.000Z")
    })).resolves.toEqual({
      checkedAt: "2026-05-30T00:00:00.000Z",
      operationsAlertEvents: {
        retentionDays: 30,
        cutoffAt: "2026-04-30T00:00:00.000Z",
        pruneCandidateCount: 2
      },
      backgroundJobHistory: {
        retentionDays: 45,
        cutoffAt: "2026-04-15T00:00:00.000Z",
        runPruneCandidateCount: 3,
        jobPruneCandidateCount: 4
      },
      operationsIssueEvents: {
        retentionDays: 120,
        cutoffAt: "2026-01-30T00:00:00.000Z",
        pruneCandidateCount: 5
      }
    });

    expect(jobs.in).toHaveBeenCalledWith("status", ["succeeded", "canceled", "dead"]);
    expect(issueEvents.in).toHaveBeenCalledWith("status", ["resolved", "ignored"]);
  });
});
