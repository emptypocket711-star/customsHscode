"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { buildCargoManagementInspectionEmailText, buildCargoWatchEmailText, cargoWatchStatusDisplay } from "@/lib/cargo-watch-status";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceRoleClient, hasSupabaseServiceRoleEnv } from "@/lib/supabase/service-role";
import { PublicDataFetchError } from "@/server/integrations/public-data/client";
import {
  buildCustomsCargoProgressQuery,
  fetchCustomsCargoProgressSnapshot,
  getCargoManagementInspectionInfo,
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

function cargoInspectionIdentity(input: {
  cargoManagementNo?: string | null;
  masterBlNo?: string | null;
  houseBlNo?: string | null;
  blYear?: string | null;
  notifyEmail?: string | null;
}) {
  return [
    normalizeCargoWatchValue(input.cargoManagementNo),
    normalizeCargoWatchValue(input.masterBlNo),
    normalizeCargoWatchValue(input.houseBlNo),
    normalizeCargoWatchValue(input.blYear),
    normalizeCargoWatchValue(input.notifyEmail).toLowerCase()
  ].join("|");
}

async function hasSentManagementInspectionNotice(notificationKey: string) {
  if (!hasSupabaseServiceRoleEnv()) return false;
  const { data, error } = await createSupabaseServiceRoleClient()
    .from("cargo_management_inspection_notifications")
    .select("id")
    .eq("notification_key", notificationKey)
    .maybeSingle();

  if (error) return false;
  return Boolean(data?.id);
}

async function recordManagementInspectionNotice(input: {
  notificationKey: string;
  notifyEmail: string;
  lookupValue: string;
  managementInspectionValue: string;
}) {
  if (!hasSupabaseServiceRoleEnv()) return;
  await createSupabaseServiceRoleClient()
    .from("cargo_management_inspection_notifications")
    .upsert({
      notification_key: input.notificationKey,
      notify_email: input.notifyEmail,
      lookup_value: input.lookupValue,
      management_inspection_value: input.managementInspectionValue,
      notified_at: new Date().toISOString()
    }, { onConflict: "notification_key" });
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

function normalizeCargoWatchValue(value: string | null | undefined) {
  return (value ?? "").trim().toUpperCase();
}

function cargoWatchIdentity(input: {
  cargoManagementNo?: string | null;
  masterBlNo?: string | null;
  houseBlNo?: string | null;
  blYear?: string | null;
  targetStatus?: string | null;
  notifyEmail?: string | null;
}) {
  return [
    normalizeCargoWatchValue(input.cargoManagementNo),
    normalizeCargoWatchValue(input.masterBlNo),
    normalizeCargoWatchValue(input.houseBlNo),
    normalizeCargoWatchValue(input.blYear),
    normalizeCargoWatchValue(input.targetStatus),
    normalizeCargoWatchValue(input.notifyEmail).toLowerCase()
  ].join("|");
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
    const watchKey = cargoWatchIdentity({
      ...parsed.data,
      notifyEmail: parsed.data.notifyEmail
    });
    const { data: activeWatches, error: duplicateLookupError } = await supabase
      .from("cargo_watch_requests")
      .select("id,cargo_management_no,master_bl_no,house_bl_no,bl_year,target_status,notify_email")
      .eq("company_id", profile.company_id)
      .eq("created_by", user.id)
      .eq("status", "active");

    if (duplicateLookupError) throw duplicateLookupError;

    const duplicateWatch = (activeWatches ?? []).find((watch) => cargoWatchIdentity({
      cargoManagementNo: watch.cargo_management_no,
      masterBlNo: watch.master_bl_no,
      houseBlNo: watch.house_bl_no,
      blYear: watch.bl_year,
      targetStatus: watch.target_status,
      notifyEmail: watch.notify_email
    }) === watchKey);

    if (duplicateWatch) {
      return {
        status: "success",
        message: "동일한 조회값, 목표 상태, 알림 이메일의 감시가 이미 작동 중입니다."
      };
    }

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
        managementInspectionValue: string | null;
        managementInspectionMailSent: boolean;
        managementInspectionMailError: string | null;
      }
      | {
        matched: false;
        lastStatus: string | null;
        snapshot?: undefined;
        mailSent?: undefined;
        mailError?: undefined;
        managementInspectionValue?: string | null;
        managementInspectionMailSent?: boolean;
        managementInspectionMailError?: string | null;
      } = { matched: false, lastStatus: null };

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
          const lookupValue = parsed.data.cargoManagementNo || parsed.data.houseBlNo || parsed.data.masterBlNo || "등록 화물";
          const lastStatus = statusCandidates.displayCurrentStatus || statusCandidates.currentStatus || result.summary.progressStatus || null;
          const managementInspection = getCargoManagementInspectionInfo(result);
          let managementInspectionMailSent = false;
          let managementInspectionMailError: string | null = null;

          if (managementInspection.isTarget) {
            const inspectionKey = cargoInspectionIdentity({
              ...parsed.data,
              notifyEmail: parsed.data.notifyEmail
            });
            const alreadySentInspectionNotice = await hasSentManagementInspectionNotice(inspectionKey);
            if (alreadySentInspectionNotice) {
              managementInspectionMailSent = true;
            } else {
              const inspectionMailResult = await sendTransactionalEmail({
                to: parsed.data.notifyEmail,
                subject: `[HS Finder] ${lookupValue} 관리대상검사 안내`,
                text: buildCargoManagementInspectionEmailText({
                  lookupValue,
                  currentStatus: lastStatus || "",
                  managementInspectionYn: managementInspection.value || "Y"
                })
              });
              managementInspectionMailSent = inspectionMailResult.sent;
              managementInspectionMailError = inspectionMailResult.sent ? null : inspectionMailResult.message;
              if (inspectionMailResult.sent) {
                await recordManagementInspectionNotice({
                  notificationKey: inspectionKey,
                  notifyEmail: parsed.data.notifyEmail,
                  lookupValue,
                  managementInspectionValue: managementInspection.value || "Y"
                });
              }
            }
          }

          if (matched) {
            const targetStatusLabel = cargoWatchStatusDisplay(parsed.data.targetStatus);
            const mailResult = await sendTransactionalEmail({
              to: parsed.data.notifyEmail,
              subject: `[HS Finder] ${lookupValue} ${targetStatusLabel} 상태 알림`,
              text: buildCargoWatchEmailText({
                lookupValue,
                targetStatus: parsed.data.targetStatus,
                currentStatus: lastStatus || parsed.data.targetStatus,
                alreadyReached: true
              })
            });

            immediateMatch = {
              matched: true,
              lastStatus: lastStatus || parsed.data.targetStatus,
              snapshot: {
                sourceName: snapshot.sourceName,
                sourceUrl: snapshot.sourceUrl,
                sourceVersion: snapshot.sourceVersion,
                retrievedAt: snapshot.retrievedAt,
                checksum: snapshot.checksum
              },
              mailSent: mailResult.sent,
              mailError: mailResult.sent ? null : mailResult.message,
              managementInspectionValue: managementInspection.isTarget ? (managementInspection.value || "Y") : null,
              managementInspectionMailSent,
              managementInspectionMailError
            };
          } else {
            immediateMatch = {
              matched: false,
              lastStatus,
              managementInspectionValue: managementInspection.isTarget ? (managementInspection.value || "Y") : null,
              managementInspectionMailSent,
              managementInspectionMailError
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
        poll_interval_seconds: 300,
        status: immediateMatch.matched && immediateMatch.mailSent ? "matched" : "active",
        last_status: immediateMatch.lastStatus,
        last_checked_at: immediateMatch.lastStatus ? now : null,
        next_check_at: now,
        matched_at: immediateMatch.matched && immediateMatch.mailSent ? now : null,
        notified_at: immediateMatch.matched && immediateMatch.mailSent ? now : null,
        management_inspection_notified_at: immediateMatch.managementInspectionMailSent ? now : null,
        management_inspection_value: immediateMatch.managementInspectionValue ?? null,
        last_error: [
          immediateMatch.matched && !immediateMatch.mailSent ? `목표 상태 도달 확인, 메일 발송 실패: ${immediateMatch.mailError}` : null,
          immediateMatch.managementInspectionValue && !immediateMatch.managementInspectionMailSent
            ? `관리대상검사 안내 메일 발송 실패: ${immediateMatch.managementInspectionMailError}`
            : null
        ].filter(Boolean).join(" / ") || null,
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
          ? immediateMatch.managementInspectionMailSent
            ? "이미 목표 상태가 지나간 건으로 확인되어 상태 알림과 관리대상검사 안내 메일을 보냈습니다."
            : "이미 목표 상태가 지나간 건으로 확인되어 즉시 알림 메일을 보냈습니다."
          : `이미 목표 상태가 지나간 건으로 확인했지만 메일 발송에 실패했습니다. ${immediateMatch.mailError ?? ""}`.trim()
      };
    }

    return {
      status: "success",
      message: immediateMatch.managementInspectionMailSent
        ? "5분 간격 알림 감시를 등록했고, 관리대상검사 안내 메일을 보냈습니다."
        : "5분 간격 알림 감시를 등록했습니다."
    };
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
