"use client";

import readXlsxFile from "read-excel-file/browser";
import { useMemo, useState, useActionState } from "react";
import { Download, FileSpreadsheet, Loader2, Search, UploadCloud } from "lucide-react";
import { CountryComboboxField } from "@/features/hs/country-combobox-field";
import { formatHsCode, normalizeHsCode } from "@/lib/hs-code";
import { lookupHsBatchAction } from "@/server/actions/hs-batch.actions";
import type { HsBatchInputRow, HsBatchLookupActionState, HsBatchResultRow } from "./schemas";
import { parseDelimitedText, rowsFromMatrix } from "./input-parser";

const initialState: HsBatchLookupActionState = { status: "idle" };

const sampleText = `HS CODE\t품명\t비고
3304.99-1000\t기초화장품\t샘플 1
3304.99-1000\t기초화장품 세트\t샘플 2
3923.50-0000\t플라스틱 캡\t샘플 3`;

function escapeTsvCell(value: string | number) {
  return String(value).replace(/\r?\n/g, " / ").replace(/\t/g, " ");
}

function downloadResults(results: HsBatchResultRow[]) {
  const headers = [
    "입력행",
    "입력 HS CODE",
    "정규화 HS CODE",
    "입력 품명",
    "조회 HS CODE",
    "품목명",
    "수입국가",
    "기본관세",
    "FTA 관세",
    "적용 가능 최저세율",
    "내국세",
    "수입요건",
    "원산지표시",
    "상태",
    "메시지"
  ];
  const body = results.map((row) => [
    row.rowNumber,
    row.inputHskCode,
    row.normalizedHskCode,
    row.productName,
    row.matchedHskCode,
    row.matchedName,
    row.countryCode,
    row.basicTariff,
    row.ftaTariff,
    row.lowestTariff,
    row.internalTax,
    row.importRequirements,
    row.originMarking,
    row.status,
    row.message
  ]);
  const tsv = [headers, ...body].map((row) => row.map(escapeTsvCell).join("\t")).join("\n");
  const blob = new Blob([`\uFEFF${tsv}`], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `hs-batch-result-${new Date().toISOString().slice(0, 10)}.xls`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function statusBadgeClass(status: HsBatchResultRow["status"]) {
  if (status === "success") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (status === "warning") return "bg-amber-50 text-amber-700 ring-amber-200";
  return "bg-red-50 text-red-700 ring-red-200";
}

export function HsBatchLookupPanel({ basisDate }: { basisDate: string }) {
  const [state, formAction, pending] = useActionState(lookupHsBatchAction, initialState);
  const [inputText, setInputText] = useState(sampleText);
  const [rows, setRows] = useState<HsBatchInputRow[]>(() => parseDelimitedText(sampleText));
  const [parseMessage, setParseMessage] = useState<string | null>(null);

  const rowSummary = useMemo(() => {
    const valid10 = rows.filter((row) => normalizeHsCode(row.hskCode).length === 10).length;
    return { total: rows.length, valid10, invalid: rows.length - valid10 };
  }, [rows]);

  async function handleFile(file: File | null) {
    if (!file) return;
    try {
      const name = file.name.toLowerCase();
      const matrix = name.endsWith(".csv")
        ? (await file.text()).split(/\r?\n/).map((line) => line.split(","))
        : await readXlsxFile(file);
      const parsedRows = rowsFromMatrix(matrix as unknown[][]);
      setRows(parsedRows);
      setInputText("");
      setParseMessage(`${file.name}에서 ${parsedRows.length}행을 읽었습니다. 같은 HS CODE가 여러 번 있어도 그대로 조회합니다.`);
    } catch (error) {
      setParseMessage(error instanceof Error ? error.message : "파일을 읽지 못했습니다. XLSX 또는 CSV 파일인지 확인해 주세요.");
    }
  }

  function parseTextarea() {
    const parsedRows = parseDelimitedText(inputText);
    setRows(parsedRows);
    setParseMessage(`${parsedRows.length}행을 읽었습니다. 입력 순서와 중복 HS CODE를 유지합니다.`);
  }

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <p className="text-sm font-semibold text-blue-700">HS CODE 10자리 필수</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">HS CODE 일괄 조회</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            인보이스 행 단위로 HS CODE를 조회합니다. 중복 HS CODE는 합치지 않고, 사용자가 올린 행 순서 그대로 결과를 생성합니다.
          </p>
        </div>

        <div className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
          <div className="grid gap-4">
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              엑셀/CSV 업로드
              <div className="flex min-h-28 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center">
                <UploadCloud aria-hidden="true" className="text-slate-400" size={24} />
                <input
                  accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                  className="focus-ring w-full max-w-sm rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                  disabled={pending}
                  onChange={(event) => void handleFile(event.target.files?.[0] ?? null)}
                  type="file"
                />
                <p className="text-xs text-slate-500">첫 행에 HS CODE, 품명, 비고 컬럼이 있으면 자동 인식합니다. 헤더가 없으면 첫 번째 컬럼을 HS CODE로 봅니다.</p>
              </div>
            </label>

            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              붙여넣기 입력
              <textarea
                className="focus-ring min-h-44 rounded-md border border-slate-300 px-3 py-2 font-mono text-sm leading-6"
                disabled={pending}
                onChange={(event) => setInputText(event.target.value)}
                value={inputText}
              />
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <button
                className="focus-ring inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                disabled={pending}
                onClick={parseTextarea}
                type="button"
              >
                <FileSpreadsheet aria-hidden="true" size={16} />
                붙여넣기 행 읽기
              </button>
              {parseMessage ? <span className="text-sm text-slate-600">{parseMessage}</span> : null}
            </div>
          </div>

          <form action={formAction} className="grid content-start gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <input name="rowsJson" type="hidden" value={JSON.stringify(rows)} />
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1 text-sm font-semibold text-slate-700">
                조회기준일
                <input className="focus-ring rounded-md border border-slate-300 bg-white px-3 py-2" defaultValue={basisDate} disabled={pending} name="basisDate" type="date" />
              </label>
              <CountryComboboxField defaultValue="ALL" direction="import" label="수입국가" />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-md border border-slate-200 bg-white p-3">
                <div className="text-xs font-semibold text-slate-500">읽은 행</div>
                <div className="mt-1 text-xl font-bold text-slate-950">{rowSummary.total}</div>
              </div>
              <div className="rounded-md border border-emerald-100 bg-emerald-50 p-3">
                <div className="text-xs font-semibold text-emerald-700">10자리</div>
                <div className="mt-1 text-xl font-bold text-emerald-800">{rowSummary.valid10}</div>
              </div>
              <div className="rounded-md border border-amber-100 bg-amber-50 p-3">
                <div className="text-xs font-semibold text-amber-700">확인 필요</div>
                <div className="mt-1 text-xl font-bold text-amber-800">{rowSummary.invalid}</div>
              </div>
            </div>

            <button
              className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-blue-700 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              disabled={pending || rows.length === 0}
              type="submit"
            >
              {pending ? <Loader2 aria-hidden="true" className="animate-spin" size={18} /> : <Search aria-hidden="true" size={18} />}
              {pending ? "행별 조회 중" : "일괄 조회"}
            </button>
            <p className="text-xs leading-5 text-slate-500">
              4자리/6자리/8자리는 결과에서 확인 필요로 표시합니다. 일괄 세율·요건 조회는 HS CODE 10자리 기준입니다.
            </p>
          </form>
        </div>
      </section>

      {rows.length ? (
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-slate-900">입력 미리보기</h2>
            <span className="text-xs text-slate-500">상위 20행 표시</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">행</th>
                  <th className="px-3 py-2">HS CODE</th>
                  <th className="px-3 py-2">품명</th>
                  <th className="px-3 py-2">비고</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.slice(0, 20).map((row, index) => (
                  <tr key={`${row.rowNumber}-${index}`}>
                    <td className="whitespace-nowrap px-3 py-2 text-slate-500">{row.rowNumber}</td>
                    <td className="whitespace-nowrap px-3 py-2 font-mono font-semibold text-slate-900">{formatHsCode(normalizeHsCode(row.hskCode))}</td>
                    <td className="px-3 py-2 text-slate-700">{row.productName || "-"}</td>
                    <td className="px-3 py-2 text-slate-500">{row.memo || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {state.message ? (
        <div className={state.status === "success" ? "rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800" : "rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"}>
          {state.message}
        </div>
      ) : null}

      {state.results?.length ? (
        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="text-lg font-bold text-slate-950">조회 결과</h2>
              <p className="mt-1 text-sm text-slate-600">
                완료 {state.summary?.success ?? 0}행 / 확인 필요 {state.summary?.warning ?? 0}행 / 오류 {state.summary?.error ?? 0}행
              </p>
            </div>
            <button
              className="focus-ring inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
              onClick={() => downloadResults(state.results ?? [])}
              type="button"
            >
              <Download aria-hidden="true" size={17} />
              엑셀 다운로드
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[1320px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-500">
                <tr>
                  <th className="px-3 py-2">행</th>
                  <th className="px-3 py-2">상태</th>
                  <th className="px-3 py-2">입력 HS</th>
                  <th className="px-3 py-2">조회 HS</th>
                  <th className="px-3 py-2">품목명</th>
                  <th className="px-3 py-2">기본관세</th>
                  <th className="px-3 py-2">FTA</th>
                  <th className="px-3 py-2">최저세율</th>
                  <th className="px-3 py-2">내국세</th>
                  <th className="px-3 py-2">수입요건</th>
                  <th className="px-3 py-2">원산지표시</th>
                  <th className="px-3 py-2">메시지</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {state.results.map((row, index) => (
                  <tr key={`${row.rowNumber}-${row.inputHskCode}-${index}`} className="align-top">
                    <td className="whitespace-nowrap px-3 py-2 text-slate-500">{row.rowNumber}</td>
                    <td className="whitespace-nowrap px-3 py-2">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ring-1 ${statusBadgeClass(row.status)}`}>
                        {row.status === "success" ? "완료" : row.status === "warning" ? "확인 필요" : "오류"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 font-mono text-slate-700">{formatHsCode(row.normalizedHskCode || normalizeHsCode(row.inputHskCode))}</td>
                    <td className="whitespace-nowrap px-3 py-2 font-mono font-semibold text-blue-700">{row.matchedHskCode || "-"}</td>
                    <td className="min-w-56 px-3 py-2 font-medium text-slate-900">{row.matchedName || row.productName || "-"}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-slate-700">{row.basicTariff}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-slate-700">{row.ftaTariff}</td>
                    <td className="whitespace-nowrap px-3 py-2 font-semibold text-orange-700">{row.lowestTariff}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-slate-700">{row.internalTax}</td>
                    <td className="min-w-72 whitespace-pre-line px-3 py-2 text-slate-700">{row.importRequirements}</td>
                    <td className="min-w-48 px-3 py-2 text-slate-700">{row.originMarking}</td>
                    <td className="min-w-64 px-3 py-2 text-slate-500">{row.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
