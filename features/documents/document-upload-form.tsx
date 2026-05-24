"use client";

import { useActionState } from "react";
import { UploadCloud } from "lucide-react";
import { DocumentExtractionForm } from "@/features/documents/document-extraction-form";
import { uploadCaseDocumentAction } from "@/server/actions/document-upload.actions";
import type { DocumentUploadActionState } from "@/features/documents/schemas";

const initialState: DocumentUploadActionState = { status: "idle" };

export function DocumentUploadForm({
  basisDate
}: {
  basisDate: string;
}) {
  const [state, formAction, pending] = useActionState(uploadCaseDocumentAction, initialState);

  return (
    <div className="grid gap-4">
      <form action={formAction} className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            구분
            <select className="focus-ring rounded-md border border-slate-300 bg-white px-3 py-2" disabled={pending} name="direction" defaultValue="import">
              <option value="import">수입</option>
              <option value="export">수출</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            문서 유형
            <select className="focus-ring rounded-md border border-slate-300 bg-white px-3 py-2" disabled={pending} name="documentType" defaultValue="commercial_invoice">
              <option value="commercial_invoice">Commercial Invoice</option>
              <option value="packing_list">Packing List</option>
              <option value="bill_of_lading">B/L</option>
              <option value="air_waybill">AWB</option>
              <option value="certificate_of_origin">C/O</option>
              <option value="catalog">Catalog</option>
              <option value="spec_sheet">Spec Sheet</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            기준일
            <input className="focus-ring rounded-md border border-slate-300 px-3 py-2" defaultValue={basisDate} disabled={pending} name="basisDate" type="date" />
          </label>
        </div>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          문서 파일
          <input
            accept="application/pdf,image/jpeg,image/png,image/webp,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.xls,.xlsx,.csv"
            className="focus-ring rounded-md border border-dashed border-slate-300 bg-white px-3 py-6 text-sm"
            disabled={pending}
            name="file"
            type="file"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          메모
          <input
            className="focus-ring rounded-md border border-slate-300 px-3 py-2"
            disabled={pending}
            name="note"
            placeholder="예: 1차 수입 신고 검토용"
          />
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <button
            className="focus-ring inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={pending}
            type="submit"
          >
            <UploadCloud aria-hidden="true" size={18} />
            private bucket 업로드
          </button>
          <p className="text-xs text-slate-500">PDF/JPG/PNG/WEBP/XLS/XLSX/CSV, 10MB 이하. XLSX/CSV는 업로드 후 자동 추출을 시도합니다.</p>
        </div>
      </form>
      {state.message ? (
        <div className={state.status === "success" ? "rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800" : "rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"}>
          <p>{state.message}</p>
          {state.requestId && state.documentId ? (
            <p className="mt-1 font-mono text-xs">request {state.requestId} / document {state.documentId}</p>
          ) : null}
        </div>
      ) : null}
      {state.requestId && state.documentId ? (
        state.extractionMode === "manual_text" ? (
          <DocumentExtractionForm documentId={state.documentId} requestId={state.requestId} />
        ) : state.extractionMode === "unsupported_legacy_xls" ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
            이 파일은 구형 XLS 형식이라 자동 추출하지 않았습니다. Excel에서 다른 이름으로 저장하여 XLSX 또는 CSV로 변환한 뒤 다시 업로드해 주세요.
          </div>
        ) : state.extractionMode === "queued" ? (
          <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm leading-6 text-blue-900">
            문서 추출 작업을 대기열에 등록했습니다. 작업자가 처리한 뒤 라인아이템 후보가 생성됩니다.
          </div>
        ) : (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm leading-6 text-emerald-800">
            파일에서 라인아이템 후보를 자동 저장했습니다. 담당자 보정 큐에서 추출값을 확인할 수 있습니다.
          </div>
        )
      ) : null}
    </div>
  );
}
