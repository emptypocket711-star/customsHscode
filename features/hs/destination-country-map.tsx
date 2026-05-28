"use client";

import worldMap from "@svg-maps/world";
import { destinationCountryOptions, exportCountryLabel } from "@/features/export-diagnosis/country-options";

type SvgLocation = {
  id: string;
  name: string;
  path: string;
};

type SvgMap = {
  viewBox: string;
  locations: SvgLocation[];
};

const world = worldMap as SvgMap;

const euAlpha2Codes = new Set([
  "at",
  "be",
  "bg",
  "hr",
  "cy",
  "cz",
  "dk",
  "ee",
  "fi",
  "fr",
  "de",
  "gr",
  "hu",
  "ie",
  "it",
  "lv",
  "lt",
  "lu",
  "mt",
  "nl",
  "pl",
  "pt",
  "ro",
  "sk",
  "si",
  "es",
  "se"
]);

const optionByAlpha2 = new Map(
  destinationCountryOptions
    .filter((country) => country.code !== "ALL" && country.alias !== "EU")
    .map((country) => [country.alias.toLowerCase(), country])
);

export function DestinationCountryMap({
  selected,
  onSelectCountry
}: {
  selected: string;
  onSelectCountry: (code: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-md border border-slate-200 bg-sky-50">
      <svg
        aria-label="목적국 선택 세계지도"
        className="block h-auto w-full"
        role="img"
        viewBox={world.viewBox}
      >
        {world.locations.map((location) => {
          const country = optionByAlpha2.get(location.id);
          const isEuMember = euAlpha2Codes.has(location.id);
          const selectableCode = country?.code;
          const isSelected = Boolean(
            selectableCode === selected
            || (selected === "EEC" && isEuMember)
          );
          const isSelectable = Boolean(selectableCode);
          const label = selectableCode ? exportCountryLabel(selectableCode) : location.name;

          return (
            <path
              aria-label={isSelectable ? `${label} 선택` : undefined}
              className={[
                "stroke-white stroke-[0.7] transition",
                isSelected ? "fill-blue-600" : isSelectable ? "fill-slate-300 hover:fill-blue-400" : "fill-slate-100",
                isSelectable ? "cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500" : "cursor-default"
              ].join(" ")}
              d={location.path}
              key={location.id}
              onClick={isSelectable && selectableCode ? () => onSelectCountry(selectableCode) : undefined}
              onKeyDown={
                isSelectable && selectableCode
                  ? (event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onSelectCountry(selectableCode);
                      }
                    }
                  : undefined
              }
              role={isSelectable ? "button" : undefined}
              tabIndex={isSelectable ? 0 : undefined}
            >
              <title>{label}</title>
            </path>
          );
        })}
      </svg>
    </div>
  );
}
