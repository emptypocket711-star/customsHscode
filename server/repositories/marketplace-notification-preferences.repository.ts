import type { SupabaseClient } from "@supabase/supabase-js";

export const marketplaceEmailNotificationPreferenceKinds = ["initial", "deadline_reminder"] as const;
export type MarketplaceEmailNotificationPreferenceKind =
  typeof marketplaceEmailNotificationPreferenceKinds[number];

export type MarketplaceEmailNotificationPreferenceItem = {
  enabled: boolean;
  notificationKind: MarketplaceEmailNotificationPreferenceKind;
  updatedAt: string | null;
};

export type MarketplaceEmailNotificationPreferencesDashboard = {
  preferences: MarketplaceEmailNotificationPreferenceItem[];
  schemaReady: boolean;
  userEmail: string | null;
};

type MarketplaceEmailNotificationPreferenceRow = {
  enabled: boolean | null;
  notification_kind: MarketplaceEmailNotificationPreferenceKind | string | null;
  updated_at: string | null;
};

export type MarketplaceEmailNotificationPreferenceInput = {
  deadlineReminder: boolean;
  initial: boolean;
};

function isMissingMarketplaceNotificationPreferencesSchemaError(error: { code?: string; message?: string }) {
  const message = error.message ?? "";
  return (
    error.code === "42703" ||
    error.code === "42P01" ||
    (error.code === "PGRST205" && message.toLowerCase().includes("schema cache"))
  );
}

function emptyDashboard(userEmail: string | null): MarketplaceEmailNotificationPreferencesDashboard {
  return {
    preferences: marketplaceEmailNotificationPreferenceKinds.map((notificationKind) => ({
      enabled: false,
      notificationKind,
      updatedAt: null
    })),
    schemaReady: false,
    userEmail
  };
}

function mapDashboard(
  rows: MarketplaceEmailNotificationPreferenceRow[],
  userEmail: string | null
): MarketplaceEmailNotificationPreferencesDashboard {
  const rowByKind = new Map(
    rows
      .filter((row): row is MarketplaceEmailNotificationPreferenceRow & {
        notification_kind: MarketplaceEmailNotificationPreferenceKind;
      } => marketplaceEmailNotificationPreferenceKinds.includes(row.notification_kind as never))
      .map((row) => [row.notification_kind, row])
  );

  return {
    preferences: marketplaceEmailNotificationPreferenceKinds.map((notificationKind) => {
      const row = rowByKind.get(notificationKind);
      return {
        enabled: row?.enabled === true,
        notificationKind,
        updatedAt: row?.updated_at ?? null
      };
    }),
    schemaReady: true,
    userEmail
  };
}

export async function getMarketplaceEmailNotificationPreferencesDashboard(
  supabase: SupabaseClient
): Promise<MarketplaceEmailNotificationPreferencesDashboard> {
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("로그인 후 이메일 알림 설정을 확인할 수 있습니다.");
  }

  const userEmail = user.email ?? null;
  const { data, error } = await supabase
    .from("marketplace_notification_preferences")
    .select("notification_kind,enabled,updated_at")
    .eq("profile_id", user.id)
    .eq("channel", "email");

  if (error) {
    if (isMissingMarketplaceNotificationPreferencesSchemaError(error)) return emptyDashboard(userEmail);
    throw new Error(error.message);
  }

  return mapDashboard((data ?? []) as MarketplaceEmailNotificationPreferenceRow[], userEmail);
}

export async function upsertOwnMarketplaceEmailNotificationPreferences(
  supabase: SupabaseClient,
  input: MarketplaceEmailNotificationPreferenceInput
) {
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("로그인 후 이메일 알림 설정을 저장할 수 있습니다.");
  }

  const now = new Date().toISOString();
  const rows = [
    {
      channel: "email",
      enabled: input.initial,
      notification_kind: "initial",
      profile_id: user.id,
      updated_at: now
    },
    {
      channel: "email",
      enabled: input.deadlineReminder,
      notification_kind: "deadline_reminder",
      profile_id: user.id,
      updated_at: now
    }
  ];

  const { error } = await supabase
    .from("marketplace_notification_preferences")
    .upsert(rows, {
      onConflict: "profile_id,channel,notification_kind"
    });

  if (error) throw new Error(error.message);

  return {
    deadlineReminder: input.deadlineReminder,
    initial: input.initial,
    updatedAt: now
  };
}
