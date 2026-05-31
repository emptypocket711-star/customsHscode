"use client";

import { Check, ClipboardCopy } from "lucide-react";
import { useId, useState } from "react";

export type HsCopyGuideLanguage = "ko" | "en" | "zh";
export type HsCopyGuideVariant = "brief" | "detailed";
export type HsCopySummaryTexts = Record<HsCopyGuideLanguage, Record<HsCopyGuideVariant, string>>;

const languageOptions: Array<{ label: string; value: HsCopyGuideLanguage }> = [
  { label: "한국어", value: "ko" },
  { label: "English", value: "en" },
  { label: "中文", value: "zh" }
];

const variantOptions: Array<{ label: string; value: HsCopyGuideVariant }> = [
  { label: "짧게", value: "brief" },
  { label: "상세", value: "detailed" }
];

export function HsCopySummaryButton({
  text,
  texts
}: {
  text?: string;
  texts?: HsCopySummaryTexts;
}) {
  const [copied, setCopied] = useState(false);
  const [language, setLanguage] = useState<HsCopyGuideLanguage>("ko");
  const [variant, setVariant] = useState<HsCopyGuideVariant>("detailed");
  const languageId = useId();
  const variantId = useId();
  const copyText = texts?.[language]?.[variant] ?? text ?? "";

  async function copyToClipboard() {
    await navigator.clipboard.writeText(copyText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="inline-flex flex-wrap items-center justify-end gap-1.5 rounded-md bg-white/10 p-1 sm:gap-2">
      {texts ? (
        <>
          <div className="inline-flex items-center gap-1.5">
            <label className="sr-only text-[11px] font-semibold text-slate-600 sm:not-sr-only" htmlFor={languageId}>안내 언어</label>
            <select
              className="focus-ring h-8 rounded-md border border-blue-200 bg-white px-2 text-xs font-semibold text-slate-700 sm:min-w-20"
              id={languageId}
              onChange={(event) => setLanguage(event.target.value as HsCopyGuideLanguage)}
              value={language}
            >
              {languageOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="inline-flex items-center gap-1.5">
            <label className="sr-only text-[11px] font-semibold text-slate-600 sm:not-sr-only" htmlFor={variantId}>안내 분량</label>
            <select
              className="focus-ring h-8 rounded-md border border-blue-200 bg-white px-2 text-xs font-semibold text-slate-700 sm:min-w-16"
              id={variantId}
              onChange={(event) => setVariant(event.target.value as HsCopyGuideVariant)}
              value={variant}
            >
              {variantOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </>
      ) : null}
      <button
        className="focus-ring inline-flex h-8 items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2.5 text-xs font-semibold text-blue-800 hover:bg-blue-100"
        disabled={!copyText}
        onClick={copyToClipboard}
        type="button"
      >
        {copied ? <Check aria-hidden="true" size={14} /> : <ClipboardCopy aria-hidden="true" size={14} />}
        <span className="sm:hidden">{copied ? "완료" : "복사"}</span>
        <span className="hidden sm:inline">{copied ? "복사됨" : "클립보드로 복사"}</span>
      </button>
    </div>
  );
}
