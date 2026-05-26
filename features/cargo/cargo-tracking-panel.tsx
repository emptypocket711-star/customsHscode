"use client";

import { useActionState, useEffect, useState } from "react";
import { Bell, Loader2, Search, Ship } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import {
  cancelCargoWatchAction,
  createCargoWatchAction,
  lookupCargoProgressAction,
  type CargoTrackingActionState,
  type CargoWatchActionState
} from "@/server/actions/cargo-tracking.actions";

const lookupInitialState: CargoTrackingActionState = { status: "idle" };
const watchInitialState: CargoWatchActionState = { status: "idle" };

const statusOptions = ["적하목록 제출", "입항보고", "하선신고 수리", "반입", "수입신고", "수입신고수리", "반출"];

export type CargoWatchListItem = {
  id: string;
  cargoManagementNo: string | null;
  masterBlNo: string | null;
  houseBlNo: string | null;
  blYear: string | null;
  targetStatus: string;
  notifyEmail: string;
  status: string;
  lastStatus: string | null;
  lastCheckedAt: string | null;
  createdAt: string;
};

function ActiveWatchRows({ watches }: { watches: CargoWatchListItem[] }) {
  const activeWatches = watches.filter((watch) => watch.status === "active");
  if (!activeWatches.length) return null;

  return (
    <Card>
      <CardHeader title="작동 중인 감시" description="아래 적하목록 알림 감시가 작동 중입니다." action={<Badge tone="info">{activeWatches.length}건</Badge>} />
      <CardBody className="p-0">
        <div className="divide-y divide-slate-100">
          {activeWatches.map((watch) => (
            <div className="grid gap-3 px-4 py-3 text-sm md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-center" key={watch.id}>
              <div className="min-w-0">
                <p className="truncate font-mono text-xs font-semibold text-slate-900">
                  {watch.cargoManagementNo || watch.houseBlNo || watch.masterBlNo || "-"}
                  {watch.blYear ? <span className="ml-2 font-sans text-slate-500">{watch.blYear}</span> : null}
                </p>
                <p className="mt-1 text-xs text-slate-500">감시가 작동중입니다.</p>
              </div>
              <div className="text-slate-700">
                <span className="text-slate-500">목표 상태 </span>
                <span className="font-semibold text-slate-950">{watch.targetStatus}</span>
              </div>
              <div className="text-slate-700">
                <span className="text-slate-500">최근 상태 </span>
                <span className="font-semibold text-slate-950">{watch.lastStatus || "확인 전"}</span>
              </div>
              <form action={cancelCargoWatchAction}>
                <input name="id" type="hidden" value={watch.id} />
                <button className="focus-ring inline-flex min-h-9 items-center rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50" type="submit">
                  감시 해제하기
                </button>
              </form>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

function StatusMessage({ status, message }: { status: "success" | "error" | "idle"; message?: string }) {
  if (!message) return null;

  return (
    <div
      className={
        status === "success"
          ? "rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
          : "rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
      }
    >
      {message}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] border-b border-slate-100 last:border-b-0">
      <dt className="bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-500">{label}</dt>
      <dd className="px-3 py-2 text-sm font-medium text-slate-900">{value || "-"}</dd>
    </div>
  );
}

export function CargoTrackingPanel({ watches }: { watches: CargoWatchListItem[] }) {
  const [lookupState, lookupAction, lookupPending] = useActionState(lookupCargoProgressAction, lookupInitialState);
  const [watchState, watchAction, watchPending] = useActionState(createCargoWatchAction, watchInitialState);
  const [lookupClientError, setLookupClientError] = useState("");
  const [watchClientError, setWatchClientError] = useState("");
  const result = lookupState.result;
  const currentYear = new Date().getFullYear().toString();

  useEffect(() => {
    if (lookupState.status !== "idle") {
      window.dispatchEvent(new Event("hsfinder:navigation-progress-done"));
    }
  }, [lookupState]);

  useEffect(() => {
    if (watchState.status !== "idle") {
      window.dispatchEvent(new Event("hsfinder:navigation-progress-done"));
    }
  }, [watchState]);

  function hasCargoLookupValue(form: HTMLFormElement) {
    const formData = new FormData(form);
    return ["cargoManagementNo", "masterBlNo", "houseBlNo"].some((key) => {
      const value = formData.get(key);
      return typeof value === "string" && value.trim().length > 0;
    });
  }

  return (
    <div className="grid gap-5">
      <ActiveWatchRows watches={watches} />

      <Card>
        <CardHeader
          title="화물통관진행정보 조회"
          description="화물관리번호 또는 B/L 번호로 현재 진행 상태와 처리 이력을 조회합니다."
          action={<Badge tone="info">API001</Badge>}
        />
        <CardBody>
          <form
            action={lookupAction}
            className="grid gap-4"
            onSubmit={(event) => {
              if (hasCargoLookupValue(event.currentTarget)) {
                setLookupClientError("");
                return;
              }

              event.preventDefault();
              setLookupClientError("화물관리번호, Master B/L, House B/L 중 하나 이상 입력해 주세요.");
              window.dispatchEvent(new Event("hsfinder:navigation-progress-done"));
            }}
          >
            <div className="grid gap-4 md:grid-cols-3">
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                화물관리번호
                <input className="focus-ring rounded-md border border-slate-300 px-3 py-2" disabled={lookupPending} name="cargoManagementNo" placeholder="예: 24ABC..." />
              </label>
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                Master B/L
                <input className="focus-ring rounded-md border border-slate-300 px-3 py-2" disabled={lookupPending} name="masterBlNo" />
              </label>
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                House B/L
                <input className="focus-ring rounded-md border border-slate-300 px-3 py-2" disabled={lookupPending} name="houseBlNo" />
              </label>
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                B/L 연도
                <input className="focus-ring rounded-md border border-slate-300 px-3 py-2" defaultValue={currentYear} disabled={lookupPending} inputMode="numeric" maxLength={4} name="blYear" />
              </label>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-500"
                disabled={lookupPending}
                type="submit"
              >
                {lookupPending ? <Loader2 aria-hidden="true" className="animate-spin" size={18} /> : <Search aria-hidden="true" size={18} />}
                {lookupPending ? "조회 중" : "조회"}
              </button>
              <p className="text-xs text-slate-500">조회가 되지 않으면 적하목록 생성 전이거나 B/L 번호가 다를 수 있습니다.</p>
            </div>
            {lookupPending ? (
              <div className="rounded-md border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800">
                관세청 화물통관진행정보를 조회하고 있습니다.
              </div>
            ) : null}
            <StatusMessage message={lookupClientError || lookupState.message} status={lookupClientError ? "error" : lookupState.status} />
          </form>
        </CardBody>
      </Card>

      {result ? (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <Card>
            <CardHeader title="현재 상태" action={<Badge tone="success">{result.summary.progressStatus || "조회됨"}</Badge>} />
            <CardBody className="p-0">
              <dl>
                <SummaryRow label="화물관리번호" value={result.summary.cargoManagementNo} />
                <SummaryRow label="Master B/L" value={result.summary.masterBlNo} />
                <SummaryRow label="House B/L" value={result.summary.houseBlNo} />
                <SummaryRow label="신고번호" value={result.summary.declarationNo} />
                <SummaryRow label="선명" value={result.summary.vesselName} />
                <SummaryRow label="포장수량" value={result.summary.packageCount} />
                <SummaryRow label="중량" value={[result.summary.grossWeight, result.summary.weightUnit].filter(Boolean).join(" ")} />
                <SummaryRow label="입항일" value={result.summary.arrivalDate} />
                <SummaryRow label="세관/장치장" value={result.summary.portName} />
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="진행 이력" description="관세청 응답에 포함된 처리 이력을 시간순으로 표시합니다." />
            <CardBody className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2">처리일시</th>
                      <th className="px-3 py-2">상태</th>
                      <th className="px-3 py-2">장소</th>
                      <th className="px-3 py-2">기관</th>
                      <th className="px-3 py-2">상세</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {result.events.length ? result.events.map((event, index) => (
                      <tr key={`${event.eventTime}-${event.status}-${index}`}>
                        <td className="whitespace-nowrap px-3 py-2 text-slate-700">{event.eventTime || "-"}</td>
                        <td className="px-3 py-2 font-semibold text-slate-950">{event.status || event.statusCode || "-"}</td>
                        <td className="px-3 py-2 text-slate-700">{event.location || "-"}</td>
                        <td className="px-3 py-2 text-slate-700">{event.agency || "-"}</td>
                        <td className="px-3 py-2 text-slate-600">{event.processingDetails || "-"}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td className="px-3 py-6 text-center text-slate-500" colSpan={5}>진행 이력이 없습니다.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Card>
          <CardHeader title="상태 알림 등록" description="원하는 진행 상태가 확인되면 지정한 이메일로 알림을 보냅니다." action={<Badge tone="warning">1분 감시</Badge>} />
          <CardBody>
            <form
              action={watchAction}
              className="grid gap-4"
              onSubmit={(event) => {
                if (hasCargoLookupValue(event.currentTarget)) {
                  setWatchClientError("");
                  return;
                }

                event.preventDefault();
                setWatchClientError("감시할 화물관리번호, Master B/L, House B/L 중 하나 이상 입력해 주세요.");
                window.dispatchEvent(new Event("hsfinder:navigation-progress-done"));
              }}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-1 text-sm font-medium text-slate-700">
                  화물관리번호
                  <input className="focus-ring rounded-md border border-slate-300 px-3 py-2" disabled={watchPending} name="cargoManagementNo" />
                </label>
                <label className="grid gap-1 text-sm font-medium text-slate-700">
                  알림 받을 이메일
                  <input className="focus-ring rounded-md border border-slate-300 px-3 py-2" disabled={watchPending} name="notifyEmail" type="email" />
                </label>
                <label className="grid gap-1 text-sm font-medium text-slate-700">
                  Master B/L
                  <input className="focus-ring rounded-md border border-slate-300 px-3 py-2" disabled={watchPending} name="masterBlNo" />
                </label>
                <label className="grid gap-1 text-sm font-medium text-slate-700">
                  House B/L
                  <input className="focus-ring rounded-md border border-slate-300 px-3 py-2" disabled={watchPending} name="houseBlNo" />
                </label>
                <label className="grid gap-1 text-sm font-medium text-slate-700">
                  B/L 연도
                  <input className="focus-ring rounded-md border border-slate-300 px-3 py-2" defaultValue={currentYear} disabled={watchPending} inputMode="numeric" maxLength={4} name="blYear" />
                </label>
                <label className="grid gap-1 text-sm font-medium text-slate-700">
                  알림 받을 상태
                  <select className="focus-ring rounded-md border border-slate-300 bg-white px-3 py-2" disabled={watchPending} name="targetStatus" defaultValue="반입">
                    {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </label>
              </div>
              <button
                className="focus-ring inline-flex min-h-10 w-fit items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500"
                disabled={watchPending}
                type="submit"
              >
                {watchPending ? <Loader2 aria-hidden="true" className="animate-spin" size={18} /> : <Bell aria-hidden="true" size={18} />}
                {watchPending ? "등록 중" : "알림 등록"}
              </button>
              <StatusMessage message={watchClientError || watchState.message} status={watchClientError ? "error" : watchState.status} />
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="내 알림 감시" description="최근 등록한 화물 상태 알림입니다." action={<Ship aria-hidden="true" className="text-slate-400" size={20} />} />
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2">조회값</th>
                    <th className="px-3 py-2">목표</th>
                    <th className="px-3 py-2">현재</th>
                    <th className="px-3 py-2">상태</th>
                    <th className="px-3 py-2">최근 확인</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {watches.length ? watches.map((watch) => (
                    <tr key={watch.id}>
                      <td className="px-3 py-2 font-mono text-xs text-slate-700">
                        {watch.cargoManagementNo || watch.houseBlNo || watch.masterBlNo || "-"}
                        {watch.blYear ? ` / ${watch.blYear}` : ""}
                      </td>
                      <td className="px-3 py-2 font-semibold text-slate-900">{watch.targetStatus}</td>
                      <td className="px-3 py-2 text-slate-700">{watch.lastStatus || "-"}</td>
                      <td className="px-3 py-2"><Badge tone={watch.status === "matched" ? "success" : watch.status === "active" ? "info" : "warning"}>{watch.status}</Badge></td>
                      <td className="px-3 py-2 text-slate-500">{watch.lastCheckedAt ? new Date(watch.lastCheckedAt).toLocaleString("ko-KR") : "-"}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td className="px-3 py-8 text-center text-slate-500" colSpan={5}>등록된 알림 감시가 없습니다.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
