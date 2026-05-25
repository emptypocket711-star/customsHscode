import type { SupabaseClient } from "@supabase/supabase-js";

export type HsLookupHistoryItem = {
  id: string;
  query: string;
  direction: "import" | "export";
  destinationCountry: string;
  basisDate: string;
  updatedAt: string;
};

function normalizeQuery(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function isMissingTableError(error: { code?: string; message?: string }) {
  return error.code === "42P01" || Boolean(error.message?.includes("hs_lookup_history"));
}

export async function recordHsLookupHistory(
  supabase: SupabaseClient,
  input: {
    basisDate: string;
    destinationCountry?: string;
    direction?: string;
    originCountry?: string;
    query?: string;
  }
) {
  const query = input.query?.trim();
  if (!query) return;

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .maybeSingle<{ company_id: string | null }>();

  if (profileError || !profile?.company_id) return;

  const direction = input.direction === "export" ? "export" : "import";
  const destinationCountry = input.destinationCountry || "ALL";
  const { error } = await supabase.from("hs_lookup_history").upsert(
    {
      basis_date: input.basisDate,
      company_id: profile.company_id,
      created_by: user.id,
      destination_country: destinationCountry,
      direction,
      normalized_query: normalizeQuery(query),
      origin_country: input.originCountry || null,
      query,
      updated_at: new Date().toISOString()
    },
    {
      onConflict: "created_by,normalized_query,direction,destination_country,basis_date"
    }
  );

  if (error && !isMissingTableError(error)) {
    throw new Error(error.message);
  }
}

export async function listUserHsLookupHistory(
  supabase: SupabaseClient,
  limit = 5
): Promise<HsLookupHistoryItem[]> {
  const { data, error } = await supabase
    .from("hs_lookup_history")
    .select("id,query,direction,destination_country,basis_date,updated_at")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (isMissingTableError(error)) return [];
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    id: String(row.id),
    query: String(row.query ?? ""),
    direction: row.direction === "export" ? "export" : "import",
    destinationCountry: String(row.destination_country ?? "ALL"),
    basisDate: String(row.basis_date),
    updatedAt: String(row.updated_at)
  }));
}
