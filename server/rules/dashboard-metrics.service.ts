import { unstable_cache } from "next/cache";
import type { DestinationCoverageTableRow } from "@/features/dashboard/destination-coverage-table";
import { createSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase/server";
import { createSupabaseServiceRoleClient, hasSupabaseServiceRoleEnv } from "@/lib/supabase/service-role";

export const fallbackDashboardStats = [
  { label: "HS CODE", value: "12,469", note: "HS부호 데이터" },
  { label: "표준품명", value: "26,873", note: "표준품명 데이터" },
  { label: "관세율", value: "665,657", note: "수입 관세율 데이터" },
  { label: "내국세 코드표", value: "337", note: "통계부호 데이터" }
];

export const fallbackDestinationCoverage: DestinationCoverageTableRow[] = [
  { countryCode: "USA", tariffCount: 26118, internalTaxCount: 26118, requirementCount: 793, additionalTariffCount: 13146, tradeRemedyCount: 0, dataSourceCount: 12 },
  { countryCode: "EEC", tariffCount: 22064, internalTaxCount: 22064, requirementCount: 528, additionalTariffCount: 0, tradeRemedyCount: 0, dataSourceCount: 3 },
  { countryCode: "GBR", tariffCount: 21861, internalTaxCount: 21861, requirementCount: 76, additionalTariffCount: 0, tradeRemedyCount: 0, dataSourceCount: 4 },
  { countryCode: "TUR", tariffCount: 19704, internalTaxCount: 19704, requirementCount: 852, additionalTariffCount: 0, tradeRemedyCount: 0, dataSourceCount: 8 },
  { countryCode: "MYS", tariffCount: 16943, internalTaxCount: 16943, requirementCount: 847, additionalTariffCount: 0, tradeRemedyCount: 0, dataSourceCount: 11 },
  { countryCode: "JPN", tariffCount: 9643, internalTaxCount: 9643, requirementCount: 450, additionalTariffCount: 0, tradeRemedyCount: 0, dataSourceCount: 7 },
  { countryCode: "CHN", tariffCount: 8972, internalTaxCount: 8972, requirementCount: 1780, additionalTariffCount: 0, tradeRemedyCount: 0, dataSourceCount: 29 }
];

type DestinationCoverageDbRow = {
  country_code: string;
  tariff_count: number | string | null;
  internal_tax_count: number | string | null;
  requirement_count: number | string | null;
  additional_tariff_count: number | string | null;
  trade_remedy_count: number | string | null;
  data_source_count: number | string | null;
};

type DashboardMetricDbRow = {
  metric_key: string;
  metric_label: string;
  metric_value: number | string | null;
  note: string | null;
};

function formatCount(value: number | null) {
  return typeof value === "number" ? new Intl.NumberFormat("ko-KR").format(value) : "-";
}

function numericCount(value: number | string | null | undefined) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number.parseInt(value, 10) || 0;
  return 0;
}

async function queryDashboardStats(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>> | ReturnType<typeof createSupabaseServiceRoleClient>,
  basisDate: string
) {
  const { data: metricRows, error: metricError } = await supabase
    .from("dashboard_metrics")
    .select("metric_key, metric_label, metric_value, note")
    .lte("effective_from", basisDate)
    .or(`effective_to.is.null,effective_to.gte.${basisDate}`)
    .eq("status", "published")
    .order("metric_key");

  if (!metricError && metricRows?.length) {
    const sortOrder = new Map([
      ["hs_master", 0],
      ["standard_product_names", 1],
      ["tariff_rates", 2],
      ["customs_statistical_codes", 3]
    ]);

    return ((metricRows ?? []) as DashboardMetricDbRow[])
      .sort((a, b) => (sortOrder.get(a.metric_key) ?? 99) - (sortOrder.get(b.metric_key) ?? 99))
      .slice(0, 4)
      .map((row) => ({
        label: row.metric_label,
        value: formatCount(numericCount(row.metric_value)),
        note: row.note ?? "집계 데이터"
      }));
  }

  const [hsMaster, standardNames, tariffRates, statisticalCodes] = await Promise.all([
    supabase
      .from("hs_master")
      .select("hsk_code", { count: "exact", head: true })
      .lte("effective_from", basisDate)
      .or(`effective_to.is.null,effective_to.gte.${basisDate}`)
      .eq("status", "published"),
    supabase
      .from("standard_product_names")
      .select("id", { count: "exact", head: true })
      .lte("effective_from", basisDate)
      .or(`effective_to.is.null,effective_to.gte.${basisDate}`)
      .eq("status", "published"),
    supabase
      .from("tariff_rates")
      .select("id", { count: "exact", head: true })
      .lte("effective_from", basisDate)
      .or(`effective_to.is.null,effective_to.gte.${basisDate}`)
      .eq("status", "published"),
    supabase
      .from("customs_statistical_codes")
      .select("id", { count: "exact", head: true })
      .lte("effective_from", basisDate)
      .or(`effective_to.is.null,effective_to.gte.${basisDate}`)
      .eq("status", "published")
  ]);

  if (hsMaster.error || standardNames.error || tariffRates.error || statisticalCodes.error) {
    return fallbackDashboardStats;
  }

  return [
    { label: "HS CODE", value: formatCount(hsMaster.count), note: "HS부호 데이터" },
    { label: "표준품명", value: formatCount(standardNames.count), note: "표준품명 데이터" },
    { label: "관세율", value: formatCount(tariffRates.count), note: "수입 관세율 데이터" },
    { label: "내국세 코드표", value: formatCount(statisticalCodes.count), note: "통계부호 데이터" }
  ];
}

const loadCachedDashboardStats = unstable_cache(
  async (basisDate: string) => {
    if (!hasSupabaseServiceRoleEnv()) return fallbackDashboardStats;
    return queryDashboardStats(createSupabaseServiceRoleClient(), basisDate);
  },
  ["dashboard-stats"],
  { revalidate: 60 * 60 }
);

const loadCachedDestinationCoverage = unstable_cache(
  async () => {
    if (!hasSupabaseServiceRoleEnv()) return fallbackDestinationCoverage;

    const supabase = createSupabaseServiceRoleClient();
    const { data, error } = await supabase
      .from("export_destination_country_coverage")
      .select("country_code, tariff_count, internal_tax_count, requirement_count, additional_tariff_count, trade_remedy_count, data_source_count")
      .order("tariff_count", { ascending: false })
      .limit(200);

    if (error) return fallbackDestinationCoverage;

    return ((data ?? []) as DestinationCoverageDbRow[]).map((row) => ({
      countryCode: row.country_code,
      tariffCount: numericCount(row.tariff_count),
      internalTaxCount: numericCount(row.internal_tax_count),
      requirementCount: numericCount(row.requirement_count),
      additionalTariffCount: numericCount(row.additional_tariff_count),
      tradeRemedyCount: numericCount(row.trade_remedy_count),
      dataSourceCount: numericCount(row.data_source_count)
    }));
  },
  ["dashboard-destination-coverage"],
  { revalidate: 60 * 60 }
);

export async function loadDashboardStats(basisDate: string) {
  if (!hasSupabaseEnv()) return fallbackDashboardStats;
  if (hasSupabaseServiceRoleEnv()) return loadCachedDashboardStats(basisDate);

  try {
    const supabase = await createSupabaseServerClient();
    return queryDashboardStats(supabase, basisDate);
  } catch {
    return fallbackDashboardStats;
  }
}

export async function loadDestinationCoverage(): Promise<DestinationCoverageTableRow[]> {
  if (!hasSupabaseEnv()) return fallbackDestinationCoverage;
  if (hasSupabaseServiceRoleEnv()) return loadCachedDestinationCoverage();

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("export_destination_country_coverage")
      .select("country_code, tariff_count, internal_tax_count, requirement_count, additional_tariff_count, trade_remedy_count, data_source_count")
      .order("tariff_count", { ascending: false })
      .limit(200);

    if (error) return fallbackDestinationCoverage;

    return ((data ?? []) as DestinationCoverageDbRow[]).map((row) => ({
      countryCode: row.country_code,
      tariffCount: numericCount(row.tariff_count),
      internalTaxCount: numericCount(row.internal_tax_count),
      requirementCount: numericCount(row.requirement_count),
      additionalTariffCount: numericCount(row.additional_tariff_count),
      tradeRemedyCount: numericCount(row.trade_remedy_count),
      dataSourceCount: numericCount(row.data_source_count)
    }));
  } catch {
    return fallbackDestinationCoverage;
  }
}
