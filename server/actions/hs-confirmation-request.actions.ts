"use server";

import { revalidatePath } from "next/cache";
import {
  hsConfirmationRequestSchema,
  type HsConfirmationRequestActionState
} from "@/features/hs/schemas";
import { createSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase/server";
import { createHsConfirmationRequest } from "@/server/repositories/hs-confirmation-request.repository";

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : undefined;
}

export async function createHsConfirmationRequestAction(
  _previousState: HsConfirmationRequestActionState,
  formData: FormData
): Promise<HsConfirmationRequestActionState> {
  const parsed = hsConfirmationRequestSchema.safeParse({
    hskCode: stringValue(formData, "hskCode"),
    basisDate: stringValue(formData, "basisDate"),
    productName: stringValue(formData, "productName"),
    userNote: stringValue(formData, "userNote"),
    supplementSnapshot: stringValue(formData, "supplementSnapshot")
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "HS 확정 요청 입력값을 확인해 주세요."
    };
  }

  if (!hasSupabaseEnv()) {
    return {
      status: "error",
      message: "Supabase 환경 변수가 없어 HS 확정 요청을 생성하지 않았습니다."
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const requestId = await createHsConfirmationRequest(supabase, parsed.data);
    revalidatePath("/staff/review");

    return {
      status: "success",
      message: "HS 확정 요청이 접수되었습니다. 보완자료와 함께 검토 큐에서 확인합니다.",
      requestId
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "HS 확정 요청 생성 중 오류가 발생했습니다."
    };
  }
}
