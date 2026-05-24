import type { SupabaseClient } from "@supabase/supabase-js";
import type { HsConfirmationRequestInput } from "@/features/hs/schemas";
import { normalizeHsCode } from "@/lib/hs-code";

export const createHsConfirmationRequestRpcName = "create_hs_confirmation_request";

export async function createHsConfirmationRequest(
  supabase: SupabaseClient,
  input: HsConfirmationRequestInput
) {
  const supplementSnapshot = input.supplementSnapshot
    ? JSON.parse(input.supplementSnapshot) as Record<string, unknown>
    : {};

  const { data, error } = await supabase.rpc(createHsConfirmationRequestRpcName, {
    p_hsk_code: normalizeHsCode(input.hskCode),
    p_basis_date: input.basisDate,
    p_product_name: input.productName || null,
    p_user_note: input.userNote || null,
    p_supplement_snapshot: supplementSnapshot
  });

  if (error) throw new Error(error.message);
  if (typeof data !== "string") throw new Error("생성된 HS 확정 요청 ID를 확인할 수 없습니다.");

  return data;
}
