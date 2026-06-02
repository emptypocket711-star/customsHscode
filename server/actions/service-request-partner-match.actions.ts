"use server";

import { revalidatePath } from "next/cache";
import type { PartnerMatchInterestActionState } from "@/features/service-requests/partner-opportunity-interest-action-state";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { setServiceRequestPartnerMatchInterest } from "@/server/repositories/service-request-partner-match.repository";

function readFormString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function declineServiceRequestPartnerMatchAction(
  _prevState: PartnerMatchInterestActionState,
  formData: FormData
): Promise<PartnerMatchInterestActionState> {
  const matchId = readFormString(formData, "matchId");
  const requestId = readFormString(formData, "requestId");
  const requestType = readFormString(formData, "requestType");

  if (!matchId || !requestId || (requestType !== "freight" && requestType !== "clearance")) {
    return {
      message: "요청 정보를 확인할 수 없습니다.",
      status: "error"
    };
  }

  const supabase = await createSupabaseServerClient();

  try {
    const result = await setServiceRequestPartnerMatchInterest(supabase, {
      interestStatus: "declined",
      matchId
    });

    if (!result.schemaReady) {
      return {
        message: "플랫폼 매칭 데이터가 준비되지 않았습니다.",
        status: "error"
      };
    }

    revalidatePath(`/requests/${requestType}/opportunities/${requestId}`);

    return {
      message: "참여 보류 상태로 저장했습니다.",
      status: "success"
    };
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : "참여 보류 상태를 저장하지 못했습니다.",
      status: "error"
    };
  }
}
