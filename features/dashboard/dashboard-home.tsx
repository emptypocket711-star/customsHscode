import Link from "next/link";
import { ArrowRight, Bell, Building2, CheckCircle2, Clock3, FileText, Search, Ship, ShieldCheck, Star, type LucideIcon } from "lucide-react";
import { DashboardNoticeCard } from "@/features/dashboard/dashboard-notice-card";
import { DashboardWorkflowLinks } from "@/features/dashboard/dashboard-workflow-links";
import {
  getMarketplaceNotificationHref,
  marketplaceNotificationKindLabel,
  marketplaceNotificationRequestTypeLabel,
  marketplaceNotificationStatusLabel
} from "@/features/dashboard/marketplace-notification-inbox";
import { destinationCountryOptions } from "@/features/export-diagnosis/country-options";
import { cargoWatchStatusDisplay } from "@/lib/cargo-watch-status";
import { formatHsCode } from "@/lib/hs-code";
import { getDashboardDictionary, type AppLocale } from "@/lib/i18n";
import type { CargoWatchListItem } from "@/features/cargo/cargo-tracking-panel";
import type { AppNotice } from "@/server/repositories/app-notice.repository";
import type { HsFavoriteItem } from "@/server/repositories/hs-favorite.repository";
import type { HsLookupHistoryItem } from "@/server/repositories/hs-lookup-history.repository";
import type { MarketplaceNotificationInboxItem } from "@/server/repositories/marketplace-notification-deliveries.repository";
import { markMarketplaceNotificationReadAction } from "@/server/actions/marketplace-notification.actions";

export type DashboardMarketplaceSummary = {
  companyName: string | null;
  companyRole: string | null;
  partyTypes: string[];
  roleIntents: string[];
  schemaReady: boolean;
  trustScore: number;
  verificationStatus: string;
};

export type DashboardMarketplaceActivitySummary = {
  bidsReceived: number;
  clearancePartnerActionRequestId?: string | null;
  clearancePartnerActionStatus?: string | null;
  clearancePartnerActions: number;
  clearanceRequesterActionRequestId?: string | null;
  clearanceRequesterActionStatus?: string | null;
  clearanceRequesterActions: number;
  completionReportPending: number;
  completedRequests: number;
  draftRequests: number;
  feedbackPending: number;
  freightPartnerActionRequestId?: string | null;
  freightPartnerActionStatus?: string | null;
  freightPartnerActions: number;
  freightRequesterActionRequestId?: string | null;
  freightRequesterActionStatus?: string | null;
  freightRequesterActions: number;
  inProgressRequests: number;
  openRequests: number;
  partnerOpportunities: number;
  schemaReady: boolean;
  selectedRequests: number;
};

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
  marketplaceActivity,
  marketplaceNotifications,
  marketplaceSummary,
  notices
}: {
  basisDate: string;
  cargoWatches: CargoWatchListItem[];
  favorites: HsFavoriteItem[];
  locale: AppLocale;
  lookupHistory: HsLookupHistoryItem[];
  marketplaceActivity: DashboardMarketplaceActivitySummary | null;
  marketplaceNotifications: MarketplaceNotificationInboxItem[];
  marketplaceSummary: DashboardMarketplaceSummary | null;
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
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
      <section className="min-w-0 overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] shadow-[var(--shadow-panel)]">
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
              {dictionary.lookup.helper}
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

      <DashboardMarketplaceEntry
        activity={marketplaceActivity}
        dictionary={dictionary}
        notifications={marketplaceNotifications}
        summary={marketplaceSummary}
      />

      <DashboardWorkflowLinks locale={locale} />

      <section className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-3">
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

function marketplaceStatusLabel(status: string) {
  if (status === "operator_approved") return "운영자 승인";
  if (status === "recommended_partner") return "추천 파트너";
  if (status === "trade_history") return "거래 이력";
  if (status === "documents_submitted") return "서류 제출";
  if (status === "email_verified") return "이메일 인증";
  if (status === "suspended") return "숨김/정지";
  if (status === "blocked") return "차단";
  return "미검증";
}

function marketplaceStatusClass(status: string) {
  if (status === "operator_approved" || status === "recommended_partner" || status === "trade_history") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (status === "suspended" || status === "blocked") return "border-amber-200 bg-amber-50 text-amber-900";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function partyTypeLabel(partyType: string) {
  if (partyType === "forwarder") return "포워더";
  if (partyType === "customs_broker") return "관세사";
  if (partyType === "foreign_shipper") return "해외 수출입 파트너";
  if (partyType === "domestic_shipper") return "국내 수출입 화주";
  return partyType;
}

function dictionaryValue(values: Record<string, string>, key: string, fallback: string) {
  return values[key] ?? fallback;
}

function isVerifiedMarketplaceStatus(status: string) {
  return status === "operator_approved" || status === "recommended_partner" || status === "trade_history";
}

function hasMarketplaceWork(activity: DashboardMarketplaceActivitySummary | null) {
  return Boolean(
    (activity?.freightRequesterActions ?? 0) > 0 ||
    (activity?.clearanceRequesterActions ?? 0) > 0 ||
    (activity?.freightPartnerActions ?? 0) > 0 ||
    (activity?.clearancePartnerActions ?? 0) > 0
  );
}

function requesterActionHref(requestType: "clearance" | "freight", requestId?: string | null, status?: string | null) {
  const basePath = `/requests/${requestType}`;
  if (!requestId) return `${basePath}?workspace=requester`;
  if (status === "completed") return `${basePath}/${requestId}#request-completion`;
  if (status === "partner_selected" || status === "in_progress") return `${basePath}/${requestId}#request-lifecycle`;
  if (status === "draft") return `${basePath}/${requestId}#request-draft-form`;
  return `${basePath}/${requestId}#request-bids`;
}

function partnerActionHref(requestType: "clearance" | "freight", requestId?: string | null, status?: string | null) {
  const workspace = requestType === "freight" ? "forwarder" : "broker";
  const basePath = `/requests/${requestType}`;
  if (!requestId) return `${basePath}?workspace=${workspace}`;
  if (status === "partner_selected" || status === "in_progress") return `${basePath}/opportunities/${requestId}#request-lifecycle`;
  return `${basePath}/opportunities/${requestId}#opportunity-bid`;
}

export function buildMarketplaceNextActions(
  activity: DashboardMarketplaceActivitySummary | null,
  summary: DashboardMarketplaceSummary | null
) {
  const status = summary?.verificationStatus ?? "unverified";
  const partyTypes = summary?.partyTypes ?? [];
  const roleIntents = summary?.roleIntents ?? [];
  const actions: Array<{
    count: number;
    description: string;
    href: string;
    label: string;
    priority: number;
    title: string;
  }> = [
    {
      count: activity?.freightRequesterActions ?? 0,
      description: "운송 요청의 견적 비교, 업체 선정, 진행 상태, 완료 리포트와 피드백을 처리합니다.",
      href: requesterActionHref("freight", activity?.freightRequesterActionRequestId, activity?.freightRequesterActionStatus),
      label: "화주 업무",
      priority: 10,
      title: "내 운송 요청 처리"
    },
    {
      count: activity?.clearanceRequesterActions ?? 0,
      description: "통관 의뢰의 견적 비교, 업체 선정, 진행 상태, 완료 리포트와 피드백을 처리합니다.",
      href: requesterActionHref("clearance", activity?.clearanceRequesterActionRequestId, activity?.clearanceRequesterActionStatus),
      label: "화주 업무",
      priority: 9,
      title: "내 통관 의뢰 처리"
    },
    {
      count: activity?.freightPartnerActions ?? 0,
      description: "매칭된 운송 요청의 견적 제출, 선정 후 진행, 완료 전환 업무를 처리합니다.",
      href: partnerActionHref("freight", activity?.freightPartnerActionRequestId, activity?.freightPartnerActionStatus),
      label: "파트너 업무",
      priority: 8,
      title: "운송 파트너 업무 확인"
    },
    {
      count: activity?.clearancePartnerActions ?? 0,
      description: "매칭된 통관 요청의 견적 제출, 선정 후 진행, 완료 전환 업무를 처리합니다.",
      href: partnerActionHref("clearance", activity?.clearancePartnerActionRequestId, activity?.clearancePartnerActionStatus),
      label: "파트너 업무",
      priority: 7,
      title: "통관 파트너 업무 확인"
    }
  ];

  const prioritized = actions
    .filter((action) => action.count > 0)
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 3);

  return prioritized.length ? prioritized : [
    ...(!partyTypes.length ? [
      {
        count: 0,
        description: roleIntents.length
          ? "가입 시 선택한 역할은 확인됩니다. 운영자 승인 전에는 입찰·요청 권한이 부여되지 않습니다."
          : "회사 설정에서 화주, 포워더, 관세사무소, 해외 파트너 중 필요한 역할을 먼저 지정합니다.",
        href: "/settings/members",
        label: roleIntents.length ? "역할 대기" : "역할 설정",
        priority: 3,
        title: roleIntents.length ? "플랫폼 역할 승인 대기" : "플랫폼 역할 설정"
      }
    ] : []),
    ...(!isVerifiedMarketplaceStatus(status) ? [
      {
        count: 0,
        description: "운영자 승인 전에는 요청 공개와 입찰 노출이 제한될 수 있으므로 회사 검증 상태를 확인합니다.",
        href: "/settings/members",
        label: "검증 확인",
        priority: 3,
        title: "회사 검증 상태 확인"
      }
    ] : []),
    {
      count: 0,
      description: "운송 조건을 정리하고 검증 포워더에게 견적을 요청합니다.",
      href: "/requests/freight",
      label: "요청 시작",
      priority: 1,
      title: "운송 견적 요청 생성"
    },
    {
      count: 0,
      description: "HSK, FTA, 요건 검토 범위를 정리하고 관세사무소 견적을 요청합니다.",
      href: "/requests/clearance",
      label: "의뢰 시작",
      priority: 1,
      title: "통관 의뢰 요청 생성"
    }
  ];
}

function DashboardMarketplaceEntry({
  activity,
  dictionary,
  notifications,
  summary
}: {
  activity: DashboardMarketplaceActivitySummary | null;
  dictionary: ReturnType<typeof getDashboardDictionary>;
  notifications: MarketplaceNotificationInboxItem[];
  summary: DashboardMarketplaceSummary | null;
}) {
  const status = summary?.verificationStatus ?? "unverified";
  const partyTypes = summary?.partyTypes ?? [];
  const roleIntents = summary?.roleIntents ?? [];
  const displayRoles = new Set([...partyTypes, ...roleIntents]);
  const marketplaceDictionary = dictionary.marketplace;
  const isForeignPartner = displayRoles.has("foreign_shipper");
  const canSeeRequesterActions =
    displayRoles.size === 0 || displayRoles.has("domestic_shipper") || displayRoles.has("foreign_shipper");
  const canSeeForwarderActions = displayRoles.has("forwarder");
  const canSeeBrokerActions = displayRoles.has("customs_broker");
  const hasActiveWork = hasMarketplaceWork(activity);
  const nextActions = buildMarketplaceNextActions(activity, summary);
  const unreadNotificationCount = notifications.filter((notification) => !notification.readAt).length;
  const actions = [
    ...(isForeignPartner ? [
      {
        description: marketplaceDictionary.actions.foreignFreight.description,
        href: "/requests/freight?direction=import&destinationCountryCode=KR",
        icon: Ship,
        title: marketplaceDictionary.actions.foreignFreight.title
      },
      {
        description: marketplaceDictionary.actions.foreignClearance.description,
        href: "/requests/clearance?direction=import&destinationCountryCode=KR",
        icon: FileText,
        title: marketplaceDictionary.actions.foreignClearance.title
      }
    ] : []),
    ...(canSeeRequesterActions ? [{
      description: "화물 조건을 정리하고 검증 포워더에게 운송 견적을 요청합니다.",
      href: "/requests/freight",
      icon: Ship,
      title: "운송 견적 요청"
    },
    {
      description: "HSK, FTA, 요건 검토 범위를 정리하고 관세사무소 견적을 요청합니다.",
      href: "/requests/clearance",
      icon: FileText,
      title: "통관 의뢰 요청"
    }] : []),
    ...(canSeeForwarderActions ? [{
      description: "포워더는 매칭된 화주 요청을 확인하고 운송 견적을 제출합니다.",
      href: "/requests/freight?workspace=forwarder",
      icon: Building2,
      title: "포워더 입찰 확인"
    }] : []),
    ...(canSeeBrokerActions ? [{
      description: "관세사무소는 통관 요청을 확인하고 수수료와 필요서류를 제안합니다.",
      href: "/requests/clearance?workspace=broker",
      icon: ShieldCheck,
      title: "관세사 입찰 확인"
    }] : [])
  ];
  const visibleActions = actions.length ? actions.slice(0, 4) : [
    {
      description: "화물 조건을 정리하고 검증 포워더에게 운송 견적을 요청합니다.",
      href: "/requests/freight",
      icon: Ship,
      title: "운송 견적 요청"
    },
    {
      description: "HSK, FTA, 요건 검토 범위를 정리하고 관세사무소 견적을 요청합니다.",
      href: "/requests/clearance",
      icon: FileText,
      title: "통관 의뢰 요청"
    }
  ];

  return (
    <section className="min-w-0 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] shadow-[var(--shadow-panel)]">
      <div className="grid gap-3 border-b border-[var(--border-subtle)] px-5 py-4 lg:grid-cols-[1fr_auto] lg:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">플랫폼 업무 시작</h2>
            <span className={`rounded-md border px-2 py-1 text-xs font-semibold ${marketplaceStatusClass(status)}`}>
              {dictionaryValue(marketplaceDictionary.statusLabel, status, marketplaceStatusLabel(status))}
            </span>
          </div>
          <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
            {summary?.companyName ?? "회사 정보 확인 필요"} / 회사 권한 {summary?.companyRole === "admin" ? "관리자" : "구성원"} / 신뢰 점수 {summary?.trustScore ?? 0}
            {isForeignPartner ? ` / ${marketplaceDictionary.foreignPartnerNote}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {partyTypes.length ? partyTypes.map((partyType) => (
            <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-600" key={partyType}>
              {dictionaryValue(marketplaceDictionary.partyTypeLabel, partyType, partyTypeLabel(partyType))}
            </span>
          )) : (
            <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-600">승인 역할 없음</span>
          )}
          {!partyTypes.length && roleIntents.map((partyType) => (
            <span className="rounded-md border border-blue-100 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700" key={`intent-${partyType}`}>
              가입 선택: {dictionaryValue(marketplaceDictionary.partyTypeLabel, partyType, partyTypeLabel(partyType))}
            </span>
          ))}
        </div>
      </div>
      <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
        {visibleActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link className="focus-ring grid min-h-32 gap-3 rounded-lg border border-[var(--border-subtle)] bg-white p-4 transition hover:border-blue-200 hover:shadow-md" data-navigation-progress={action.title} href={action.href} key={action.title}>
              <span className="grid size-10 place-items-center rounded-md bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                <Icon aria-hidden="true" size={19} />
              </span>
              <span>
                <span className="block text-sm font-semibold text-[var(--text-primary)]">{action.title}</span>
                <span className="mt-1 block text-xs leading-5 text-[var(--text-secondary)]">{action.description}</span>
              </span>
            </Link>
          );
        })}
      </div>
      <div className="border-t border-[var(--border-subtle)] bg-white px-4 py-4">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
          <div className="min-w-0">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">다음 행동</h3>
                <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
                  {hasActiveWork
                    ? "현재 상태에서 먼저 처리할 업무를 우선순위로 정리했습니다."
                    : "아직 처리할 업무가 없으면 역할·검증 상태를 확인하고 첫 요청을 시작합니다."}
                </p>
              </div>
              <span className="inline-flex w-fit items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-600">
                <CheckCircle2 aria-hidden="true" size={14} />
                홈 업무 큐
              </span>
            </div>
            <div className="mt-3 grid gap-2 lg:grid-cols-3">
              {nextActions.map((action) => (
                <Link
                  className="focus-ring group grid min-h-28 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 transition hover:border-blue-200 hover:bg-blue-50/60"
                  data-navigation-progress={action.title}
                  href={action.href}
                  key={action.title}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">{action.label}</span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700">
                      {action.count > 0 ? `${action.count}건` : "시작"}
                      <ArrowRight aria-hidden="true" className="transition group-hover:translate-x-0.5" size={14} />
                    </span>
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-[var(--text-primary)]">{action.title}</span>
                    <span className="mt-1 block text-xs leading-5 text-[var(--text-secondary)]">{action.description}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
          <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Bell aria-hidden="true" className="text-blue-700" size={16} />
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">파트너 알림</h3>
                </div>
                <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
                  매칭된 요청과 마감 임박 건을 최근순으로 표시합니다.
                </p>
              </div>
              <span className="shrink-0 rounded-md bg-white px-2 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                미확인 {unreadNotificationCount}건
              </span>
            </div>
            <div className="mt-3 divide-y divide-slate-200 rounded-md border border-slate-200 bg-white">
              {notifications.length ? notifications.map((notification) => (
                <div className="grid gap-3 px-3 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start" key={notification.deliveryId}>
                  <Link
                    className="focus-ring group block min-w-0 rounded-md transition hover:bg-blue-50/60"
                    data-navigation-progress={`파트너 알림 ${notification.requestTitle ?? notification.requestId}`}
                    href={getMarketplaceNotificationHref(notification)}
                  >
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                        {marketplaceNotificationRequestTypeLabel(notification.requestType)}
                      </span>
                      <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-100">
                        {marketplaceNotificationKindLabel(notification.notificationKind)}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        {notification.readAt ? "확인 완료" : marketplaceNotificationStatusLabel(notification.status)}
                      </span>
                    </span>
                    <span className="mt-2 flex items-start justify-between gap-3">
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-[var(--text-primary)]">
                          {notification.requestTitle ?? "요청명 확인 필요"}
                        </span>
                        <span className="mt-1 block text-xs text-[var(--text-secondary)]">
                          요청 상태 {notification.requestStatus ?? "-"} · 마감 {notification.requestDeadlineAt ? notification.requestDeadlineAt.slice(0, 10) : "미정"}
                        </span>
                      </span>
                      <ArrowRight aria-hidden="true" className="mt-0.5 shrink-0 text-blue-700 transition group-hover:translate-x-0.5" size={15} />
                    </span>
                  </Link>
                  {notification.readAt ? (
                    <span className="inline-flex h-8 w-fit items-center justify-center rounded-md border border-slate-200 px-3 text-xs font-semibold text-slate-500">
                      읽음
                    </span>
                  ) : (
                    <form action={markMarketplaceNotificationReadAction}>
                      <input name="deliveryId" type="hidden" value={notification.deliveryId} />
                      <button className="focus-ring inline-flex h-8 w-fit items-center justify-center rounded-md border border-blue-200 bg-white px-3 text-xs font-semibold text-blue-700 hover:bg-blue-50" type="submit">
                        읽음 처리
                      </button>
                    </form>
                  )}
                </div>
              )) : (
                <div className="px-3 py-6 text-sm leading-6 text-[var(--text-secondary)]">
                  현재 확인할 파트너 알림이 없습니다.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="grid gap-2 border-t border-[var(--border-subtle)] bg-slate-50 px-4 py-3 text-xs text-slate-600 md:grid-cols-4 xl:grid-cols-8">
        <span className="rounded-md bg-white px-3 py-2">임시저장 요청 {activity?.draftRequests ?? 0}</span>
        <span className="rounded-md bg-white px-3 py-2">진행중 요청 {activity?.openRequests ?? 0}</span>
        <span className="rounded-md bg-white px-3 py-2">견적 도착 {activity?.bidsReceived ?? 0}</span>
        <span className="rounded-md bg-white px-3 py-2">업무 진행 {activity?.inProgressRequests ?? 0}</span>
        <span className="rounded-md bg-white px-3 py-2">완료 {activity?.completedRequests ?? 0}</span>
        <span className="rounded-md bg-white px-3 py-2">리포트 대기 {activity?.completionReportPending ?? 0}</span>
        <span className="rounded-md bg-white px-3 py-2">피드백 대기 {activity?.feedbackPending ?? 0}</span>
        <span className="rounded-md bg-white px-3 py-2">파트너 업무 {(activity?.freightPartnerActions ?? 0) + (activity?.clearancePartnerActions ?? 0)}</span>
        <span className="rounded-md bg-white px-3 py-2">입찰 가능 {activity?.partnerOpportunities ?? 0}</span>
      </div>
      <div className="flex flex-wrap gap-2 border-t border-[var(--border-subtle)] bg-white px-4 py-3">
        <Link className="focus-ring inline-flex h-9 items-center rounded-md border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50" href="/requests/freight?workspace=requester">
          내 운송 요청
        </Link>
        <Link className="focus-ring inline-flex h-9 items-center rounded-md border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50" href="/requests/clearance?workspace=requester">
          내 통관 의뢰
        </Link>
        <Link className="focus-ring inline-flex h-9 items-center rounded-md border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50" href="/requests/freight?workspace=forwarder">
          운송 입찰 가능
        </Link>
        <Link className="focus-ring inline-flex h-9 items-center rounded-md border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50" href="/requests/clearance?workspace=broker">
          통관 입찰 가능
        </Link>
      </div>
      {!summary?.schemaReady ? (
        <p className="border-t border-[var(--border-subtle)] bg-amber-50 px-5 py-3 text-xs leading-5 text-amber-900">
          로그인은 정상입니다. 현재 이 환경에서는 플랫폼 요청·입찰 데이터가 아직 준비되지 않아 화주 요청 공개, 포워더 입찰, 관세사무소 입찰 흐름이 제한됩니다. HS 조회와 일반 대시보드는 계속 확인할 수 있습니다.
        </p>
      ) : null}
    </section>
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
    <div className="min-w-0 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] shadow-[var(--shadow-panel)]">
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
