"use client";

import { useState } from "react";
import { ClipboardCopy } from "lucide-react";

export function CopyOperationsRequestButton({
  text
}: {
  text: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyToClipboard() {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button
      className="focus-ring inline-flex h-9 items-center justify-center gap-2 rounded-md bg-slate-950 px-3 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      disabled={!text}
      onClick={copyToClipboard}
      type="button"
    >
      <ClipboardCopy aria-hidden="true" size={14} />
      {copied ? "복사됨" : "요청 문장 복사"}
    </button>
  );
}
