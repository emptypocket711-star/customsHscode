import { z } from "zod";

export const partnerServiceTypeSchema = z.enum(["freight", "clearance"]);
export const requestDirectionSchema = z.enum(["import", "export"]);

const textArraySchema = z.array(z.string().trim().min(1).max(80)).max(30);
const countryCodeArraySchema = z.array(
  z.string()
    .trim()
    .transform((value) => value.toUpperCase())
    .refine((value) => /^[A-Z]{2}$/.test(value), "국가 코드는 ISO 2자리 코드로 입력해 주세요.")
).max(30);
const portArraySchema = z.array(
  z.string()
    .trim()
    .min(1)
    .max(80)
    .transform((value) => value.toUpperCase())
).max(30);
const cargoTagArraySchema = z.array(
  z.string()
    .trim()
    .min(1)
    .max(80)
    .transform((value) => value.toLowerCase())
).max(30);

export const partnerPreferenceSchema = z.object({
  cargoTags: cargoTagArraySchema.default([]),
  destinationCountryCodes: countryCodeArraySchema.default([]),
  digestEnabled: z.boolean().default(false),
  directions: z.array(requestDirectionSchema).min(1, "수입 또는 수출 방향을 1개 이상 선택해 주세요.").max(2),
  notificationEnabled: z.boolean().default(true),
  originCountryCodes: countryCodeArraySchema.default([]),
  ports: portArraySchema.default([]),
  serviceType: partnerServiceTypeSchema,
  transportModes: textArraySchema.default([]),
  urgentAvailable: z.boolean().default(false)
});

export type PartnerServiceType = z.infer<typeof partnerServiceTypeSchema>;
export type PartnerPreferenceInput = z.infer<typeof partnerPreferenceSchema>;

export type PartnerPreferenceActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  serviceType?: PartnerServiceType;
};
