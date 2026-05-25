import { z } from "zod";

export const operationsRefreshSchema = z.object({
  basisDate: z.iso.date("기준일을 확인해 주세요.")
});

export type OperationsRefreshActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};
