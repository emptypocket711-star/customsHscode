"use client";

import { useActionState } from "react";
import { FileSearch } from "lucide-react";
import type { DocumentExtractionActionState } from "@/features/documents/schemas";
import { persistDocumentExtractionAction } from "@/server/actions/document-extraction.actions";

const initialState: DocumentExtractionActionState = {
  status: "idle",
  message: ""
};

export function DocumentExtractionForm({
  documentId,
  requestId
}: {
  documentId: string;
  requestId: string;
}) {
  const [state, formAction, pending] = useActionState(persistDocumentExtractionAction, initialState);

  return (
    <form action={formAction} className="mt-4 grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
      <input name="documentId" type="hidden" value={documentId} />
      <input name="requestId" type="hidden" value={requestId} />
      <label className="grid gap-1 text-sm font-medium text-slate-700">
        추출 텍스트
        <textarea
          className="focus-ring min-h-40 rounded-md border border-slate-300 bg-white px-3 py-2 font-mono text-xs leading-5"
          disabled={pending}
          name="rawText"
          placeholder={"업로드한 파일은 아직 자동으로 읽지 않습니다.\nPDF OCR 결과, 엑셀 표 영역 복사값, CSV 내용을 여기에 붙여넣어 주세요.\n예: Description,Model,Qty,Unit,Unit Price,Amount"}
        />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button
          className="focus-ring inline-flex items-center gap-2 rounded-md bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-white"
          disabled={pending}
          type="submit"
        >
          <FileSearch aria-hidden="true" size={18} />
          추출 결과 저장
        </button>
        <p className="text-xs text-slate-500">현재 단계에서는 파일 업로드 후 표/텍스트를 붙여넣어 추출합니다. 원문 파일 내용은 client log에 기록하지 않습니다.</p>
      </div>
      {state.message ? (
        <div className={state.status === "success" ? "rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800" : "rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"}>
          {state.message}
        </div>
      ) : null}
    </form>
  );
}
