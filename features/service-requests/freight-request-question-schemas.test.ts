import { describe, expect, it } from "vitest";
import {
  freightRequestQuestionAnswerSchema,
  freightRequestQuestionAskSchema
} from "@/features/service-requests/freight-request-question-schemas";

describe("freight request question schemas", () => {
  it("accepts a partner question and requester answer", () => {
    const ask = freightRequestQuestionAskSchema.parse({
      question: "픽업 가능 일정을 확인해 주세요.",
      requestId: "11111111-1111-4111-8111-111111111111"
    });
    const answer = freightRequestQuestionAnswerSchema.parse({
      answer: "6월 10일부터 픽업 가능합니다.",
      questionId: "22222222-2222-4222-8222-222222222222"
    });

    expect(ask.question).toBe("픽업 가능 일정을 확인해 주세요.");
    expect(answer.answer).toBe("6월 10일부터 픽업 가능합니다.");
  });

  it("rejects too-short question and answer text", () => {
    expect(() =>
      freightRequestQuestionAskSchema.parse({
        question: "?", requestId: "11111111-1111-4111-8111-111111111111"
      })
    ).toThrow();

    expect(() =>
      freightRequestQuestionAnswerSchema.parse({
        answer: "ㅇ", questionId: "22222222-2222-4222-8222-222222222222"
      })
    ).toThrow();
  });
});
