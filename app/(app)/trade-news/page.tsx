import { PageHeading } from "@/components/page-heading";
import { TradeNewsPanel } from "@/features/trade-news/trade-news-panel";
import { getTradeNewsDictionary } from "@/lib/i18n";
import { resolveCurrentUserLocale } from "@/lib/i18n/server";
import { loadTradeNewsItems } from "@/server/services/trade-news.service";

export const revalidate = 1800;

export default async function TradeNewsPage() {
  const items = await loadTradeNewsItems();
  const locale = await resolveCurrentUserLocale();
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
