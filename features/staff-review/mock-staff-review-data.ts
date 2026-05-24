export type HsCandidateReviewItem = {
  id: string;
  requestId: string;
  companyName: string;
  searchType: "hs_code" | "product_name" | "document";
  productName: string;
  hskCode: string;
  hs6: string;
  rank: number;
  confidenceScore: number;
  reason: string;
  requiredQuestions: string[];
  riskNotes: string;
  status: "suggested" | "selected" | "rejected" | "staff_confirmed";
  createdAt: string;
};

export type DocumentLineItemReviewItem = {
  id: string;
  requestId: string;
  documentId: string;
  companyName: string;
  lineNo: number;
  productName: string;
  modelName: string | null;
  originCountry: string | null;
  shipmentCountry: string | null;
  destinationCountry: string | null;
  incoterms: string | null;
  quantity: number | null;
  unit: string | null;
  unitPrice: number | null;
  totalAmount: number | null;
  currency: string | null;
  amountLabel: string;
  confidenceScore: number;
  requiredCorrections: string[];
  evidence: Array<{
    field: string;
    value: string;
    sourceText: string;
  }>;
  status: "pending_review" | "approved" | "rejected";
  createdAt: string;
};

export type HsConfirmationReviewItem = {
  id: string;
  companyName: string;
  hskCode: string;
  basisDate: string;
  productName: string | null;
  userNote: string | null;
  supplementQuestions: string[];
  recommendedMaterials: string[];
  status: "pending_review" | "approved" | "rejected";
  createdAt: string;
};

export const mockHsCandidateReviewItems: HsCandidateReviewItem[] = [
  {
    id: "candidate-review-001",
    requestId: "request-product-001",
    companyName: "샘플무역 주식회사",
    searchType: "product_name",
    productName: "리튬 배터리 모듈",
    hskCode: "8507601000",
    hs6: "850760",
    rank: 1,
    confidenceScore: 0.78,
    reason: "리튬이온 축전지 또는 배터리 모듈로 볼 가능성이 있어 후보로 제시되었습니다.",
    requiredQuestions: ["셀 단품입니까, 모듈/팩입니까?", "정격 전압과 용량은 얼마입니까?", "최종 사용처와 UN38.3 자료가 있습니까?"],
    riskNotes: "운송 위험물, 전기용품 안전, 수출 전략물자 예비 리스크 검토 필요",
    status: "suggested",
    createdAt: "2026-05-21T10:30:00+09:00"
  },
  {
    id: "candidate-review-002",
    requestId: "request-document-001",
    companyName: "샘플무역 주식회사",
    searchType: "document",
    productName: "Plastic Housing",
    hskCode: "3926909000",
    hs6: "392690",
    rank: 2,
    confidenceScore: 0.64,
    reason: "플라스틱 재질의 일반 부품 또는 기타 제품 가능성이 있어 후보로 제시되었습니다.",
    requiredQuestions: ["어떤 완제품에 장착되는 부품입니까?", "단독 기능이 있습니까?", "재질과 제조공정을 확인할 수 있습니까?"],
    riskNotes: "부분품 분류 가능성과 재질별 분류 경합은 담당자 검토 필요",
    status: "suggested",
    createdAt: "2026-05-21T10:35:00+09:00"
  }
];

export const mockHsConfirmationReviewItems: HsConfirmationReviewItem[] = [
  {
    id: "confirmation-review-001",
    companyName: "샘플무역 주식회사",
    hskCode: "842199",
    basisDate: "2026-05-24",
    productName: "PARTS",
    userNote: "인보이스 기재 HS 기준으로 확정 검토 요청",
    supplementQuestions: ["완성 장치인지 부분품인지", "필터 매체와 재질", "사용되는 장비 또는 산업 분야"],
    recommendedMaterials: ["장치 사양서", "구조도", "제품 사진"],
    status: "pending_review",
    createdAt: "2026-05-24T10:00:00+09:00"
  }
];

export const mockDocumentLineItemReviewItems: DocumentLineItemReviewItem[] = [
  {
    id: "line-review-001",
    requestId: "request-document-001",
    documentId: "doc-ci-001",
    companyName: "샘플무역 주식회사",
    lineNo: 1,
    productName: "Lithium-ion Battery Module",
    modelName: "BAT-2400",
    originCountry: "KR",
    shipmentCountry: "KR",
    destinationCountry: "DE",
    incoterms: "FOB Busan",
    quantity: 120,
    unit: "EA",
    unitPrice: 42.5,
    totalAmount: 5100,
    currency: "USD",
    amountLabel: "USD 5100",
    confidenceScore: 0.82,
    requiredCorrections: ["HSK 후보 선택 필요", "UN38.3 보유 여부 확인 필요", "최종사용자 확인 필요"],
    evidence: [
      { field: "originCountry", value: "KR", sourceText: "Country of Origin: KR" },
      { field: "destinationCountry", value: "DE", sourceText: "Destination Country: DE" }
    ],
    status: "pending_review",
    createdAt: "2026-05-21T10:32:00+09:00"
  },
  {
    id: "line-review-002",
    requestId: "request-document-001",
    documentId: "doc-ci-001",
    companyName: "샘플무역 주식회사",
    lineNo: 2,
    productName: "Plastic Housing",
    modelName: "CASE-100",
    originCountry: "KR",
    shipmentCountry: "KR",
    destinationCountry: "DE",
    incoterms: "FOB Busan",
    quantity: 120,
    unit: "EA",
    unitPrice: 3.2,
    totalAmount: 384,
    currency: "USD",
    amountLabel: "USD 384",
    confidenceScore: 0.74,
    requiredCorrections: ["재질 상세 확인 필요", "완제품 부분품 여부 확인 필요"],
    evidence: [
      { field: "incoterms", value: "FOB Busan", sourceText: "Incoterms: FOB Busan" }
    ],
    status: "pending_review",
    createdAt: "2026-05-21T10:33:00+09:00"
  }
];
