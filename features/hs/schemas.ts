import { z } from "zod";
import { getSeoulDateString } from "@/lib/utils";

export const directionSchema = z.enum(["import", "export"], {
  error: "수입 또는 수출 구분을 선택해 주세요."
});

export const searchTypeSchema = z.enum(["hs_code", "product_name", "document"], {
  error: "조회 방식을 선택해 주세요."
});

export const hsSearchRequestSchema = z
  .object({
    direction: directionSchema,
    searchType: searchTypeSchema,
    inputHsCode: z.string().trim().max(20).optional(),
    inputProductName: z.string().trim().max(120).optional(),
    productUsage: z.string().trim().max(300).optional(),
    material: z.string().trim().max(200).optional(),
    composition: z.string().trim().max(200).optional(),
    functions: z.string().trim().max(300).optional(),
    modelName: z.string().trim().max(120).optional(),
    originCountry: z.string().trim().max(80).optional(),
    exportCountry: z.string().trim().max(80).optional(),
    shipmentCountry: z.string().trim().max(80).optional(),
    manufacturingCountry: z.string().trim().max(80).optional(),
    sellerCountry: z.string().trim().max(80).optional(),
    destinationCountry: z.string().trim().max(80).optional(),
    basisDate: z.string().trim().date().default(getSeoulDateString())
  })
  .superRefine((data, ctx) => {
    if (data.searchType === "hs_code" && !data.inputHsCode) {
      ctx.addIssue({
        code: "custom",
        path: ["inputHsCode"],
        message: "HS 또는 HSK 코드를 입력해 주세요."
      });
    }

    if (data.searchType === "product_name" && !data.inputProductName) {
      ctx.addIssue({
        code: "custom",
        path: ["inputProductName"],
        message: "품명을 입력해 주세요."
      });
    }
  });

export type HsSearchRequestInput = z.infer<typeof hsSearchRequestSchema>;

export type HsSearchActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  requestId?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export const hsDirectLookupSchema = z.object({
  hskCode: z.string().trim().min(2, "HS 또는 HSK 코드를 입력해 주세요.").max(20),
  basisDate: z.string().trim().date()
});

export type HsDirectLookupInput = z.infer<typeof hsDirectLookupSchema>;

export const hsConfirmationRequestSchema = z.object({
  hskCode: z.string().trim().min(4, "HS CODE를 입력해 주세요.").max(10),
  basisDate: z.string().trim().date("기준일을 확인해 주세요."),
  productName: z.string().trim().max(200).optional(),
  userNote: z.string().trim().max(1000).optional(),
  supplementSnapshot: z.string().trim().max(8000).optional()
});

export type HsConfirmationRequestInput = z.infer<typeof hsConfirmationRequestSchema>;

export type HsConfirmationRequestActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  requestId?: string;
};

export const productHsRecommendationSchema = z.object({
  productName: z.string().trim().min(1, "품명을 입력해 주세요.").max(120),
  productUsage: z.string().trim().max(300).optional(),
  material: z.string().trim().max(200).optional(),
  composition: z.string().trim().max(200).optional(),
  functions: z.string().trim().max(300).optional(),
  modelName: z.string().trim().max(120).optional(),
  basisDate: z.string().trim().date()
});

export type ProductHsRecommendationInput = z.infer<typeof productHsRecommendationSchema>;
