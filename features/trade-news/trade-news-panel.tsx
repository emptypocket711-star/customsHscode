"use client";

import { ExternalLink, Newspaper } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { CountryComboboxField } from "@/features/hs/country-combobox-field";
import { destinationCountryOptions, exportCountryLabel } from "@/features/export-diagnosis/country-options";
import type { TradeNewsCategory, TradeNewsItem } from "@/server/services/trade-news.service";

const tradeNewsCategories: Array<{ key: TradeNewsCategory; label: string; description: string }> = [
  { key: "customs", label: "관세/통관", description: "관세청 보도자료와 통관·원산지·품목분류 관련 소식" },
  { key: "market", label: "해외시장/통상", description: "KOTRA 해외시장뉴스, 통상·규제, 공급망 동향" },
  { key: "government", label: "정부 정책", description: "정부 보도자료 중 무역 실무자가 확인할 만한 발표" },
  { key: "industry", label: "산업/통상 정책", description: "산업통상부 보도자료와 통상·FTA·공급망 정책" },
  { key: "global", label: "국제통상", description: "WTO 등 국제기구의 무역 규범·분쟁·통상 뉴스" },
  { key: "auxiliary", label: "보조 뉴스", description: "뉴스 검색 API 등 보조 검색 소스" }
];

function formatDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(date);
}

function categoryItems(items: TradeNewsItem[], category: TradeNewsCategory) {
  return items.filter((item) => item.category === category);
}

function countryNameFromLabel(countryCode: string) {
  return exportCountryLabel(countryCode).replace(/\s*\([^)]*\)\s*$/, "").trim();
}

function countryFilterTokens(countryCode: string) {
  if (countryCode === "ALL") return [];
  const option = destinationCountryOptions.find((country) => country.code === countryCode || country.alias === countryCode);
  const countryName = countryNameFromLabel(countryCode);

  return Array.from(new Set([
    countryName,
    option?.label,
    option?.code,
    option?.alias,
    countryCode
  ].filter((value): value is string => Boolean(value && value !== "ALL"))));
}

function matchesCountry(item: TradeNewsItem, countryCode: string) {
  if (countryCode === "ALL") return true;
  const tokens = countryFilterTokens(countryCode);
  if (!tokens.length) return true;

  const haystack = [
    item.countryName,
    item.source,
    item.title,
    item.summary
  ].filter(Boolean).join(" ").toLowerCase();

  return tokens.some((token) => haystack.includes(token.toLowerCase()));
}

function sourceTypeLabel(type: TradeNewsItem["sourceType"]) {
  if (type === "rss") return "RSS";
  if (type === "official-page") return "공식 페이지";
  if (type === "openapi") return "공공데이터 API";
  if (type === "paid-api") return "유료 API";
  return "연동 예정";
}

function hasHangul(value: string) {
  return /[가-힣]/.test(value);
}

function cardSummary(item: TradeNewsItem) {
  const summary = item.summary?.trim();
  if (summary && hasHangul(summary)) return summary;

  if (item.source === "WTO") {
    return "WTO에서 발표한 국제통상 관련 소식입니다. 통상 규범, 협정, 분쟁, 회원국 조치와 관련된 내용일 수 있어 원문 확인이 필요합니다.";
  }

  return "해당 출처에서 수집한 무역 관련 소식입니다. 제목과 출처를 기준으로 먼저 검토한 뒤 원문에서 세부 내용을 확인해 주세요.";
}

function NewsCard({ item }: { item: TradeNewsItem }) {
  const summary = cardSummary(item);

  return (
    <article className="flex min-h-[240px] flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Badge tone={item.status === "live" ? "info" : "neutral"}>{item.status === "live" ? "수집" : "대기"}</Badge>
        {item.countryName ? <Badge tone="neutral">{item.countryName}</Badge> : null}
        <span className="text-xs font-medium text-slate-500">{formatDate(item.publishedAt)}</span>
      </div>

      <h3 className="line-clamp-2 text-base font-semibold leading-6 text-slate-950">{item.title}</h3>
      <p className="mt-3 line-clamp-5 flex-1 text-sm leading-6 text-slate-600">{summary}</p>

      <div className="mt-4 border-t border-slate-100 pt-3">
        <dl className="grid gap-1.5 text-xs text-slate-500">
          <div className="flex items-center justify-between gap-3">
            <dt>출처</dt>
            <dd className="truncate font-semibold text-slate-700">{item.source}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt>수집 방식</dt>
            <dd className="font-semibold text-slate-700">{sourceTypeLabel(item.sourceType)}</dd>
          </div>
        </dl>
        <a
          className="focus-ring mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          href={item.url}
          rel="noreferrer"
          target="_blank"
        >
          원문 열기
          <ExternalLink aria-hidden="true" size={14} />
        </a>
      </div>
    </article>
  );
}

export function TradeNewsPanel({ items }: { items: TradeNewsItem[] }) {
  const [selectedCountry, setSelectedCountry] = useState("ALL");
  const filteredItems = useMemo(
    () => items.filter((item) => matchesCountry(item, selectedCountry)),
    [items, selectedCountry]
  );
  const selectedCountryLabel = selectedCountry === "ALL" ? "모든 국가" : countryNameFromLabel(selectedCountry);

  return (
    <div className="grid gap-5">
      <Card>
        <CardBody className="grid gap-4 md:grid-cols-[1fr_320px] md:items-end">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-blue-700">
              <Newspaper aria-hidden="true" size={16} />
              무역 뉴스
            </div>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">국가별 주요 무역 이슈를 카드로 확인합니다.</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              국가를 선택하면 해당 국가명이 포함된 KOTRA·정부·국제통상 글만 모아 보여줍니다. 원문을 열기 전 제목과 짧은 요약을 먼저 확인할 수 있습니다.
            </p>
          </div>
          <CountryComboboxField
            defaultValue="ALL"
            direction="import"
            label="국가 필터"
            name="tradeNewsCountry"
            onChange={setSelectedCountry}
          />
        </CardBody>
      </Card>

      <div className="grid gap-4">
        {tradeNewsCategories.map((category) => {
          const rows = categoryItems(filteredItems, category.key);

          return (
            <Card key={category.key}>
              <CardHeader
                title={category.label}
                description={`${category.description} · ${selectedCountryLabel} 기준 ${rows.length}건`}
              />
              <CardBody>
                {rows.length ? (
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {rows.map((item) => (
                      <NewsCard item={item} key={item.id} />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-md border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                    선택한 국가와 연결된 글이 없습니다.
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
