import type { SupabaseClient } from "@supabase/supabase-js";
import type { HsSearchRequestInput } from "@/features/hs/schemas";

export async function createHsSearchRequest(
  supabase: SupabaseClient,
  input: HsSearchRequestInput
) {
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("로그인 후 HS 요청을 생성할 수 있습니다.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.company_id) {
    throw new Error("회사 프로필이 연결된 사용자만 요청을 생성할 수 있습니다.");
  }

  const { data, error } = await supabase
    .from("hs_search_requests")
    .insert({
      company_id: profile.company_id,
      created_by: user.id,
      direction: input.direction,
      search_type: input.searchType,
      input_hs_code: input.inputHsCode || null,
      input_product_name: input.inputProductName || null,
      product_usage: input.productUsage || null,
      material: input.material || null,
      composition: input.composition || null,
      functions: input.functions || null,
      model_name: input.modelName || null,
      origin_country: input.originCountry || null,
      export_country: input.exportCountry || null,
      shipment_country: input.shipmentCountry || null,
      manufacturing_country: input.manufacturingCountry || null,
      seller_country: input.sellerCountry || null,
      destination_country: input.destinationCountry || null,
      basis_date: input.basisDate,
      status: "pending_review"
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data.id as string;
}
