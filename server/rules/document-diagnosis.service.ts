import {
  mockDocumentMetadata,
  mockExtractedLineItems,
  type DocumentMetadata,
  type ExtractedLineItem
} from "@/features/documents/mock-document-data";
import { getSampleExtractionBundle } from "@/server/rules/document-extraction.service";

export type DocumentLineComparison = {
  invoiceLineNo: number | null;
  packingLineNo: number | null;
  productName: string;
  modelName: string | null;
  status: "matched" | "needs_check" | "missing_invoice" | "missing_packing";
  notes: string[];
};

export type DocumentDiagnosisWorkflow = {
  caseId: string;
  documents: DocumentMetadata[];
  extractedLineItems: ExtractedLineItem[];
  lineComparisons: DocumentLineComparison[];
  workflowSteps: Array<{
    label: string;
    status: "done" | "needs_review" | "pending";
    note: string;
  }>;
  privacyNotices: string[];
};

function lineMatchKey(line: ExtractedLineItem) {
  return [line.productName, line.modelName ?? ""]
    .join("|")
    .toLowerCase()
    .replace(/[^a-z0-9|]/g, "");
}

export function reconcileDocumentLineItems(
  invoiceLines: ExtractedLineItem[],
  packingLines: ExtractedLineItem[]
): DocumentLineComparison[] {
  const packingByKey = new Map(packingLines.map((line) => [lineMatchKey(line), line]));
  const usedPackingKeys = new Set<string>();
  const comparisons = invoiceLines.map<DocumentLineComparison>((invoiceLine) => {
    const key = lineMatchKey(invoiceLine);
    const packingLine = packingByKey.get(key);

    if (!packingLine) {
      return {
        invoiceLineNo: invoiceLine.lineNo,
        packingLineNo: null,
        productName: invoiceLine.productName,
        modelName: invoiceLine.modelName,
        status: "missing_packing",
        notes: ["Packing List에서 같은 품명·모델 라인을 찾지 못했습니다."]
      };
    }

    usedPackingKeys.add(key);

    const notes = [
      invoiceLine.unit && packingLine.unit && invoiceLine.unit !== packingLine.unit
        ? `수량 단위 상이: Invoice ${invoiceLine.unit} / Packing ${packingLine.unit}`
        : null,
      invoiceLine.quantity !== null && packingLine.quantity !== null && invoiceLine.quantity !== packingLine.quantity
        ? `수량값 상이: Invoice ${invoiceLine.quantity.toLocaleString("ko-KR")} / Packing ${packingLine.quantity.toLocaleString("ko-KR")}`
        : null
    ].filter((note): note is string => Boolean(note));

    return {
      invoiceLineNo: invoiceLine.lineNo,
      packingLineNo: packingLine.lineNo,
      productName: invoiceLine.productName,
      modelName: invoiceLine.modelName,
      status: notes.length ? "needs_check" : "matched",
      notes: notes.length ? notes : ["품명·모델 기준으로 Invoice와 Packing List 라인이 연결되었습니다."]
    };
  });

  for (const packingLine of packingLines) {
    const key = lineMatchKey(packingLine);
    if (usedPackingKeys.has(key)) continue;

    comparisons.push({
      invoiceLineNo: null,
      packingLineNo: packingLine.lineNo,
      productName: packingLine.productName,
      modelName: packingLine.modelName,
      status: "missing_invoice",
      notes: ["Invoice에서 같은 품명·모델 라인을 찾지 못했습니다."]
    });
  }

  return comparisons;
}

export function getMockDocumentDiagnosisWorkflow(caseId = "case-mock-001"): DocumentDiagnosisWorkflow {
  const documents = mockDocumentMetadata.filter((document) => document.caseId === caseId);
  const extractedLineItems = documents.length ? mockExtractedLineItems : [];
  const sampleDocuments = getSampleExtractionBundle();
  const invoiceLines = sampleDocuments.find((document) => document.documentType === "commercial_invoice")?.lineItems ?? [];
  const packingLines = sampleDocuments.find((document) => document.documentType === "packing_list")?.lineItems ?? [];
  const lineComparisons = documents.length ? reconcileDocumentLineItems(invoiceLines, packingLines) : [];
  const needsCorrection = extractedLineItems.some((line) => line.requiredCorrections.length > 0);

  return {
    caseId,
    documents,
    extractedLineItems,
    lineComparisons,
    workflowSteps: [
      {
        label: "비공개 버킷 저장",
        status: "done",
        note: "회사/케이스 prefix 기반 private storage path 사용"
      },
      {
        label: "문서 메타데이터 기록",
        status: "done",
        note: "파일명, 유형, checksum, 업로드 상태만 저장"
      },
      {
        label: "라인아이템 추출",
        status: "done",
        note: "품명, 모델, 국가, Incoterms, 수량, 금액 필드 추출"
      },
      {
        label: "서류 간 대조",
        status: lineComparisons.some((item) => item.status !== "matched") ? "needs_review" : "done",
        note: "Invoice와 Packing List의 품명, 모델, 수량 단위 차이를 비교"
      },
      {
        label: "HS 추천/수출입 진단 연결",
        status: needsCorrection ? "pending" : "done",
        note: "보정 완료 후 품명 추천 또는 수입/수출 진단 요청으로 전환"
      }
    ],
    privacyNotices: [
      "Commercial Invoice 원문, 단가, 거래처 정보는 client log에 기록하지 않습니다.",
      "업로드 파일은 private bucket에 저장하고 회사/케이스 단위 RLS로 접근을 제한해야 합니다.",
      "추출 결과는 예비 데이터이며 품목분류와 수출입요건 판단에는 담당자 검토가 필요합니다."
    ]
  };
}
