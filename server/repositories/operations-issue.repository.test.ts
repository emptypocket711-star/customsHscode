import { describe, expect, it } from "vitest";
import {
  buildOperationsIssueActiveFilterLabels,
  buildOperationsIssueQuickFilterPresets,
  buildOperationsIssueResultSummaryMetrics,
  filterOperationsIssueEvents,
  getOpenOperationsIssueAgeStatus,
  getOperationsIssueStatusChangeSummary,
  isUnassignedOperationsIssueOwnerFilter,
  operationsIssueFiltersMatch,
  sortOperationsIssueEventsForTriage,
  summarizeOpenOperationsIssuesByOwner,
  summarizeOperationsIssueResolutionOutcomes,
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

  it("filters operations issues by age level and unassigned owner preset", () => {
    const now = new Date("2026-05-30T00:00:00.000Z");
    const events = [
      issue({
        id: "stale-unassigned",
        status: "open",
        severity: "warning",
        assignedToLabel: null,
        firstSeenAt: "2026-05-20T00:00:00.000Z"
      }),
      issue({
        id: "stale-assigned",
        status: "open",
        severity: "warning",
        assignedToLabel: "김운영",
        firstSeenAt: "2026-05-20T00:00:00.000Z"
      }),
      issue({
        id: "watch-unassigned",
        status: "open",
        severity: "warning",
        assignedToLabel: null,
        firstSeenAt: "2026-05-27T00:00:00.000Z"
      })
    ];

    expect(filterOperationsIssueEvents(events, {
      status: "open",
      ageLevel: "stale",
      assignedToLabel: "미지정"
    }, now).map((event) => event.id)).toEqual(["stale-unassigned"]);
  });

  it("recognizes supported unassigned owner filter values", () => {
    expect(isUnassignedOperationsIssueOwnerFilter("미지정")).toBe(true);
    expect(isUnassignedOperationsIssueOwnerFilter(" __unassigned__ ")).toBe(true);
    expect(isUnassignedOperationsIssueOwnerFilter("김운영")).toBe(false);
    expect(isUnassignedOperationsIssueOwnerFilter(null)).toBe(false);
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

  it("classifies open operations issues by age", () => {
    const now = new Date("2026-05-30T00:00:00.000Z");

    expect(getOpenOperationsIssueAgeStatus(issue({
      status: "open",
      firstSeenAt: "2026-05-29T00:00:00.000Z"
    }), now)).toEqual({
      ageDays: 1,
      level: "normal",
      label: "열림 1일"
    });
    expect(getOpenOperationsIssueAgeStatus(issue({
      status: "open",
      firstSeenAt: "2026-05-27T00:00:00.000Z"
    }), now)).toEqual({
      ageDays: 3,
      level: "watch",
      label: "지연 확인 3일"
    });
    expect(getOpenOperationsIssueAgeStatus(issue({
      status: "open",
      firstSeenAt: "2026-05-20T00:00:00.000Z"
    }), now)).toEqual({
      ageDays: 10,
      level: "stale",
      label: "장기 미해결 10일"
    });
    expect(getOpenOperationsIssueAgeStatus(issue({
      status: "resolved",
      firstSeenAt: "2026-05-20T00:00:00.000Z"
    }), now)).toBeNull();
  });

  it("sorts operations issues by triage priority", () => {
    const now = new Date("2026-05-30T00:00:00.000Z");

    const sorted = sortOperationsIssueEventsForTriage([
      issue({
        id: "resolved-recent",
        status: "resolved",
        severity: "blocker",
        updatedAt: "2026-05-30T01:00:00.000Z"
      }),
      issue({
        id: "open-warning-stale",
        status: "open",
        severity: "warning",
        firstSeenAt: "2026-05-20T00:00:00.000Z",
        occurrenceCount: 3,
        updatedAt: "2026-05-29T02:00:00.000Z"
      }),
      issue({
        id: "open-blocker-watch",
        status: "open",
        severity: "blocker",
        firstSeenAt: "2026-05-27T00:00:00.000Z",
        occurrenceCount: 1,
        updatedAt: "2026-05-29T01:00:00.000Z"
      }),
      issue({
        id: "open-warning-watch-high-count",
        status: "open",
        severity: "warning",
        firstSeenAt: "2026-05-27T00:00:00.000Z",
        occurrenceCount: 8,
        updatedAt: "2026-05-29T00:00:00.000Z"
      }),
      issue({
        id: "open-warning-watch-low-count",
        status: "open",
        severity: "warning",
        firstSeenAt: "2026-05-27T00:00:00.000Z",
        occurrenceCount: 2,
        updatedAt: "2026-05-29T03:00:00.000Z"
      }),
      issue({
        id: "ignored",
        status: "ignored",
        severity: "warning",
        updatedAt: "2026-05-30T02:00:00.000Z"
      })
    ], now);

    expect(sorted.map((event) => event.id)).toEqual([
      "open-blocker-watch",
      "open-warning-stale",
      "open-warning-watch-high-count",
      "open-warning-watch-low-count",
      "resolved-recent",
      "ignored"
    ]);
  });

  it("summarizes operations issue status change attribution without exposing full actor ids", () => {
    expect(getOperationsIssueStatusChangeSummary(issue({
      statusUpdatedAt: "2026-05-30T04:00:00.000Z",
      statusUpdatedBy: "7a9f1c20-1234-5678-9012-abcdefabcdef"
    }))).toEqual({
      changedAt: "2026-05-30T04:00:00.000Z",
      changedByLabel: "운영자 7a9f1c20"
    });

    expect(getOperationsIssueStatusChangeSummary(issue({
      statusUpdatedAt: "2026-05-30T04:00:00.000Z",
      statusUpdatedBy: null
    }))).toEqual({
      changedAt: "2026-05-30T04:00:00.000Z",
      changedByLabel: "변경자 기록 없음"
    });

    expect(getOperationsIssueStatusChangeSummary(issue({
      statusUpdatedAt: null,
      statusUpdatedBy: "7a9f1c20-1234-5678-9012-abcdefabcdef"
    }))).toBeNull();
  });

  it("summarizes closed operations issue outcomes", () => {
    expect(summarizeOperationsIssueResolutionOutcomes([
      issue({
        id: "open",
        status: "open",
        firstSeenAt: "2026-05-28T00:00:00.000Z",
        updatedAt: "2026-05-30T00:00:00.000Z"
      }),
      issue({
        id: "resolved",
        status: "resolved",
        firstSeenAt: "2026-05-25T00:00:00.000Z",
        resolvedAt: "2026-05-29T00:00:00.000Z",
        updatedAt: "2026-05-29T00:00:00.000Z"
      }),
      issue({
        id: "ignored",
        status: "ignored",
        firstSeenAt: "2026-05-29T00:00:00.000Z",
        resolvedAt: null,
        statusUpdatedAt: "2026-05-30T00:00:00.000Z",
        updatedAt: "2026-05-30T00:00:00.000Z"
      })
    ])).toEqual({
      closed: 2,
      resolved: 1,
      ignored: 1,
      averageCloseAgeDays: 2.5,
      latestClosedAt: "2026-05-30T00:00:00.000Z"
    });
  });

  it("builds quick filter preset counts", () => {
    const now = new Date("2026-05-30T00:00:00.000Z");
    const presets = buildOperationsIssueQuickFilterPresets([
      issue({
        id: "open-blocker",
        status: "open",
        severity: "blocker",
        assignedToLabel: "김운영",
        firstSeenAt: "2026-05-29T00:00:00.000Z"
      }),
      issue({
        id: "stale-unassigned",
        status: "open",
        severity: "warning",
        assignedToLabel: null,
        firstSeenAt: "2026-05-20T00:00:00.000Z"
      }),
      issue({
        id: "resolved",
        status: "resolved",
        severity: "warning"
      }),
      issue({
        id: "ignored",
        status: "ignored",
        severity: "info"
      })
    ], now);

    expect(presets.map((preset) => [preset.id, preset.count])).toEqual([
      ["open_blockers", 1],
      ["stale_open", 1],
      ["unassigned_open", 1],
      ["resolved", 1],
      ["ignored", 1]
    ]);
    expect(presets.map((preset) => [preset.id, preset.actionLabel])).toContainEqual([
      "unassigned_open",
      "담당자 지정 후 처리 메모 작성"
    ]);
  });

  it("builds active filter labels", () => {
    expect(buildOperationsIssueActiveFilterLabels({
      status: "open",
      severity: "blocker",
      ageLevel: "stale",
      assignedToLabel: "미지정",
      query: "GPT"
    })).toEqual([
      { key: "status", label: "상태: 미해결" },
      { key: "severity", label: "심각도: 차단" },
      { key: "ageLevel", label: "경과: 장기 미해결" },
      { key: "assignedToLabel", label: "담당: 미지정" },
      { key: "query", label: "검색: GPT" }
    ]);
  });

  it("builds result summary metrics for filtered operations issues", () => {
    expect(buildOperationsIssueResultSummaryMetrics(
      {
        total: 2,
        open: 1,
        resolved: 1,
        ignored: 0,
        blocker: 1,
        warning: 1,
        latestIssueAt: "2026-05-29T02:00:00.000Z"
      },
      {
        total: 5,
        open: 3,
        resolved: 1,
        ignored: 1,
        blocker: 2,
        warning: 2,
        latestIssueAt: "2026-05-29T03:00:00.000Z"
      },
      true
    )).toEqual([
      { label: "표시", value: "2건", tone: "info" },
      { label: "필터 제외", value: "3건", tone: "warning" },
      { label: "미해결", value: "1건", tone: "warning" },
      { label: "차단", value: "1건", tone: "warning" },
      { label: "주의", value: "1건", tone: "info" }
    ]);
  });

  it("matches quick filter presets against current filters", () => {
    expect(operationsIssueFiltersMatch({
      status: "open",
      severity: "blocker",
      ageLevel: "all",
      assignedToLabel: "",
      query: ""
    }, {
      status: "open",
      severity: "blocker"
    })).toBe(true);

    expect(operationsIssueFiltersMatch({
      status: "open",
      severity: "blocker",
      ageLevel: "stale"
    }, {
      status: "open",
      severity: "blocker"
    })).toBe(false);
  });
});
