import { createSupabaseServiceRoleClient, hasSupabaseServiceRoleEnv } from "@/lib/supabase/service-role";

export async function logProtectedJobEvent(input: {
  durationMs: number;
  jobName: string;
  message?: string | null;
  metadata?: Record<string, unknown>;
  route: string;
  status: "succeeded" | "failed";
}) {
  if (!hasSupabaseServiceRoleEnv()) return;

  try {
    const supabase = createSupabaseServiceRoleClient();
    await supabase
      .from("protected_job_events")
      .insert({
        duration_ms: Math.max(0, Math.round(input.durationMs)),
        job_name: input.jobName,
        message: input.message ?? null,
        metadata: input.metadata ?? {},
        route: input.route,
        status: input.status
      });
  } catch {
    // Job telemetry must not change the job response.
  }
}
