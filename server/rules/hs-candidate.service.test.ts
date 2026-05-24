import { describe, expect, it } from "vitest";
import { extractHsCodeHintsFromText } from "@/server/ai/product-search-normalization.service";
import { hsCandidateServiceInternals, recommendHsCandidates, recommendHsCandidatesForProduct } from "@/server/rules/hs-candidate.service";

describe("recommendHsCandidates", () => {
  it("returns matching published candidates with required review fields", () => {
    const candidates = recommendHsCandidates({
      productName: "리튬 배터리 모듈",
      productUsage: "전기자전거용 교체 배터리",
      material: "리튬이온 셀",
      basisDate: "2026-05-21"
    });

    expect(candidates.length).toBeGreaterThanOrEqual(1);
    expect(candidates.length).toBeLessThanOrEqual(5);
    expect(candidates[0]?.hskCode).toBe("8507601000");
    expect(candidates[0]?.reviewStatus).toBe("suggested");
    expect(candidates[0]?.requiredQuestions.length).toBeGreaterThan(0);
  });

  it("does not return unrelated fallback candidates when product terms do not match", () => {
    const candidates = recommendHsCandidates({
      productName: "검색어없음",
      basisDate: "2026-05-21"
    });

    expect(candidates).toHaveLength(0);
  });

  it("expands practical product synonyms such as lip balm", () => {
    const terms = hsCandidateServiceInternals.searchTerms({
      productName: "립밤",
      basisDate: "2026-05-21"
    });

    expect(terms).toContain("입술");
    expect(terms).not.toContain("립");
    expect(recommendHsCandidates({ productName: "립밤", basisDate: "2026-05-21" })[0]?.hskCode).toBe("3304101000");
  });

  it("returns possible meanings for ambiguous short acronyms such as ESC", () => {
    const candidates = recommendHsCandidates({
      productName: "esc",
      basisDate: "2026-05-21"
    });

    expect(candidates.map((candidate) => candidate.hskCode)).toEqual([
      "8471601020",
      "8708303000",
      "8486902030"
    ]);
    expect(candidates[0]?.reason).toContain("Escape key");
    expect(candidates[1]?.reason).toContain("Electronic Stability Control");
    expect(candidates[2]?.reason).toContain("Electrostatic Chuck");
    expect(hsCandidateServiceInternals.ambiguousRuleForProductName("E.S.C")?.query).toBe("esc");
  });

  it("tolerates narrow English typos and expands bilingual product terms", () => {
    const terms = hsCandidateServiceInternals.searchTerms({
      productName: "mushroom puder",
      basisDate: "2026-05-21"
    });

    expect(terms).toContain("powder");
    expect(terms).toContain("분말");
    expect(terms).toContain("버섯");

    const candidates = recommendHsCandidates({
      productName: "mushroom puder",
      basisDate: "2026-05-21"
    });

    expect(candidates[0]?.hskCode).toBe("0712391090");
    expect(candidates[0]?.requiredQuestions.join(" ")).toContain("조미");
  });

  it("uses AI-normalized typo hints in the async product search path", async () => {
    const candidates = await recommendHsCandidatesForProduct({
      productName: "mushroom puder",
      basisDate: "2026-05-21"
    });

    expect(candidates[0]?.hskCode).toBe("0712391090");
    expect(candidates[0]?.requiredQuestions.join(" ")).toContain("추가 가공");
    expect(candidates[0]?.scoreBreakdown.join(" ")).toContain("AI 검색용 HS 후보");
  });

  it("keeps competing acronym meanings from AI lookup hints", async () => {
    const candidates = await recommendHsCandidatesForProduct({
      productName: "esc",
      basisDate: "2026-05-21"
    });

    expect(candidates.map((candidate) => candidate.hs6)).toEqual(expect.arrayContaining([
      "847160",
      "870830",
      "848690"
    ]));
    expect(candidates.find((candidate) => candidate.hs6 === "870830")?.reason).toContain("Electronic Stability Control");
    expect(candidates.find((candidate) => candidate.hs6 === "848690")?.reason).toContain("Electrostatic Chuck");
  });

  it("recommends construction machinery candidates from one-letter English omissions", () => {
    const candidates = recommendHsCandidates({
      productName: "excvation",
      basisDate: "2026-05-21"
    });

    expect(candidates[0]?.hskCode).toBe("8429521000");
    expect(candidates[0]?.koreanName).toContain("굴삭기");
  });

  it("uses AI-normalized product terms alongside original search terms", async () => {
    const candidates = await recommendHsCandidatesForProduct({
      productName: "lazer belt cs-3000",
      basisDate: "2026-05-21"
    });

    expect(candidates[0]?.hskCode).toBe("9019102000");
    expect(candidates[0]?.koreanName).toContain("마사지");
  });

  it("returns printer candidates for plain English printer descriptions", async () => {
    const candidates = await recommendHsCandidatesForProduct({
      productName: "printer black and white",
      basisDate: "2026-05-21"
    });

    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates[0]?.hs6).toBe("844332");
    expect(candidates[0]?.koreanName).toContain("프린터");
    expect(candidates[0]?.requiredQuestions.join(" ")).toContain("복사");
  });

  it("extracts user-provided HS6 or foreign HS code hints from mixed product input", () => {
    expect(extractHsCodeHintsFromText("mushroom powder 071239")).toContain("071239");
    expect(extractHsCodeHintsFromText("품명: massage belt / 해외 HS CODE 9019.10.20")).toEqual(
      expect.arrayContaining(["90191020", "901910"])
    );
    expect(extractHsCodeHintsFromText("lazer belt cs-3000")).toHaveLength(0);
  });

  it("prioritizes product input HS code hints while keeping them provisional", async () => {
    const candidates = await recommendHsCandidatesForProduct({
      productName: "mushroom powder HS 071239",
      basisDate: "2026-05-21"
    });

    expect(candidates[0]?.hs6).toBe("071239");
    expect(candidates[0]?.reason).toContain("공식 HS 데이터");
    expect(candidates[0]?.riskNotes).toContain("품목분류 확정이 아닙니다");
  });

  it("uses a user-provided foreign hs code as an hs6 boundary for product search", async () => {
    const candidates = await recommendHsCandidatesForProduct({
      productName: "massage belt 9019.10.20",
      basisDate: "2026-05-21"
    });

    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates.every((candidate) => candidate.hs6 === "901910")).toBe(true);
    expect(candidates[0]?.hskCode).toBe("9019102000");
  });

  it("prunes weak noisy candidates when a strong product candidate exists", () => {
    const makeCandidate = (hskCode: string, confidenceScore: number) => ({
      hskCode,
      hs6: hskCode.slice(0, 6),
      rank: 1,
      confidenceScore,
      koreanName: hskCode,
      reason: "test",
      requiredQuestions: [],
      riskNotes: "test",
      scoreBreakdown: [],
      reviewStatus: "suggested" as const,
      sourceName: "test",
      sourceUrl: "test",
      sourceVersion: "test",
      effectiveFrom: "2026-01-01",
      effectiveTo: null,
      basisDate: "2026-05-21"
    });

    const candidates = hsCandidateServiceInternals.pruneWeakProductRecommendations([
      makeCandidate("9019102000", 0.78),
      makeCandidate("8703239010", 0.52),
      makeCandidate("8703239020", 0.49)
    ], { keepAmbiguousAlternatives: false });

    expect(candidates.map((candidate) => candidate.hskCode)).toEqual(["9019102000"]);
  });

  it("does not use one-syllable Korean fragments that match unrelated words", () => {
    const terms = hsCandidateServiceInternals.searchTerms({
      productName: "립스틱",
      basisDate: "2026-05-21"
    });

    expect(terms).not.toContain("립");
    expect(
      hsCandidateServiceInternals.scoreStandardName(
        {
          hsk_code: "0713319000",
          standard_name_kr: "건조녹두",
          required_spec_kr: "정립율",
          detailed_classification: "95%이상",
          source_name: "관세청 표준품명",
          source_url: "file:///Downloads/관세청_표준품명_20260101.xlsx",
          source_version: "customs-standard-product-20260101"
        },
        terms
      )
    ).toBe(0);
  });

  it("uses basis date to exclude inactive records", () => {
    const candidates = recommendHsCandidates({
      productName: "리튬 배터리 모듈",
      basisDate: "2025-05-21"
    });

    expect(candidates).toHaveLength(0);
  });

  it("uses AI HS hints against mock official data without Supabase env", async () => {
    const candidates = await recommendHsCandidatesForProduct({
      productName: "리튬 배터리 모듈",
      basisDate: "2026-05-21"
    });

    expect(candidates[0]?.hskCode).toBe("8507601000");
  });

  it("scores official standard name rows by matching input terms", () => {
    const terms = hsCandidateServiceInternals.searchTerms({
      productName: "리튬 배터리 모듈",
      material: "리튬이온 셀",
      basisDate: "2026-05-21"
    });

    expect(terms).toContain("리튬");
    expect(
      hsCandidateServiceInternals.scoreStandardName(
        {
          hsk_code: "8507601000",
          standard_name_kr: "리튬이온 배터리 모듈",
          required_spec_kr: "전압, 용량, 셀 구성",
          detailed_classification: null,
          source_name: "관세청 표준품명",
          source_url: "file:///Downloads/관세청_표준품명_20260101.xlsx",
          source_version: "customs-standard-product-20260101"
        },
        terms
      )
    ).toBeGreaterThan(0);
  });
});
