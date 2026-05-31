"use client";

import { useEffect, useState } from "react";

type HsNavigationStatItem = {
  hskCodePattern: string;
  lineCount: string;
  productName: string;
  rank: string;
};

type Labels = {
  count: string;
  empty: string;
  loading: string;
  productName: string;
  rank: string;
  title: string;
};

export function HsNavigationStatsLazySection({
  hskCode,
  labels
}: {
  hskCode: string;
  labels: Labels;
}) {
  const [state, setState] = useState<{
    hskCode: string;
    rows: HsNavigationStatItem[];
    status: "loading" | "done";
  }>({
    hskCode,
    rows: [],
    status: "loading"
  });

  useEffect(() => {
    const controller = new AbortController();
    const url = new URL("/api/hs/navigation-stats", window.location.origin);
    url.searchParams.set("hskCode", hskCode);

    fetch(url, {
      credentials: "same-origin",
      signal: controller.signal
    })
      .then((response) => response.ok ? response.json() as Promise<{ rows?: HsNavigationStatItem[] }> : { rows: [] })
      .then((payload) => {
        if (!controller.signal.aborted) {
          setState({
            hskCode,
            rows: Array.isArray(payload.rows) ? payload.rows : [],
            status: "done"
          });
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setState({
            hskCode,
            rows: [],
            status: "done"
          });
        }
      });

    return () => controller.abort();
  }, [hskCode]);

  const isLoading = state.hskCode !== hskCode || state.status === "loading";
  const rows = isLoading ? [] : state.rows;

  return (
    <div className="border-t border-slate-200">
      <div className="bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900">{labels.title}</div>
      {isLoading ? (
        <div className="px-3 py-3 text-sm text-slate-500">{labels.loading}</div>
      ) : rows.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-y border-slate-200 text-xs font-semibold text-slate-500">
              <tr>
                <th className="px-3 py-2">{labels.rank}</th>
                <th className="px-3 py-2">{labels.productName}</th>
                <th className="px-3 py-2">{labels.count}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={`${row.rank}-${row.productName}-${row.lineCount}`}>
                  <td className="whitespace-nowrap px-3 py-2 font-mono font-semibold text-slate-700">{row.rank || "-"}</td>
                  <td className="px-3 py-2 font-medium text-slate-900">{row.productName || "-"}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-slate-700">{row.lineCount || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="px-3 py-4 text-sm text-slate-500">{labels.empty}</div>
      )}
    </div>
  );
}
