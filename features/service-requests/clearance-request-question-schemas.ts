import { z } from "zod";

export const clearanceRequestQuestionAskSchema = z.object({
  question: z.string().trim().min(3, "질문은 3자 이상 입력해 주세요.").max(1000, "질문은 1000자 이하로 입력해 주세요."),
  requestId: z.uuid("통관 의뢰 요청 ID를 확인해 주세요.")
});

export const clearanceRequestQuestionAnswerSchema = z.object({
  answer: z.string().trim().min(2, "답변은 2자 이상 입력해 주세요.").max(1000, "답변은 1000자 이하로 입력해 주세요."),
  questionId: z.uuid("질문 ID를 확인해 주세요.")
});

export type ClearanceRequestQuestionAskInput = z.infer<typeof clearanceRequestQuestionAskSchema>;
export type ClearanceRequestQuestionAnswerInput = z.infer<typeof clearanceRequestQuestionAnswerSchema>;

export type ClearanceRequestQuestionActionState = {
  message?: string;
  questionId?: string;
  requestId?: string;
  status: "idle" | "success" | "error";
};
