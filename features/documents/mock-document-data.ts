export type DocumentType = "commercial_invoice" | "packing_list" | "bill_of_lading" | "air_waybill" | "certificate_of_origin" | "catalog" | "spec_sheet";

export type DocumentMetadata = {
  id: string;
  caseId: string;
  companyId: string;
  documentType: DocumentType;
  fileName: string;
  storagePath: string;
  mimeType: string;
  fileSize: number;
  checksum: string;
  uploadedAt: string;
  status: "uploaded" | "extracting" | "extracted" | "needs_correction";
};

export type ExtractedLineItem = {
  lineNo: number;
  productName: string;
  modelName: string | null;
  originCountry: string | null;
  exportCountry: string | null;
  shipmentCountry: string | null;
  destinationCountry: string | null;
  incoterms: string | null;
  quantity: number | null;
  unit: string | null;
  unitPrice: number | null;
  totalAmount: number | null;
  currency: string | null;
  confidenceScore: number;
  requiredCorrections: string[];
};

export const mockDocumentMetadata: DocumentMetadata[] = [
  {
    id: "doc-ci-001",
    caseId: "case-mock-001",
    companyId: "company-mock-001",
    documentType: "commercial_invoice",
    fileName: "Commercial_Invoice_MOCK.pdf",
    storagePath: "company-mock-001/case-mock-001/commercial-invoice.pdf",
    mimeType: "application/pdf",
    fileSize: 248120,
    checksum: "mock-ci-checksum-20260521",
    uploadedAt: "2026-05-21T10:20:00+09:00",
    status: "extracted"
  },
  {
    id: "doc-pl-001",
    caseId: "case-mock-001",
    companyId: "company-mock-001",
    documentType: "packing_list",
    fileName: "Packing_List_MOCK.pdf",
    storagePath: "company-mock-001/case-mock-001/packing-list.pdf",
    mimeType: "application/pdf",
    fileSize: 188040,
    checksum: "mock-pl-checksum-20260521",
    uploadedAt: "2026-05-21T10:21:00+09:00",
    status: "needs_correction"
  }
];

export const mockExtractedLineItems: ExtractedLineItem[] = [
  {
    lineNo: 1,
    productName: "Lithium-ion Battery Module",
    modelName: "BAT-2400",
    originCountry: "KR",
    exportCountry: "KR",
    shipmentCountry: "KR",
    destinationCountry: "DE",
    incoterms: "FOB Busan",
    quantity: 120,
    unit: "EA",
    unitPrice: 42.5,
    totalAmount: 5100,
    currency: "USD",
    confidenceScore: 0.82,
    requiredCorrections: ["HSK 후보 선택 필요", "UN38.3 보유 여부 확인 필요", "최종사용자 확인 필요"]
  },
  {
    lineNo: 2,
    productName: "Plastic Housing",
    modelName: "CASE-100",
    originCountry: "KR",
    exportCountry: "KR",
    shipmentCountry: "KR",
    destinationCountry: "DE",
    incoterms: "FOB Busan",
    quantity: 120,
    unit: "EA",
    unitPrice: 3.2,
    totalAmount: 384,
    currency: "USD",
    confidenceScore: 0.74,
    requiredCorrections: ["재질 상세 확인 필요", "완제품 부분품 여부 확인 필요"]
  }
];
