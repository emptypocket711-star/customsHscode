import { afterEach, describe, expect, it, vi } from "vitest";
import type { OperationsIssueEventItem } from "@/server/repositories/operations-issue.repository";

const { sendTransactionalEmailMock } = vi.hoisted(() => ({
  sendTransactionalEmailMock: vi.fn()
}));

vi.mock("@/server/notifications/email", () => ({
  sendTransactionalEmail: sendTransactionalEmailMock
}));

import {
  buildOperationsIssueEmail,
  getOperationsIssueAlertKey,
  sendOperationsIssueAlert
} from "@/server/operations/operations-issue-alert.service";

function issue(overrides: Partial<OperationsIssueEventItem> = {}): OperationsIssueEventItem {
  return {
    id: "issue-1",
    issueType: "lookup_quality_recurring",
    issueKey: "lookup_quality_recurring:gpt",
    status: "open",
    severity: "warning",
    source: "lookup_telemetry_events",
    title: "반복 조회 품질 이슈: GPT 단계",
    summary: "GPT 단계 분류가 최근 조회 품질 로그에서 3건 반복되었습니다.",
    action: "GPT 호출 실패, 후보 없음, 후처리 소실 여부를 묶어서 확인합니다.",
    occurrenceCount: 3,
    firstSeenAt: "2026-05-30T00:00:00.000Z",
    lastSeenAt: "2026-05-30T00:02:00.000Z",
    resolvedAt: null,
    assignedToLabel: null,
    operatorNote: null,
    resolutionReason: null,
    statusUpdatedBy: null,
    statusUpdatedAt: null,
    metadata: {},
    createdAt: "2026-05-30T00:00:00.000Z",
    updatedAt: "2026-05-30T00:02:00.000Z",
    ...overrides
  };
}

function createSupabaseMock(recentSentAlert: boolean) {
  const insert = vi.fn().mockResolvedValue({ error: null });
  const query = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data: recentSentAlert ? [{ id: "alert-1" }] : [], error: null })
  };
  const supabase = {
    from: vi.fn((table: string) => {
      if (table === "operations_alert_events") {
        return {
          ...query,
          insert
        };
      }
      throw new Error(`Unexpected table ${table}`);
    })
  };

  return { supabase, insert, query };
}

afterEach(() => {
  vi.unstubAllEnvs();
  sendTransactionalEmailMock.mockReset();
});

describe("operations issue alerts", () => {
  it("builds a redacted operations issue email", () => {
    const email = buildOperationsIssueEmail(issue());

    expect(email.subject).toContain("운영 이슈 미해결");
    expect(email.text).toContain("lookup_quality_recurring:gpt");
    expect(email.text).toContain("occurrenceCount: 3");
    expect(email.text).not.toContain("productName");
    expect(email.text).not.toContain("invoice");
  });

  it("uses a hashed alert key for operations issues", () => {
    const alertKey = getOperationsIssueAlertKey(issue());

    expect(alertKey).toMatch(/^operations_issue_open:[a-f0-9]{16}$/);
    expect(alertKey).not.toContain("lookup_quality_recurring:gpt");
  });

  it("skips non-open issues", async () => {
    const result = await sendOperationsIssueAlert(issue({ status: "resolved" }));

    expect(result).toMatchObject({ sent: false, reason: "not_open" });
    expect(sendTransactionalEmailMock).not.toHaveBeenCalled();
  });

  it("records skipped alert when recipient is not configured", async () => {
    const { supabase, insert } = createSupabaseMock(false);

    const result = await sendOperationsIssueAlert(issue(), {
      supabase: supabase as never
    });

    expect(result).toMatchObject({ sent: false, reason: "not_configured" });
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({
      alert_type: "operations_issue_open",
      status: "skipped",
      reason: "not_configured"
    }));
  });

  it("sends and records an operations issue alert", async () => {
    vi.stubEnv("OPERATIONS_ALERT_EMAIL", "ops@example.test");
    sendTransactionalEmailMock.mockResolvedValueOnce({ sent: true, providerId: "email-issue-1" });
    const { supabase, insert } = createSupabaseMock(false);

    const result = await sendOperationsIssueAlert(issue(), {
      supabase: supabase as never,
      throttleWindowMs: 30 * 60 * 1000
    });

    expect(result).toMatchObject({ sent: true, providerId: "email-issue-1" });
    expect(sendTransactionalEmailMock).toHaveBeenCalledWith(expect.objectContaining({
      to: "ops@example.test",
      subject: expect.stringContaining("운영 이슈 미해결")
    }));
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({
      alert_type: "operations_issue_open",
      status: "sent",
      provider_id: "email-issue-1",
      recipient: "ops@example.test"
    }));
  });

  it("throttles duplicate operations issue alerts", async () => {
    vi.stubEnv("OPERATIONS_ALERT_EMAIL", "ops@example.test");
    const { supabase, insert } = createSupabaseMock(true);

    const result = await sendOperationsIssueAlert(issue(), {
      supabase: supabase as never,
      throttleWindowMs: 30 * 60 * 1000,
      now: new Date("2026-05-30T00:10:00.000Z")
    });

    expect(result).toMatchObject({ sent: false, reason: "throttled" });
    expect(sendTransactionalEmailMock).not.toHaveBeenCalled();
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({
      alert_type: "operations_issue_open",
      status: "skipped",
      reason: "throttled"
    }));
  });
});
