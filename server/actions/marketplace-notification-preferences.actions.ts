"use server";

import { revalidatePath } from "next/cache";
import {
  parseMarketplaceEmailNotificationPreferencesFormData,
  type MarketplaceEmailNotificationPreferencesActionState
} from "@/features/marketplace-notification-preferences/schemas";
import { createSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase/server";
import { upsertOwnMarketplaceEmailNotificationPreferences } from "@/server/repositories/marketplace-notification-preferences.repository";

export async function updateMarketplaceEmailNotificationPreferencesAction(
  _previousState: MarketplaceEmailNotificationPreferencesActionState,
  formData: FormData
): Promise<MarketplaceEmailNotificationPreferencesActionState> {
  if (!hasSupabaseEnv()) {
    return {
      message: "이메일 알림 설정 저장 환경을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      status: "error"
    };
  }

  let parsed: ReturnType<typeof parseMarketplaceEmailNotificationPreferencesFormData>;
  try {
    parsed = parseMarketplaceEmailNotificationPreferencesFormData(formData);
  } catch {
    return {
      message: "이메일 알림 설정 입력값을 확인해 주세요.",
      status: "error"
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    await upsertOwnMarketplaceEmailNotificationPreferences(supabase, parsed);

    revalidatePath("/settings/members");

    return {
      message: "이메일 알림 수신 설정을 저장했습니다.",
      status: "success"
    };
  } catch {
    return {
      message: "이메일 알림 수신 설정을 저장하지 못했습니다. 로그인 상태와 설정 권한을 확인해 주세요.",
      status: "error"
    };
  }
}
