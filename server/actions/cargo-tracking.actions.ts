"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PublicDataFetchError } from "@/server/integrations/public-data/client";
import {
  buildCustomsCargoProgressQuery,
  fetchCustomsCargoProgressSnapshot,
  hasCustomsOpenApiEnv,
  parseCustomsCargoProgressXml,
  type CustomsCargoProgressResult
} from "@/server/integrations/customs/customs-api";
import { sendTransactionalEmail } from "@/server/notifications/email";
import {
  buildCargoStatusCandidates,
  enrichCargoProgressResultWithShedInfo,
  loadCargoShedInfoByCode,
  statusMatched
} from "@/server/services/cargo-status-classifier";

export type CargoTrackingActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  diagnostic?: {
    category: string;
    endpoint: string;
    detail: string;
  };
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

function cargoNetworkFailureMessage(error: PublicDataFetchError) {
  if (error.category === "timeout") {
    return "관세청 API001 응답 시간이 초과되었습니다. 잠시 후 다시 조회해 주세요.";
  }
  if (error.category === "dns") {
    return "관세청 API001 서버 주소를 확인하지 못했습니다. 네트워크 또는 DNS 상태를 확인해야 합니다.";
  }
  if (error.category === "tls") {
    return "관세청 API001 보안 연결에 실패했습니다. 서버 인증서 또는 TLS 연결 상태를 확인해야 합니다.";
  }
  if (error.category === "outbound_port") {
    return "관세청 API001 전용 포트 연결에 실패했습니다. 운영 서버에서 UNIPASS 38010 포트 호출이 가능한지 확인해야 합니다.";
  }
  if (error.category === "network") {
    return "관세청 API001 서버 연결에 실패했습니다. 운영 서버의 외부 네트워크 호출 상태를 확인해야 합니다.";
  }
  return "관세청 API001 호출 중 알 수 없는 네트워크 오류가 발생했습니다.";
}

function cargoNetworkDiagnostic(error: PublicDataFetchError) {
  const endpoint = `${error.endpointHost}:${error.endpointPort}`;
  return {
    category: error.category,
    endpoint,
    detail: [error.causeCode, error.causeMessage].filter(Boolean).join(" / ") || "세부 원인 없음"
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
    const snapshot = await fetchCustomsCargoProgressSnapshot(buildCustomsCargoProgressQuery(parsed.data), {
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

    const supabase = await createSupabaseServerClient();
    const shedInfoByCode = await loadCargoShedInfoByCode(supabase, result.events);
    const enrichedResult = enrichCargoProgressResultWithShedInfo(result, shedInfoByCode);

    return {
      status: "success",
      message: "화물통관진행정보를 조회했습니다.",
      result: enrichedResult,
      snapshot: {
        sourceName: snapshot.sourceName,
        sourceUrl: snapshot.sourceUrl,
        sourceVersion: snapshot.sourceVersion,
        retrievedAt: snapshot.retrievedAt,
        checksum: snapshot.checksum
      }
    };
  } catch (error) {
    if (error instanceof PublicDataFetchError) {
      const diagnostic = cargoNetworkDiagnostic(error);
      console.error("[cargo_progress_api_failure]", diagnostic);

      return {
        status: "error",
        message: cargoNetworkFailureMessage(error),
        diagnostic
      };
    }

    const message = error instanceof Error ? error.message : "화물통관진행정보 조회 중 오류가 발생했습니다.";
    return {
      status: "error",
      message: message === "fetch failed"
        ? "관세청 API001 연결에 실패했습니다. 잠시 후 다시 조회해 주세요."
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

    const now = new Date().toISOString();
    let immediateMatch:
      | {
        matched: true;
        lastStatus: string;
        snapshot: {
          sourceName: string;
          sourceUrl: string;
          sourceVersion: string;
          retrievedAt: string;
          checksum: string;
        };
        mailSent: boolean;
        mailError: string | null;
      }
      | { matched: false; lastStatus: string | null; snapshot?: undefined; mailSent?: undefined; mailError?: undefined } = { matched: false, lastStatus: null };

    if (hasCustomsOpenApiEnv("cargo_progress")) {
      try {
        const snapshot = await fetchCustomsCargoProgressSnapshot(buildCustomsCargoProgressQuery(parsed.data), {
          timeoutMs: 15000
        });
        const result = parseCustomsCargoProgressXml(snapshot.rawText);
        if (result) {
          const shedInfoByCode = await loadCargoShedInfoByCode(supabase, result.events);
          const statusCandidates = buildCargoStatusCandidates(result, shedInfoByCode);
          const matched = statusMatched({
            targetStatus: parsed.data.targetStatus,
            currentStatus: statusCandidates.currentStatus,
            eventStatuses: statusCandidates.eventStatuses
          });

          if (matched) {
            const lookupValue = parsed.data.cargoManagementNo || parsed.data.houseBlNo || parsed.data.masterBlNo || "등록 화물";
            const lastStatus = statusCandidates.displayCurrentStatus || statusCandidates.currentStatus || parsed.data.targetStatus;
            const mailResult = await sendTransactionalEmail({
              to: parsed.data.notifyEmail,
              subject: `[HS Finder] ${lookupValue} ${parsed.data.targetStatus} 상태 알림`,
              text: [
                "등록하신 적하목록 감시 대상이 이미 지정한 상태에 도달했습니다.",
                "",
                `조회값: ${lookupValue}`,
                `목표 상태: ${parsed.data.targetStatus}`,
                `현재 상태: ${lastStatus}`,
                "",
                "통관 준비가 필요한 건인지 확인해 주세요."
              ].join("\n")
            });

            immediateMatch = {
              matched: true,
              lastStatus,
              snapshot: {
                sourceName: snapshot.sourceName,
                sourceUrl: snapshot.sourceUrl,
                sourceVersion: snapshot.sourceVersion,
                retrievedAt: snapshot.retrievedAt,
                checksum: snapshot.checksum
              },
              mailSent: mailResult.sent,
              mailError: mailResult.sent ? null : mailResult.message
            };
          } else {
            immediateMatch = {
              matched: false,
              lastStatus: statusCandidates.displayCurrentStatus || statusCandidates.currentStatus || null
            };
          }
        }
      } catch (error) {
        console.error("[cargo_watch_immediate_check_failure]", {
          message: error instanceof Error ? error.message : "unknown"
        });
      }
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
        status: immediateMatch.matched ? "matched" : "active",
        last_status: immediateMatch.lastStatus,
        last_checked_at: immediateMatch.lastStatus ? now : null,
        next_check_at: immediateMatch.matched ? now : now,
        matched_at: immediateMatch.matched ? now : null,
        notified_at: immediateMatch.matched && immediateMatch.mailSent ? now : null,
        last_error: immediateMatch.matched ? immediateMatch.mailError : null,
        source_name: immediateMatch.snapshot?.sourceName ?? null,
        source_url: immediateMatch.snapshot?.sourceUrl ?? null,
        source_version: immediateMatch.snapshot?.sourceVersion ?? null,
        retrieved_at: immediateMatch.snapshot?.retrievedAt ?? null,
        checksum: immediateMatch.snapshot?.checksum ?? null,
        updated_at: now
      });

    if (error) throw error;

    revalidatePath("/cargo");
    if (immediateMatch.matched) {
      return {
        status: immediateMatch.mailSent ? "success" : "error",
        message: immediateMatch.mailSent
          ? "이미 목표 상태가 지나간 건으로 확인되어 즉시 알림 메일을 보냈습니다."
          : `이미 목표 상태가 지나간 건으로 확인했지만 메일 발송에 실패했습니다. ${immediateMatch.mailError ?? ""}`.trim()
      };
    }

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
