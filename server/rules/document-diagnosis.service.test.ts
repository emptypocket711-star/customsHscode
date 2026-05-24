import { describe, expect, it } from "vitest";
import { getMockDocumentDiagnosisWorkflow, reconcileDocumentLineItems } from "@/server/rules/document-diagnosis.service";

describe("document diagnosis workflow", () => {
  it("returns private document metadata and extracted line items", () => {
    const workflow = getMockDocumentDiagnosisWorkflow();

    expect(workflow.documents[0]?.storagePath).toContain("company-mock-001/case-mock-001");
    expect(workflow.extractedLineItems[0]?.productName).toContain("Battery");
    expect(workflow.lineComparisons[0]?.productName).toContain("Battery");
    expect(workflow.workflowSteps.some((step) => step.status === "needs_review")).toBe(true);
  });

  it("does not return line items for an unknown case", () => {
    const workflow = getMockDocumentDiagnosisWorkflow("case-missing");

    expect(workflow.documents).toHaveLength(0);
    expect(workflow.extractedLineItems).toHaveLength(0);
    expect(workflow.lineComparisons).toHaveLength(0);
  });

  it("reconciles invoice and packing lines by product and model", () => {
    const comparisons = reconcileDocumentLineItems(
      [
        {
          lineNo: 1,
          productName: "Skin Care Cosmetics",
          modelName: "SK-100",
          originCountry: "KR",
          exportCountry: "KR",
          shipmentCountry: "KR",
          destinationCountry: "CN",
          incoterms: "FOB Busan",
          quantity: 120,
          unit: "EA",
          unitPrice: 10,
          totalAmount: 1200,
          currency: "USD",
          confidenceScore: 0.8,
          requiredCorrections: []
        }
      ],
      [
        {
          lineNo: 1,
          productName: "Skin Care Cosmetics",
          modelName: "SK-100",
          originCountry: null,
          exportCountry: null,
          shipmentCountry: null,
          destinationCountry: null,
          incoterms: null,
          quantity: 12,
          unit: "CTNS",
          unitPrice: null,
          totalAmount: null,
          currency: null,
          confidenceScore: 0.7,
          requiredCorrections: []
        }
      ]
    );

    expect(comparisons).toEqual([
      expect.objectContaining({
        invoiceLineNo: 1,
        packingLineNo: 1,
        status: "needs_check",
        notes: expect.arrayContaining([expect.stringContaining("수량 단위 상이")])
      })
    ]);
  });
});
