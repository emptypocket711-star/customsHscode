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
import { cargoWatchStatusOptions } from "@/lib/cargo-watch-status";
import type { CargoDictionary } from "@/lib/i18n";

const lookupInitialState: CargoTrackingActionState = { status: "idle" };
const watchInitialState: CargoWatchActionState = { status: "idle" };

const statusOptions = [...cargoWatchStatusOptions];

function cargoTargetStatusLabel(value: string, dictionary: CargoDictionary) {
  const normalizedValue = statusOptions.find((option) => option.value === value || option.label === value)?.value ?? value;
  if (normalizedValue === "manifest_submitted") return dictionary.targetStatus.manifestSubmitted;
  if (normalizedValue === "arrival_report") return dictionary.targetStatus.arrivalReport;
  if (normalizedValue === "unloading_accepted") return dictionary.targetStatus.unloadingAccepted;
  if (normalizedValue === "cy_inbound") return dictionary.targetStatus.cyInbound;
  if (normalizedValue === "cfs_inbound") return dictionary.targetStatus.cfsInbound;
  if (normalizedValue === "inbound") return dictionary.targetStatus.inbound;
  if (normalizedValue === "import_declaration") return dictionary.targetStatus.importDeclaration;
  if (normalizedValue === "import_accepted") return dictionary.targetStatus.importAccepted;
  if (normalizedValue === "released") return dictionary.targetStatus.released;
  return value;
}

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

function ActiveWatchRows({ dictionary, watches }: { dictionary: CargoDictionary; watches: CargoWatchListItem[] }) {
  const activeWatches = watches.filter((watch) => watch.status === "active");
  if (!activeWatches.length) return null;

  return (
    <Card>
      <CardHeader title={dictionary.active.title} description={dictionary.active.description} action={<Badge tone="info">{activeWatches.length}</Badge>} />
      <CardBody className="p-0">
        <div className="divide-y divide-slate-100">
          {activeWatches.map((watch) => (
            <div className="grid gap-3 px-4 py-3 text-sm md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-center" key={watch.id}>
              <div className="min-w-0">
                <p className="truncate font-mono text-xs font-semibold text-slate-900">
                  {watch.cargoManagementNo || watch.houseBlNo || watch.masterBlNo || "-"}
                  {watch.blYear ? <span className="ml-2 font-sans text-slate-500">{watch.blYear}</span> : null}
                </p>
                <p className="mt-1 text-xs text-slate-500">{dictionary.active.running}</p>
              </div>
              <div className="text-slate-700">
                <span className="text-slate-500">{dictionary.active.targetStatus} </span>
                <span className="font-semibold text-slate-950">{cargoTargetStatusLabel(watch.targetStatus, dictionary)}</span>
              </div>
              <div className="text-slate-700">
                <span className="text-slate-500">{dictionary.active.currentStatus} </span>
                <span className="font-semibold text-slate-950">{watch.lastStatus || dictionary.active.pendingStatus}</span>
              </div>
              <form action={cancelCargoWatchAction}>
                <input name="id" type="hidden" value={watch.id} />
                <button className="focus-ring inline-flex min-h-9 items-center rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50" type="submit">
                  {dictionary.active.cancel}
                </button>
              </form>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

function cargoWatchStatusLabel(status: string, dictionary: CargoDictionary) {
  if (status === "active") return dictionary.status.active;
  if (status === "matched") return dictionary.status.matched;
  if (status === "cancelled") return dictionary.status.cancelled;
  if (status === "paused") return dictionary.status.paused;
  if (status === "error") return dictionary.status.error;
  return status;
}

function StatusMessage({
  dictionary,
  diagnostic,
  status,
  message
}: {
  dictionary: CargoDictionary;
  diagnostic?: CargoTrackingActionState["diagnostic"];
  status: "success" | "error" | "idle";
  message?: string;
}) {
  if (!message) return null;

  return (
    <div
      data-progress-complete="true"
      className={
        status === "success"
          ? "rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
          : "rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
      }
    >
      <p>{message}</p>
      {diagnostic ? (
        <dl className="mt-2 grid gap-1 rounded border border-amber-200 bg-white/60 p-2 text-xs text-amber-950 sm:grid-cols-[6rem_1fr]">
          <dt className="font-semibold">{dictionary.diagnostic.title}</dt>
          <dd>{diagnostic.category}</dd>
          <dt className="font-semibold">{dictionary.diagnostic.endpoint}</dt>
          <dd>{diagnostic.endpoint}</dd>
          <dt className="font-semibold">{dictionary.diagnostic.detail}</dt>
          <dd className="break-all">{diagnostic.detail}</dd>
        </dl>
      ) : null}
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

export function CargoTrackingPanel({
  defaultNotifyEmail,
  dictionary,
  watches
}: {
  defaultNotifyEmail?: string | null;
  dictionary: CargoDictionary;
  watches: CargoWatchListItem[];
}) {
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

  useEffect(() => {
    if (!lookupPending) {
      window.dispatchEvent(new Event("hsfinder:navigation-progress-done"));
    }
  }, [lookupPending]);

  useEffect(() => {
    if (!watchPending) {
      window.dispatchEvent(new Event("hsfinder:navigation-progress-done"));
    }
  }, [watchPending]);

  function hasCargoLookupValue(form: HTMLFormElement) {
    const formData = new FormData(form);
    return ["cargoManagementNo", "masterBlNo", "houseBlNo"].some((key) => {
      const value = formData.get(key);
      return typeof value === "string" && value.trim().length > 0;
    });
  }

  return (
    <div className="grid gap-5">
      <ActiveWatchRows dictionary={dictionary} watches={watches} />

      <Card>
        <CardHeader
          title={dictionary.form.lookupTitle}
          description={dictionary.form.lookupDescription}
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
              setLookupClientError(dictionary.form.missingLookupValue);
              window.dispatchEvent(new Event("hsfinder:navigation-progress-done"));
            }}
          >
            <div className="grid gap-4 md:grid-cols-4">
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                {dictionary.form.houseBl}
                <input autoFocus className="focus-ring rounded-md border border-slate-300 px-3 py-2" disabled={lookupPending} name="houseBlNo" />
              </label>
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                {dictionary.form.masterBl}
                <input className="focus-ring rounded-md border border-slate-300 px-3 py-2" disabled={lookupPending} name="masterBlNo" />
              </label>
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                {dictionary.form.cargoManagementNo}
                <input className="focus-ring rounded-md border border-slate-300 px-3 py-2" disabled={lookupPending} name="cargoManagementNo" />
              </label>
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                {dictionary.form.blYear}
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
                {lookupPending ? dictionary.form.lookupPending : dictionary.form.lookup}
              </button>
              <p className="text-xs text-slate-500">{dictionary.form.lookupHelp}</p>
            </div>
            {lookupPending ? (
              <div className="rounded-md border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800">
                {dictionary.form.progressLookupPending}
              </div>
            ) : null}
            <StatusMessage dictionary={dictionary} diagnostic={lookupState.diagnostic} message={lookupClientError || lookupState.message} status={lookupClientError ? "error" : lookupState.status} />
          </form>
        </CardBody>
      </Card>

      {result ? (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <Card>
            <CardHeader title={dictionary.result.currentStatus} action={<Badge tone="success">{result.summary.progressStatus || dictionary.form.lookup}</Badge>} />
            <CardBody className="p-0">
              <dl>
                <SummaryRow label={dictionary.result.cargoManagementNo} value={result.summary.cargoManagementNo} />
                <SummaryRow label={dictionary.result.masterBl} value={result.summary.masterBlNo} />
                <SummaryRow label={dictionary.result.houseBl} value={result.summary.houseBlNo} />
                <SummaryRow label={dictionary.result.declarationNo} value={result.summary.declarationNo} />
                <SummaryRow label={dictionary.result.managementInspectionYn} value={result.summary.managementInspectionYn} />
                <SummaryRow label={dictionary.result.vesselName} value={result.summary.vesselName} />
                <SummaryRow label={dictionary.result.packageCount} value={result.summary.packageCount} />
                <SummaryRow label={dictionary.result.grossWeight} value={[result.summary.grossWeight, result.summary.weightUnit].filter(Boolean).join(" ")} />
                <SummaryRow label={dictionary.result.arrivalDate} value={result.summary.arrivalDate} />
                <SummaryRow label={dictionary.result.portWarehouse} value={result.summary.portName} />
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={dictionary.result.events} description={dictionary.result.eventsDescription} />
            <CardBody className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2">{dictionary.result.processedAt}</th>
                      <th className="px-3 py-2">{dictionary.result.status}</th>
                      <th className="px-3 py-2">{dictionary.result.location}</th>
                      <th className="px-3 py-2">{dictionary.result.agency}</th>
                      <th className="px-3 py-2">{dictionary.result.detail}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {result.events.length ? result.events.map((event, index) => (
                      <tr key={`${event.eventTime}-${event.status}-${index}`}>
                        <td className="whitespace-nowrap px-3 py-2 text-slate-700">{event.eventTime || "-"}</td>
                        <td className="px-3 py-2 font-semibold text-slate-950">{event.displayStatus || event.status || event.statusCode || "-"}</td>
                        <td className="px-3 py-2 text-slate-700">{event.location || "-"}</td>
                        <td className="px-3 py-2 text-slate-700">{event.agency || "-"}</td>
                        <td className="px-3 py-2 text-slate-600">{event.processingDetails || "-"}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td className="px-3 py-6 text-center text-slate-500" colSpan={5}>{dictionary.result.historyEmpty}</td>
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
          <CardHeader title={dictionary.watch.title} description={dictionary.watch.description} action={<Badge tone="warning">{dictionary.watch.cadence}</Badge>} />
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
                setWatchClientError(dictionary.watch.missingWatchValue);
                window.dispatchEvent(new Event("hsfinder:navigation-progress-done"));
              }}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-1 text-sm font-medium text-slate-700">
                  {dictionary.watch.email}
                  <input className="focus-ring rounded-md border border-slate-300 px-3 py-2" defaultValue={defaultNotifyEmail ?? ""} disabled={watchPending} name="notifyEmail" type="email" />
                </label>
                <label className="grid gap-1 text-sm font-medium text-slate-700">
                  {dictionary.form.houseBl}
                  <input className="focus-ring rounded-md border border-slate-300 px-3 py-2" disabled={watchPending} name="houseBlNo" />
                </label>
                <label className="grid gap-1 text-sm font-medium text-slate-700">
                  {dictionary.form.masterBl}
                  <input className="focus-ring rounded-md border border-slate-300 px-3 py-2" disabled={watchPending} name="masterBlNo" />
                </label>
                <label className="grid gap-1 text-sm font-medium text-slate-700">
                  {dictionary.form.cargoManagementNo}
                  <input className="focus-ring rounded-md border border-slate-300 px-3 py-2" disabled={watchPending} name="cargoManagementNo" />
                </label>
                <label className="grid gap-1 text-sm font-medium text-slate-700">
                  {dictionary.form.blYear}
                  <input className="focus-ring rounded-md border border-slate-300 px-3 py-2" defaultValue={currentYear} disabled={watchPending} inputMode="numeric" maxLength={4} name="blYear" />
                </label>
                <label className="grid gap-1 text-sm font-medium text-slate-700">
                  {dictionary.watch.targetStatus}
                  <select className="focus-ring rounded-md border border-slate-300 bg-white px-3 py-2" disabled={watchPending} name="targetStatus" defaultValue="cy_inbound">
                    {statusOptions.map((status) => <option key={status.value} value={status.value}>{cargoTargetStatusLabel(status.value, dictionary)}</option>)}
                  </select>
                </label>
              </div>
              <button
                className="focus-ring inline-flex min-h-10 w-fit items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500"
                disabled={watchPending}
                type="submit"
              >
                {watchPending ? <Loader2 aria-hidden="true" className="animate-spin" size={18} /> : <Bell aria-hidden="true" size={18} />}
                {watchPending ? dictionary.watch.registerPending : dictionary.watch.register}
              </button>
              <StatusMessage dictionary={dictionary} message={watchClientError || watchState.message} status={watchClientError ? "error" : watchState.status} />
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={dictionary.watch.listTitle} description={dictionary.watch.listDescription} action={<Ship aria-hidden="true" className="text-slate-400" size={20} />} />
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2">{dictionary.watch.value}</th>
                    <th className="px-3 py-2">{dictionary.watch.target}</th>
                    <th className="px-3 py-2">{dictionary.watch.current}</th>
                    <th className="px-3 py-2">{dictionary.watch.status}</th>
                    <th className="px-3 py-2">{dictionary.watch.lastChecked}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {watches.length ? watches.map((watch) => (
                    <tr key={watch.id}>
                      <td className="px-3 py-2 font-mono text-xs text-slate-700">
                        {watch.cargoManagementNo || watch.houseBlNo || watch.masterBlNo || "-"}
                        {watch.blYear ? ` / ${watch.blYear}` : ""}
                      </td>
                      <td className="px-3 py-2 font-semibold text-slate-900">{cargoTargetStatusLabel(watch.targetStatus, dictionary)}</td>
                      <td className="px-3 py-2 text-slate-700">{watch.lastStatus || "-"}</td>
                      <td className="px-3 py-2"><Badge tone={watch.status === "matched" ? "success" : watch.status === "active" ? "info" : "warning"}>{cargoWatchStatusLabel(watch.status, dictionary)}</Badge></td>
                      <td className="px-3 py-2 text-slate-500">{watch.lastCheckedAt ? new Date(watch.lastCheckedAt).toLocaleString("ko-KR") : "-"}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td className="px-3 py-8 text-center text-slate-500" colSpan={5}>{dictionary.watch.empty}</td>
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
