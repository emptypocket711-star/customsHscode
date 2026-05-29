import { describe, expect, it } from "vitest";
import { productInputShape, sanitizeLookupTelemetryPayload } from "@/server/observability/lookup-telemetry";
import { classifyLookupTelemetryIssue, type LookupTelemetryEvent } from "@/server/repositories/lookup-telemetry.repository";

function telemetryEvent(overrides: Partial<LookupTelemetryEvent>): LookupTelemetryEvent {
  return {
    id: "event-1",
    eventType: "product_candidates_recommended",
    status: "success",
    sourceMode: "supabase",
    route: null,
    resultCount: 0,
    durationMs: 100,
    errorType: null,
    payload: {},
    createdAt: "2026-05-29T00:00:00.000Z",
    ...overrides
  };
}

describe("lookup telemetry", () => {
  it("drops raw product and personal fields from telemetry payloads", () => {
    const sanitized = sanitizeLookupTelemetryPayload({
      event: "product_search",
      productName: "레이니 키보드",
      rawText: "invoice row",
      email: "user@example.com",
      query: "초록매실",
      provider: "openai",
      durationMs: 123,
      resultCount: 2
    });

    expect(sanitized).toEqual({
      event: "product_search",
      provider: "openai",
      durationMs: 123,
      resultCount: 2
    });
  });

  it("summarizes product input shape without keeping the product text", () => {
    const shape = productInputShape({
      productName: "레이니 keyboard 75",
      productUsage: "컴퓨터 입력장치",
      material: "",
      composition: null,
      functions: "typing",
      modelName: "R75"
    });

    expect(shape).toMatchObject({
      productNameLength: 15,
      tokenCount: 3,
      hasDigits: true,
      hasHangul: true,
      hasLatin: true,
      hasCjk: false,
      hasCyrillic: false,
      hasUsage: true,
      hasMaterial: false,
      hasComposition: false,
      hasFunctions: true,
      hasModelName: true
    });
    expect(JSON.stringify(shape)).not.toContain("레이니");
    expect(JSON.stringify(shape)).not.toContain("keyboard");
  });

  it("classifies product lookup telemetry issues without raw input", () => {
    expect(classifyLookupTelemetryIssue(telemetryEvent({
      payload: { hasNormalization: true, normalizationCandidateCount: 1, aiHintCount: 0, officialCandidateCount: 0 }
    }))).toBe("GPT 후보 후처리 확인");

    expect(classifyLookupTelemetryIssue(telemetryEvent({
      eventType: "product_search_normalized",
      resultCount: null,
      payload: { candidateCount: 0 }
    }))).toBe("GPT 후보 없음");

    expect(classifyLookupTelemetryIssue(telemetryEvent({
      payload: { bareProductCodeWithoutSource: true }
    }))).toBe("제품코드 식별 실패");
  });
});
