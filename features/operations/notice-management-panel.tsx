"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { ChevronDown, Megaphone, Save, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import {
  deleteAppNoticeAction,
  upsertAppNoticeAction,
  type AppNoticeActionState
} from "@/server/actions/app-notice.actions";
import type { AppNotice } from "@/server/repositories/app-notice.repository";

const initialState: AppNoticeActionState = { status: "idle" };

const categoryLabels: Record<AppNotice["category"], string> = {
  notice: "공지",
  maintenance: "점검",
  data_update: "자료 업데이트",
  release: "기능 배포"
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Seoul"
  }).format(new Date(value));
}

function StatusMessage({ state }: { state: AppNoticeActionState }) {
  if (!state.message) return null;

  return (
    <div
      className={
        state.status === "success"
          ? "rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-800"
          : "rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-800"
      }
    >
      {state.message}
    </div>
  );
}

function NoticeFields({ notice }: { notice?: AppNotice }) {
  return (
    <>
      <input name="id" type="hidden" value={notice?.id ?? ""} />
      <div className="grid gap-3 md:grid-cols-[1fr_180px]">
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          제목
          <input
            className="focus-ring rounded-md border border-slate-300 px-3 py-2 text-slate-950"
            defaultValue={notice?.title ?? ""}
            maxLength={160}
            name="title"
            placeholder="대시보드에 표시할 공지 제목"
            required
          />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          분류
          <select className="focus-ring rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950" defaultValue={notice?.category ?? "notice"} name="category">
            <option value="notice">공지</option>
            <option value="maintenance">점검</option>
            <option value="data_update">자료 업데이트</option>
            <option value="release">기능 배포</option>
          </select>
        </label>
      </div>
      <label className="grid gap-1 text-sm font-medium text-slate-700">
        내용
        <textarea
          className="focus-ring min-h-28 rounded-md border border-slate-300 px-3 py-2 text-slate-950"
          defaultValue={notice?.body ?? ""}
          maxLength={4000}
          name="body"
          placeholder="공지 내용을 입력하세요."
          required
        />
      </label>
      <div className="flex flex-wrap gap-3">
        <label className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
          <input className="size-4 rounded border-slate-300" defaultChecked={notice?.isPublished ?? true} name="isPublished" type="checkbox" />
          대시보드 노출
        </label>
        <label className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
          <input className="size-4 rounded border-slate-300" defaultChecked={notice?.pinned ?? false} name="pinned" type="checkbox" />
          상단 고정
        </label>
        <label className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
          <input className="size-4 rounded border-slate-300" defaultChecked={notice?.popupEnabled ?? false} name="popupEnabled" type="checkbox" />
          접속 시 팝업
        </label>
      </div>
    </>
  );
}

export function NoticeManagementPanel({ notices }: { notices: AppNotice[] }) {
  const [upsertState, upsertAction, upsertPending] = useActionState(upsertAppNoticeAction, initialState);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteAppNoticeAction, initialState);
  const [showCreateForm, setShowCreateForm] = useState(notices.length === 0);
  const noticeSummary = useMemo(
    () => ({
      published: notices.filter((notice) => notice.isPublished).length,
      pinned: notices.filter((notice) => notice.pinned).length,
      popup: notices.filter((notice) => notice.popupEnabled).length
    }),
    [notices]
  );

  useEffect(() => {
    if (upsertState.status !== "idle" || deleteState.status !== "idle") {
      window.dispatchEvent(new CustomEvent("hsfinder:navigation-progress-done"));
    }
  }, [upsertState.status, deleteState.status]);

  return (
    <div className="grid gap-5">
      <Card>
        <CardHeader
          title="공지 현황"
          description="평소에는 노출 상태만 확인하고, 작성·수정이 필요할 때 항목을 펼쳐서 관리합니다."
          action={<Badge tone="warning">developer only</Badge>}
        />
        <CardBody className="grid gap-4">
          <div className="grid gap-2 sm:grid-cols-4">
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">전체</p>
              <p className="mt-1 text-2xl font-semibold text-slate-950">{notices.length}</p>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">대시보드 노출</p>
              <p className="mt-1 text-2xl font-semibold text-slate-950">{noticeSummary.published}</p>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">상단 고정</p>
              <p className="mt-1 text-2xl font-semibold text-slate-950">{noticeSummary.pinned}</p>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">접속 팝업</p>
              <p className="mt-1 text-2xl font-semibold text-slate-950">{noticeSummary.popup}</p>
            </div>
          </div>
          <StatusMessage state={upsertState} />
          <StatusMessage state={deleteState} />
        </CardBody>
      </Card>

      <Card>
        <button
          className="focus-ring flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
          onClick={() => setShowCreateForm((value) => !value)}
          type="button"
        >
          <span>
            <span className="block text-base font-semibold text-slate-950">공지 작성</span>
            <span className="mt-1 block text-sm text-slate-600">새 공지는 필요할 때만 열어서 등록합니다.</span>
          </span>
          <ChevronDown
            aria-hidden="true"
            className={showCreateForm ? "shrink-0 rotate-180 text-slate-500 transition" : "shrink-0 text-slate-500 transition"}
            size={18}
          />
        </button>
        {showCreateForm ? (
          <CardBody className="border-t border-slate-200">
            <form action={upsertAction} className="grid gap-4">
              <NoticeFields />
              <button
                className="focus-ring inline-flex h-11 w-fit items-center justify-center gap-2 rounded-md bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-500"
                disabled={upsertPending}
                type="submit"
              >
                <Save aria-hidden="true" size={16} />
                {upsertPending ? "저장 중" : "공지 작성"}
              </button>
            </form>
          </CardBody>
        ) : null}
      </Card>

      <div className="grid gap-3">
        {notices.length === 0 ? (
          <Card>
            <CardBody>
              <p className="text-sm text-slate-600">등록된 공지사항이 없습니다.</p>
            </CardBody>
          </Card>
        ) : null}

        {notices.map((notice) => (
          <Card key={notice.id} className="overflow-hidden">
            <details>
              <summary className="focus-ring cursor-pointer list-none px-5 py-4 marker:hidden">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Megaphone aria-hidden="true" className="text-blue-700" size={18} />
                      <h2 className="text-base font-semibold text-slate-950">{notice.title}</h2>
                      <Badge tone={notice.isPublished ? "success" : "neutral"}>{notice.isPublished ? "노출" : "숨김"}</Badge>
                      {notice.pinned ? <Badge tone="info">상단 고정</Badge> : null}
                      {notice.popupEnabled ? <Badge tone="warning">자동 팝업</Badge> : null}
                      <Badge tone="neutral">{categoryLabels[notice.category]}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      게시 {formatDate(notice.publishedAt)} / 수정 {formatDate(notice.updatedAt)}
                    </p>
                    <p className="mt-2 max-h-10 overflow-hidden text-sm text-slate-600">{notice.body}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600">
                    펼쳐서 수정
                    <ChevronDown aria-hidden="true" size={16} />
                  </span>
                </div>
              </summary>

              <div className="grid gap-4 border-t border-slate-200 p-5">
                <form action={upsertAction} className="grid gap-4 rounded-md border border-slate-200 bg-slate-50 p-3">
                  <NoticeFields notice={notice} />
                  <button
                    className="focus-ring inline-flex h-10 w-fit items-center justify-center gap-2 rounded-md bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-500"
                    disabled={upsertPending}
                    type="submit"
                  >
                    <Save aria-hidden="true" size={16} />
                    수정 저장
                  </button>
                </form>

                <form
                  action={deleteAction}
                  className="grid gap-3 rounded-md border border-red-200 bg-red-50 p-3"
                  onSubmit={(event) => {
                    if (!window.confirm(`${notice.title} 공지사항을 삭제할까요?`)) {
                      event.preventDefault();
                    }
                  }}
                >
                  <input name="id" type="hidden" value={notice.id} />
                  <div className="grid gap-2 md:grid-cols-[1fr_auto] md:items-end">
                    <label className="grid gap-1 text-sm font-medium text-red-900">
                      삭제 확인
                      <input className="focus-ring rounded-md border border-red-200 bg-white px-3 py-2 text-slate-950" name="confirmation" placeholder="DELETE 입력" />
                    </label>
                    <button
                      className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-md bg-red-700 px-4 text-sm font-semibold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-slate-500"
                      disabled={deletePending}
                      type="submit"
                    >
                      <Trash2 aria-hidden="true" size={16} />
                      삭제
                    </button>
                  </div>
                </form>
              </div>
            </details>
          </Card>
        ))}
      </div>
    </div>
  );
}
