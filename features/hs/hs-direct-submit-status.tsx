"use client";

import { Loader2, Search } from "lucide-react";
import { useFormStatus } from "react-dom";

function normalizeQuery(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function isHsCodeLike(value: string) {
  return /^[0-9.\-\s]+$/.test(value) && value.replace(/[^0-9]/g, "").length >= 2;
}

function isProductSearch(data: FormData | null) {
  const query = normalizeQuery(data?.get("query") ?? null);
  return Boolean(query) && !isHsCodeLike(query);
}

export function HsDirectSubmitStatus({ submitLabel }: { submitLabel: string }) {
  const { data, pending } = useFormStatus();
  const showProductAnalysis = pending && isProductSearch(data);

  return (
    <>
      <button
        className="focus-ring inline-flex items-center justify-center gap-2 self-end rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-wait disabled:bg-slate-700"
        disabled={pending}
        type="submit"
      >
        {pending ? <Loader2 aria-hidden="true" className="animate-spin" size={18} /> : <Search aria-hidden="true" size={18} />}
        {pending ? "조회 중" : submitLabel}
      </button>
      {showProductAnalysis ? (
        <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-950 lg:col-span-full">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-semibold">AI가 HS 분류 흐름을 검토하고 있습니다.</p>
              <p className="mt-1 text-xs leading-5 text-blue-900">
                제품 의미 해석, 류·호 후보 검토, HSK 후보 정리, 조회 연결 가능성을 순서대로 확인합니다.
              </p>
            </div>
            <span className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-blue-800 ring-1 ring-blue-100">AI 분석 중</span>
          </div>
          <ol className="mt-3 grid gap-2 md:grid-cols-4">
            {["제품 의미 해석", "류·호 후보 검토", "HSK 후보 정리", "관세율·요건 연결"].map((step, index) => (
              <li className="rounded-md border border-blue-100 bg-white px-3 py-2" key={step}>
                <span className="font-mono text-xs font-semibold text-blue-700">{index + 1}</span>
                <span className="ml-2 text-xs font-medium text-slate-800">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </>
  );
}
