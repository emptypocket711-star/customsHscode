import { z } from "zod";

export const marketplacePartyTypeRequestSchema = z.enum([
  "customs_broker",
  "domestic_shipper",
  "foreign_shipper",
  "forwarder",
  "support_partner"
]);

export const companyRoleRequestSchema = z.object({
  reason: z.string().trim().max(1000).optional(),
  requestedPartyTypes: z.array(marketplacePartyTypeRequestSchema).min(1, "신청할 역할을 하나 이상 선택해 주세요.")
});

export const companyRoleRequestReviewSchema = z.object({
  decision: z.enum(["approved", "rejected"]),
  requestId: z.string().uuid("검토할 역할 신청 ID를 확인해 주세요."),
  reviewNote: z.string().trim().max(1000).optional()
});

export type CompanyRoleRequestInput = z.infer<typeof companyRoleRequestSchema>;
export type CompanyRoleRequestReviewInput = z.infer<typeof companyRoleRequestReviewSchema>;
export type MarketplacePartyTypeRequest = z.infer<typeof marketplacePartyTypeRequestSchema>;

export type CompanyRoleRequestActionState = {
  message?: string;
  status: "idle" | "success" | "error";
};

export type CompanyRoleRequestReviewActionState = CompanyRoleRequestActionState & {
  requestId?: string;
};
