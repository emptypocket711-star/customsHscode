import type { SupabaseClient } from "@supabase/supabase-js";
import type { DocumentLineHsRequestInput } from "@/features/staff-review/schemas";

export const createHsRequestFromDocumentLineItemRpcName = "create_hs_request_from_document_line_item";

export async function createHsRequestFromDocumentLineItem(
  supabase: SupabaseClient,
  input: DocumentLineHsRequestInput
) {
  const { data, error } = await supabase.rpc(createHsRequestFromDocumentLineItemRpcName, {
    p_line_item_id: input.lineItemId,
    p_direction: input.direction,
    p_basis_date: input.basisDate,
    p_note: input.note ?? null
  });

  if (error) throw new Error(error.message);
  if (typeof data !== "string") throw new Error("생성된 HS 요청 ID를 확인할 수 없습니다.");

  return data;
}
