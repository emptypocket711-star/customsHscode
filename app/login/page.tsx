import { Box, CheckCircle2, Globe2 } from "lucide-react";
import { redirect } from "next/navigation";
import { AuthForm } from "@/features/auth/auth-form";
import { createSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase/server";

async function getCurrentUser() {
  if (!hasSupabaseEnv()) return null;

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

async function getPostAuthPath(userId: string) {
  if (!hasSupabaseEnv()) return "/dashboard";

  try {
    const supabase = await createSupabaseServerClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed_at")
      .eq("id", userId)
      .maybeSingle();

    return profile?.onboarding_completed_at ? "/dashboard" : "/auth/complete-signup";
  } catch {
    return "/auth/complete-signup";
  }
}

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ mode?: string; reason?: string }>;
}) {
  const user = await getCurrentUser();
  const params = await searchParams;
  const mode = params.mode === "signup" ? "signup" : params.mode === "reset" ? "reset" : "login";
  const notice =
    params.reason === "session-replaced"
      ? {
          tone: "warning" as const,
          message: "다른 위치에서 같은 개인회원 계정으로 로그인되어 현재 세션이 종료되었습니다. 다시 로그인해 주세요."
        }
      : undefined;

  if (user) {
    redirect(await getPostAuthPath(user.id));
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_20%_0%,#eef2ff_0,#f8fafc_42%,#ffffff_100%)] lg:bg-white lg:bg-[url('/login-hero.png')] lg:bg-cover lg:bg-center">
      <div className="grid min-h-screen lg:grid-cols-2">
        <section
          aria-label="HS FINDER 소개 이미지"
          className="hidden min-h-screen lg:block"
        >
          <div className="sr-only">HS FINDER 소개 이미지</div>
        </section>

        <section className="flex min-h-screen flex-col justify-between px-5 py-6 sm:px-8 lg:px-14 lg:py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 lg:hidden">
              <span className="grid size-10 place-items-center rounded-xl bg-blue-700 text-white">
                <Box aria-hidden="true" size={21} />
              </span>
              <span className="text-xl font-semibold text-slate-950">HS FINDER</span>
            </div>
            <div className="ml-auto flex items-center gap-4 text-sm font-semibold text-slate-700">
              <span className="inline-flex items-center gap-1.5">
                <Globe2 aria-hidden="true" size={16} />
                한국어
              </span>
              <span className="h-5 w-px bg-slate-200" />
              <span className="grid size-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-700">
                <CheckCircle2 aria-hidden="true" size={17} />
              </span>
            </div>
          </div>

          <div className="mx-auto flex w-full max-w-xl flex-1 items-center py-10">
            <AuthForm initialMode={mode} notice={notice} />
          </div>

          <footer className="grid gap-4 text-center text-sm text-slate-500">
            <div className="flex justify-center gap-7">
              <span>이용약관</span>
              <span>개인정보처리방침</span>
              <span>고객센터</span>
            </div>
            <p>© 2026 HS FINDER. All rights reserved.</p>
          </footer>
        </section>
      </div>
    </main>
  );
}
