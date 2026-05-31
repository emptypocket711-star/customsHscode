import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase/server";
import { getHsNavigationStats } from "@/server/services/hs-navigation-stats.service";
import { normalizeHsCode } from "@/lib/hs-code";

export async function GET(request: NextRequest) {
  if (hasSupabaseEnv()) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const hskCode = normalizeHsCode(request.nextUrl.searchParams.get("hskCode") ?? "");
  if (hskCode.length !== 10) {
    return NextResponse.json({ error: "invalid_hsk_code" }, { status: 400 });
  }

  try {
    const rows = await getHsNavigationStats(hskCode);
    return NextResponse.json({ rows });
  } catch {
    return NextResponse.json({ rows: [] });
  }
}
