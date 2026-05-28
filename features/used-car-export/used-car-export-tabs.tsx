"use client";

import { Car, Container, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/used-car-export", label: "개요", icon: LayoutGrid },
  { href: "/used-car-export/vehicle-spec", label: "제원정보 조회", icon: Car },
  { href: "/used-car-export/container-check", label: "컨테이너 반입 확인", icon: Container }
];

export function UsedCarExportTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = pathname === tab.href || (tab.href !== "/used-car-export" && pathname.startsWith(`${tab.href}/`));

        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={cn(
              "focus-ring inline-flex min-h-10 items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition",
              active ? "bg-blue-700 text-white" : "text-slate-700 hover:bg-slate-100"
            )}
            data-navigation-progress={tab.label}
            href={tab.href}
            key={tab.href}
          >
            <Icon aria-hidden="true" size={17} />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
