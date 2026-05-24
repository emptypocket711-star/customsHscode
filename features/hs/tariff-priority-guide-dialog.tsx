"use client";

import { ListOrdered, X } from "lucide-react";
import { useRef } from "react";

const priorityRows = [
  { priority: "1순위", target: "덤핑방지관세, 상계관세, 보복관세, 긴급관세, 특별긴급관세 등", condition: "해당 실행관세에 가산 또는 우선 적용되는 성격의 세율입니다." },
  { priority: "2순위", target: "FTA·CEPA·RCEP 등 협정관세", condition: "원산지 기준, 직접운송, C/O 등 협정 적용 요건을 충족하는 경우 검토합니다." },
  { priority: "3순위", target: "WTO 협정관세, WTO 양허관세, 아·태협정 양허관세, 국제협력관세 등", condition: "기본관세보다 낮거나 우선 적용되는 양허·협정 계열 세율입니다." },
  { priority: "4순위", target: "조정관세, 할당관세", condition: "개별 품목과 기간에 따라 우선 적용 여부가 달라질 수 있습니다." },
  { priority: "5순위", target: "최빈개발도상국 특혜관세", condition: "대상 국가와 원산지 요건 충족 여부를 함께 봅니다." },
  { priority: "6순위", target: "잠정세율", condition: "기본관세보다 우선 적용되는 임시 성격의 세율입니다." },
  { priority: "7순위", target: "기본관세", condition: "상위 순위 세율이 적용되지 않는 경우 표시되는 기본 세율입니다." }
];

export function TariffPriorityGuideDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        className="focus-ring inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        onClick={() => dialogRef.current?.showModal()}
        type="button"
      >
        <ListOrdered aria-hidden="true" size={14} />
        세율 적용순서
      </button>
      <dialog className="w-[min(900px,calc(100vw-32px))] rounded-lg border border-slate-200 p-0 shadow-2xl backdrop:bg-slate-950/45" ref={dialogRef}>
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-950">세율 적용순서</h2>
          <button
            aria-label="닫기"
            className="focus-ring grid size-8 place-items-center rounded-md text-slate-700 hover:bg-slate-100"
            onClick={() => dialogRef.current?.close()}
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>
        <div className="max-h-[72vh] overflow-auto p-4">
          <p className="text-sm leading-6 text-slate-700">
            동일 품목에 여러 세율이 함께 표시될 수 있습니다. 아래 순서는 관세율표의 세율구분을 사용자가 비교하기 쉽게 정리한 기준입니다.
          </p>
          <div className="mt-4 overflow-x-auto rounded-md border border-slate-200">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-500">
                <tr>
                  <th className="px-3 py-2">적용 순위</th>
                  <th className="px-3 py-2">대상 세율</th>
                  <th className="px-3 py-2">표시 기준</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {priorityRows.map((row) => (
                  <tr key={row.priority}>
                    <td className="whitespace-nowrap px-3 py-2 font-semibold text-slate-950">{row.priority}</td>
                    <td className="px-3 py-2 font-medium text-slate-900">{row.target}</td>
                    <td className="px-3 py-2 leading-6 text-slate-700">{row.condition}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 rounded-md bg-slate-50 p-3 text-sm leading-6 text-slate-700">
            <p>
              `WTO 협정관세`와 `WTO 양허관세`는 모두 WTO 계열 세율이지만 세율구분 코드가 다르기 때문에 별도 행으로 표시될 수 있습니다.
              일반 국가 조회 대상이 아닌 특수 세율은 해당 원산지 조회 조건에서만 표시합니다.
            </p>
          </div>
        </div>
      </dialog>
    </>
  );
}
