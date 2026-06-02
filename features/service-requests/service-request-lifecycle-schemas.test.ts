import { describe, expect, it } from "vitest";
import {
  serviceRequestCompleteSchema,
  serviceRequestStartSchema
} from "@/features/service-requests/service-request-lifecycle-schemas";

const requestId = "11111111-1111-4111-8111-111111111111";

describe("service request lifecycle schemas", () => {
  it("accepts a valid selected request start payload", () => {
    expect(serviceRequestStartSchema.parse({ requestId })).toEqual({ requestId });
  });

  it("trims optional completion notes and keeps the request id", () => {
    expect(serviceRequestCompleteSchema.parse({ completionNote: "  완료 확인  ", requestId })).toEqual({
      completionNote: "완료 확인",
      requestId
    });
  });

  it("rejects completion notes longer than 500 characters", () => {
    expect(() => serviceRequestCompleteSchema.parse({ completionNote: "가".repeat(501), requestId })).toThrow();
  });
});
