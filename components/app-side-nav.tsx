"use client";

import {
  Calculator,
  ChevronLeft,
  ChevronRight,
  Database,
  FileSearch,
  Globe2,
  LayoutDashboard,
  Megaphone,
  Menu,
  Search,
  ShieldCheck,
  Users,
  type LucideIcon
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

const userNavItems = [
  { href: "/dashboard", label: "대시보드", icon: LayoutDashboard },
  { href: "/hs/direct", label: "통합 조회", icon: Search },
  { href: "/hs/overseas", label: "해외 HS CODE조회", icon: Globe2 },
  { href: "/duty-estimator", label: "납세액 계산", icon: Calculator }
];

const operationNavItems = [
  { href: "/operations/users", label: "사용자 관리", icon: Users },
  { href: "/operations/notices", label: "공지사항", icon: Megaphone },
  { href: "/operations/health", label: "운영 점검", icon: ShieldCheck },
  { href: "/legal-updates", label: "자료 관리", icon: Database },
  { href: "/staff/review", label: "검토 큐", icon: FileSearch }
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
      {collapsed ? null : <span>{label}</span>}
    </Link>
  );
}

function NavGroup({
  title,
  items,
  collapsed,
  pathname
}: {
  title: string;
  items: typeof userNavItems;
  collapsed?: boolean;
  pathname: string;
}) {
  return (
    <div className="grid gap-1">
      {collapsed ? null : <div className="px-3 pt-2 text-xs font-semibold text-slate-400">{title}</div>}
      {items.map((item) => (
        <NavLink collapsed={collapsed} href={item.href} icon={item.icon} key={item.href} label={item.label} pathname={pathname} />
      ))}
    </div>
  );
}

export function AppSideNav({ showOperations }: { showOperations: boolean }) {
  const [collapsed, setCollapsed] = useState(true);
  const pathname = usePathname();

  function toggleCollapsed() {
    setCollapsed((current) => !current);
  }

  return (
    <>
      <details className="lg:hidden">
        <summary className="focus-ring flex cursor-pointer list-none items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm">
          <span className="inline-flex items-center gap-2">
            <Menu aria-hidden="true" size={17} />
            메뉴
          </span>
          <span className="text-xs text-slate-500">조회 화면 이동</span>
        </summary>
        <nav className="mt-2 grid gap-3 rounded-md border border-slate-200 bg-white p-2 shadow-sm">
          <NavGroup items={userNavItems} pathname={pathname} title="일반 조회" />
          {showOperations ? <NavGroup items={operationNavItems} pathname={pathname} title="운영" /> : null}
        </nav>
      </details>

      <aside className={cn("hidden shrink-0 lg:block", collapsed ? "w-12" : "w-56")}>
        <nav className="sticky top-5 grid gap-3 rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
          <button
            aria-label={collapsed ? "메뉴 펼치기" : "메뉴 접기"}
            className="focus-ring inline-flex h-8 items-center justify-center rounded-md border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            onClick={toggleCollapsed}
            title={collapsed ? "메뉴 펼치기" : "메뉴 접기"}
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
          <NavGroup collapsed={collapsed} items={userNavItems} pathname={pathname} title="일반 조회" />
          {showOperations ? <NavGroup collapsed={collapsed} items={operationNavItems} pathname={pathname} title="운영" /> : null}
        </nav>
      </aside>
    </>
  );
}
