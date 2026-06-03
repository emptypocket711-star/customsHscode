"use client";

import { useMemo, useState } from "react";
import { exportCountryLabel } from "@/features/export-diagnosis/country-options";
import { CountryComboboxField } from "@/features/hs/country-combobox-field";
import {
  displayImportTariffLabel,
  filterImportTariffsForCountry,
  importTariffApplicationPriority,
  type ImportTariffDisplayRow
} from "@/features/hs/import-tariff-display";
import { TariffPriorityGuideDialog } from "@/features/hs/tariff-priority-guide-dialog";
import { TariffRateDetailDialog } from "@/features/hs/tariff-rate-detail-dialog";

type ImportTariffCountryFilterProps = {
  initialCountryCode: string;
  tariffs: ImportTariffDisplayRow[];
};

export const DEFAULT_VISIBLE_IMPORT_TARIFF_ROWS = 8;

function tariffRowKey(tariff: ImportTariffDisplayRow, countryCode: string) {
  return [
    tariff.rateType,
    tariff.rateText,
    tariff.sourceVersion,
    displayImportTariffLabel(tariff, countryCode)
  ].join("|");
}

export function visibleImportTariffRows<T>(tariffs: T[], showAll: boolean) {
  return showAll ? tariffs : tariffs.slice(0, DEFAULT_VISIBLE_IMPORT_TARIFF_ROWS);
}

export function ImportTariffCountryFilter({ initialCountryCode, tariffs }: ImportTariffCountryFilterProps) {
  const [countryCode, setCountryCode] = useState(initialCountryCode);
  const [showAllTariffs, setShowAllTariffs] = useState(false);
  const displayTariffs = useMemo(() => filterImportTariffsForCountry(tariffs, countryCode), [countryCode, tariffs]);
  const visibleTariffs = visibleImportTariffRows(displayTariffs, showAllTariffs);
  const hiddenTariffCount = Math.max(displayTariffs.length - visibleTariffs.length, 0);

  function handleCountryChange(nextCountryCode: string) {
    setCountryCode(nextCountryCode);
    setShowAllTariffs(false);
  }

  return (
    <div className="border-t border-slate-200">
      <div className="grid gap-3 bg-slate-50 px-3 py-3 md:grid-cols-[minmax(220px,320px)_1fr_auto] md:items-end">
        <CountryComboboxField
          defaultValue={countryCode}
          direction="import"
          label="수입국가 필터"
          name="destinationCountryFilter"
          onChange={handleCountryChange}
        />
        <p className="text-xs leading-5 text-slate-500">
          국가를 선택하면 현재 조회된 10자리 품목의 관세율만 즉시 필터링합니다. 다시 조회하지 않습니다.
        </p>
        <TariffPriorityGuideDialog />
      </div>
      {displayTariffs.length ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-3 py-2 text-xs text-slate-500">
            <span>
              {showAllTariffs
                ? `전체 ${displayTariffs.length.toLocaleString("ko-KR")}건 표시`
                : `주요 ${visibleTariffs.length.toLocaleString("ko-KR")}건 먼저 표시`}
            </span>
            {hiddenTariffCount > 0 ? (
              <button
                className="focus-ring rounded-md border border-slate-300 bg-white px-2.5 py-1 font-semibold text-slate-700 hover:border-slate-400"
                onClick={() => setShowAllTariffs(true)}
                type="button"
              >
                나머지 {hiddenTariffCount.toLocaleString("ko-KR")}건 펼치기
              </button>
            ) : showAllTariffs && displayTariffs.length > DEFAULT_VISIBLE_IMPORT_TARIFF_ROWS ? (
              <button
                className="focus-ring rounded-md border border-slate-300 bg-white px-2.5 py-1 font-semibold text-slate-700 hover:border-slate-400"
                onClick={() => setShowAllTariffs(false)}
                type="button"
              >
                주요 세율만 보기
              </button>
            ) : null}
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-500">
              <tr>
                <th className="px-3 py-2">관세율구분</th>
                <th className="px-3 py-2">세율</th>
                <th className="px-3 py-2">적용 순위</th>
                <th className="px-3 py-2">상세</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {visibleTariffs.map((tariff) => {
                const label = displayImportTariffLabel(tariff, countryCode);
                const priority = importTariffApplicationPriority(tariff);

                return (
                  <tr key={tariffRowKey(tariff, countryCode)}>
                    <td className="px-3 py-2 font-medium text-slate-900">{label}</td>
                    <td className="px-3 py-2 text-orange-600">{tariff.rateText}</td>
                    <td className="px-3 py-2 text-slate-600">{priority}</td>
                    <td className="px-3 py-2">
                      <TariffRateDetailDialog
                        countryCode={countryCode}
                        countryGroup={tariff.countryGroup}
                        label={label}
                        priority={priority}
                        rateText={tariff.rateText}
                        rateType={tariff.rateType}
                        usageRateType={tariff.usageRateType}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      ) : (
        <div className="px-3 py-8 text-center text-sm text-slate-500">
          {exportCountryLabel(countryCode)} 기준으로 표시할 관세율 데이터가 없습니다.
        </div>
      )}
    </div>
  );
}
