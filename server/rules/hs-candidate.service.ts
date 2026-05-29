import type { SupabaseClient } from "@supabase/supabase-js";
import { mockHsMasterRecords, mockStandardProductNames } from "@/features/hs/mock-hs-data";
import type { ProductHsRecommendationInput } from "@/features/hs/schemas";
import { createSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase/server";
import { logLookupTelemetry, productInputShape } from "@/server/observability/lookup-telemetry";
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
  scoreStandardNameWithTerms,
  type ProductNameSearchAnalysis,
  type ProductNameSearchRow
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

type CustomsHsCodeSearchRow = {
  hsk_code: string;
  hs6: string;
  korean_name: string | null;
  english_name: string | null;
  quantity_unit: string | null;
  weight_unit: string | null;
  rate_text: string | null;
  rate_type_code: string | null;
  source_name: string;
  source_url: string;
  source_version: string;
  effective_from: string;
  effective_to: string | null;
};

type StandardProductNameSearchRow = ProductNameSearchRow & {
  standard_name_en?: string | null;
  source_name: string;
  source_url: string;
  source_version: string;
  effective_from: string;
  effective_to: string | null;
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

function isUsefulProductSearchTerm(term: string) {
  if (term.length >= 3) return true;
  return term.length >= 2 && /[\u3131-\u318e\uac00-\ud7a3\u3040-\u30ff\u3400-\u9fff]/.test(term);
}

function hsMasterSearchTerms(analysis: ProductNameSearchAnalysis, normalization?: AiProductSearchNormalizationResult | null) {
  return Array.from(new Set([
    ...analysis.terms,
    ...(normalization?.searchTerms ?? []),
    ...(normalization?.koreanTerms ?? []),
    ...(normalization?.englishTerms ?? []),
    ...(normalization?.productFamilies ?? [])
  ]
    .map((term) => term.trim().toLowerCase())
    .filter(isUsefulProductSearchTerm)
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

function aiCodeHintRankBonus(normalization: AiProductSearchNormalizationResult | null, hskCode: string, hs6: string) {
  const hints = normalizeAiHsCodeHints(normalization);
  const index = hints.findIndex((code) => {
    if (code.length >= 10) return hskCode === code.slice(0, 10);
    if (code.length === 6) return hs6 === code || hskCode.startsWith(code);
    return hskCode.startsWith(code) || hs6.startsWith(code);
  });

  return index >= 0 ? Math.max(0, 2 - index * 0.35) : 0;
}

function normalizeAiHsCodeHints(normalization: AiProductSearchNormalizationResult | null) {
  return Array.from(new Set(
    (normalization?.candidateHsCodes ?? [])
      .map((code) => code.replace(/[^0-9]/g, ""))
      .filter((code) => code.length >= 4 && code.length <= 10)
  )).slice(0, 8);
}

function candidateMatchesCodeHint(candidate: HsCandidateRecommendation, codeHint: string) {
  const code = codeHint.replace(/[^0-9]/g, "");
  if (code.length < 4) return false;
  if (code.length >= 10) return candidate.hskCode === code.slice(0, 10) || candidate.hs6 === code.slice(0, 6);
  if (code.length === 6) return candidate.hs6 === code || candidate.hskCode.startsWith(code);
  return candidate.hskCode.startsWith(code) || candidate.hs6.startsWith(code);
}

function hasCandidateForAiCodeHint(candidate: HsCandidateRecommendation, code: string) {
  return candidateMatchesCodeHint(candidate, code);
}

function aiHsCodeHintLabel(code: string) {
  if (code.length >= 10) return `HSK ${code.slice(0, 4)}.${code.slice(4, 6)}-${code.slice(6, 10)}`;
  if (code.length === 6) return `HS ${code.slice(0, 4)}.${code.slice(4, 6)} 계열`;
  return `HS ${code} 계열`;
}

function recommendAiHsCodeHintCandidates(
  input: ProductHsRecommendationInput,
  normalization: AiProductSearchNormalizationResult | null,
  existingCandidates: HsCandidateRecommendation[]
): HsCandidateRecommendation[] {
  const codes = normalizeAiHsCodeHints(normalization)
    .filter((code) => !existingCandidates.some((candidate) => hasCandidateForAiCodeHint(candidate, code)));

  return codes.slice(0, 5).map((code, index) => {
    const hs6 = code.length >= 6 ? code.slice(0, 6) : code;
    const hintReason = reasonForHsCodeHint(normalization, code, hs6);
    const requiredQuestions = [
      ...(hintReason?.requiredInfo ?? []),
      ...(normalization?.missingQuestions ?? []),
      "제품명, 용도, 성분·재질, 제조공정, 완제품/부분품 여부 확인",
      "해당 HS4/HS6의 국내 HSK 10자리 하위 세번 확인"
    ].filter((question, questionIndex, questions) => questions.indexOf(question) === questionIndex).slice(0, 5);

    return {
      hskCode: code,
      hs6,
      rank: index + 1,
      confidenceScore: Math.max(0.54, 0.69 - index * 0.04),
      koreanName: aiHsCodeHintLabel(code),
      reason: hintReason
        ? `${hintReason.reason} 일반적인 제품 설명 기준의 검토 방향이며, 하위 HSK 10자리와 실제 제품 사양 확인이 필요합니다.`
        : "일반적인 제품 설명 기준으로 검토 가능한 HS 방향입니다. 하위 HSK 10자리와 실제 제품 사양 확인이 필요합니다.",
      requiredQuestions,
      riskNotes: "AI 예비 후보이며 품목분류 확정이 아닙니다. 동일 HS4/HS6 내에서도 재질, 성분, 용도, 가공상태에 따라 하위 세번이 달라질 수 있습니다.",
      scoreBreakdown: [
        "AI 분류 인터뷰 결과",
        ...(hintReason ? [`검토 근거: ${hintReason.reason}`] : [])
      ],
      lookupBasis: "ai_hs_hint",
      reviewStatus: "suggested" as const,
      sourceName: "AI 품명 정규화",
      sourceUrl: "internal://ai-product-normalization",
      sourceVersion: `${normalization?.provider ?? "unknown"}:${normalization?.model ?? "unknown"}`,
      effectiveFrom: input.basisDate,
      effectiveTo: null,
      basisDate: input.basisDate
    };
  });
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

const contextConflictRules = [
  {
    label: "skin-care-vs-dairy",
    inputContextTerms: [
      "cosmetic",
      "skin care",
      "skincare",
      "hand cream",
      "handcream",
      "moisture cream",
      "moisturizing cream",
      "moisture",
      "moisturizing",
      "moisturizer",
      "moisturiser",
      "lotion",
      "화장품",
      "기초화장",
      "피부",
      "보습",
      "핸드크림",
      "로션"
    ],
    preservingInputTerms: ["milk", "dairy", "edible", "food", "frozen", "cream cheese", "유제품", "우유", "식품", "식용", "냉동"],
    blockedCandidatePrefixes: ["0401"],
    blockedCandidateTerms: ["냉동크림", "milk", "dairy"]
  },
  {
    label: "massage-therapy-vs-vehicle-belt",
    inputContextTerms: ["massage", "massager", "physiotherapy", "therapy", "rehabilitation", "마사지", "안마", "물리치료", "재활치료"],
    preservingInputTerms: ["vehicle", "automotive", "engine", "timing belt", "fan belt", "차량", "자동차", "엔진", "타이밍벨트"],
    blockedCandidatePrefixes: ["4010", "8708"],
    blockedCandidateTerms: ["transmission belt", "conveyor belt", "vehicle", "automotive", "전동용 벨트", "차량", "자동차"]
  },
  {
    label: "food-powder-vs-chemical-powder",
    inputContextTerms: ["food", "edible", "supplement", "mushroom", "fruit", "vegetable", "식품", "섭취", "보충제", "버섯", "과일", "채소"],
    preservingInputTerms: ["chemical", "industrial", "pigment", "resin", "paint", "화학", "공업용", "안료", "수지", "도료"],
    blockedCandidatePrefixes: ["28", "29", "3206", "3901", "3902"],
    blockedCandidateTerms: ["chemical", "pigment", "resin", "화학", "안료", "수지"]
  },
  {
    label: "input-device-vs-portable-computer",
    inputContextTerms: ["keyboard", "keyboards", "input device", "input unit", "키보드", "입력장치", "자판"],
    preservingInputTerms: ["laptop", "notebook", "portable computer", "tablet pc", "노트북", "휴대용 컴퓨터", "태블릿"],
    blockedCandidatePrefixes: ["847130"],
    blockedCandidateTerms: ["portable automatic data processing", "휴대용 자동자료처리", "노트북"]
  },
  {
    label: "electric-fan-vs-internal-battery",
    inputContextTerms: ["electric fan", "portable fan", "handheld fan", "desk fan", "usb fan", "rechargeable fan", "선풍기", "손선풍기", "휴대용 선풍기", "탁상용 선풍기", "미니팬", "전기팬"],
    preservingInputTerms: ["battery pack", "replacement battery", "spare battery", "battery only", "cell", "배터리팩", "교체용 배터리", "예비 배터리", "배터리만", "셀"],
    blockedCandidatePrefixes: ["8507"],
    blockedCandidateTerms: ["battery", "accumulator", "축전지", "배터리"]
  },
  {
    label: "ready-to-drink-beverage-vs-food-preparation",
    inputContextTerms: ["beverage", "drink", "ready-to-drink", "soft drink", "juice drink", "flavored water", "음료", "음료수", "마시는"],
    preservingInputTerms: ["concentrate", "syrup", "powder", "extract", "base", "농축", "시럽", "분말", "원액", "엑기스"],
    blockedCandidatePrefixes: ["2106"],
    blockedCandidateTerms: ["food preparations", "조제 식료품"]
  },
  {
    label: "apparel-vest-vs-plastic-articles",
    inputContextTerms: ["vest", "waistcoat", "workwear", "safety vest", "reflective vest", "hi-vis", "high visibility", "조끼", "작업복", "작업용", "안전조끼", "반사조끼", "형광조끼"],
    preservingInputTerms: ["plastic article", "plastic closure", "stopper", "cap", "lid", "플라스틱 제품", "뚜껑", "마개", "캡", "플라스틱 부품"],
    blockedCandidatePrefixes: ["3926"],
    blockedCandidateTerms: ["plastics", "플라스틱"]
  }
];

function isContextConflictingCandidate(input: ProductHsRecommendationInput, candidate: HsCandidateRecommendation) {
  const inputText = normalizeProductInputText(input);
  const candidateText = `${candidate.hskCode} ${candidate.hs6} ${candidate.koreanName}`.toLowerCase();

  return contextConflictRules.some((rule) => {
    const hasInputContext = rule.inputContextTerms.some((term) => inputText.includes(term));
    if (!hasInputContext) return false;
    const hasPreservingInput = rule.preservingInputTerms.some((term) => inputText.includes(term));
    if (hasPreservingInput) return false;

    return rule.blockedCandidatePrefixes.some((prefix) => candidate.hskCode.startsWith(prefix) || candidate.hs6.startsWith(prefix))
      || rule.blockedCandidateTerms.some((term) => candidateText.includes(term));
  });
}

function filterContextConflictingCandidates(
  input: ProductHsRecommendationInput,
  candidates: HsCandidateRecommendation[]
) {
  const filtered = candidates.filter((candidate) => !isContextConflictingCandidate(input, candidate));
  return filtered.length ? filtered.map((candidate, index) => ({ ...candidate, rank: index + 1 })) : candidates;
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

function mapStoredCustomsHsCodeSearchRowsToCandidates(
  input: ProductHsRecommendationInput,
  rows: CustomsHsCodeSearchRow[],
  terms: string[]
): HsCandidateRecommendation[] {
  const best = new Map<string, { row: CustomsHsCodeSearchRow; matches: string[]; score: number }>();

  for (const row of rows) {
    const haystack = `${row.korean_name ?? ""} ${row.english_name ?? ""}`.toLowerCase();
    const matches = terms.filter((term) => haystack.includes(term));
    if (!matches.length) continue;
    const current = best.get(row.hsk_code);
    const score = matches.length * 2 + (row.korean_name?.includes("기타") || row.english_name?.toLowerCase() === "other" ? -1 : 0);
    if (!current || score > current.score) {
      best.set(row.hsk_code, { row, matches, score });
    }
  }

  return [...best.values()]
    .sort((a, b) => b.score - a.score || a.row.hsk_code.localeCompare(b.row.hsk_code))
    .slice(0, 5)
    .map(({ row, matches }, index) => ({
      hskCode: row.hsk_code,
      hs6: row.hs6,
      rank: index + 1,
      confidenceScore: Math.max(0.38, Math.min(0.68, 0.46 + matches.length * 0.06 - index * 0.03)),
      koreanName: row.korean_name || row.english_name || row.hsk_code,
      reason: "저장된 HS 검색 데이터에서 조회된 HS CODE 후보입니다. 실제 제품의 기능, 재질, 구성, 용도에 따라 하위 세번이 달라질 수 있습니다.",
      requiredQuestions: [
        "저장 데이터 기반 후보이므로 품목분류 확정 전 제품 사양 확인 필요",
        row.quantity_unit || row.weight_unit ? `단위: 수량 ${row.quantity_unit || "-"} / 중량 ${row.weight_unit || "-"}` : "수량·중량 단위 확인 필요",
        "카탈로그, 성분/재질, 용도, 모델별 사양서"
      ],
      riskNotes: "저장 HS 검색 데이터 결과는 조회 후보이며 품목분류 확정이 아닙니다.",
      scoreBreakdown: matches.map((term) => `저장 HS 검색 데이터 보조어: ${term}`),
      lookupBasis: "customs_api",
      reviewStatus: "suggested" as const,
      sourceName: row.source_name,
      sourceUrl: row.source_url,
      sourceVersion: row.source_version,
      effectiveFrom: row.effective_from,
      effectiveTo: row.effective_to,
      basisDate: input.basisDate
    }));
}

function dbIlikePattern(term: string) {
  return `%${term.replace(/[\\%_]/g, "\\$&")}%`;
}

function uniqueByHskCode<T extends { hsk_code: string }>(rows: T[]) {
  return [...rows.reduce((best, row) => {
    if (!best.has(row.hsk_code)) best.set(row.hsk_code, row);
    return best;
  }, new Map<string, T>()).values()];
}

async function findHsMasterRowsByTerms(
  supabase: SupabaseClient,
  input: ProductHsRecommendationInput,
  terms: string[]
) {
  const collected: HsMasterSearchRow[] = [];
  const queryTerms = terms.filter((term) => !hsMasterMaterialOnlyTerms.has(term)).slice(0, 8);

  for (const term of queryTerms) {
    for (const field of ["korean_name", "english_name"] as const) {
      const { data, error } = await supabase
        .from("hs_master")
        .select("hsk_code, hs6, korean_name, english_name, source_name, source_url, source_version, effective_from, effective_to")
        .ilike(field, dbIlikePattern(term))
        .lte("effective_from", input.basisDate)
        .or(`effective_to.is.null,effective_to.gte.${input.basisDate}`)
        .eq("status", "published")
        .order("hsk_code")
        .limit(8);

      if (error) throw new Error(error.message);
      collected.push(...((data ?? []) as HsMasterSearchRow[]));
    }
  }

  return uniqueByHskCode(collected);
}

async function findStoredCustomsHsCodeRowsByTerms(
  supabase: SupabaseClient,
  input: ProductHsRecommendationInput,
  terms: string[]
) {
  const collected: CustomsHsCodeSearchRow[] = [];
  const queryTerms = terms.filter((term) => !hsMasterMaterialOnlyTerms.has(term)).slice(0, 8);

  for (const term of queryTerms) {
    for (const field of ["korean_name", "english_name"] as const) {
      const { data, error } = await supabase
        .from("customs_hs_code_search_items")
        .select("hsk_code, hs6, korean_name, english_name, quantity_unit, weight_unit, rate_text, rate_type_code, source_name, source_url, source_version, effective_from, effective_to")
        .ilike(field, dbIlikePattern(term))
        .lte("effective_from", input.basisDate)
        .or(`effective_to.is.null,effective_to.gte.${input.basisDate}`)
        .eq("status", "published")
        .order("hsk_code")
        .limit(8);

      if (error) throw new Error(error.message);
      collected.push(...((data ?? []) as CustomsHsCodeSearchRow[]));
    }
  }

  return uniqueByHskCode(collected);
}

async function findStandardProductNameRowsByTerms(
  supabase: SupabaseClient,
  input: ProductHsRecommendationInput,
  terms: string[]
) {
  const collected: StandardProductNameSearchRow[] = [];
  const queryTerms = terms.filter((term) => !hsMasterMaterialOnlyTerms.has(term)).slice(0, 8);

  for (const term of queryTerms) {
    for (const field of ["standard_name_kr", "standard_name_en", "required_spec_kr", "detailed_classification"] as const) {
      const { data, error } = await supabase
        .from("standard_product_names")
        .select("hsk_code, standard_name_kr, standard_name_en, required_spec_kr, detailed_classification, source_name, source_url, source_version, effective_from, effective_to")
        .ilike(field, dbIlikePattern(term))
        .lte("effective_from", input.basisDate)
        .or(`effective_to.is.null,effective_to.gte.${input.basisDate}`)
        .eq("status", "published")
        .order("hsk_code")
        .limit(8);

      if (error) throw new Error(error.message);
      collected.push(...((data ?? []) as StandardProductNameSearchRow[]));
    }
  }

  return uniqueByHskCode(collected);
}

async function findHsMasterRowsByExactCodes(
  supabase: SupabaseClient,
  input: ProductHsRecommendationInput,
  hskCodes: string[]
) {
  const codes = Array.from(new Set(hskCodes.map((code) => code.replace(/[^0-9]/g, "")).filter((code) => code.length === 10)));
  if (!codes.length) return [];

  const { data, error } = await supabase
    .from("hs_master")
    .select("hsk_code, hs6, korean_name, english_name, source_name, source_url, source_version, effective_from, effective_to")
    .in("hsk_code", codes)
    .lte("effective_from", input.basisDate)
    .or(`effective_to.is.null,effective_to.gte.${input.basisDate}`)
    .eq("status", "published")
    .order("hsk_code");

  if (error) throw new Error(error.message);
  return (data ?? []) as HsMasterSearchRow[];
}

async function recommendHsCandidatesFromStandardProductNames(
  supabase: SupabaseClient,
  input: ProductHsRecommendationInput,
  normalization: AiProductSearchNormalizationResult | null,
  terms: string[],
  analysis: ProductNameSearchAnalysis
) {
  const standardRows = await findStandardProductNameRowsByTerms(supabase, input, terms);
  if (!standardRows.length) return [];

  const hskRows = await findHsMasterRowsByExactCodes(supabase, input, standardRows.map((row) => row.hsk_code));
  const hskByCode = new Map(hskRows.map((row) => [row.hsk_code, row]));
  const scored = standardRows
    .map((row) => ({
      row,
      hsk: hskByCode.get(row.hsk_code),
      score: scoreStandardNameWithTerms(row, terms),
      fallbackScore: scoreStandardNameWithTerms(row, analysis.terms)
    }))
    .map((item) => ({ ...item, score: Math.max(item.score, item.fallbackScore) }))
    .filter((item) => item.hsk && item.score > 0)
    .sort((a, b) => b.score - a.score || a.row.hsk_code.localeCompare(b.row.hsk_code))
    .slice(0, 5);

  return scored.map(({ row, hsk, score }, index) => {
    const hintReason = reasonForHsCodeHint(normalization, row.hsk_code, hsk!.hs6);
    const matchedTerms = terms.filter((term) =>
      `${row.standard_name_kr} ${row.standard_name_en ?? ""} ${row.required_spec_kr ?? ""} ${row.detailed_classification ?? ""}`.toLowerCase().includes(term)
    );

    return {
      hskCode: row.hsk_code,
      hs6: hsk!.hs6,
      rank: index + 1,
      confidenceScore: Math.max(0.42, Math.min(0.74, 0.48 + score * 0.04 - index * 0.03)),
      koreanName: hsk!.korean_name,
      reason: hintReason
        ? `${hintReason.reason} 공식 표준품명 데이터와 함께 대조한 예비 후보입니다.`
        : "공식 표준품명 데이터에서 입력 품명 단서와 맞는 예비 HS 후보입니다. 실제 제품 사양 확인이 필요합니다.",
      requiredQuestions: [
        row.required_spec_kr ? `표준품명 필수규격 확인: ${row.required_spec_kr}` : null,
        ...(hintReason?.requiredInfo ?? []),
        ...(normalization?.missingQuestions ?? []),
        "카탈로그, 제품 사양서, 재질·성분, 용도 확인"
      ].filter((question): question is string => Boolean(question)).filter((question, questionIndex, questions) => questions.indexOf(question) === questionIndex).slice(0, 4),
      riskNotes: "공식 표준품명 기반 검색 결과는 예비 후보이며 품목분류 확정이 아닙니다.",
      scoreBreakdown: [
        "공식 표준품명 조회",
        ...matchedTerms.slice(0, 4).map((term) => `표준품명 보조어 ${term}`)
      ],
      lookupBasis: "official_name_match" as const,
      reviewStatus: "suggested" as const,
      sourceName: row.source_name,
      sourceUrl: row.source_url,
      sourceVersion: row.source_version,
      effectiveFrom: row.effective_from,
      effectiveTo: row.effective_to,
      basisDate: input.basisDate
    };
  });
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
        confidenceScore: item.fromCodeHint
          ? Math.max(0.64, Math.min(0.86, 0.68 + item.score * 0.025 - index * 0.02))
          : Math.max(0.34, Math.min(0.7, 0.44 + item.score * 0.035 - index * 0.03)),
        koreanName: item.row.korean_name,
        reason: hintReason
          ? `${hintReason.reason} 해당 HS 후보의 류·호·소호 설명을 함께 확인해야 합니다.`
          : item.fromCodeHint
          ? "AI가 제시한 HS 후보입니다. 실제 기능, 구성, 용도에 따라 하위 세번 확인이 필요합니다."
          : "AI가 해석한 품명 단서로 조회한 HS 후보입니다. 실제 기능, 구성, 용도에 따라 하위 세번 확인이 필요합니다.",
        requiredQuestions: [
          ...(hintReason?.requiredInfo ?? []),
          ...(normalization?.missingQuestions ?? []),
          "카탈로그, 제품 사양서, 기능 설명, 완제품/부분품 여부 확인"
        ].filter((question, questionIndex, questions) => questions.indexOf(question) === questionIndex).slice(0, 4),
        riskNotes: "AI 검색 보조 결과이며 품목분류 확정이 아닙니다.",
        scoreBreakdown: [
          item.fromCodeHint ? "AI HS 후보 상세 조회" : "AI 품명 단서 조회",
          ...item.matches.slice(0, 5).map((term) => `조회 보조어 ${term}`)
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
    const score = 5
      + matches.length * 2
      + Math.min(row.hsk_code.length, 10) / 10
      + (reasonedHint ? 2 : 0)
      + aiCodeHintRankBonus(normalization, row.hsk_code, row.hs6);
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
  if (!normalization?.candidateHsCodes.length) return [];
  const analysis = analyzeProductNameInput(input);
  const terms = hsMasterSearchTerms(analysis, normalization);
  return rankOfficialHsMasterRows(
    input,
    normalization,
    terms,
    [],
    mockHsMasterRowsByCodeHints(input, normalization.candidateHsCodes)
  );
}

async function recommendHsCandidatesFromOfficialHsMasterSearch(
  supabase: SupabaseClient,
  input: ProductHsRecommendationInput,
  normalization: AiProductSearchNormalizationResult | null
): Promise<HsCandidateRecommendation[]> {
  const analysis = analyzeProductNameInput(input);
  const terms = hsMasterSearchTerms(analysis, normalization);
  const codeHints = normalization?.candidateHsCodes ?? [];
  if (!codeHints.length && !terms.length) return [];

  const [
    codeHintRows,
    termRows,
    standardNameCandidates,
    storedCustomsCandidates
  ] = await Promise.all([
    codeHints.length ? findHsMasterRowsByCodeHints(supabase, input, codeHints).catch(() => []) : Promise.resolve([]),
    terms.length ? findHsMasterRowsByTerms(supabase, input, terms).catch(() => []) : Promise.resolve([]),
    terms.length ? recommendHsCandidatesFromStandardProductNames(supabase, input, normalization, terms, analysis).catch(() => []) : Promise.resolve([]),
    terms.length
      ? findStoredCustomsHsCodeRowsByTerms(supabase, input, terms)
        .then((rows) => mapStoredCustomsHsCodeSearchRowsToCandidates(input, rows, terms))
        .catch(() => [])
      : Promise.resolve([])
  ]);

  return mergeRecommendations([
    ...rankOfficialHsMasterRows(input, normalization, terms, termRows, codeHintRows),
    ...standardNameCandidates,
    ...storedCustomsCandidates
  ]);
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

function focusHighCertaintySingleRecommendation(
  candidates: HsCandidateRecommendation[],
  normalization: AiProductSearchNormalizationResult | null,
  options: { keepAmbiguousAlternatives: boolean }
) {
  if (options.keepAmbiguousAlternatives || candidates.length <= 1) return candidates;
  if (normalization?.certainty !== "high" || normalization.displayMode !== "single") return candidates;

  const primaryCode = normalization.primaryCandidate?.code.replace(/[^0-9]/g, "");
  const focusedCode = primaryCode || normalizeAiHsCodeHints(normalization)[0];
  if (!focusedCode) return candidates;

  const candidate = candidates.find((item) => candidateMatchesCodeHint(item, focusedCode));
  return candidate ? [{ ...candidate, rank: 1 }] : candidates.slice(0, 1).map((item) => ({ ...item, rank: 1 }));
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

function productNormalizationTelemetryShape(normalization: AiProductSearchNormalizationResult | null) {
  return {
    hasNormalization: Boolean(normalization),
    classificationState: normalization?.classificationState ?? null,
    certainty: normalization?.certainty ?? null,
    displayMode: normalization?.displayMode ?? null,
    hasPrimaryCandidate: Boolean(normalization?.primaryCandidate),
    missingQuestionCount: normalization?.missingQuestions.length ?? 0,
    searchTermCount: normalization?.searchTerms.length ?? 0,
    webSourceCount: normalization?.webSources.length ?? 0,
    normalizationCandidateCount: normalizeAiHsCodeHints(normalization).length
  };
}

function candidateTelemetryShape(candidates: HsCandidateRecommendation[]) {
  const codeLengths = candidates.map((candidate) => candidate.hskCode.replace(/\D/g, "").length);
  const hs6Count = codeLengths.filter((length) => length === 6).length;
  const hsk10Count = codeLengths.filter((length) => length === 10).length;
  const topCandidate = candidates[0];
  const aiHintCount = candidates.filter((candidate) => candidate.lookupBasis === "ai_hs_hint").length;
  const officialMatchCount = candidates.filter((candidate) => candidate.lookupBasis === "official_name_match" || candidate.lookupBasis === "customs_api").length;
  const fallbackLikeCount = candidates.filter((candidate) => candidate.lookupBasis === "ai_term_match" || !candidate.lookupBasis).length;
  const onlyProvisionalHs6 = candidates.length > 0 && hs6Count === candidates.length && aiHintCount === candidates.length;

  return {
    finalHs6Count: hs6Count,
    finalHsk10Count: hsk10Count,
    topLookupBasis: topCandidate?.lookupBasis ?? null,
    topHsLevel: codeLengths[0] ?? null,
    finalAiHintCount: aiHintCount,
    finalOfficialMatchCount: officialMatchCount,
    finalFallbackLikeCount: fallbackLikeCount,
    onlyProvisionalHs6,
    candidateQualityType: onlyProvisionalHs6
      ? "hs6_only_provisional"
      : candidates.length === 0
        ? "empty"
        : hsk10Count > 0
          ? "hsk10_available"
          : "non_hsk10_candidates"
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
    reason: "입력값에 포함된 HS CODE 힌트를 기준으로 조회한 후보입니다. 품명, 용도, 재질과의 일치 여부 확인이 필요합니다.",
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
  const startedAt = Date.now();
  const { input: augmentedInput, normalization } = await normalizedProductSearch(input);
  const isAmbiguousAcronym = Boolean(ambiguousRuleForProductName(input.productName));
  const shouldKeepAiAlternatives = isAmbiguousAcronym
    || normalization?.classificationState === "ambiguous_multiple_meanings"
    || normalization?.displayMode === "multiple";

  if (!hasSupabaseEnv()) {
    const baseCandidates = [
      ...recommendAmbiguousProductCandidates(input),
      ...recommendHsCandidatesFromMockOfficialHsMasterSearch(augmentedInput, normalization)
    ];
    const aiHintCandidates = recommendAiHsCodeHintCandidates(augmentedInput, normalization, baseCandidates);
    const fallbackCandidates = !shouldKeepAiAlternatives && !baseCandidates.length && !aiHintCandidates.length
      ? recommendHsCandidates(augmentedInput)
      : [];

    const candidates = focusHighCertaintySingleRecommendation(pruneByUserHsHints(
      input,
      pruneWeakProductRecommendations(
        mergeRecommendations([...baseCandidates, ...aiHintCandidates, ...fallbackCandidates]),
        { keepAmbiguousAlternatives: shouldKeepAiAlternatives }
      )
    ), normalization, { keepAmbiguousAlternatives: shouldKeepAiAlternatives });
    logLookupTelemetry("product_candidates_recommended", {
      ...productInputShape(input),
      status: "success",
      sourceMode: "mock",
      durationMs: Date.now() - startedAt,
      resultCount: candidates.length,
      aiHintCount: aiHintCandidates.length,
      officialCandidateCount: baseCandidates.length,
      fallbackCandidateCount: fallbackCandidates.length,
      ...candidateTelemetryShape(candidates),
      ...productNormalizationTelemetryShape(normalization)
    });
    return candidates;
  }

  try {
    const supabase = await createSupabaseServerClient();
    if (normalization && isBareProductCodeInput(input.productName) && normalization.webSources.length === 0 && !hasOfficialDataLookupHint(normalization)) {
      logLookupTelemetry("product_candidates_recommended", {
        ...productInputShape(input),
        status: "success",
        sourceMode: "supabase",
        durationMs: Date.now() - startedAt,
        resultCount: 0,
        aiHintCount: 0,
        officialCandidateCount: 0,
        ...candidateTelemetryShape([]),
        ...productNormalizationTelemetryShape(normalization),
        bareProductCodeWithoutSource: true
      });
      return [];
    }
    const officialHsMasterCandidates = await recommendHsCandidatesFromOfficialHsMasterSearch(
      supabase,
      augmentedInput,
      normalization
    ).catch(() => []);
    const nonApiNormalizedBaseCandidates = [
      ...officialHsMasterCandidates
    ];
    const aiHintCandidates = normalization
      ? recommendAiHsCodeHintCandidates(augmentedInput, normalization, nonApiNormalizedBaseCandidates)
      : [];
    const nonApiNormalizedCandidates = [
      ...nonApiNormalizedBaseCandidates,
      ...aiHintCandidates
    ];
    const fallbackCandidates = !shouldKeepAiAlternatives && !nonApiNormalizedCandidates.length
      ? recommendHsCandidates(augmentedInput)
      : [];
    const normalizedCandidates = [...nonApiNormalizedCandidates, ...fallbackCandidates];
    const merged = filterContextConflictingCandidates(augmentedInput, mergeRecommendations([
      ...recommendAmbiguousProductCandidates(input),
      ...normalizedCandidates
    ]));
    const candidates = focusHighCertaintySingleRecommendation(pruneByUserHsHints(input, pruneWeakProductRecommendations(merged, {
      keepAmbiguousAlternatives: shouldKeepAiAlternatives
    })), normalization, { keepAmbiguousAlternatives: shouldKeepAiAlternatives });
    logLookupTelemetry("product_candidates_recommended", {
      ...productInputShape(input),
      status: "success",
      sourceMode: "supabase",
      durationMs: Date.now() - startedAt,
      resultCount: candidates.length,
      aiHintCount: aiHintCandidates.length,
      officialCandidateCount: officialHsMasterCandidates.length,
      fallbackCandidateCount: fallbackCandidates.length,
      ...candidateTelemetryShape(candidates),
      ...productNormalizationTelemetryShape(normalization)
    });
    return candidates;
  } catch {
    if (isBareProductCodeInput(input.productName) && augmentedInput.productName !== input.productName && !hasOfficialDataLookupHint(normalization)) {
      logLookupTelemetry("product_candidates_recommended", {
        ...productInputShape(input),
        status: "fallback",
        sourceMode: "mock_after_supabase_error",
        durationMs: Date.now() - startedAt,
        resultCount: 0,
        aiHintCount: 0,
        officialCandidateCount: 0,
        ...candidateTelemetryShape([]),
        ...productNormalizationTelemetryShape(normalization),
        bareProductCodeWithoutSource: true
      });
      return [];
    }
    const mockOfficialCandidates = recommendHsCandidatesFromMockOfficialHsMasterSearch(augmentedInput, normalization);
    const aiHintCandidates = recommendAiHsCodeHintCandidates(augmentedInput, normalization, mockOfficialCandidates);
    const fallbackCandidates = !shouldKeepAiAlternatives && !mockOfficialCandidates.length && !aiHintCandidates.length
      ? recommendHsCandidates(augmentedInput)
      : [];
    const normalizedCandidates = [...mockOfficialCandidates, ...aiHintCandidates, ...fallbackCandidates];
    const merged = filterContextConflictingCandidates(augmentedInput, mergeRecommendations([
      ...recommendAmbiguousProductCandidates(input),
      ...normalizedCandidates
    ]));
    const candidates = focusHighCertaintySingleRecommendation(pruneByUserHsHints(input, pruneWeakProductRecommendations(merged, {
      keepAmbiguousAlternatives: shouldKeepAiAlternatives
    })), normalization, { keepAmbiguousAlternatives: shouldKeepAiAlternatives });
    logLookupTelemetry("product_candidates_recommended", {
      ...productInputShape(input),
      status: "fallback",
      sourceMode: "mock_after_supabase_error",
      durationMs: Date.now() - startedAt,
      resultCount: candidates.length,
      aiHintCount: aiHintCandidates.length,
      officialCandidateCount: mockOfficialCandidates.length,
      fallbackCandidateCount: fallbackCandidates.length,
      ...candidateTelemetryShape(candidates),
      ...productNormalizationTelemetryShape(normalization)
    });
    return candidates;
  }
}

export const hsCandidateServiceInternals = {
  searchTerms: productSearchTerms,
  scoreStandardName: scoreStandardNameWithTerms,
  mapStoredCustomsHsCodeSearchRowsToCandidates,
  recommendAiHsCodeHintCandidates,
  pruneWeakProductRecommendations,
  filterContextConflictingCandidates,
  ambiguousRuleForProductName,
  analyzeProductNameInput
};
