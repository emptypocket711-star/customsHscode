import type { HsCandidateRecommendation } from "@/server/rules/hs-candidate.service";
import type { NormalizedShipmentDocument } from "@/server/rules/document-extraction.service";
import { getAiProvider, type AiClarificationResult } from "@/server/ai/provider";
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

export async function analyzeProductClarification(input: ProductClarificationInput): Promise<ProductClarificationResult> {
  const allowedCandidateCodes = input.officialCandidates.map((candidate) => candidate.hskCode);
  const redacted = redactSensitiveText(productInputText(input));
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
