import { describe, expect, it } from "vitest";
import { buildHsSupplementGuidance, isWeakProductName } from "@/features/hs/hs-supplement-guidance";

describe("HS supplement guidance", () => {
  it("builds HS4 guidance for cosmetics", () => {
    const guidance = buildHsSupplementGuidance("3304");

    expect(guidance.level).toBe("hs4");
    expect(guidance.title).toContain("화장품");
    expect(guidance.questions).toContain("입술용, 눈화장용, 기초화장용, 매니큐어/페디큐어용 중 어디에 해당하는지");
    expect(guidance.recommendedMaterials).toContain("전성분표");
    expect(guidance.canRequestConfirmation).toBe(false);
  });

  it("builds HS6 guidance for filtering parts", () => {
    const guidance = buildHsSupplementGuidance("8421.99");

    expect(guidance.level).toBe("hs6");
    expect(guidance.title).toContain("여과");
    expect(guidance.questions).toContain("완성 장치인지 부분품인지");
  });

  it("detects weak product names", () => {
    expect(isWeakProductName("PARTS")).toBe(true);
    expect(isWeakProductName("부품")).toBe(true);
    expect(isWeakProductName("Skin Care Cosmetics")).toBe(false);
  });
});
