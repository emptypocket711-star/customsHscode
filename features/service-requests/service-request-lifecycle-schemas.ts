import { z } from "zod";

export const serviceRequestStartSchema = z.object({
  requestId: z.uuid("요청 ID를 확인해 주세요.")
});

export type ServiceRequestStartInput = z.infer<typeof serviceRequestStartSchema>;

export type ServiceRequestLifecycleActionState = {
  message?: string;
  requestId?: string;
  status: "idle" | "success" | "error";
};

export const serviceRequestCompleteSchema = z.object({
  completionNote: z.string().trim().max(500).optional(),
  requestId: z.uuid("요청 ID를 확인해 주세요.")
});

export type ServiceRequestCompleteInput = z.infer<typeof serviceRequestCompleteSchema>;
