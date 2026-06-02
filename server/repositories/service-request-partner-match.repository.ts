import type { SupabaseClient } from "@supabase/supabase-js";

function isMissingMarketplaceSchemaError(error: { code?: string; message?: string }) {
  const message = error.message ?? "";
  return (
    error.code === "42703" ||
    error.code === "42P01" ||
    (error.code === "PGRST205" && message.toLowerCase().includes("schema cache"))
  );
}

export async function markServiceRequestPartnerMatchViewed(
  supabase: SupabaseClient,
  input: {
    currentInterestStatus: string;
    matchId: string;
  }
): Promise<{ marked: boolean; schemaReady: boolean }> {
  if (input.currentInterestStatus !== "none") {
    return { marked: false, schemaReady: true };
  }

  const { error } = await supabase.rpc("set_service_request_partner_interest", {
    p_interest_status: "viewed",
    p_match_id: input.matchId
  });

  if (error) {
    if (isMissingMarketplaceSchemaError(error)) {
      return { marked: false, schemaReady: false };
    }

    throw new Error(error.message);
  }

  return { marked: true, schemaReady: true };
}
