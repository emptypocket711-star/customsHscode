"use client";

import { useActionState, useEffect, useState } from "react";
import { Container, Download, ExternalLink, Loader2, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import {
  lookupHjitContainerAction,
  type HjitContainerLookupState
} from "@/server/actions/container-terminal.actions";
import type { UsedCarExportDictionary } from "@/lib/i18n";

const initialState: HjitContainerLookupState = { status: "idle" };

function formatTemplate(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce((text, [key, value]) => text.replaceAll(`{${key}}`, value), template);
}

function receiptPendingText(dictionary: UsedCarExportDictionary, elapsedSeconds: number) {
  if (!elapsedSeconds) return dictionary.container.receiptPending;

  return dictionary.container.receiptPendingSecondsSuffix === "s"
    ? `${dictionary.container.receiptPending} ${elapsedSeconds}${dictionary.container.receiptPendingSecondsSuffix}`
    : `${dictionary.container.receiptPending} ${elapsedSeconds}${dictionary.container.receiptPendingSecondsSuffix}`;
}

type ExternalIntegrationErrorBody = {
  code?: string;
  level?: string;
  message?: string;
  ok?: false;
  requestId?: string;
  retryable?: boolean;
};

async function readExternalErrorMessage(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = await response.json().catch(() => null) as ExternalIntegrationErrorBody | null;
    if (body?.message) {
      return body.requestId ? `${body.message} (요청 ID: ${body.requestId})` : body.message;
    }
  }

  const text = await response.text().catch(() => "");
  return text || "외부 조회 중 오류가 발생했습니다.";
}

async function downloadReceiptImage({
  containerNo,
  receiptFileSuffix,
  terminalCode
}: {
  containerNo: string;
  receiptFileSuffix: string;
  terminalCode?: string;
}) {
  const response = await fetch("/api/external/container-receipt", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ containerNo, terminalCode })
  });
  if (!response.ok) throw new Error(await readExternalErrorMessage(response));
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${containerNo}_${receiptFileSuffix}.png`;
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
  dictionary,
  rows
}: {
  dictionary: UsedCarExportDictionary;
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
            <th className="px-3 py-2">{dictionary.container.trackingTable.status}</th>
            <th className="px-3 py-2">{dictionary.container.trackingTable.datetime}</th>
            <th className="px-3 py-2">{dictionary.container.trackingTable.terminal}</th>
            <th className="px-3 py-2">{dictionary.container.trackingTable.container}</th>
            <th className="px-3 py-2">{dictionary.container.trackingTable.car}</th>
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
  dictionary,
  html,
  onClose,
  sourceUrl,
  terminalName
}: {
  dictionary: UsedCarExportDictionary;
  html: string;
  onClose: () => void;
  sourceUrl?: string;
  terminalName?: string;
}) {
  const title = formatTemplate(dictionary.container.modalTitle, { terminalName: terminalName || dictionary.container.terminalFallback });

  return (
    <div className="fixed inset-0 z-50 grid bg-slate-950/60 p-3 sm:p-6">
      <div className="mx-auto grid h-full w-full max-w-6xl grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-lg bg-white shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-slate-950">{title}</p>
            <p className="text-xs text-slate-500">{dictionary.container.externalReadOnly}</p>
          </div>
          <div className="flex items-center gap-2">
            {sourceUrl ? (
              <a
                className="focus-ring inline-flex min-h-9 items-center gap-2 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                href={sourceUrl}
                rel="noreferrer"
                target="_blank"
              >
                {dictionary.common.openOriginal}
                <ExternalLink aria-hidden="true" size={14} />
              </a>
            ) : null}
            <button
              className="focus-ring inline-flex size-9 items-center justify-center rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50"
              onClick={onClose}
              type="button"
            >
              <X aria-hidden="true" size={18} />
              <span className="sr-only">{dictionary.common.close}</span>
            </button>
          </div>
        </div>
        <iframe
          className="h-full w-full bg-white"
          sandbox=""
          srcDoc={html}
          title={title}
        />
      </div>
    </div>
  );
}

export function HjitContainerCheckPanel({ dictionary }: { dictionary: UsedCarExportDictionary }) {
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
          title={dictionary.container.cardTitle}
          description={dictionary.container.cardDescription}
          action={<Badge tone="info">{dictionary.container.trackingBadge}</Badge>}
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
              setClientError(dictionary.container.missingInput);
              window.dispatchEvent(new Event("hsfinder:navigation-progress-done"));
            }}
          >
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              {dictionary.container.inputLabel}
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
                {pending ? dictionary.common.lookupPending : dictionary.common.lookup}
              </button>
              {state.html ? (
                <button
                  className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  onClick={() => setRawHtmlOpen(true)}
                  type="button"
                >
                  <Container aria-hidden="true" size={17} />
                  {dictionary.common.openOriginal}
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
                        receiptFileSuffix: dictionary.container.receiptFileSuffix,
                        terminalCode: state.terminalCode
                      });
                      setReceiptMessage(dictionary.container.downloadSuccess);
                    } catch (error) {
                      setClientError(error instanceof Error ? error.message : dictionary.container.receiptUnknownError);
                    } finally {
                      setReceiptPending(false);
                      window.dispatchEvent(new Event("hsfinder:navigation-progress-done"));
                    }
                  }}
                  type="button"
                >
                  {receiptPending ? <Loader2 aria-hidden="true" className="animate-spin" size={17} /> : <Download aria-hidden="true" size={17} />}
                  {receiptPending ? receiptPendingText(dictionary, receiptElapsedSeconds) : dictionary.container.receipt}
                </button>
              ) : null}
              {state.sourceUrl ? (
                <a
                  className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  href={state.sourceUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  {dictionary.common.openOriginal}
                  <ExternalLink aria-hidden="true" size={16} />
                </a>
              ) : null}
              <p className="text-xs text-slate-500">
                {dictionary.container.currentSupport}
              </p>
            </div>
            {pending ? (
              <div className="rounded-md border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800">
                {dictionary.container.pendingMessage}
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
            {state.status === "error" && state.terminalAttempts?.length ? (
              <div className="rounded-md border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-600">
                <p className="font-semibold text-slate-900">터미널별 조회 시도 결과</p>
                <ul className="mt-2 grid gap-1">
                  {state.terminalAttempts.map((attempt) => (
                    <li key={attempt}>- {attempt}</li>
                  ))}
                </ul>
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
            title={dictionary.container.resultTitle}
            description={formatTemplate(dictionary.container.resultDescription, { terminalName: state.terminalName || dictionary.container.terminalFallback })}
            action={state.containerNo ? <Badge tone="success">{state.containerNo}</Badge> : undefined}
          />
          <CardBody className="grid gap-4">
            <TrackingTable dictionary={dictionary} rows={state.trackingRows ?? []} />
            <SummaryTable rows={state.summary ?? []} />
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600">
              <p>{dictionary.container.summaryFirstLine}</p>
              <p>{dictionary.container.summarySecondLine}</p>
            </div>
          </CardBody>
        </Card>
      ) : null}

      {modalOpen && state.html ? (
        <ResultModal
          html={state.html}
          dictionary={dictionary}
          onClose={() => setRawHtmlOpen(false)}
          sourceUrl={state.sourceUrl}
          terminalName={state.terminalName}
        />
      ) : null}
    </div>
  );
}
