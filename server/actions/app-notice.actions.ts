"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { recordAuditLog } from "@/server/audit/account-audit";
import { isDeveloperEmail } from "@/server/auth/developer";

export type AppNoticeActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

const initialState: AppNoticeActionState = { status: "idle" };

const noticeCategorySchema = z.enum(["notice", "maintenance", "data_update", "release"]);

const noticeUpsertSchema = z.object({
  id: z.uuid().optional().or(z.literal("")),
  title: z.string().trim().min(1, "제목을 입력해 주세요.").max(160, "제목은 160자 이하로 입력해 주세요."),
  body: z.string().trim().min(1, "내용을 입력해 주세요.").max(4000, "내용은 4000자 이하로 입력해 주세요."),
  category: noticeCategorySchema,
  isPublished: z.boolean(),
  pinned: z.boolean()
});

const noticeDeleteSchema = z.object({
  id: z.uuid(),
  confirmation: z.string().trim()
});

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : undefined;
}

function checkboxValue(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

async function requireCurrentDeveloper() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user?.id || !isDeveloperEmail(user.email)) {
    throw new Error("개발자 계정만 공지사항을 관리할 수 있습니다.");
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

function revalidateNoticePaths() {
  revalidatePath("/dashboard");
  revalidatePath("/operations/notices");
}

export async function upsertAppNoticeAction(
  previousState: AppNoticeActionState = initialState,
  formData: FormData
): Promise<AppNoticeActionState> {
  void previousState;

  try {
    const actor = await requireCurrentDeveloper();
    const parsed = noticeUpsertSchema.safeParse({
      id: stringValue(formData, "id") || "",
      title: stringValue(formData, "title"),
      body: stringValue(formData, "body"),
      category: stringValue(formData, "category"),
      isPublished: checkboxValue(formData, "isPublished"),
      pinned: checkboxValue(formData, "pinned")
    });

    if (!parsed.success) {
      return {
        status: "error",
        message: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요."
      };
    }

    const input = parsed.data;
    const admin = createSupabaseServiceRoleClient();

    if (input.id) {
      const { data: beforeNotice } = await admin
        .from("app_notices")
        .select("id,title,body,category,is_published,pinned,published_at")
        .eq("id", input.id)
        .maybeSingle();
      const { error } = await admin
        .from("app_notices")
        .update({
          title: input.title,
          body: input.body,
          category: input.category,
          is_published: input.isPublished,
          pinned: input.pinned,
          updated_by: actor.id,
          published_at: input.isPublished ? new Date().toISOString() : beforeNotice?.published_at ?? new Date().toISOString()
        })
        .eq("id", input.id);

      if (error) throw error;

      await recordAuditLog({
        action: "app_notice_update",
        actorId: actor.id,
        targetTable: "app_notices",
        targetId: input.id,
        before: beforeNotice,
        after: input
      });

      revalidateNoticePaths();
      return { status: "success", message: "공지사항을 수정했습니다." };
    }

    const { data, error } = await admin
      .from("app_notices")
      .insert({
        title: input.title,
        body: input.body,
        category: input.category,
        is_published: input.isPublished,
        pinned: input.pinned,
        created_by: actor.id,
        updated_by: actor.id,
        published_at: new Date().toISOString()
      })
      .select("id")
      .single();

    if (error) throw error;

    await recordAuditLog({
      action: "app_notice_create",
      actorId: actor.id,
      targetTable: "app_notices",
      targetId: data.id,
      after: input
    });

    revalidateNoticePaths();
    return { status: "success", message: "공지사항을 작성했습니다." };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "공지사항을 저장하지 못했습니다."
    };
  }
}

export async function deleteAppNoticeAction(
  previousState: AppNoticeActionState = initialState,
  formData: FormData
): Promise<AppNoticeActionState> {
  void previousState;

  try {
    const actor = await requireCurrentDeveloper();
    const parsed = noticeDeleteSchema.safeParse({
      id: stringValue(formData, "id"),
      confirmation: stringValue(formData, "confirmation")
    });

    if (!parsed.success) {
      return {
        status: "error",
        message: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요."
      };
    }

    const input = parsed.data;
    if (input.confirmation !== "DELETE") {
      return {
        status: "error",
        message: "삭제 확인란에 DELETE를 입력해 주세요."
      };
    }

    const admin = createSupabaseServiceRoleClient();
    const { data: beforeNotice } = await admin
      .from("app_notices")
      .select("id,title,body,category,is_published,pinned,published_at")
      .eq("id", input.id)
      .maybeSingle();
    const { error } = await admin
      .from("app_notices")
      .delete()
      .eq("id", input.id);

    if (error) throw error;

    await recordAuditLog({
      action: "app_notice_delete",
      actorId: actor.id,
      targetTable: "app_notices",
      targetId: input.id,
      before: beforeNotice,
      after: { deleted: true }
    });

    revalidateNoticePaths();
    return { status: "success", message: "공지사항을 삭제했습니다." };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "공지사항을 삭제하지 못했습니다."
    };
  }
}
