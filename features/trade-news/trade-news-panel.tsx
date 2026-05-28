"use client";

import { ExternalLink, Newspaper } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { CountryComboboxField } from "@/features/hs/country-combobox-field";
import { destinationCountryOptions, exportCountryLabel } from "@/features/export-diagnosis/country-options";
import type { TradeNewsDictionary } from "@/lib/i18n";
import type { TradeNewsCategory, TradeNewsItem } from "@/server/services/trade-news.service";

const tradeNewsCategories: TradeNewsCategory[] = ["customs", "market", "government", "industry", "global", "auxiliary"];

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

function sourceTypeLabel(type: TradeNewsItem["sourceType"], dictionary: TradeNewsDictionary) {
  if (type === "rss") return dictionary.card.sourceTypes.rss;
  if (type === "official-page") return dictionary.card.sourceTypes["official-page"];
  if (type === "openapi") return dictionary.card.sourceTypes.openapi;
  if (type === "paid-api") return dictionary.card.sourceTypes["paid-api"];
  return dictionary.card.sourceTypes.future;
}

function hasHangul(value: string) {
  return /[가-힣]/.test(value);
}

function cardSummary(item: TradeNewsItem, dictionary: TradeNewsDictionary) {
  const summary = item.summary?.trim();
  if (summary && hasHangul(summary)) return summary;

  if (item.source === "WTO") {
    return dictionary.card.wtoSummary;
  }

  return dictionary.card.fallbackSummary;
}

function NewsCard({ dictionary, item }: { dictionary: TradeNewsDictionary; item: TradeNewsItem }) {
  const summary = cardSummary(item, dictionary);

  return (
    <article className="flex min-h-[240px] flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Badge tone={item.status === "live" ? "info" : "neutral"}>{item.status === "live" ? dictionary.card.collected : dictionary.card.pending}</Badge>
        {item.countryName ? <Badge tone="neutral">{item.countryName}</Badge> : null}
        <span className="text-xs font-medium text-slate-500">{formatDate(item.publishedAt)}</span>
      </div>

      <h3 className="line-clamp-2 text-base font-semibold leading-6 text-slate-950">{item.title}</h3>
      <p className="mt-3 line-clamp-5 flex-1 text-sm leading-6 text-slate-600">{summary}</p>

      <div className="mt-4 border-t border-slate-100 pt-3">
        <dl className="grid gap-1.5 text-xs text-slate-500">
          <div className="flex items-center justify-between gap-3">
            <dt>{dictionary.card.source}</dt>
            <dd className="truncate font-semibold text-slate-700">{item.source}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt>{dictionary.card.sourceMethod}</dt>
            <dd className="font-semibold text-slate-700">{sourceTypeLabel(item.sourceType, dictionary)}</dd>
          </div>
        </dl>
        <a
          className="focus-ring mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          href={item.url}
          rel="noreferrer"
          target="_blank"
        >
          {dictionary.card.openOriginal}
          <ExternalLink aria-hidden="true" size={14} />
        </a>
      </div>
    </article>
  );
}

export function TradeNewsPanel({ dictionary, items }: { dictionary: TradeNewsDictionary; items: TradeNewsItem[] }) {
  const [selectedCountry, setSelectedCountry] = useState("ALL");
  const filteredItems = useMemo(
    () => items.filter((item) => matchesCountry(item, selectedCountry)),
    [items, selectedCountry]
  );
  const selectedCountryLabel = selectedCountry === "ALL" ? dictionary.card.allCountries : countryNameFromLabel(selectedCountry);

  return (
    <div className="grid gap-5">
      <Card>
        <CardBody className="grid gap-4 md:grid-cols-[1fr_320px] md:items-end">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-blue-700">
              <Newspaper aria-hidden="true" size={16} />
              {dictionary.hero.eyebrow}
            </div>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">{dictionary.hero.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {dictionary.hero.lead}
            </p>
          </div>
          <CountryComboboxField
            defaultValue="ALL"
            direction="import"
            label={dictionary.hero.countryFilter}
            name="tradeNewsCountry"
            onChange={setSelectedCountry}
          />
        </CardBody>
      </Card>

      <div className="grid gap-4">
        {tradeNewsCategories.map((category) => {
          const rows = categoryItems(filteredItems, category);
          const categoryCopy = dictionary.categories[category];

          return (
            <Card key={category}>
              <CardHeader
                title={categoryCopy.label}
                description={`${categoryCopy.description} · ${selectedCountryLabel} ${rows.length}${dictionary.card.itemsSuffix}`}
              />
              <CardBody>
                {rows.length ? (
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {rows.map((item) => (
                      <NewsCard dictionary={dictionary} item={item} key={item.id} />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-md border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                    {dictionary.card.empty}
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
