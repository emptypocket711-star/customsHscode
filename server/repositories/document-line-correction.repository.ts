import type { SupabaseClient } from "@supabase/supabase-js";
import type { DocumentLineCorrectionInput } from "@/features/staff-review/schemas";

export const correctDocumentLineItemRpcName = "correct_document_line_item";

export function parseCorrectionsText(value?: string) {
  return (value ?? "")
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function correctDocumentLineItem(
  supabase: SupabaseClient,
  input: DocumentLineCorrectionInput
) {
  const { error } = await supabase.rpc(correctDocumentLineItemRpcName, {
    p_line_item_id: input.lineItemId,
    p_product_name: input.productName,
    p_model_name: input.modelName || null,
    p_origin_country: input.originCountry || null,
    p_shipment_country: input.shipmentCountry || null,
    p_destination_country: input.destinationCountry || null,
    p_incoterms: input.incoterms || null,
    p_quantity: input.quantity ?? null,
    p_unit: input.unit || null,
    p_unit_price: input.unitPrice ?? null,
    p_total_amount: input.totalAmount ?? null,
    p_currency: input.currency || null,
    p_required_corrections: parseCorrectionsText(input.requiredCorrectionsText),
    p_note: input.note || null
  });

  if (error) throw new Error(error.message);
}
