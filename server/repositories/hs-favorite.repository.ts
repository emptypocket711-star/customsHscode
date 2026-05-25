import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeHsCode } from "@/lib/hs-code";

export type HsFavoriteItem = {
  id: string;
  hskCode: string;
  displayName: string | null;
  basisDate: string | null;
  createdAt: string;
};

type HsFavoriteRow = {
  id: string;
  hsk_code: string;
  display_name: string | null;
  basis_date: string | null;
  created_at: string;
};

function mapFavorite(row: HsFavoriteRow): HsFavoriteItem {
  return {
    id: row.id,
    hskCode: row.hsk_code,
    displayName: row.display_name,
    basisDate: row.basis_date,
    createdAt: row.created_at
  };
}

function isMissingFavoritesTable(error: { code?: string; message?: string }) {
  return error.code === "42P01" || Boolean(error.message?.includes("hs_favorites"));
}

export async function listUserHsFavorites(supabase: SupabaseClient, limit = 5): Promise<HsFavoriteItem[]> {
  const { data, error } = await supabase
    .from("hs_favorites")
    .select("id, hsk_code, display_name, basis_date, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (isMissingFavoritesTable(error)) return [];
    throw new Error(error.message);
  }

  return ((data ?? []) as HsFavoriteRow[]).map(mapFavorite);
}

export async function favoriteCodeSet(supabase: SupabaseClient, hskCodes: string[]) {
  const normalizedCodes = Array.from(new Set(hskCodes.map((code) => normalizeHsCode(code)).filter((code) => code.length === 10)));
  if (normalizedCodes.length === 0) return new Set<string>();

  const { data, error } = await supabase
    .from("hs_favorites")
    .select("hsk_code")
    .in("hsk_code", normalizedCodes);

  if (error) {
    if (isMissingFavoritesTable(error)) return new Set<string>();
    throw new Error(error.message);
  }

  return new Set(((data ?? []) as { hsk_code: string }[]).map((row) => row.hsk_code));
}

export async function toggleHsFavorite(
  supabase: SupabaseClient,
  input: {
    hskCode: string;
    displayName?: string | null;
    basisDate?: string | null;
  }
) {
  const hskCode = normalizeHsCode(input.hskCode);
  if (hskCode.length !== 10) {
    throw new Error("HS CODE 10자리만 즐겨찾기에 저장할 수 있습니다.");
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("로그인 후 즐겨찾기를 저장할 수 있습니다.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.company_id) {
    throw new Error("회사 프로필이 연결된 사용자만 즐겨찾기를 저장할 수 있습니다.");
  }

  const { data: existing, error: existingError } = await supabase
    .from("hs_favorites")
    .select("id")
    .eq("created_by", user.id)
    .eq("hsk_code", hskCode)
    .maybeSingle();

  if (existingError) throw new Error(existingError.message);

  if (existing?.id) {
    const { error } = await supabase
      .from("hs_favorites")
      .delete()
      .eq("id", existing.id);

    if (error) throw new Error(error.message);
    return { status: "removed" as const, hskCode };
  }

  const { error } = await supabase
    .from("hs_favorites")
    .insert({
      company_id: profile.company_id,
      created_by: user.id,
      hsk_code: hskCode,
      display_name: input.displayName || null,
      basis_date: input.basisDate || null
    });

  if (error) throw new Error(error.message);
  return { status: "added" as const, hskCode };
}
