"use client";

import { useActionState, useEffect } from "react";
import { Bell, MailCheck, MailX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import type {
  MarketplaceEmailNotificationPreferencesActionState
} from "@/features/marketplace-notification-preferences/schemas";
import { updateMarketplaceEmailNotificationPreferencesAction } from "@/server/actions/marketplace-notification-preferences.actions";
import type {
  MarketplaceEmailNotificationPreferenceKind,
  MarketplaceEmailNotificationPreferencesDashboard
} from "@/server/repositories/marketplace-notification-preferences.repository";

const initialState: MarketplaceEmailNotificationPreferencesActionState = {
  status: "idle"
};

const notificationKindCopy: Record<MarketplaceEmailNotificationPreferenceKind, {
  description: string;
  formName: string;
  title: string;
}> = {
  deadline_reminder: {
    description: "이미 매칭된 요청의 응답 마감이 가까워질 때 이메일을 받습니다.",
    formName: "deadlineReminder",
    title: "마감 임박 이메일"
  },
  initial: {
    description: "회사 관심 조건과 일치하는 새 운송 견적·통관 의뢰가 공개될 때 이메일을 받습니다.",
    formName: "initial",
    title: "신규 요청 이메일"
  }
};

export function MarketplaceEmailNotificationPreferencesPanel({
  dashboard
}: {
  dashboard: MarketplaceEmailNotificationPreferencesDashboard;
}) {
  const [state, action, pending] = useActionState(
    updateMarketplaceEmailNotificationPreferencesAction,
    initialState
  );
  const enabledCount = dashboard.preferences.filter((preference) => preference.enabled).length;

  useEffect(() => {
    if (state.status !== "idle") {
      window.dispatchEvent(new Event("hsfinder:navigation-progress-done"));
    }
  }, [state.status]);

  return (
    <Card>
      <CardHeader
        action={enabledCount > 0 ? (
          <MailCheck aria-hidden="true" className="text-blue-700" size={22} />
        ) : (
          <MailX aria-hidden="true" className="text-slate-500" size={22} />
        )}
        description="대시보드 인앱 알림은 계속 표시되며, 이메일은 직접 켠 항목만 발송됩니다."
        title="내 이메일 알림 수신 설정"
      />
      <CardBody className="grid gap-4">
        {!dashboard.schemaReady ? (
          <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
            현재 이 환경에서는 이메일 알림 수신 설정이 준비 중입니다. 대시보드 인앱 알림은 계속 확인할 수 있습니다.
          </p>
        ) : null}

        <div className="grid gap-2 rounded-md border border-blue-100 bg-blue-50 p-3 text-xs leading-5 text-blue-950">
          <p className="font-semibold">회사 관심 조건과 다른 설정입니다.</p>
          <p>파트너 관심 조건은 어떤 요청에 매칭될지 정하고, 이 설정은 내 이메일 주소로 받을지 정합니다.</p>
          <p>이메일을 꺼도 파트너 워크스페이스와 대시보드의 인앱 알림은 유지됩니다.</p>
        </div>

        <form action={action} className="grid gap-4 rounded-md border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-950">
                <Bell aria-hidden="true" className="text-blue-700" size={18} />
                이메일 수신 항목
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                수신 주소: {dashboard.userEmail ?? "로그인 이메일 확인 필요"}
              </p>
            </div>
            <Badge tone={enabledCount > 0 ? "success" : "neutral"}>
              {enabledCount > 0 ? `이메일 ${enabledCount}개 수신` : "이메일 미수신"}
            </Badge>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {dashboard.preferences.map((preference) => {
              const copy = notificationKindCopy[preference.notificationKind];
              return (
                <label
                  className="grid gap-2 rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-700"
                  key={preference.notificationKind}
                >
                  <span className="inline-flex items-center gap-2 font-semibold text-slate-900">
                    <input
                      className="size-4 rounded border-slate-300"
                      defaultChecked={preference.enabled}
                      disabled={!dashboard.schemaReady || pending}
                      name={copy.formName}
                      type="checkbox"
                    />
                    {copy.title}
                  </span>
                  <span className="text-xs leading-5 text-slate-500">{copy.description}</span>
                  {preference.updatedAt ? (
                    <span className="text-xs text-slate-400">최근 저장 {preference.updatedAt.slice(0, 10)}</span>
                  ) : null}
                </label>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-md bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-500"
              disabled={!dashboard.schemaReady || pending}
              type="submit"
            >
              <MailCheck aria-hidden="true" size={16} />
              이메일 수신 설정 저장
            </button>
            <span className="text-xs leading-5 text-slate-500">
              공개 수신거부 링크는 아직 제공하지 않으며, 로그인한 설정 화면에서 변경합니다.
            </span>
          </div>

          {state.message ? (
            <p
              className={
                state.status === "success"
                  ? "rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
                  : "rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"
              }
            >
              {state.message}
            </p>
          ) : null}
        </form>
      </CardBody>
    </Card>
  );
}
