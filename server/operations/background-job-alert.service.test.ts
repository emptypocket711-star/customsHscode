import { afterEach, describe, expect, it, vi } from "vitest";

const { sendTransactionalEmailMock } = vi.hoisted(() => ({
  sendTransactionalEmailMock: vi.fn()
}));

vi.mock("@/server/notifications/email", () => ({
  sendTransactionalEmail: sendTransactionalEmailMock
}));

import {
  buildBackgroundJobFailureEmail,
  getOperationsAlertEmail,
  sendBackgroundJobFailureAlert
} from "@/server/operations/background-job-alert.service";

afterEach(() => {
  vi.unstubAllEnvs();
  sendTransactionalEmailMock.mockReset();
});

describe("background job failure alerts", () => {
  it("builds a redacted worker failure email with job ids and reasons", () => {
    const email = buildBackgroundJobFailureEmail({
      workerId: "api-worker-test",
      claimedCount: 2,
      succeededCount: 1,
      failedCount: 1,
      durationMs: 1200,
      outcomes: [
        { jobId: "00000000-0000-0000-0000-000000000001", status: "succeeded" },
        { jobId: "00000000-0000-0000-0000-000000000002", status: "failed", reason: "missing_handler" }
      ]
    });

    expect(email.subject).toContain("백그라운드 worker 실패 1건");
    expect(email.text).toContain("api-worker-test");
    expect(email.text).toContain("00000000-0000-0000-0000-000000000002");
    expect(email.text).toContain("missing_handler");
    expect(email.text).not.toContain("payload");
    expect(email.text).not.toContain("invoice");
  });

  it("prefers operations alert email over legacy developer alert email", () => {
    vi.stubEnv("OPERATIONS_ALERT_EMAIL", "ops@example.test");
    vi.stubEnv("DEVELOPER_ALERT_EMAIL", "dev@example.test");

    expect(getOperationsAlertEmail()).toBe("ops@example.test");
  });

  it("skips email when there is no failure", async () => {
    const result = await sendBackgroundJobFailureAlert({
      workerId: "api-worker-test",
      claimedCount: 0,
      succeededCount: 0,
      failedCount: 0,
      durationMs: 100,
      outcomes: []
    });

    expect(result).toEqual({ sent: false, reason: "no_failure" });
    expect(sendTransactionalEmailMock).not.toHaveBeenCalled();
  });

  it("sends an alert when a recipient is configured", async () => {
    vi.stubEnv("OPERATIONS_ALERT_EMAIL", "ops@example.test");
    sendTransactionalEmailMock.mockResolvedValueOnce({ sent: true, providerId: "email-1" });

    const result = await sendBackgroundJobFailureAlert({
      workerId: "api-worker-test",
      claimedCount: 1,
      succeededCount: 0,
      failedCount: 1,
      durationMs: 250,
      outcomes: [{ jobId: "00000000-0000-0000-0000-000000000002", status: "failed", reason: "dead" }]
    });

    expect(result).toEqual({ sent: true, providerId: "email-1" });
    expect(sendTransactionalEmailMock).toHaveBeenCalledWith(expect.objectContaining({
      to: "ops@example.test",
      subject: expect.stringContaining("백그라운드 worker 실패")
    }));
  });
});
