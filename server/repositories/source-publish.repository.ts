import type { SupabaseClient } from "@supabase/supabase-js";
import type { PublishSourceVersionInput } from "@/features/legal-updates/source-publish-schemas";

export const publishLegalSourceVersionRpcName = "publish_legal_source_version";

export function shouldMatchSourceVersionPrefix(input: PublishSourceVersionInput) {
  return input.matchPrefix === "on";
}

export async function publishSourceVersion(
  supabase: SupabaseClient,
  input: PublishSourceVersionInput
) {
  const { data, error } = await supabase.rpc(publishLegalSourceVersionRpcName, {
    p_target_table: input.targetTable,
    p_source_version: input.sourceVersion,
    p_match_prefix: shouldMatchSourceVersionPrefix(input),
    p_note: input.note ?? null
  });

  if (error) throw new Error(error.message);

  return Number(data ?? 0);
}
