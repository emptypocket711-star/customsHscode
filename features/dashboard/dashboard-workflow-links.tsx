import Link from "next/link";
import { ArrowRight, Bell, Calculator, Car, FileSpreadsheet, Newspaper, type LucideIcon } from "lucide-react";
import { getDashboardDictionary, type AppLocale } from "@/lib/i18n";

type WorkflowId = "batch" | "cargo" | "duty" | "trade-news" | "vehicle-spec";

type WorkflowLink = {
  group: "primary" | "resources" | "tools";
  href: string;
  id: WorkflowId;
  tone: "blue" | "emerald" | "slate" | "amber";
};

const workflowLinks: WorkflowLink[] = [
  {
    group: "primary",
    href: "/cargo",
    id: "cargo",
    tone: "amber"
  },
  {
    group: "primary",
    href: "/hs/batch",
    id: "batch",
    tone: "emerald"
  },
  {
    group: "tools",
    href: "/duty-estimator",
    id: "duty",
    tone: "slate"
  },
  {
    group: "tools",
    href: "/used-car-export",
    id: "vehicle-spec",
    tone: "blue"
  },
  {
    group: "resources",
    href: "/trade-news",
    id: "trade-news",
    tone: "amber"
  }
];

const iconById: Record<WorkflowId, LucideIcon> = {
  batch: FileSpreadsheet,
  cargo: Bell,
  duty: Calculator,
  "trade-news": Newspaper,
  "vehicle-spec": Car
};

function toneClass(tone: WorkflowLink["tone"]) {
  if (tone === "emerald") return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  if (tone === "blue") return "bg-blue-50 text-blue-700 ring-blue-100";
  if (tone === "amber") return "bg-amber-50 text-amber-700 ring-amber-100";
  return "bg-slate-100 text-slate-700 ring-slate-200";
}

export function DashboardWorkflowLinks({ locale }: { locale: AppLocale }) {
  const dictionary = getDashboardDictionary(locale).workflows;
  const groupedLinks = [
    { id: "primary" as const, items: workflowLinks.filter((workflow) => workflow.group === "primary") },
    { id: "tools" as const, items: workflowLinks.filter((workflow) => workflow.group === "tools") },
    { id: "resources" as const, items: workflowLinks.filter((workflow) => workflow.group === "resources") }
  ];

  return (
    <section className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] shadow-[var(--shadow-panel)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] px-5 py-4">
        <div className="flex items-center gap-2">
          <FileSpreadsheet aria-hidden="true" className="text-blue-700" size={18} />
          <h2 className="text-base font-semibold text-[var(--text-primary)]">{dictionary.title}</h2>
        </div>
        <span className="text-xs font-medium text-[var(--text-muted)]">{dictionary.description}</span>
      </div>

      <div className="grid gap-4 p-4 lg:grid-cols-3">
        {groupedLinks.map((group) => (
          <div className="grid gap-2" key={group.id}>
            <h3 className="px-1 text-xs font-semibold text-[var(--text-muted)]">{dictionary.groups[group.id]}</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {group.items.map((workflow) => {
                const Icon = iconById[workflow.id];
                return (
                  <Link className="focus-ring group grid min-h-[116px] gap-3 rounded-lg border border-[var(--border-subtle)] bg-white p-4 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md" data-navigation-progress={dictionary.items[workflow.id].title} href={workflow.href} key={workflow.href}>
                    <span className={`grid size-10 place-items-center rounded-md ring-1 ${toneClass(workflow.tone)}`}>
                      <Icon aria-hidden="true" size={19} />
                    </span>
                    <span>
                      <span className="block font-semibold text-[var(--text-primary)]">{dictionary.items[workflow.id].title}</span>
                      <span className="mt-1 block text-sm leading-5 text-[var(--text-secondary)]">{dictionary.items[workflow.id].description}</span>
                    </span>
                    <span className="mt-auto inline-flex items-center gap-1 text-xs font-semibold text-blue-700">
                      {dictionary.open}
                      <ArrowRight aria-hidden="true" className="transition group-hover:translate-x-0.5" size={14} />
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
