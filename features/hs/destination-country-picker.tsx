"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { destinationCountryOptions, exportCountryLabel } from "@/features/export-diagnosis/country-options";

const DestinationCountryMap = dynamic(
  () => import("@/features/hs/destination-country-map").then((mod) => mod.DestinationCountryMap),
  {
    ssr: false,
    loading: () => (
      <div className="grid min-h-64 place-items-center rounded-md border border-slate-200 bg-slate-50 text-sm font-medium text-slate-500">
        목적국 지도를 불러오고 있습니다.
      </div>
    )
  }
);

const regionGroups = [
  {
    label: "주요",
    codes: ["CHN", "USA", "JPN", "VNM", "EEC", "GBR", "IND", "AUS"]
  },
  {
    label: "아시아",
    codes: ["CHN", "JPN", "VNM", "TWN", "MNG", "IND", "IDN", "THA", "MYS", "PHL", "SGP", "KHM", "MMR", "BRU", "BGD", "LAO", "UZB"]
  },
  {
    label: "유럽",
    codes: ["EEC", "GBR", "NOR", "CHE", "TUR", "RUS", "ISL", "AUT", "BEL", "BGR", "HRV", "CYP", "CZE", "DNK", "EST", "FIN", "FRA", "DEU", "GRC", "HUN", "IRL", "ITA", "LVA", "LTU", "LUX", "MLT", "NLD", "POL", "PRT", "ROU", "SVK", "SVN", "ESP", "SWE"]
  },
  {
    label: "미주",
    codes: ["USA", "CAN", "MEX", "BRA", "CHL", "COL", "CRI", "HND", "NIC", "PAN", "PER", "SLV"]
  },
  {
    label: "중동/아프리카",
    codes: ["ARE", "SAU", "ISR", "ZAF"]
  },
  {
    label: "오세아니아",
    codes: ["AUS", "NZL"]
  }
] as const;

const optionByCode = new Map(destinationCountryOptions.map((country) => [country.code, country]));

function countryShortLabel(code: string) {
  const label = exportCountryLabel(code);
  return label.replace(/\s*\([^)]*\)\s*$/, "");
}

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

export function DestinationCountryPicker({
  defaultValue,
  direction,
  showMap
}: {
  defaultValue: string;
  direction: "import" | "export";
  showMap: boolean;
}) {
  const initialValue = destinationCountryOptions.some((country) => country.code === defaultValue) ? defaultValue : "CHN";
  const [selected, setSelected] = useState(initialValue);
  const [search, setSearch] = useState("");
  const selectedLabel = useMemo(() => exportCountryLabel(selected), [selected]);

  const filteredCountries = useMemo(() => {
    const keyword = normalizeSearch(search);
    if (!keyword) {
      return [];
    }

    return destinationCountryOptions.filter((country) => {
      const haystack = `${country.code} ${country.alias} ${country.label}`.toLowerCase();
      return haystack.includes(keyword);
    });
  }, [search]);

  function selectCountry(code: string) {
    setSelected(code);
  }

  return (
    <>
      <input name="destinationCountry" type="hidden" value={selected} />
      <label className="grid min-w-0 gap-1 text-sm font-medium text-slate-700">
        {direction === "import" ? "수입국가" : "목적국"}
        <select
          className="focus-ring w-full min-w-0 rounded-md border border-slate-300 px-3 py-2"
          onChange={(event) => selectCountry(event.target.value)}
          value={selected}
        >
          {destinationCountryOptions.map((country) => (
            <option key={country.code} value={country.code}>
              {country.label}
            </option>
          ))}
        </select>
      </label>

      {showMap ? (
        <section className="rounded-md border border-slate-200 bg-white p-3 lg:col-span-full">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-sm font-semibold text-slate-900">목적국 지도 선택</div>
              <div className="text-xs text-slate-500">지도 또는 국가 목록에서 목적국을 선택합니다. 현재 선택: {selectedLabel}</div>
            </div>
          </div>

          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
            <DestinationCountryMap selected={selected} onSelectCountry={selectCountry} />

            <div className="grid content-start gap-3">
              <label className="grid gap-1 text-xs font-medium text-slate-600">
                국가 검색
                <input
                  className="focus-ring rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="예: 중국, CHN, CN"
                  type="search"
                  value={search}
                />
              </label>

              {search.trim() ? (
                <div className="grid max-h-48 gap-1 overflow-auto rounded-md border border-slate-200 bg-slate-50 p-2">
                  {filteredCountries.length ? (
                    filteredCountries.map((country) => (
                      <button
                        className={`focus-ring rounded px-2 py-1.5 text-left text-xs font-medium ${selected === country.code ? "bg-blue-600 text-white" : "bg-white text-slate-700 hover:bg-blue-50"}`}
                        key={country.code}
                        onClick={() => selectCountry(country.code)}
                        type="button"
                      >
                        {country.label}
                      </button>
                    ))
                  ) : (
                    <div className="px-2 py-3 text-xs text-slate-500">검색 가능한 목적국이 없습니다.</div>
                  )}
                </div>
              ) : null}

              <div className="grid max-h-[420px] gap-3 overflow-auto pr-1">
                {regionGroups.map((group) => (
                  <div className="grid gap-1" key={group.label}>
                    <div className="text-xs font-semibold text-slate-500">{group.label}</div>
                    <div className="flex flex-wrap gap-1">
                      {group.codes.map((code) => {
                        const country = optionByCode.get(code);
                        if (!country) {
                          return null;
                        }

                        return (
                          <button
                            className={`focus-ring rounded-md border px-2 py-1 text-xs font-medium ${selected === code ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50"}`}
                            key={code}
                            onClick={() => selectCountry(code)}
                            type="button"
                          >
                            {code === "EEC" ? "유럽연합" : countryShortLabel(code)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
