import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { AppSideNav } from "@/components/app-side-nav";
import { createSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase/server";
import { isDeveloperEmail } from "@/server/auth/developer";

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

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen">
      <AppHeader email={user.email ?? null} />
      <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-5 px-4 py-5 sm:px-6 lg:flex-row lg:gap-5 lg:px-8">
        <AppSideNav showOperations={isDeveloperEmail(user.email)} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
