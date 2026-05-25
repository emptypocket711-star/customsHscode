import {
  mockSourceVersionInventory,
  type SourceVersionInventoryItem
} from "@/features/legal-updates/mock-source-inventory";
import { createSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase/server";
import {
  getDomesticHsLookupSnapshotCoverageFromSupabase,
  getSourceVersionInventoryFromSupabase,
  getRequirementPlaybookCoverageFromSupabase,
  type DomesticHsLookupSnapshotCoverage,
  type RequirementPlaybookCoverage
} from "@/server/repositories/source-inventory.repository";

export type SourceVersionInventoryResult = {
  items: SourceVersionInventoryItemWithDiagnostics[];
  dataSource: "mock" | "supabase";
  loadError?: string;
  domesticLookupCoverage: DomesticHsLookupSnapshotCoverage;
  requirementPlaybookCoverage: RequirementPlaybookCoverage;
  summary: {
    stagedCount: number;
    publishedCount: number;
    totalRows: number;
    diagnosticCounts: Record<SourceVersionInventoryDiagnosticSeverity, number>;
    groupSummaries: SourceVersionInventoryGroupSummary[];
  };
};

export type SourceVersionInventoryDiagnosticSeverity = "ok" | "warning" | "danger";

export type SourceVersionInventoryDiagnostic = {
  severity: SourceVersionInventoryDiagnosticSeverity;
  label: string;
  message: string;
};

export type SourceVersionInventoryItemWithDiagnostics = SourceVersionInventoryItem & {
  diagnostics: SourceVersionInventoryDiagnostic[];
};

export type SourceVersionInventoryGroupSummary = {
  groupKey: "domestic" | "destination" | "requirements" | "originMarking" | "internalTax" | "sourceRegistry" | "other";
  label: string;
  itemCount: number;
  stagedCount: number;
  publishedCount: number;
  totalRows: number;
  warningCount: number;
  dangerCount: number;
};

const sourceInventoryGroups: Array<{ key: SourceVersionInventoryGroupSummary["groupKey"]; label: string; tables: string[] }> = [
  { key: "domestic", label: "국내 HS/관세", tables: ["hs_master", "standard_product_names", "customs_hs_code_search_items", "tariff_rates"] },
  { key: "requirements", label: "수입요건", tables: ["customs_confirmation_requirements", "integrated_public_notice_requirements", "requirement_playbooks", "export_destination_import_requirements"] },
  { key: "originMarking", label: "원산지표시", tables: ["origin_marking_targets", "origin_marking_methods"] },
  { key: "internalTax", label: "내국세", tables: ["customs_statistical_codes", "internal_tax_law_rules", "export_destination_internal_taxes"] },
  { key: "destination", label: "상대국 관세", tables: ["export_destination_tariff_rates", "export_destination_customs_codes", "export_destination_additional_tariffs", "export_destination_trade_remedy_cases"] },
  { key: "sourceRegistry", label: "출처 레지스트리", tables: ["export_destination_data_sources"] }
];

const mockDomesticLookupCoverage: DomesticHsLookupSnapshotCoverage = {
  snapshotBasisDate: "2026-05-25",
  totalHsk10: 11327,
  withTariffRates: 11326,
  missingTariffRates: 1,
  withCustomsRequirements: 4806,
  withPublicNoticeRequirements: 0,
  withInternalTaxes: 135,
  lastRefreshedAt: "2026-05-25T10:11:02+00:00"
};

const mockRequirementPlaybookCoverage: RequirementPlaybookCoverage = {
  totalRequirementPairs: 55,
  withPlaybook: 55,
  missingPlaybook: 0,
  coverageRate: 100,
  missingRequirements: [],
  sourceVersions: [
    {
      sourceVersion: "requirement-playbook-remaining-20260525",
      rowCount: 15,
      latestRetrievedAt: "2026-05-25T00:00:00+09:00",
      latestPublishedAt: "2026-05-25T00:00:00+09:00"
    },
    {
      sourceVersion: "requirement-playbook-tertiary-20260525",
      rowCount: 20,
      latestRetrievedAt: "2026-05-25T00:00:00+09:00",
      latestPublishedAt: "2026-05-25T00:00:00+09:00"
    },
    {
      sourceVersion: "requirement-playbook-secondary-20260525",
      rowCount: 7,
      latestRetrievedAt: "2026-05-25T00:00:00+09:00",
      latestPublishedAt: "2026-05-25T00:00:00+09:00"
    },
    {
      sourceVersion: "requirement-playbook-core-20260525",
      rowCount: 12,
      latestRetrievedAt: "2026-05-25T00:00:00+09:00",
      latestPublishedAt: "2026-05-25T00:00:00+09:00"
    },
    {
      sourceVersion: "requirement-playbook-import-food-20260525",
      rowCount: 1,
      latestRetrievedAt: "2026-05-25T00:00:00+09:00",
      latestPublishedAt: "2026-05-25T00:00:00+09:00"
    }
  ],
  stalePlaybooks: [],
  invalidSourceUrls: []
};

function inventoryGroupForTable(targetTable: string) {
  return sourceInventoryGroups.find((group) => group.tables.includes(targetTable)) ?? {
    key: "other" as const,
    label: "기타",
    tables: []
  };
}

function daysBetween(fromIso: string, to: Date) {
  const from = new Date(fromIso);
  if (Number.isNaN(from.getTime())) return null;

  return Math.floor((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000));
}

function diagnoseSourceInventoryItem(item: SourceVersionInventoryItem, now = new Date()): SourceVersionInventoryDiagnostic[] {
  const diagnostics: SourceVersionInventoryDiagnostic[] = [];

  if (item.rowCount <= 0) {
    diagnostics.push({
      severity: "danger",
      label: "행 없음",
      message: "적재된 행이 없어 조회 결과에 반영되지 않습니다."
    });
  }

  if (!item.latestRetrievedAt) {
    diagnostics.push({
      severity: item.rowCount <= 0 ? "danger" : "warning",
      label: "수집시각 없음",
      message: "원천 수집 시각이 없어 업데이트 이력을 추적하기 어렵습니다."
    });
  } else {
    const ageDays = daysBetween(item.latestRetrievedAt, now);
    if (ageDays !== null && ageDays > 365) {
      diagnostics.push({
        severity: "warning",
        label: "수집 오래됨",
        message: `최근 수집 후 ${ageDays.toLocaleString("ko-KR")}일이 지났습니다.`
      });
    }
  }

  if (item.status !== "published") {
    diagnostics.push({
      severity: "warning",
      label: "게시 전",
      message: "아직 published 상태가 아니어서 운영 조회에는 제한적으로만 사용됩니다."
    });
  }

  if (diagnostics.length === 0) {
    diagnostics.push({
      severity: "ok",
      label: "사용 가능",
      message: "행 수, 수집시각, 게시 상태가 기본 점검을 통과했습니다."
    });
  }

  return diagnostics;
}

function withDiagnostics(items: SourceVersionInventoryItem[], now = new Date()): SourceVersionInventoryItemWithDiagnostics[] {
  return items.map((item) => ({
    ...item,
    diagnostics: diagnoseSourceInventoryItem(item, now)
  }));
}

function summarize(items: SourceVersionInventoryItemWithDiagnostics[]) {
  const groupSummaries = Array.from(
    items.reduce((map, item) => {
      const group = inventoryGroupForTable(item.targetTable);
      const current = map.get(group.key) ?? {
        groupKey: group.key,
        label: group.label,
        itemCount: 0,
        stagedCount: 0,
        publishedCount: 0,
        totalRows: 0,
        warningCount: 0,
        dangerCount: 0
      };

      current.itemCount += 1;
      current.totalRows += item.rowCount;
      if (item.status === "staged") current.stagedCount += 1;
      if (item.status === "published") current.publishedCount += 1;
      if (item.diagnostics.some((diagnostic) => diagnostic.severity === "warning")) current.warningCount += 1;
      if (item.diagnostics.some((diagnostic) => diagnostic.severity === "danger")) current.dangerCount += 1;
      map.set(group.key, current);

      return map;
    }, new Map<SourceVersionInventoryGroupSummary["groupKey"], SourceVersionInventoryGroupSummary>()).values()
  ).sort((a, b) => b.totalRows - a.totalRows || a.label.localeCompare(b.label, "ko"));

  const diagnosticCounts = items.reduce<Record<SourceVersionInventoryDiagnosticSeverity, number>>(
    (counts, item) => {
      const worstSeverity = item.diagnostics.some((diagnostic) => diagnostic.severity === "danger")
        ? "danger"
        : item.diagnostics.some((diagnostic) => diagnostic.severity === "warning")
          ? "warning"
          : "ok";
      counts[worstSeverity] += 1;
      return counts;
    },
    { ok: 0, warning: 0, danger: 0 }
  );

  return {
    stagedCount: items.filter((item) => item.status === "staged").length,
    publishedCount: items.filter((item) => item.status === "published").length,
    totalRows: items.reduce((sum, item) => sum + item.rowCount, 0),
    diagnosticCounts,
    groupSummaries
  };
}

export function getMockSourceVersionInventory(loadError?: string): SourceVersionInventoryResult {
  const items = withDiagnostics(mockSourceVersionInventory);

  return {
    items,
    dataSource: "mock",
    loadError,
    domesticLookupCoverage: mockDomesticLookupCoverage,
    requirementPlaybookCoverage: mockRequirementPlaybookCoverage,
    summary: summarize(items)
  };
}

export async function getSourceVersionInventory(): Promise<SourceVersionInventoryResult> {
  if (!hasSupabaseEnv()) {
    return getMockSourceVersionInventory();
  }

  try {
    const supabase = await createSupabaseServerClient();
    const [sourceItems, domesticLookupCoverage, requirementPlaybookCoverage] = await Promise.all([
      getSourceVersionInventoryFromSupabase(supabase),
      getDomesticHsLookupSnapshotCoverageFromSupabase(supabase),
      getRequirementPlaybookCoverageFromSupabase(supabase)
    ]);
    const items = withDiagnostics(sourceItems);
    return {
      items,
      dataSource: "supabase",
      domesticLookupCoverage: domesticLookupCoverage ?? mockDomesticLookupCoverage,
      requirementPlaybookCoverage,
      summary: summarize(items)
    };
  } catch (error) {
    return getMockSourceVersionInventory(error instanceof Error ? error.message : "source inventory 조회 중 오류가 발생했습니다.");
  }
}
