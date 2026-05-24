import type { SupabaseClient } from "@supabase/supabase-js";
import { mockHsMasterRecords, mockStandardProductNames } from "@/features/hs/mock-hs-data";
import type { ProductHsRecommendationInput } from "@/features/hs/schemas";
import { createSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase/server";
import {
  buildCustomsHsCodeQuery,
  fetchCustomsOpenApiSnapshot,
  hasCustomsOpenApiEnv,
  parseCustomsHsCodeSearchXml
} from "@/server/integrations/customs/customs-api";
import type { InternalTaxLawRuleRecord } from "@/server/repositories/customs-statistical-code.repository";
import {
  augmentProductInputWithAiTerms,
  extractHsCodeHintsFromProductInput,
  normalizeProductSearchInput
} from "@/server/ai/product-search-normalization.service";
import type { AiProductSearchNormalizationResult } from "@/server/ai/provider";
import {
  analyzeProductNameInput,
  normalizeProductInputText,
  productCandidateHints,
  productSearchTerms,
  scoreProductHint,
  scoreStandardName as scoreProductStandardName,
  scoreStandardNameWithTerms,
  type ProductNameSearchAnalysis
} from "@/server/rules/product-name-search-engine";

export type HsCandidateRecommendation = {
  hskCode: string;
  hs6: string;
  rank: number;
  confidenceScore: number;
  koreanName: string;
  reason: string;
  requiredQuestions: string[];
  riskNotes: string;
  scoreBreakdown: string[];
  lookupBasis?: "user_hs_hint" | "ai_hs_hint" | "ai_term_match" | "official_name_match" | "customs_api" | "internal_tax_rule" | "ambiguous_abbreviation";
  reviewStatus: "suggested";
  sourceName: string;
  sourceUrl: string;
  sourceVersion: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  basisDate: string;
};

type StandardNameSearchRow = {
  hsk_code: string;
  standard_name_kr: string;
  required_spec_kr: string | null;
  detailed_classification: string | null;
  source_name: string;
  source_url: string;
  source_version: string;
};

type HsMasterSearchRow = {
  hsk_code: string;
  hs6: string;
  korean_name: string;
  english_name: string | null;
  source_name: string;
  source_url: string;
  source_version: string;
  effective_from: string;
  effective_to: string | null;
};

type InternalTaxLawHsCandidate = {
  rule: InternalTaxLawRuleRecord;
  hsRecord: HsMasterSearchRow;
  keywordMatches: string[];
};

type NormalizedProductSearch = {
  input: ProductHsRecommendationInput;
  normalization: AiProductSearchNormalizationResult | null;
};

function isModelLikeToken(token: string) {
  return token.length >= 4 && /[a-z]/i.test(token) && /[0-9]/.test(token) && !/^\d{4,10}$/.test(token);
}

function isBareProductCodeInput(productName: string) {
  const tokens = productName
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  if (!tokens.length || tokens.length > 3) return false;

  return tokens.some(isModelLikeToken)
    && tokens.every((token) => isModelLikeToken(token) || /^[a-z]{1,3}$/.test(token) || /^[0-9]{1,4}$/.test(token));
}

const ambiguousProductRules = [
  {
    query: "esc",
    candidates: [
      {
        hskCode: "8471601020",
        interpretation: "컴퓨터 키보드의 Escape 키 또는 키 입력장치",
        reason: "ESC가 컴퓨터 키보드의 Escape key를 의미할 수 있습니다.",
        questions: ["완제품 키보드인지, 키캡/스위치/부품인지", "컴퓨터용 입력장치인지", "유선/무선 여부와 인터페이스"],
        risk: "키보드 완제품, 키캡, 스위치, 전자부품은 서로 다른 세번으로 경합될 수 있습니다."
      },
      {
        hskCode: "8708303000",
        interpretation: "자동차 차체 자세 제어 장치(Electronic Stability Control) 관련 제동 제어 장치",
        reason: "ESC가 자동차의 Electronic Stability Control을 의미할 수 있습니다.",
        questions: ["차량용 완성 제어장치인지, 브레이크 시스템 부분품인지", "ABS/ESC 모듈 포함 여부", "장착 대상 차종과 부품번호"],
        risk: "차량용 전자제어장치, 브레이크 부분품, 센서류는 기능과 장착 위치에 따라 세번 경합이 큽니다."
      },
      {
        hskCode: "8486902030",
        interpretation: "반도체 제조 장비용 정전식 척(Electrostatic Chuck)",
        reason: "ESC가 반도체 제조 공정의 Electrostatic Chuck을 의미할 수 있습니다.",
        questions: ["반도체 웨이퍼 고정용 정전척인지", "사용 장비와 공정(식각/증착 등)", "단독 장비인지 제8486호 장비 부분품인지"],
        risk: "반도체 제조 장비 전용 부분품 여부와 장비 용도 확인이 필요합니다."
      }
    ]
  }
];

function ambiguousRuleForProductName(productName: string) {
  const normalized = productName.trim().toLowerCase().replace(/[\s._-]+/g, "");
  return ambiguousProductRules.find((rule) => rule.query === normalized);
}

function isEffective(record: { effective_from: string; effective_to: string | null; status: string }, basisDate: string) {
  return record.status === "published" && record.effective_from <= basisDate && (!record.effective_to || record.effective_to >= basisDate);
}

function matchingInternalTaxRuleKeywords(rule: InternalTaxLawRuleRecord, terms: string[], rawText: string) {
  const compactText = rawText.replace(/\s+/g, "");

  return rule.keyword_terms.filter((keyword) => {
    const normalizedKeyword = keyword.toLowerCase();
    const compactKeyword = normalizedKeyword.replace(/\s+/g, "");
    return terms.includes(normalizedKeyword) || rawText.includes(normalizedKeyword) || compactText.includes(compactKeyword);
  });
}

function uniqueRowsByHsk(rows: StandardNameSearchRow[], analysis: ProductNameSearchAnalysis) {
  const best = new Map<string, { row: StandardNameSearchRow; score: number; breakdown: string[]; matchedTerms: string[] }>();

  for (const row of rows) {
    const { score, breakdown, matchedTerms } = scoreProductStandardName(row, analysis);
    if (score <= 0) continue;
    const current = best.get(row.hsk_code);
    if (!current || score > current.score) {
      best.set(row.hsk_code, { row, score, breakdown, matchedTerms });
    }
  }

  return [...best.values()].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.row.hsk_code.localeCompare(b.row.hsk_code);
  });
}

function usefulProductSearchTerms(terms: string[], limit = 8) {
  return Array.from(new Set(terms
    .map((term) => term.trim().toLowerCase())
    .filter((term) => term.length >= 3)
    .filter((term) => !hsMasterWeakTerms.has(term))
  )).slice(0, limit);
}

async function findStandardNameRows(
  supabase: SupabaseClient,
  input: ProductHsRecommendationInput,
  terms: string[]
) {
  const usefulTerms = usefulProductSearchTerms(terms);
  const rows = await Promise.all(usefulTerms.flatMap((term) => [
    supabase
      .from("standard_product_names")
      .select("hsk_code, standard_name_kr, required_spec_kr, detailed_classification, source_name, source_url, source_version")
      .ilike("standard_name_kr", `%${term}%`)
      .lte("effective_from", input.basisDate)
      .or(`effective_to.is.null,effective_to.gte.${input.basisDate}`)
      .eq("status", "published")
      .limit(25),
    supabase
      .from("standard_product_names")
      .select("hsk_code, standard_name_kr, required_spec_kr, detailed_classification, source_name, source_url, source_version")
      .ilike("required_spec_kr", `%${term}%`)
      .lte("effective_from", input.basisDate)
      .or(`effective_to.is.null,effective_to.gte.${input.basisDate}`)
      .eq("status", "published")
      .limit(25)
  ]));

  const collected: StandardNameSearchRow[] = [];
  for (const row of rows) {
    if (row.error) throw new Error(row.error.message);
    collected.push(...((row.data ?? []) as StandardNameSearchRow[]));
  }

  return collected;
}

const hsMasterWeakTerms = new Set([
  "and",
  "with",
  "for",
  "the",
  "black",
  "white",
  "color",
  "colour",
  "mono",
  "기타",
  "제품",
  "상품"
]);
const hsMasterMaterialOnlyTerms = new Set([
  "ceramic",
  "ceramics",
  "porcelain",
  "plastic",
  "plastics",
  "metal",
  "steel",
  "aluminum",
  "aluminium",
  "wood",
  "glass",
  "rubber",
  "leather",
  "cotton",
  "도자",
  "도자제",
  "플라스틱",
  "금속",
  "철강",
  "알루미늄",
  "목재",
  "유리",
  "고무",
  "가죽",
  "면"
]);

function hsMasterSearchTerms(analysis: ProductNameSearchAnalysis, normalization?: AiProductSearchNormalizationResult | null) {
  return Array.from(new Set([
    ...analysis.terms,
    ...(normalization?.searchTerms ?? []),
    ...(normalization?.koreanTerms ?? []),
    ...(normalization?.englishTerms ?? []),
    ...(normalization?.productFamilies ?? [])
  ]
    .map((term) => term.trim().toLowerCase())
    .filter((term) => term.length >= 3)
    .filter((term) => !hsMasterWeakTerms.has(term))
  )).slice(0, 16);
}

function matchedHsMasterTerms(row: HsMasterSearchRow, terms: string[]) {
  const haystack = `${row.korean_name} ${row.english_name ?? ""}`.toLowerCase();

  return terms.filter((term) => haystack.includes(term));
}

function hasOnlyMaterialMatches(matches: string[]) {
  return matches.length > 0 && matches.every((term) => hsMasterMaterialOnlyTerms.has(term));
}

function hasOfficialDataLookupHint(normalization: AiProductSearchNormalizationResult | null) {
  return Boolean(
    normalization
    && (
      normalization.candidateHsCodes.length
      || normalization.searchTerms.length
      || normalization.koreanTerms.length
      || normalization.englishTerms.length
      || normalization.productFamilies.length
    )
  );
}

function reasonForHsCodeHint(
  normalization: AiProductSearchNormalizationResult | null,
  hskCode: string,
  hs6: string
) {
  const reasons = normalization?.candidateHsCodeReasons ?? [];
  return reasons.find((item) => hskCode.startsWith(item.code) || hs6.startsWith(item.code) || item.code.startsWith(hs6));
}

function hasUnrequestedSpecializedContext(row: HsMasterSearchRow, input: ProductHsRecommendationInput) {
  const haystack = `${row.korean_name} ${row.english_name ?? ""}`.toLowerCase();
  const inputText = normalizeProductInputText(input);
  const specializedGroups = [
    ["radioactive", "isotope", "tritium", "uranium", "actinium", "californium", "curium", "polonium", "radium", "방사성", "동위원소", "삼중수소", "우라늄", "라듐"],
    ["semiconductor", "wafer", "반도체", "웨이퍼"],
    ["military", "weapon", "munition", "무기", "군용"],
    ["medical", "surgical", "의료", "수술"],
    ["engine", "vehicle", "automotive", "motor car", "piston", "엔진", "차량", "자동차", "피스톤"]
  ];

  return specializedGroups.some((group) =>
    group.some((term) => haystack.includes(term))
    && !group.some((term) => inputText.includes(term))
  );
}

async function findHsMasterRowsByTerms(
  supabase: SupabaseClient,
  input: ProductHsRecommendationInput,
  terms: string[]
) {
  const usefulTerms = usefulProductSearchTerms(terms, 12);
  const rows = await Promise.all(usefulTerms.map((term) =>
    supabase
      .from("hs_master")
      .select("hsk_code, hs6, korean_name, english_name, source_name, source_url, source_version, effective_from, effective_to")
      .or(`korean_name.ilike.%${term}%,english_name.ilike.%${term}%`)
      .lte("effective_from", input.basisDate)
      .or(`effective_to.is.null,effective_to.gte.${input.basisDate}`)
      .eq("status", "published")
      .order("hsk_code")
      .limit(30)
  ));

  const collected: HsMasterSearchRow[] = [];
  for (const row of rows) {
    if (row.error) throw new Error(row.error.message);
    collected.push(...((row.data ?? []) as HsMasterSearchRow[]));
  }

  return collected;
}

async function findHsMasterRowsByCodeHints(
  supabase: SupabaseClient,
  input: ProductHsRecommendationInput,
  codeHints: string[]
) {
  const collected: HsMasterSearchRow[] = [];
  const normalizedHints = Array.from(new Set(codeHints.map((code) => code.replace(/[^0-9]/g, "")).filter((code) => code.length >= 4 && code.length <= 10)));

  for (const code of normalizedHints) {
    let query = supabase
      .from("hs_master")
      .select("hsk_code, hs6, korean_name, english_name, source_name, source_url, source_version, effective_from, effective_to")
      .lte("effective_from", input.basisDate)
      .or(`effective_to.is.null,effective_to.gte.${input.basisDate}`)
      .eq("status", "published")
      .order("hsk_code")
      .limit(code.length >= 10 ? 1 : 12);

    query = code.length >= 10
      ? query.eq("hsk_code", code)
      : code.length === 6
      ? query.eq("hs6", code)
      : query.like("hsk_code", `${code}%`);

    const { data, error } = await query;

    if (error) throw new Error(error.message);
    collected.push(...((data ?? []) as HsMasterSearchRow[]));
  }

  return collected;
}

function mockHsMasterRowsByTerms(
  input: ProductHsRecommendationInput,
  terms: string[]
): HsMasterSearchRow[] {
  const rows: HsMasterSearchRow[] = [];

  for (const term of terms) {
    const normalizedTerm = term.toLowerCase();
    rows.push(...mockHsMasterRecords
      .filter((record) => isEffective(record, input.basisDate))
      .filter((record) => `${record.korean_name} ${record.english_name ?? ""}`.toLowerCase().includes(normalizedTerm))
      .map((record) => ({
        hsk_code: record.hsk_code,
        hs6: record.hs6,
        korean_name: record.korean_name,
        english_name: record.english_name,
        source_name: record.source_name,
        source_url: record.source_url,
        source_version: record.source_version,
        effective_from: record.effective_from,
        effective_to: record.effective_to
      })));
  }

  return rows;
}

function mockHsMasterRowsByCodeHints(
  input: ProductHsRecommendationInput,
  codeHints: string[]
): HsMasterSearchRow[] {
  const normalizedHints = Array.from(new Set(codeHints.map((code) => code.replace(/[^0-9]/g, "")).filter((code) => code.length >= 4 && code.length <= 10)));
  const rows = new Map<string, HsMasterSearchRow>();

  for (const code of normalizedHints) {
    const matches = mockHsMasterRecords
      .filter((record) => isEffective(record, input.basisDate))
      .filter((record) => {
        if (code.length >= 10) return record.hsk_code === code;
        if (code.length === 6) return record.hs6 === code;
        return record.hsk_code.startsWith(code);
      });

    for (const record of matches) {
      rows.set(record.hsk_code, {
        hsk_code: record.hsk_code,
        hs6: record.hs6,
        korean_name: record.korean_name,
        english_name: record.english_name,
        source_name: record.source_name,
        source_url: record.source_url,
        source_version: record.source_version,
        effective_from: record.effective_from,
        effective_to: record.effective_to
      });
    }

    for (const hskCode of ["8471601020", "8708303000", "8486902030"]) {
      const fallbackRecord = ambiguousMockHsRecord(hskCode);
      if (
        fallbackRecord
        && fallbackRecord.effective_from <= input.basisDate
        && (!fallbackRecord.effective_to || fallbackRecord.effective_to >= input.basisDate)
        && (
          code.length >= 10
            ? fallbackRecord.hsk_code === code
            : code.length === 6
              ? fallbackRecord.hs6 === code
              : fallbackRecord.hsk_code.startsWith(code)
        )
      ) {
        rows.set(fallbackRecord.hsk_code, fallbackRecord);
      }
    }
  }

  return [...rows.values()];
}

function mapOfficialHsMasterRowsToCandidates(
  input: ProductHsRecommendationInput,
  normalization: AiProductSearchNormalizationResult | null,
  rows: Array<{ row: HsMasterSearchRow; score: number; matches: string[]; fromCodeHint: boolean; fromUserHsHint?: boolean }>
): HsCandidateRecommendation[] {
  return rows
    .sort((a, b) => b.score - a.score || a.row.hsk_code.localeCompare(b.row.hsk_code))
    .slice(0, 5)
    .map((item, index) => {
      const hintReason = reasonForHsCodeHint(normalization, item.row.hsk_code, item.row.hs6);

      return {
        hskCode: item.row.hsk_code,
        hs6: item.row.hs6,
        rank: index + 1,
        confidenceScore: Math.max(0.34, Math.min(0.7, 0.44 + item.score * 0.035 - index * 0.03)),
        koreanName: item.row.korean_name,
        reason: hintReason
          ? `${hintReason.reason} 공식 HS 데이터에 대조해 조회한 후보입니다.`
          : item.fromCodeHint
          ? "AI가 생성한 검색용 HS 후보를 공식 HS 데이터에 대조해 조회한 후보입니다. 실제 기능, 구성, 용도에 따라 하위 세번 확인이 필요합니다."
          : "AI가 생성한 검색어를 공식 HS 품명 데이터에 대조해 조회한 후보입니다. 실제 기능, 구성, 용도에 따라 하위 세번 확인이 필요합니다.",
        requiredQuestions: [
          ...(hintReason?.requiredInfo ?? []),
          ...(normalization?.missingQuestions ?? []),
          "카탈로그, 제품 사양서, 기능 설명, 완제품/부분품 여부 확인"
        ].filter((question, questionIndex, questions) => questions.indexOf(question) === questionIndex).slice(0, 4),
        riskNotes: "AI 검색 보조와 공식 HS 데이터 매칭 결과이며 품목분류 확정이 아닙니다.",
        scoreBreakdown: [
          item.fromCodeHint ? "AI 검색용 HS 후보와 공식 HS 데이터 매칭" : "AI 검색어와 공식 HS 품명 매칭",
          ...item.matches.slice(0, 5).map((term) => `공식 품명 검색어 ${term}`)
        ],
        lookupBasis: item.fromUserHsHint ? "user_hs_hint" : item.fromCodeHint ? "ai_hs_hint" : "ai_term_match",
        reviewStatus: "suggested" as const,
        sourceName: item.row.source_name,
        sourceUrl: item.row.source_url,
        sourceVersion: item.row.source_version,
        effectiveFrom: item.row.effective_from,
        effectiveTo: item.row.effective_to,
        basisDate: input.basisDate
      };
    });
}

function rankOfficialHsMasterRows(
  input: ProductHsRecommendationInput,
  normalization: AiProductSearchNormalizationResult | null,
  terms: string[],
  termRows: HsMasterSearchRow[],
  codeHintRows: HsMasterSearchRow[]
) {
  const hasNonMaterialSearchTerms = terms.some((term) => !hsMasterMaterialOnlyTerms.has(term));
  const userProvidedHsHints = extractHsCodeHintsFromProductInput(input).map((hint) => hint.replace(/[^0-9]/g, ""));
  const best = new Map<string, { row: HsMasterSearchRow; score: number; matches: string[]; fromCodeHint: boolean; fromUserHsHint?: boolean }>();

  for (const row of termRows) {
    if (hasUnrequestedSpecializedContext(row, input)) continue;
    const matches = matchedHsMasterTerms(row, terms);
    if (!matches.length) continue;
    if (hasNonMaterialSearchTerms && hasOnlyMaterialMatches(matches)) continue;
    const current = best.get(row.hsk_code);
    const score = matches.length * 2 + (row.korean_name.includes("기타") || row.english_name?.toLowerCase() === "other" ? -1 : 0);
    if (!current || score > current.score) {
      best.set(row.hsk_code, { row, score, matches, fromCodeHint: false });
    }
  }

  for (const row of codeHintRows) {
    const reasonedHint = reasonForHsCodeHint(normalization, row.hsk_code, row.hs6);
    if (!reasonedHint && hasUnrequestedSpecializedContext(row, input)) continue;
    const matches = matchedHsMasterTerms(row, terms);
    if (hasNonMaterialSearchTerms && matches.length > 0 && hasOnlyMaterialMatches(matches)) continue;
    const current = best.get(row.hsk_code);
    const score = 5 + matches.length * 2 + Math.min(row.hsk_code.length, 10) / 10 + (reasonedHint ? 2 : 0);
    if (!current || score > current.score) {
      const fromUserHsHint = userProvidedHsHints.some((hint) => {
        if (hint.length >= 10) return row.hsk_code === hint.slice(0, 10) || row.hs6 === hint.slice(0, 6);
        if (hint.length >= 6) return row.hs6 === hint.slice(0, 6);
        return row.hsk_code.startsWith(hint);
      });
      best.set(row.hsk_code, { row, score, matches, fromCodeHint: true, fromUserHsHint });
    }
  }

  return mapOfficialHsMasterRowsToCandidates(input, normalization, [...best.values()]);
}

function recommendHsCandidatesFromMockOfficialHsMasterSearch(
  input: ProductHsRecommendationInput,
  normalization: AiProductSearchNormalizationResult | null
) {
  if (!hasOfficialDataLookupHint(normalization)) return [];
  const analysis = analyzeProductNameInput(input);
  const terms = hsMasterSearchTerms(analysis, normalization);
  return rankOfficialHsMasterRows(
    input,
    normalization,
    terms,
    mockHsMasterRowsByTerms(input, terms),
    normalization?.candidateHsCodes.length ? mockHsMasterRowsByCodeHints(input, normalization.candidateHsCodes) : []
  );
}

async function recommendHsCandidatesFromOfficialHsMasterSearch(
  supabase: SupabaseClient,
  input: ProductHsRecommendationInput,
  normalization: AiProductSearchNormalizationResult | null
): Promise<HsCandidateRecommendation[]> {
  const analysis = analyzeProductNameInput(input);
  const terms = hsMasterSearchTerms(analysis, normalization);
  const [termRows, codeHintRows] = await Promise.all([
    terms.length ? findHsMasterRowsByTerms(supabase, input, terms) : Promise.resolve([]),
    normalization?.candidateHsCodes.length ? findHsMasterRowsByCodeHints(supabase, input, normalization.candidateHsCodes) : Promise.resolve([])
  ]);
  return rankOfficialHsMasterRows(input, normalization, terms, termRows, codeHintRows);
}

async function recommendHsCandidatesFromSupabase(
  supabase: SupabaseClient,
  input: ProductHsRecommendationInput
): Promise<HsCandidateRecommendation[]> {
  const analysis = analyzeProductNameInput(input);
  const terms = analysis.terms;
  if (!terms.length) return [];

  const standardRows = await findStandardNameRows(supabase, input, terms);
  const rankedStandardRows = uniqueRowsByHsk(standardRows, analysis).slice(0, 5);
  const hskCodes = rankedStandardRows.map((item) => item.row.hsk_code);
  if (!hskCodes.length) return [];

  const { data: hsRows, error: hsError } = await supabase
    .from("hs_master")
    .select("hsk_code, hs6, korean_name, english_name, source_name, source_url, source_version, effective_from, effective_to")
    .in("hsk_code", hskCodes)
    .lte("effective_from", input.basisDate)
    .or(`effective_to.is.null,effective_to.gte.${input.basisDate}`)
    .eq("status", "published");

  if (hsError) throw new Error(hsError.message);

  const hsByCode = new Map(((hsRows ?? []) as HsMasterSearchRow[]).map((row) => [row.hsk_code, row]));

  return rankedStandardRows
    .map((item, index): HsCandidateRecommendation | null => {
      const hsRecord = hsByCode.get(item.row.hsk_code);
      if (!hsRecord) return null;
      const confidenceScore = Math.max(0.38, Math.min(0.74, 0.44 + item.score * 0.08 - index * 0.03));

      return {
        hskCode: hsRecord.hsk_code,
        hs6: hsRecord.hs6,
        rank: index + 1,
        confidenceScore,
        koreanName: hsRecord.korean_name,
        reason: "입력 품명으로 조회 가능한 HS CODE 후보입니다. 실제 품목의 기능, 재질, 구성, 용도에 따라 하위 세번이 달라질 수 있습니다.",
        requiredQuestions: [
          item.row.required_spec_kr ? `필수규격: ${item.row.required_spec_kr}` : "필수규격 자료 없음",
          item.row.detailed_classification ? `세부분류: ${item.row.detailed_classification}` : "세부분류 기준 없음",
          "카탈로그, 성분/재질, 용도, 모델별 사양서"
        ],
        riskNotes: "HSK 확정이 아니며 품목분류 경합과 요건 영향 확인 필요",
        scoreBreakdown: item.breakdown,
        lookupBasis: "official_name_match" as const,
        reviewStatus: "suggested" as const,
        sourceName: item.row.source_name || hsRecord.source_name,
        sourceUrl: item.row.source_url || hsRecord.source_url,
        sourceVersion: item.row.source_version || hsRecord.source_version,
        effectiveFrom: hsRecord.effective_from,
        effectiveTo: hsRecord.effective_to,
        basisDate: input.basisDate
      };
    })
    .filter((item): item is HsCandidateRecommendation => Boolean(item));
}

async function recommendHsCandidatesFromInternalTaxRules(
  supabase: SupabaseClient,
  input: ProductHsRecommendationInput
): Promise<HsCandidateRecommendation[]> {
  const analysis = analyzeProductNameInput(input);
  const terms = analysis.terms;
  const rawText = analysis.rawText;
  if (!terms.length) return [];

  const { data: ruleRows, error: ruleError } = await supabase
    .from("internal_tax_law_rules")
    .select("tax_type, tax_name, law_name, article_ref, rule_type, hsk_pattern, keyword_terms, rate_text, rate_formula, condition_text, source_name, source_url, source_version")
    .not("hsk_pattern", "is", null)
    .lte("effective_from", input.basisDate)
    .or(`effective_to.is.null,effective_to.gte.${input.basisDate}`)
    .eq("status", "published")
    .limit(50);

  if (ruleError) throw new Error(ruleError.message);

  const matchedRules = ((ruleRows ?? []) as InternalTaxLawRuleRecord[])
    .map((rule) => ({
      rule,
      keywordMatches: matchingInternalTaxRuleKeywords(rule, terms, rawText)
    }))
    .filter((item) => item.keywordMatches.length > 0);

  if (!matchedRules.length) return [];

  const candidateRows: InternalTaxLawHsCandidate[] = [];

  for (const item of matchedRules) {
    const pattern = item.rule.hsk_pattern?.replace(/[^0-9]/g, "");
    if (!pattern) continue;

    const { data: hsRows, error: hsError } = await supabase
      .from("hs_master")
      .select("hsk_code, hs6, korean_name, english_name, source_name, source_url, source_version, effective_from, effective_to")
      .like("hsk_code", `${pattern}%`)
      .lte("effective_from", input.basisDate)
      .or(`effective_to.is.null,effective_to.gte.${input.basisDate}`)
      .eq("status", "published")
      .order("hsk_code")
      .limit(item.rule.rule_type === "hs4" ? 8 : 5);

    if (hsError) throw new Error(hsError.message);

    candidateRows.push(...((hsRows ?? []) as HsMasterSearchRow[]).map((hsRecord) => ({
      rule: item.rule,
      hsRecord,
      keywordMatches: item.keywordMatches
    })));
  }

  return candidateRows
    .sort((a, b) => {
      const exactKeywordDiff = Number(b.hsRecord.korean_name.includes(input.productName)) - Number(a.hsRecord.korean_name.includes(input.productName));
      if (exactKeywordDiff !== 0) return exactKeywordDiff;
      return a.hsRecord.hsk_code.localeCompare(b.hsRecord.hsk_code);
    })
    .slice(0, 5)
    .map((item, index) => ({
      hskCode: item.hsRecord.hsk_code,
      hs6: item.hsRecord.hs6,
      rank: index + 1,
      confidenceScore: Math.max(0.42, 0.64 - index * 0.04),
      koreanName: item.hsRecord.korean_name,
      reason: "내국세 법령상 과세대상 후보와 연결될 수 있는 HS CODE입니다. 실제 성분, 용도, 용량, 가격 기준 확인이 필요합니다.",
      requiredQuestions: [
        item.rule.condition_text ?? "내국세 법령상 과세대상 조건 확인",
        item.rule.rate_text ? `내국세율 단서: ${item.rule.rate_text}` : "세율 자료 확인 필요",
        "성분, 용도, 용량, 가격 기준 확인"
      ],
      riskNotes: "내국세 법령 기반 후보이므로 HS 확정용이 아니라 과세대상 가능성 보조 단서입니다.",
      scoreBreakdown: item.keywordMatches.map((term) => `내국세 법령 단서 ${term}`),
      lookupBasis: "internal_tax_rule",
      reviewStatus: "suggested" as const,
      sourceName: item.rule.source_name,
      sourceUrl: item.rule.source_url ?? item.hsRecord.source_url,
      sourceVersion: item.rule.source_version,
      effectiveFrom: item.hsRecord.effective_from,
      effectiveTo: item.hsRecord.effective_to,
      basisDate: input.basisDate
    }));
}

function mergeRecommendations(candidates: HsCandidateRecommendation[]) {
  const best = new Map<string, HsCandidateRecommendation>();

  for (const candidate of candidates) {
    const current = best.get(candidate.hskCode);
    if (!current || candidate.confidenceScore > current.confidenceScore) {
      best.set(candidate.hskCode, candidate);
    }
  }

  return [...best.values()]
    .sort((a, b) => b.confidenceScore - a.confidenceScore || a.hskCode.localeCompare(b.hskCode))
    .slice(0, 5)
    .map((candidate, index) => ({ ...candidate, rank: index + 1 }));
}

function pruneByUserHsHints(input: ProductHsRecommendationInput, candidates: HsCandidateRecommendation[]) {
  const hints = extractHsCodeHintsFromProductInput(input);
  if (!hints.length || !candidates.length) return candidates;

  const normalizedHints = hints.map((hint) => hint.replace(/[^0-9]/g, ""));
  const matchingCandidates = candidates.filter((candidate) =>
    normalizedHints.some((hint) => {
      if (hint.length >= 10) return candidate.hskCode === hint.slice(0, 10) || candidate.hs6 === hint.slice(0, 6);
      if (hint.length >= 6) return candidate.hs6 === hint.slice(0, 6);
      return candidate.hskCode.startsWith(hint);
    })
  );

  return matchingCandidates.length
    ? matchingCandidates.map((candidate, index) => ({ ...candidate, rank: index + 1 }))
    : candidates;
}

function pruneWeakProductRecommendations(candidates: HsCandidateRecommendation[], options: { keepAmbiguousAlternatives: boolean }) {
  if (options.keepAmbiguousAlternatives || candidates.length <= 1) return candidates;

  const topScore = candidates[0]?.confidenceScore ?? 0;
  if (topScore < 0.72) return candidates;

  const threshold = Math.max(0.5, topScore - 0.18);
  const focused = candidates.filter((candidate) => candidate.confidenceScore >= threshold);

  return focused.length ? focused.map((candidate, index) => ({ ...candidate, rank: index + 1 })) : candidates.slice(0, 1);
}

function shouldUseAiSearchNormalization(input: ProductHsRecommendationInput) {
  return Boolean([
    input.productName,
    input.productUsage,
    input.material,
    input.composition,
    input.functions,
    input.modelName
  ].filter(Boolean).join(" ").trim());
}

async function normalizedProductSearch(input: ProductHsRecommendationInput): Promise<NormalizedProductSearch> {
  if (!shouldUseAiSearchNormalization(input)) return { input, normalization: null };
  const normalization = await normalizeProductSearchInput(input).catch(() => null);
  const augmentedInput = normalization ? augmentProductInputWithAiTerms(input, normalization) : input;
  return {
    input: augmentedInput.productName !== input.productName ? augmentedInput : input,
    normalization
  };
}

function mapAmbiguousCandidateFromHsRecord(
  hsRecord: HsMasterSearchRow,
  ruleCandidate: (typeof ambiguousProductRules)[number]["candidates"][number],
  basisDate: string,
  index: number
): HsCandidateRecommendation {
  return {
    hskCode: hsRecord.hsk_code,
    hs6: hsRecord.hs6,
    rank: index + 1,
    confidenceScore: Math.max(0.36, 0.58 - index * 0.04),
    koreanName: `${hsRecord.korean_name} (${ruleCandidate.interpretation})`,
    reason: `${ruleCandidate.reason} 약어만으로는 특정할 수 없어 예상 의미 후보로 제시합니다.`,
    requiredQuestions: ruleCandidate.questions,
    riskNotes: ruleCandidate.risk,
    scoreBreakdown: [`약어 의미 후보: ${ruleCandidate.interpretation}`],
    lookupBasis: "ambiguous_abbreviation",
    reviewStatus: "suggested",
    sourceName: hsRecord.source_name,
    sourceUrl: hsRecord.source_url,
    sourceVersion: hsRecord.source_version,
    effectiveFrom: hsRecord.effective_from,
    effectiveTo: hsRecord.effective_to,
    basisDate
  };
}

function ambiguousMockHsRecord(hskCode: string): HsMasterSearchRow | null {
  const fallback: Record<string, HsMasterSearchRow> = {
    "8471601020": {
      hsk_code: "8471601020",
      hs6: "847160",
      korean_name: "키 입력장치",
      english_name: "Keyboard input units",
      source_name: "HSK 품목분류표",
      source_url: "https://unipass.customs.go.kr/clip/index.do",
      source_version: "ambiguous-fallback-2026",
      effective_from: "2026-01-01",
      effective_to: null
    },
    "8708303000": {
      hsk_code: "8708303000",
      hs6: "870830",
      korean_name: "전자 제어식 제동장치",
      english_name: "Electronic braking control apparatus",
      source_name: "HSK 품목분류표",
      source_url: "https://unipass.customs.go.kr/clip/index.do",
      source_version: "ambiguous-fallback-2026",
      effective_from: "2026-01-01",
      effective_to: null
    },
    "8486902030": {
      hsk_code: "8486902030",
      hs6: "848690",
      korean_name: "정전식 척(chuck)",
      english_name: "Electrostatic chuck",
      source_name: "HSK 품목분류표",
      source_url: "https://unipass.customs.go.kr/clip/index.do",
      source_version: "ambiguous-fallback-2026",
      effective_from: "2026-01-01",
      effective_to: null
    }
  };

  return fallback[hskCode] ?? null;
}

function recommendAmbiguousProductCandidates(input: ProductHsRecommendationInput): HsCandidateRecommendation[] {
  const rule = ambiguousRuleForProductName(input.productName);
  if (!rule) return [];

  return rule.candidates
    .map((candidate, index) => {
      const record = ambiguousMockHsRecord(candidate.hskCode);
      return record ? mapAmbiguousCandidateFromHsRecord(record, candidate, input.basisDate, index) : null;
    })
    .filter((candidate): candidate is HsCandidateRecommendation => Boolean(candidate));
}

function mockHsRowsByUserCodeHints(input: ProductHsRecommendationInput) {
  const codeHints = extractHsCodeHintsFromProductInput(input);
  if (!codeHints.length) return [];

  const rows = new Map<string, (typeof mockHsMasterRecords)[number]>();

  for (const code of codeHints) {
    const matches = mockHsMasterRecords
      .filter((record) => isEffective(record, input.basisDate))
      .filter((record) => {
        if (code.length >= 10) return record.hsk_code === code;
        if (code.length === 6) return record.hs6 === code;
        return record.hsk_code.startsWith(code);
      });

    for (const record of matches) {
      if (!rows.has(record.hsk_code)) rows.set(record.hsk_code, record);
    }
  }

  return [...rows.values()].slice(0, 5);
}

function recommendHsCandidatesFromUserCodeHints(input: ProductHsRecommendationInput): HsCandidateRecommendation[] {
  return mockHsRowsByUserCodeHints(input).map((record, index) => ({
    hskCode: record.hsk_code,
    hs6: record.hs6,
    rank: index + 1,
    confidenceScore: Math.max(0.62, 0.82 - index * 0.04),
    koreanName: record.korean_name,
    reason: "입력값에 포함된 HS CODE 힌트를 기준으로 공식 HS 데이터에서 조회한 후보입니다. 품명, 용도, 재질과의 일치 여부 확인이 필요합니다.",
    requiredQuestions: [
      "입력한 HS CODE가 국내 HSK인지, 해외 수입국 세번인지 확인",
      "품명, 용도, 재질, 기능이 해당 HS CODE 설명과 일치하는지 확인",
      "해외 세번인 경우 공통 HS6 이후 국가별 세분류 차이 확인"
    ],
    riskNotes: "사용자 제공 HS CODE는 강한 조회 단서이지만 품목분류 확정이 아니며, 해외 세번 suffix는 국내 HSK와 다를 수 있습니다.",
    scoreBreakdown: ["사용자 입력 HS CODE 힌트"],
    lookupBasis: "user_hs_hint",
    reviewStatus: "suggested" as const,
    sourceName: record.source_name,
    sourceUrl: record.source_url,
    sourceVersion: record.source_version,
    effectiveFrom: record.effective_from,
    effectiveTo: record.effective_to,
    basisDate: input.basisDate
  }));
}

async function recommendHsCandidatesFromCustomsHsSearch(input: ProductHsRecommendationInput): Promise<HsCandidateRecommendation[]> {
  if (!hasCustomsOpenApiEnv("hs_code")) return [];

  const snapshot = await fetchCustomsOpenApiSnapshot("hs_code", buildCustomsHsCodeQuery({
    productName: input.productName,
    language: "ko"
  }), { timeoutMs: Number(process.env.CUSTOMS_API_PRODUCT_SEARCH_TIMEOUT_MS || 2500) });
  const rows = parseCustomsHsCodeSearchXml(snapshot.rawText).slice(0, 20);
  const unique = new Map<string, (typeof rows)[number]>();

  for (const row of rows) {
    if (row.hskCode && !unique.has(row.hskCode)) {
      unique.set(row.hskCode, row);
    }
  }

  return [...unique.values()].slice(0, 5).map((row, index) => ({
    hskCode: row.hskCode,
    hs6: row.hskCode.slice(0, 6),
    rank: index + 1,
    confidenceScore: Math.max(0.32, 0.58 - index * 0.04),
    koreanName: row.koreanName || row.englishName || row.hskCode,
    reason: "관세청 HS부호검색에서 조회된 HS CODE 후보입니다. 실제 재질·용도·성분 확인 후 하위 세번 검토가 필요합니다.",
    requiredQuestions: [
      "품명 검색 결과이므로 실제 재질·용도·성분 확인 필요",
      row.quantityUnit || row.weightUnit ? `단위: 수량 ${row.quantityUnit || "-"} / 중량 ${row.weightUnit || "-"}` : "수량·중량 단위 확인 필요",
      "카탈로그, 성분/재질, 용도, 모델별 사양서"
    ],
    riskNotes: "관세청 HS부호검색 결과는 품목분류 확정이 아니며 하위 세번 경합 확인 필요",
    scoreBreakdown: ["관세청 HS부호검색 API 후보"],
    lookupBasis: "customs_api",
    reviewStatus: "suggested",
    sourceName: snapshot.sourceName,
    sourceUrl: snapshot.sourceUrl,
    sourceVersion: snapshot.sourceVersion,
    effectiveFrom: input.basisDate,
    effectiveTo: null,
    basisDate: input.basisDate
  }));
}

export function recommendHsCandidates(input: ProductHsRecommendationInput): HsCandidateRecommendation[] {
  const analysis = analyzeProductNameInput(input);
  const userCodeHintCandidates = recommendHsCandidatesFromUserCodeHints(input);
  const scored = productCandidateHints
    .map((hint) => {
      const { matched, score, breakdown } = scoreProductHint(analysis, hint);
      const record = mockHsMasterRecords.find((item) => item.hsk_code === hint.hskCode && isEffective(item, input.basisDate));
      return { hint, matched, score, breakdown, record };
    })
    .filter((item) => item.record)
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return a.hint.hskCode.localeCompare(b.hint.hskCode);
    })
    .slice(0, 5);

  const deterministicCandidates = scored.map((item, index) => {
    const record = item.record!;
    const standardName = mockStandardProductNames.find((standard) => standard.hsk_code === record.hsk_code && isEffective(standard, input.basisDate));
    const confidenceScore = Math.max(0.35, Math.min(0.78, 0.42 + item.score * 0.12 - index * 0.03));

    return {
      hskCode: record.hsk_code,
      hs6: record.hs6,
      rank: index + 1,
      confidenceScore,
      koreanName: record.korean_name,
      reason: "입력 품명으로 추정 가능한 HS CODE 후보입니다. 실제 제품의 재질·성분·용도·가공상태 확인이 필요합니다.",
      requiredQuestions: standardName
        ? [...item.hint.questions, `필수규격 확인: ${standardName.required_spec_kr}`]
        : item.hint.questions,
      riskNotes: item.hint.risk,
      scoreBreakdown: item.breakdown,
      lookupBasis: "official_name_match" as const,
      reviewStatus: "suggested" as const,
      sourceName: record.source_name,
      sourceUrl: record.source_url,
      sourceVersion: record.source_version,
      effectiveFrom: record.effective_from,
      effectiveTo: record.effective_to,
      basisDate: input.basisDate
    };
  });

  return mergeRecommendations([...userCodeHintCandidates, ...recommendAmbiguousProductCandidates(input), ...deterministicCandidates]);
}

export async function recommendHsCandidatesForProduct(input: ProductHsRecommendationInput): Promise<HsCandidateRecommendation[]> {
  const { input: augmentedInput, normalization } = await normalizedProductSearch(input);
  const isAmbiguousAcronym = Boolean(ambiguousRuleForProductName(input.productName));

  if (!hasSupabaseEnv()) {
    return pruneByUserHsHints(
      input,
      pruneWeakProductRecommendations(
        mergeRecommendations([
          ...recommendAmbiguousProductCandidates(input),
          ...recommendHsCandidatesFromMockOfficialHsMasterSearch(augmentedInput, normalization)
        ]),
        { keepAmbiguousAlternatives: isAmbiguousAcronym }
      )
    );
  }

  try {
    const supabase = await createSupabaseServerClient();
    if (normalization && isBareProductCodeInput(input.productName) && normalization.webSources.length === 0 && !hasOfficialDataLookupHint(normalization)) {
      return [];
    }
    const useAugmented = augmentedInput.productName !== input.productName;
    const [
      officialCandidates,
      internalTaxCandidates,
      normalizedOfficialCandidates,
      normalizedInternalTaxCandidates,
      officialHsMasterCandidates
    ] = await Promise.all([
      recommendHsCandidatesFromSupabase(supabase, input).catch(() => []),
      recommendHsCandidatesFromInternalTaxRules(supabase, input).catch(() => []),
      useAugmented ? recommendHsCandidatesFromSupabase(supabase, augmentedInput).catch(() => []) : Promise.resolve([]),
      useAugmented ? recommendHsCandidatesFromInternalTaxRules(supabase, augmentedInput).catch(() => []) : Promise.resolve([]),
      normalization ? recommendHsCandidatesFromOfficialHsMasterSearch(supabase, augmentedInput, normalization).catch(() => []) : Promise.resolve([])
    ]);
    const nonApiNormalizedCandidates = [
      ...normalizedOfficialCandidates,
      ...normalizedInternalTaxCandidates,
      ...officialHsMasterCandidates
    ];
    const normalizedApiCandidates = useAugmented && !nonApiNormalizedCandidates.length
      ? await recommendHsCandidatesFromCustomsHsSearch(augmentedInput).catch(() => [])
      : [];
    const normalizedCandidates = [...nonApiNormalizedCandidates, ...normalizedApiCandidates];
    const originalCandidates = normalizedCandidates.length ? [] : [
      ...officialCandidates,
      ...internalTaxCandidates
    ];
    const apiCandidates = normalizedCandidates.length || originalCandidates.length
      ? []
      : await recommendHsCandidatesFromCustomsHsSearch(input).catch(() => []);
    const merged = mergeRecommendations([
      ...recommendAmbiguousProductCandidates(input),
      ...normalizedCandidates,
      ...originalCandidates,
      ...apiCandidates
    ]);
    return pruneByUserHsHints(input, pruneWeakProductRecommendations(merged, {
      keepAmbiguousAlternatives: isAmbiguousAcronym
    }));
  } catch {
    const apiCandidates = await recommendHsCandidatesFromCustomsHsSearch(input).catch(() => []);
    if (isBareProductCodeInput(input.productName) && augmentedInput.productName !== input.productName && !hasOfficialDataLookupHint(normalization)) {
      return [];
    }
    const mockOfficialCandidates = recommendHsCandidatesFromMockOfficialHsMasterSearch(augmentedInput, normalization);
    const normalizedApiCandidates = augmentedInput.productName !== input.productName && !mockOfficialCandidates.length
      ? await recommendHsCandidatesFromCustomsHsSearch(augmentedInput).catch(() => [])
      : [];
    const normalizedCandidates = [...mockOfficialCandidates, ...normalizedApiCandidates];
    const originalCandidates = normalizedCandidates.length ? [] : apiCandidates;
    return pruneByUserHsHints(input, pruneWeakProductRecommendations(mergeRecommendations([
      ...recommendAmbiguousProductCandidates(input),
      ...normalizedCandidates,
      ...originalCandidates
    ]), {
      keepAmbiguousAlternatives: isAmbiguousAcronym
    }));
  }
}

export const hsCandidateServiceInternals = {
  searchTerms: productSearchTerms,
  scoreStandardName: scoreStandardNameWithTerms,
  uniqueRowsByHsk,
  pruneWeakProductRecommendations,
  ambiguousRuleForProductName,
  analyzeProductNameInput
};
