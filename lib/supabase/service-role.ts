import { createClient } from "@supabase/supabase-js";

export function hasSupabaseServiceRoleEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function createSupabaseServiceRoleClient() {
  if (!hasSupabaseServiceRoleEnv()) {
    throw new Error("Supabase service role 환경 변수가 설정되지 않았습니다.");
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    }
  );
}
