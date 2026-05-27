"use client";

import { ChevronDown } from "lucide-react";
import { useId, useMemo, useRef, useState } from "react";
import { destinationCountryOptions, exportCountryLabel } from "@/features/export-diagnosis/country-options";
import { cn } from "@/lib/utils";

type CountryComboboxFieldProps = {
  defaultValue: string;
  direction: "import" | "export";
  label?: string;
  name?: string;
  onChange?: (countryCode: string) => void;
};

function normalize(value: string) {
  return value.trim().toUpperCase();
}

function optionSearchText(option: { code: string; alias: string; label: string }) {
  return `${option.label} ${option.code} ${option.alias}`.toLowerCase();
}

function findOption(value: string) {
  const normalized = normalize(value);
  return destinationCountryOptions.find((option) => option.code === normalized || option.alias === normalized || option.label === value.trim());
}

export function CountryComboboxField({ defaultValue, direction, label, name = "destinationCountry", onChange }: CountryComboboxFieldProps) {
  const initialCode = findOption(defaultValue)?.code ?? "ALL";
  const [selectedCode, setSelectedCode] = useState(initialCode);
  const [inputValue, setInputValue] = useState(exportCountryLabel(initialCode));
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  const filteredOptions = useMemo(() => {
    const query = inputValue.trim().toLowerCase();
    if (!query || exportCountryLabel(selectedCode) === inputValue) return destinationCountryOptions;

    return destinationCountryOptions.filter((option) => optionSearchText(option).includes(query));
  }, [inputValue, selectedCode]);

  function selectCountry(countryCode: string) {
    const option = findOption(countryCode) ?? destinationCountryOptions[0];
    setSelectedCode(option.code);
    setInputValue(option.label);
    setOpen(false);
    setActiveIndex(0);
    onChange?.(option.code);
  }

  function commitTypedValue() {
    const exactMatch = findOption(inputValue);
    if (exactMatch) {
      selectCountry(exactMatch.code);
      return;
    }

    if (filteredOptions.length === 1) {
      selectCountry(filteredOptions[0].code);
      return;
    }

    setInputValue(exportCountryLabel(selectedCode));
  }

  return (
    <label className="relative grid min-w-0 gap-1 text-sm font-medium text-slate-700">
      {label ?? (direction === "import" ? "수입국가" : "목적국")}
      <input name={name} type="hidden" value={selectedCode} />
      <div
        className="relative"
        onBlur={() => {
          blurTimerRef.current = setTimeout(() => {
            setOpen(false);
            commitTypedValue();
          }, 120);
        }}
        onFocus={() => {
          if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
        }}
      >
        <input
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={open}
          className="focus-ring w-full min-w-0 rounded-md border border-slate-300 bg-white px-3 py-2 pr-10"
          onChange={(event) => {
            setInputValue(event.target.value);
            setOpen(true);
            setActiveIndex(0);
          }}
          onClick={() => {
            setOpen(true);
            setActiveIndex(0);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setOpen(true);
              setActiveIndex((index) => Math.min(index + 1, filteredOptions.length - 1));
            }
            if (event.key === "ArrowUp") {
              event.preventDefault();
              setOpen(true);
              setActiveIndex((index) => Math.max(index - 1, 0));
            }
            if (event.key === "Enter" && open) {
              event.preventDefault();
              const option = filteredOptions[activeIndex];
              if (option) selectCountry(option.code);
            }
            if (event.key === "Escape") {
              setOpen(false);
              setInputValue(exportCountryLabel(selectedCode));
            }
          }}
          ref={inputRef}
          role="combobox"
          value={inputValue}
        />
        <button
          aria-label="국가 목록 열기"
          className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-slate-500 hover:bg-slate-100"
          onClick={() => {
            inputRef.current?.focus();
            setOpen((value) => !value);
          }}
          type="button"
        >
          <ChevronDown aria-hidden="true" size={16} />
        </button>
        {open ? (
          <div
            className="absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-md border border-slate-200 bg-white py-1 shadow-xl"
            id={listboxId}
            role="listbox"
          >
            {filteredOptions.length ? (
              filteredOptions.map((option, index) => (
                <button
                  className={cn(
                    "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700",
                    index === activeIndex ? "bg-blue-50 text-blue-700" : ""
                  )}
                  key={option.code}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectCountry(option.code)}
                  role="option"
                  aria-selected={option.code === selectedCode}
                  type="button"
                >
                  <span>{option.label}</span>
                  {option.alias !== option.code ? <span className="text-xs text-slate-400">{option.alias}</span> : null}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-slate-500">일치하는 국가가 없습니다.</div>
            )}
          </div>
        ) : null}
      </div>
    </label>
  );
}
