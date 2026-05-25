import { Box, CheckCircle2, Globe2, Search, ShieldCheck, Zap } from "lucide-react";
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

const valueProps = [
  {
    title: "정확한 정보",
    description: "HS CODE, 관세율, 수출입요건을 기준일에 맞춰 조회합니다.",
    icon: Search
  },
  {
    title: "빠른 검색",
    description: "HS CODE, 품명, 제품코드 검색을 하나의 흐름으로 연결합니다.",
    icon: Zap
  },
  {
    title: "신뢰할 수 있는 데이터",
    description: "국가별 관세율과 수입요건 데이터를 업무 화면에 맞게 정리합니다.",
    icon: ShieldCheck
  }
];

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const user = await getCurrentUser();
  const params = await searchParams;
  const mode = params.mode === "signup" ? "signup" : "login";

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_18%_20%,#eef2ff_0,#f8fafc_34%,#ffffff_68%)]">
      <div className="mx-auto grid min-h-screen w-full max-w-[1480px] gap-8 px-5 py-6 lg:grid-cols-[minmax(0,1fr)_minmax(460px,620px)] lg:px-10">
        <section className="relative hidden min-h-[760px] flex-col justify-between overflow-hidden rounded-[28px] border border-white/70 bg-white/45 px-10 py-9 shadow-[0_24px_80px_rgba(31,41,55,0.08)] backdrop-blur lg:flex">
          <div className="pointer-events-none absolute -bottom-36 -right-28 size-[520px] rounded-full bg-blue-100/60 blur-3xl" />
          <div className="pointer-events-none absolute bottom-20 left-16 h-40 w-40 rounded-full border border-blue-100" />

          <div className="relative">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-blue-700 text-white shadow-lg shadow-blue-200">
                <Box aria-hidden="true" size={22} />
              </span>
              <span className="text-xl font-semibold tracking-normal text-slate-950">HS FINDER</span>
            </div>

            <div className="mt-20">
              <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
                2026년형 전문 관세 SaaS
              </span>
              <h1 className="mt-7 max-w-xl text-5xl font-semibold leading-[1.18] tracking-normal text-slate-950">
                HS CODE, 품명, 관세율을 정확하고 빠르게
              </h1>
              <p className="mt-6 max-w-lg text-base leading-7 text-slate-600">
                HS CODE 검색부터 품명 검토, 관세율 확인까지 무역 업무에 필요한 정보를 한 곳에서 조회합니다.
              </p>
            </div>

            <div className="mt-12 grid gap-5">
              {valueProps.map((item) => {
                const Icon = item.icon;
                return (
                  <div className="flex max-w-lg gap-4" key={item.title}>
                    <span className="grid size-12 shrink-0 place-items-center rounded-xl border border-slate-100 bg-white text-blue-700 shadow-sm">
                      <Icon aria-hidden="true" size={22} />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-slate-950">{item.title}</span>
                      <span className="mt-1 block text-sm leading-6 text-slate-600">{item.description}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative ml-auto mr-6 w-[430px] rounded-2xl border border-white/80 bg-white/70 p-5 shadow-2xl shadow-blue-100 backdrop-blur">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-red-200" />
                <span className="size-2.5 rounded-full bg-amber-200" />
                <span className="size-2.5 rounded-full bg-emerald-200" />
              </div>
              <span className="text-xs font-semibold text-slate-400">HS CODE</span>
            </div>
            <div className="grid gap-3 rounded-xl bg-slate-50 p-4">
              <div className="flex items-center justify-between rounded-lg bg-white px-3 py-3 shadow-sm">
                <span className="font-mono text-sm font-semibold text-blue-700">8471.60-9000</span>
                <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">0%</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="h-16 rounded-lg bg-white shadow-sm" />
                <div className="h-16 rounded-lg bg-white shadow-sm" />
                <div className="h-16 rounded-lg bg-white shadow-sm" />
              </div>
              <div className="h-24 rounded-lg bg-white shadow-sm" />
            </div>
          </div>
        </section>

        <section className="flex min-h-screen flex-col justify-between py-3 lg:py-8">
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
            <AuthForm initialMode={mode} />
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
