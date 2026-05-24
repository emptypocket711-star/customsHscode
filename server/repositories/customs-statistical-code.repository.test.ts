import { describe, expect, it } from "vitest";
import {
  formatInternalTaxRate,
  internalTaxLawRuleLookupCodes,
  internalTaxSearchTerms,
  matchInternalTaxCodes,
  matchInternalTaxLawRules,
  type CustomsStatisticalCodeRecord,
  type InternalTaxLawRuleRecord
} from "@/server/repositories/customs-statistical-code.repository";

const source = {
  code_type: "A01",
  korean_abbreviation: null,
  english_abbreviation: null,
  english_note: null,
  source_name: "관세청 통계부호내역조회",
  source_version: "myc-openapi-api019-v1.0:A01",
  effective_from: "2026-01-01",
  effective_to: null,
  status: "published"
};

const records: CustomsStatisticalCodeRecord[] = [
  { ...source, code: "A422000", korean_name: "고급 시계", internal_tax_rate: 20 },
  { ...source, code: "B511100", korean_name: "배기량 2,000cc를 초과하는 승용자동차와 캠핑용자동차", internal_tax_rate: 3.5 },
  { ...source, code: "C512300", korean_name: "피우는 담배(제5종 전자담배)", internal_tax_rate: 370 }
];

const lawRules: InternalTaxLawRuleRecord[] = [
  {
    tax_type: "vat",
    tax_name: "부가가치세",
    law_name: "부가가치세법",
    article_ref: "제30조",
    rule_type: "hs4",
    hsk_pattern: null,
    keyword_terms: [],
    rate_text: "10%",
    rate_formula: "부가가치세 과세표준 x 10%",
    condition_text: "일반 부가가치세율",
    tax_base_type: "taxable_value",
    source_name: "내국세 법령 테스트 룰",
    source_version: "internal-tax-law-test-rules-20260524"
  },
  {
    tax_type: "liquor_tax",
    tax_name: "주세",
    law_name: "주세법",
    article_ref: "테스트",
    rule_type: "hs4",
    hsk_pattern: "2208",
    keyword_terms: ["위스키"],
    rate_text: "종량/종가 혼합",
    rate_formula: "주종별",
    condition_text: "증류주류 테스트 룰",
    tax_base_type: "taxable_value",
    source_name: "내국세 법령 테스트 룰",
    source_version: "internal-tax-law-test-rules-20260524"
  }
];

describe("customs statistical code repository helpers", () => {
  it("extracts search terms from Korean product names", () => {
    expect(internalTaxSearchTerms("고급 시계 부분품")).toEqual(["고급", "시계"]);
  });

  it("formats internal tax rates", () => {
    expect(formatInternalTaxRate(20)).toBe("20%");
    expect(formatInternalTaxRate(null)).toBe("-");
  });

  it("matches internal tax codes by Korean product terms", () => {
    expect(matchInternalTaxCodes(records, "고급 시계")).toEqual([
      {
        codeType: "A01",
        code: "A422000",
        name: "고급 시계",
        rateText: "20%"
      }
    ]);
  });

  it("does not match statistical tax codes from a single broad substring", () => {
    expect(matchInternalTaxCodes(records, "전자 제어식 제동장치")).toEqual([]);
  });

  it("derives internal tax law rule lookup codes from HSK", () => {
    expect(internalTaxLawRuleLookupCodes("2208.30-1000")).toEqual(["2208301000", "220830", "2208", null]);
  });

  it("matches internal tax law rules by HS heading and keyword", () => {
    const matches = matchInternalTaxLawRules(lawRules, {
      hskCode: "2208301000",
      query: "위스키",
      limit: 5
    });

    expect(matches.map((match) => match.name)).toEqual(["주세", "부가가치세"]);
    expect(matches[0]?.matchBasis).toBe("HS4 법령룰");
    expect(matches[0]?.taxBaseType).toBe("taxable_value");
  });
});
