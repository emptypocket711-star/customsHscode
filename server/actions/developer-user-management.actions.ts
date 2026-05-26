"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { recordAuditLog } from "@/server/audit/account-audit";
import { isDeveloperEmail } from "@/server/auth/developer";

export type DeveloperUserActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  targetUserId?: string;
  testLoginUrl?: string;
};

const initialState: DeveloperUserActionState = { status: "idle" };

const userRoleSchema = z.enum(["developer", "admin", "customs_staff", "client"]);
const accountTypeSchema = z.enum(["personal", "company"]);
const companyRoleSchema = z.enum(["admin", "member"]);

const updateUserSchema = z.object({
  userId: z.uuid(),
  email: z.email("이메일 형식을 확인해 주세요.").trim().max(255),
  fullName: z.string().trim().max(80).optional(),
  role: userRoleSchema,
  accountType: accountTypeSchema,
  companyRole: companyRoleSchema,
  allowedIpCount: z.coerce.number().int().min(1).max(100),
  companyId: z.uuid().optional().or(z.literal("")),
  companyName: z.string().trim().max(120).optional(),
  businessNo: z.string().trim().max(12).optional()
});

const deleteUserSchema = z.object({
  userId: z.uuid(),
  companyId: z.uuid().optional().or(z.literal("")),
  confirmation: z.string().trim()
});

const testLoginLinkSchema = z.object({
  userId: z.uuid(),
  email: z.email("이메일 형식을 확인해 주세요.").trim().max(255)
});

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : undefined;
}

function normalizeBusinessNo(value?: string) {
  const digits = value ? value.replace(/\D/g, "") : "";
  return digits || null;
}

async function requireCurrentDeveloper() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user?.id || !isDeveloperEmail(user.email)) {
    throw new Error("개발자 계정만 사용자 정보를 관리할 수 있습니다.");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "developer") {
    throw new Error("개발자 권한 프로필이 필요합니다.");
  }

  return user;
}

function isTestLoginLinkEnabled() {
  return process.env.TEST_LOGIN_LINKS_ENABLED === "1"
    || process.env.TEST_LOGIN_LINKS_ENABLED === "true"
    || process.env.NODE_ENV !== "production";
}

async function requestOrigin() {
  const headersList = await headers();
  const host = headersList.get("x-forwarded-host") || headersList.get("host");
  const proto = headersList.get("x-forwarded-proto") || "http";
  if (!host) return process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${proto}://${host}`;
}

export async function updateManagedUserAction(
  previousState: DeveloperUserActionState = initialState,
  formData: FormData
): Promise<DeveloperUserActionState> {
  void previousState;

  try {
    const actor = await requireCurrentDeveloper();

    const parsed = updateUserSchema.safeParse({
      userId: stringValue(formData, "userId"),
      email: stringValue(formData, "email"),
      fullName: stringValue(formData, "fullName"),
      role: stringValue(formData, "role"),
      accountType: stringValue(formData, "accountType"),
      companyRole: stringValue(formData, "companyRole"),
      allowedIpCount: stringValue(formData, "allowedIpCount"),
      companyId: stringValue(formData, "companyId"),
      companyName: stringValue(formData, "companyName"),
      businessNo: stringValue(formData, "businessNo")
    });

    if (!parsed.success) {
      return {
        status: "error",
        message: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요."
      };
    }

    const input = parsed.data;
    const admin = createSupabaseServiceRoleClient();
    const businessNo = normalizeBusinessNo(input.businessNo);
    const { data: beforeProfile } = await admin
      .from("profiles")
      .select("id,email,full_name,role,company_id,company_role,account_type,allowed_ip_count")
      .eq("id", input.userId)
      .maybeSingle();

    if (input.accountType === "company" && input.companyName && businessNo && businessNo.length !== 10) {
      return {
        status: "error",
        message: "사업자등록번호는 숫자 10자리로 입력해 주세요."
      };
    }

    const { error: authError } = await admin.auth.admin.updateUserById(input.userId, {
      email: input.email,
      user_metadata: {
        full_name: input.fullName || "",
        account_type: input.accountType,
        company_name: input.companyName || "",
        business_no: businessNo || ""
      }
    });

    if (authError) throw authError;

    const { error: profileError } = await admin
      .from("profiles")
      .update({
        email: input.email,
        full_name: input.fullName || null,
        role: input.role,
        account_type: input.accountType,
        company_role: input.companyRole,
        allowed_ip_count: input.allowedIpCount
      })
      .eq("id", input.userId);

    if (profileError) throw profileError;

    if (input.companyId) {
      const { error: companyError } = await admin
        .from("companies")
        .update({
          name: input.companyName || (input.accountType === "personal" ? `${input.email.split("@")[0]} 개인회원` : "미입력 회사"),
          business_no: input.accountType === "company" ? businessNo : null,
          type: input.accountType
        })
        .eq("id", input.companyId);

      if (companyError) throw companyError;
    }

    await recordAuditLog({
      action: "developer_user_update",
      actorId: actor.id,
      companyId: input.companyId || null,
      targetTable: "auth.users",
      targetId: input.userId,
      before: beforeProfile,
      after: {
        email: input.email,
        fullName: input.fullName || null,
        role: input.role,
        accountType: input.accountType,
        companyRole: input.companyRole,
        allowedIpCount: input.allowedIpCount,
        companyName: input.companyName || null,
        businessNo
      }
    });

    revalidatePath("/operations/users");
    return {
      status: "success",
      message: `${input.email} 정보를 수정했습니다.`
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "사용자 정보를 수정하지 못했습니다."
    };
  }
}

export async function deleteManagedUserAction(
  previousState: DeveloperUserActionState = initialState,
  formData: FormData
): Promise<DeveloperUserActionState> {
  void previousState;

  try {
    const currentUser = await requireCurrentDeveloper();
    const parsed = deleteUserSchema.safeParse({
      userId: stringValue(formData, "userId"),
      companyId: stringValue(formData, "companyId"),
      confirmation: stringValue(formData, "confirmation")
    });

    if (!parsed.success) {
      return {
        status: "error",
        message: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요."
      };
    }

    const input = parsed.data;
    if (input.userId === currentUser.id) {
      return {
        status: "error",
        message: "현재 로그인한 개발자 계정은 삭제할 수 없습니다."
      };
    }

    if (input.confirmation !== "DELETE") {
      return {
        status: "error",
        message: "삭제 확인란에 DELETE를 입력해 주세요."
      };
    }

    const admin = createSupabaseServiceRoleClient();
    const { data: beforeProfile } = await admin
      .from("profiles")
      .select("id,email,full_name,role,company_id,company_role,account_type,allowed_ip_count")
      .eq("id", input.userId)
      .maybeSingle();
    const { error } = await admin.auth.admin.deleteUser(input.userId);
    if (error) throw error;

    if (input.companyId) {
      const { count, error: countError } = await admin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("company_id", input.companyId);

      if (countError) throw countError;

      if ((count ?? 0) === 0) {
        const { error: companyError } = await admin
          .from("companies")
          .delete()
          .eq("id", input.companyId);

        if (companyError) throw companyError;
      }
    }

    await recordAuditLog({
      action: "developer_user_delete",
      actorId: currentUser.id,
      companyId: input.companyId || null,
      targetTable: "auth.users",
      targetId: input.userId,
      before: beforeProfile,
      after: {
        deleted: true
      }
    });

    revalidatePath("/operations/users");
    return {
      status: "success",
      message: "사용자를 삭제했습니다."
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "사용자를 삭제하지 못했습니다."
    };
  }
}

export async function generateManagedUserTestLoginLinkAction(
  previousState: DeveloperUserActionState = initialState,
  formData: FormData
): Promise<DeveloperUserActionState> {
  void previousState;

  try {
    const actor = await requireCurrentDeveloper();

    if (!isTestLoginLinkEnabled()) {
      return {
        status: "error",
        message: "테스트 로그인 링크 기능이 비활성화되어 있습니다. 테스트 기간에만 TEST_LOGIN_LINKS_ENABLED=true로 켜세요."
      };
    }

    const parsed = testLoginLinkSchema.safeParse({
      userId: stringValue(formData, "userId"),
      email: stringValue(formData, "email")
    });

    if (!parsed.success) {
      return {
        status: "error",
        message: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요."
      };
    }

    const input = parsed.data;
    const admin = createSupabaseServiceRoleClient();
    const { data: authUser, error: getUserError } = await admin.auth.admin.getUserById(input.userId);

    if (getUserError) throw getUserError;
    if (authUser.user?.email?.toLowerCase() !== input.email.toLowerCase()) {
      return {
        status: "error",
        targetUserId: input.userId,
        message: "Auth 사용자 이메일과 화면의 이메일이 일치하지 않습니다. 새로고침 후 다시 시도해 주세요."
      };
    }

    const origin = await requestOrigin();
    const redirectTo = `${origin}/auth/callback?next=/dashboard`;
    const { data, error } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: input.email,
      options: {
        redirectTo
      }
    });

    if (error) throw error;

    const actionLink = data.properties?.action_link;
    if (!actionLink) {
      throw new Error("Supabase가 테스트 로그인 링크를 반환하지 않았습니다.");
    }

    await recordAuditLog({
      action: "developer_test_login_link_create",
      actorId: actor.id,
      targetTable: "auth.users",
      targetId: input.userId,
      after: {
        email: input.email,
        redirectTo,
        expires: "Supabase Auth magiclink policy"
      }
    });

    return {
      status: "success",
      message: `${input.email} 테스트 로그인 링크를 생성했습니다. 링크는 1회성으로 취급하고 테스트 직후 폐기하세요.`,
      targetUserId: input.userId,
      testLoginUrl: actionLink
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "테스트 로그인 링크를 생성하지 못했습니다."
    };
  }
}
