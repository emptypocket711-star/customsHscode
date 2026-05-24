"use server";

import { revalidatePath } from "next/cache";
import {
  documentExtractionPersistSchema,
  type DocumentExtractionActionState
} from "@/features/documents/schemas";
import { createSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase/server";
import { persistDocumentExtraction } from "@/server/repositories/document-extraction.repository";
import { extractShipmentDocument } from "@/server/rules/document-extraction.service";

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : undefined;
}

export async function persistDocumentExtractionAction(
  _previousState: DocumentExtractionActionState,
  formData: FormData
): Promise<DocumentExtractionActionState> {
  const parsed = documentExtractionPersistSchema.safeParse({
    documentId: stringValue(formData, "documentId"),
    requestId: stringValue(formData, "requestId"),
    rawText: stringValue(formData, "rawText")
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "문서 추출 입력값을 확인해 주세요."
    };
  }

  if (!hasSupabaseEnv()) {
    return {
      status: "error",
      message: "Supabase 환경 변수가 없어 문서 추출 결과를 저장하지 않았습니다. mock 화면에서는 adapter preview만 표시합니다."
    };
  }

  try {
    const extraction = extractShipmentDocument(parsed.data.rawText);
    const hasUsefulExtraction = extraction.lineItems.length > 0 || extraction.evidence.length > 0;

    if (!hasUsefulExtraction) {
      return {
        status: "error",
        message: "붙여넣은 텍스트에서 품명, 수량, 금액, 국가 등 추출 가능한 항목을 찾지 못했습니다. 엑셀은 표 영역을 복사해 붙여넣거나 CSV로 저장한 내용을 붙여넣어 주세요."
      };
    }

    const supabase = await createSupabaseServerClient();
    const { data: document, error: documentError } = await supabase
      .from("case_documents")
      .select("company_id")
      .eq("id", parsed.data.documentId)
      .eq("request_id", parsed.data.requestId)
      .single();

    if (documentError || !document?.company_id) {
      throw new Error(documentError?.message ?? "문서 접근 권한 또는 회사 정보를 확인할 수 없습니다.");
    }

    const result = await persistDocumentExtraction(supabase, {
      documentId: parsed.data.documentId,
      requestId: parsed.data.requestId,
      companyId: document.company_id as string,
      extraction
    });

    revalidatePath("/documents/upload");

    return {
      status: "success",
      message: `문서 추출 후보 ${result.lineItemCount}건을 저장했습니다. 상태: ${result.status}`
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "문서 추출 결과 저장 중 오류가 발생했습니다."
    };
  }
}
