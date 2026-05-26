"use client";

import { Megaphone, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import type { AppNotice } from "@/server/repositories/app-notice.repository";

const noticeCategoryLabels: Record<AppNotice["category"], string> = {
  notice: "공지",
  maintenance: "점검",
  data_update: "자료 업데이트",
  release: "기능 배포"
};

function categoryTone(category: AppNotice["category"]) {
  if (category === "maintenance") return "warning";
  if (category === "release") return "success";
  return "neutral";
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Seoul"
  }).format(new Date(value));
}

function formatFullDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Seoul"
  }).format(new Date(value));
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

function NoticeDialog({ autoOpen, notice }: { autoOpen?: boolean; notice: AppNotice }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [hideForToday, setHideForToday] = useState(false);

  useEffect(() => {
    if (!autoOpen || isDismissedForToday(notice.id)) return;

    const timer = window.setTimeout(() => {
      if (!dialogRef.current?.open) {
        dialogRef.current?.showModal();
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [autoOpen, notice.id]);

  function closeDialog() {
    if (hideForToday) {
      window.localStorage.setItem(dismissedStorageKey(notice.id), String(Date.now() + oneDayMs));
    }
    dialogRef.current?.close();
  }

  return (
    <>
      <button
        className="focus-ring block w-full py-3 text-left transition hover:bg-blue-50/70"
        onClick={() => dialogRef.current?.showModal()}
        type="button"
      >
        <span className="flex flex-wrap items-center gap-2 px-1">
          {notice.pinned ? <Badge tone="info">상단</Badge> : null}
          <Badge tone={categoryTone(notice.category)}>{noticeCategoryLabels[notice.category]}</Badge>
          <span className="text-xs font-medium text-[var(--text-muted)]">{formatShortDate(notice.publishedAt)}</span>
          <span className="ml-auto text-xs font-semibold text-blue-700">열기</span>
        </span>
        <span className="mt-2 block px-1 text-sm font-semibold text-[var(--text-primary)]">{notice.title}</span>
      </button>

      <dialog className="w-[min(720px,calc(100vw-32px))] rounded-lg border border-slate-200 p-0 shadow-2xl backdrop:bg-slate-950/45" ref={dialogRef}>
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {notice.pinned ? <Badge tone="info">상단</Badge> : null}
              <Badge tone={categoryTone(notice.category)}>{noticeCategoryLabels[notice.category]}</Badge>
              <span className="text-xs font-medium text-slate-500">{formatFullDate(notice.publishedAt)}</span>
            </div>
            <h2 className="mt-2 text-base font-semibold text-slate-950">{notice.title}</h2>
          </div>
          <button
            aria-label="닫기"
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
            1일 동안 보지 않기
          </label>
          <button
            className="focus-ring inline-flex h-9 items-center justify-center rounded-md bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800"
            onClick={closeDialog}
            type="button"
          >
            닫기
          </button>
        </div>
      </dialog>
    </>
  );
}

export function DashboardNoticeCard({ notices }: { notices: AppNotice[] }) {
  const autoPopupNoticeId = notices.find((notice) => notice.popupEnabled)?.id;

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
          <NoticeDialog autoOpen={notice.id === autoPopupNoticeId} key={notice.id} notice={notice} />
        )) : (
          <div className="py-6 text-sm text-[var(--text-secondary)]">등록된 공지사항이 없습니다.</div>
        )}
      </div>
    </div>
  );
}
