import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { upsertTradeNewsItems } from "@/server/repositories/trade-news.repository";
import { loadLiveTradeNewsItems } from "@/server/services/trade-news.service";

export async function refreshTradeNewsCache() {
  const supabase = createSupabaseServiceRoleClient();
  const items = await loadLiveTradeNewsItems();
  const liveItems = items.filter((item) => item.status === "live");
  const result = await upsertTradeNewsItems(supabase, liveItems);

  return {
    fetched: liveItems.length,
    upserted: result.upserted
  };
}
