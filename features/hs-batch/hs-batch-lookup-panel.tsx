"use client";

import readXlsxFile from "read-excel-file/browser";
import { useMemo, useState, useActionState } from "react";
import { Check, Clipboard, Download, FileSpreadsheet, Loader2, Search, UploadCloud } from "lucide-react";
import { CountryComboboxField } from "@/features/hs/country-combobox-field";
import { formatHsCode, normalizeHsCode } from "@/lib/hs-code";
import { lookupHsBatchAction } from "@/server/actions/hs-batch.actions";
import type { HsBatchInputRow, HsBatchLookupActionState, HsBatchResultRow } from "./schemas";
import { parseDelimitedInput, parseDelimitedText, parseMatrix, type HsBatchParseResult } from "./input-parser";

const initialState: HsBatchLookupActionState = { status: "idle" };

const sampleText = `HS CODE\t품명\t비고
3304.99-1000\t기초화장품\t샘플 1
3304.99-1000\t기초화장품 세트\t샘플 2
3923.50-0000\t플라스틱 캡\t샘플 3`;

const templateColumns = [
  { header: "HS CODE", width: 18 },
  { header: "품명", width: 34 },
  { header: "비고", width: 42 }
];

type XlsxResultColumn = {
  header: string;
  key: keyof HsBatchResultRow | "guidance";
  width: number;
};

const resultColumns: XlsxResultColumn[] = [
  { header: "입력행", key: "rowNumber", width: 8 },
  { header: "입력 HS CODE", key: "inputHskCode", width: 16 },
  { header: "정규화 HS CODE", key: "normalizedHskCode", width: 16 },
  { header: "입력 품명", key: "productName", width: 26 },
  { header: "조회 HS CODE", key: "matchedHskCode", width: 16 },
  { header: "품목명", key: "matchedName", width: 34 },
  { header: "수입국가", key: "countryCode", width: 12 },
  { header: "기본관세", key: "basicTariff", width: 22 },
  { header: "FTA 관세", key: "ftaTariff", width: 28 },
  { header: "적용 가능 최저세율", key: "lowestTariff", width: 28 },
  { header: "내국세", key: "internalTax", width: 18 },
  { header: "수입요건", key: "importRequirements", width: 54 },
  { header: "원산지표시", key: "originMarking", width: 34 },
  { header: "상태", key: "status", width: 12 },
  { header: "메시지", key: "message", width: 44 },
  { header: "업체 안내문", key: "guidance", width: 72 }
];

type ResultFilter = "all" | "success" | "warning" | "error";

const resultFilterLabels: Record<ResultFilter, string> = {
  all: "전체",
  success: "완료",
  warning: "보완 필요",
  error: "오류"
};

function resultStatusLabel(status: HsBatchResultRow["status"]) {
  if (status === "success") return "완료";
  if (status === "warning") return "확인 필요";
  return "오류";
}

function hasVisibleRequirement(row: HsBatchResultRow) {
  return row.importRequirements !== "-"
    && !row.importRequirements.includes("수입요건 조회 결과 없음");
}

function buildRowGuidance(row: HsBatchResultRow) {
  const normalizedInput = formatHsCode(row.normalizedHskCode || normalizeHsCode(row.inputHskCode));
  const itemName = row.productName || row.matchedName || "입력 품명 미기재";

  if (row.status !== "success") {
    return [
      `[HS CODE 일괄 조회 보완 요청]`,
      `입력행: ${row.rowNumber}`,
      `품명: ${itemName}`,
      `입력 HS CODE: ${normalizedInput || row.inputHskCode}`,
      ``,
      `현재 상태: ${resultStatusLabel(row.status)}`,
      `확인 내용: ${row.message}`,
      ``,
      `HS CODE 10자리 기준으로 관세율, 내국세, 수입요건을 다시 확인할 수 있습니다.`,
      `정확한 10자리 HS CODE 또는 품목 세부 정보를 보완해 주시면 재조회하겠습니다.`
    ].join("\n");
  }

  const lines = [
    `[HS CODE 예비 조회 안내]`,
    `입력행: ${row.rowNumber}`,
    `품명: ${itemName}`,
    `HS CODE: ${row.matchedHskCode}`,
    `품목명: ${row.matchedName}`,
    ``,
    `적용 관세율: ${row.basicTariff}`,
    row.ftaTariff !== "-" ? `FTA 관세율: ${row.ftaTariff}` : null,
    `적용 가능 최저세율: ${row.lowestTariff}`,
    `내국세: ${row.internalTax}`,
    ``,
    `수입요건:`,
    hasVisibleRequirement(row)
      ? row.importRequirements
      : `표시된 세관장확인 수입요건은 조회되지 않았습니다. 다만 통합공고, 개별법령, 표시·인증·유통규제 의무가 존재할 수 있으므로 품목 세부 조건은 별도 확인이 필요합니다.`,
    ``,
    `원산지표시: ${row.originMarking}`,
    ``,
    `위 내용은 ${row.message} 결과이며, 실제 신고 전 품목의 재질·용도·구성·원산지 조건에 따라 추가 확인이 필요할 수 있습니다.`
  ].filter((line): line is string => line !== null);

  return lines.join("\n");
}

function buildXlsxSheetData(results: HsBatchResultRow[]) {
  const headerStyle = {
    backgroundColor: "#1D4ED8",
    fontWeight: "bold" as const,
    textColor: "#FFFFFF",
    alignVertical: "center" as const,
    wrap: true
  };
  const cellStyle = {
    alignVertical: "top" as const,
    borderColor: "#E2E8F0",
    borderStyle: "thin" as const,
    wrap: true
  };

  return [
    resultColumns.map((column) => ({ value: column.header, type: String, ...headerStyle })),
    ...results.map((result) =>
      resultColumns.map((column) => {
        const value = column.key === "status"
          ? resultStatusLabel(result.status)
          : column.key === "guidance"
          ? buildRowGuidance(result)
          : column.key === "normalizedHskCode" && result.normalizedHskCode
          ? formatHsCode(result.normalizedHskCode)
          : result[column.key];
        const statusStyle = column.key === "status"
          ? {
              fontWeight: "bold" as const,
              textColor: result.status === "success" ? "#047857" : result.status === "warning" ? "#B45309" : "#B91C1C"
            }
          : {};
        return { value: String(value ?? ""), type: String, ...cellStyle, ...statusStyle };
      })
    )
  ];
}

async function downloadResults(results: HsBatchResultRow[]) {
  const writeXlsxFile = (await import("write-excel-file/browser")).default;
  const needsAttention = results.filter((result) => result.status !== "success");
  const sheetOptions = {
    columns: resultColumns.map((column) => ({ width: column.width })),
    stickyRowsCount: 1
  };
  const sheets = [
    {
      data: buildXlsxSheetData(results),
      sheet: "전체 결과",
      ...sheetOptions
    },
    ...(needsAttention.length
      ? [{
          data: buildXlsxSheetData(needsAttention),
          sheet: "보완 필요",
          ...sheetOptions
        }]
      : [])
  ];

  await writeXlsxFile(sheets).toFile(`hs-batch-result-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

async function downloadUploadTemplate() {
  const writeXlsxFile = (await import("write-excel-file/browser")).default;
  const headerStyle = {
    backgroundColor: "#1D4ED8",
    fontWeight: "bold" as const,
    textColor: "#FFFFFF",
    alignVertical: "center" as const,
    wrap: true
  };
  const requiredStyle = {
    backgroundColor: "#EEF2FF",
    fontWeight: "bold" as const,
    textColor: "#1E3A8A",
    alignVertical: "top" as const,
    borderColor: "#CBD5E1",
    borderStyle: "thin" as const,
    wrap: true
  };
  const cellStyle = {
    alignVertical: "top" as const,
    borderColor: "#E2E8F0",
    borderStyle: "thin" as const,
    wrap: true
  };

  await writeXlsxFile([
    {
      sheet: "업로드 양식",
      columns: templateColumns.map((column) => ({ width: column.width })),
      stickyRowsCount: 1,
      data: [
        templateColumns.map((column) => ({ value: column.header, type: String, ...headerStyle })),
        [
          { value: "3304.99-1000", type: String, ...requiredStyle },
          { value: "기초화장품", type: String, ...cellStyle },
          { value: "예: 인보이스 1번 행 / 브랜드명 / 모델명 / 확인 메모", type: String, ...cellStyle }
        ],
        [
          { value: "3923.50-0000", type: String, ...cellStyle },
          { value: "플라스틱 캡", type: String, ...cellStyle },
          { value: "같은 HS CODE가 여러 번 있어도 행을 합치지 않습니다.", type: String, ...cellStyle }
        ]
      ]
    },
    {
      sheet: "작성 방법",
      columns: [{ width: 24 }, { width: 76 }],
      data: [
        [
          { value: "항목", type: String, ...headerStyle },
          { value: "작성 방법", type: String, ...headerStyle }
        ],
        [
          { value: "HS CODE", type: String, ...requiredStyle },
          { value: "필수값입니다. 관세율, 내국세, 수입요건 조회는 10자리 기준입니다. 예: 3304.99-1000 또는 3304991000", type: String, ...cellStyle }
        ],
        [
          { value: "품명", type: String, ...cellStyle },
          { value: "선택값입니다. 업체 안내문과 내부 확인용으로 표시됩니다.", type: String, ...cellStyle }
        ],
        [
          { value: "비고", type: String, ...cellStyle },
          { value: "선택값입니다. 인보이스 행 번호, 모델명, 브랜드명, 확인 메모 등을 적을 수 있습니다.", type: String, ...cellStyle }
        ],
        [
          { value: "중복 행", type: String, ...cellStyle },
          { value: "같은 HS CODE가 여러 번 있어도 합치지 않고 업로드한 순서 그대로 조회 결과를 만듭니다.", type: String, ...cellStyle }
        ],
        [
          { value: "4/6/8자리", type: String, ...cellStyle },
          { value: "일괄조회에서는 보완 필요로 표시됩니다. 하위 10자리 확정 후 다시 조회해 주세요.", type: String, ...cellStyle }
        ]
      ]
    }
  ]).toFile("hs-batch-upload-template.xlsx");
}

function statusBadgeClass(status: HsBatchResultRow["status"]) {
  if (status === "success") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (status === "warning") return "bg-amber-50 text-amber-700 ring-amber-200";
  return "bg-red-50 text-red-700 ring-red-200";
}

function describeColumnDetection(result: HsBatchParseResult) {
  const columns = [
    `HS CODE: ${result.columns.hsk.header}`,
    result.columns.product ? `품명: ${result.columns.product.header}` : null,
    result.columns.memo ? `비고: ${result.columns.memo.header}` : null
  ].filter((value): value is string => value !== null);

  return columns.join(" / ");
}

export function HsBatchLookupPanel({ basisDate }: { basisDate: string }) {
  const [state, formAction, pending] = useActionState(lookupHsBatchAction, initialState);
  const [inputText, setInputText] = useState(sampleText);
  const [rows, setRows] = useState<HsBatchInputRow[]>(() => parseDelimitedText(sampleText));
  const [parseMessage, setParseMessage] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [templateDownloading, setTemplateDownloading] = useState(false);
  const [resultFilter, setResultFilter] = useState<ResultFilter>("all");
  const [copiedRowKey, setCopiedRowKey] = useState<string | null>(null);
  const [copiedVisibleRows, setCopiedVisibleRows] = useState(false);

  const rowSummary = useMemo(() => {
    const valid10 = rows.filter((row) => normalizeHsCode(row.hskCode).length === 10).length;
    return { total: rows.length, valid10, invalid: rows.length - valid10 };
  }, [rows]);
  const resultCounts = useMemo(() => {
    const results = state.results ?? [];
    return {
      all: results.length,
      success: results.filter((row) => row.status === "success").length,
      warning: results.filter((row) => row.status === "warning").length,
      error: results.filter((row) => row.status === "error").length
    };
  }, [state.results]);
  const filteredResults = useMemo(() => {
    const results = state.results ?? [];
    if (resultFilter === "all") return results;
    return results.filter((row) => row.status === resultFilter);
  }, [resultFilter, state.results]);

  async function handleFile(file: File | null) {
    if (!file) return;
    try {
      const name = file.name.toLowerCase();
      const parsed = name.endsWith(".csv")
        ? parseDelimitedInput(await file.text())
        : parseMatrix((await readXlsxFile(file)) as unknown as unknown[][]);
      setRows(parsed.rows);
      setInputText("");
      setParseMessage(`${file.name}에서 ${parsed.rows.length}행을 읽었습니다. ${describeColumnDetection(parsed)}로 인식했습니다. 같은 HS CODE가 여러 번 있어도 그대로 조회합니다.`);
    } catch (error) {
      setParseMessage(error instanceof Error ? error.message : "파일을 읽지 못했습니다. XLSX 또는 CSV 파일인지 확인해 주세요.");
    }
  }

  function parseTextarea() {
    const parsed = parseDelimitedInput(inputText);
    setRows(parsed.rows);
    setParseMessage(`${parsed.rows.length}행을 읽었습니다. ${describeColumnDetection(parsed)}로 인식했습니다. 입력 순서와 중복 HS CODE를 유지합니다.`);
  }

  async function handleDownloadResults() {
    if (!state.results?.length) return;
    setExporting(true);
    try {
      await downloadResults(state.results);
    } finally {
      setExporting(false);
    }
  }

  async function handleDownloadTemplate() {
    setTemplateDownloading(true);
    try {
      await downloadUploadTemplate();
    } finally {
      setTemplateDownloading(false);
    }
  }

  async function handleCopyRow(row: HsBatchResultRow, key: string) {
    await navigator.clipboard.writeText(buildRowGuidance(row));
    setCopiedRowKey(key);
    window.setTimeout(() => setCopiedRowKey((current) => current === key ? null : current), 1600);
  }

  async function handleCopyVisibleRows() {
    if (!filteredResults.length) return;
    const text = filteredResults
      .map((row) => buildRowGuidance(row))
      .join("\n\n------------------------------\n\n");
    await navigator.clipboard.writeText(text);
    setCopiedVisibleRows(true);
    window.setTimeout(() => setCopiedVisibleRows(false), 1600);
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
                <button
                  className="focus-ring inline-flex items-center gap-2 rounded-md border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                  disabled={templateDownloading}
                  onClick={() => void handleDownloadTemplate()}
                  type="button"
                >
                  {templateDownloading ? <Loader2 aria-hidden="true" className="animate-spin" size={16} /> : <Download aria-hidden="true" size={16} />}
                  {templateDownloading ? "양식 생성 중" : "업로드 양식 다운로드"}
                </button>
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
            <div className="flex flex-wrap gap-2">
              <button
                className={
                  copiedVisibleRows
                    ? "focus-ring inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white"
                    : "focus-ring inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                }
                disabled={!filteredResults.length}
                onClick={() => void handleCopyVisibleRows()}
                type="button"
              >
                {copiedVisibleRows ? <Check aria-hidden="true" size={17} /> : <Clipboard aria-hidden="true" size={17} />}
                {copiedVisibleRows ? "복사됨" : "표시 행 안내 복사"}
              </button>
              <button
                className="focus-ring inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500"
                disabled={exporting}
                onClick={() => void handleDownloadResults()}
                type="button"
              >
                {exporting ? <Loader2 aria-hidden="true" className="animate-spin" size={17} /> : <Download aria-hidden="true" size={17} />}
                {exporting ? "XLSX 생성 중" : "XLSX 다운로드"}
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 border-b border-slate-200 px-5 py-3">
            {(["all", "success", "warning", "error"] as const).map((filter) => {
              const active = resultFilter === filter;
              return (
                <button
                  aria-pressed={active}
                  className={
                    active
                      ? "focus-ring rounded-md bg-blue-700 px-3 py-2 text-sm font-semibold text-white"
                      : "focus-ring rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  }
                  key={filter}
                  onClick={() => setResultFilter(filter)}
                  type="button"
                >
                  {resultFilterLabels[filter]} {resultCounts[filter]}
                </button>
              );
            })}
          </div>
          {resultFilter !== "all" && filteredResults.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-slate-500">
              선택한 상태의 조회 결과가 없습니다.
            </div>
          ) : null}
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
                  <th className="px-3 py-2">안내</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredResults.map((row, index) => {
                  const rowKey = `${row.rowNumber}-${row.inputHskCode}-${index}`;
                  const copied = copiedRowKey === rowKey;
                  return (
                    <tr key={rowKey} className="align-top">
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
                      <td className="whitespace-nowrap px-3 py-2">
                        <button
                          className={
                            copied
                              ? "focus-ring inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white"
                              : "focus-ring inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          }
                          onClick={() => void handleCopyRow(row, rowKey)}
                          type="button"
                        >
                          {copied ? <Check aria-hidden="true" size={14} /> : <Clipboard aria-hidden="true" size={14} />}
                          {copied ? "복사됨" : "안내 복사"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
