import { z } from "zod";

export const freightRequestQuestionAskSchema = z.object({
  question: z.string().trim().min(3, "질문은 3자 이상 입력해 주세요.").max(1000, "질문은 1000자 이하로 입력해 주세요."),
  requestId: z.uuid("운송 견적 요청 ID를 확인해 주세요.")
});

export const freightRequestQuestionAnswerSchema = z.object({
  answer: z.string().trim().min(2, "답변은 2자 이상 입력해 주세요.").max(1000, "답변은 1000자 이하로 입력해 주세요."),
  questionId: z.uuid("질문 ID를 확인해 주세요.")
});

export type FreightRequestQuestionAskInput = z.infer<typeof freightRequestQuestionAskSchema>;
export type FreightRequestQuestionAnswerInput = z.infer<typeof freightRequestQuestionAnswerSchema>;

export type FreightRequestQuestionActionState = {
  message?: string;
  questionId?: string;
  requestId?: string;
  status: "idle" | "success" | "error";
};
