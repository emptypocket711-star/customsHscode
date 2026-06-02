import { z } from "zod";

const scoreSchema = z.coerce.number().int().min(1).max(5).optional();

export const serviceRequestFeedbackSchema = z.object({
  comment: z.string().trim().max(500).optional(),
  communicationScore: scoreSchema,
  documentQualityScore: scoreSchema,
  rating: z.coerce.number().int().min(1, "평점은 1점부터 입력해 주세요.").max(5, "평점은 5점까지 입력할 수 있습니다."),
  requestId: z.uuid("요청 ID를 확인해 주세요."),
  responseSpeedScore: scoreSchema
});

export type ServiceRequestFeedbackInput = z.infer<typeof serviceRequestFeedbackSchema>;

export type ServiceRequestFeedbackActionState = {
  feedbackId?: string;
  message?: string;
  requestId?: string;
  status: "idle" | "success" | "error";
};
