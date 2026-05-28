import { DashboardHome } from "@/features/dashboard/dashboard-home";
import type { CargoWatchListItem } from "@/features/cargo/cargo-tracking-panel";
import { createSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase/server";
import { getSeoulDateString } from "@/lib/utils";
import { listPublishedAppNotices } from "@/server/repositories/app-notice.repository";
import { listUserHsFavorites } from "@/server/repositories/hs-favorite.repository";
import { listUserHsLookupHistory } from "@/server/repositories/hs-lookup-history.repository";

async function listDashboardCargoWatches(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>
): Promise<CargoWatchListItem[]> {
  const { data, error } = await supabase
    .from("cargo_watch_requests")
    .select("id,cargo_management_no,master_bl_no,house_bl_no,bl_year,target_status,notify_email,status,last_status,last_checked_at,created_at")
    .in("status", ["active", "error"])
    .order("created_at", { ascending: false })
    .limit(5);

  if (error || !data) return [];

  return data.map((row) => ({
    id: String(row.id),
    cargoManagementNo: row.cargo_management_no,
    masterBlNo: row.master_bl_no,
    houseBlNo: row.house_bl_no,
    blYear: row.bl_year,
    targetStatus: row.target_status,
    notifyEmail: row.notify_email,
    status: row.status,
    lastStatus: row.last_status,
    lastCheckedAt: row.last_checked_at,
    createdAt: row.created_at
  }));
}

export default async function DashboardPage() {
  const basisDate = getSeoulDateString();
  const supabase = hasSupabaseEnv() ? await createSupabaseServerClient() : null;
  const [cargoWatches, favorites, lookupHistory, notices] = await Promise.all([
    supabase ? listDashboardCargoWatches(supabase).catch(() => []) : Promise.resolve([]),
    supabase ? listUserHsFavorites(supabase, 5).catch(() => []) : Promise.resolve([]),
    supabase ? listUserHsLookupHistory(supabase, 5).catch(() => []) : Promise.resolve([]),
    supabase ? listPublishedAppNotices(supabase, 5).catch(() => []) : Promise.resolve([])
  ]);

  return <DashboardHome basisDate={basisDate} cargoWatches={cargoWatches} favorites={favorites} lookupHistory={lookupHistory} notices={notices} />;
}
