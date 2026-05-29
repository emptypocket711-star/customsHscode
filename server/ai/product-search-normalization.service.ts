import { createHash } from "node:crypto";
import type { ProductHsRecommendationInput } from "@/features/hs/schemas";
import { getAiProvider, type AiProductSearchNormalizationResult } from "@/server/ai/provider";
import { redactSensitiveText } from "@/server/ai/redaction";
import { cachedLookup, lookupCacheKey } from "@/server/cache/lookup-cache";
import { logLookupTelemetry, productInputShape } from "@/server/observability/lookup-telemetry";

const productSearchNormalizationVersion = "product-search-normalization-v16";

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

function productContextText(input: ProductHsRecommendationInput, normalization?: AiProductSearchNormalizationResult) {
  return [
    input.productName,
    input.productUsage,
    input.material,
    input.composition,
    input.functions,
    input.modelName,
    normalization?.correctedProductName,
    ...(normalization?.searchTerms ?? []),
    ...(normalization?.koreanTerms ?? []),
    ...(normalization?.englishTerms ?? []),
    ...(normalization?.productFamilies ?? []),
    ...(normalization?.candidateHsCodeReasons.map((item) => `${item.reason} ${item.requiredInfo.join(" ")}`) ?? []),
  ].filter(Boolean).join(" ").toLowerCase();
}

function productContextLookupHints(input: ProductHsRecommendationInput, normalization?: AiProductSearchNormalizationResult) {
  const text = productContextText(input, normalization);
  const hints: Array<{ code: string; reason: string; requiredInfo: string[] }> = [];

  if (/(skin\s*care|skincare|cosmetic|cosmetics|hand\s*cream|handcream|moistur(?:e|izing|izer|iser)\s*cream|lotion|cleanser|toner|serum|화장품|기초화장|핸드\s*크림|보습\s*크림|로션|클렌저|세럼|피부)/i.test(text)) {
    hints.push({
      code: "330499",
      reason: "입력값에 피부 적용 화장품·기초화장품 문맥이 있어 제3304.99호 계열 확인이 우선 필요합니다.",
      requiredInfo: ["피부에 직접 사용하는 화장품인지", "의약품·의약외품 효능 표시 여부", "전성분표와 용량·사용 부위"]
    });
  }

  if (/(^|\s)(keyboard|keyboards|mechanical keyboard|wireless keyboard)(\s|$)|키보드|자판/.test(text)) {
    hints.push({
      code: "847160",
      reason: "입력값에 컴퓨터용 키보드 또는 입력장치 문맥이 있어 제8471.60호 계열 확인이 우선 필요합니다.",
      requiredInfo: ["키보드 완제품인지 키캡·스위치 등 부분품인지", "컴퓨터용 입력장치인지", "유선·무선 여부와 인터페이스"]
    });
  }

  if (/(electric\s*fan|portable\s*fan|handheld\s*fan|desk\s*fan|usb\s*fan|rechargeable\s*fan|선풍기|손\s*선풍기|휴대용\s*선풍기|탁상용\s*선풍기|미니\s*팬|전기\s*팬)/i.test(text)) {
    hints.push({
      code: "841451",
      reason: "입력값에 전기팬·휴대용 선풍기 완제품 문맥이 있어 제8414.51호 계열 확인이 우선 필요합니다.",
      requiredInfo: ["전동기를 내장한 팬 완제품인지", "출력과 날개/하우징 구조", "휴대용·탁상용·천장용 등 설치 형태", "배터리가 내장형인지 별도 배터리인지"]
    });
  }

  const vestLike = /(작업\s*용?\s*조끼|안전\s*조끼|반사\s*조끼|형광\s*조끼|보호\s*조끼|조끼|vest|waistcoat|safety\s*vest|work\s*vest|workwear\s*vest|reflective\s*vest|hi-?vis|high\s*visibility)/i.test(text);
  const workwearLike = /(작업복|보호복|안전복|산업용\s*의류|워크웨어|workwear|protective\s*clothing|industrial\s*uniform|coverall|overall)/i.test(text);
  if (vestLike || workwearLike) {
    if (vestLike) {
      hints.push(
        {
          code: "621133",
          reason: "작업용·안전·반사 조끼가 편직물이 아닌 직물제 인조섬유 의류일 가능성이 있습니다.",
          requiredInfo: ["편직물/뜨개질 제품인지 직물제 제품인지", "겉감 재질과 섬유 조성", "반사띠·형광색 등 안전용 기능 여부", "성별 구분 또는 공용 제품 여부"]
        },
        {
          code: "621143",
          reason: "여성용 또는 성별 구분이 있는 직물제 인조섬유 조끼라면 여성·소녀용 기타 의류 계열도 확인해야 합니다.",
          requiredInfo: ["남성용·여성용·공용 구분", "겉감 재질과 섬유 조성", "직물제인지 편직물인지"]
        },
        {
          code: "611030",
          reason: "니트·편직물로 만든 조끼라면 제6110.30호 계열과 경합될 수 있습니다.",
          requiredInfo: ["니트·편직물·뜨개질 제품인지", "합성섬유제인지", "일반 의류인지 보호·안전 기능이 있는지"]
        },
        {
          code: "6211",
          reason: "직물제 기타 의류로 넓게 검토해야 하는 조끼류일 가능성이 있습니다.",
          requiredInfo: ["직물/편직 구분", "재질", "성별 구분", "방수·코팅·보호 기능 여부"]
        }
      );
    } else {
      hints.push(
        {
          code: "6211",
          reason: "작업복·보호복류가 편직물이 아닌 직물제 기타 의류일 가능성이 있습니다.",
          requiredInfo: ["작업복 형태", "직물/편직 구분", "재질", "방수·코팅·보호 기능 여부"]
        },
        {
          code: "6113",
          reason: "고무·플라스틱 등을 침투·도포·피복한 편직물 의류라면 제6113호 계열 확인이 필요합니다.",
          requiredInfo: ["도포·코팅·피복 여부", "편직물 여부", "보호복 목적과 성능"]
        },
        {
          code: "6210",
          reason: "고무·플라스틱 등을 침투·도포·피복한 직물 의류라면 제6210호 계열 확인이 필요합니다.",
          requiredInfo: ["도포·코팅·피복 여부", "직물제 여부", "보호복 목적과 성능"]
        }
      );
    }
  }

  return hints;
}

type AiHsCodeReason = AiProductSearchNormalizationResult["candidateHsCodeReasons"][number];

function normalizedHsCode(code: string) {
  return code.replace(/[^0-9]/g, "");
}

const componentOrMaterialHintPatterns = [
  {
    prefixes: ["8507"],
    terms: ["battery", "batteries", "accumulator", "cell", "module", "pack", "배터리", "축전지", "전지", "셀", "모듈", "팩"]
  },
  {
    prefixes: ["4010"],
    terms: ["belt", "belts", "conveyor belt", "transmission belt", "벨트", "전동용 벨트", "컨베이어 벨트"]
  },
  {
    prefixes: ["3926", "7326", "7616"],
    terms: ["part", "parts", "component", "article of", "plastic article", "metal article", "부품", "부분품", "제품", "플라스틱 제품", "금속 제품"]
  }
];

const explicitComponentIntentTerms = [
  "replacement",
  "spare",
  "part",
  "parts",
  "component",
  "accessory",
  "battery only",
  "cell only",
  "module only",
  "교체용",
  "예비",
  "부품",
  "부분품",
  "구성품",
  "액세서리",
  "배터리만",
  "셀만",
  "모듈만"
];

function reasonTextForCode(reasons: AiHsCodeReason[], code: string) {
  return reasons
    .filter((reason) => {
      const reasonCode = normalizedHsCode(reason.code);
      return code.startsWith(reasonCode) || reasonCode.startsWith(code) || code.slice(0, 6) === reasonCode.slice(0, 6);
    })
    .map((reason) => `${reason.reason} ${reason.requiredInfo.join(" ")}`)
    .join(" ")
    .toLowerCase();
}

function isComponentOrMaterialHint(code: string, reasons: AiHsCodeReason[]) {
  const reasonText = reasonTextForCode(reasons, code);

  return componentOrMaterialHintPatterns.some((pattern) =>
    pattern.prefixes.some((prefix) => code.startsWith(prefix))
    && pattern.terms.some((term) => reasonText.includes(term.toLowerCase()))
  );
}

function hasExplicitComponentIntent(input: ProductHsRecommendationInput, normalization: AiProductSearchNormalizationResult) {
  const text = [
    input.productName,
    input.productUsage,
    input.material,
    input.composition,
    input.functions,
    input.modelName,
    normalization.correctedProductName,
    ...normalization.searchTerms,
    ...normalization.koreanTerms,
    ...normalization.englishTerms,
    ...normalization.productFamilies
  ].filter(Boolean).join(" ").toLowerCase();
  return explicitComponentIntentTerms.some((term) => text.includes(term.toLowerCase()));
}

export function prioritizePrincipalArticleHsHints(input: {
  productInput: ProductHsRecommendationInput;
  normalization: AiProductSearchNormalizationResult;
  userProvidedHsCodes: string[];
  candidateHsCodes: string[];
  candidateHsCodeReasons: AiHsCodeReason[];
}) {
  const normalizedUserHints = new Set(input.userProvidedHsCodes.map(normalizedHsCode));
  const codes = Array.from(new Set(input.candidateHsCodes.map(normalizedHsCode).filter((code) => code.length >= 4 && code.length <= 10)));
  if (codes.length <= 1 || hasExplicitComponentIntent(input.productInput, input.normalization)) return codes;

  const principalArticleCodes = codes.filter((code) =>
    !normalizedUserHints.has(code)
    && !isComponentOrMaterialHint(code, input.candidateHsCodeReasons)
  );
  if (!principalArticleCodes.length) return codes;

  return codes.filter((code) =>
    normalizedUserHints.has(code)
    || !isComponentOrMaterialHint(code, input.candidateHsCodeReasons)
  );
}

function focusedDisplayHsHints(normalization: AiProductSearchNormalizationResult, candidateHsCodes: string[]) {
  if (normalization.classificationState === "needs_clarification" || normalization.displayMode === "needs_more_info") {
    return [];
  }

  const primaryCode = normalization.primaryCandidate?.code.replace(/[^0-9]/g, "");
  if (
    normalization.certainty === "high"
    && normalization.displayMode === "single"
    && primaryCode
    && candidateHsCodes.some((code) => code === primaryCode || code.startsWith(primaryCode) || primaryCode.startsWith(code))
  ) {
    return [primaryCode];
  }

  return candidateHsCodes;
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
  const startedAt = Date.now();
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
  try {
    const normalization = await cachedLookup({
      key: cacheKey,
      ttlMs: Number(process.env.AI_NORMALIZATION_CACHE_TTL_MS || 7 * 24 * 60 * 60 * 1000),
      load: () => provider.normalizeProductSearch({
        task: "product_search_normalization",
        basisDate: input.basisDate,
        redactedInput: redacted.redactedText
      })
    });
    const needsClarificationFirst = normalization.classificationState === "needs_clarification" || normalization.displayMode === "needs_more_info";
    const strictClarificationWithoutHsBoundary = needsClarificationFirst
      && !normalization.candidateHsCodes.length
      && !normalization.primaryCandidate;
    const contextHints = strictClarificationWithoutHsBoundary ? [] : productContextLookupHints(input, normalization);

    const primaryCandidateReason = normalization.primaryCandidate
      ? [{
        code: normalization.primaryCandidate.code,
        reason: normalization.primaryCandidate.reason,
        requiredInfo: normalization.primaryCandidate.requiredInfo
      }]
      : [];
    const candidateHsCodeReasons = [
        ...userProvidedHsCodes.map((code) => ({
          code,
          reason: "사용자가 입력값에 함께 제공한 HS CODE 힌트입니다.",
          requiredInfo: ["국내 HSK인지 해외 수입국 세번인지 확인", "품명·용도·재질과 해당 코드 설명의 일치 여부 확인"]
        })),
        ...primaryCandidateReason,
        ...(strictClarificationWithoutHsBoundary ? [] : normalization.candidateHsCodeReasons),
        ...(needsClarificationFirst ? [] : acronymHints),
        ...contextHints
      ].filter((item, index, items) => items.findIndex((candidate) => candidate.code === item.code) === index).slice(0, 10);
    const primaryCandidateCode = normalization.primaryCandidate?.code ?? "";
    const prioritizedHsCodes = prioritizePrincipalArticleHsHints({
      productInput: input,
      normalization,
      userProvidedHsCodes,
      candidateHsCodes: [
        ...userProvidedHsCodes,
        ...(primaryCandidateCode ? [primaryCandidateCode] : []),
        ...(strictClarificationWithoutHsBoundary ? [] : normalization.candidateHsCodes),
        ...(needsClarificationFirst ? [] : acronymHints.map((hint) => hint.code)),
        ...contextHints.map((hint) => hint.code)
      ],
      candidateHsCodeReasons
    });
    const candidateHsCodes = (needsClarificationFirst
      ? (prioritizedHsCodes.length ? prioritizedHsCodes.slice(0, normalization.displayMode === "multiple" ? 3 : 1) : userProvidedHsCodes)
      : focusedDisplayHsHints(normalization, prioritizedHsCodes)
    ).slice(0, 10);
    const result = {
      ...normalization,
      candidateHsCodes,
      candidateHsCodeReasons
    };

    logLookupTelemetry("product_search_normalized", {
      ...productInputShape(input),
      status: "success",
      provider: provider.name,
      model: provider.model,
      durationMs: Date.now() - startedAt,
      candidateCount: result.candidateHsCodes.length,
      searchTermCount: result.searchTerms.length,
      webSourceCount: result.webSources.length,
      userHsHintCount: userProvidedHsCodes.length
    });

    return result;
  } catch (error) {
    logLookupTelemetry("product_search_normalized", {
      ...productInputShape(input),
      status: "error",
      provider: provider.name,
      model: provider.model,
      durationMs: Date.now() - startedAt,
      errorType: error instanceof Error ? error.name : "unknown"
    });
    throw error;
  }
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
    version: productSearchNormalizationVersion,
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
