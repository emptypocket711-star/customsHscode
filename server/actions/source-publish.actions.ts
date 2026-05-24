"use server";

import { revalidatePath } from "next/cache";
import {
  publishSourceVersionSchema,
  type PublishSourceVersionActionState
} from "@/features/legal-updates/source-publish-schemas";
import { createSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase/server";
import { publishSourceVersion } from "@/server/repositories/source-publish.repository";

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : undefined;
}

export async function publishSourceVersionAction(
  _previousState: PublishSourceVersionActionState,
  formData: FormData
): Promise<PublishSourceVersionActionState> {
  const parsed = publishSourceVersionSchema.safeParse({
    targetTable: stringValue(formData, "targetTable"),
    sourceVersion: stringValue(formData, "sourceVersion"),
    matchPrefix: stringValue(formData, "matchPrefix") ?? "",
    note: stringValue(formData, "note")
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "게시 입력값을 확인해 주세요."
    };
  }

  if (!hasSupabaseEnv()) {
    return {
      status: "error",
      message: "Supabase 환경 변수가 없어 source_version 게시를 수행하지 않았습니다."
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const affectedCount = await publishSourceVersion(supabase, parsed.data);
    revalidatePath("/legal-updates");
    revalidatePath("/hs/direct");
    revalidatePath("/diagnosis/import");
    revalidatePath("/diagnosis/export");

    return {
      status: "success",
      message: `${affectedCount}건을 published 상태로 전환했습니다. 관련 진단 화면은 basis_date 기준으로 재조회됩니다.`
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "source_version 게시 중 오류가 발생했습니다."
    };
  }
}
