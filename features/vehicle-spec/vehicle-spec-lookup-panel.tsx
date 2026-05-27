"use client";

import { useActionState, useEffect, useState } from "react";
import { ExternalLink, Loader2, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import {
  lookupVehicleSpecAction,
  type VehicleSpecLookupActionState
} from "@/server/actions/vehicle-spec.actions";

const initialState: VehicleSpecLookupActionState = { status: "idle" };

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

function ResultTable({ rows }: { rows: Array<{ label: string; value: string }> }) {
  if (!rows.length) {
    return <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">표시할 상세 항목이 없습니다.</div>;
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

export function VehicleSpecLookupPanel() {
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
          title="자동차 제원관리번호 조회"
          description="제원관리번호를 입력하면 한국교통안전공단 사이버검사소의 자동차 제원조회 결과를 표시합니다."
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
              setClientError("제원관리번호를 입력해 주세요.");
              window.dispatchEvent(new Event("hsfinder:navigation-progress-done"));
            }}
          >
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              제원관리번호
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
                {pending ? "조회 중" : "조회"}
              </button>
              <a
                className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                href="https://www.cyberts.kr/ts/tis/ism/readTsTisSpecSvcMainView.do"
                rel="noreferrer"
                target="_blank"
              >
                원사이트 열기
                <ExternalLink aria-hidden="true" size={16} />
              </a>
              <p className="text-xs text-slate-500">자동차명 검색이 아니라 제원관리번호 기준 조회입니다.</p>
            </div>
            {pending ? (
              <div className="rounded-md border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800">
                CyberTS 자동차 제원 정보를 조회하고 있습니다.
              </div>
            ) : null}
            <StatusMessage clientError={clientError} state={state} />
          </form>
        </CardBody>
      </Card>

      {result ? (
        <Card>
          <CardHeader
            title="조회 결과"
            description={`${result.snapshot.sourceName}에서 조회한 자동차 제원 정보입니다.`}
            action={<Badge tone="success">{result.specManageNo}</Badge>}
          />
          <CardBody className="grid gap-4">
            <ResultTable rows={result.summary} />
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600">
              <p>출처: {result.snapshot.sourceName}</p>
              <p>조회시각: {new Date(result.snapshot.retrievedAt).toLocaleString("ko-KR")}</p>
              <a className="font-semibold text-blue-700 underline-offset-2 hover:underline" href={result.snapshot.sourceUrl} rel="noreferrer" target="_blank">
                원문 조회 화면 열기
              </a>
            </div>
          </CardBody>
        </Card>
      ) : null}

      <Card>
        <CardHeader title="조회 범위" description="이 기능은 CyberTS 자동차 제원관리번호 조회 화면을 보조적으로 연결합니다." />
        <CardBody>
          <ul className="grid gap-2 text-sm leading-6 text-slate-600">
            <li>자동차가 기본 선택된 상태로 조회합니다.</li>
            <li>입력값은 제원관리번호 기준입니다. 자동차명, 모델명만으로는 조회되지 않을 수 있습니다.</li>
            <li>외부 사이트의 보안 정책이나 화면 구조 변경에 따라 조회가 제한될 수 있습니다.</li>
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
