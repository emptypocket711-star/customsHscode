import { createSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase/server";
import { isDeveloperEmail } from "@/server/auth/developer";

type AppRole = "developer" | "admin" | "customs_staff" | "client" | "unknown";

export type RoleGuardResult =
  | {
      allowed: true;
      mode: "mock" | "supabase";
      role: AppRole;
      message?: string;
    }
  | {
      allowed: false;
      mode: "supabase";
      role: "client" | "unknown";
      message: string;
    };

export async function requireDeveloperRole(): Promise<RoleGuardResult> {
  if (!hasSupabaseEnv()) {
    return {
      allowed: true,
      mode: "mock",
      role: "developer",
      message: "Supabase 환경 변수가 없어 mock developer 권한으로 화면을 표시합니다."
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      allowed: false,
      mode: "supabase",
      role: "unknown",
      message: "로그인한 개발자 계정만 접근할 수 있습니다."
    };
  }

  if (!isDeveloperEmail(user.email)) {
    return {
      allowed: false,
      mode: "supabase",
      role: "client",
      message: "운영 화면은 지정된 개발자 계정만 접근할 수 있습니다."
    };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || !data) {
    return {
      allowed: false,
      mode: "supabase",
      role: "unknown",
      message: "사용자 권한 프로필을 확인할 수 없습니다."
    };
  }

  const role = String(data.role) as AppRole;
  if (role === "developer" || role === "admin" || role === "customs_staff") {
    return {
      allowed: true,
      mode: "supabase",
      role,
      message: "지정된 개발자 계정으로 운영 화면에 접근했습니다."
    };
  }

  return {
    allowed: false,
    mode: "supabase",
    role: "client",
    message: "개발자 권한 프로필이 필요합니다."
  };
}

export const requireStaffRole = requireDeveloperRole;
