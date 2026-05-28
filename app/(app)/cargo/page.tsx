import { PageHeading } from "@/components/page-heading";
import { CargoTrackingPanel, type CargoWatchListItem } from "@/features/cargo/cargo-tracking-panel";
import { getCargoDictionary } from "@/lib/i18n";
import { getRequestLocale, resolveUserLocale } from "@/lib/i18n/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function loadCargoWatches(): Promise<CargoWatchListItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("cargo_watch_requests")
    .select("id,cargo_management_no,master_bl_no,house_bl_no,bl_year,target_status,notify_email,status,last_status,last_checked_at,created_at")
    .order("created_at", { ascending: false })
    .limit(20);

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

export default async function CargoPage() {
  const supabase = await createSupabaseServerClient();
  const requestLocale = await getRequestLocale();
  const [
    {
      data: { user }
    },
    watches
  ] = await Promise.all([
    supabase.auth.getUser(),
    loadCargoWatches()
  ]);
  const locale = user?.id ? await resolveUserLocale(user.id) : requestLocale;
  const dictionary = getCargoDictionary(locale);

  return (
    <>
      <PageHeading
        title={dictionary.page.title}
        description={dictionary.page.description}
      />
      <CargoTrackingPanel defaultNotifyEmail={user?.email ?? null} dictionary={dictionary} watches={watches} />
    </>
  );
}
