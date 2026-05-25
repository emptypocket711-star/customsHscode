import { z } from "zod";

export const publishTargetTableSchema = z.enum([
  "hs_master",
  "standard_product_names",
  "tariff_rates",
  "export_destination_tariff_rates",
  "customs_confirmation_requirements",
  "integrated_public_notice_requirements",
  "customs_statistical_codes",
  "internal_tax_law_rules",
  "export_destination_import_requirements",
  "export_destination_internal_taxes",
  "export_destination_customs_codes",
  "export_destination_additional_tariffs",
  "export_destination_trade_remedy_cases",
  "export_destination_data_sources",
  "origin_marking_targets",
  "origin_marking_methods"
]);

export const publishSourceVersionSchema = z.object({
  targetTable: publishTargetTableSchema,
  sourceVersion: z.string().trim().min(3, "source_version을 입력해 주세요.").max(300),
  matchPrefix: z.enum(["on", ""]).optional(),
  note: z.string().trim().max(1000).optional()
});

export type PublishSourceVersionInput = z.infer<typeof publishSourceVersionSchema>;

export type PublishSourceVersionActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};
