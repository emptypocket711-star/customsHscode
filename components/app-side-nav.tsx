"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "대시보드" },
  { href: "/hs/direct", label: "통합 조회" },
  { href: "/hs/overseas", label: "해외 HS CODE조회" },
  { href: "/duty-estimator", label: "납세액 계산" },
  { href: "/documents/upload", label: "서류 조회" },
  { href: "/legal-updates", label: "자료 관리" }
];

export function AppSideNav() {
  const [collapsed, setCollapsed] = useState(false);

  function toggleCollapsed() {
    setCollapsed((current) => !current);
  }

  return (
    <aside className={`hidden shrink-0 lg:block ${collapsed ? "w-12" : "w-56"}`}>
      <nav className="sticky top-5 grid gap-1 rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
        <button
          aria-label={collapsed ? "메뉴 펼치기" : "메뉴 접기"}
          className="focus-ring mb-1 inline-flex h-8 items-center justify-center rounded-md border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
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
        {collapsed ? null : navItems.map((item) => (
          <Link
            className="focus-ring rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            href={item.href}
            key={item.href}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
