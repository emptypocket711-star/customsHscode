import { DashboardHome } from "@/features/dashboard/dashboard-home";
import { createSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase/server";
import { getSeoulDateString } from "@/lib/utils";
import { listUserHsFavorites } from "@/server/repositories/hs-favorite.repository";
import { loadDashboardStats } from "@/server/rules/dashboard-metrics.service";

export default async function DashboardPage() {
  const basisDate = getSeoulDateString();
  const [stats, favorites] = await Promise.all([
    loadDashboardStats(basisDate),
    hasSupabaseEnv()
      ? createSupabaseServerClient().then((supabase) => listUserHsFavorites(supabase, 5)).catch(() => [])
      : Promise.resolve([])
  ]);

  return <DashboardHome basisDate={basisDate} favorites={favorites} stats={stats} />;
}
