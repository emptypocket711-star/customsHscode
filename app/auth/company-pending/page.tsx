import { Building2 } from "lucide-react";
import { redirect } from "next/navigation";
import { signOutAction } from "@/server/actions/auth.actions";
import { createSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase/server";

type JoinRequestRow = {
  created_at?: string;
  companies?: { name?: string } | { name?: string }[] | null;
};

async function getPendingJoinRequest() {
  if (!hasSupabaseEnv()) return null;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("company_join_requests")
    .select("id, created_at, companies(name)")
    .eq("user_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const row = data as JoinRequestRow | null;
  const company = Array.isArray(row?.companies) ? row?.companies[0] : row?.companies;

  return {
    companyName: company?.name,
    createdAt: row?.created_at,
    email: user.email ?? null
  };
}

export default async function CompanyPendingPage() {
  const request = await getPendingJoinRequest();

  if (!request) {
    redirect("/auth/complete-signup");
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,#eef2ff_0,#f8fafc_42%,#ffffff_100%)] px-5 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-xl flex-col justify-center">
        <section className="rounded-2xl border border-slate-200 bg-white/90 p-6 text-center shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur sm:p-8">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-blue-50 text-blue-700">
            <Building2 aria-hidden="true" size={27} />
          </span>
          <h1 className="mt-5 text-3xl font-semibold tracking-normal text-slate-950">회사 합류 요청 대기 중</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            기존 회사 <span className="font-semibold text-slate-900">{request.companyName ?? "선택 회사"}</span>에 대한 합류 요청이 접수되었습니다.
            회사 관리자 또는 운영자가 승인하면 HS FINDER 업무 공간을 사용할 수 있습니다.
          </p>
          {request.email ? <p className="mt-3 text-xs font-semibold text-blue-700">{request.email}</p> : null}
          <form action={signOutAction} className="mt-7">
            <button
              className="focus-ring inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              type="submit"
            >
              로그아웃
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
