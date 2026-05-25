import { describe, expect, it } from "vitest";
import { productInputShape, sanitizeLookupTelemetryPayload } from "@/server/observability/lookup-telemetry";

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
});
