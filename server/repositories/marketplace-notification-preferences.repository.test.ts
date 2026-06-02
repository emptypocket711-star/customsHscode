import { describe, expect, it, vi } from "vitest";
import {
  getMarketplaceEmailNotificationPreferencesDashboard,
  upsertOwnMarketplaceEmailNotificationPreferences
} from "@/server/repositories/marketplace-notification-preferences.repository";

describe("marketplace notification preferences repository", () => {
  it("maps missing preference rows to email disabled defaults", async () => {
    const query = {
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis()
    };
    query.eq
      .mockReturnValueOnce(query)
      .mockResolvedValueOnce({
        data: [{
          enabled: true,
          notification_kind: "initial",
          updated_at: "2026-06-03T00:00:00.000Z"
        }],
        error: null
      });
    const supabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              email: "partner@example.test",
              id: "user-1"
            }
          }
        })
      },
      from: vi.fn(() => query)
    };

    await expect(getMarketplaceEmailNotificationPreferencesDashboard(supabase as never)).resolves.toEqual({
      preferences: [
        {
          enabled: true,
          notificationKind: "initial",
          updatedAt: "2026-06-03T00:00:00.000Z"
        },
        {
          enabled: false,
          notificationKind: "deadline_reminder",
          updatedAt: null
        }
      ],
      schemaReady: true,
      userEmail: "partner@example.test"
    });

    expect(supabase.from).toHaveBeenCalledWith("marketplace_notification_preferences");
    expect(query.select).toHaveBeenCalledWith("notification_kind,enabled,updated_at");
    expect(query.eq).toHaveBeenCalledWith("profile_id", "user-1");
    expect(query.eq).toHaveBeenCalledWith("channel", "email");
  });

  it("returns schema fallback when the preference table is not ready", async () => {
    const query = {
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis()
    };
    query.eq
      .mockReturnValueOnce(query)
      .mockResolvedValueOnce({
        data: null,
        error: {
          code: "42P01",
          message: "relation does not exist"
        }
      });
    const supabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              email: "partner@example.test",
              id: "user-1"
            }
          }
        })
      },
      from: vi.fn(() => query)
    };

    const dashboard = await getMarketplaceEmailNotificationPreferencesDashboard(supabase as never);

    expect(dashboard.schemaReady).toBe(false);
    expect(dashboard.preferences.every((preference) => preference.enabled === false)).toBe(true);
  });

  it("upserts both notification kinds for the authenticated user", async () => {
    const query = {
      upsert: vi.fn().mockResolvedValue({
        error: null
      })
    };
    const supabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: "user-1"
            }
          }
        })
      },
      from: vi.fn(() => query)
    };

    await expect(upsertOwnMarketplaceEmailNotificationPreferences(supabase as never, {
      deadlineReminder: false,
      initial: true
    })).resolves.toEqual(expect.objectContaining({
      deadlineReminder: false,
      initial: true
    }));

    expect(supabase.from).toHaveBeenCalledWith("marketplace_notification_preferences");
    expect(query.upsert).toHaveBeenCalledWith([
      expect.objectContaining({
        channel: "email",
        enabled: true,
        notification_kind: "initial",
        profile_id: "user-1"
      }),
      expect.objectContaining({
        channel: "email",
        enabled: false,
        notification_kind: "deadline_reminder",
        profile_id: "user-1"
      })
    ], {
      onConflict: "profile_id,channel,notification_kind"
    });
  });
});
