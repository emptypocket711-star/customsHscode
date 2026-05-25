import { DashboardHome } from "@/features/dashboard/dashboard-home";
import { createSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase/server";
import { getSeoulDateString } from "@/lib/utils";
import { listUserHsFavorites } from "@/server/repositories/hs-favorite.repository";
import { listUserHsLookupHistory } from "@/server/repositories/hs-lookup-history.repository";
import { loadDashboardStats } from "@/server/rules/dashboard-metrics.service";

export default async function DashboardPage() {
  const basisDate = getSeoulDateString();
  const [stats, favorites, lookupHistory] = await Promise.all([
    loadDashboardStats(basisDate),
    hasSupabaseEnv()
      ? createSupabaseServerClient().then((supabase) => listUserHsFavorites(supabase, 5)).catch(() => [])
      : Promise.resolve([]),
    hasSupabaseEnv()
      ? createSupabaseServerClient().then((supabase) => listUserHsLookupHistory(supabase, 5)).catch(() => [])
      : Promise.resolve([])
  ]);

  return <DashboardHome basisDate={basisDate} favorites={favorites} lookupHistory={lookupHistory} stats={stats} />;
}
