import { z } from "zod";

const optionalPositiveNumber = z.coerce.number().positive().optional();
const optionalPositiveInteger = z.coerce.number().int().positive().optional();
const optionalText = z.string().trim().max(1000).optional();

export const clearanceRequestPublishSchema = z.object({
  deadlineHours: z.coerce.number().int().min(1).max(48),
  requestId: z.uuid("통관 의뢰 요청 ID를 확인해 주세요.")
});

export type ClearanceRequestPublishInput = z.infer<typeof clearanceRequestPublishSchema>;

export type ClearanceRequestPublishActionState = {
  matchedCount?: number;
  message?: string;
  requestId?: string;
  status: "idle" | "success" | "error";
};

export const clearanceBidSubmitSchema = z.object({
  additionalDocumentsRequired: optionalText,
  brokerageFeeAmount: optionalPositiveNumber,
  currency: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/, "통화 코드는 USD, KRW처럼 3자리로 입력해 주세요."),
  expectedClearanceDays: optionalPositiveInteger,
  leadTimeDays: optionalPositiveInteger,
  message: optionalText,
  requestId: z.uuid("통관 의뢰 요청 ID를 확인해 주세요."),
  reviewAvailable: z.boolean().default(true),
  riskNote: optionalText,
  totalAmount: z.coerce.number().positive("견적 총액을 입력해 주세요."),
  validUntil: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
});

export type ClearanceBidSubmitInput = z.infer<typeof clearanceBidSubmitSchema>;

export type ClearanceBidSubmitActionState = {
  bidId?: string;
  message?: string;
  requestId?: string;
  status: "idle" | "success" | "error";
};

export const clearanceBidSelectSchema = z.object({
  bidId: z.uuid("선택할 통관 견적 ID를 확인해 주세요.")
});

export type ClearanceBidSelectInput = z.infer<typeof clearanceBidSelectSchema>;

export type ClearanceBidSelectActionState = {
  bidId?: string;
  message?: string;
  requestId?: string;
  status: "idle" | "success" | "error";
};
