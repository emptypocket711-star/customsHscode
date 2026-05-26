import type { SupabaseClient } from "@supabase/supabase-js";

export type AppNoticeCategory = "notice" | "maintenance" | "data_update" | "release";

export type AppNotice = {
  id: string;
  title: string;
  body: string;
  category: AppNoticeCategory;
  isPublished: boolean;
  pinned: boolean;
  popupEnabled: boolean;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
};

type AppNoticeRow = {
  id: string;
  title: string;
  body: string;
  category: AppNoticeCategory;
  is_published: boolean;
  pinned: boolean;
  popup_enabled: boolean;
  published_at: string;
  created_at: string;
  updated_at: string;
};

function mapNotice(row: AppNoticeRow): AppNotice {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    category: row.category,
    isPublished: row.is_published,
    pinned: row.pinned,
    popupEnabled: row.popup_enabled,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

const noticeSelect = "id,title,body,category,is_published,pinned,popup_enabled,published_at,created_at,updated_at";

export async function listPublishedAppNotices(supabase: SupabaseClient, limit = 5): Promise<AppNotice[]> {
  const { data, error } = await supabase
    .from("app_notices")
    .select(noticeSelect)
    .eq("is_published", true)
    .order("pinned", { ascending: false })
    .order("published_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return ((data ?? []) as AppNoticeRow[]).map(mapNotice);
}

export async function listAllAppNotices(supabase: SupabaseClient, limit = 50): Promise<AppNotice[]> {
  const { data, error } = await supabase
    .from("app_notices")
    .select(noticeSelect)
    .order("pinned", { ascending: false })
    .order("published_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return ((data ?? []) as AppNoticeRow[]).map(mapNotice);
}
