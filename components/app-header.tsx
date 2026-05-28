import Link from "next/link";
import { Search } from "lucide-react";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  defaultLocale,
  formatGreeting,
  getChromeDictionary,
  getHeaderGreeting,
  localeOptions,
  normalizeLocale,
  type AppLocale
} from "@/lib/i18n";
import { setRequestLocale } from "@/lib/i18n/server";
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

function displayUserName({
  email,
  fallback,
  fullName
}: {
  email?: string | null;
  fallback: string;
  fullName?: string | null;
}) {
  const name = fullName?.trim();
  if (name) return name;

  const emailName = email?.split("@")[0]?.trim();
  return emailName || fallback;
}

function safeReturnPath(referer: string | null) {
  if (!referer) return "/dashboard";

  try {
    const url = new URL(referer);
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/dashboard";
  }
}

async function updateLocaleAction(formData: FormData) {
  "use server";

  const locale = normalizeLocale(formData.get("locale"));
  await setRequestLocale(locale);

  const headerStore = await headers();
  const returnPath = safeReturnPath(headerStore.get("referer"));
  revalidatePath("/", "layout");
  redirect(returnPath);
}

export async function AppHeader({
  email: providedEmail,
  fullName,
  locale = defaultLocale
}: {
  email?: string | null;
  fullName?: string | null;
  locale?: AppLocale;
} = {}) {
  const email = providedEmail ?? await getUserEmail();
  const dictionary = getChromeDictionary(locale);
  const userName = displayUserName({ email, fallback: dictionary.header.defaultUser, fullName });
  const greetingMessage = getHeaderGreeting(locale);

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link className="focus-ring flex min-w-0 items-center gap-3 rounded-md" href="/dashboard">
          <span className="grid size-9 place-items-center rounded-md bg-blue-700 text-white">
            <Search aria-hidden="true" size={20} />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-base font-semibold text-slate-950">
              {formatGreeting(dictionary.header.greetingTemplate, userName)}
            </span>
            <span className="hidden max-w-[560px] truncate text-xs text-slate-500 sm:block">{greetingMessage}</span>
          </span>
        </Link>
        <div className="flex shrink-0 items-center justify-end gap-2">
          <form action={updateLocaleAction} aria-label={dictionary.header.language} className="flex rounded-md border border-slate-200 bg-slate-50 p-0.5">
            {localeOptions.map((option) => {
              const active = option.value === locale;

              return (
                <button
                  aria-pressed={active}
                  className={
                    active
                      ? "focus-ring rounded px-2 py-1.5 text-xs font-semibold text-white bg-blue-700"
                      : "focus-ring rounded px-2 py-1.5 text-xs font-semibold text-slate-600 hover:bg-white"
                  }
                  disabled={active}
                  key={option.value}
                  name="locale"
                  title={option.label}
                  type="submit"
                  value={option.value}
                >
                  {option.shortLabel}
                </button>
              );
            })}
          </form>
          {email ? (
            <form action={signOutAction} className="flex items-center gap-3">
              <span className="hidden text-sm text-slate-600 xl:inline">{email}</span>
              <button className="focus-ring rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" type="submit">
                {dictionary.header.logout}
              </button>
            </form>
          ) : (
            <Link className="focus-ring rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" href="/login">
              {dictionary.header.login}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
