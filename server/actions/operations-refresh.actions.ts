"use server";

import { revalidatePath } from "next/cache";
import {
  operationsRefreshSchema,
  type OperationsRefreshActionState
} from "@/features/legal-updates/operations-refresh-schemas";
import { createSupabaseServiceRoleClient, hasSupabaseServiceRoleEnv } from "@/lib/supabase/service-role";

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : undefined;
}

type RefreshSnapshotsResult = {
  basisDate?: string;
  dashboardMetricsRefreshed?: boolean;
  destinationCoverageRefreshed?: boolean;
  refreshedAt?: string;
};

export async function refreshOperationsSnapshotsAction(
  _previousState: OperationsRefreshActionState,
  formData: FormData
): Promise<OperationsRefreshActionState> {
  const parsed = operationsRefreshSchema.safeParse({
    basisDate: stringValue(formData, "basisDate")
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "갱신 기준일을 확인해 주세요."
    };
  }

  if (!hasSupabaseServiceRoleEnv()) {
    return {
      status: "error",
      message: "SUPABASE_SERVICE_ROLE_KEY가 없어 운영 집계를 갱신할 수 없습니다."
    };
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase.rpc("refresh_operations_snapshots", {
    p_basis_date: parsed.data.basisDate
  });

  if (error) {
    return {
      status: "error",
      message: error.message
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/legal-updates");

  const result = (data ?? {}) as RefreshSnapshotsResult;
  return {
    status: "success",
    message: [
      `기준일 ${result.basisDate ?? parsed.data.basisDate} 운영 집계를 갱신했습니다.`,
      result.dashboardMetricsRefreshed ? "대시보드 지표 갱신 완료" : null,
      result.destinationCoverageRefreshed ? "목적국 커버리지 갱신 완료" : "목적국 커버리지 뷰 없음"
    ].filter(Boolean).join(" / ")
  };
}
