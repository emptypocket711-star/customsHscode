import { cookies, headers } from "next/headers";
import { createSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase/server";
import {
  defaultLocale,
  localeFromAcceptLanguage,
  localeCookieName,
  normalizeLocaleOrNull,
  type AppLocale
} from "@/lib/i18n/locales";

async function resolveCookieLocale(): Promise<AppLocale | null> {
  const cookieStore = await cookies();
  return normalizeLocaleOrNull(cookieStore.get(localeCookieName)?.value);
}

async function resolveHeaderLocale(): Promise<AppLocale> {
  const headersList = await headers();
  return localeFromAcceptLanguage(headersList.get("accept-language")) ?? defaultLocale;
}

export async function resolveRequestLocale(): Promise<AppLocale> {
  return await resolveCookieLocale() ?? await resolveHeaderLocale();
}

export async function getRequestLocale(): Promise<AppLocale> {
  return resolveRequestLocale();
}

export async function setRequestLocale(locale: AppLocale) {
  const cookieStore = await cookies();
  cookieStore.set(localeCookieName, locale, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  });

  if (!hasSupabaseEnv()) return;

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user?.id) return;

    await supabase
      .from("profiles")
      .update({ preferred_locale: locale })
      .eq("id", user.id);
  } catch {
    // The cookie is the runtime source of truth. Profile persistence is best effort
    // until the preferred_locale migration has been applied in production.
  }
}

export async function resolveUserLocale(userId?: string | null): Promise<AppLocale> {
  const cookieLocale = await resolveCookieLocale();
  if (cookieLocale) return cookieLocale;

  if (!userId || !hasSupabaseEnv()) return resolveHeaderLocale();

  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("profiles")
      .select("preferred_locale")
      .eq("id", userId)
      .maybeSingle<{ preferred_locale: string | null }>();

    return normalizeLocaleOrNull(data?.preferred_locale) ?? await resolveHeaderLocale();
  } catch {
    return resolveHeaderLocale();
  }
}

export async function resolveCurrentUserLocale(userId?: string | null): Promise<AppLocale> {
  const requestLocale = await resolveRequestLocale();

  if (userId) return resolveUserLocale(userId);

  if (!hasSupabaseEnv()) return requestLocale;

  try {
    const supabase = await createSupabaseServerClient();
    const user = (await supabase.auth.getUser()).data.user;
    return user?.id ? await resolveUserLocale(user.id) : requestLocale;
  } catch {
    return requestLocale;
  }
}
