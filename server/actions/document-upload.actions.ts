"use server";

import { revalidatePath } from "next/cache";
import {
  documentUploadSchema,
  type DocumentUploadActionState
} from "@/features/documents/schemas";
import { createSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase/server";
import {
  createDocumentExtractionJobPayload,
  enqueueBackgroundJob,
  isBackgroundQueueEnabled
} from "@/server/repositories/background-job.repository";
import { createDocumentUploadCase } from "@/server/repositories/document-upload.repository";
import { persistDocumentExtraction } from "@/server/repositories/document-extraction.repository";
import { extractUploadFileText } from "@/server/rules/document-file-text.service";
import { extractShipmentDocument } from "@/server/rules/document-extraction.service";

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : undefined;
}

function fileValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return value instanceof File && value.size > 0 ? value : null;
}

export async function uploadCaseDocumentAction(
  _previousState: DocumentUploadActionState,
  formData: FormData
): Promise<DocumentUploadActionState> {
  const parsed = documentUploadSchema.safeParse({
    direction: stringValue(formData, "direction"),
    documentType: stringValue(formData, "documentType"),
    basisDate: stringValue(formData, "basisDate"),
    note: stringValue(formData, "note")
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "문서 업로드 입력값을 확인해 주세요."
    };
  }

  const file = fileValue(formData, "file");
  if (!file) {
    return {
      status: "error",
      message: "업로드할 문서 파일을 선택해 주세요."
    };
  }

  if (!hasSupabaseEnv()) {
    return {
      status: "error",
      message: "Supabase 환경 변수가 없어 실제 문서 업로드를 수행하지 않았습니다. mock 화면만 표시합니다."
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const result = await createDocumentUploadCase(supabase, parsed.data, file);
    if (isBackgroundQueueEnabled()) {
      const job = await enqueueBackgroundJob(supabase, {
        companyId: result.companyId,
        createdBy: result.createdBy,
        jobType: "document_extraction",
        priority: 50,
        payload: createDocumentExtractionJobPayload({
          documentId: result.documentId,
          requestId: result.requestId,
          storageBucket: result.storageBucket,
          storagePath: result.storagePath,
          mimeType: result.mimeType,
          fileName: result.fileName
        })
      });

      revalidatePath("/documents/upload");
      revalidatePath("/dashboard");

      return {
        status: "success",
        message: `문서가 private bucket에 저장되었습니다. 추출 작업을 백그라운드 큐에 등록했습니다. job ${job.jobId}`,
        requestId: result.requestId,
        documentId: result.documentId,
        extractionMode: "queued"
      };
    }

    const extractedText = await extractUploadFileText(file);
    let extractionMode: DocumentUploadActionState["extractionMode"] = file.name.toLowerCase().endsWith(".xls")
      ? "unsupported_legacy_xls"
      : "manual_text";
    let extractionMessage = extractionMode === "unsupported_legacy_xls"
      ? "구형 XLS는 업로드만 저장되었습니다. XLSX 또는 CSV로 저장 후 다시 올리면 자동 추출할 수 있습니다."
      : "추출 텍스트를 붙여넣어 라인아이템 후보를 저장할 수 있습니다.";

    if (extractedText) {
      const extraction = extractShipmentDocument(extractedText);
      const persisted = await persistDocumentExtraction(supabase, {
        documentId: result.documentId,
        requestId: result.requestId,
        companyId: result.companyId,
        extraction
      });
      extractionMode = "auto_extracted";
      extractionMessage = `엑셀/CSV에서 라인아이템 후보 ${persisted.lineItemCount}건을 자동 저장했습니다.`;
    }

    revalidatePath("/documents/upload");
    revalidatePath("/dashboard");

    return {
      status: "success",
      message: `문서가 private bucket에 저장되었습니다. ${extractionMessage}`,
      requestId: result.requestId,
      documentId: result.documentId,
      extractionMode
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "문서 업로드 중 오류가 발생했습니다."
    };
  }
}
