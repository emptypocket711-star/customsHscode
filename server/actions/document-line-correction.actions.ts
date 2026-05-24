"use server";

import { revalidatePath } from "next/cache";
import {
  documentLineCorrectionSchema,
  type StaffReviewActionState
} from "@/features/staff-review/schemas";
import { createSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase/server";
import { correctDocumentLineItem } from "@/server/repositories/document-line-correction.repository";

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : undefined;
}

export async function correctDocumentLineItemAction(
  _previousState: StaffReviewActionState,
  formData: FormData
): Promise<StaffReviewActionState> {
  const parsed = documentLineCorrectionSchema.safeParse({
    lineItemId: stringValue(formData, "lineItemId"),
    productName: stringValue(formData, "productName"),
    modelName: stringValue(formData, "modelName"),
    originCountry: stringValue(formData, "originCountry"),
    shipmentCountry: stringValue(formData, "shipmentCountry"),
    destinationCountry: stringValue(formData, "destinationCountry"),
    incoterms: stringValue(formData, "incoterms"),
    quantity: stringValue(formData, "quantity"),
    unit: stringValue(formData, "unit"),
    unitPrice: stringValue(formData, "unitPrice"),
    totalAmount: stringValue(formData, "totalAmount"),
    currency: stringValue(formData, "currency"),
    requiredCorrectionsText: stringValue(formData, "requiredCorrectionsText"),
    note: stringValue(formData, "note")
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "문서 보정 입력값을 확인해 주세요."
    };
  }

  if (!hasSupabaseEnv()) {
    return {
      status: "error",
      message: "Supabase 환경 변수가 없어 문서 보정값을 저장하지 않았습니다. mock 화면에서는 저장 액션을 비활성화합니다."
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    await correctDocumentLineItem(supabase, parsed.data);
    revalidatePath("/staff/review");

    return {
      status: "success",
      message: "문서 라인아이템 보정값이 저장되었습니다. HS 요청 생성 전 다시 확인해 주세요."
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "문서 라인아이템 보정 중 오류가 발생했습니다."
    };
  }
}
