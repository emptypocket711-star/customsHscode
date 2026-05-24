import { createSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase/server";

export type RoleGuardResult =
  | {
      allowed: true;
      mode: "mock" | "supabase";
      role: "admin" | "customs_staff" | "client" | "unknown";
      message?: string;
    }
  | {
      allowed: false;
      mode: "supabase";
      role: "client" | "unknown";
      message: string;
    };

export async function requireStaffRole(): Promise<RoleGuardResult> {
  if (!hasSupabaseEnv()) {
    return {
      allowed: true,
      mode: "mock",
      role: "admin",
      message: "Supabase 환경 변수가 없어 mock staff 권한으로 화면을 표시합니다."
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
      message: "로그인한 담당자만 접근할 수 있습니다."
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

  const role = String(data.role);
  if (role === "admin" || role === "customs_staff") {
    return {
      allowed: true,
      mode: "supabase",
      role
    };
  }

  return {
    allowed: false,
    mode: "supabase",
    role: "client",
    message: "담당자 또는 관리자만 접근할 수 있습니다."
  };
}
