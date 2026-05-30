import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServiceRoleClient, hasSupabaseServiceRoleEnv } from "@/lib/supabase/service-role";
import { syncLookupQualityIssueEvents } from "@/server/operations/lookup-quality-issue-sync.service";
import { updateOperationsIssueStatus } from "@/server/repositories/operations-issue.repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest) {
  const secret = process.env.JOB_WORKER_SECRET || process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";

  const authorization = request.headers.get("authorization");
  const workerSecret = request.headers.get("x-job-worker-secret");
  const querySecret = request.nextUrl.searchParams.get("secret");

  return authorization === `Bearer ${secret}` || workerSecret === secret || querySecret === secret;
}

async function deleteRehearsalRows(
  supabase: ReturnType<typeof createSupabaseServiceRoleClient>,
  input: {
    rehearsalId: string;
    issueKey: string;
  }
) {
  const issueDelete = await supabase
    .from("operations_issue_events")
    .delete()
    .eq("issue_key", input.issueKey);
  const telemetryDelete = await supabase
    .from("lookup_telemetry_events")
    .delete()
    .eq("route", `/operations/rehearsal/${input.rehearsalId}`);

  return {
    issueCleanupOk: !issueDelete.error,
    issueCleanupError: issueDelete.error?.message ?? null,
    telemetryCleanupOk: !telemetryDelete.error,
    telemetryCleanupError: telemetryDelete.error?.message ?? null
  };
}

async function handleOperationsIssueRehearsal(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!hasSupabaseServiceRoleEnv()) {
    return NextResponse.json(
      { error: "Supabase service role environment variables are not configured." },
      { status: 500 }
    );
  }

  const supabase = createSupabaseServiceRoleClient();
  const rehearsalId = `lookup-quality-${randomUUID()}`;
  const issueType = `lookup_quality_rehearsal_${rehearsalId}`;
  const issueKey = `${issueType}:gpt`;
  const route = `/operations/rehearsal/${rehearsalId}`;
  let cleanup = {
    issueCleanupOk: true,
    issueCleanupError: null as string | null,
    telemetryCleanupOk: true,
    telemetryCleanupError: null as string | null
  };

  try {
    const rows = Array.from({ length: 3 }, (_, index) => ({
      event_type: "product_candidates_recommended",
      status: "success",
      source_mode: "operations_rehearsal",
      route,
      result_count: index === 0 ? 1 : 0,
      duration_ms: 10 + index,
      error_type: null,
      payload: {
        normalizationStatus: index === 0 ? "failed" : "success",
        normalizationErrorType: index === 0 ? "OperationsIssueRehearsal" : undefined,
        hasNormalization: index > 0,
        normalizationCandidateCount: index > 0 ? 1 : 0,
        aiHintCount: 0,
        officialCandidateCount: 0,
        rehearsalId
      }
    }));
    const { error: insertError } = await supabase
      .from("lookup_telemetry_events")
      .insert(rows);

    if (insertError) throw new Error(insertError.message);

    const sync = await syncLookupQualityIssueEvents(supabase, {
      telemetryLimit: 10,
      threshold: 3,
      issueType,
      sendAlerts: false
    });
    const issue = sync.syncedIssues.find((item) => item.issueKey === issueKey) ?? null;

    if (!issue) {
      throw new Error("Rehearsal issue was not created.");
    }

    const resolved = await updateOperationsIssueStatus(supabase, {
      issueId: issue.id,
      status: "resolved"
    });
    const reopened = await updateOperationsIssueStatus(supabase, {
      issueId: issue.id,
      status: "open"
    });
    cleanup = await deleteRehearsalRows(supabase, { rehearsalId, issueKey });
    const ok = sync.scannedEvents >= 3
      && sync.recurringIssues >= 1
      && issue.occurrenceCount >= 3
      && resolved.status === "resolved"
      && reopened.status === "open"
      && cleanup.issueCleanupOk
      && cleanup.telemetryCleanupOk;

    return NextResponse.json({
      kind: "operations_issue_rehearsal",
      ok,
      rehearsalId,
      insertedTelemetry: rows.length,
      sync: {
        scannedEvents: sync.scannedEvents,
        recurringIssues: sync.recurringIssues,
        syncedIssueKeys: sync.syncedIssues.map((item) => item.issueKey)
      },
      issue: {
        issueKey: issue.issueKey,
        occurrenceCount: issue.occurrenceCount,
        initialStatus: issue.status,
        resolvedStatus: resolved.status,
        reopenedStatus: reopened.status
      },
      cleanup
    }, { status: ok ? 200 : 500 });
  } catch (error) {
    cleanup = await deleteRehearsalRows(supabase, { rehearsalId, issueKey }).catch(() => cleanup);
    return NextResponse.json({
      kind: "operations_issue_rehearsal",
      ok: false,
      rehearsalId,
      error: error instanceof Error ? error.message : "Operations issue rehearsal failed.",
      cleanup
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return handleOperationsIssueRehearsal(request);
}

export async function POST(request: NextRequest) {
  return handleOperationsIssueRehearsal(request);
}
