import { describe, expect, it } from "vitest";
import { preferentialDutySummaryText } from "./preferential-duty-summary";

describe("preferentialDutySummaryText", () => {
  it("asks for country and origin context when all countries are selected", () => {
    const result = preferentialDutySummaryText({ countryCode: "ALL" });

    expect(result.summary).toBe("수입국·원산지 선택 후 확인");
    expect(result.note).toContain("원산지증명");
    expect(result.note).toContain("협정 요건");
  });

  it("marks selected-country FTA rate as conditional instead of automatically applicable", () => {
    const result = preferentialDutySummaryText({
      countryCode: "CHN",
      preferentialTariffText: "한-중 FTA 관세율 0%"
    });

    expect(result.summary).toBe("요건 충족 시 한-중 FTA 관세율 0%");
    expect(result.note).toContain("자동 적용");
  });

  it("does not claim that FTA is absent when no selected-country row is displayed", () => {
    const result = preferentialDutySummaryText({ countryCode: "USA" });

    expect(result.summary).toBe("협정세율 표시 없음");
    expect(result.note).toContain("추가 확인");
  });
});
