"use client";

import { Megaphone, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  formatDashboardCount,
  getDashboardDictionary,
  type AppLocale,
  type DashboardDictionary
} from "@/lib/i18n";
import type { AppNotice } from "@/server/repositories/app-notice.repository";

function categoryTone(category: AppNotice["category"]) {
  if (category === "maintenance") return "warning";
  if (category === "release") return "success";
  return "neutral";
}

function formatShortDate(value: string, locale: AppLocale) {
  return new Intl.DateTimeFormat(locale, {
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Seoul"
  }).format(new Date(value));
}

function formatFullDate(value: string, locale: AppLocale) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Seoul"
  }).format(new Date(value));
}

function noticePreview(body: string, noContent: string) {
  const normalized = body.replace(/\s+/g, " ").trim();
  if (!normalized) return noContent;
  return normalized.length > 82 ? `${normalized.slice(0, 81)}...` : normalized;
}

const oneDayMs = 24 * 60 * 60 * 1000;

function dismissedStorageKey(noticeId: string) {
  return `hsfinder.notice.dismissed_until.${noticeId}`;
}

function isDismissedForToday(noticeId: string) {
  const value = window.localStorage.getItem(dismissedStorageKey(noticeId));
  if (!value) return false;

  const dismissedUntil = Number(value);
  if (!Number.isFinite(dismissedUntil) || dismissedUntil <= Date.now()) {
    window.localStorage.removeItem(dismissedStorageKey(noticeId));
    return false;
  }

  return true;
}

function NoticeDialog({
  autoOpen,
  dictionary,
  locale,
  notice
}: {
  autoOpen?: boolean;
  dictionary: DashboardDictionary["notices"];
  locale: AppLocale;
  notice: AppNotice;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [hideForToday, setHideForToday] = useState(false);

  useEffect(() => {
    if (!autoOpen || isDismissedForToday(notice.id)) return;

    const timer = window.setTimeout(() => {
      setIsOpen(true);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [autoOpen, notice.id]);

  useEffect(() => {
    if (!isOpen) return;
    if (!dialogRef.current?.open) {
      dialogRef.current?.showModal();
    }
  }, [isOpen]);

  function closeDialog() {
    if (hideForToday) {
      window.localStorage.setItem(dismissedStorageKey(notice.id), String(Date.now() + oneDayMs));
    }
    dialogRef.current?.close();
    setIsOpen(false);
  }

  return (
    <>
      <button
        className="focus-ring block w-full py-3 text-left transition hover:bg-blue-50/70"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        <span className="flex flex-wrap items-center gap-2 px-1">
          {notice.pinned ? <Badge tone="info">{dictionary.pinned}</Badge> : null}
          <Badge tone={categoryTone(notice.category)}>{dictionary.categories[notice.category]}</Badge>
          <span className="text-xs font-medium text-[var(--text-muted)]">{formatShortDate(notice.publishedAt, locale)}</span>
          <span className="ml-auto text-xs font-semibold text-blue-700">{dictionary.open}</span>
        </span>
        <span className="mt-2 block px-1 text-sm font-semibold text-[var(--text-primary)]">{notice.title}</span>
        <span className="mt-1 block truncate px-1 text-xs leading-5 text-[var(--text-secondary)]">{noticePreview(notice.body, dictionary.noContent)}</span>
      </button>

      {isOpen ? (
        <dialog
          className="w-[min(720px,calc(100vw-32px))] rounded-lg border border-slate-200 p-0 shadow-2xl backdrop:bg-slate-950/45"
          onCancel={closeDialog}
          ref={dialogRef}
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                {notice.pinned ? <Badge tone="info">{dictionary.pinned}</Badge> : null}
                <Badge tone={categoryTone(notice.category)}>{dictionary.categories[notice.category]}</Badge>
                <span className="text-xs font-medium text-slate-500">{formatFullDate(notice.publishedAt, locale)}</span>
              </div>
              <h2 className="mt-2 text-base font-semibold text-slate-950">{notice.title}</h2>
            </div>
            <button
              aria-label={dictionary.close}
              className="focus-ring ml-3 grid size-8 shrink-0 place-items-center rounded-md text-slate-700 hover:bg-slate-100"
              onClick={closeDialog}
              type="button"
            >
              <X aria-hidden="true" size={18} />
            </button>
          </div>
          <div className="max-h-[72vh] overflow-auto p-5">
            <p className="whitespace-pre-wrap text-sm leading-7 text-slate-800">{notice.body}</p>
          </div>
          <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                checked={hideForToday}
                className="size-4 rounded border-slate-300"
                onChange={(event) => setHideForToday(event.target.checked)}
                type="checkbox"
              />
              {dictionary.hideOneDay}
            </label>
            <button
              className="focus-ring inline-flex h-9 items-center justify-center rounded-md bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800"
              onClick={closeDialog}
              type="button"
            >
              {dictionary.close}
            </button>
          </div>
        </dialog>
      ) : null}
    </>
  );
}

export function DashboardNoticeCard({
  locale,
  notices
}: {
  locale: AppLocale;
  notices: AppNotice[];
}) {
  const autoPopupNoticeId = notices.find((notice) => notice.popupEnabled)?.id;
  const dictionary = getDashboardDictionary(locale).notices;

  return (
    <div className="min-w-0 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] shadow-[var(--shadow-panel)]">
      <div className="flex items-start justify-between gap-3 border-b border-[var(--border-subtle)] px-5 py-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Megaphone aria-hidden="true" className="text-blue-700" size={18} />
            <h2 className="text-base font-semibold text-[var(--text-primary)]">{dictionary.title}</h2>
          </div>
          <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">{dictionary.description}</p>
        </div>
        <span className="shrink-0 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-600">
          {notices.length ? formatDashboardCount(dictionary.recent, notices.length) : "0"}
        </span>
      </div>
      <div className="divide-y divide-[var(--border-subtle)] px-4">
        {notices.length ? notices.map((notice) => (
          <NoticeDialog
            autoOpen={notice.id === autoPopupNoticeId}
            dictionary={dictionary}
            key={notice.id}
            locale={locale}
            notice={notice}
          />
        )) : (
          <div className="py-6 text-sm text-[var(--text-secondary)]">{dictionary.empty}</div>
        )}
      </div>
    </div>
  );
}
