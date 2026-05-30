import { describe, expect, it } from "vitest";
import { productInputShape, sanitizeLookupTelemetryPayload } from "@/server/observability/lookup-telemetry";
import {
  classifyLookupTelemetryBucket,
  classifyLookupTelemetryIssue,
  lookupTelemetryIssueAction,
  summarizeRecurringLookupTelemetryIssues,
  summarizeLookupTelemetryBuckets,
  summarizeLookupTelemetryDiagnostics,
  type LookupTelemetryEvent
} from "@/server/repositories/lookup-telemetry.repository";

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

    expect(classifyLookupTelemetryIssue(telemetryEvent({
      payload: { normalizationStatus: "failed", normalizationErrorType: "TimeoutError" }
    }))).toBe("GPT 호출 실패");
    expect(summarizeLookupTelemetryDiagnostics([
      telemetryEvent({
        payload: { normalizationStatus: "failed", normalizationErrorType: "TimeoutError" },
        resultCount: 1
      })
    ])).toEqual([{
      diagnosis: "GPT 호출 실패",
      count: 1,
      issueCount: 1,
      action: lookupTelemetryIssueAction("GPT 호출 실패")
    }]);


    expect(classifyLookupTelemetryIssue(telemetryEvent({
      resultCount: 1,
      payload: { candidateQualityType: "hs6_only_provisional", onlyProvisionalHs6: true }
    }))).toBe("HS6 예비후보만 표시");

    expect(classifyLookupTelemetryIssue(telemetryEvent({
      resultCount: 2,
      payload: { candidateQualityType: "non_hsk10_candidates", finalHsk10Count: 0 }
    }))).toBe("10자리 확장 필요");
  });

  it("summarizes diagnosis counts with operator actions", () => {
    const summary = summarizeLookupTelemetryDiagnostics([
      telemetryEvent({
        id: "event-1",
        eventType: "product_search_normalized",
        resultCount: null,
        payload: { candidateCount: 0 }
      }),
      telemetryEvent({
        id: "event-2",
        eventType: "product_search_normalized",
        resultCount: null,
        payload: { candidateCount: 0 }
      }),
      telemetryEvent({
        id: "event-3",
        resultCount: 2,
        payload: {}
      })
    ]);

    expect(summary[0]).toMatchObject({
      diagnosis: "GPT 후보 없음",
      count: 2,
      issueCount: 2,
      action: lookupTelemetryIssueAction("GPT 후보 없음")
    });
    expect(summary.find((item) => item.diagnosis === "정상")?.count).toBe(1);
  });

  it("groups lookup telemetry into operator triage buckets", () => {
    expect(classifyLookupTelemetryBucket(telemetryEvent({
      status: "fallback",
      resultCount: 1
    }))).toMatchObject({
      key: "fallback",
      label: "Fallback"
    });

    expect(classifyLookupTelemetryBucket(telemetryEvent({
      payload: { normalizationStatus: "failed", normalizationErrorType: "TimeoutError" },
      resultCount: 1
    }))).toMatchObject({
      key: "gpt",
      label: "GPT 단계"
    });

    const summary = summarizeLookupTelemetryBuckets([
      telemetryEvent({
        id: "event-1",
        payload: { normalizationStatus: "failed", normalizationErrorType: "TimeoutError" },
        resultCount: 1
      }),
      telemetryEvent({
        id: "event-2",
        payload: { candidateQualityType: "hs6_only_provisional", onlyProvisionalHs6: true },
        resultCount: 1
      }),
      telemetryEvent({
        id: "event-3",
        payload: {},
        resultCount: 2
      })
    ]);

    expect(summary).toEqual([
      expect.objectContaining({ key: "gpt", count: 1, issueCount: 1 }),
      expect.objectContaining({ key: "hs6_only", count: 1, issueCount: 1 }),
      expect.objectContaining({ key: "normal", count: 1, issueCount: 0 })
    ]);
  });

  it("promotes recurring lookup telemetry issues by bucket", () => {
    const recurring = summarizeRecurringLookupTelemetryIssues([
      telemetryEvent({
        id: "event-1",
        route: "/hs/product-recommendation",
        payload: { normalizationStatus: "failed", normalizationErrorType: "TimeoutError" },
        resultCount: 1,
        createdAt: "2026-05-29T00:00:00.000Z"
      }),
      telemetryEvent({
        id: "event-2",
        route: "/hs/product-recommendation",
        eventType: "product_search_normalized",
        resultCount: null,
        payload: { candidateCount: 0 },
        createdAt: "2026-05-29T01:00:00.000Z"
      }),
      telemetryEvent({
        id: "event-3",
        route: "/hs/batch",
        payload: { hasNormalization: true, normalizationCandidateCount: 1, aiHintCount: 0, officialCandidateCount: 0 },
        createdAt: "2026-05-29T02:00:00.000Z"
      }),
      telemetryEvent({
        id: "event-4",
        route: "/hs/product-recommendation",
        resultCount: 2,
        payload: {},
        createdAt: "2026-05-29T03:00:00.000Z"
      })
    ], 2);

    expect(recurring).toEqual([
      expect.objectContaining({
        key: "gpt",
        issueCount: 3,
        latestAt: "2026-05-29T02:00:00.000Z",
        routes: ["/hs/product-recommendation", "/hs/batch"],
        diagnoses: ["GPT 호출 실패", "GPT 후보 없음", "GPT 후보 후처리 확인"]
      })
    ]);
  });
});
