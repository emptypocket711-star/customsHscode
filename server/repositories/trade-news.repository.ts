import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { TradeNewsItem } from "@/server/services/trade-news.service";

type TradeNewsRow = {
  category: TradeNewsItem["category"];
  source: string;
  source_type: TradeNewsItem["sourceType"];
  title: string;
  summary: string;
  url: string;
  published_at: string | null;
  published_label: string | null;
  country_name: string | null;
  reliability: TradeNewsItem["reliability"];
  status: TradeNewsItem["status"];
  content_hash: string;
};

function parsePublishedAt(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function tradeNewsContentHash(item: Pick<TradeNewsItem, "source" | "title" | "url" | "publishedAt">) {
  return createHash("sha256")
    .update([item.source, item.url, item.title, item.publishedAt ?? ""].join("|"))
    .digest("hex");
}

function toRow(item: TradeNewsItem): TradeNewsRow {
  return {
    category: item.category,
    source: item.source,
    source_type: item.sourceType,
    title: item.title,
    summary: item.summary,
    url: item.url,
    published_at: parsePublishedAt(item.publishedAt),
    published_label: item.publishedAt,
    country_name: item.countryName ?? null,
    reliability: item.reliability,
    status: item.status,
    content_hash: tradeNewsContentHash(item)
  };
}

function fromRow(row: TradeNewsRow & { id: string; collected_at?: string | null }): TradeNewsItem {
  return {
    id: row.id,
    category: row.category,
    source: row.source,
    sourceType: row.source_type,
    title: row.title,
    summary: row.summary,
    url: row.url,
    publishedAt: row.published_at ?? row.published_label,
    countryName: row.country_name,
    reliability: row.reliability,
    status: row.status
  };
}

export async function listStoredTradeNewsItems(supabase: SupabaseClient, limit = 120): Promise<TradeNewsItem[]> {
  const { data, error } = await supabase
    .from("trade_news_items")
    .select("id,category,source,source_type,title,summary,url,published_at,published_label,country_name,reliability,status,content_hash,collected_at")
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("collected_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return ((data ?? []) as Array<TradeNewsRow & { id: string; collected_at?: string | null }>).map(fromRow);
}

export async function upsertTradeNewsItems(supabase: SupabaseClient, items: TradeNewsItem[]) {
  const liveItems = items.filter((item) => item.status === "live" && item.title && item.url);
  if (!liveItems.length) return { upserted: 0 };

  const { error } = await supabase
    .from("trade_news_items")
    .upsert(liveItems.map(toRow), {
      onConflict: "content_hash",
      ignoreDuplicates: false
    });

  if (error) throw error;
  return { upserted: liveItems.length };
}
