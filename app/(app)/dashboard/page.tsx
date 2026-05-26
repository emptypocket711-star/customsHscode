import { DashboardHome } from "@/features/dashboard/dashboard-home";
import { createSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase/server";
import { getSeoulDateString } from "@/lib/utils";
import { listPublishedAppNotices } from "@/server/repositories/app-notice.repository";
import { listUserHsFavorites } from "@/server/repositories/hs-favorite.repository";
import { listUserHsLookupHistory } from "@/server/repositories/hs-lookup-history.repository";

export default async function DashboardPage() {
  const basisDate = getSeoulDateString();
  const [favorites, lookupHistory, notices] = await Promise.all([
    hasSupabaseEnv()
      ? createSupabaseServerClient().then((supabase) => listUserHsFavorites(supabase, 5)).catch(() => [])
      : Promise.resolve([]),
    hasSupabaseEnv()
      ? createSupabaseServerClient().then((supabase) => listUserHsLookupHistory(supabase, 5)).catch(() => [])
      : Promise.resolve([]),
    hasSupabaseEnv()
      ? createSupabaseServerClient().then((supabase) => listPublishedAppNotices(supabase, 5)).catch(() => [])
      : Promise.resolve([])
  ]);

  return <DashboardHome basisDate={basisDate} favorites={favorites} lookupHistory={lookupHistory} notices={notices} />;
}
