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

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto mb-8 max-w-md">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-slate-950">통관이음 AI</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            HS CODE 조회와 회사별 검토 이력 저장을 위해 로그인 또는 회원가입을 진행해 주세요.
          </p>
        </div>
      </div>
      <AuthForm />
    </main>
  );
}
