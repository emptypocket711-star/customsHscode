import { describe, expect, it } from "vitest";
import { buildHsBriefDescription, buildHsSubheadingDescription } from "@/lib/hs-summary";

describe("HS summary helpers", () => {
  it("builds readable descriptions for generic HSK residual lines", () => {
    const input = {
      hskCode: "3926909000",
      hs6: "392690",
      koreanName: "기타",
      hierarchyPath: [
        { code: "39", label: "플라스틱과 그 제품", level: 2 as const },
        { code: "3926", label: "그 밖의 플라스틱 제품", level: 4 as const },
        { code: "392690", label: "기타", level: 6 as const },
        { code: "3926909000", label: "기타", level: 10 as const }
      ]
    };

    expect(buildHsBriefDescription(input)).toBe("플라스틱으로 만든 기타 제품");
    expect(buildHsSubheadingDescription(input)).toBe("3926.90 계열: 플라스틱으로 만든 기타 제품");
  });

  it("uses available subheading labels for specific HSK names", () => {
    const input = {
      hskCode: "3304991000",
      hs6: "330499",
      koreanName: "기초화장용 제품류",
      hierarchyPath: [
        { code: "33", label: "정유와 레지노이드ㆍ조제향료ㆍ화장품", level: 2 as const },
        { code: "3304", label: "미용이나 메이크업용 제품류", level: 4 as const },
        { code: "330499", label: "기타", level: 6 as const },
        { code: "3304991000", label: "기초화장용 제품류", level: 10 as const }
      ]
    };

    expect(buildHsBriefDescription(input)).toBe("정유와 레지노이드ㆍ조제향료ㆍ화장품 관련 품목 중 기초화장용 제품류");
    expect(buildHsSubheadingDescription(input)).toBe("3304.99 계열: 정유와 레지노이드ㆍ조제향료ㆍ화장품 관련 품목 중 기초화장용 제품류");
  });
});
