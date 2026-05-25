import { redirect } from "next/navigation";
import { createSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase/server";
import { clearActiveUserSessionCookie } from "@/server/auth/session-policy";

export async function GET() {
  if (hasSupabaseEnv()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }

  await clearActiveUserSessionCookie();
  redirect("/login?reason=session-replaced");
}
