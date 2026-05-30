import { describe, expect, it } from "vitest";
import {
  filterOperationsIssueEvents,
  summarizeOpenOperationsIssuesByOwner,
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
    assignedToLabel: null,
    operatorNote: null,
    resolutionReason: null,
    statusUpdatedBy: null,
    statusUpdatedAt: null,
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

  it("filters operations issues by status, severity, owner, and text query", () => {
    const events = [
      issue({
        id: "issue-1",
        status: "open",
        severity: "warning",
        assignedToLabel: "김운영",
        operatorNote: "GPT 단계 확인 중",
        resolutionReason: null
      }),
      issue({
        id: "issue-2",
        status: "resolved",
        severity: "blocker",
        title: "반복 조회 품질 이슈: 후보 없음",
        issueKey: "lookup_quality_recurring:no_candidates",
        assignedToLabel: "박검토",
        operatorNote: "후보 생성 경로 수정 완료",
        resolutionReason: "후보 fallback 보강"
      }),
      issue({
        id: "issue-3",
        status: "ignored",
        severity: "info",
        title: "반복 조회 품질 이슈: 테스트",
        assignedToLabel: null,
        operatorNote: null,
        resolutionReason: "리허설 데이터"
      })
    ];

    expect(filterOperationsIssueEvents(events, {
      status: "resolved",
      severity: "blocker",
      assignedToLabel: "박",
      query: "fallback"
    }).map((event) => event.id)).toEqual(["issue-2"]);
  });

  it("summarizes open operations issues by owner workload", () => {
    const rows = summarizeOpenOperationsIssuesByOwner([
      issue({
        id: "issue-1",
        status: "open",
        severity: "warning",
        assignedToLabel: "김운영",
        firstSeenAt: "2026-05-27T00:00:00.000Z",
        updatedAt: "2026-05-29T02:00:00.000Z"
      }),
      issue({
        id: "issue-2",
        status: "open",
        severity: "blocker",
        assignedToLabel: "김운영",
        firstSeenAt: "2026-05-28T00:00:00.000Z",
        updatedAt: "2026-05-29T03:00:00.000Z"
      }),
      issue({
        id: "issue-3",
        status: "open",
        severity: "warning",
        assignedToLabel: null,
        firstSeenAt: "2026-05-26T00:00:00.000Z",
        updatedAt: "2026-05-29T01:00:00.000Z"
      }),
      issue({
        id: "issue-4",
        status: "resolved",
        severity: "blocker",
        assignedToLabel: "박검토"
      })
    ], new Date("2026-05-30T00:00:00.000Z"));

    expect(rows).toEqual([
      {
        assignedToLabel: "김운영",
        open: 2,
        blocker: 1,
        warning: 1,
        oldestOpenAt: "2026-05-27T00:00:00.000Z",
        oldestOpenAgeDays: 3,
        latestIssueAt: "2026-05-29T03:00:00.000Z"
      },
      {
        assignedToLabel: "미지정",
        open: 1,
        blocker: 0,
        warning: 1,
        oldestOpenAt: "2026-05-26T00:00:00.000Z",
        oldestOpenAgeDays: 4,
        latestIssueAt: "2026-05-29T01:00:00.000Z"
      }
    ]);
  });
});
