import Link from "next/link";
import { unstable_cache } from "next/cache";
import { ArrowRight, Calculator, FileSearch, Search, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeading } from "@/components/page-heading";
import { SourceFooter } from "@/components/ui/source-footer";
import { DestinationCoverageTable, type DestinationCoverageTableRow } from "@/features/dashboard/destination-coverage-table";
import { destinationCountryOptions } from "@/features/export-diagnosis/country-options";
import { createSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase/server";
import { createSupabaseServiceRoleClient, hasSupabaseServiceRoleEnv } from "@/lib/supabase/service-role";
import { getSeoulDateString } from "@/lib/utils";

const fallbackStats = [
  { label: "HS CODE", value: "12,469", note: "HS부호 데이터" },
  { label: "표준품명", value: "26,873", note: "표준품명 데이터" },
  { label: "관세율", value: "665,657", note: "수입 관세율 데이터" },
  { label: "내국세 코드표", value: "337", note: "통계부호 데이터" }
];

const fallbackCoverage = [
  { countryCode: "USA", tariffCount: 26118, internalTaxCount: 26118, requirementCount: 793, additionalTariffCount: 13146, tradeRemedyCount: 0, dataSourceCount: 12 },
  { countryCode: "EEC", tariffCount: 22064, internalTaxCount: 22064, requirementCount: 528, additionalTariffCount: 0, tradeRemedyCount: 0, dataSourceCount: 3 },
  { countryCode: "GBR", tariffCount: 21861, internalTaxCount: 21861, requirementCount: 76, additionalTariffCount: 0, tradeRemedyCount: 0, dataSourceCount: 4 },
  { countryCode: "TUR", tariffCount: 19704, internalTaxCount: 19704, requirementCount: 852, additionalTariffCount: 0, tradeRemedyCount: 0, dataSourceCount: 8 },
  { countryCode: "MYS", tariffCount: 16943, internalTaxCount: 16943, requirementCount: 847, additionalTariffCount: 0, tradeRemedyCount: 0, dataSourceCount: 11 },
  { countryCode: "JPN", tariffCount: 9643, internalTaxCount: 9643, requirementCount: 450, additionalTariffCount: 0, tradeRemedyCount: 0, dataSourceCount: 7 },
  { countryCode: "CHN", tariffCount: 8972, internalTaxCount: 8972, requirementCount: 1780, additionalTariffCount: 0, tradeRemedyCount: 0, dataSourceCount: 29 }
];

const workflows = [
  { href: "/hs/direct", title: "통합 조회", icon: FileSearch, note: "HS CODE 또는 품명으로 품목번호, 관세율, 수입요건, 수출상대국 관세율 확인" },
  { href: "/duty-estimator", title: "예상 납세액 계산", icon: Calculator, note: "물품가격, 환율, 관세율, 내국세율을 입력해 관세·부가세 계산" },
  { href: "/documents/upload", title: "선적서류 조회", icon: Upload, note: "CI/PL/B/L에서 품목 정보 추출" }
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
    return fallbackStats;
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
    if (!hasSupabaseServiceRoleEnv()) return fallbackStats;
    return queryDashboardStats(createSupabaseServiceRoleClient(), basisDate);
  },
  ["dashboard-stats"],
  { revalidate: 60 * 60 }
);

const loadCachedDestinationCoverage = unstable_cache(
  async () => {
    if (!hasSupabaseServiceRoleEnv()) return fallbackCoverage;

    const supabase = createSupabaseServiceRoleClient();
    const { data, error } = await supabase
      .from("export_destination_country_coverage")
      .select("country_code, tariff_count, internal_tax_count, requirement_count, additional_tariff_count, trade_remedy_count, data_source_count")
      .order("tariff_count", { ascending: false })
      .limit(200);

    if (error) return fallbackCoverage;

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

async function loadDashboardStats(basisDate: string) {
  if (!hasSupabaseEnv()) {
    return fallbackStats;
  }

  if (hasSupabaseServiceRoleEnv()) {
    return loadCachedDashboardStats(basisDate);
  }

  try {
    const supabase = await createSupabaseServerClient();
    return queryDashboardStats(supabase, basisDate);
  } catch {
    return fallbackStats;
  }
}

async function loadDestinationCoverage(): Promise<DestinationCoverageTableRow[]> {
  if (!hasSupabaseEnv()) {
    return fallbackCoverage;
  }

  if (hasSupabaseServiceRoleEnv()) {
    return loadCachedDestinationCoverage();
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("export_destination_country_coverage")
      .select("country_code, tariff_count, internal_tax_count, requirement_count, additional_tariff_count, trade_remedy_count, data_source_count")
      .order("tariff_count", { ascending: false })
      .limit(200);

    if (error) return fallbackCoverage;

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
    return fallbackCoverage;
  }
}

export default async function DashboardPage() {
  const basisDate = getSeoulDateString();
  const [stats, coverageRows] = await Promise.all([
    loadDashboardStats(basisDate),
    loadDestinationCoverage()
  ]);

  return (
    <>
      <PageHeading
        title="통관이음 AI"
        description="HS CODE, 품명, 국가 정보를 기준으로 관세율과 수출입요건을 조회합니다."
      >
        <Link className="focus-ring rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800" href="/hs/direct">
          상세 조회
        </Link>
      </PageHeading>

      <Card>
        <CardBody>
          <form action="/hs/direct" className="grid gap-3 lg:grid-cols-[minmax(240px,1fr)_120px_minmax(220px,280px)_auto]" method="get">
            <input defaultValue={basisDate} name="basisDate" type="hidden" />
            <label className="grid min-w-0 gap-1 text-sm font-medium text-slate-700">
              HS CODE 또는 품명
              <input
                className="focus-ring w-full min-w-0 rounded-md border border-slate-300 px-3 py-3 text-base"
                name="query"
                placeholder="예: 3401.30-0000 또는 입술화장품"
                type="text"
              />
            </label>
            <label className="grid min-w-0 gap-1 text-sm font-medium text-slate-700">
              구분
              <select className="focus-ring w-full min-w-0 rounded-md border border-slate-300 bg-white px-3 py-3 text-base" defaultValue="import" name="direction">
                <option value="import">수입</option>
                <option value="export">수출</option>
              </select>
            </label>
            <label className="grid min-w-0 gap-1 text-sm font-medium text-slate-700">
              수입국가/목적국
              <select className="focus-ring w-full min-w-0 rounded-md border border-slate-300 bg-white px-3 py-3 text-base" defaultValue="ALL" name="destinationCountry">
                {destinationCountryOptions.map((country) => (
                  <option key={country.code} value={country.code}>{country.label}</option>
                ))}
              </select>
            </label>
            <button className="focus-ring inline-flex items-center justify-center gap-2 self-end rounded-md bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800" type="submit">
              <Search aria-hidden="true" size={18} />
              조회
            </button>
          </form>
        </CardBody>
      </Card>

      <div className="mt-5 grid gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardBody>
              <p className="text-sm font-medium text-slate-600">{stat.label}</p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">{stat.value}</p>
              <p className="mt-1 text-xs text-slate-500">{stat.note}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader title="조회 메뉴" description="조회 유형을 선택하세요." />
          <CardBody className="grid gap-3">
            {workflows.map((workflow) => {
              const Icon = workflow.icon;
              return (
                <Link className="focus-ring flex items-center gap-4 rounded-lg border border-slate-200 p-4 hover:bg-slate-50" href={workflow.href} key={workflow.href}>
                  <span className="grid size-11 shrink-0 place-items-center rounded-md bg-slate-100 text-blue-700">
                    <Icon aria-hidden="true" size={22} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-slate-950">{workflow.title}</span>
                    <span className="block text-sm text-slate-600">{workflow.note}</span>
                  </span>
                  <ArrowRight aria-hidden="true" className="text-slate-400" size={18} />
                </Link>
              );
            })}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="데이터 기준" description="조회 화면에 함께 표시되는 기준 정보입니다." />
          <CardBody>
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-md bg-blue-50 text-blue-700">
                <FileSearch aria-hidden="true" size={22} />
              </span>
              <div>
                <Badge tone="info">조회기준일</Badge>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  HS CODE, 관세율, FTA, 수출입요건은 기준일과 출처 버전별로 표시됩니다.
                </p>
              </div>
            </div>
            <SourceFooter />
          </CardBody>
        </Card>
      </div>

      <Card className="mt-5">
        <CardHeader title="목적국 데이터 커버리지" description="수출 목적국 조회에 사용되는 적재 현황입니다." />
        <CardBody>
          <DestinationCoverageTable rows={coverageRows} />
        </CardBody>
      </Card>
    </>
  );
}
