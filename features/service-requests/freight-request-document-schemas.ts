import { z } from "zod";
import { uploadedDocumentTypeSchema } from "@/features/documents/schemas";

export const serviceRequestDocumentVisibilitySchema = z.enum([
  "requester_only",
  "matched_partner_after_interest",
  "selected_partner",
  "operator_only"
]);

export const freightRequestDocumentUploadSchema = z.object({
  documentType: uploadedDocumentTypeSchema,
  requestId: z.uuid("운송 견적 요청 ID를 확인해 주세요."),
  visibility: serviceRequestDocumentVisibilitySchema
});

export type FreightRequestDocumentUploadInput = z.infer<typeof freightRequestDocumentUploadSchema>;

export type FreightRequestDocumentUploadActionState = {
  documentId?: string;
  message?: string;
  requestId?: string;
  status: "idle" | "success" | "error";
};
