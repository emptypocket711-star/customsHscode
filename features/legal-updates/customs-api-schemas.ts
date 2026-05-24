import { z } from "zod";

export const customsApiSourceSchema = z.enum([
  "customs_confirmation",
  "hs_code",
  "hs_code_navigation",
  "tariff_rate",
  "statistical_code",
  "exchange_rate",
  "cargo_progress"
]);

export const customsApiProbeSchema = z.object({
  source: customsApiSourceSchema,
  hskCode: z.string().trim().max(20).optional(),
  productName: z.string().trim().max(1000).optional(),
  statisticalCodeType: z.string().trim().max(10).optional(),
  direction: z.enum(["import", "export"]).optional(),
  applyStartDate: z.string().trim().date().optional(),
  cargoManagementNo: z.string().trim().max(80).optional(),
  masterBlNo: z.string().trim().max(80).optional(),
  houseBlNo: z.string().trim().max(80).optional()
});

export type CustomsApiProbeInput = z.infer<typeof customsApiProbeSchema>;

export type CustomsApiProbeActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  snapshot?: {
    sourceName: string;
    sourceUrl: string;
    sourceVersion: string;
    retrievedAt: string;
    checksum: string;
    contentType: string | null;
    preview: string;
  };
};
