"use client";

import Link from "next/link";
import { ArrowRight, Bell, Calculator, Car, FileSearch, Globe2, Settings2, type LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getDashboardDictionary, type AppLocale } from "@/lib/i18n";

type WorkflowId = "cargo" | "direct" | "duty" | "overseas" | "vehicle-spec";

type WorkflowLink = {
  href: string;
  id: WorkflowId;
  tone: "blue" | "emerald" | "slate" | "amber";
};

const workflowLinks: WorkflowLink[] = [
  {
    href: "/hs/direct",
    id: "direct",
    tone: "blue"
  },
  {
    href: "/hs/overseas",
    id: "overseas",
    tone: "emerald"
  },
  {
    href: "/cargo",
    id: "cargo",
    tone: "amber"
  },
  {
    href: "/duty-estimator",
    id: "duty",
    tone: "slate"
  },
  {
    href: "/used-car-export",
    id: "vehicle-spec",
    tone: "blue"
  }
];

const iconById: Record<WorkflowId, LucideIcon> = {
  direct: FileSearch,
  overseas: Globe2,
  cargo: Bell,
  duty: Calculator,
  "vehicle-spec": Car
};

const storageKey = "hsfinder-dashboard-workflow-links";

function toneClass(tone: WorkflowLink["tone"]) {
  if (tone === "emerald") return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  if (tone === "blue") return "bg-blue-50 text-blue-700 ring-blue-100";
  if (tone === "amber") return "bg-amber-50 text-amber-700 ring-amber-100";
  return "bg-slate-100 text-slate-700 ring-slate-200";
}

function loadSelectedIds(): WorkflowId[] {
  if (typeof window === "undefined") return workflowLinks.map((link) => link.id);

  try {
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) return workflowLinks.map((link) => link.id);
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return workflowLinks.map((link) => link.id);
    const validIds = workflowLinks.map((link) => link.id);
    const selected = parsed.filter((id): id is WorkflowId => typeof id === "string" && validIds.includes(id as WorkflowId));
    return selected.length ? selected : validIds;
  } catch {
    return workflowLinks.map((link) => link.id);
  }
}

export function DashboardWorkflowLinks({ locale }: { locale: AppLocale }) {
  const [editing, setEditing] = useState(false);
  const [selectedIds, setSelectedIds] = useState(loadSelectedIds);
  const dictionary = getDashboardDictionary(locale).workflows;

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(selectedIds));
  }, [selectedIds]);

  const selectedLinks = useMemo(
    () => workflowLinks.filter((link) => selectedIds.includes(link.id)),
    [selectedIds]
  );

  function toggleLink(id: WorkflowId) {
    setSelectedIds((current) => {
      if (current.includes(id)) {
        return current.length > 1 ? current.filter((item) => item !== id) : current;
      }

      return [...current, id];
    });
  }

  return (
    <section className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] shadow-[var(--shadow-panel)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] px-5 py-4">
        <div className="flex items-center gap-2">
          <Settings2 aria-hidden="true" className="text-blue-700" size={18} />
          <h2 className="text-base font-semibold text-[var(--text-primary)]">{dictionary.title}</h2>
        </div>
        <button
          className="focus-ring rounded-md border border-[var(--border-subtle)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:bg-slate-50"
          onClick={() => setEditing((current) => !current)}
          type="button"
        >
          {editing ? dictionary.editClose : dictionary.edit}
        </button>
      </div>

      {editing ? (
        <div className="grid gap-2 border-b border-[var(--border-subtle)] bg-slate-50 px-5 py-3 sm:grid-cols-2 lg:grid-cols-5">
          {workflowLinks.map((link) => (
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700" key={link.id}>
              <input
                checked={selectedIds.includes(link.id)}
                className="size-4 rounded border-slate-300"
                onChange={() => toggleLink(link.id)}
                type="checkbox"
              />
              {dictionary.items[link.id].title}
            </label>
          ))}
        </div>
      ) : null}

      <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-5">
        {selectedLinks.map((workflow) => {
          const Icon = iconById[workflow.id] ?? FileSearch;
          return (
            <Link className="focus-ring group grid min-h-[132px] gap-3 rounded-lg border border-[var(--border-subtle)] bg-white p-4 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md" data-navigation-progress={dictionary.items[workflow.id].title} href={workflow.href} key={workflow.href}>
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
    </section>
  );
}
