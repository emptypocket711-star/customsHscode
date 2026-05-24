import type { SupabaseClient } from "@supabase/supabase-js";
import type { ExtractedLineItem } from "@/features/documents/mock-document-data";
import type { NormalizedShipmentDocument } from "@/server/rules/document-extraction.service";

export type PersistDocumentExtractionInput = {
  documentId: string;
  requestId: string;
  companyId: string;
  extraction: NormalizedShipmentDocument;
};

export const persistDocumentExtractionRpcName = "persist_document_extraction";

export function deriveDocumentProcessingStatus(extraction: NormalizedShipmentDocument) {
  const lineCorrectionCount = extraction.lineItems.reduce((sum, line) => sum + line.requiredCorrections.length, 0);
  return extraction.requiredCorrections.length || lineCorrectionCount ? "needs_correction" : "extracted";
}

export function mapExtractedLineItemToInsert(
  input: Omit<PersistDocumentExtractionInput, "extraction">,
  lineItem: ExtractedLineItem,
  extraction: NormalizedShipmentDocument
) {
  return {
    document_id: input.documentId,
    request_id: input.requestId,
    company_id: input.companyId,
    line_no: lineItem.lineNo,
    product_name: lineItem.productName,
    model_name: lineItem.modelName,
    origin_country: lineItem.originCountry,
    export_country: lineItem.exportCountry,
    shipment_country: lineItem.shipmentCountry,
    destination_country: lineItem.destinationCountry,
    incoterms: lineItem.incoterms,
    quantity: lineItem.quantity,
    unit: lineItem.unit,
    unit_price: lineItem.unitPrice,
    total_amount: lineItem.totalAmount,
    currency: lineItem.currency,
    confidence_score: lineItem.confidenceScore,
    required_corrections: lineItem.requiredCorrections,
    raw_extraction: {
      document_type: extraction.documentType,
      evidence: extraction.evidence.map((evidence) => ({
        field: evidence.field,
        value: evidence.value,
        source_text: evidence.sourceText,
        confidence_score: evidence.confidenceScore
      })),
      document_level_corrections: extraction.requiredCorrections
    }
  };
}

export async function persistDocumentExtraction(
  supabase: SupabaseClient,
  input: PersistDocumentExtractionInput
) {
  const scope = {
    documentId: input.documentId,
    requestId: input.requestId,
    companyId: input.companyId
  };
  const status = deriveDocumentProcessingStatus(input.extraction);
  const lineItems = input.extraction.lineItems.map((lineItem) => mapExtractedLineItemToInsert(scope, lineItem, input.extraction));
  const { data, error } = await supabase.rpc(persistDocumentExtractionRpcName, {
    p_document_id: input.documentId,
    p_request_id: input.requestId,
    p_status: status,
    p_line_items: lineItems
  });

  if (error) throw new Error(error.message);

  return {
    status: typeof data === "object" && data && "status" in data ? String(data.status) : status,
    lineItemCount: typeof data === "object" && data && "line_item_count" in data ? Number(data.line_item_count) : input.extraction.lineItems.length
  };
}
