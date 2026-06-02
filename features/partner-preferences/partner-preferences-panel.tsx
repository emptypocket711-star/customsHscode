"use client";

import { useActionState, useEffect } from "react";
import { Bell, BellOff, Ship, SlidersHorizontal, Stamp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import type {
  PartnerPreferenceActionState,
  PartnerServiceType
} from "@/features/partner-preferences/schemas";
import { updatePartnerPreferenceAction } from "@/server/actions/partner-preferences.actions";
import type {
  PartnerPreferenceItem,
  PartnerPreferencesDashboard
} from "@/server/repositories/partner-preferences.repository";

const initialState: PartnerPreferenceActionState = {
  status: "idle"
};

const serviceLabels: Record<PartnerServiceType, { title: string; description: string }> = {
  clearance: {
    title: "통관 의뢰 관심 조건",
    description: "관세사무소가 받고 싶은 통관 의뢰의 방향, 국가, 긴급 가능 여부를 저장합니다."
  },
  freight: {
    title: "운송 견적 관심 조건",
    description: "포워더가 받고 싶은 운송 견적의 방향, 국가, 운송 방식, 항구 조건을 저장합니다."
  }
};

const transportModeOptions = [
  { label: "해상", value: "sea" },
  { label: "항공", value: "air" },
  { label: "특송", value: "express" },
  { label: "내륙", value: "truck" },
  { label: "철도", value: "rail" }
];

function joinCsv(values: string[]) {
  return values.join(", ");
}

function ServiceIcon({ serviceType }: { serviceType: PartnerServiceType }) {
  if (serviceType === "clearance") return <Stamp aria-hidden="true" className="text-blue-700" size={21} />;
  return <Ship aria-hidden="true" className="text-blue-700" size={21} />;
}

function PreferenceForm({
  canEdit,
  preference
}: {
  canEdit: boolean;
  preference: PartnerPreferenceItem;
}) {
  const [state, action, pending] = useActionState(updatePartnerPreferenceAction, initialState);
  const service = serviceLabels[preference.serviceType];
  const disabled = !canEdit || pending;

  useEffect(() => {
    if (state.status !== "idle") {
      window.dispatchEvent(new Event("hsfinder:navigation-progress-done"));
    }
  }, [state.status]);

  return (
    <form action={action} className="grid gap-4 rounded-md border border-slate-200 bg-slate-50 p-4">
      <input name="serviceType" type="hidden" value={preference.serviceType} />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-950">
            <ServiceIcon serviceType={preference.serviceType} />
            {service.title}
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">{service.description}</p>
        </div>
        <Badge tone={preference.id ? "success" : "neutral"}>{preference.id ? "저장됨" : "미설정"}</Badge>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <fieldset className="grid gap-2 rounded-md border border-slate-200 bg-white p-3">
          <legend className="px-1 text-sm font-semibold text-slate-800">방향</legend>
          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              className="size-4 rounded border-slate-300"
              defaultChecked={preference.directions.includes("import")}
              disabled={disabled}
              name="directions"
              type="checkbox"
              value="import"
            />
            수입
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              className="size-4 rounded border-slate-300"
              defaultChecked={preference.directions.includes("export")}
              disabled={disabled}
              name="directions"
              type="checkbox"
              value="export"
            />
            수출
          </label>
        </fieldset>

        <fieldset className="grid gap-2 rounded-md border border-slate-200 bg-white p-3">
          <legend className="px-1 text-sm font-semibold text-slate-800">알림</legend>
          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              className="size-4 rounded border-slate-300"
              defaultChecked={preference.notificationEnabled}
              disabled={disabled}
              name="notificationEnabled"
              type="checkbox"
            />
            조건 일치 요청 알림 받기
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              className="size-4 rounded border-slate-300"
              defaultChecked={preference.digestEnabled}
              disabled={disabled}
              name="digestEnabled"
              type="checkbox"
            />
            알림을 묶어서 받기
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              className="size-4 rounded border-slate-300"
              defaultChecked={preference.urgentAvailable}
              disabled={disabled}
              name="urgentAvailable"
              type="checkbox"
            />
            긴급 건 대응 가능
          </label>
        </fieldset>
      </div>

      {preference.serviceType === "freight" ? (
        <fieldset className="grid gap-2 rounded-md border border-slate-200 bg-white p-3">
          <legend className="px-1 text-sm font-semibold text-slate-800">운송 방식</legend>
          <div className="flex flex-wrap gap-3">
            {transportModeOptions.map((option) => (
              <label className="inline-flex items-center gap-2 text-sm text-slate-700" key={option.value}>
                <input
                  className="size-4 rounded border-slate-300"
                  defaultChecked={preference.transportModes.includes(option.value)}
                  disabled={disabled}
                  name="transportModes"
                  type="checkbox"
                  value={option.value}
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          출발/수출 국가 코드
          <input
            className="focus-ring rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950"
            defaultValue={joinCsv(preference.originCountryCodes)}
            disabled={disabled}
            name="originCountryCodes"
            placeholder="KR, CN, US"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          도착/수입 국가 코드
          <input
            className="focus-ring rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950"
            defaultValue={joinCsv(preference.destinationCountryCodes)}
            disabled={disabled}
            name="destinationCountryCodes"
            placeholder="US, EU, JP"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          항구·공항·지역
          <input
            className="focus-ring rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950"
            defaultValue={joinCsv(preference.ports)}
            disabled={disabled}
            name="ports"
            placeholder="BUSAN, INCHEON, LAX"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          화물 태그
          <input
            className="focus-ring rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950"
            defaultValue={joinCsv(preference.cargoTags)}
            disabled={disabled}
            name="cargoTags"
            placeholder="used_car, food, cosmetics"
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-md bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-500"
          disabled={disabled}
          type="submit"
        >
          <SlidersHorizontal aria-hidden="true" size={16} />
          관심 조건 저장
        </button>
        {preference.updatedAt ? <span className="text-xs text-slate-500">최근 저장 {preference.updatedAt.slice(0, 10)}</span> : null}
      </div>

      {state.message && state.serviceType === preference.serviceType ? (
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
  );
}

export function PartnerPreferencesPanel({
  dashboard
}: {
  dashboard: PartnerPreferencesDashboard;
}) {
  const canEdit = dashboard.schemaReady && dashboard.companyRole === "admin";
  const hasPartnerRole = dashboard.partyTypes.includes("forwarder") || dashboard.partyTypes.includes("customs_broker");

  return (
    <Card>
      <CardHeader
        action={dashboard.preferences.some((preference) => preference.notificationEnabled) ? (
          <Bell aria-hidden="true" className="text-blue-700" size={22} />
        ) : (
          <BellOff aria-hidden="true" className="text-slate-500" size={22} />
        )}
        description="조건에 맞는 운송 견적·통관 의뢰만 노출하고 알림 피로도를 줄이기 위한 설정입니다."
        title="파트너 관심 조건"
      />
      <CardBody className="grid gap-4">
        {!dashboard.schemaReady ? (
          <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
            현재 이 환경에서는 파트너 관심 조건 기능이 준비 중입니다. 로그인 문제는 아니며, 역할·검증 데이터 준비 후 저장이 활성화됩니다.
          </p>
        ) : null}

        {dashboard.schemaReady && !hasPartnerRole ? (
          <p className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-600">
            포워더 또는 관세사무소 역할이 있는 회사만 파트너 관심 조건을 설정합니다.
          </p>
        ) : null}

        {dashboard.preferences.map((preference) => (
          <PreferenceForm canEdit={canEdit} key={preference.serviceType} preference={preference} />
        ))}
      </CardBody>
    </Card>
  );
}
