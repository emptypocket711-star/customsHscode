"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { exportCountryLabel } from "@/features/export-diagnosis/country-options";

export type DestinationCoverageTableRow = {
  countryCode: string;
  tariffCount: number;
  internalTaxCount: number;
  requirementCount: number;
  additionalTariffCount: number;
  tradeRemedyCount: number;
  dataSourceCount: number;
};

type CoverageFilter = "all" | "hasImportData" | "missingTariff" | "missingInternalTax" | "missingRequirement" | "hasAdditionalRisk";

const filterOptions: Array<{ value: CoverageFilter; label: string }> = [
  { value: "all", label: "전체" },
  { value: "hasImportData", label: "조회 가능" },
  { value: "missingTariff", label: "관세율 없음" },
  { value: "missingInternalTax", label: "내국세 없음" },
  { value: "missingRequirement", label: "요건 없음" },
  { value: "hasAdditionalRisk", label: "추가관세/무역구제" }
];

const numberFormatter = new Intl.NumberFormat("ko-KR");

function formatCount(value: number) {
  return numberFormatter.format(value);
}

function coverageLabel(row: DestinationCoverageTableRow) {
  return exportCountryLabel(row.countryCode) || row.countryCode;
}

function hasAnyImportData(row: DestinationCoverageTableRow) {
  return row.tariffCount > 0 || row.internalTaxCount > 0 || row.requirementCount > 0;
}

function matchesFilter(row: DestinationCoverageTableRow, filter: CoverageFilter) {
  if (filter === "hasImportData") return hasAnyImportData(row);
  if (filter === "missingTariff") return row.tariffCount === 0;
  if (filter === "missingInternalTax") return row.internalTaxCount === 0;
  if (filter === "missingRequirement") return row.requirementCount === 0;
  if (filter === "hasAdditionalRisk") return row.additionalTariffCount > 0 || row.tradeRemedyCount > 0;
  return true;
}

function coverageScore(row: DestinationCoverageTableRow) {
  return [row.tariffCount, row.internalTaxCount, row.requirementCount].filter((value) => value > 0).length;
}

export function DestinationCoverageTable({ rows }: { rows: DestinationCoverageTableRow[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<CoverageFilter>("all");
  const summary = useMemo(() => ({
    total: rows.length,
    ready: rows.filter(hasAnyImportData).length,
    missingTariff: rows.filter((row) => row.tariffCount === 0).length,
    missingInternalTax: rows.filter((row) => row.internalTaxCount === 0).length,
    missingRequirement: rows.filter((row) => row.requirementCount === 0).length,
    risk: rows.filter((row) => row.additionalTariffCount > 0 || row.tradeRemedyCount > 0).length
  }), [rows]);

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return rows
      .filter((row) => matchesFilter(row, filter))
      .filter((row) => {
        if (!normalizedQuery) return true;
        return `${row.countryCode} ${coverageLabel(row)}`.toLowerCase().includes(normalizedQuery);
      })
      .sort((a, b) => {
        const scoreDiff = coverageScore(b) - coverageScore(a);
        if (scoreDiff !== 0) return scoreDiff;
        const tariffDiff = b.tariffCount - a.tariffCount;
        if (tariffDiff !== 0) return tariffDiff;
        return coverageLabel(a).localeCompare(coverageLabel(b), "ko");
      });
  }, [filter, query, rows]);

  return (
    <div className="grid gap-3">
      <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-6">
        <CoverageSummaryCard label="전체 국가" value={summary.total} />
        <CoverageSummaryCard label="조회 가능" value={summary.ready} tone="success" />
        <CoverageSummaryCard label="관세율 없음" value={summary.missingTariff} tone={summary.missingTariff ? "warning" : "neutral"} />
        <CoverageSummaryCard label="내국세 없음" value={summary.missingInternalTax} tone={summary.missingInternalTax ? "warning" : "neutral"} />
        <CoverageSummaryCard label="요건 없음" value={summary.missingRequirement} tone={summary.missingRequirement ? "warning" : "neutral"} />
        <CoverageSummaryCard label="추가 리스크" value={summary.risk} tone={summary.risk ? "warning" : "neutral"} />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <label className="relative block max-w-md flex-1">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
          <input
            className="focus-ring w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="국가명 또는 코드 검색"
            type="search"
            value={query}
          />
        </label>
        <div className="flex flex-wrap gap-2">
          {filterOptions.map((option) => (
            <button
              className={`focus-ring rounded-md border px-3 py-2 text-xs font-semibold ${
                filter === option.value
                  ? "border-blue-700 bg-blue-700 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
              key={option.value}
              onClick={() => setFilter(option.value)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2 text-left">국가</th>
              <th className="px-3 py-2 text-right">관세율</th>
              <th className="px-3 py-2 text-right">내국세</th>
              <th className="px-3 py-2 text-right">수입요건</th>
              <th className="px-3 py-2 text-right">추가관세</th>
              <th className="px-3 py-2 text-right">무역구제</th>
              <th className="px-3 py-2 text-right">출처</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRows.map((row) => (
              <tr key={row.countryCode}>
                <td className="whitespace-nowrap px-3 py-2 font-medium text-slate-900">{coverageLabel(row)}</td>
                <td className="px-3 py-2 text-right text-slate-700">{formatCount(row.tariffCount)}</td>
                <td className="px-3 py-2 text-right text-slate-700">{formatCount(row.internalTaxCount)}</td>
                <td className="px-3 py-2 text-right text-slate-700">{formatCount(row.requirementCount)}</td>
                <td className="px-3 py-2 text-right text-slate-700">{formatCount(row.additionalTariffCount)}</td>
                <td className="px-3 py-2 text-right text-slate-700">{formatCount(row.tradeRemedyCount)}</td>
                <td className="px-3 py-2 text-right text-slate-700">{formatCount(row.dataSourceCount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-slate-500">
        {formatCount(filteredRows.length)}개 국가 표시
      </div>
    </div>
  );
}

function CoverageSummaryCard({
  label,
  tone = "neutral",
  value
}: {
  label: string;
  tone?: "neutral" | "success" | "warning";
  value: number;
}) {
  const className =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-950"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-950"
        : "border-slate-200 bg-slate-50 text-slate-950";

  return (
    <div className={`rounded-md border p-3 ${className}`}>
      <p className="text-xs font-semibold opacity-75">{label}</p>
      <p className="mt-1 text-lg font-semibold">{formatCount(value)}</p>
    </div>
  );
}
