import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { sendTransactionalEmail } from "@/server/notifications/email";
import { getOperationsAlertEmail } from "@/server/operations/background-job-alert.service";
import type { OperationsIssueEventItem } from "@/server/repositories/operations-issue.repository";

export type OperationsIssueAlertOptions = {
  supabase?: SupabaseClient;
  throttleWindowMs?: number;
  now?: Date;
};

export type OperationsIssueAlertResult =
  | { sent: true; providerId?: string; alertKey: string }
  | { sent: false; reason: "not_open" | "not_configured" | "throttled" | string; message?: string; alertKey?: string; throttleWindowMs?: number };

const operationsIssueAlertType = "operations_issue_open";
const defaultThrottleWindowMs = 30 * 60 * 1000;

function hashAlertKeyPart(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 16);
}

function getConfiguredThrottleWindowMs() {
  const minutes = Number(process.env.OPERATIONS_ALERT_THROTTLE_MINUTES);
  if (!Number.isFinite(minutes) || minutes < 0) return defaultThrottleWindowMs;
  return Math.round(minutes * 60 * 1000);
}

export function getOperationsIssueAlertKey(issue: OperationsIssueEventItem) {
  return `${operationsIssueAlertType}:${hashAlertKeyPart(issue.issueKey)}`;
}

async function hasRecentSentAlert(
  supabase: SupabaseClient | undefined,
  input: {
    alertKey: string;
    since: Date;
  }
) {
  if (!supabase) return false;

  const { data, error } = await supabase
    .from("operations_alert_events")
    .select("id")
    .eq("alert_key", input.alertKey)
    .eq("status", "sent")
    .gte("created_at", input.since.toISOString())
    .limit(1);

  if (error) throw new Error(error.message);
  return Boolean(data?.length);
}

async function recordOperationsIssueAlertEvent(
  supabase: SupabaseClient | undefined,
  input: {
    alertKey: string;
    status: "sent" | "skipped" | "failed";
    recipient?: string | null;
    providerId?: string | null;
    reason?: string | null;
    message?: string | null;
    metadata: Record<string, unknown>;
  }
) {
  if (!supabase) return;

  const { error } = await supabase
    .from("operations_alert_events")
    .insert({
      alert_type: operationsIssueAlertType,
      alert_key: input.alertKey,
      status: input.status,
      recipient: input.recipient ?? null,
      provider_id: input.providerId ?? null,
      reason: input.reason ?? null,
      message: input.message ? input.message.slice(0, 2000) : null,
      metadata: input.metadata
    });

  if (error) throw new Error(error.message);
}

export function buildOperationsIssueEmail(issue: OperationsIssueEventItem) {
  return {
    subject: `[HS FINDER] 운영 이슈 미해결: ${issue.title}`,
    text: [
      "HS FINDER 운영 이슈가 미해결 상태로 감지되었습니다.",
      "",
      `title: ${issue.title}`,
      `issueType: ${issue.issueType}`,
      `issueKey: ${issue.issueKey}`,
      `severity: ${issue.severity}`,
      `occurrenceCount: ${issue.occurrenceCount}`,
      `firstSeenAt: ${issue.firstSeenAt}`,
      `lastSeenAt: ${issue.lastSeenAt}`,
      "",
      "요약:",
      issue.summary,
      "",
      "운영 조치:",
      issue.action,
      "",
      "운영 점검 화면에서 운영 이슈 처리 상태를 확인해 주세요."
    ].join("\n")
  };
}

export async function sendOperationsIssueAlert(
  issue: OperationsIssueEventItem,
  options: OperationsIssueAlertOptions = {}
): Promise<OperationsIssueAlertResult> {
  const alertKey = getOperationsIssueAlertKey(issue);
  const metadata = {
    issueId: issue.id,
    issueType: issue.issueType,
    issueKey: issue.issueKey,
    severity: issue.severity,
    occurrenceCount: issue.occurrenceCount,
    status: issue.status
  };

  if (issue.status !== "open") {
    return { sent: false, reason: "not_open", alertKey };
  }

  const to = getOperationsAlertEmail();
  if (!to) {
    await recordOperationsIssueAlertEvent(options.supabase, {
      alertKey,
      status: "skipped",
      reason: "not_configured",
      metadata
    }).catch(() => undefined);
    return { sent: false, reason: "not_configured", alertKey };
  }

  const throttleWindowMs = options.throttleWindowMs ?? getConfiguredThrottleWindowMs();
  if (throttleWindowMs > 0) {
    const now = options.now ?? new Date();
    const since = new Date(now.getTime() - throttleWindowMs);
    const throttled = await hasRecentSentAlert(options.supabase, { alertKey, since });
    if (throttled) {
      await recordOperationsIssueAlertEvent(options.supabase, {
        alertKey,
        status: "skipped",
        recipient: to,
        reason: "throttled",
        metadata: { ...metadata, throttleWindowMs }
      }).catch(() => undefined);
      return { sent: false, reason: "throttled", alertKey, throttleWindowMs };
    }
  }

  const email = buildOperationsIssueEmail(issue);
  const result = await sendTransactionalEmail({
    to,
    subject: email.subject,
    text: email.text
  });

  await recordOperationsIssueAlertEvent(options.supabase, {
    alertKey,
    status: result.sent ? "sent" : "failed",
    recipient: to,
    providerId: result.sent ? result.providerId : null,
    reason: result.sent ? null : result.reason,
    message: result.sent ? null : result.message,
    metadata
  }).catch(() => undefined);

  return result.sent
    ? { sent: true, providerId: result.providerId, alertKey }
    : { sent: false, reason: result.reason, message: result.message, alertKey };
}
