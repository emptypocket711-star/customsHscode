import { z } from "zod";

export const companyVerificationDocumentTypeSchema = z.enum([
  "business_registration",
  "company_registration",
  "customs_broker_license",
  "forwarder_license",
  "identity_or_contact_proof",
  "other"
]);

export const companyVerificationUploadSchema = z.object({
  documentType: companyVerificationDocumentTypeSchema,
  note: z.string().trim().max(1000).optional()
});

export const companyVerificationReviewSchema = z.object({
  decision: z.enum(["approved", "rejected"]),
  documentId: z.uuid("증빙 문서 ID를 확인해 주세요."),
  reviewNote: z.string().trim().max(1000).optional()
});

export const companyOperationsStatusSchema = z.object({
  companyId: z.uuid("회사 ID를 확인해 주세요."),
  note: z.string().trim().max(1000).optional(),
  status: z.enum(["operator_approved", "recommended_partner", "suspended", "blocked", "unverified"])
});

export type CompanyVerificationDocumentType = z.infer<typeof companyVerificationDocumentTypeSchema>;
export type CompanyOperationsStatusInput = z.infer<typeof companyOperationsStatusSchema>;
export type CompanyVerificationUploadInput = z.infer<typeof companyVerificationUploadSchema>;
export type CompanyVerificationReviewInput = z.infer<typeof companyVerificationReviewSchema>;

export type CompanyVerificationUploadActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  documentId?: string;
};

export type CompanyVerificationReviewActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export type CompanyOperationsStatusActionState = {
  companyId?: string;
  message?: string;
  status: "idle" | "success" | "error";
};
