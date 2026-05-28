"use client";

import { Car, Container, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UsedCarExportDictionary } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function UsedCarExportTabs({ dictionary }: { dictionary: UsedCarExportDictionary }) {
  const pathname = usePathname();
  const tabs = [
    { href: "/used-car-export", label: dictionary.tabs.overview, icon: LayoutGrid },
    { href: "/used-car-export/vehicle-spec", label: dictionary.tabs.vehicleSpec, icon: Car },
    { href: "/used-car-export/container-check", label: dictionary.tabs.containerCheck, icon: Container }
  ];

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
