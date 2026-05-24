import { z } from "zod";

export const reviewTargetSchema = z.enum(["hs_candidate", "hs_confirmation_request", "report", "legal_change"]);
export const reviewDecisionSchema = z.enum(["approve", "reject"]);

export const staffReviewDecisionSchema = z.object({
  targetType: reviewTargetSchema,
  targetId: z.string().uuid("검토 대상 ID가 올바르지 않습니다."),
  decision: reviewDecisionSchema,
  note: z.string().trim().max(1000).optional()
});

export type StaffReviewDecisionInput = z.infer<typeof staffReviewDecisionSchema>;

export const documentLineHsRequestSchema = z.object({
  lineItemId: z.string().uuid("문서 라인아이템 ID가 올바르지 않습니다."),
  direction: z.enum(["import", "export"], {
    error: "수입 또는 수출 구분을 선택해 주세요."
  }),
  basisDate: z.string().trim().date("기준일을 확인해 주세요."),
  note: z.string().trim().max(1000).optional()
});

export type DocumentLineHsRequestInput = z.infer<typeof documentLineHsRequestSchema>;

const optionalNumberSchema = z.preprocess(
  (value) => {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed ? Number(trimmed) : undefined;
  },
  z.number().finite("숫자 값을 확인해 주세요.").nonnegative("음수 값은 입력할 수 없습니다.").optional()
);

export const documentLineCorrectionSchema = z.object({
  lineItemId: z.string().uuid("문서 라인아이템 ID가 올바르지 않습니다."),
  productName: z.string().trim().min(1, "품명을 입력해 주세요.").max(200),
  modelName: z.string().trim().max(120).optional(),
  originCountry: z.string().trim().max(2).optional(),
  shipmentCountry: z.string().trim().max(2).optional(),
  destinationCountry: z.string().trim().max(2).optional(),
  incoterms: z.string().trim().max(80).optional(),
  quantity: optionalNumberSchema,
  unit: z.string().trim().max(20).optional(),
  unitPrice: optionalNumberSchema,
  totalAmount: optionalNumberSchema,
  currency: z.string().trim().max(3).optional(),
  requiredCorrectionsText: z.string().trim().max(1000).optional(),
  note: z.string().trim().max(1000).optional()
});

export type DocumentLineCorrectionInput = z.infer<typeof documentLineCorrectionSchema>;

export type StaffReviewActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};
