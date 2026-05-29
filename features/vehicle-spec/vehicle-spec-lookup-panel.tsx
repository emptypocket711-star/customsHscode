"use client";

import { useActionState, useEffect, useState } from "react";
import { ExternalLink, Loader2, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import {
  lookupVehicleSpecAction,
  type VehicleSpecLookupActionState
} from "@/server/actions/vehicle-spec.actions";
import type { UsedCarExportDictionary } from "@/lib/i18n";

const initialState: VehicleSpecLookupActionState = { status: "idle" };

function formatTemplate(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce((text, [key, value]) => text.replaceAll(`{${key}}`, value), template);
}

function StatusMessage({ state, clientError }: { state: VehicleSpecLookupActionState; clientError: string }) {
  const message = clientError || state.message;
  if (!message) return null;

  const isSuccess = !clientError && state.status === "success";

  return (
    <div
      data-progress-complete="true"
      className={
        isSuccess
          ? "rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
          : "rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
      }
    >
      {message}
    </div>
  );
}

function ResultTable({ dictionary, rows }: { dictionary: UsedCarExportDictionary; rows: Array<{ label: string; value: string }> }) {
  if (!rows.length) {
    return <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">{dictionary.vehicleSpec.emptyDetails}</div>;
  }

  return (
    <dl className="overflow-hidden rounded-md border border-slate-200">
      {rows.map((row) => (
        <div className="grid border-b border-slate-100 last:border-b-0 sm:grid-cols-[11rem_1fr]" key={row.label}>
          <dt className="bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600">{row.label}</dt>
          <dd className="px-3 py-2 text-sm font-medium text-slate-950">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function VehicleSpecLookupPanel({ dictionary }: { dictionary: UsedCarExportDictionary }) {
  const [state, action, pending] = useActionState(lookupVehicleSpecAction, initialState);
  const [clientError, setClientError] = useState("");
  const result = state.result;

  useEffect(() => {
    if (state.status !== "idle" || !pending) {
      window.dispatchEvent(new Event("hsfinder:navigation-progress-done"));
    }
  }, [pending, state.status]);

  return (
    <div className="grid gap-5">
      <Card>
        <CardHeader
          title={dictionary.vehicleSpec.title}
          description={dictionary.vehicleSpec.description}
          action={<Badge tone="info">CyberTS</Badge>}
        />
        <CardBody>
          <form
            action={action}
            className="grid gap-4"
            onSubmit={(event) => {
              const formData = new FormData(event.currentTarget);
              const value = String(formData.get("specManageNo") ?? "").trim();
              if (value) {
                setClientError("");
                return;
              }

              event.preventDefault();
              setClientError(dictionary.vehicleSpec.missingInput);
              window.dispatchEvent(new Event("hsfinder:navigation-progress-done"));
            }}
          >
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              {dictionary.vehicleSpec.inputLabel}
              <input
                autoFocus
                className="focus-ring rounded-md border border-slate-300 px-3 py-2 text-sm uppercase"
                disabled={pending}
                name="specManageNo"
                placeholder="예: A0810005200013316"
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
              <a
                className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                href="https://www.cyberts.kr/ts/tis/ism/readTsTisSpecSvcMainView.do"
                rel="noreferrer"
                target="_blank"
              >
                {dictionary.common.openOriginal}
                <ExternalLink aria-hidden="true" size={16} />
              </a>
              <p className="text-xs text-slate-500">{dictionary.vehicleSpec.externalHelp}</p>
            </div>
            {pending ? (
              <div className="rounded-md border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800">
                {dictionary.vehicleSpec.pendingMessage}
              </div>
            ) : null}
            <StatusMessage clientError={clientError} state={state} />
          </form>
        </CardBody>
      </Card>

      {result ? (
        <Card>
          <CardHeader
            title={dictionary.vehicleSpec.resultTitle}
            description={formatTemplate(dictionary.vehicleSpec.resultDescription, { sourceName: result.snapshot.sourceName })}
            action={<Badge tone="success">{result.specManageNo}</Badge>}
          />
          <CardBody className="grid gap-4">
            <ResultTable dictionary={dictionary} rows={result.summary} />
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600">
              <p>{dictionary.vehicleSpec.source}: {result.snapshot.sourceName}</p>
              <p>{dictionary.vehicleSpec.retrievedAt}: {new Date(result.snapshot.retrievedAt).toLocaleString("ko-KR")}</p>
              <a className="font-semibold text-blue-700 underline-offset-2 hover:underline" href={result.snapshot.sourceUrl} rel="noreferrer" target="_blank">
                {dictionary.vehicleSpec.sourceOpen}
              </a>
            </div>
          </CardBody>
        </Card>
      ) : null}

      <Card>
        <CardHeader title={dictionary.vehicleSpec.rangeTitle} description={dictionary.vehicleSpec.rangeDescription} />
        <CardBody>
          <ul className="grid gap-2 text-sm leading-6 text-slate-600">
            {dictionary.vehicleSpec.rangeItems.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
