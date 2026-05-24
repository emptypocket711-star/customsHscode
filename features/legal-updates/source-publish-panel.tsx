"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { publishSourceVersionAction } from "@/server/actions/source-publish.actions";
import type { PublishSourceVersionActionState } from "@/features/legal-updates/source-publish-schemas";

const initialState: PublishSourceVersionActionState = { status: "idle" };

const sourcePresets = [
  {
    label: "관세청 HS부호 20260101",
    targetTable: "hs_master",
    sourceVersion: "customs-hs-20260101",
    prefix: false
  },
  {
    label: "관세청 표준품명 20260101",
    targetTable: "standard_product_names",
    sourceVersion: "customs-standard-product-20260101",
    prefix: false
  },
  {
    label: "관세청 HS부호검색 API018",
    targetTable: "customs_hs_code_search_items",
    sourceVersion: "myc-openapi-api018-v1.0",
    prefix: true
  },
  {
    label: "관세청 품목번호별 관세율표 20260211",
    targetTable: "tariff_rates",
    sourceVersion: "customs-domestic-tariff-20260211",
    prefix: false
  },
  {
    label: "관세청 관세율 API030",
    targetTable: "tariff_rates",
    sourceVersion: "myc-openapi-api030-v1.0",
    prefix: false
  },
  {
    label: "관세청 국가별 관세율표 20251231 전체",
    targetTable: "export_destination_tariff_rates",
    sourceVersion: "customs-country-tariff-20251231:",
    prefix: true
  },
  {
    label: "관세청 세관장확인대상 API029",
    targetTable: "customs_confirmation_requirements",
    sourceVersion: "myc-openapi-api029-v1.0",
    prefix: false
  },
  {
    label: "관세청 통계부호 API019",
    targetTable: "customs_statistical_codes",
    sourceVersion: "myc-openapi-api019-v1.0",
    prefix: false
  },
  {
    label: "내국세 법령 룰",
    targetTable: "internal_tax_law_rules",
    sourceVersion: "internal-tax-law-rules-",
    prefix: true
  },
  {
    label: "상대국 세번 보강자료",
    targetTable: "export_destination_customs_codes",
    sourceVersion: "china-customs-declaration-codes-2026",
    prefix: true
  },
  {
    label: "상대국 추가관세",
    targetTable: "export_destination_additional_tariffs",
    sourceVersion: "usitc-chapter99-additional-tariffs-",
    prefix: true
  },
  {
    label: "상대국 무역구제",
    targetTable: "export_destination_trade_remedy_cases",
    sourceVersion: "usitc-adcvd-",
    prefix: true
  },
  {
    label: "상대국 데이터 출처 레지스트리",
    targetTable: "export_destination_data_sources",
    sourceVersion: "destination-source-registry-20260523",
    prefix: false
  }
];

export function SourcePublishPanel() {
  const [state, formAction, pending] = useActionState(publishSourceVersionAction, initialState);

  return (
    <Card>
      <CardHeader
        title="관세청 staged 데이터 게시"
        description="엑셀 seed로 적재한 staged 데이터를 source_version 단위로 published 전환합니다. 게시 후 진단 조회에서 basis_date 필터 대상이 됩니다."
        action={<Badge tone="warning">staff/admin only</Badge>}
      />
      <CardBody>
        <form action={formAction} className="grid gap-4">
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              빠른 선택
              <select
                className="focus-ring rounded-md border border-slate-300 bg-white px-3 py-2"
                disabled={pending}
                onChange={(event) => {
                  const selected = sourcePresets[Number(event.currentTarget.value)];
                  const form = event.currentTarget.form;
                  if (!selected || !form) return;
                  (form.elements.namedItem("targetTable") as HTMLSelectElement).value = selected.targetTable;
                  (form.elements.namedItem("sourceVersion") as HTMLInputElement).value = selected.sourceVersion;
                  (form.elements.namedItem("matchPrefix") as HTMLInputElement).checked = selected.prefix;
                }}
              >
                {sourcePresets.map((preset, index) => (
                  <option key={preset.label} value={index}>{preset.label}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              대상 테이블
              <select className="focus-ring rounded-md border border-slate-300 bg-white px-3 py-2" disabled={pending} name="targetTable" defaultValue="hs_master">
                <option value="hs_master">hs_master</option>
                <option value="standard_product_names">standard_product_names</option>
                <option value="customs_hs_code_search_items">customs_hs_code_search_items</option>
                <option value="tariff_rates">tariff_rates</option>
                <option value="export_destination_tariff_rates">export_destination_tariff_rates</option>
                <option value="customs_confirmation_requirements">customs_confirmation_requirements</option>
                <option value="integrated_public_notice_requirements">integrated_public_notice_requirements</option>
                <option value="customs_statistical_codes">customs_statistical_codes</option>
                <option value="internal_tax_law_rules">internal_tax_law_rules</option>
                <option value="export_destination_customs_codes">export_destination_customs_codes</option>
                <option value="export_destination_import_requirements">export_destination_import_requirements</option>
                <option value="export_destination_internal_taxes">export_destination_internal_taxes</option>
                <option value="export_destination_additional_tariffs">export_destination_additional_tariffs</option>
                <option value="export_destination_trade_remedy_cases">export_destination_trade_remedy_cases</option>
                <option value="export_destination_data_sources">export_destination_data_sources</option>
              </select>
            </label>
          </div>
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            source_version
            <input
              className="focus-ring rounded-md border border-slate-300 px-3 py-2 font-mono text-sm"
              defaultValue="customs-hs-20260101"
              disabled={pending}
              name="sourceVersion"
            />
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input className="size-4 rounded border-slate-300" disabled={pending} name="matchPrefix" type="checkbox" value="on" />
            prefix match 사용
          </label>
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            게시 메모
            <input
              className="focus-ring rounded-md border border-slate-300 px-3 py-2"
              disabled={pending}
              name="note"
              placeholder="예: 관세청 다운로드 파일 checksum 확인 후 게시"
            />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <button
              className="focus-ring inline-flex items-center gap-2 rounded-md bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              disabled={pending}
              type="submit"
            >
              <CheckCircle2 aria-hidden="true" size={18} />
              published 전환
            </button>
            <p className="text-xs text-slate-500">source_version 단위 전환만 수행하며 원천 행을 삭제하지 않습니다.</p>
          </div>
          {state.message ? (
            <div className={state.status === "success" ? "rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800" : "rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"}>
              {state.message}
            </div>
          ) : null}
        </form>
      </CardBody>
    </Card>
  );
}
