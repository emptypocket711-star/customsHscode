import { PageHeading } from "@/components/page-heading";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CargoTrackingPanel, type CargoWatchListItem } from "@/features/cargo/cargo-tracking-panel";

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
  const [
    {
      data: { user }
    },
    watches
  ] = await Promise.all([
    supabase.auth.getUser(),
    loadCargoWatches()
  ]);

  return (
    <>
      <PageHeading
        title="적하목록 조회"
        description="화물통관진행정보를 조회하고 원하는 상태가 확인되면 이메일 알림을 받을 수 있습니다."
      />
      <CargoTrackingPanel defaultNotifyEmail={user?.email ?? null} watches={watches} />
    </>
  );
}
