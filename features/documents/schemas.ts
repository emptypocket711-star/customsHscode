import { z } from "zod";
import { directionSchema } from "@/features/hs/schemas";

export const uploadedDocumentTypeSchema = z.enum([
  "commercial_invoice",
  "packing_list",
  "bill_of_lading",
  "air_waybill",
  "certificate_of_origin",
  "catalog",
  "spec_sheet"
]);

export const documentUploadSchema = z.object({
  direction: directionSchema,
  documentType: uploadedDocumentTypeSchema,
  basisDate: z.string().trim().date("기준일을 확인해 주세요."),
  note: z.string().trim().max(1000).optional()
});

export type DocumentUploadInput = z.infer<typeof documentUploadSchema>;

export const documentExtractionPersistSchema = z.object({
  documentId: z.uuid("문서 ID를 확인해 주세요."),
  requestId: z.uuid("요청 ID를 확인해 주세요."),
  rawText: z.string().trim().min(3, "추출할 문서 텍스트가 부족합니다.").max(120_000, "문서 텍스트가 너무 큽니다.")
});

export type DocumentExtractionPersistInput = z.infer<typeof documentExtractionPersistSchema>;

export type DocumentExtractionActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

export type DocumentUploadActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  requestId?: string;
  documentId?: string;
  extractionMode?: "auto_extracted" | "queued" | "manual_text" | "unsupported_legacy_xls";
};
