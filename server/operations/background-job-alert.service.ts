import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { sendTransactionalEmail } from "@/server/notifications/email";

export type BackgroundJobRunAlertInput = {
  workerId: string;
  claimedCount: number;
  succeededCount: number;
  failedCount: number;
  durationMs: number;
  outcomes: Array<{
    jobId: string;
    status: string;
    reason?: string;
  }>;
  errorMessage?: string | null;
};

export type BackgroundJobFailureAlertOptions = {
  supabase?: SupabaseClient;
  throttleWindowMs?: number;
  now?: Date;
};

const backgroundJobFailureAlertType = "background_job_failure";
const defaultThrottleWindowMs = 30 * 60 * 1000;

export function getOperationsAlertEmail() {
  return process.env.OPERATIONS_ALERT_EMAIL?.trim() || process.env.DEVELOPER_ALERT_EMAIL?.trim() || "";
}

function hashAlertKeyPart(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 16);
}

function getConfiguredThrottleWindowMs() {
  const minutes = Number(process.env.OPERATIONS_ALERT_THROTTLE_MINUTES);
  if (!Number.isFinite(minutes) || minutes < 0) return defaultThrottleWindowMs;
  return Math.round(minutes * 60 * 1000);
}

export function getBackgroundJobFailureAlertKey(input: BackgroundJobRunAlertInput) {
  if (input.errorMessage) {
    return `background_job_failure:route:${hashAlertKeyPart(input.errorMessage)}`;
  }

  const failedReasons = input.outcomes
    .filter((outcome) => outcome.status === "failed")
    .map((outcome) => outcome.reason ?? "failed")
    .sort()
    .slice(0, 10)
    .join("|");

  return `background_job_failure:jobs:${hashAlertKeyPart(failedReasons || "failed")}`;
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

async function recordOperationsAlertEvent(
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
      alert_type: backgroundJobFailureAlertType,
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

export function buildBackgroundJobFailureEmail(input: BackgroundJobRunAlertInput) {
  const failedOutcomes = input.outcomes.filter((outcome) => outcome.status === "failed");
  const failedLines = failedOutcomes.length
    ? failedOutcomes
        .slice(0, 10)
        .map((outcome) => `- ${outcome.jobId}: ${outcome.reason ?? "failed"}`)
        .join("\n")
    : "- route-level failure";

  return {
    subject: `[HS FINDER] 백그라운드 worker 실패 ${input.failedCount}건`,
    text: [
      "HS FINDER 백그라운드 worker에서 실패가 감지되었습니다.",
      "",
      `worker: ${input.workerId}`,
      `claimed: ${input.claimedCount}`,
      `succeeded: ${input.succeededCount}`,
      `failed: ${input.failedCount}`,
      `durationMs: ${input.durationMs}`,
      input.errorMessage ? `routeError: ${input.errorMessage}` : null,
      "",
      "실패 작업:",
      failedLines,
      "",
      "운영 점검 화면에서 background_jobs 및 background_job_runs 상태를 확인해 주세요."
    ].filter((line): line is string => line !== null).join("\n")
  };
}

export async function sendBackgroundJobFailureAlert(
  input: BackgroundJobRunAlertInput,
  options: BackgroundJobFailureAlertOptions = {}
) {
  if (input.failedCount <= 0 && !input.errorMessage) {
    return { sent: false as const, reason: "no_failure" as const };
  }

  const to = getOperationsAlertEmail();
  const alertKey = getBackgroundJobFailureAlertKey(input);
  const metadata = {
    workerId: input.workerId,
    claimedCount: input.claimedCount,
    succeededCount: input.succeededCount,
    failedCount: input.failedCount,
    durationMs: input.durationMs,
    routeLevelFailure: Boolean(input.errorMessage)
  };

  if (!to) {
    await recordOperationsAlertEvent(options.supabase, {
      alertKey,
      status: "skipped",
      reason: "not_configured",
      metadata
    }).catch(() => undefined);
    return { sent: false as const, reason: "not_configured" as const, alertKey };
  }

  const throttleWindowMs = options.throttleWindowMs ?? getConfiguredThrottleWindowMs();
  if (throttleWindowMs > 0) {
    const now = options.now ?? new Date();
    const since = new Date(now.getTime() - throttleWindowMs);
    const throttled = await hasRecentSentAlert(options.supabase, { alertKey, since });
    if (throttled) {
      await recordOperationsAlertEvent(options.supabase, {
        alertKey,
        status: "skipped",
        recipient: to,
        reason: "throttled",
        metadata: { ...metadata, throttleWindowMs }
      }).catch(() => undefined);
      return { sent: false as const, reason: "throttled" as const, alertKey, throttleWindowMs };
    }
  }

  const email = buildBackgroundJobFailureEmail(input);
  const result = await sendTransactionalEmail({
    to,
    subject: email.subject,
    text: email.text
  });

  await recordOperationsAlertEvent(options.supabase, {
    alertKey,
    status: result.sent ? "sent" : "failed",
    recipient: to,
    providerId: result.sent ? result.providerId : null,
    reason: result.sent ? null : result.reason,
    message: result.sent ? null : result.message,
    metadata
  }).catch(() => undefined);

  return result.sent
    ? { sent: true as const, providerId: result.providerId, alertKey }
    : { sent: false as const, reason: result.reason, message: result.message, alertKey };
}
