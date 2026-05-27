import { PageHeading } from "@/components/page-heading";
import { TradeNewsPanel } from "@/features/trade-news/trade-news-panel";
import { loadTradeNewsItems } from "@/server/services/trade-news.service";

export const revalidate = 1800;

export default async function TradeNewsPage() {
  const items = await loadTradeNewsItems();

  return (
    <>
      <PageHeading
        title="무역 뉴스"
        description="관세, 통관, 통상, 공급망, 국제통상 뉴스를 공식 출처 중심으로 모아봅니다."
      />
      <TradeNewsPanel items={items} />
    </>
  );
}
