import type { SupabaseClient } from "@supabase/supabase-js";

function isUniqueViolation(error: { code?: string }) {
  return error.code === "23505";
}

export async function hasSentCargoWatchStatusNotification(
  supabase: SupabaseClient,
  notificationKey: string
) {
  const { data, error } = await supabase
    .from("cargo_watch_status_notifications")
    .select("id")
    .eq("notification_key", notificationKey)
    .eq("send_status", "sent")
    .maybeSingle();

  if (error) throw error;
  return Boolean(data?.id);
}

export async function claimCargoWatchStatusNotification(
  supabase: SupabaseClient,
  input: {
    notificationKey: string;
    notifyEmail: string;
    lookupValue: string;
    targetStatus: string;
    sourceWatchId?: string | null;
  }
) {
  const staleBefore = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  await supabase
    .from("cargo_watch_status_notifications")
    .delete()
    .eq("notification_key", input.notificationKey)
    .eq("send_status", "sending")
    .lt("created_at", staleBefore);

  const { data, error } = await supabase
    .from("cargo_watch_status_notifications")
    .insert({
      notification_key: input.notificationKey,
      notify_email: input.notifyEmail,
      lookup_value: input.lookupValue,
      target_status: input.targetStatus,
      source_watch_id: input.sourceWatchId,
      send_status: "sending"
    })
    .select("id")
    .single();

  if (error) {
    if (isUniqueViolation(error)) return null;
    throw error;
  }

  return typeof data?.id === "string" ? data.id : null;
}

export async function markCargoWatchStatusNotificationSent(
  supabase: SupabaseClient,
  notificationId: string
) {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("cargo_watch_status_notifications")
    .update({
      send_status: "sent",
      sent_at: now,
      updated_at: now
    })
    .eq("id", notificationId);

  if (error) throw error;
}

export async function releaseCargoWatchStatusNotificationClaim(
  supabase: SupabaseClient,
  notificationId: string
) {
  const { error } = await supabase
    .from("cargo_watch_status_notifications")
    .delete()
    .eq("id", notificationId)
    .eq("send_status", "sending");

  if (error) throw error;
}
