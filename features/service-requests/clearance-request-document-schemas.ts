import { z } from "zod";
import { uploadedDocumentTypeSchema } from "@/features/documents/schemas";
import { serviceRequestDocumentVisibilitySchema } from "@/features/service-requests/freight-request-document-schemas";

export const clearanceRequestDocumentUploadSchema = z.object({
  documentType: uploadedDocumentTypeSchema,
  requestId: z.uuid("통관 의뢰 요청 ID를 확인해 주세요."),
  visibility: serviceRequestDocumentVisibilitySchema
});

export type ClearanceRequestDocumentUploadInput = z.infer<typeof clearanceRequestDocumentUploadSchema>;

export type ClearanceRequestDocumentUploadActionState = {
  documentId?: string;
  message?: string;
  requestId?: string;
  status: "idle" | "success" | "error";
};
