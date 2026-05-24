"use client";

import { Check, ClipboardCopy } from "lucide-react";
import { useState } from "react";

export function HsCopySummaryButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copyToClipboard() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button
      className="focus-ring inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-800 hover:bg-blue-100"
      onClick={copyToClipboard}
      type="button"
    >
      {copied ? <Check aria-hidden="true" size={14} /> : <ClipboardCopy aria-hidden="true" size={14} />}
      {copied ? "복사됨" : "클립보드로 복사"}
    </button>
  );
}
