"use server";

import { revalidatePath } from "next/cache";
import {
  partnerPreferenceSchema,
  type PartnerPreferenceActionState
} from "@/features/partner-preferences/schemas";
import { createSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase/server";
import { upsertPartnerServicePreference } from "@/server/repositories/partner-preferences.repository";

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : undefined;
}

function stringArrayValue(formData: FormData, key: string) {
  return formData.getAll(key).filter((value): value is string => typeof value === "string" && value.trim().length > 0);
}

function booleanValue(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function csvValue(formData: FormData, key: string) {
  const value = stringValue(formData, key);
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function updatePartnerPreferenceAction(
  _previousState: PartnerPreferenceActionState,
  formData: FormData
): Promise<PartnerPreferenceActionState> {
  if (!hasSupabaseEnv()) {
    return {
      status: "error",
      message: "파트너 관심 조건 저장 환경을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요."
    };
  }

  const parsed = partnerPreferenceSchema.safeParse({
    cargoTags: csvValue(formData, "cargoTags"),
    destinationCountryCodes: csvValue(formData, "destinationCountryCodes"),
    digestEnabled: booleanValue(formData, "digestEnabled"),
    directions: stringArrayValue(formData, "directions"),
    notificationEnabled: booleanValue(formData, "notificationEnabled"),
    originCountryCodes: csvValue(formData, "originCountryCodes"),
    ports: csvValue(formData, "ports"),
    serviceType: stringValue(formData, "serviceType"),
    transportModes: stringArrayValue(formData, "transportModes"),
    urgentAvailable: booleanValue(formData, "urgentAvailable")
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "파트너 관심 조건 입력값을 확인해 주세요."
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const result = await upsertPartnerServicePreference(supabase, parsed.data);

    revalidatePath("/settings/members");

    return {
      status: "success",
      message: "파트너 관심 조건을 저장했습니다.",
      serviceType: result.serviceType
    };
  } catch {
    return {
      status: "error",
      message: "파트너 관심 조건을 저장하지 못했습니다. 회사 권한과 역할을 확인해 주세요.",
      serviceType: parsed.data.serviceType
    };
  }
}
