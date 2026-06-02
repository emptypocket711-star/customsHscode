import { z } from "zod";

const optionalText = z.string().trim().max(200).optional();
const optionalLongText = z.string().trim().max(1000).optional();
const optionalCountryCode = z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/, "국가 코드는 ISO 2자리로 입력해 주세요.").optional();
const optionalDate = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/).optional();
const optionalPositiveInteger = z.coerce.number().int().positive().optional();

export const clearanceRequestDraftSchema = z.object({
  destinationCountryCode: optionalCountryCode,
  direction: z.enum(["import", "export"]),
  estimatedDeclarationCount: optionalPositiveInteger,
  exportCountryCode: optionalCountryCode,
  ftaPreferenceRequested: z.boolean().default(false),
  hs6: z.string().trim().regex(/^[0-9]{6}$/, "HS6는 숫자 6자리로 입력해 주세요.").optional(),
  hsCodeKnown: z.boolean().default(false),
  hskCode: z.string().trim().regex(/^[0-9]{10}$/, "HSK는 숫자 10자리로 입력해 주세요.").optional(),
  incoterms: optionalText,
  modelName: optionalText,
  originCountryCode: optionalCountryCode,
  preferredArrivalDate: optionalDate,
  preferredStartDate: optionalDate,
  productMaterial: optionalText,
  productSummary: optionalLongText,
  productUsage: optionalText,
  requirementsCheckNeeded: z.boolean().default(false),
  shipmentCountryCode: optionalCountryCode,
  title: z.string().trim().min(2, "요청 제목을 입력해 주세요.").max(120),
  urgent: z.boolean().default(false)
});

export type ClearanceRequestDraftInput = z.infer<typeof clearanceRequestDraftSchema>;

export type ClearanceRequestDraftActionState = {
  message?: string;
  requestId?: string;
  status: "idle" | "success" | "error";
};
