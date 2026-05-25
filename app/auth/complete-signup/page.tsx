import { Box } from "lucide-react";
import { redirect } from "next/navigation";
import { SignupCompletionForm } from "@/features/auth/signup-completion-form";
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

async function getSignupState(userId: string) {
  if (!hasSupabaseEnv()) return { completed: false };

  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed_at")
    .eq("id", userId)
    .maybeSingle();

  return {
    completed: Boolean(profile?.onboarding_completed_at)
  };
}

function resolveAccountType(value: unknown) {
  return value === "personal" || value === "company" ? value : null;
}

export default async function CompleteSignupPage({
  searchParams
}: {
  searchParams: Promise<{ accountType?: string }>;
}) {
  const user = await getCurrentUser();
  const params = await searchParams;

  if (!user?.email) {
    redirect("/login?mode=signup");
  }

  const initialAccountType =
    resolveAccountType(params.accountType) ??
    resolveAccountType(user.user_metadata?.account_type);

  const signupState = await getSignupState(user.id);
  if (signupState.completed) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,#eef2ff_0,#f8fafc_42%,#ffffff_100%)] px-5 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-xl flex-col justify-center">
        <div className="mb-8 flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-blue-700 text-white">
            <Box aria-hidden="true" size={21} />
          </span>
          <span className="text-xl font-semibold text-slate-950">HS FINDER</span>
        </div>
        <section className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur sm:p-8">
          <div className="mb-7 text-center">
            <h1 className="text-3xl font-semibold tracking-normal text-slate-950">가입 정보 입력</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              이메일 인증이 완료되었습니다. 기본 정보를 입력해 주세요.
            </p>
            <p className="mt-2 text-xs font-semibold text-blue-700">{user.email}</p>
          </div>
          <SignupCompletionForm email={user.email} initialAccountType={initialAccountType} />
        </section>
      </div>
    </main>
  );
}
