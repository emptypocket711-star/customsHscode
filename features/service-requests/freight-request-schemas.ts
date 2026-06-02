import { z } from "zod";

const optionalText = z.string().trim().max(200).optional();
const optionalLongText = z.string().trim().max(1000).optional();
const optionalPositiveNumber = z.coerce.number().positive().optional();
const optionalDate = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/).optional();
const optionalCountryCode = z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/, "국가 코드는 ISO 2자리 코드로 입력해 주세요.").optional();
const optionalTransportMode = z.enum(["sea", "air", "express", "truck", "rail"]).optional();

export const freightRequestDraftSchema = z.object({
  cbm: optionalPositiveNumber,
  containerType: optionalText,
  destinationCountryCode: optionalCountryCode,
  destinationPlace: optionalText,
  destinationPort: optionalText,
  direction: z.enum(["import", "export"]),
  grossWeight: optionalPositiveNumber,
  hazardous: z.boolean().default(false),
  incoterms: optionalText,
  loadType: optionalText,
  originCountryCode: optionalCountryCode,
  originPlace: optionalText,
  originPort: optionalText,
  packageCount: optionalPositiveNumber,
  packageUnit: optionalText,
  preferredArrivalDate: optionalDate,
  preferredStartDate: optionalDate,
  productSummary: optionalLongText,
  temperatureControlled: z.boolean().default(false),
  title: z.string().trim().min(2, "요청 제목을 입력해 주세요.").max(120),
  transportMode: optionalTransportMode,
  usedCar: z.boolean().default(false),
  vehicleVin: optionalText,
  weightUnit: optionalText
});

export type FreightRequestDraftInput = z.infer<typeof freightRequestDraftSchema>;

export type FreightRequestDraftActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  requestId?: string;
};

export const freightRequestPublishSchema = z.object({
  deadlineHours: z.coerce.number().int().refine((value) => [24, 48].includes(value), {
    message: "견적 모집 시간은 24시간 또는 48시간 중에서 선택해 주세요."
  }),
  requestId: z.uuid("운송 견적 요청 ID를 확인해 주세요.")
});

export type FreightRequestPublishInput = z.infer<typeof freightRequestPublishSchema>;

export type FreightRequestPublishActionState = {
  status: "idle" | "success" | "error";
  matchedCount?: number;
  message?: string;
  requestId?: string;
};
