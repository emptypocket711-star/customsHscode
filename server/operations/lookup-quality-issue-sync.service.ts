import type { SupabaseClient } from "@supabase/supabase-js";
import {
  listRecentLookupTelemetryEvents,
  summarizeRecurringLookupTelemetryIssues
} from "@/server/repositories/lookup-telemetry.repository";
import {
  upsertOperationsIssueEvent,
  type OperationsIssueEventItem
} from "@/server/repositories/operations-issue.repository";

export type LookupQualityIssueSyncResult = {
  kind: "lookup_quality_issue_sync";
  scannedEvents: number;
  recurringIssues: number;
  syncedIssues: OperationsIssueEventItem[];
};

const recurringLookupIssueType = "lookup_quality_recurring";

export async function syncLookupQualityIssueEvents(
  supabase: SupabaseClient,
  options: {
    telemetryLimit?: number;
    threshold?: number;
  } = {}
): Promise<LookupQualityIssueSyncResult> {
  const telemetryLimit = options.telemetryLimit ?? 100;
  const threshold = options.threshold ?? 3;
  const events = await listRecentLookupTelemetryEvents(supabase, telemetryLimit);
  const recurringIssues = summarizeRecurringLookupTelemetryIssues(events, threshold);
  const syncedIssues: OperationsIssueEventItem[] = [];

  for (const issue of recurringIssues) {
    syncedIssues.push(await upsertOperationsIssueEvent(supabase, {
      issueType: recurringLookupIssueType,
      issueKey: `${recurringLookupIssueType}:${issue.key}`,
      severity: "warning",
      source: "lookup_telemetry_events",
      title: `반복 조회 품질 이슈: ${issue.label}`,
      summary: `${issue.label} 분류가 최근 조회 품질 로그에서 ${issue.issueCount}건 반복되었습니다.`,
      action: issue.action,
      occurrenceCount: issue.issueCount,
      firstSeenAt: issue.firstSeenAt,
      lastSeenAt: issue.latestAt,
      metadata: {
        bucketKey: issue.key,
        label: issue.label,
        routes: issue.routes,
        diagnoses: issue.diagnoses,
        threshold,
        telemetryLimit
      }
    }));
  }

  return {
    kind: "lookup_quality_issue_sync",
    scannedEvents: events.length,
    recurringIssues: recurringIssues.length,
    syncedIssues
  };
}
