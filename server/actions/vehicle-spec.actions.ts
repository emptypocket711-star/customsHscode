"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { checkRateLimitAsync, isRateLimitEnabled, rateLimitIdentity } from "@/lib/rate-limit";
import {
  CybertsVehicleSpecError,
  lookupCybertsVehicleSpec,
  type CybertsVehicleSpecResult
} from "@/server/services/cyberts-vehicle-spec.service";

export type VehicleSpecLookupActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  result?: CybertsVehicleSpecResult;
};

const vehicleSpecLookupSchema = z.object({
  specManageNo: z.string().trim().min(1, "제원관리번호를 입력해 주세요.").max(80, "제원관리번호는 80자 이내로 입력해 주세요.")
});

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function vehicleSpecErrorMessage(error: CybertsVehicleSpecError) {
  if (error.code === "blocked") {
    return "CyberTS 보안 정책으로 서버 자동 조회가 제한되었습니다. 원사이트에서 직접 조회하거나 잠시 후 다시 시도해 주세요.";
  }
  if (error.code === "csrf_missing") {
    return "CyberTS 조회 토큰을 확인하지 못했습니다. 원사이트 화면 구조가 변경되었을 수 있습니다.";
  }
  if (error.code === "not_found") {
    return error.message;
  }
  if (error.code === "network") {
    return "CyberTS 서버 연결에 실패했습니다. 잠시 후 다시 조회해 주세요.";
  }

  return error.message;
}

export async function lookupVehicleSpecAction(
  _previousState: VehicleSpecLookupActionState,
  formData: FormData
): Promise<VehicleSpecLookupActionState> {
  const parsed = vehicleSpecLookupSchema.safeParse({
    specManageNo: stringValue(formData, "specManageNo")
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "조회 입력값을 확인해 주세요."
    };
  }

  try {
    if (isRateLimitEnabled()) {
      const headerStore = await headers();
      const rateLimit = await checkRateLimitAsync({
        key: rateLimitIdentity({
          scope: "vehicle-spec",
          ip: headerStore.get("x-forwarded-for")?.split(",")[0] ?? headerStore.get("x-real-ip"),
          userAgent: headerStore.get("user-agent")
        }),
        limit: Number(process.env.VEHICLE_SPEC_RATE_LIMIT_PER_MINUTE || 20),
        windowMs: 60_000
      });

      if (!rateLimit.allowed) {
        return {
          status: "error",
          message: `자동차 제원 조회 요청이 많습니다. ${rateLimit.retryAfterSeconds}초 후 다시 시도해 주세요.`
        };
      }
    }

    const result = await lookupCybertsVehicleSpec(parsed.data.specManageNo);

    return {
      status: "success",
      message: "자동차 제원 정보를 조회했습니다.",
      result
    };
  } catch (error) {
    if (error instanceof CybertsVehicleSpecError) {
      return {
        status: "error",
        message: vehicleSpecErrorMessage(error)
      };
    }

    return {
      status: "error",
      message: error instanceof Error ? error.message : "자동차 제원 조회 중 오류가 발생했습니다."
    };
  }
}
