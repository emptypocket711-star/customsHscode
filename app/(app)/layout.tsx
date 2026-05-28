import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { AppSideNav } from "@/components/app-side-nav";
import { getRequestLocale } from "@/lib/i18n/server";
import { createSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase/server";
import { isDeveloperEmail } from "@/server/auth/developer";
import { validatePersonalActiveSession } from "@/server/auth/session-policy";

async function getCurrentAccessState() {
  if (!hasSupabaseEnv()) return null;

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("account_type,full_name,onboarding_completed_at")
      .eq("id", user.id)
      .maybeSingle();

    return { user, profile: profile ?? null };
  } catch {
    return null;
  }
}

export default async function AppLayout({ children }: { children: ReactNode }) {
  const locale = await getRequestLocale();
  const access = await getCurrentAccessState();

  if (!access?.user) {
    redirect("/login");
  }

  const { user, profile } = access;
  if (!profile?.onboarding_completed_at) {
    redirect("/auth/complete-signup");
  }

  const sessionCheck = await validatePersonalActiveSession({
    accountType: profile.account_type === "personal" ? "personal" : "company",
    userId: user.id
  });
  if (!sessionCheck.valid) {
    redirect("/auth/session-ended");
  }

  return (
    <div className="min-h-screen">
      <AppHeader email={user.email ?? null} fullName={profile.full_name ?? null} locale={locale} />
      <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-5 px-4 py-5 sm:px-6 lg:flex-row lg:gap-5 lg:px-8">
        <AppSideNav locale={locale} showOperations={isDeveloperEmail(user.email)} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
