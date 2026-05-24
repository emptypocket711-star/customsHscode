import Link from "next/link";
import { Search } from "lucide-react";
import { signOutAction } from "@/server/actions/auth.actions";
import { createSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase/server";

async function getUserEmail() {
  if (!hasSupabaseEnv()) return null;

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    return user?.email ?? null;
  } catch {
    return null;
  }
}

export async function AppHeader() {
  const email = await getUserEmail();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link className="focus-ring flex items-center gap-2 rounded-md" href="/dashboard">
          <span className="grid size-9 place-items-center rounded-md bg-blue-700 text-white">
            <Search aria-hidden="true" size={20} />
          </span>
          <span>
            <span className="block text-base font-semibold text-slate-950">통관이음 AI</span>
            <span className="block text-xs text-slate-500">HS CODE 조회</span>
          </span>
        </Link>
        {email ? (
          <form action={signOutAction} className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-600 sm:inline">{email}</span>
            <button className="focus-ring rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" type="submit">
              로그아웃
            </button>
          </form>
        ) : (
          <Link className="focus-ring rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" href="/login">
            로그인
          </Link>
        )}
      </div>
    </header>
  );
}
