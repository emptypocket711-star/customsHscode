import { DashboardHome } from "@/features/dashboard/dashboard-home";
import { getSeoulDateString } from "@/lib/utils";
import { loadDashboardStats } from "@/server/rules/dashboard-metrics.service";

export default async function DashboardPage() {
  const basisDate = getSeoulDateString();
  const stats = await loadDashboardStats(basisDate);

  return <DashboardHome basisDate={basisDate} stats={stats} />;
}
