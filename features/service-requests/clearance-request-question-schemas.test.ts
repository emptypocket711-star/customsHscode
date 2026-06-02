import { describe, expect, it } from "vitest";
import {
  clearanceRequestQuestionAnswerSchema,
  clearanceRequestQuestionAskSchema
} from "@/features/service-requests/clearance-request-question-schemas";

describe("clearance request question schemas", () => {
  it("accepts broker questions and requester answers", () => {
    expect(
      clearanceRequestQuestionAskSchema.parse({
        question: "원산지증명서 발급 예정 여부를 확인해 주세요.",
        requestId: "11111111-1111-4111-8111-111111111111"
      }).question
    ).toContain("원산지증명서");

    expect(
      clearanceRequestQuestionAnswerSchema.parse({
        answer: "발급 예정입니다.",
        questionId: "22222222-2222-4222-8222-222222222222"
      }).answer
    ).toBe("발급 예정입니다.");
  });

  it("rejects too-short question and answer text", () => {
    expect(() =>
      clearanceRequestQuestionAskSchema.parse({
        question: "HS",
        requestId: "11111111-1111-4111-8111-111111111111"
      })
    ).toThrow();

    expect(() =>
      clearanceRequestQuestionAnswerSchema.parse({
        answer: "네네",
        questionId: "22222222-2222-4222-8222-222222222222"
      })
    ).not.toThrow();
  });
});
