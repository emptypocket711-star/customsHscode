"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase/server";
import { toggleHsFavorite } from "@/server/repositories/hs-favorite.repository";

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : undefined;
}

function safeReturnTo(value?: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  return value;
}

export async function toggleHsFavoriteAction(formData: FormData) {
  if (!hasSupabaseEnv()) {
    redirect(safeReturnTo(stringValue(formData, "returnTo")));
  }

  const supabase = await createSupabaseServerClient();
  const returnTo = safeReturnTo(stringValue(formData, "returnTo"));

  await toggleHsFavorite(supabase, {
    hskCode: stringValue(formData, "hskCode") ?? "",
    displayName: stringValue(formData, "displayName"),
    basisDate: stringValue(formData, "basisDate")
  });

  revalidatePath("/dashboard");
  revalidatePath("/hs/direct");
  redirect(returnTo);
}
