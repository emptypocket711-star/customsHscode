import { Box } from "lucide-react";
import { redirect } from "next/navigation";
import { UpdatePasswordForm } from "@/features/auth/update-password-form";
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

export default async function UpdatePasswordPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?mode=reset");
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
            <h1 className="text-3xl font-semibold tracking-normal text-slate-950">새 비밀번호 설정</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">앞으로 사용할 비밀번호를 입력해 주세요.</p>
          </div>
          <UpdatePasswordForm />
        </section>
      </div>
    </main>
  );
}
