"use client";

import { useActionState, useEffect, useState } from "react";
import { Container, Download, ExternalLink, Loader2, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import {
  lookupHjitContainerAction,
  type HjitContainerLookupState
} from "@/server/actions/container-terminal.actions";

const initialState: HjitContainerLookupState = { status: "idle" };

async function downloadReceiptImage({
  containerNo,
  terminalCode
}: {
  containerNo: string;
  terminalCode?: string;
}) {
  const response = await fetch("/api/external/container-receipt", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ containerNo, terminalCode })
  });
  if (!response.ok) throw new Error(await response.text());
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${containerNo}_반입계.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function SummaryTable({ rows }: { rows: Array<{ label: string; value: string }> }) {
  if (!rows.length) return null;

  return (
    <dl className="grid overflow-hidden rounded-md border border-slate-200 text-sm sm:grid-cols-2">
      {rows.map((row) => (
        <div className="grid grid-cols-[7.5rem_1fr] border-b border-slate-100 last:border-b-0 sm:border-r sm:last:border-r-0" key={row.label}>
          <dt className="bg-slate-50 px-3 py-2 font-semibold text-slate-600">{row.label}</dt>
          <dd className="px-3 py-2 font-medium text-slate-950">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function TrackingTable({
  rows
}: {
  rows: Array<{
    carCode: string;
    statusTime: string;
    terminalName: string;
    containerNo: string;
    statusDate: string;
    statusName: string;
  }>;
}) {
  if (!rows.length) return null;

  return (
    <div className="overflow-x-auto rounded-md border border-slate-200">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500">
          <tr>
            <th className="px-3 py-2">상태</th>
            <th className="px-3 py-2">일시</th>
            <th className="px-3 py-2">터미널</th>
            <th className="px-3 py-2">컨테이너</th>
            <th className="px-3 py-2">차량</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.slice(0, 5).map((row, index) => (
            <tr className={index === 0 ? "bg-blue-50/60" : undefined} key={`${row.statusDate}-${row.statusTime}-${row.statusName}-${index}`}>
              <td className="px-3 py-2 font-semibold text-slate-950">{row.statusName}</td>
              <td className="px-3 py-2 text-slate-700">{row.statusDate} {row.statusTime}</td>
              <td className="px-3 py-2 text-slate-700">{row.terminalName || "-"}</td>
              <td className="px-3 py-2 font-mono text-slate-700">{row.containerNo}</td>
              <td className="px-3 py-2 text-slate-700">{row.carCode || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ResultModal({
  html,
  onClose,
  sourceUrl,
  terminalName
}: {
  html: string;
  onClose: () => void;
  sourceUrl?: string;
  terminalName?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 grid bg-slate-950/60 p-3 sm:p-6">
      <div className="mx-auto grid h-full w-full max-w-6xl grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-lg bg-white shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-slate-950">{terminalName ?? "터미널"} 원문 조회 화면</p>
            <p className="text-xs text-slate-500">외부 터미널 조회 결과를 읽기 전용으로 표시합니다.</p>
          </div>
          <div className="flex items-center gap-2">
            {sourceUrl ? (
              <a
                className="focus-ring inline-flex min-h-9 items-center gap-2 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                href={sourceUrl}
                rel="noreferrer"
                target="_blank"
              >
                원사이트 열기
                <ExternalLink aria-hidden="true" size={14} />
              </a>
            ) : null}
            <button
              className="focus-ring inline-flex size-9 items-center justify-center rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50"
              onClick={onClose}
              type="button"
            >
              <X aria-hidden="true" size={18} />
              <span className="sr-only">닫기</span>
            </button>
          </div>
        </div>
        <iframe
          className="h-full w-full bg-white"
          sandbox=""
          srcDoc={html}
          title="한진인천컨테이너터미널 컨테이너 조회 결과"
        />
      </div>
    </div>
  );
}

export function HjitContainerCheckPanel() {
  const [state, action, pending] = useActionState(lookupHjitContainerAction, initialState);
  const [clientError, setClientError] = useState("");
  const [rawHtmlOpen, setRawHtmlOpen] = useState(false);
  const [receiptPending, setReceiptPending] = useState(false);
  const [receiptElapsedSeconds, setReceiptElapsedSeconds] = useState(0);
  const [receiptMessage, setReceiptMessage] = useState("");

  useEffect(() => {
    if (state.status !== "idle" || !pending) {
      window.dispatchEvent(new Event("hsfinder:navigation-progress-done"));
    }
  }, [pending, state.status]);

  useEffect(() => {
    if (!receiptPending) return;

    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      setReceiptElapsedSeconds(Math.max(1, Math.floor((Date.now() - startedAt) / 1000)));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [receiptPending]);

  const message = clientError || state.message;
  const isSuccess = !clientError && state.status === "success";
  const modalOpen = Boolean(state.html) && rawHtmlOpen;

  return (
    <div className="grid gap-5">
      <Card>
        <CardHeader
          title="컨테이너 반입 확인"
          description="컨테이너 번호를 입력하면 운송현황을 먼저 확인하고 터미널 조회 결과를 화면에 표시합니다."
          action={<Badge tone="info">운송현황 + 터미널</Badge>}
        />
        <CardBody>
          <form
            action={action}
            className="grid gap-4"
            onSubmit={(event) => {
              const formData = new FormData(event.currentTarget);
              const value = String(formData.get("containerNo") ?? "").trim();
              if (value) {
                setClientError("");
                setReceiptMessage("");
                setRawHtmlOpen(false);
                return;
              }

              event.preventDefault();
              setClientError("컨테이너 번호를 입력해 주세요.");
              window.dispatchEvent(new Event("hsfinder:navigation-progress-done"));
            }}
          >
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              컨테이너 번호
              <input
                autoFocus
                className="focus-ring h-11 rounded-md border border-slate-300 px-3 text-sm font-semibold uppercase tracking-wide"
                disabled={pending}
                name="containerNo"
                placeholder="예: MRSU5275922"
              />
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <button
                className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-500"
                disabled={pending}
                type="submit"
              >
                {pending ? <Loader2 aria-hidden="true" className="animate-spin" size={18} /> : <Search aria-hidden="true" size={18} />}
                {pending ? "조회 중" : "조회"}
              </button>
              {state.html ? (
                <button
                  className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  onClick={() => setRawHtmlOpen(true)}
                  type="button"
                >
                  <Container aria-hidden="true" size={17} />
                  원문 화면 보기
                </button>
              ) : null}
              {state.status === "success" && state.containerNo && state.html ? (
                <button
                  className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-800 hover:bg-blue-100"
                  disabled={receiptPending}
                  onClick={async () => {
                    setClientError("");
                    setReceiptMessage("");
                    setReceiptElapsedSeconds(0);
                    setReceiptPending(true);
                    try {
                      await downloadReceiptImage({
                        containerNo: state.containerNo ?? "",
                        terminalCode: state.terminalCode
                      });
                      setReceiptMessage("반입계 이미지 다운로드를 시작했습니다.");
                    } catch (error) {
                      setClientError(error instanceof Error ? error.message : "반입계 이미지를 생성하지 못했습니다. 잠시 후 다시 시도해 주세요.");
                    } finally {
                      setReceiptPending(false);
                      window.dispatchEvent(new Event("hsfinder:navigation-progress-done"));
                    }
                  }}
                  type="button"
                >
                  {receiptPending ? <Loader2 aria-hidden="true" className="animate-spin" size={17} /> : <Download aria-hidden="true" size={17} />}
                  {receiptPending ? `출력 생성 중${receiptElapsedSeconds ? ` ${receiptElapsedSeconds}초` : ""}` : "반입계 출력"}
                </button>
              ) : null}
              {state.sourceUrl ? (
                <a
                  className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  href={state.sourceUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  원사이트 열기
                  <ExternalLink aria-hidden="true" size={16} />
                </a>
              ) : null}
              <p className="text-xs text-slate-500">
                현재는 한진인천, 선광신, 인천컨테이너터미널, 인천항국제페리부두, BNCT, 평택컨테이너터미널, 평택동방아이포트 확인을 지원합니다.
              </p>
            </div>
            {pending ? (
              <div className="rounded-md border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800">
                터미널 조회 화면을 불러오고 있습니다.
              </div>
            ) : null}
            {message ? (
              <div
                data-progress-complete="true"
                className={isSuccess ? "rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800" : "rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"}
              >
                {message}
              </div>
            ) : null}
            {receiptMessage ? (
              <div
                data-progress-complete="true"
                className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
              >
                {receiptMessage}
              </div>
            ) : null}
            {state.notice ? (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-900">
                {state.notice}
              </div>
            ) : null}
          </form>
        </CardBody>
      </Card>

      {state.status === "success" ? (
        <Card>
          <CardHeader
            title="조회 요약"
            description={`${state.terminalName ?? "터미널"}에서 내려온 주요 항목입니다.`}
            action={state.containerNo ? <Badge tone="success">{state.containerNo}</Badge> : undefined}
          />
          <CardBody className="grid gap-4">
            <TrackingTable rows={state.trackingRows ?? []} />
            <SummaryTable rows={state.summary ?? []} />
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600">
              <p>상단 이력은 운송현황 조회 결과의 최신 순서입니다.</p>
              <p>현재 결과는 연결된 터미널 원문 조회 화면을 기준으로 표시합니다.</p>
            </div>
          </CardBody>
        </Card>
      ) : null}

      {modalOpen && state.html ? (
        <ResultModal
          html={state.html}
          onClose={() => setRawHtmlOpen(false)}
          sourceUrl={state.sourceUrl}
          terminalName={state.terminalName}
        />
      ) : null}
    </div>
  );
}
