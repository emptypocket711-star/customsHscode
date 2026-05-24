import type { SupabaseClient } from "@supabase/supabase-js";
import type { DutyEstimateTaxBaseType } from "@/features/duty-estimator/calculation";

export type CustomsStatisticalCodeRecord = {
  code_type: string;
  code: string;
  korean_name: string;
  korean_abbreviation: string | null;
  english_abbreviation: string | null;
  english_note: string | null;
  internal_tax_rate: number | null;
  source_name: string;
  source_version: string;
  effective_from: string;
  effective_to: string | null;
  status: string;
};

export type InternalTaxCodeMatch = {
  codeType: string;
  code: string;
  name: string;
  rateText: string;
  lawName?: string;
  articleRef?: string | null;
  conditionText?: string | null;
  matchBasis?: string;
  taxBaseType?: DutyEstimateTaxBaseType;
  sourceVersion?: string;
};

export type InternalTaxLawRuleRecord = {
  tax_type: string;
  tax_name: string;
  law_name: string;
  article_ref: string | null;
  rule_type: "hsk_exact" | "hs6" | "hs4" | "keyword_condition" | "statistical_code" | "manual_review";
  hsk_pattern: string | null;
  keyword_terms: string[];
  rate_text: string | null;
  rate_formula: string | null;
  condition_text: string | null;
  tax_base_type?: DutyEstimateTaxBaseType;
  source_name: string;
  source_url?: string;
  source_version: string;
};

const stopWords = new Set(["기타", "제품", "물품", "부분품", "용품", "것", "그", "및", "또는"]);

export function internalTaxSearchTerms(value: string) {
  return Array.from(
    new Set(
      value
        .replace(/[()[\]{}.,;:/\\\-ㆍ·]/g, " ")
        .split(/\s+/)
        .map((term) => term.trim())
        .filter((term) => term.length >= 2)
        .filter((term) => !stopWords.has(term))
    )
  );
}

export function formatInternalTaxRate(rate: number | null) {
  return rate === null ? "-" : `${rate}%`;
}

export function matchInternalTaxCodes(records: CustomsStatisticalCodeRecord[], query: string, limit = 5): InternalTaxCodeMatch[] {
  const terms = internalTaxSearchTerms(query);
  if (!terms.length) return [];
  const normalizedQuery = query.replace(/\s+/g, "");

  return records
    .filter((record) => {
      const normalizedRecordName = record.korean_name.replace(/\s+/g, "");
      if (normalizedQuery.includes(normalizedRecordName) || normalizedRecordName.includes(normalizedQuery)) return true;

      const recordTerms = internalTaxSearchTerms(record.korean_name);
      const matchedCount = recordTerms.filter((term) => terms.includes(term)).length;
      return matchedCount >= Math.min(2, recordTerms.length);
    })
    .map((record) => ({
      codeType: record.code_type,
      code: record.code,
      name: record.korean_name,
      rateText: formatInternalTaxRate(record.internal_tax_rate)
    }))
    .slice(0, limit);
}

export function internalTaxLawRuleLookupCodes(hskCode: string) {
  const normalized = hskCode.replace(/[^0-9]/g, "");
  return Array.from(new Set([
    normalized,
    normalized.slice(0, 6),
    normalized.slice(0, 4),
    null
  ].filter((value): value is string | null => value === null || value.length >= 4)));
}

function lawRuleMatchScore(record: InternalTaxLawRuleRecord, hskCode: string, query: string) {
  const normalized = hskCode.replace(/[^0-9]/g, "");
  const terms = internalTaxSearchTerms(query);
  const normalizedQuery = query.replace(/\s+/g, "");
  const keywordMatched = record.keyword_terms.some((term) => {
    const compactTerm = term.replace(/\s+/g, "");
    return terms.includes(term) || normalizedQuery.includes(compactTerm);
  });

  if (record.rule_type === "hsk_exact" && record.hsk_pattern && normalized === record.hsk_pattern) return 100;
  if (record.rule_type === "hs6" && record.hsk_pattern && normalized.startsWith(record.hsk_pattern)) return 80 + Number(keywordMatched);
  if (record.rule_type === "hs4" && record.hsk_pattern && normalized.startsWith(record.hsk_pattern)) return 60 + Number(keywordMatched);
  if (record.rule_type === "keyword_condition" && keywordMatched) return 40;
  if (!record.hsk_pattern && record.tax_type === "vat") return 10;
  return 0;
}

function lawRuleMatchBasis(record: InternalTaxLawRuleRecord) {
  if (record.rule_type === "hsk_exact") return "HSK 직접";
  if (record.rule_type === "hs6") return "HS6 법령룰";
  if (record.rule_type === "hs4") return record.hsk_pattern ? "HS4 법령룰" : "공통 법령룰";
  if (record.rule_type === "keyword_condition") return "품명 조건";
  if (record.rule_type === "statistical_code") return "통계부호";
  return "수동검토";
}

export function matchInternalTaxLawRules(records: InternalTaxLawRuleRecord[], input: { hskCode: string; query: string; limit?: number }): InternalTaxCodeMatch[] {
  return records
    .map((record) => ({ record, score: lawRuleMatchScore(record, input.hskCode, input.query) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.record.tax_name.localeCompare(b.record.tax_name, "ko"))
    .slice(0, input.limit ?? 8)
    .map(({ record }) => ({
      codeType: record.rule_type,
      code: record.hsk_pattern ?? record.tax_type,
      name: record.tax_name,
      rateText: record.rate_text ?? "-",
      lawName: record.law_name,
      articleRef: record.article_ref,
      conditionText: record.condition_text,
      matchBasis: lawRuleMatchBasis(record),
      taxBaseType: record.tax_base_type ?? "taxable_value",
      sourceVersion: record.source_version
    }));
}

export async function findInternalTaxCodeMatches(
  supabase: SupabaseClient,
  input: {
    query: string;
    basisDate: string;
    limit?: number;
  }
) {
  const { data, error } = await supabase
    .from("customs_statistical_codes")
    .select("code_type, code, korean_name, korean_abbreviation, english_abbreviation, english_note, internal_tax_rate, source_name, source_version, effective_from, effective_to, status")
    .eq("code_type", "A01")
    .lte("effective_from", input.basisDate)
    .or(`effective_to.is.null,effective_to.gte.${input.basisDate}`)
    .eq("status", "published")
    .order("code");

  if (error) throw new Error(error.message);

  return matchInternalTaxCodes((data ?? []) as CustomsStatisticalCodeRecord[], input.query, input.limit);
}

export async function findInternalTaxLawRuleMatches(
  supabase: SupabaseClient,
  input: {
    hskCode: string;
    query: string;
    basisDate: string;
    limit?: number;
  }
) {
  const lookupCodes = internalTaxLawRuleLookupCodes(input.hskCode);
  const { data, error } = await supabase
    .from("internal_tax_law_rules")
    .select("tax_type, tax_name, law_name, article_ref, rule_type, hsk_pattern, keyword_terms, rate_text, rate_formula, condition_text, tax_base_type, source_name, source_version")
    .or(`hsk_pattern.in.(${lookupCodes.filter(Boolean).join(",")}),hsk_pattern.is.null`)
    .lte("effective_from", input.basisDate)
    .or(`effective_to.is.null,effective_to.gte.${input.basisDate}`)
    .eq("status", "published")
    .limit(50);

  if (error) throw new Error(error.message);

  return matchInternalTaxLawRules((data ?? []) as InternalTaxLawRuleRecord[], input);
}
