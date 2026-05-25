"use client";

import { useActionState } from "react";
import { RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { refreshOperationsSnapshotsAction } from "@/server/actions/operations-refresh.actions";
import type { OperationsRefreshActionState } from "@/features/legal-updates/operations-refresh-schemas";

const initialState: OperationsRefreshActionState = { status: "idle" };

export function OperationsRefreshPanel({ basisDate }: { basisDate: string }) {
  const [state, formAction, pending] = useActionState(refreshOperationsSnapshotsAction, initialState);

  return (
    <Card>
      <CardHeader
        title="운영 집계 갱신"
        description="대시보드 지표와 목적국 데이터 커버리지를 현재 published 데이터 기준으로 다시 계산합니다."
        action={<Badge tone="info">service role RPC</Badge>}
      />
      <CardBody>
        <form action={formAction} className="grid gap-4 lg:grid-cols-[220px_1fr] lg:items-end">
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            기준일
            <input
              className="focus-ring h-11 rounded-md border border-slate-300 px-3 text-sm"
              defaultValue={basisDate}
              disabled={pending}
              name="basisDate"
              type="date"
            />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <button
              className="focus-ring inline-flex h-11 items-center gap-2 rounded-md bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500"
              disabled={pending}
              type="submit"
            >
              <RefreshCw aria-hidden="true" className={pending ? "animate-spin" : ""} size={17} />
              {pending ? "갱신 중" : "운영 집계 갱신"}
            </button>
            <p className="text-xs leading-5 text-slate-500">
              source publish 후 수동 갱신하거나 배포 후 스모크 테스트 전에 실행합니다.
            </p>
          </div>
          {state.message ? (
            <div className={state.status === "success" ? "rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 lg:col-span-2" : "rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 lg:col-span-2"}>
              {state.message}
            </div>
          ) : null}
        </form>
      </CardBody>
    </Card>
  );
}
