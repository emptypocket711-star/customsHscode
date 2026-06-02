import { z } from "zod";

const optionalPositiveNumber = z.coerce.number().positive().optional();
const optionalPositiveInteger = z.coerce.number().int().positive().optional();

export const freightBidSubmitSchema = z.object({
  carrierNote: z.string().trim().max(1000).optional(),
  currency: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/, "통화 코드는 USD, KRW처럼 3자리로 입력해 주세요."),
  freeTimeNote: z.string().trim().max(1000).optional(),
  freightRateAmount: optionalPositiveNumber,
  leadTimeDays: optionalPositiveInteger,
  localChargeAmount: optionalPositiveNumber,
  message: z.string().trim().max(1000).optional(),
  requestId: z.uuid("운송 견적 요청 ID를 확인해 주세요."),
  surchargeAmount: optionalPositiveNumber,
  totalAmount: z.coerce.number().positive("견적 총액을 입력해 주세요."),
  transitTimeDays: optionalPositiveInteger,
  validUntil: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
});

export type FreightBidSubmitInput = z.infer<typeof freightBidSubmitSchema>;

export type FreightBidSubmitActionState = {
  bidId?: string;
  message?: string;
  requestId?: string;
  status: "idle" | "success" | "error";
};

export const freightBidSelectSchema = z.object({
  bidId: z.uuid("선택할 견적 ID를 확인해 주세요.")
});

export type FreightBidSelectInput = z.infer<typeof freightBidSelectSchema>;

export type FreightBidSelectActionState = {
  bidId?: string;
  message?: string;
  requestId?: string;
  status: "idle" | "success" | "error";
};
