import { describe, expect, it } from "vitest";
import { serviceRequestFeedbackSchema } from "@/features/service-requests/service-request-feedback-schemas";

const requestId = "11111111-1111-4111-8111-111111111111";

describe("service request feedback schema", () => {
  it("coerces valid feedback scores from form values", () => {
    expect(serviceRequestFeedbackSchema.parse({
      communicationScore: "4",
      documentQualityScore: "3",
      rating: "5",
      requestId,
      responseSpeedScore: "5"
    })).toMatchObject({
      communicationScore: 4,
      documentQualityScore: 3,
      rating: 5,
      requestId,
      responseSpeedScore: 5
    });
  });

  it("trims comments and rejects invalid ratings", () => {
    expect(serviceRequestFeedbackSchema.parse({ comment: "  좋았습니다.  ", rating: "4", requestId }).comment).toBe("좋았습니다.");
    expect(() => serviceRequestFeedbackSchema.parse({ rating: "6", requestId })).toThrow();
  });
});
