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

export function getOperationsAlertEmail() {
  return process.env.OPERATIONS_ALERT_EMAIL?.trim() || process.env.DEVELOPER_ALERT_EMAIL?.trim() || "";
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

export async function sendBackgroundJobFailureAlert(input: BackgroundJobRunAlertInput) {
  if (input.failedCount <= 0 && !input.errorMessage) {
    return { sent: false as const, reason: "no_failure" as const };
  }

  const to = getOperationsAlertEmail();
  if (!to) {
    return { sent: false as const, reason: "not_configured" as const };
  }

  const email = buildBackgroundJobFailureEmail(input);
  const result = await sendTransactionalEmail({
    to,
    subject: email.subject,
    text: email.text
  });

  return result.sent
    ? { sent: true as const, providerId: result.providerId }
    : { sent: false as const, reason: result.reason, message: result.message };
}
