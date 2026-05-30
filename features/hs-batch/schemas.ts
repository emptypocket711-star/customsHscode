import { z } from "zod";

export const hsBatchInputRowSchema = z.object({
  rowNumber: z.number().int().positive(),
  hskCode: z.string().trim().min(1),
  productName: z.string().trim().optional(),
  memo: z.string().trim().optional()
});

export const hsBatchLookupSchema = z.object({
  basisDate: z.iso.date("조회기준일을 확인해 주세요."),
  destinationCountry: z.string().trim().min(1).default("ALL"),
  rowsJson: z.string().trim().min(1, "조회할 행을 먼저 입력하거나 파일에서 읽어 주세요.")
});

export type HsBatchInputRow = z.infer<typeof hsBatchInputRowSchema>;

export type HsBatchLookupStatus = "success" | "warning" | "error";

export type HsBatchResultRow = {
  rowNumber: number;
  inputHskCode: string;
  normalizedHskCode: string;
  productName: string;
  basisDate?: string;
  matchedHskCode: string;
  matchedName: string;
  countryCode: string;
  basicTariff: string;
  ftaTariff: string;
  lowestTariff: string;
  internalTax: string;
  importRequirements: string;
  originMarking: string;
  status: HsBatchLookupStatus;
  message: string;
  candidateOptions?: Array<{
    hskCode: string;
    hs6: string;
    koreanName: string;
  }>;
  missingQuestions?: string[];
};

export type HsBatchLookupActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  results?: HsBatchResultRow[];
  summary?: {
    total: number;
    success: number;
    warning: number;
    error: number;
  };
};
