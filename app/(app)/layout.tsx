import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { AppSideNav } from "@/components/app-side-nav";
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

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen">
      <AppHeader />
      <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <AppSideNav />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
