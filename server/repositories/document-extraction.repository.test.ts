import { describe, expect, it } from "vitest";
import { sampleCommercialInvoiceText } from "@/features/documents/sample-document-text";
import {
  deriveDocumentProcessingStatus,
  mapExtractedLineItemToInsert,
  persistDocumentExtractionRpcName
} from "@/server/repositories/document-extraction.repository";
import { extractShipmentDocument } from "@/server/rules/document-extraction.service";

describe("document extraction repository helpers", () => {
  it("maps normalized line items into private review rows", () => {
    const extraction = extractShipmentDocument(sampleCommercialInvoiceText);
    const row = mapExtractedLineItemToInsert(
      {
        documentId: "00000000-0000-0000-0000-000000000001",
        requestId: "00000000-0000-0000-0000-000000000002",
        companyId: "00000000-0000-0000-0000-000000000003"
      },
      extraction.lineItems[0],
      extraction
    );

    expect(row.document_id).toBe("00000000-0000-0000-0000-000000000001");
    expect(row.product_name).toBe("Lithium-ion Battery Module");
    expect(row.raw_extraction.document_type).toBe("commercial_invoice");
    expect(row.raw_extraction.evidence.length).toBeGreaterThan(0);
  });

  it("marks extracted documents with correction candidates as needs_correction", () => {
    const extraction = extractShipmentDocument(sampleCommercialInvoiceText);
    expect(deriveDocumentProcessingStatus(extraction)).toBe("needs_correction");
  });

  it("uses the constrained document extraction persistence RPC", () => {
    expect(persistDocumentExtractionRpcName).toBe("persist_document_extraction");
  });
});
