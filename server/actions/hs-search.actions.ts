"use server";

import { revalidatePath } from "next/cache";
import { hsSearchRequestSchema, type HsSearchActionState } from "@/features/hs/schemas";
import { createSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase/server";
import { createHsSearchRequest } from "@/server/repositories/hs-search.repository";

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : undefined;
}

export async function createHsSearchRequestAction(
  _previousState: HsSearchActionState,
  formData: FormData
): Promise<HsSearchActionState> {
  const parsed = hsSearchRequestSchema.safeParse({
    direction: stringValue(formData, "direction"),
    searchType: stringValue(formData, "searchType"),
    inputHsCode: stringValue(formData, "inputHsCode"),
    inputProductName: stringValue(formData, "inputProductName"),
    productUsage: stringValue(formData, "productUsage"),
    material: stringValue(formData, "material"),
    composition: stringValue(formData, "composition"),
    functions: stringValue(formData, "functions"),
    modelName: stringValue(formData, "modelName"),
    originCountry: stringValue(formData, "originCountry"),
    exportCountry: stringValue(formData, "exportCountry"),
    shipmentCountry: stringValue(formData, "shipmentCountry"),
    manufacturingCountry: stringValue(formData, "manufacturingCountry"),
    sellerCountry: stringValue(formData, "sellerCountry"),
    destinationCountry: stringValue(formData, "destinationCountry"),
    basisDate: stringValue(formData, "basisDate")
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "입력값을 확인해 주세요.",
      fieldErrors: parsed.error.flatten().fieldErrors
    };
  }

  if (!hasSupabaseEnv()) {
    return {
      status: "error",
      message: "Supabase 환경 변수가 없어 요청은 저장되지 않았습니다. .env.local 설정 후 다시 시도해 주세요."
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const requestId = await createHsSearchRequest(supabase, parsed.data);
    revalidatePath("/dashboard");

    return {
      status: "success",
      message: "HS 예비진단 요청이 생성되었습니다. 결과는 출처 기준의 예비 조회로 제공되며 HSK 확정 전 재확인이 필요합니다.",
      requestId
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "요청 생성 중 오류가 발생했습니다."
    };
  }
}
