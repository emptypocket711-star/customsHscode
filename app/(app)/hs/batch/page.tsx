import { HsBatchLookupPanel } from "@/features/hs-batch/hs-batch-lookup-panel";
import { createSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase/server";
import { getSeoulDateString } from "@/lib/utils";
import { listRecentHsBatchLookupJobs } from "@/server/repositories/background-job.repository";

async function loadRecentQueuedJobs() {
  if (!hasSupabaseEnv()) return [];

  try {
    const supabase = await createSupabaseServerClient();
    return listRecentHsBatchLookupJobs(supabase, 8);
  } catch {
    return [];
  }
}

export default async function HsBatchLookupPage() {
  const recentQueuedJobs = await loadRecentQueuedJobs();
  return <HsBatchLookupPanel basisDate={getSeoulDateString()} recentQueuedJobs={recentQueuedJobs} />;
}
