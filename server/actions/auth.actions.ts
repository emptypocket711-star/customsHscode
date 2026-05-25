"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  authFormSchema,
  signupOtpSendFormSchema,
  signupOtpVerifyFormSchema,
  updatePasswordFormSchema,
  type AuthActionState,
  type SignupOtpActionState,
  type UpdatePasswordActionState
} from "@/features/auth/schemas";
import {
  clearRememberSessionPreference,
  createSupabaseServerClient,
  hasSupabaseEnv,
  setRememberSessionPreference
} from "@/lib/supabase/server";
import { createSupabaseServiceRoleClient, hasSupabaseServiceRoleEnv } from "@/lib/supabase/service-role";

export type CompanySuggestion = {
  id: string;
  name: string;
};

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : undefined;
}

function nonEmptyStringValue(formData: FormData, key: string) {
  const value = stringValue(formData, key)?.trim();
  return value ? value : undefined;
}

function firstStringValue(formData: FormData, keys: string[]) {
  for (const key of keys) {
    const value = stringValue(formData, key);
    if (value) return value;
  }
  return undefined;
}

function booleanValue(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function arrayValue(formData: FormData, key: string) {
  return formData.getAll(key).filter((value): value is string => typeof value === "string");
}

async function ensureClientProfile(companyName?: string, fullName?: string, businessTypes?: string[]) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("ensure_client_profile", {
    p_business_types: businessTypes && businessTypes.length > 0 ? businessTypes : null,
    p_company_name: companyName || null,
    p_full_name: fullName || null
  });

  if (error) throw new Error(error.message);
}

async function requestCompanyJoin(companyId: string, fullName?: string, businessTypes?: string[]) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("request_company_join", {
    p_business_types: businessTypes && businessTypes.length > 0 ? businessTypes : null,
    p_company_id: companyId,
    p_full_name: fullName || null
  });

  if (error) throw new Error(error.message);
}

async function getPostLoginPath() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return "/login";

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id, onboarding_completed_at")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.onboarding_completed_at) return "/dashboard";

  const { data: joinRequest } = await supabase
    .from("company_join_requests")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "pending")
    .maybeSingle();

  return joinRequest?.id ? "/auth/company-pending" : "/auth/complete-signup";
}

async function getAppOrigin() {
  const headersList = await headers();
  return process.env.NEXT_PUBLIC_APP_URL || headersList.get("origin") || "http://localhost:3000";
}

export async function authenticateAction(
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const requestedMode = stringValue(formData, "mode");
  const mode = requestedMode === "signup" ? "signup" : requestedMode === "reset" ? "reset" : "login";
  const parsed = authFormSchema.safeParse({
    mode,
    email: stringValue(formData, "email"),
    password: stringValue(formData, "password"),
    passwordConfirm: stringValue(formData, "passwordConfirm"),
    rememberSession: mode === "login" ? booleanValue(formData, "rememberSession") : true,
    fullName: stringValue(formData, "fullName"),
    companyName: stringValue(formData, "companyName"),
    selectedCompanyId: nonEmptyStringValue(formData, "selectedCompanyId"),
    businessTypes: arrayValue(formData, "businessTypes")
  });

  if (!parsed.success) {
    return {
      status: "error",
      mode,
      message: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요."
    };
  }

  if (!hasSupabaseEnv()) {
    return {
      status: "error",
      mode: parsed.data.mode,
      message: "Supabase 환경 변수가 없어 로그인할 수 없습니다."
    };
  }

  if (parsed.data.mode === "reset") {
    const supabase = await createSupabaseServerClient();
    const origin = await getAppOrigin();
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${origin}/auth/callback?next=/auth/update-password`
    });

    if (error) {
      return {
        status: "error",
        mode: "reset",
        message: error.message
      };
    }

    return {
      status: "success",
      mode: "reset",
      message: "비밀번호 재설정 메일을 보냈습니다. 메일의 링크로 새 비밀번호를 설정해 주세요."
    };
  }

  const supabase = await createSupabaseServerClient({ rememberSession: parsed.data.rememberSession ?? true });

  if (parsed.data.mode === "signup") {
    const { error: passwordError } = await supabase.auth.updateUser({
      password: parsed.data.password!,
      data: {
        full_name: parsed.data.fullName || "",
        company_name: parsed.data.companyName || "",
        business_types: parsed.data.businessTypes || []
      }
    });

    if (passwordError) {
      return {
        status: "error",
        mode: "signup",
        message: passwordError.message
      };
    }

    await setRememberSessionPreference(parsed.data.rememberSession ?? true);
    if (parsed.data.selectedCompanyId) {
      await requestCompanyJoin(parsed.data.selectedCompanyId, parsed.data.fullName, parsed.data.businessTypes);
      revalidatePath("/", "layout");
      redirect("/auth/company-pending");
    }

    await ensureClientProfile(parsed.data.companyName, parsed.data.fullName, parsed.data.businessTypes);
    revalidatePath("/", "layout");
    redirect("/dashboard");
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password!
  });

  if (error) {
    return {
      status: "error",
      mode: "login",
      message: error.message
    };
  }

  await setRememberSessionPreference(parsed.data.rememberSession ?? true);
  revalidatePath("/", "layout");
  redirect(await getPostLoginPath());
}

export async function searchCompanySuggestionsAction(query: string): Promise<CompanySuggestion[]> {
  const term = query.trim();
  if (term.length < 2 || !hasSupabaseEnv() || !hasSupabaseServiceRoleEnv()) return [];

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return [];

  const service = createSupabaseServiceRoleClient();
  const { data, error } = await service
    .from("companies")
    .select("id, name")
    .ilike("name", `%${term}%`)
    .order("name", { ascending: true })
    .limit(6);

  if (error || !data) return [];
  const seen = new Set<string>();
  return data.flatMap((row) => {
    const id = String(row.id ?? "");
    const name = String(row.name ?? "");
    if (!id || !name || seen.has(id)) return [];
    seen.add(id);
    return [{ id, name }];
  });
}

export async function sendSignupEmailOtpAction(
  _previousState: SignupOtpActionState,
  formData: FormData
): Promise<SignupOtpActionState> {
  const parsed = signupOtpSendFormSchema.safeParse({
    email: stringValue(formData, "email")
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "이메일을 확인해 주세요."
    };
  }

  if (!hasSupabaseEnv()) {
    return {
      status: "error",
      email: parsed.data.email,
      message: "Supabase 환경 변수가 없어 인증번호를 보낼 수 없습니다."
    };
  }

  const supabase = await createSupabaseServerClient({ rememberSession: true });
  const origin = await getAppOrigin();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/auth/complete-signup`,
      shouldCreateUser: true
    }
  });

  if (error) {
    return {
      status: "error",
      email: parsed.data.email,
      message: error.message
    };
  }

  return {
    status: "success",
    email: parsed.data.email,
    message: "인증번호를 전송했습니다. 메일함에서 인증번호를 확인해 주세요."
  };
}

export async function verifySignupEmailOtpAction(
  _previousState: SignupOtpActionState,
  formData: FormData
): Promise<SignupOtpActionState> {
  const parsed = signupOtpVerifyFormSchema.safeParse({
    email: stringValue(formData, "email"),
    token: firstStringValue(formData, ["token", "otp", "code"])
  });

  if (!parsed.success) {
    return {
      status: "error",
      email: stringValue(formData, "email"),
      message: parsed.error.issues[0]?.message ?? "인증번호를 확인해 주세요."
    };
  }

  if (!hasSupabaseEnv()) {
    return {
      status: "error",
      email: parsed.data.email,
      message: "Supabase 환경 변수가 없어 인증번호를 확인할 수 없습니다."
    };
  }

  const supabase = await createSupabaseServerClient({ rememberSession: true });
  const { error } = await supabase.auth.verifyOtp({
    email: parsed.data.email,
    token: parsed.data.token,
    type: "email"
  });

  if (error) {
    const fallback = await supabase.auth.verifyOtp({
      email: parsed.data.email,
      token: parsed.data.token,
      type: "magiclink"
    });

    if (!fallback.error) {
      await setRememberSessionPreference(true);
      redirect("/auth/complete-signup");
    }

    return {
      status: "error",
      email: parsed.data.email,
      message: fallback.error.message || error.message
    };
  }

  await setRememberSessionPreference(true);
  redirect("/auth/complete-signup");
}

export async function updatePasswordAction(
  _previousState: UpdatePasswordActionState,
  formData: FormData
): Promise<UpdatePasswordActionState> {
  const parsed = updatePasswordFormSchema.safeParse({
    password: stringValue(formData, "password"),
    passwordConfirm: stringValue(formData, "passwordConfirm")
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요."
    };
  }

  if (!hasSupabaseEnv()) {
    return {
      status: "error",
      message: "Supabase 환경 변수가 없어 비밀번호를 변경할 수 없습니다."
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password
  });

  if (error) {
    return {
      status: "error",
      message: error.message
    };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signOutAction() {
  if (!hasSupabaseEnv()) {
    redirect("/login");
  }

  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  await clearRememberSessionPreference();
  revalidatePath("/", "layout");
  redirect("/login");
}
