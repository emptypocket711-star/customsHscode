import Link from "next/link";
import {
  ArrowRight,
  Bookmark,
  Calculator,
  ClipboardList,
  Clock3,
  FileSearch,
  Globe2,
  Layers3,
  Megaphone,
  Search,
  ShieldCheck,
  Star,
  type LucideIcon
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SourceFooter } from "@/components/ui/source-footer";
import { destinationCountryOptions } from "@/features/export-diagnosis/country-options";
import { formatHsCode } from "@/lib/hs-code";
import type { AppNotice } from "@/server/repositories/app-notice.repository";
import type { HsFavoriteItem } from "@/server/repositories/hs-favorite.repository";
import type { HsLookupHistoryItem } from "@/server/repositories/hs-lookup-history.repository";

type DashboardStat = {
  label: string;
  value: string;
  note: string;
};

const workflowLinks = [
  {
    href: "/hs/direct",
    title: "통합 조회",
    description: "HS CODE, 품명, 관세율, 수출입요건을 한 화면에서 비교",
    icon: FileSearch,
    tone: "blue"
  },
  {
    href: "/hs/overseas",
    title: "해외 HS CODE조회",
    description: "목적국 기준 품목번호, 관세율, 내국세, 수입요건 확인",
    icon: Globe2,
    tone: "emerald"
  },
  {
    href: "/duty-estimator",
    title: "예상 납세액 계산",
    description: "HS CODE 10자리 기준 관세·부가세 계산 흐름",
    icon: Calculator,
    tone: "slate"
  }
];

const statIcons = [Search, Bookmark, FileSearch, Calculator];

const quickExamples = [
  { label: "3401.30-0000", href: "/hs/direct?query=3401.30-0000&direction=import&destinationCountry=ALL" },
  { label: "작업용 조끼", href: "/hs/direct?query=%EC%9E%91%EC%97%85%EC%9A%A9%20%EC%A1%B0%EB%81%BC&direction=import&destinationCountry=ALL" },
  { label: "graceday hand cream", href: "/hs/direct?query=graceday%20hand%20cream&direction=import&destinationCountry=ALL" }
];

const comparisonSteps = [
  { title: "후보 정리", body: "품명·모델명·오타·HS 힌트를 AI가 4자리/6자리 후보로 정규화합니다." },
  { title: "세율 비교", body: "기본·WTO·FTA·목적국 세율을 국가 선택 기준으로 좁혀 보여줍니다." },
  { title: "요건 확인", body: "세관장확인, 수출요건, 기관별 요건을 품목번호 기준으로 연결합니다." }
];

const noticeCategoryLabels: Record<AppNotice["category"], string> = {
  notice: "공지",
  maintenance: "점검",
  data_update: "자료 업데이트",
  release: "기능 배포"
};

function toneClass(tone: string) {
  if (tone === "emerald") return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  if (tone === "blue") return "bg-blue-50 text-blue-700 ring-blue-100";
  return "bg-slate-100 text-slate-700 ring-slate-200";
}

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

function formatNoticeDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Seoul"
  }).format(new Date(value));
}

export function DashboardHome({
  basisDate,
  favorites,
  lookupHistory,
  notices,
  stats
}: {
  basisDate: string;
  favorites: HsFavoriteItem[];
  lookupHistory: HsLookupHistoryItem[];
  notices: AppNotice[];
  stats: DashboardStat[];
}) {
  return (
    <div className="grid gap-4">
      <section className="overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] shadow-[var(--shadow-panel)]">
        <div className="border-b border-[var(--border-subtle)] bg-[var(--surface-raised)] px-4 py-5 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="info">2026년형 전문 관세 SaaS</Badge>
                <span className="text-xs font-medium text-[var(--text-muted)]">기준일 {basisDate}</span>
              </div>
              <h1 className="mt-4 text-2xl font-semibold tracking-normal text-[var(--text-primary)] sm:text-3xl">
                안녕하세요, HS FINDER입니다.
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">
                HS CODE, 품명, 국가 정보를 기준으로 관세율과 수출입요건을 빠르게 조회하고 비교합니다.
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
          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {stats.slice(0, 4).map((stat, index) => {
              const Icon = statIcons[index] ?? FileSearch;
              return (
                <div className="rounded-lg border border-[var(--border-subtle)] bg-white p-4 shadow-sm" key={stat.label}>
                  <div className="flex items-center gap-3">
                    <span className={`grid size-11 place-items-center rounded-lg ring-1 ${index === 0 ? "bg-violet-50 text-violet-700 ring-violet-100" : index === 1 ? "bg-blue-50 text-blue-700 ring-blue-100" : index === 2 ? "bg-emerald-50 text-emerald-700 ring-emerald-100" : "bg-orange-50 text-orange-700 ring-orange-100"}`}>
                      <Icon aria-hidden="true" size={21} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[var(--text-muted)]">{stat.label}</p>
                      <p className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">{stat.value}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-[var(--text-secondary)]">{stat.note}</p>
                </div>
              );
            })}
          </section>

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

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] shadow-[var(--shadow-panel)]">
          <div className="border-b border-[var(--border-subtle)] px-5 py-4">
            <div className="flex items-center gap-2">
              <Layers3 aria-hidden="true" className="text-blue-700" size={18} />
              <h2 className="text-base font-semibold text-[var(--text-primary)]">업무 진입</h2>
            </div>
          </div>
          <div className="grid gap-3 p-4 lg:grid-cols-3">
            {workflowLinks.map((workflow) => {
              const Icon = workflow.icon;
              return (
                <Link className="focus-ring group grid min-h-[148px] gap-3 rounded-lg border border-[var(--border-subtle)] bg-white p-4 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md" href={workflow.href} key={workflow.href}>
                  <span className={`grid size-10 place-items-center rounded-md ring-1 ${toneClass(workflow.tone)}`}>
                    <Icon aria-hidden="true" size={19} />
                  </span>
                  <span>
                    <span className="block font-semibold text-[var(--text-primary)]">{workflow.title}</span>
                    <span className="mt-1 block text-sm leading-5 text-[var(--text-secondary)]">{workflow.description}</span>
                  </span>
                  <span className="mt-auto inline-flex items-center gap-1 text-xs font-semibold text-blue-700">
                    열기
                    <ArrowRight aria-hidden="true" className="transition group-hover:translate-x-0.5" size={14} />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] shadow-[var(--shadow-panel)]">
          <div className="border-b border-[var(--border-subtle)] px-5 py-4">
            <div className="flex items-center gap-2">
              <ClipboardList aria-hidden="true" className="text-blue-700" size={18} />
              <h2 className="text-base font-semibold text-[var(--text-primary)]">결과 비교 흐름</h2>
            </div>
          </div>
          <div className="grid gap-3 p-4">
            {comparisonSteps.map((step, index) => (
              <div className="grid grid-cols-[32px_1fr] gap-3" key={step.title}>
                <span className="grid size-8 place-items-center rounded-md bg-[var(--surface-muted)] text-xs font-bold text-blue-700">{index + 1}</span>
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{step.title}</p>
                  <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">{step.body}</p>
                </div>
              </div>
            ))}
            <div className="mt-2 rounded-md border border-blue-100 bg-blue-50 p-3">
              <div className="flex items-start gap-2">
                <ShieldCheck aria-hidden="true" className="mt-0.5 shrink-0 text-blue-700" size={16} />
                <p className="text-xs leading-5 text-blue-900">사용자 화면은 조회 정보를 중심으로 표시하고, 판단이 필요한 경우에는 보완 질문과 후보 비교를 제공합니다.</p>
              </div>
            </div>
            <SourceFooter />
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <DashboardNoticeCard notices={notices} />
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

function DashboardNoticeCard({ notices }: { notices: AppNotice[] }) {
  return (
    <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] shadow-[var(--shadow-panel)]">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-4">
        <div className="flex items-center gap-2">
          <Megaphone aria-hidden="true" className="text-blue-700" size={18} />
          <h2 className="text-base font-semibold text-[var(--text-primary)]">공지사항</h2>
        </div>
      </div>
      <div className="divide-y divide-[var(--border-subtle)] px-4">
        {notices.length ? notices.map((notice) => (
          <article className="py-3" key={notice.id}>
            <div className="flex flex-wrap items-center gap-2">
              {notice.pinned ? <Badge tone="info">상단</Badge> : null}
              <Badge tone={notice.category === "maintenance" ? "warning" : notice.category === "release" ? "success" : "neutral"}>
                {noticeCategoryLabels[notice.category]}
              </Badge>
              <span className="text-xs font-medium text-[var(--text-muted)]">{formatNoticeDate(notice.publishedAt)}</span>
            </div>
            <h3 className="mt-2 text-sm font-semibold text-[var(--text-primary)]">{notice.title}</h3>
            <p className="mt-1 line-clamp-2 whitespace-pre-line text-xs leading-5 text-[var(--text-secondary)]">{notice.body}</p>
          </article>
        )) : (
          <div className="py-6 text-sm text-[var(--text-secondary)]">등록된 공지사항이 없습니다.</div>
        )}
      </div>
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
