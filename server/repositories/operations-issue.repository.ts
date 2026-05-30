import type { SupabaseClient } from "@supabase/supabase-js";

export type OperationsIssueStatus = "open" | "resolved" | "ignored";
export type OperationsIssueSeverity = "info" | "warning" | "blocker";

export type OperationsIssueEventItem = {
  id: string;
  issueType: string;
  issueKey: string;
  status: OperationsIssueStatus;
  severity: OperationsIssueSeverity;
  source: string;
  title: string;
  summary: string;
  action: string;
  occurrenceCount: number;
  firstSeenAt: string;
  lastSeenAt: string;
  resolvedAt: string | null;
  assignedToLabel: string | null;
  operatorNote: string | null;
  resolutionReason: string | null;
  statusUpdatedBy: string | null;
  statusUpdatedAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

type OperationsIssueEventRow = {
  id: string;
  issue_type: string;
  issue_key: string;
  status: OperationsIssueStatus;
  severity: OperationsIssueSeverity;
  source: string;
  title: string;
  summary: string;
  action: string;
  occurrence_count: number;
  first_seen_at: string;
  last_seen_at: string;
  resolved_at: string | null;
  assigned_to_label: string | null;
  operator_note: string | null;
  resolution_reason: string | null;
  status_updated_by: string | null;
  status_updated_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type UpsertOperationsIssueEventInput = {
  issueType: string;
  issueKey: string;
  severity: OperationsIssueSeverity;
  source: string;
  title: string;
  summary: string;
  action: string;
  occurrenceCount: number;
  firstSeenAt: string;
  lastSeenAt: string;
  metadata: Record<string, unknown>;
};

export type UpdateOperationsIssueStatusInput = {
  issueId: string;
  status: OperationsIssueStatus;
  assignedToLabel?: string | null;
  operatorNote?: string | null;
  resolutionReason?: string | null;
  statusUpdatedBy?: string | null;
};

export type OperationsIssueEventSummary = {
  total: number;
  open: number;
  resolved: number;
  ignored: number;
  blocker: number;
  warning: number;
  latestIssueAt: string | null;
};

export type OperationsIssueEventFilters = {
  status?: OperationsIssueStatus | "all";
  severity?: OperationsIssueSeverity | "all";
  assignedToLabel?: string;
  query?: string;
};

export type OperationsIssueOwnerSummary = {
  assignedToLabel: string;
  open: number;
  blocker: number;
  warning: number;
  oldestOpenAt: string | null;
  oldestOpenAgeDays: number | null;
  latestIssueAt: string | null;
};

export type OperationsIssueAgeStatus = {
  ageDays: number;
  level: "normal" | "watch" | "stale";
  label: string;
};

export type OperationsIssueStatusChangeSummary = {
  changedAt: string;
  changedByLabel: string;
};

const operationsIssueStatusPriority: Record<OperationsIssueStatus, number> = {
  open: 0,
  resolved: 1,
  ignored: 2
};

const operationsIssueSeverityPriority: Record<OperationsIssueSeverity, number> = {
  blocker: 0,
  warning: 1,
  info: 2
};

const operationsIssueAgeLevelPriority: Record<OperationsIssueAgeStatus["level"], number> = {
  stale: 0,
  watch: 1,
  normal: 2
};

const operationsIssueEventSelect = [
  "id",
  "issue_type",
  "issue_key",
  "status",
  "severity",
  "source",
  "title",
  "summary",
  "action",
  "occurrence_count",
  "first_seen_at",
  "last_seen_at",
  "resolved_at",
  "assigned_to_label",
  "operator_note",
  "resolution_reason",
  "status_updated_by",
  "status_updated_at",
  "metadata",
  "created_at",
  "updated_at"
].join(",");

function mapOperationsIssueEvent(row: OperationsIssueEventRow): OperationsIssueEventItem {
  return {
    id: row.id,
    issueType: row.issue_type,
    issueKey: row.issue_key,
    status: row.status,
    severity: row.severity,
    source: row.source,
    title: row.title,
    summary: row.summary,
    action: row.action,
    occurrenceCount: row.occurrence_count,
    firstSeenAt: row.first_seen_at,
    lastSeenAt: row.last_seen_at,
    resolvedAt: row.resolved_at,
    assignedToLabel: row.assigned_to_label,
    operatorNote: row.operator_note,
    resolutionReason: row.resolution_reason,
    statusUpdatedBy: row.status_updated_by,
    statusUpdatedAt: row.status_updated_at,
    metadata: row.metadata,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function listRecentOperationsIssueEvents(
  supabase: SupabaseClient,
  limit = 20
): Promise<OperationsIssueEventItem[]> {
  const { data, error } = await supabase
    .from("operations_issue_events")
    .select(operationsIssueEventSelect)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as OperationsIssueEventRow[]).map(mapOperationsIssueEvent);
}

export async function upsertOperationsIssueEvent(
  supabase: SupabaseClient,
  input: UpsertOperationsIssueEventInput
): Promise<OperationsIssueEventItem> {
  const { data: existing, error: selectError } = await supabase
    .from("operations_issue_events")
    .select(operationsIssueEventSelect)
    .eq("issue_key", input.issueKey)
    .maybeSingle();

  if (selectError) throw new Error(selectError.message);

  const existingIssue = existing as unknown as OperationsIssueEventRow | null;
  const payload = {
    issue_type: input.issueType,
    issue_key: input.issueKey,
    severity: input.severity,
    source: input.source,
    title: input.title,
    summary: input.summary,
    action: input.action,
    occurrence_count: input.occurrenceCount,
    first_seen_at: existingIssue?.first_seen_at ?? input.firstSeenAt,
    last_seen_at: input.lastSeenAt,
    metadata: input.metadata,
    updated_at: new Date().toISOString()
  };

  if (existingIssue) {
    const { data, error } = await supabase
      .from("operations_issue_events")
      .update(payload)
      .eq("issue_key", input.issueKey)
      .select(operationsIssueEventSelect)
      .single();

    if (error) throw new Error(error.message);
    return mapOperationsIssueEvent(data as unknown as OperationsIssueEventRow);
  }

  const { data, error } = await supabase
    .from("operations_issue_events")
    .insert({
      ...payload,
      status: "open"
    })
    .select(operationsIssueEventSelect)
    .single();

  if (error) throw new Error(error.message);
  return mapOperationsIssueEvent(data as unknown as OperationsIssueEventRow);
}

export async function updateOperationsIssueStatus(
  supabase: SupabaseClient,
  input: UpdateOperationsIssueStatusInput
): Promise<OperationsIssueEventItem> {
  const resolvedAt = input.status === "resolved" || input.status === "ignored"
    ? new Date().toISOString()
    : null;
  const statusUpdatedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from("operations_issue_events")
    .update({
      status: input.status,
      resolved_at: resolvedAt,
      assigned_to_label: input.assignedToLabel ?? null,
      operator_note: input.operatorNote ?? null,
      resolution_reason: input.resolutionReason ?? null,
      status_updated_by: input.statusUpdatedBy ?? null,
      status_updated_at: statusUpdatedAt,
      updated_at: statusUpdatedAt
    })
    .eq("id", input.issueId)
    .select(operationsIssueEventSelect)
    .single();

  if (error) throw new Error(error.message);
  return mapOperationsIssueEvent(data as unknown as OperationsIssueEventRow);
}

export function summarizeOperationsIssueEvents(events: OperationsIssueEventItem[]): OperationsIssueEventSummary {
  return events.reduce<OperationsIssueEventSummary>((summary, event) => {
    summary.total += 1;
    if (event.status === "open") summary.open += 1;
    if (event.status === "resolved") summary.resolved += 1;
    if (event.status === "ignored") summary.ignored += 1;
    if (event.status === "open" && event.severity === "blocker") summary.blocker += 1;
    if (event.status === "open" && event.severity === "warning") summary.warning += 1;
    if (!summary.latestIssueAt || new Date(event.updatedAt).getTime() > new Date(summary.latestIssueAt).getTime()) {
      summary.latestIssueAt = event.updatedAt;
    }
    return summary;
  }, {
    total: 0,
    open: 0,
    resolved: 0,
    ignored: 0,
    blocker: 0,
    warning: 0,
    latestIssueAt: null
  });
}

function includesNormalized(value: string | null | undefined, query: string) {
  return Boolean(value?.toLowerCase().includes(query));
}

export function filterOperationsIssueEvents(
  events: OperationsIssueEventItem[],
  filters: OperationsIssueEventFilters
) {
  const status = filters.status && filters.status !== "all" ? filters.status : null;
  const severity = filters.severity && filters.severity !== "all" ? filters.severity : null;
  const assignedToLabel = filters.assignedToLabel?.trim().toLowerCase() ?? "";
  const query = filters.query?.trim().toLowerCase() ?? "";

  return events.filter((event) => {
    if (status && event.status !== status) return false;
    if (severity && event.severity !== severity) return false;
    if (assignedToLabel && !includesNormalized(event.assignedToLabel, assignedToLabel)) return false;
    if (!query) return true;

    return [
      event.title,
      event.summary,
      event.action,
      event.issueKey,
      event.issueType,
      event.assignedToLabel,
      event.operatorNote,
      event.resolutionReason
    ].some((value) => includesNormalized(value, query));
  });
}

function ownerLabel(value: string | null) {
  return value?.trim() || "미지정";
}

function ageDaysSince(value: string | null, now: Date) {
  if (!value) return null;
  const ageMs = now.getTime() - new Date(value).getTime();
  return Math.max(0, Math.floor(ageMs / (24 * 60 * 60 * 1000)));
}

export function getOpenOperationsIssueAgeStatus(
  event: OperationsIssueEventItem,
  now = new Date(),
  options: { watchDays?: number; staleDays?: number } = {}
): OperationsIssueAgeStatus | null {
  if (event.status !== "open") return null;

  const watchDays = options.watchDays ?? 2;
  const staleDays = options.staleDays ?? 7;
  const ageDays = ageDaysSince(event.firstSeenAt, now) ?? 0;
  const level = ageDays >= staleDays ? "stale" : ageDays >= watchDays ? "watch" : "normal";
  const label = level === "stale"
    ? `장기 미해결 ${ageDays}일`
    : level === "watch"
      ? `지연 확인 ${ageDays}일`
      : `열림 ${ageDays}일`;

  return { ageDays, level, label };
}

export function sortOperationsIssueEventsForTriage(
  events: OperationsIssueEventItem[],
  now = new Date()
): OperationsIssueEventItem[] {
  return [...events].sort((a, b) => {
    const statusDiff = operationsIssueStatusPriority[a.status] - operationsIssueStatusPriority[b.status];
    if (statusDiff !== 0) return statusDiff;

    const severityDiff = operationsIssueSeverityPriority[a.severity] - operationsIssueSeverityPriority[b.severity];
    if (severityDiff !== 0) return severityDiff;

    const aAge = getOpenOperationsIssueAgeStatus(a, now);
    const bAge = getOpenOperationsIssueAgeStatus(b, now);
    const ageLevelDiff = operationsIssueAgeLevelPriority[aAge?.level ?? "normal"] - operationsIssueAgeLevelPriority[bAge?.level ?? "normal"];
    if (ageLevelDiff !== 0) return ageLevelDiff;
    if ((bAge?.ageDays ?? 0) !== (aAge?.ageDays ?? 0)) return (bAge?.ageDays ?? 0) - (aAge?.ageDays ?? 0);

    if (b.occurrenceCount !== a.occurrenceCount) return b.occurrenceCount - a.occurrenceCount;

    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

export function getOperationsIssueStatusChangeSummary(
  event: OperationsIssueEventItem
): OperationsIssueStatusChangeSummary | null {
  if (!event.statusUpdatedAt) return null;

  const actorId = event.statusUpdatedBy?.trim();
  const changedByLabel = actorId ? `운영자 ${actorId.slice(0, 8)}` : "변경자 기록 없음";

  return {
    changedAt: event.statusUpdatedAt,
    changedByLabel
  };
}

export function summarizeOpenOperationsIssuesByOwner(
  events: OperationsIssueEventItem[],
  now = new Date()
): OperationsIssueOwnerSummary[] {
  const rows = new Map<string, OperationsIssueOwnerSummary>();

  for (const event of events) {
    if (event.status !== "open") continue;

    const label = ownerLabel(event.assignedToLabel);
    const current = rows.get(label) ?? {
      assignedToLabel: label,
      open: 0,
      blocker: 0,
      warning: 0,
      oldestOpenAt: null,
      oldestOpenAgeDays: null,
      latestIssueAt: null
    };

    current.open += 1;
    current.blocker += event.severity === "blocker" ? 1 : 0;
    current.warning += event.severity === "warning" ? 1 : 0;
    if (!current.oldestOpenAt || new Date(event.firstSeenAt).getTime() < new Date(current.oldestOpenAt).getTime()) {
      current.oldestOpenAt = event.firstSeenAt;
      current.oldestOpenAgeDays = ageDaysSince(event.firstSeenAt, now);
    }
    if (!current.latestIssueAt || new Date(event.updatedAt).getTime() > new Date(current.latestIssueAt).getTime()) {
      current.latestIssueAt = event.updatedAt;
    }

    rows.set(label, current);
  }

  return [...rows.values()].sort((a, b) => {
    if (b.blocker !== a.blocker) return b.blocker - a.blocker;
    if (b.open !== a.open) return b.open - a.open;
    if (a.oldestOpenAt && b.oldestOpenAt && a.oldestOpenAt !== b.oldestOpenAt) {
      return new Date(a.oldestOpenAt).getTime() - new Date(b.oldestOpenAt).getTime();
    }
    return a.assignedToLabel.localeCompare(b.assignedToLabel);
  });
}
