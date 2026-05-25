import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase/server";

const allowedTypes = new Set(["signup", "invite", "magiclink", "recovery", "email_change", "email"]);

function safeNextPath(value: string | null, type: string) {
  if (type === "recovery") return "/auth/update-password";
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/auth/complete-signup";
  return value;
}

function safeOtpType(value: string | null) {
  if (!value || !allowedTypes.has(value)) return "email";
  return value;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = safeOtpType(url.searchParams.get("type"));
  const next = safeNextPath(url.searchParams.get("next"), type);

  if (!tokenHash || !hasSupabaseEnv()) {
    return NextResponse.redirect(new URL("/login", url.origin));
  }

  const supabase = await createSupabaseServerClient({ rememberSession: true });
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type
  });

  if (error) {
    const mode = type === "recovery" ? "reset" : "signup";
    return NextResponse.redirect(new URL(`/login?mode=${mode}`, url.origin));
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
