import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import {
  tradeNewsCategories,
  tradeNewsSources,
  type TradeNewsCategory,
  type TradeNewsItem
} from "@/server/services/trade-news.service";

function formatDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(date);
}

function categoryItems(items: TradeNewsItem[], category: TradeNewsCategory) {
  return items.filter((item) => item.category === category);
}

function sourceTypeLabel(type: TradeNewsItem["sourceType"]) {
  if (type === "rss") return "RSS";
  if (type === "official-page") return "공식 페이지";
  if (type === "openapi") return "공공데이터 API";
  if (type === "paid-api") return "유료 API";
  return "API 필요";
}

function NewsRow({ item }: { item: TradeNewsItem }) {
  return (
    <details className="group border-b border-slate-100 last:border-b-0">
      <summary className="grid cursor-pointer list-none gap-2 px-4 py-3 text-sm hover:bg-slate-50 md:grid-cols-[120px_1fr_120px_90px] md:items-center">
        <div className="flex items-center gap-2">
          <Badge tone={item.status === "live" ? "info" : "neutral"}>{item.status === "live" ? "수집" : "대기"}</Badge>
          <span className="text-xs font-medium text-slate-500">{item.source}</span>
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-950">{item.title}</p>
          <p className="mt-1 truncate text-xs text-slate-500 md:hidden">{item.summary}</p>
        </div>
        <span className="text-xs text-slate-500">{formatDate(item.publishedAt)}</span>
        <span className="text-xs font-semibold text-slate-500 group-open:text-blue-700">펼쳐보기</span>
      </summary>
      <div className="grid gap-3 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-700">
        <p>{item.summary}</p>
        <dl className="grid gap-2 rounded-md border border-slate-200 bg-white p-3 sm:grid-cols-[110px_1fr]">
          <dt className="font-semibold text-slate-500">출처</dt>
          <dd>{item.source}</dd>
          <dt className="font-semibold text-slate-500">수집 방식</dt>
          <dd>{sourceTypeLabel(item.sourceType)}</dd>
          <dt className="font-semibold text-slate-500">신뢰도</dt>
          <dd>{item.reliability}</dd>
        </dl>
        <a
          className="focus-ring inline-flex w-fit items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          href={item.url}
          rel="noreferrer"
          target="_blank"
        >
          원문 열기
          <ExternalLink aria-hidden="true" size={13} />
        </a>
      </div>
    </details>
  );
}

export function TradeNewsPanel({ items }: { items: TradeNewsItem[] }) {
  return (
    <div className="grid gap-5">
      <Card>
        <CardHeader
          title="추천 출처"
          description="무역 실무에 직접 영향을 줄 수 있는 공식 출처와 보조 출처를 구분했습니다."
        />
        <CardBody>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left text-sm">
              <thead className="border-y border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500">
                <tr>
                  <th className="px-3 py-2">구분</th>
                  <th className="px-3 py-2">출처</th>
                  <th className="px-3 py-2">활용 방식</th>
                  <th className="px-3 py-2">신뢰도</th>
                  <th className="px-3 py-2">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tradeNewsSources.map((source) => (
                  <tr key={source.name}>
                    <td className="px-3 py-2 text-slate-600">
                      {tradeNewsCategories.find((category) => category.key === source.category)?.label}
                    </td>
                    <td className="px-3 py-2 font-semibold text-slate-950">{source.name}</td>
                    <td className="px-3 py-2 text-slate-700">{source.description}</td>
                    <td className="px-3 py-2 text-slate-700">{source.reliability}</td>
                    <td className="px-3 py-2">
                      <Badge tone={source.status === "live" ? "info" : "neutral"}>{source.status === "live" ? "수집 중" : "연동 예정"}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-4">
        {tradeNewsCategories.map((category) => {
          const rows = categoryItems(items, category.key);

          return (
            <Card key={category.key}>
              <CardHeader title={category.label} description={category.description} />
              <CardBody>
                {rows.length ? (
                  <div className="overflow-hidden rounded-md border border-slate-200">
                    <div className="hidden border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-500 md:grid md:grid-cols-[120px_1fr_120px_90px]">
                      <span>출처</span>
                      <span>제목</span>
                      <span>게시일</span>
                      <span>상세</span>
                    </div>
                    {rows.map((item) => (
                      <NewsRow item={item} key={item.id} />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-md border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                    현재 표시할 글이 없습니다.
                  </div>
                )}
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
