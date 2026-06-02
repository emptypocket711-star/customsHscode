import { z } from "zod";

const jsonObjectSchema = z.record(z.string(), z.unknown());

const optionalJsonArraySchema = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return JSON.parse(trimmed);
}, z.array(z.unknown()).optional());

const optionalJsonObjectSchema = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return JSON.parse(trimmed);
}, jsonObjectSchema.optional());

export const serviceRequestCompletionReportSchema = z.object({
  clearanceResult: optionalJsonObjectSchema,
  currency: z.string().trim().regex(/^[A-Z]{3}$/, "통화는 ISO 3자리 코드로 입력해 주세요.").optional(),
  finalAmount: z.coerce.number().min(0, "최종 금액은 0 이상이어야 합니다.").optional(),
  freightResult: optionalJsonObjectSchema,
  requestId: z.uuid("요청 ID를 확인해 주세요."),
  requestType: z.enum(["clearance", "freight"]).optional(),
  settlementItems: optionalJsonArraySchema,
  sourceSnapshot: optionalJsonObjectSchema,
  summary: z.string().trim().max(1000, "완료 요약은 1000자 이하로 입력해 주세요.").optional(),
  timelineEvents: optionalJsonArraySchema
});

export type ServiceRequestCompletionReportInput = z.infer<typeof serviceRequestCompletionReportSchema>;

export type ServiceRequestCompletionReportActionState = {
  message?: string;
  reportId?: string;
  requestId?: string;
  status: "idle" | "success" | "error";
};

export const serviceRequestCompletionReportDocumentSchema = z.object({
  documentRole: z.string().trim().min(1, "최종 보관 서류 역할을 입력해 주세요.").max(80, "서류 역할은 80자 이하로 입력해 주세요."),
  reportId: z.uuid("완료 리포트 ID를 확인해 주세요."),
  requestDocumentId: z.uuid("요청 서류 ID를 확인해 주세요."),
  requestId: z.uuid("요청 ID를 확인해 주세요.").optional(),
  requestType: z.enum(["clearance", "freight"]).optional(),
  requiredForArchive: z.coerce.boolean().optional()
});

export type ServiceRequestCompletionReportDocumentInput = z.infer<typeof serviceRequestCompletionReportDocumentSchema>;

export type ServiceRequestCompletionReportDocumentActionState = {
  mappingId?: string;
  message?: string;
  reportId?: string;
  requestId?: string;
  status: "idle" | "success" | "error";
};

export const serviceRequestCompletionReportTransitionSchema = z.object({
  acknowledgeRole: z.enum(["partner", "requester"]).optional(),
  reportId: z.uuid("완료 리포트 ID를 확인해 주세요."),
  requestId: z.uuid("요청 ID를 확인해 주세요.").optional(),
  requestType: z.enum(["clearance", "freight"]).optional(),
  transition: z.enum(["acknowledge", "lock", "review", "submit"])
});

export type ServiceRequestCompletionReportTransitionInput = z.infer<typeof serviceRequestCompletionReportTransitionSchema>;

export type ServiceRequestCompletionReportTransitionActionState = {
  message?: string;
  reportId?: string;
  requestId?: string;
  status: "idle" | "success" | "error";
  transition?: ServiceRequestCompletionReportTransitionInput["transition"];
};
