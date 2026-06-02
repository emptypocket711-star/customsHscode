import { describe, expect, it } from "vitest";
import {
  freightRequestDraftSchema,
  freightRequestPublishSchema
} from "@/features/service-requests/freight-request-schemas";

describe("freight request draft schema", () => {
  it("accepts a minimal freight request draft", () => {
    const parsed = freightRequestDraftSchema.parse({
      direction: "export",
      title: "중고차 해상 운송 견적 요청"
    });

    expect(parsed.direction).toBe("export");
    expect(parsed.hazardous).toBe(false);
  });

  it("rejects missing title", () => {
    expect(() =>
      freightRequestDraftSchema.parse({
        direction: "import",
        title: ""
      })
    ).toThrow("요청 제목을 입력해 주세요.");
  });

  it("coerces positive numeric cargo fields", () => {
    const parsed = freightRequestDraftSchema.parse({
      cbm: "12.5",
      direction: "export",
      grossWeight: "980",
      packageCount: "4",
      title: "화물 견적"
    });

    expect(parsed.cbm).toBe(12.5);
    expect(parsed.grossWeight).toBe(980);
    expect(parsed.packageCount).toBe(4);
  });

  it("normalizes optional country codes and rejects unknown transport modes", () => {
    const parsed = freightRequestDraftSchema.parse({
      destinationCountryCode: "us",
      direction: "export",
      originCountryCode: "kr",
      title: "화물 견적",
      transportMode: "sea"
    });

    expect(parsed.originCountryCode).toBe("KR");
    expect(parsed.destinationCountryCode).toBe("US");
    expect(() =>
      freightRequestDraftSchema.parse({
        direction: "export",
        title: "화물 견적",
        transportMode: "spaceship"
      })
    ).toThrow();
  });

  it("accepts 24 or 48 hour publish windows only", () => {
    const parsed = freightRequestPublishSchema.parse({
      deadlineHours: "24",
      requestId: "11111111-1111-4111-8111-111111111111"
    });

    expect(parsed.deadlineHours).toBe(24);
    expect(() =>
      freightRequestPublishSchema.parse({
        deadlineHours: "72",
        requestId: "11111111-1111-4111-8111-111111111111"
      })
    ).toThrow("견적 모집 시간은 24시간 또는 48시간 중에서 선택해 주세요.");
  });
});
