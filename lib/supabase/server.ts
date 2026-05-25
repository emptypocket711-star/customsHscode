import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const rememberSessionCookieName = "hs_finder_remember_session";
const persistentSessionMaxAge = 400 * 24 * 60 * 60;

export function hasSupabaseEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function sessionCookieOptions(options: Record<string, unknown>, value: string, rememberSession: boolean) {
  if (rememberSession || !value) return options;

  const sessionOptions = { ...options };
  delete sessionOptions.maxAge;
  delete sessionOptions.expires;
  return sessionOptions;
}

export async function setRememberSessionPreference(rememberSession: boolean) {
  const cookieStore = await cookies();

  cookieStore.set(rememberSessionCookieName, rememberSession ? "1" : "0", {
    path: "/",
    sameSite: "lax",
    maxAge: rememberSession ? persistentSessionMaxAge : undefined
  });
}

export async function clearRememberSessionPreference() {
  const cookieStore = await cookies();
  cookieStore.delete(rememberSessionCookieName);
}

export async function createSupabaseServerClient(options: { rememberSession?: boolean } = {}) {
  if (!hasSupabaseEnv()) {
    throw new Error("Supabase 환경 변수가 설정되지 않았습니다.");
  }

  const cookieStore = await cookies();
  const rememberSession = options.rememberSession ?? cookieStore.get(rememberSessionCookieName)?.value !== "0";

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, sessionCookieOptions(options, value, rememberSession));
            });
          } catch {
            // Server Components cannot mutate cookies. Server Actions and Route Handlers can.
          }
        }
      }
    }
  );
}
