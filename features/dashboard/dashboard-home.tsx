import Link from "next/link";
import { Bell, Clock3, Search, Star, type LucideIcon } from "lucide-react";
import { DashboardNoticeCard } from "@/features/dashboard/dashboard-notice-card";
import { DashboardWorkflowLinks } from "@/features/dashboard/dashboard-workflow-links";
import { destinationCountryOptions } from "@/features/export-diagnosis/country-options";
import { formatHsCode } from "@/lib/hs-code";
import type { CargoWatchListItem } from "@/features/cargo/cargo-tracking-panel";
import type { AppNotice } from "@/server/repositories/app-notice.repository";
import type { HsFavoriteItem } from "@/server/repositories/hs-favorite.repository";
import type { HsLookupHistoryItem } from "@/server/repositories/hs-lookup-history.repository";

const quickExamples = [
  { label: "3401.30-0000", href: "/hs/direct?query=3401.30-0000&direction=import&destinationCountry=ALL" },
  { label: "작업용 조끼", href: "/hs/direct?query=%EC%9E%91%EC%97%85%EC%9A%A9%20%EC%A1%B0%EB%81%BC&direction=import&destinationCountry=ALL" },
  { label: "graceday hand cream", href: "/hs/direct?query=graceday%20hand%20cream&direction=import&destinationCountry=ALL" }
];

function displayLookupTitle(query: string) {
  const digits = query.replace(/\D/g, "");
  return digits.length === 10 ? formatHsCode(digits) : query;
}

function displayLookupMeta(item: HsLookupHistoryItem) {
  const direction = item.direction === "export" ? "수출" : "수입";
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

export function DashboardHome({
  basisDate,
  cargoWatches,
  favorites,
  lookupHistory,
  notices
}: {
  basisDate: string;
  cargoWatches: CargoWatchListItem[];
  favorites: HsFavoriteItem[];
  lookupHistory: HsLookupHistoryItem[];
  notices: AppNotice[];
}) {
  return (
    <div className="grid gap-4">
      <section className="overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] shadow-[var(--shadow-panel)]">
        <div className="border-b border-[var(--border-subtle)] bg-[var(--surface-raised)] px-4 py-5 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-[var(--text-muted)]">조회 기준일 {basisDate}</span>
              </div>
              <h1 className="mt-4 text-2xl font-semibold tracking-normal text-[var(--text-primary)] sm:text-3xl">
                대시보드
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">
                자주 쓰는 메뉴, 공지사항, 즐겨찾기와 최근 검색 기록을 한 곳에서 확인합니다.
              </p>
            </div>
            <div className="rounded-md border border-[var(--border-subtle)] bg-white px-4 py-3 text-sm font-semibold text-[var(--text-primary)] shadow-sm">
              {new Intl.DateTimeFormat("ko-KR", {
                timeZone: "Asia/Seoul",
                year: "numeric",
                month: "long",
                day: "numeric",
                weekday: "short"
              }).format(new Date(`${basisDate}T00:00:00+09:00`))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-4 sm:p-6">
          <form action="/hs/direct" className="rounded-lg border border-[var(--border-subtle)] bg-white p-4 shadow-sm" method="get">
            <input defaultValue={basisDate} name="basisDate" type="hidden" />
            <div className="flex gap-6 border-b border-[var(--border-subtle)] text-sm font-semibold text-[var(--text-secondary)]">
              <span className="border-b-2 border-blue-700 px-2 pb-3 text-blue-700">HS CODE 직접 검색</span>
              <span className="px-2 pb-3">품명 검색 AI</span>
              <Link className="px-2 pb-3 hover:text-blue-700" href="/hs/overseas">해외 HS 검색</Link>
            </div>
            <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(280px,1fr)_160px_220px_120px] lg:items-end">
              <label className="grid min-w-0 gap-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">검색어</span>
                <div className="relative">
                  <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    className="focus-ring h-12 w-full rounded-md border border-[var(--border-strong)] bg-white pl-10 pr-3 text-base font-medium text-[var(--text-primary)] shadow-sm placeholder:text-slate-400"
                    name="query"
                    placeholder="예: 3304.99-1000, mushroom powder, 레이니 키보드"
                    type="text"
                  />
                </div>
              </label>
              <label className="grid min-w-0 gap-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">조회 구분</span>
                <select className="focus-ring h-12 w-full rounded-md border border-[var(--border-strong)] bg-white px-3 text-base font-semibold text-[var(--text-primary)] shadow-sm" defaultValue="import" name="direction">
                  <option value="import">수입</option>
                  <option value="export">수출</option>
                </select>
              </label>
              <label className="grid min-w-0 gap-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">수입국가/목적국</span>
                <select className="focus-ring h-12 w-full rounded-md border border-[var(--border-strong)] bg-white px-3 text-base font-semibold text-[var(--text-primary)] shadow-sm" defaultValue="ALL" name="destinationCountry">
                  {destinationCountryOptions.map((country) => (
                    <option key={country.code} value={country.code}>{country.label}</option>
                  ))}
                </select>
              </label>
              <button className="focus-ring inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[var(--brand-solid)] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--brand-solid-hover)]" type="submit">
                <Search aria-hidden="true" size={18} />
                조회
              </button>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-[var(--text-muted)]">인기 검색어</span>
              {quickExamples.map((item) => (
                <Link
                  className="focus-ring rounded-full border border-[var(--border-subtle)] bg-[var(--surface-muted)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800"
                  data-navigation-progress="인기검색어 조회"
                  href={item.href}
                  key={item.href}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </form>
        </div>
      </section>

      <DashboardWorkflowLinks />

      <section className="grid gap-5 lg:grid-cols-3">
        <DashboardNoticeCard notices={notices} />
        <DashboardListCard
          emptyText="작동 중인 적하목록 감시가 없습니다."
          icon={Bell}
          items={cargoWatches.map((watch) => ({
            href: "/cargo",
            title: watch.houseBlNo || watch.masterBlNo || watch.cargoManagementNo || "-",
            subtitle: `${watch.targetStatus} 도달 알림 · 현재 ${watch.lastStatus || "확인 전"}`,
            meta: watch.status === "active" ? "감시중" : watch.status
          }))}
          title="적하목록 알림 감시"
        />
        <DashboardListCard
          emptyText="아직 즐겨찾기한 HS CODE가 없습니다."
          icon={Star}
          items={favorites.map((favorite) => ({
            href: `/hs/direct?query=${favorite.hskCode}&direction=import&destinationCountry=ALL&basisDate=${favorite.basisDate ?? basisDate}`,
            title: formatHsCode(favorite.hskCode),
            subtitle: favorite.displayName ?? "저장한 HS CODE",
            meta: favorite.basisDate ?? basisDate
          }))}
          title="즐겨찾기 HS CODE"
        />
        <DashboardListCard
          icon={Clock3}
          emptyText="아직 저장된 최근 검색이 없습니다."
          items={lookupHistory.map((item) => ({
            href: lookupHistoryHref(item),
            title: displayLookupTitle(item.query),
            subtitle: displayLookupMeta(item),
            meta: item.basisDate
          }))}
          title="최근 검색"
        />
      </section>
    </div>
  );
}

function DashboardListCard({
  emptyText,
  icon: Icon,
  items,
  title
}: {
  emptyText?: string;
  icon: LucideIcon;
  items: { href: string; title: string; subtitle: string; meta: string }[];
  title: string;
}) {
  return (
    <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] shadow-[var(--shadow-panel)]">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-4">
        <div className="flex items-center gap-2">
          <Icon aria-hidden="true" className="text-blue-700" size={18} />
          <h2 className="text-base font-semibold text-[var(--text-primary)]">{title}</h2>
        </div>
      </div>
      <div className="divide-y divide-[var(--border-subtle)] px-4">
        {items.length ? items.map((item) => (
          <Link className="focus-ring flex items-center justify-between gap-3 py-3 text-sm" href={item.href} key={`${item.title}-${item.subtitle}`}>
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
