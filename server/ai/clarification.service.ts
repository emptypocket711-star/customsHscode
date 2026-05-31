import type { HsCandidateRecommendation } from "@/server/rules/hs-candidate.service";
import type { NormalizedShipmentDocument } from "@/server/rules/document-extraction.service";
import { getAiProvider, type AiClarificationResult } from "@/server/ai/provider";
import { normalizeProductSearchInput } from "@/server/ai/product-search-normalization.service";
import { redactSensitiveText, type RedactionResult } from "@/server/ai/redaction";

export type ProductClarificationInput = {
  productName: string;
  productUsage?: string;
  material?: string;
  composition?: string;
  functions?: string;
  modelName?: string;
  basisDate: string;
  officialCandidates: HsCandidateRecommendation[];
};

export type ProductClarificationResult = AiClarificationResult & {
  redaction: RedactionResult["redactionCounts"];
  allowedCandidateCodes: string[];
};

export type DocumentClarificationResult = AiClarificationResult & {
  documentType: NormalizedShipmentDocument["documentType"];
  lineCount: number;
  redaction: RedactionResult["redactionCounts"];
};

function productInputText(input: ProductClarificationInput) {
  return [
    `품명: ${input.productName}`,
    input.productUsage ? `용도: ${input.productUsage}` : null,
    input.material ? `재질: ${input.material}` : null,
    input.composition ? `성분/구성: ${input.composition}` : null,
    input.functions ? `기능: ${input.functions}` : null,
    input.modelName ? `모델: ${input.modelName}` : null
  ].filter(Boolean).join("\n");
}

function uniqueStrings(values: string[], limit: number) {
  return values
    .map((value) => value.trim())
    .filter(Boolean)
    .filter((value, index, items) => items.indexOf(value) === index)
    .slice(0, limit);
}

function confidenceFromCandidates(candidates: HsCandidateRecommendation[]): AiClarificationResult["confidence"] {
  const topScore = Math.max(...candidates.map((candidate) => candidate.confidenceScore));
  if (topScore >= 0.82) return "high";
  if (topScore >= 0.6) return "medium";
  return "low";
}

function summarizeProductClarificationFromCandidates(
  input: ProductClarificationInput,
  redacted: RedactionResult,
  allowedCandidateCodes: string[]
): ProductClarificationResult | null {
  if (!input.officialCandidates.length) return null;

  const provider = getAiProvider();
  const sortedCandidates = [...input.officialCandidates].sort((a, b) =>
    b.confidenceScore - a.confidenceScore || a.hskCode.localeCompare(b.hskCode)
  );
  const missingQuestions = uniqueStrings([
    ...sortedCandidates.flatMap((candidate) => candidate.requiredQuestions),
    "제품의 실제 용도, 재질, 구성, 완제품/부분품 여부를 확인해 주세요."
  ], 6);
  const riskNotes = uniqueStrings([
    ...sortedCandidates.map((candidate) => candidate.riskNotes),
    "AI 보조 분석은 HS CODE를 확정하지 않으며, 실제 신고 전에는 품목분류 근거 확인이 필요합니다.",
    "관세율, 수입요건, FTA 적용 여부는 선택된 HSK 기준 공식 데이터로 별도 확인해야 합니다."
  ], 5);

  return {
    provider: provider.name,
    model: provider.model,
    confidence: confidenceFromCandidates(sortedCandidates),
    summary: sortedCandidates.length > 1
      ? "입력 품명과 공식 데이터 후보를 비교해 우선 검토할 HS CODE 후보와 보완 항목을 정리했습니다."
      : "입력 품명 기준으로 가장 유력한 HS CODE 후보와 확인이 필요한 보완 항목을 정리했습니다.",
    missingQuestions,
    suggestedCandidateCodes: sortedCandidates.slice(0, 5).map((candidate) => candidate.hskCode),
    riskNotes,
    redaction: redacted.redactionCounts,
    allowedCandidateCodes
  };
}

export async function analyzeProductClarification(input: ProductClarificationInput): Promise<ProductClarificationResult> {
  const allowedCandidateCodes = input.officialCandidates.map((candidate) => candidate.hskCode);
  const redacted = redactSensitiveText(productInputText(input));
  const candidateSummary = summarizeProductClarificationFromCandidates(input, redacted, allowedCandidateCodes);
  if (candidateSummary) return candidateSummary;

  if (!input.officialCandidates.length) {
    const normalization = await normalizeProductSearchInput({
      productName: input.productName,
      productUsage: input.productUsage,
      material: input.material,
      composition: input.composition,
      functions: input.functions,
      modelName: input.modelName,
      basisDate: input.basisDate
    }).catch(() => null);
    const suggestedCandidateCodes = normalization?.candidateHsCodes.slice(0, 6) ?? [];

    if (
      normalization
      && (normalization.classificationState === "needs_clarification"
        || normalization.displayMode === "needs_more_info"
        || suggestedCandidateCodes.length > 0)
    ) {
      const hasProvisionalDirection = suggestedCandidateCodes.length > 0;
      return {
        provider: normalization.provider,
        model: normalization.model,
        confidence: normalization.certainty === "high" ? "medium" : normalization.certainty === "medium" ? "medium" : "low",
        summary: normalization.userMessage ?? (hasProvisionalDirection
          ? "AI가 우선 검토할 HS 방향은 제시했지만, 현재 데이터에서 바로 표시할 수 있는 10자리 후보로 확장되지 않았습니다."
          : "HS CODE 특정에 필요한 정보가 부족합니다. 아래 조건을 보완하면 세번 후보를 좁힐 수 있습니다."),
        missingQuestions: normalization.missingQuestions.length
          ? normalization.missingQuestions
          : ["제품의 용도, 재질, 구성, 완제품/부분품 여부 확인이 필요합니다."],
        suggestedCandidateCodes,
        riskNotes: [
          hasProvisionalDirection
            ? "표시된 코드는 예비 검토 방향이며, 국가별 10자리 세번 확정에는 하위 품목 확인이 필요합니다."
            : "입력 정보만으로 세번을 특정하지 않고, 분류에 필요한 조건을 먼저 확인합니다.",
          "보완 정보가 입력되면 가장 유력한 HS 후보를 다시 조회합니다."
        ],
        redaction: redacted.redactionCounts,
        allowedCandidateCodes
      };
    }
  }

  const provider = getAiProvider();
  const result = await provider.clarify({
    task: "product_clarification",
    basisDate: input.basisDate,
    redactedInput: redacted.redactedText,
    candidates: input.officialCandidates.map((candidate) => ({
      hskCode: candidate.hskCode,
      hs6: candidate.hs6,
      koreanName: candidate.koreanName,
      confidenceScore: candidate.confidenceScore,
      reason: candidate.reason,
      requiredQuestions: candidate.requiredQuestions
    }))
  });

  return {
    ...result,
    suggestedCandidateCodes: result.suggestedCandidateCodes.filter((code) => allowedCandidateCodes.includes(code)),
    redaction: redacted.redactionCounts,
    allowedCandidateCodes
  };
}

function documentInputText(document: NormalizedShipmentDocument) {
  const header = [
    `문서유형: ${document.documentType}`,
    document.originCountry ? `원산지: ${document.originCountry}` : "원산지: 미추출",
    document.destinationCountry ? `목적국: ${document.destinationCountry}` : "목적국: 미추출",
    document.incoterms ? `인코텀즈: ${document.incoterms}` : "인코텀즈: 미추출"
  ];
  const lines = document.lineItems.map((line) => [
    `Line ${line.lineNo}`,
    `품명: ${line.productName}`,
    line.modelName ? `모델: ${line.modelName}` : "모델: 미추출",
    line.quantity ? `수량: ${line.quantity} ${line.unit ?? ""}` : "수량: 미추출",
    line.currency && line.totalAmount ? `금액: ${line.currency} ${line.totalAmount}` : "금액: 미추출",
    `보정항목: ${line.requiredCorrections.join(", ") || "없음"}`
  ].join(" / "));

  return [...header, ...lines].join("\n");
}

export async function analyzeDocumentExtractionClarification(
  document: NormalizedShipmentDocument,
  basisDate: string
): Promise<DocumentClarificationResult> {
  const redacted = redactSensitiveText(documentInputText(document));
  const provider = getAiProvider();
  const result = await provider.clarify({
    task: "document_line_clarification",
    basisDate,
    redactedInput: redacted.redactedText,
    candidates: []
  });
  const lineCorrections = document.lineItems.flatMap((line) => line.requiredCorrections).slice(0, 5);

  return {
    ...result,
    summary: document.lineItems.length
      ? `${document.documentType} 추출값 기준으로 품명·모델·국가·수량 필드의 보완 필요 항목을 정리했습니다.`
      : `${document.documentType}에서 라인아이템이 충분히 추출되지 않았습니다. 원문 표 구조 또는 OCR 품질 확인이 필요합니다.`,
    missingQuestions: [
      ...lineCorrections,
      ...result.missingQuestions,
      !document.originCountry ? "원산지 또는 제조국이 문서에 명확히 기재되어 있습니까?" : null,
      !document.destinationCountry ? "목적국 또는 최종 도착지가 문서에 명확히 기재되어 있습니까?" : null,
      !document.incoterms ? "거래조건(Incoterms)이 인보이스에 기재되어 있습니까?" : null
    ].filter((item): item is string => Boolean(item)).filter((item, index, items) => items.indexOf(item) === index).slice(0, 8),
    documentType: document.documentType,
    lineCount: document.lineItems.length,
    redaction: redacted.redactionCounts
  };
}
