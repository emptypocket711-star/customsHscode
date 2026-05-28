import { PageHeading } from "@/components/page-heading";
import { TradeNewsPanel } from "@/features/trade-news/trade-news-panel";
import { getTradeNewsDictionary } from "@/lib/i18n";
import { getRequestLocale, resolveUserLocale } from "@/lib/i18n/server";
import { createSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase/server";
import { loadTradeNewsItems } from "@/server/services/trade-news.service";

export const revalidate = 1800;

export default async function TradeNewsPage() {
  const items = await loadTradeNewsItems();
  const requestLocale = await getRequestLocale();
  let locale = requestLocale;

  if (hasSupabaseEnv()) {
    try {
      const supabase = await createSupabaseServerClient();
      const user = (await supabase.auth.getUser()).data.user;
      locale = user?.id ? await resolveUserLocale(user.id) : requestLocale;
    } catch {
      locale = requestLocale;
    }
  }

  const dictionary = getTradeNewsDictionary(locale);

  return (
    <>
      <PageHeading
        title={dictionary.page.title}
        description={dictionary.page.description}
      />
      <TradeNewsPanel dictionary={dictionary} items={items} />
    </>
  );
}
