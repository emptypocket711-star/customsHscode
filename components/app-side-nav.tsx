"use client";

import {
  Calculator,
  Car,
  ChevronLeft,
  ChevronRight,
  Database,
  FileSearch,
  FileSpreadsheet,
  Globe2,
  LayoutDashboard,
  Megaphone,
  Menu,
  Newspaper,
  PackageSearch,
  Search,
  ShieldCheck,
  Users,
  type LucideIcon
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { defaultLocale, getChromeDictionary, type AppLocale, type NavItemKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  icon: LucideIcon;
  labelKey: NavItemKey;
};

const userNavItems: NavItem[] = [
  { href: "/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/hs/direct", labelKey: "hsDirect", icon: Search },
  { href: "/hs/batch", labelKey: "hsBatch", icon: FileSpreadsheet },
  { href: "/hs/overseas", labelKey: "hsOverseas", icon: Globe2 },
  { href: "/cargo", labelKey: "cargo", icon: PackageSearch },
  { href: "/trade-news", labelKey: "tradeNews", icon: Newspaper },
  { href: "/used-car-export", labelKey: "usedCarExport", icon: Car },
  { href: "/duty-estimator", labelKey: "dutyEstimator", icon: Calculator }
];

const operationNavItems: NavItem[] = [
  { href: "/operations/users", labelKey: "users", icon: Users },
  { href: "/operations/notices", labelKey: "notices", icon: Megaphone },
  { href: "/operations/health", labelKey: "health", icon: ShieldCheck },
  { href: "/legal-updates", labelKey: "legalUpdates", icon: Database },
  { href: "/staff/review", labelKey: "staffReview", icon: FileSearch }
];

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
  href,
  icon: Icon,
  label,
  collapsed,
  pathname
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  collapsed?: boolean;
  pathname: string;
}) {
  const active = isActivePath(pathname, href);

  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={cn(
        "focus-ring flex min-h-10 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition",
        active ? "bg-blue-50 text-blue-800" : "text-slate-700 hover:bg-slate-100",
        collapsed ? "justify-center px-2" : ""
      )}
      data-navigation-progress={label}
      href={href}
      title={collapsed ? label : undefined}
    >
      <Icon aria-hidden="true" className={active ? "text-blue-700" : "text-slate-500"} size={17} />
      {collapsed ? null : <span className="min-w-0 break-words leading-snug">{label}</span>}
    </Link>
  );
}

function NavGroup({
  title,
  items,
  labels,
  collapsed,
  pathname
}: {
  title: string;
  items: NavItem[];
  labels: Record<NavItemKey, string>;
  collapsed?: boolean;
  pathname: string;
}) {
  return (
    <div className="grid gap-1">
      {collapsed ? null : <div className="px-3 pt-2 text-xs font-semibold text-slate-400">{title}</div>}
      {items.map((item) => (
        <NavLink collapsed={collapsed} href={item.href} icon={item.icon} key={item.href} label={labels[item.labelKey]} pathname={pathname} />
      ))}
    </div>
  );
}

export function AppSideNav({
  locale = defaultLocale,
  showOperations
}: {
  locale?: AppLocale;
  showOperations: boolean;
}) {
  const [collapsed, setCollapsed] = useState(true);
  const pathname = usePathname();
  const dictionary = getChromeDictionary(locale);

  function toggleCollapsed() {
    setCollapsed((current) => !current);
  }

  return (
    <>
      <details className="lg:hidden">
        <summary className="focus-ring flex cursor-pointer list-none items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm">
          <span className="inline-flex items-center gap-2">
            <Menu aria-hidden="true" size={17} />
            {dictionary.nav.menu}
          </span>
          <span className="text-xs text-slate-500">{dictionary.nav.menuHint}</span>
        </summary>
        <nav className="mt-2 grid gap-3 rounded-md border border-slate-200 bg-white p-2 shadow-sm">
          <NavGroup items={userNavItems} labels={dictionary.nav.items} pathname={pathname} title={dictionary.nav.sections.workspace} />
          {showOperations ? <NavGroup items={operationNavItems} labels={dictionary.nav.items} pathname={pathname} title={dictionary.nav.sections.operations} /> : null}
        </nav>
      </details>

      <aside className={cn("hidden shrink-0 lg:block", collapsed ? "w-12" : "w-56")}>
        <nav className="sticky top-5 grid gap-3 rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
          <button
            aria-label={collapsed ? dictionary.nav.expand : dictionary.nav.collapse}
            className="focus-ring inline-flex h-8 items-center justify-center rounded-md border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            onClick={toggleCollapsed}
            title={collapsed ? dictionary.nav.expand : dictionary.nav.collapse}
            type="button"
          >
            {collapsed ? (
              <>
                <ChevronRight aria-hidden="true" size={15} />
                <ChevronRight aria-hidden="true" className="-ml-2" size={15} />
              </>
            ) : (
              <>
                <ChevronLeft aria-hidden="true" size={15} />
                <ChevronLeft aria-hidden="true" className="-ml-2" size={15} />
              </>
            )}
          </button>
          <NavGroup collapsed={collapsed} items={userNavItems} labels={dictionary.nav.items} pathname={pathname} title={dictionary.nav.sections.workspace} />
          {showOperations ? (
            <NavGroup
              collapsed={collapsed}
              items={operationNavItems}
              labels={dictionary.nav.items}
              pathname={pathname}
              title={dictionary.nav.sections.operations}
            />
          ) : null}
        </nav>
      </aside>
    </>
  );
}
