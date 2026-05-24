import { describe, expect, it } from "vitest";
import {
  analyzeProductNameInput,
  productSearchTerms,
  scoreProductHint,
  scoreStandardName,
  productCandidateHints
} from "@/server/rules/product-name-search-engine";

describe("product-name-search-engine", () => {
  it("keeps typo correction narrow but expands relevant bilingual concepts", () => {
    const analysis = analyzeProductNameInput({
      productName: "mushroom puder",
      basisDate: "2026-05-24"
    });

    expect(analysis.spellingCorrections).toContainEqual({ from: "puder", to: "powder" });
    expect(analysis.terms).toEqual(expect.arrayContaining(["mushroom", "powder", "버섯", "분말"]));
    expect(analysis.requiredConcepts.map((concept) => concept.label)).toEqual(["버섯", "분말/가루"]);
  });

  it("requires both mushroom and powder concepts for mushroom powder standard-name matches", () => {
    const analysis = analyzeProductNameInput({
      productName: "mushroom puder",
      basisDate: "2026-05-24"
    });

    expect(scoreStandardName({
      hsk_code: "2106909099",
      standard_name_kr: "단백질 분말",
      required_spec_kr: "성분 함량",
      detailed_classification: null
    }, analysis).score).toBe(0);

    expect(scoreStandardName({
      hsk_code: "0712391090",
      standard_name_kr: "건조 버섯 분말",
      required_spec_kr: "버섯 종류, 단순 건조·분쇄 여부",
      detailed_classification: null
    }, analysis).score).toBeGreaterThan(0);
  });

  it("scores the intended hint ahead of generic powder candidates", () => {
    const analysis = analyzeProductNameInput({
      productName: "mushroom puder",
      basisDate: "2026-05-24"
    });
    const scored = productCandidateHints
      .map((hint) => ({ hint, score: scoreProductHint(analysis, hint).score }))
      .sort((a, b) => b.score - a.score);

    expect(scored[0]?.hint.hskCode).toBe("0712391090");
    expect(productSearchTerms({ productName: "mushroom puder", basisDate: "2026-05-24" })).toContain("powder");
  });

  it("handles one-letter omission typo when the domain vocabulary contains the intended term", () => {
    const analysis = analyzeProductNameInput({
      productName: "excvation",
      basisDate: "2026-05-24"
    });

    expect(analysis.spellingCorrections).toContainEqual({ from: "excvation", to: "excavation" });
    expect(analysis.terms).toEqual(expect.arrayContaining(["excavation", "excavator", "굴삭기", "굴착기"]));

    const scored = productCandidateHints
      .map((hint) => ({ hint, score: scoreProductHint(analysis, hint).score }))
      .sort((a, b) => b.score - a.score);

    expect(scored[0]?.hint.hskCode).toBe("8429521000");
  });

  it("keeps model-like laser belt searches near massage apparatus candidates", () => {
    const analysis = analyzeProductNameInput({
      productName: "laser belt cs-3000",
      basisDate: "2026-05-24"
    });
    const scored = productCandidateHints
      .map((hint) => ({ hint, score: scoreProductHint(analysis, hint).score }))
      .sort((a, b) => b.score - a.score);

    expect(analysis.terms).toContain("laser belt");
    expect(scored[0]?.hint.hskCode).toBe("9019102000");
  });

  it("treats brand plus generic cosmetic names as skin-care context, not food cream context", () => {
    const analysis = analyzeProductNameInput({
      productName: "graceday hand cream",
      basisDate: "2026-05-24"
    });
    const scored = productCandidateHints
      .map((hint) => ({ hint, score: scoreProductHint(analysis, hint).score }))
      .sort((a, b) => b.score - a.score);

    expect(analysis.conceptLabels).toContain("화장품");
    expect(analysis.terms).toEqual(expect.arrayContaining(["hand cream", "skin care", "cosmetic"]));
    expect(scored[0]?.hint.hskCode).toBe("3304991000");
  });
});
