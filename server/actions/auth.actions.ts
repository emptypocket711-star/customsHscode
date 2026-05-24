"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { authFormSchema, type AuthActionState } from "@/features/auth/schemas";
import { createSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase/server";

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : undefined;
}

async function ensureClientProfile(companyName?: string, fullName?: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("ensure_client_profile", {
    p_company_name: companyName || null,
    p_full_name: fullName || null
  });

  if (error) throw new Error(error.message);
}

export async function authenticateAction(
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = authFormSchema.safeParse({
    mode: stringValue(formData, "mode") ?? "login",
    email: stringValue(formData, "email"),
    password: stringValue(formData, "password"),
    fullName: stringValue(formData, "fullName"),
    companyName: stringValue(formData, "companyName")
  });

  const mode = stringValue(formData, "mode") === "signup" ? "signup" : "login";

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

  const supabase = await createSupabaseServerClient();

  if (parsed.data.mode === "signup") {
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: {
          full_name: parsed.data.fullName || "",
          company_name: parsed.data.companyName || ""
        }
      }
    });

    if (error) {
      return {
        status: "error",
        mode: "signup",
        message: error.message
      };
    }

    if (data.session) {
      await ensureClientProfile(parsed.data.companyName, parsed.data.fullName);
      revalidatePath("/", "layout");
      redirect("/documents/upload");
    }

    return {
      status: "success",
      mode: "signup",
      message: "회원가입 요청이 접수되었습니다. 이메일 확인이 필요한 경우 메일 인증 후 로그인해 주세요."
    };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password
  });

  if (error) {
    return {
      status: "error",
      mode: "login",
      message: error.message
    };
  }

  await ensureClientProfile(undefined, parsed.data.fullName);
  revalidatePath("/", "layout");
  redirect("/documents/upload");
}

export async function signOutAction() {
  if (!hasSupabaseEnv()) {
    redirect("/login");
  }

  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
