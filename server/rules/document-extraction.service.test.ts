import { describe, expect, it } from "vitest";
import {
  documentExtractionInternals,
  extractShipmentDocument,
  getSampleExtractionBundle
} from "@/server/rules/document-extraction.service";
import {
  sampleBillOfLadingText,
  sampleCommercialInvoiceText,
  samplePackingListText
} from "@/features/documents/sample-document-text";

describe("document extraction service", () => {
  it("detects common shipping document types", () => {
    expect(documentExtractionInternals.detectDocumentType(sampleCommercialInvoiceText)).toBe("commercial_invoice");
    expect(documentExtractionInternals.detectDocumentType(samplePackingListText)).toBe("packing_list");
    expect(documentExtractionInternals.detectDocumentType(sampleBillOfLadingText)).toBe("bill_of_lading");
  });

  it("extracts invoice line items into normalized fields", () => {
    const result = extractShipmentDocument(sampleCommercialInvoiceText);

    expect(result.invoiceNo).toBe("CI-2026-001");
    expect(result.lineItems).toHaveLength(2);
    expect(result.lineItems[0]?.productName).toBe("Lithium-ion Battery Module");
    expect(result.lineItems[0]?.totalAmount).toBe(5100);
    expect(result.lineItems[0]?.currency).toBe("USD");
  });

  it("keeps evidence and correction flags for mixed document samples", () => {
    const bundle = getSampleExtractionBundle();

    expect(bundle.flatMap((doc) => doc.evidence).length).toBeGreaterThan(0);
    expect(bundle.find((doc) => doc.documentType === "packing_list")?.requiredCorrections.length).toBeGreaterThan(0);
  });

  it("extracts packing list item candidates for invoice comparison", () => {
    const result = extractShipmentDocument(samplePackingListText);

    expect(result.lineItems).toHaveLength(2);
    expect(result.lineItems[0]).toEqual(
      expect.objectContaining({
        productName: "Lithium-ion Battery Module",
        modelName: "BAT-2400",
        quantity: 12,
        unit: "CTNS",
        unitPrice: null,
        totalAmount: null
      })
    );
    expect(result.lineItems[0]?.requiredCorrections).toContain("Invoice 라인과 품명·모델 대조 필요");
  });

  it("handles common invoice label variants and fixed-width item rows", () => {
    const text = `
COMMERCIAL INVOICE
CI No. CI-ALT-7788
Exporter: Seoul Cosmetics Co.
Sold To: Shanghai Buyer Ltd.
Terms of Delivery: CIF Shanghai
Origin: Korea
Country of Destination: China

Commodity                 Model       Quantity Unit   Unit Price   Amount
Skin Care Cosmetics       SK-100      1,200 EA       USD 2.50     USD 3000.00
Lip Make-up Preparation   LIP-20      240 EA         USD 1.20     USD 288.00
`;

    const result = extractShipmentDocument(text);

    expect(result.invoiceNo).toBe("CI-ALT-7788");
    expect(result.seller).toBe("Seoul Cosmetics Co.");
    expect(result.buyer).toBe("Shanghai Buyer Ltd.");
    expect(result.originCountry).toBe("KR");
    expect(result.destinationCountry).toBe("CN");
    expect(result.incoterms).toBe("CIF Shanghai");
    expect(result.lineItems).toHaveLength(2);
    expect(result.lineItems[0]).toEqual(
      expect.objectContaining({
        productName: "Skin Care Cosmetics",
        modelName: "SK-100",
        quantity: 1200,
        unit: "EA",
        unitPrice: 2.5,
        totalAmount: 3000,
        currency: "USD"
      })
    );
  });

  it("detects AWB documents separately from ocean B/L", () => {
    const result = extractShipmentDocument(`
AIR WAYBILL
AWB No. 180-12345678
Shipper: Seoul Parts Co.
Consignee: Tokyo Buyer
POL: ICN
POD: NRT
`);

    expect(result.documentType).toBe("air_waybill");
    expect(result.blNo).toBe("180-12345678");
  });

  it("extracts Korean shipping document labels", () => {
    const result = extractShipmentDocument(`
COMMERCIAL INVOICE
송장번호: KR-CI-2026-05
수출자: 서울화장품 주식회사
수입자: Shanghai Buyer Ltd.
인도조건: CIF Shanghai
선적항: Busan
양하항: Shanghai
원산지: 대한민국
목적국: 중국

Description of Goods | Model | Qty | Unit | Unit Price | Amount
Skin Care Cosmetics | SK-100 | 100 | EA | USD 2.50 | USD 250.00
`);

    expect(result.invoiceNo).toBe("KR-CI-2026-05");
    expect(result.seller).toBe("서울화장품 주식회사");
    expect(result.buyer).toBe("Shanghai Buyer Ltd.");
    expect(result.incoterms).toBe("CIF Shanghai");
    expect(result.portOfLoading).toBe("Busan");
    expect(result.portOfDischarge).toBe("Shanghai");
    expect(result.originCountry).toBe("KR");
    expect(result.destinationCountry).toBe("CN");
    expect(result.lineItems[0]?.productName).toBe("Skin Care Cosmetics");
  });

  it("extracts invoice rows from CSV-style Excel text export", () => {
    const result = extractShipmentDocument(`
Description,Model,Qty,Unit,Unit Price,Amount
"Skin Care Cosmetics",SK-100,100,EA,USD 2.50,USD 250.00
"Lip Make-up Preparation",LIP-20,20,EA,USD 1.20,USD 24.00
`);

    expect(result.documentType).toBe("commercial_invoice");
    expect(result.lineItems).toHaveLength(2);
    expect(result.lineItems[0]).toEqual(
      expect.objectContaining({
        productName: "Skin Care Cosmetics",
        modelName: "SK-100",
        quantity: 100,
        unit: "EA",
        unitPrice: 2.5,
        totalAmount: 250,
        currency: "USD"
      })
    );
  });
});
