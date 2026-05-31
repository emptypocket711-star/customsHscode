import { createHash } from "node:crypto";
import { createSupabaseServiceRoleClient, hasSupabaseServiceRoleEnv } from "@/lib/supabase/service-role";

function hashContainerNo(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function logContainerReceiptFailure(input: {
  containerNo?: string;
  failureCode: string;
  message?: string;
  metadata?: Record<string, unknown>;
  terminalCode: string;
  userId?: string | null;
}) {
  if (!hasSupabaseServiceRoleEnv()) return;

  try {
    const supabase = createSupabaseServiceRoleClient();
    await supabase
      .from("container_receipt_failure_events")
      .insert({
        container_hash: input.containerNo ? hashContainerNo(input.containerNo) : null,
        failure_code: input.failureCode,
        message: input.message ?? null,
        metadata: input.metadata ?? {},
        terminal_code: input.terminalCode,
        user_id: input.userId ?? null
      });
  } catch {
    // Failure telemetry must not block the receipt response path.
  }
}
