import type { SupabaseClient } from "@supabase/supabase-js";
import type { BackgroundJobHandlerResult } from "@/server/jobs/background-worker.service";
import type { BackgroundJobRecord } from "@/server/repositories/background-job.repository";
import { persistDocumentExtraction } from "@/server/repositories/document-extraction.repository";
import { extractShipmentDocument } from "@/server/rules/document-extraction.service";
import { extractUploadFileText } from "@/server/rules/document-file-text.service";

type UploadedDocumentPayload = {
  kind: "uploaded_document";
  documentId: string;
  requestId: string;
  storageBucket: string;
  storagePath: string;
  mimeType: string | null;
  fileName: string;
};

function isUploadedDocumentPayload(payload: Record<string, unknown>): payload is UploadedDocumentPayload {
  return payload.kind === "uploaded_document"
    && typeof payload.documentId === "string"
    && typeof payload.requestId === "string"
    && typeof payload.storageBucket === "string"
    && typeof payload.storagePath === "string"
    && typeof payload.fileName === "string";
}

async function markDocumentNeedsCorrection(
  supabase: SupabaseClient,
  input: {
    documentId: string;
    requestId: string;
  }
) {
  const { error } = await supabase
    .from("case_documents")
    .update({
      status: "needs_correction",
      updated_at: new Date().toISOString()
    })
    .eq("id", input.documentId)
    .eq("request_id", input.requestId);

  if (error) throw new Error(error.message);
}

export function createDocumentExtractionJobHandler(supabase: SupabaseClient) {
  return async function handleDocumentExtractionJob(job: BackgroundJobRecord): Promise<BackgroundJobHandlerResult> {
    if (!isUploadedDocumentPayload(job.payload)) {
      throw new Error("Invalid document extraction job payload");
    }

    if (!job.company_id) {
      throw new Error("Document extraction job must have company_id");
    }

    const payload = job.payload;
    const { data, error } = await supabase.storage
      .from(payload.storageBucket)
      .download(payload.storagePath);

    if (error || !data) {
      throw new Error(error?.message ?? "문서 파일을 스토리지에서 읽지 못했습니다.");
    }

    const buffer = Buffer.from(await data.arrayBuffer());
    const file = new File([buffer], payload.fileName, {
      type: payload.mimeType ?? "application/octet-stream"
    });
    const extractedText = await extractUploadFileText(file);

    if (!extractedText) {
      await markDocumentNeedsCorrection(supabase, {
        documentId: payload.documentId,
        requestId: payload.requestId
      });

      return {
        result: {
          extractionMode: payload.fileName.toLowerCase().endsWith(".xls")
            ? "unsupported_legacy_xls"
            : "manual_text_required",
          lineItemCount: 0
        }
      };
    }

    const extraction = extractShipmentDocument(extractedText);
    const hasUsefulExtraction = extraction.lineItems.length > 0 || extraction.evidence.length > 0;

    if (!hasUsefulExtraction) {
      await markDocumentNeedsCorrection(supabase, {
        documentId: payload.documentId,
        requestId: payload.requestId
      });

      return {
        result: {
          extractionMode: "needs_manual_text_review",
          lineItemCount: 0
        }
      };
    }

    const persisted = await persistDocumentExtraction(supabase, {
      documentId: payload.documentId,
      requestId: payload.requestId,
      companyId: job.company_id,
      extraction
    });

    return {
      result: {
        extractionMode: "auto_extracted",
        status: persisted.status,
        lineItemCount: persisted.lineItemCount
      }
    };
  };
}
