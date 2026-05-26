"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  buildCustomsCargoProgressQuery,
  fetchCustomsOpenApiSnapshot,
  hasCustomsOpenApiEnv,
  parseCustomsCargoProgressXml,
  type CustomsCargoProgressResult
} from "@/server/integrations/customs/customs-api";

export type CargoTrackingActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  result?: CustomsCargoProgressResult;
  snapshot?: {
    sourceName: string;
    sourceUrl: string;
    sourceVersion: string;
    retrievedAt: string;
    checksum: string;
  };
};

export type CargoWatchActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

const cargoLookupSchema = z.object({
  cargoManagementNo: z.string().trim().max(80).optional(),
  masterBlNo: z.string().trim().max(80).optional(),
  houseBlNo: z.string().trim().max(80).optional(),
  blYear: z.string().trim().regex(/^\d{4}$/, "B/L 연도는 4자리로 입력해 주세요.").optional()
}).refine((input) => Boolean(input.cargoManagementNo || input.masterBlNo || input.houseBlNo), {
  message: "House B/L, Master B/L, 화물관리번호 중 하나 이상 입력해 주세요."
}).refine((input) => Boolean(input.cargoManagementNo || input.blYear), {
  message: "House B/L 또는 Master B/L로 조회할 때는 B/L 연도가 필요합니다."
});

const cargoWatchSchema = cargoLookupSchema.extend({
  targetStatus: z.string().trim().min(1, "알림 받을 진행 상태를 입력해 주세요.").max(80),
  notifyEmail: z.email("알림 받을 이메일을 확인해 주세요.")
});

const cargoWatchCancelSchema = z.object({
  id: z.uuid()
});

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : undefined;
}

function readCargoInput(formData: FormData) {
  const cargoManagementNo = stringValue(formData, "cargoManagementNo")?.trim();
  const masterBlNo = stringValue(formData, "masterBlNo")?.trim();
  const houseBlNo = stringValue(formData, "houseBlNo")?.trim();
  const cargoInputLooksLikeBl = Boolean(cargoManagementNo && cargoManagementNo.length < 15 && !masterBlNo && !houseBlNo);

  return {
    cargoManagementNo: cargoInputLooksLikeBl ? undefined : cargoManagementNo,
    masterBlNo,
    houseBlNo: cargoInputLooksLikeBl ? cargoManagementNo : houseBlNo,
    blYear: stringValue(formData, "blYear") || new Date().getFullYear().toString()
  };
}

export async function lookupCargoProgressAction(
  _previousState: CargoTrackingActionState,
  formData: FormData
): Promise<CargoTrackingActionState> {
  const parsed = cargoLookupSchema.safeParse(readCargoInput(formData));

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "조회 입력값을 확인해 주세요."
    };
  }

  if (!hasCustomsOpenApiEnv("cargo_progress")) {
    return {
      status: "error",
      message: "API001 화물통관진행정보 URL 또는 키가 설정되지 않았습니다."
    };
  }

  try {
    const snapshot = await fetchCustomsOpenApiSnapshot("cargo_progress", buildCustomsCargoProgressQuery(parsed.data), {
      timeoutMs: 15000
    });
    const result = parseCustomsCargoProgressXml(snapshot.rawText);

    if (!result) {
      return {
        status: "error",
        message: "조회 결과가 없습니다. B/L 번호 또는 화물관리번호를 확인해 주세요.",
        snapshot: {
          sourceName: snapshot.sourceName,
          sourceUrl: snapshot.sourceUrl,
          sourceVersion: snapshot.sourceVersion,
          retrievedAt: snapshot.retrievedAt,
          checksum: snapshot.checksum
        }
      };
    }

    return {
      status: "success",
      message: "화물통관진행정보를 조회했습니다.",
      result,
      snapshot: {
        sourceName: snapshot.sourceName,
        sourceUrl: snapshot.sourceUrl,
        sourceVersion: snapshot.sourceVersion,
        retrievedAt: snapshot.retrievedAt,
        checksum: snapshot.checksum
      }
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "화물통관진행정보 조회 중 오류가 발생했습니다.";
    return {
      status: "error",
      message: message === "fetch failed"
        ? "관세청 API001 호출에 실패했습니다. 잠시 후 다시 조회하거나 B/L 연도를 확인해 주세요."
        : message
    };
  }
}

export async function createCargoWatchAction(
  _previousState: CargoWatchActionState,
  formData: FormData
): Promise<CargoWatchActionState> {
  const parsed = cargoWatchSchema.safeParse({
    ...readCargoInput(formData),
    targetStatus: stringValue(formData, "targetStatus"),
    notifyEmail: stringValue(formData, "notifyEmail")
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "알림 등록 입력값을 확인해 주세요."
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return { status: "error", message: "로그인이 필요합니다." };
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile?.company_id) {
      return { status: "error", message: "사용자 회사 정보를 확인할 수 없습니다." };
    }

    const { error } = await supabase
      .from("cargo_watch_requests")
      .insert({
        company_id: profile.company_id,
        created_by: user.id,
        cargo_management_no: parsed.data.cargoManagementNo || null,
        master_bl_no: parsed.data.masterBlNo || null,
        house_bl_no: parsed.data.houseBlNo || null,
        bl_year: parsed.data.blYear || null,
        target_status: parsed.data.targetStatus,
        notify_email: parsed.data.notifyEmail,
        poll_interval_seconds: 60,
        status: "active"
      });

    if (error) throw error;

    revalidatePath("/cargo");
    return { status: "success", message: "1분 간격 알림 감시를 등록했습니다." };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "알림 감시를 등록하지 못했습니다."
    };
  }
}

export async function cancelCargoWatchAction(formData: FormData): Promise<void> {
  const parsed = cargoWatchCancelSchema.safeParse({
    id: stringValue(formData, "id")
  });

  if (!parsed.success) return;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user?.id) return;

  await supabase
    .from("cargo_watch_requests")
    .update({
      status: "cancelled",
      updated_at: new Date().toISOString()
    })
    .eq("id", parsed.data.id)
    .eq("created_by", user.id);

  revalidatePath("/cargo");
}
