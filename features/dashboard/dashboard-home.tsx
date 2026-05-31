import Link from "next/link";
import { Bell, Clock3, Search, Star, type LucideIcon } from "lucide-react";
import { DashboardNoticeCard } from "@/features/dashboard/dashboard-notice-card";
import { DashboardWorkflowLinks } from "@/features/dashboard/dashboard-workflow-links";
import { destinationCountryOptions } from "@/features/export-diagnosis/country-options";
import { cargoWatchStatusDisplay } from "@/lib/cargo-watch-status";
import { formatHsCode } from "@/lib/hs-code";
import { getDashboardDictionary, type AppLocale } from "@/lib/i18n";
import type { CargoWatchListItem } from "@/features/cargo/cargo-tracking-panel";
import type { AppNotice } from "@/server/repositories/app-notice.repository";
import type { HsFavoriteItem } from "@/server/repositories/hs-favorite.repository";
import type { HsLookupHistoryItem } from "@/server/repositories/hs-lookup-history.repository";

function displayLookupTitle(query: string) {
  const digits = query.replace(/\D/g, "");
  return digits.length === 10 ? formatHsCode(digits) : query;
}

function displayLookupMeta(item: HsLookupHistoryItem, dictionary: ReturnType<typeof getDashboardDictionary>) {
  const direction = item.direction === "export" ? dictionary.lists.history.export : dictionary.lists.history.import;
  return `${direction} · ${item.destinationCountry}`;
}

function lookupHistoryHref(item: HsLookupHistoryItem) {
  const params = new URLSearchParams({
    query: item.query,
    direction: item.direction,
    destinationCountry: item.destinationCountry,
    basisDate: item.basisDate
  });

  const path = item.direction === "export" && item.destinationCountry !== "ALL" ? "/hs/overseas" : "/hs/direct";
  return `${path}?${params.toString()}`;
}

function cargoWatchStatusLabel(status: string, dictionary: ReturnType<typeof getDashboardDictionary>) {
  const meta = dictionary.lists.cargo.meta as Record<string, string>;
  return meta[status] ?? status;
}

export function DashboardHome({
  basisDate,
  cargoWatches,
  favorites,
  locale,
  lookupHistory,
  notices
}: {
  basisDate: string;
  cargoWatches: CargoWatchListItem[];
  favorites: HsFavoriteItem[];
  locale: AppLocale;
  lookupHistory: HsLookupHistoryItem[];
  notices: AppNotice[];
}) {
  const dictionary = getDashboardDictionary(locale);
  const formattedDate = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    timeZone: "Asia/Seoul",
    weekday: "short",
    year: "numeric"
  }).format(new Date(`${basisDate}T00:00:00+09:00`));

  return (
    <div className="grid gap-4">
      <section className="overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] shadow-[var(--shadow-panel)]">
        <div className="border-b border-[var(--border-subtle)] bg-[var(--surface-raised)] px-4 py-5 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-[var(--text-muted)]">{dictionary.hero.basisDate} {basisDate}</span>
              </div>
              <h1 className="mt-4 text-2xl font-semibold tracking-normal text-[var(--text-primary)] sm:text-3xl">
                {dictionary.hero.title}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">
                {dictionary.hero.description}
              </p>
            </div>
            <div className="rounded-md border border-[var(--border-subtle)] bg-white px-4 py-3 text-sm font-semibold text-[var(--text-primary)] shadow-sm">
              {formattedDate}
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-4 sm:p-6">
          <form action="/hs/direct" className="rounded-lg border border-[var(--border-subtle)] bg-white p-4 shadow-sm" method="get">
            <input defaultValue={basisDate} name="basisDate" type="hidden" />
            <div className="flex gap-6 border-b border-[var(--border-subtle)] text-sm font-semibold text-[var(--text-secondary)]">
              <span className="border-b-2 border-blue-700 px-2 pb-3 text-blue-700">{dictionary.lookup.hsDirect}</span>
              <Link className="px-2 pb-3 hover:text-blue-700" data-navigation-progress={dictionary.lookup.overseasHs} href="/hs/overseas">{dictionary.lookup.overseasHs}</Link>
            </div>
            <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(280px,1fr)_160px_220px_120px] lg:items-end">
              <label className="grid min-w-0 gap-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">{dictionary.lookup.query}</span>
                <div className="relative">
                  <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    className="focus-ring h-12 w-full rounded-md border border-[var(--border-strong)] bg-white pl-10 pr-3 text-base font-medium text-[var(--text-primary)] shadow-sm placeholder:text-slate-400"
                    name="query"
                    placeholder={dictionary.lookup.queryPlaceholder}
                    type="text"
                  />
                </div>
              </label>
              <label className="grid min-w-0 gap-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">{dictionary.lookup.direction}</span>
                <select className="focus-ring h-12 w-full rounded-md border border-[var(--border-strong)] bg-white px-3 text-base font-semibold text-[var(--text-primary)] shadow-sm" defaultValue="import" name="direction">
                  <option value="import">{dictionary.lookup.import}</option>
                  <option value="export">{dictionary.lookup.export}</option>
                </select>
              </label>
              <label className="grid min-w-0 gap-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">{dictionary.lookup.country}</span>
                <select className="focus-ring h-12 w-full rounded-md border border-[var(--border-strong)] bg-white px-3 text-base font-semibold text-[var(--text-primary)] shadow-sm" defaultValue="ALL" name="destinationCountry">
                  {destinationCountryOptions.map((country) => (
                    <option key={country.code} value={country.code}>{country.label}</option>
                  ))}
                </select>
              </label>
              <button className="focus-ring inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[var(--brand-solid)] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--brand-solid-hover)]" type="submit">
                <Search aria-hidden="true" size={18} />
                {dictionary.lookup.submit}
              </button>
            </div>

            <p className="mt-3 text-xs leading-5 text-[var(--text-muted)]">
              HS CODE를 입력하면 직접 조회하고, 품명을 입력하면 같은 검색창에서 AI가 가장 가까운 HS CODE를 함께 찾아줍니다.
            </p>
          </form>

          <div className="rounded-lg border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
            <p className="text-sm font-semibold text-[var(--text-primary)]">{dictionary.startGuide.title}</p>
            <div className="mt-3 grid gap-2 lg:grid-cols-3">
              {dictionary.startGuide.items.map((item) => (
                <div className="flex gap-3 rounded-md border border-slate-200 bg-white px-3 py-3" key={item.label}>
                  <span className="grid size-7 shrink-0 place-items-center rounded-md bg-blue-50 text-xs font-semibold text-blue-700 ring-1 ring-blue-100">
                    {item.label}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-[var(--text-primary)]">{item.title}</span>
                    <span className="mt-1 block text-xs leading-5 text-[var(--text-secondary)]">{item.description}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <DashboardWorkflowLinks locale={locale} />

      <section className="grid gap-5 lg:grid-cols-3">
        <DashboardNoticeCard locale={locale} notices={notices} />
        <DashboardListCard
          description={dictionary.lists.favorites.description}
          emptyText={dictionary.lists.favorites.empty}
          icon={Star}
          items={favorites.map((favorite) => ({
            href: `/hs/direct?query=${favorite.hskCode}&direction=import&destinationCountry=ALL&basisDate=${favorite.basisDate ?? basisDate}`,
            title: formatHsCode(favorite.hskCode),
            subtitle: favorite.displayName ?? dictionary.lists.favorites.defaultName,
            meta: favorite.basisDate ?? basisDate
          }))}
          title={dictionary.lists.favorites.title}
        />
        <DashboardListCard
          description={dictionary.lists.history.description}
          icon={Clock3}
          emptyText={dictionary.lists.history.empty}
          items={lookupHistory.map((item) => ({
            href: lookupHistoryHref(item),
            title: displayLookupTitle(item.query),
            subtitle: displayLookupMeta(item, dictionary),
            meta: item.basisDate
          }))}
          title={dictionary.lists.history.title}
        />
        <DashboardListCard
          description={dictionary.lists.cargo.description}
          emptyText={dictionary.lists.cargo.empty}
          icon={Bell}
          items={cargoWatches.map((watch) => ({
            href: "/cargo",
            title: watch.houseBlNo || watch.masterBlNo || watch.cargoManagementNo || "-",
            subtitle: `${cargoWatchStatusDisplay(watch.targetStatus)} ${dictionary.lists.cargo.targetSuffix} · ${dictionary.lists.cargo.statusPrefix} ${watch.lastStatus || dictionary.lists.cargo.unchecked}`,
            meta: cargoWatchStatusLabel(watch.status, dictionary)
          }))}
          title={dictionary.lists.cargo.title}
        />
      </section>
    </div>
  );
}

function DashboardListCard({
  description,
  emptyText,
  icon: Icon,
  items,
  title
}: {
  description: string;
  emptyText?: string;
  icon: LucideIcon;
  items: { href: string; title: string; subtitle: string; meta: string }[];
  title: string;
}) {
  return (
    <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] shadow-[var(--shadow-panel)]">
      <div className="flex items-start justify-between gap-3 border-b border-[var(--border-subtle)] px-5 py-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Icon aria-hidden="true" className="text-blue-700" size={18} />
            <h2 className="text-base font-semibold text-[var(--text-primary)]">{title}</h2>
          </div>
          <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">{description}</p>
        </div>
        <span className="shrink-0 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-600">
          {items.length}
        </span>
      </div>
      <div className="divide-y divide-[var(--border-subtle)] px-4">
        {items.length ? items.map((item) => (
          <Link className="focus-ring flex items-center justify-between gap-3 py-3 text-sm" data-navigation-progress={item.title} href={item.href} key={`${item.title}-${item.subtitle}`}>
            <span className="min-w-0">
              <span className="block font-mono font-semibold text-blue-700">{item.title}</span>
              <span className="mt-0.5 block truncate text-xs text-[var(--text-secondary)]">{item.subtitle}</span>
            </span>
            <span className="shrink-0 text-xs text-[var(--text-muted)]">{item.meta}</span>
          </Link>
        )) : (
          <div className="py-6 text-sm text-[var(--text-secondary)]">{emptyText}</div>
        )}
      </div>
    </div>
  );
}
