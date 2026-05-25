import type { SupabaseClient } from "@supabase/supabase-js";
import type { SourceVersionInventoryItem } from "@/features/legal-updates/mock-source-inventory";

type SourceInventoryRow = {
  target_table: string;
  source_name: string;
  source_version: string;
  status: SourceVersionInventoryItem["status"];
  row_count: number | string;
  latest_retrieved_at: string | null;
  latest_published_at: string | null;
};

export type DomesticHsLookupSnapshotCoverage = {
  snapshotBasisDate: string | null;
  totalHsk10: number;
  withTariffRates: number;
  missingTariffRates: number;
  withCustomsRequirements: number;
  withPublicNoticeRequirements: number;
  withInternalTaxes: number;
  lastRefreshedAt: string | null;
};

export type RequirementPlaybookCoverage = {
  totalRequirementPairs: number;
  withPlaybook: number;
  missingPlaybook: number;
  coverageRate: number;
  missingRequirements: Array<{
    requirementDocumentName: string;
    relatedLaw: string;
    agencies: string[];
    rowCount: number;
  }>;
  sourceVersions: Array<{
    sourceVersion: string;
    rowCount: number;
    latestRetrievedAt: string | null;
    latestPublishedAt: string | null;
  }>;
  stalePlaybooks: Array<{
    requirementDocumentName: string;
    relatedLaw: string;
    sourceVersion: string;
    latestRetrievedAt: string | null;
  }>;
  invalidSourceUrls: Array<{
    requirementDocumentName: string;
    relatedLaw: string;
    sourceVersion: string;
    sourceUrl: string | null;
  }>;
};

export type OriginMarkingCoverage = {
  targetPatterns: number;
  methodPatterns: number;
  targetsWithMethod: number;
  targetsMissingMethod: number;
  methodCoverageRate: number;
  missingMethodPatterns: string[];
};

type DomesticHsLookupSnapshotCoverageRow = {
  snapshot_basis_date: string | null;
  total_hsk10: number | string | null;
  with_tariff_rates: number | string | null;
  missing_tariff_rates: number | string | null;
  with_customs_requirements: number | string | null;
  with_public_notice_requirements: number | string | null;
  with_internal_taxes: number | string | null;
  last_refreshed_at: string | null;
};

type OriginMarkingPatternRow = {
  hsk_pattern: string;
};

type RequirementRow = {
  requirement_document_name: string;
  related_law: string;
  agency: string | null;
};

type RequirementPlaybookRow = {
  requirement_document_name: string;
  related_law: string;
  source_version: string;
  source_url: string | null;
  retrieved_at: string | null;
  published_at: string | null;
};

export const getLegalSourceVersionInventoryRpcName = "get_legal_source_version_inventory";
export const getDomesticHsLookupSnapshotCoverageRpcName = "get_domestic_hs_lookup_snapshot_coverage";

export function mapSourceInventoryRow(row: SourceInventoryRow): SourceVersionInventoryItem {
  return {
    targetTable: row.target_table,
    sourceName: row.source_name,
    sourceVersion: row.source_version,
    status: row.status,
    rowCount: Number(row.row_count),
    latestRetrievedAt: row.latest_retrieved_at,
    latestPublishedAt: row.latest_published_at
  };
}

export async function getSourceVersionInventoryFromSupabase(
  supabase: SupabaseClient
): Promise<SourceVersionInventoryItem[]> {
  const { data, error } = await supabase.rpc(getLegalSourceVersionInventoryRpcName);

  if (error) throw new Error(error.message);

  return ((data ?? []) as SourceInventoryRow[]).map(mapSourceInventoryRow);
}

function numericCount(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

export function mapDomesticHsLookupSnapshotCoverageRow(row: DomesticHsLookupSnapshotCoverageRow): DomesticHsLookupSnapshotCoverage {
  return {
    snapshotBasisDate: row.snapshot_basis_date,
    totalHsk10: numericCount(row.total_hsk10),
    withTariffRates: numericCount(row.with_tariff_rates),
    missingTariffRates: numericCount(row.missing_tariff_rates),
    withCustomsRequirements: numericCount(row.with_customs_requirements),
    withPublicNoticeRequirements: numericCount(row.with_public_notice_requirements),
    withInternalTaxes: numericCount(row.with_internal_taxes),
    lastRefreshedAt: row.last_refreshed_at
  };
}

export async function getDomesticHsLookupSnapshotCoverageFromSupabase(
  supabase: SupabaseClient
): Promise<DomesticHsLookupSnapshotCoverage | null> {
  const { data, error } = await supabase.rpc(getDomesticHsLookupSnapshotCoverageRpcName);

  if (error) throw new Error(error.message);

  const row = ((data ?? []) as DomesticHsLookupSnapshotCoverageRow[])[0];
  return row ? mapDomesticHsLookupSnapshotCoverageRow(row) : null;
}

function requirementKey(name: string, relatedLaw: string) {
  return `${name.trim()}|${relatedLaw.trim()}`;
}

function isStaleIsoDate(value: string | null, now: Date, staleDays: number) {
  if (!value) return true;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return true;
  return now.getTime() - parsed.getTime() > staleDays * 24 * 60 * 60 * 1000;
}

function isLawGoKrUrl(value: string | null) {
  return Boolean(value?.startsWith("https://www.law.go.kr/법령/") || value?.startsWith("https://law.go.kr/법령/"));
}

export async function getRequirementPlaybookCoverageFromSupabase(
  supabase: SupabaseClient,
  now = new Date()
): Promise<RequirementPlaybookCoverage> {
  const [requirementsResult, playbooksResult] = await Promise.all([
    supabase
      .from("customs_confirmation_requirements")
      .select("requirement_document_name, related_law, agency")
      .eq("status", "published"),
    supabase
      .from("requirement_playbooks")
      .select("requirement_document_name, related_law, source_version, source_url, retrieved_at, published_at")
      .eq("status", "published")
  ]);

  if (requirementsResult.error) throw new Error(requirementsResult.error.message);
  if (playbooksResult.error) throw new Error(playbooksResult.error.message);

  const requirementGroups = new Map<string, {
    requirementDocumentName: string;
    relatedLaw: string;
    agencies: Set<string>;
    rowCount: number;
  }>();

  for (const row of (requirementsResult.data ?? []) as RequirementRow[]) {
    const key = requirementKey(row.requirement_document_name, row.related_law);
    const group = requirementGroups.get(key) ?? {
      requirementDocumentName: row.requirement_document_name,
      relatedLaw: row.related_law,
      agencies: new Set<string>(),
      rowCount: 0
    };
    if (row.agency?.trim()) group.agencies.add(row.agency.trim());
    group.rowCount += 1;
    requirementGroups.set(key, group);
  }

  const playbookRows = (playbooksResult.data ?? []) as RequirementPlaybookRow[];
  const playbookKeys = new Set(playbookRows.map((row) => requirementKey(row.requirement_document_name, row.related_law)));
  const missingRequirements = Array.from(requirementGroups.entries())
    .filter(([key]) => !playbookKeys.has(key))
    .map(([, group]) => ({
      requirementDocumentName: group.requirementDocumentName,
      relatedLaw: group.relatedLaw,
      agencies: Array.from(group.agencies).sort((a, b) => a.localeCompare(b, "ko")),
      rowCount: group.rowCount
    }))
    .sort((a, b) => b.rowCount - a.rowCount || a.requirementDocumentName.localeCompare(b.requirementDocumentName, "ko"));

  const sourceVersions = Array.from(
    playbookRows.reduce((map, row) => {
      const current = map.get(row.source_version) ?? {
        sourceVersion: row.source_version,
        rowCount: 0,
        latestRetrievedAt: null as string | null,
        latestPublishedAt: null as string | null
      };
      current.rowCount += 1;
      if (row.retrieved_at && (!current.latestRetrievedAt || row.retrieved_at > current.latestRetrievedAt)) current.latestRetrievedAt = row.retrieved_at;
      if (row.published_at && (!current.latestPublishedAt || row.published_at > current.latestPublishedAt)) current.latestPublishedAt = row.published_at;
      map.set(row.source_version, current);
      return map;
    }, new Map<string, RequirementPlaybookCoverage["sourceVersions"][number]>()).values()
  ).sort((a, b) => b.sourceVersion.localeCompare(a.sourceVersion));

  const stalePlaybooks = playbookRows
    .filter((row) => isStaleIsoDate(row.retrieved_at, now, 180))
    .map((row) => ({
      requirementDocumentName: row.requirement_document_name,
      relatedLaw: row.related_law,
      sourceVersion: row.source_version,
      latestRetrievedAt: row.retrieved_at
    }))
    .sort((a, b) => a.requirementDocumentName.localeCompare(b.requirementDocumentName, "ko"))
    .slice(0, 20);

  const invalidSourceUrls = playbookRows
    .filter((row) => !isLawGoKrUrl(row.source_url))
    .map((row) => ({
      requirementDocumentName: row.requirement_document_name,
      relatedLaw: row.related_law,
      sourceVersion: row.source_version,
      sourceUrl: row.source_url
    }))
    .sort((a, b) => a.requirementDocumentName.localeCompare(b.requirementDocumentName, "ko"))
    .slice(0, 20);

  const totalRequirementPairs = requirementGroups.size;
  const withPlaybook = Array.from(requirementGroups.keys()).filter((key) => playbookKeys.has(key)).length;

  return {
    totalRequirementPairs,
    withPlaybook,
    missingPlaybook: missingRequirements.length,
    coverageRate: totalRequirementPairs ? Math.round((withPlaybook / totalRequirementPairs) * 1000) / 10 : 0,
    missingRequirements,
    sourceVersions,
    stalePlaybooks,
    invalidSourceUrls
  };
}

export async function getOriginMarkingCoverageFromSupabase(
  supabase: SupabaseClient
): Promise<OriginMarkingCoverage> {
  const [targetsResult, methodsResult] = await Promise.all([
    supabase
      .from("origin_marking_targets")
      .select("hsk_pattern")
      .eq("status", "published")
      .eq("is_target", true),
    supabase
      .from("origin_marking_methods")
      .select("hsk_pattern")
      .eq("status", "published")
  ]);

  if (targetsResult.error) throw new Error(targetsResult.error.message);
  if (methodsResult.error) throw new Error(methodsResult.error.message);

  const targetPatterns = new Set(((targetsResult.data ?? []) as OriginMarkingPatternRow[]).map((row) => row.hsk_pattern));
  const methodPatterns = new Set(((methodsResult.data ?? []) as OriginMarkingPatternRow[]).map((row) => row.hsk_pattern));
  const missingMethodPatterns = Array.from(targetPatterns)
    .filter((pattern) => !methodPatterns.has(pattern))
    .sort((a, b) => a.localeCompare(b))
    .slice(0, 20);
  const targetsWithMethod = Array.from(targetPatterns).filter((pattern) => methodPatterns.has(pattern)).length;

  return {
    targetPatterns: targetPatterns.size,
    methodPatterns: methodPatterns.size,
    targetsWithMethod,
    targetsMissingMethod: targetPatterns.size - targetsWithMethod,
    methodCoverageRate: targetPatterns.size ? Math.round((targetsWithMethod / targetPatterns.size) * 1000) / 10 : 0,
    missingMethodPatterns
  };
}
