import { describe, expect, it } from "vitest";
import {
  summarizeOperationsIssueEvents,
  type OperationsIssueEventItem
} from "@/server/repositories/operations-issue.repository";

function issue(overrides: Partial<OperationsIssueEventItem>): OperationsIssueEventItem {
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
    firstSeenAt: "2026-05-29T00:00:00.000Z",
    lastSeenAt: "2026-05-29T02:00:00.000Z",
    resolvedAt: null,
    metadata: {},
    createdAt: "2026-05-29T00:00:00.000Z",
    updatedAt: "2026-05-29T02:00:00.000Z",
    ...overrides
  };
}

describe("operations issue repository helpers", () => {
  it("summarizes open operations issues by status and severity", () => {
    expect(summarizeOperationsIssueEvents([
      issue({ id: "issue-1", status: "open", severity: "warning", updatedAt: "2026-05-29T02:00:00.000Z" }),
      issue({ id: "issue-2", status: "open", severity: "blocker", updatedAt: "2026-05-29T03:00:00.000Z" }),
      issue({ id: "issue-3", status: "resolved", severity: "warning", updatedAt: "2026-05-29T01:00:00.000Z" }),
      issue({ id: "issue-4", status: "ignored", severity: "info", updatedAt: "2026-05-29T00:30:00.000Z" })
    ])).toEqual({
      total: 4,
      open: 2,
      resolved: 1,
      ignored: 1,
      blocker: 1,
      warning: 1,
      latestIssueAt: "2026-05-29T03:00:00.000Z"
    });
  });
});
