import { createHash } from "node:crypto";
import type { ProductHsRecommendationInput } from "@/features/hs/schemas";
import { getAiProvider, type AiProductSearchNormalizationResult } from "@/server/ai/provider";
import { redactSensitiveText } from "@/server/ai/redaction";
import { cachedLookup, lookupCacheKey } from "@/server/cache/lookup-cache";

function productInputText(input: ProductHsRecommendationInput) {
  const hsCodeHints = extractHsCodeHintsFromProductInput(input);

  return [
    `품명: ${input.productName}`,
    hsCodeHints.length ? `사용자 제공 HS CODE 힌트: ${hsCodeHints.join(", ")}` : null,
    input.productUsage ? `용도: ${input.productUsage}` : null,
    input.material ? `재질: ${input.material}` : null,
    input.composition ? `성분/구성: ${input.composition}` : null,
    input.functions ? `기능: ${input.functions}` : null,
    input.modelName ? `모델: ${input.modelName}` : null
  ].filter(Boolean).join("\n");
}

function hsCodeHintVariants(code: string) {
  const normalized = code.replace(/[^0-9]/g, "");
  if (normalized.length < 4) return [];

  if (normalized.length === 4) return [normalized];
  if (normalized.length === 6) return [normalized];
  if (normalized.length < 10) return [normalized, normalized.slice(0, 6)];
  return [normalized.slice(0, 10), normalized.slice(0, 6)];
}

function acronymLookupHints(input: ProductHsRecommendationInput) {
  const compactProductName = input.productName.trim().toLowerCase().replace(/[\s._-]+/g, "");
  if (compactProductName !== "esc") return [];

  return [
    {
      code: "847160",
      reason: "ESC가 컴퓨터 키보드의 Escape key 또는 키 입력장치 관련 약어일 가능성이 있습니다.",
      requiredInfo: ["키보드 완제품인지 키캡·스위치 등 부분품인지", "컴퓨터용 입력장치인지", "유선·무선 및 인터페이스"]
    },
    {
      code: "870830",
      reason: "ESC가 차량의 Electronic Stability Control 관련 제동 제어장치를 의미할 가능성이 있습니다.",
      requiredInfo: ["차량용 완성 제어장치인지 부분품인지", "ABS/ESC 모듈 포함 여부", "장착 대상 차종과 부품번호"]
    },
    {
      code: "848690",
      reason: "ESC가 반도체 제조 공정의 Electrostatic Chuck을 의미할 가능성이 있습니다.",
      requiredInfo: ["반도체 웨이퍼 고정용 정전척인지", "사용 장비와 공정", "제8486호 장비 전용 부분품인지"]
    }
  ];
}

export function extractHsCodeHintsFromText(text: string) {
  const hints: string[] = [];
  const labeledPattern = /(?:\bhs(?:k|code)?\b|hscode|hs\s*code|세번|소호|품목번호|세번부호)\s*[:：#-]?\s*((?:\d[\d.\-\s]{2,18}\d))/gi;
  const formattedPattern = /\b\d{4}[.\-\s]\d{2}(?:[.\-\s]?\d{2,6})?\b/g;
  const contiguousPattern = /\b\d{6}(?:\d{2}){0,3}\b/g;

  for (const pattern of [labeledPattern, formattedPattern, contiguousPattern]) {
    for (const match of text.matchAll(pattern)) {
      const rawCode = match[1] ?? match[0];
      hints.push(...hsCodeHintVariants(rawCode));
    }
  }

  return Array.from(new Set(hints.filter((code) => code.length >= 4 && code.length <= 10))).slice(0, 8);
}

export function extractHsCodeHintsFromProductInput(input: ProductHsRecommendationInput) {
  return extractHsCodeHintsFromText([
    input.productName,
    input.productUsage,
    input.material,
    input.composition,
    input.functions,
    input.modelName
  ].filter(Boolean).join(" "));
}

export async function normalizeProductSearchInput(input: ProductHsRecommendationInput): Promise<AiProductSearchNormalizationResult> {
  const redacted = redactSensitiveText(productInputText(input));
  const provider = getAiProvider();
  const userProvidedHsCodes = extractHsCodeHintsFromProductInput(input);
  const acronymHints = acronymLookupHints(input);
  const cacheKey = buildProductSearchNormalizationCacheKey({
    provider: provider.name,
    model: provider.model,
    basisDate: input.basisDate,
    redactedInput: redacted.redactedText,
    userProvidedHsCodes
  });
  const normalization = await cachedLookup({
    key: cacheKey,
    ttlMs: Number(process.env.AI_NORMALIZATION_CACHE_TTL_MS || 7 * 24 * 60 * 60 * 1000),
    load: () => provider.normalizeProductSearch({
      task: "product_search_normalization",
      basisDate: input.basisDate,
      redactedInput: redacted.redactedText
    })
  });

  return {
    ...normalization,
    candidateHsCodes: Array.from(new Set([
      ...userProvidedHsCodes,
      ...acronymHints.map((hint) => hint.code),
      ...normalization.candidateHsCodes
    ])).slice(0, 10),
    candidateHsCodeReasons: [
      ...userProvidedHsCodes.map((code) => ({
        code,
        reason: "사용자가 입력값에 함께 제공한 HS CODE 힌트입니다.",
        requiredInfo: ["국내 HSK인지 해외 수입국 세번인지 확인", "품명·용도·재질과 해당 코드 설명의 일치 여부 확인"]
      })),
      ...acronymHints,
      ...normalization.candidateHsCodeReasons
    ].filter((item, index, items) => items.findIndex((candidate) => candidate.code === item.code) === index).slice(0, 10)
  };
}

export function buildProductSearchNormalizationCacheKey(input: {
  provider: string;
  model: string;
  basisDate: string;
  redactedInput: string;
  userProvidedHsCodes: string[];
}) {
  const inputHash = createHash("sha256")
    .update(input.redactedInput)
    .digest("hex")
    .slice(0, 24);

  return lookupCacheKey("ai-product-normalization", {
    provider: input.provider,
    model: input.model,
    basisDate: input.basisDate,
    inputHash,
    hsHints: input.userProvidedHsCodes.join(",")
  });
}

export function augmentProductInputWithAiTerms(
  input: ProductHsRecommendationInput,
  normalization: AiProductSearchNormalizationResult
): ProductHsRecommendationInput {
  const expandedTerms = Array.from(new Set([
    normalization.correctedProductName,
    ...normalization.searchTerms,
    ...normalization.koreanTerms,
    ...normalization.englishTerms,
    ...normalization.productFamilies
  ].filter((term): term is string => Boolean(term?.trim()))));

  if (!expandedTerms.length) return input;

  return {
    ...input,
    productName: [input.productName, ...expandedTerms].join(" ")
  };
}
