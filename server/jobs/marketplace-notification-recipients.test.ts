import { describe, expect, it, vi } from "vitest";
import {
  listMarketplaceNotificationRecipientsForPartner,
  mapMarketplaceNotificationRecipients
} from "@/server/jobs/marketplace-notification-recipients";

describe("marketplace notification recipients", () => {
  it("keeps only onboarded client users from the partner company and prioritizes admins", () => {
    expect(mapMarketplaceNotificationRecipients([
      {
        company_id: "partner-1",
        company_role: "member",
        email: "member@example.test",
        id: "user-member",
        onboarding_completed_at: "2026-06-01T00:00:00.000Z",
        role: "client"
      },
      {
        company_id: "partner-1",
        company_role: "admin",
        email: "admin@example.test",
        id: "user-admin",
        onboarding_completed_at: "2026-06-01T00:00:00.000Z",
        role: "client"
      },
      {
        company_id: "partner-1",
        company_role: "admin",
        email: "developer@example.test",
        id: "user-developer",
        onboarding_completed_at: "2026-06-01T00:00:00.000Z",
        role: "developer"
      },
      {
        company_id: "other-company",
        company_role: "admin",
        email: "other@example.test",
        id: "user-other",
        onboarding_completed_at: "2026-06-01T00:00:00.000Z",
        role: "client"
      },
      {
        company_id: "partner-1",
        company_role: "admin",
        email: "pending@example.test",
        id: "user-pending",
        onboarding_completed_at: null,
        role: "client"
      },
      {
        company_id: "partner-1",
        company_role: "admin",
        email: "invalid email",
        id: "user-invalid-email",
        onboarding_completed_at: "2026-06-01T00:00:00.000Z",
        role: "client"
      }
    ], "partner-1")).toEqual([
      {
        companyRole: "admin",
        email: "admin@example.test",
        userId: "user-admin"
      },
      {
        companyRole: "member",
        email: "member@example.test",
        userId: "user-member"
      }
    ]);
  });

  it("requires explicit email opt-in when a notification kind is provided", () => {
    const rows = [
      {
        company_id: "partner-1",
        company_role: "admin",
        email: "admin@example.test",
        id: "user-admin",
        onboarding_completed_at: "2026-06-01T00:00:00.000Z",
        role: "client"
      },
      {
        company_id: "partner-1",
        company_role: "member",
        email: "member@example.test",
        id: "user-member",
        onboarding_completed_at: "2026-06-01T00:00:00.000Z",
        role: "client"
      },
      {
        company_id: "partner-1",
        company_role: "member",
        email: "disabled@example.test",
        id: "user-disabled",
        onboarding_completed_at: "2026-06-01T00:00:00.000Z",
        role: "client"
      }
    ];

    expect(mapMarketplaceNotificationRecipients(rows, "partner-1", {
      preferences: [
        {
          channel: "email",
          enabled: true,
          notification_kind: "initial",
          profile_id: "user-member"
        },
        {
          channel: "email",
          enabled: false,
          notification_kind: "initial",
          profile_id: "user-disabled"
        },
        {
          channel: "email",
          enabled: true,
          notification_kind: "deadline_reminder",
          profile_id: "user-admin"
        }
      ],
      requireEmailOptInForKind: "initial"
    })).toEqual([{
      companyRole: "member",
      email: "member@example.test",
      userId: "user-member"
    }]);
  });

  it("queries active client profiles for a partner company without broad profile fields", async () => {
    const query = {
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [{
          company_id: "partner-1",
          company_role: "admin",
          email: "admin@example.test",
          id: "user-admin",
          onboarding_completed_at: "2026-06-01T00:00:00.000Z",
          role: "client"
        }],
        error: null
      }),
      not: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis()
    };
    const supabase = {
      from: vi.fn(() => query)
    };

    await expect(listMarketplaceNotificationRecipientsForPartner(supabase as never, "partner-1")).resolves.toEqual([{
      companyRole: "admin",
      email: "admin@example.test",
      userId: "user-admin"
    }]);

    expect(supabase.from).toHaveBeenCalledWith("profiles");
    expect(query.select).toHaveBeenCalledWith("id,email,company_id,company_role,role,onboarding_completed_at");
    expect(query.eq).toHaveBeenCalledWith("company_id", "partner-1");
    expect(query.eq).toHaveBeenCalledWith("role", "client");
    expect(query.not).toHaveBeenCalledWith("email", "is", null);
    expect(query.not).toHaveBeenCalledWith("onboarding_completed_at", "is", null);
    expect(query.limit).toHaveBeenCalledWith(5);
  });

  it("loads preference rows and applies final limit after email opt-in filtering", async () => {
    const profileQuery = {
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [
          {
            company_id: "partner-1",
            company_role: "admin",
            email: "admin@example.test",
            id: "user-admin",
            onboarding_completed_at: "2026-06-01T00:00:00.000Z",
            role: "client"
          },
          {
            company_id: "partner-1",
            company_role: "member",
            email: "member@example.test",
            id: "user-member",
            onboarding_completed_at: "2026-06-01T00:00:00.000Z",
            role: "client"
          }
        ],
        error: null
      }),
      not: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis()
    };
    const preferenceQuery = {
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis()
    };
    preferenceQuery.eq
      .mockReturnValueOnce(preferenceQuery)
      .mockReturnValueOnce(preferenceQuery)
      .mockResolvedValueOnce({
        data: [{
          channel: "email",
          enabled: true,
          notification_kind: "initial",
          profile_id: "user-member"
        }],
        error: null
      });
    const supabase = {
      from: vi.fn((table: string) => table === "profiles" ? profileQuery : preferenceQuery)
    };

    await expect(listMarketplaceNotificationRecipientsForPartner(supabase as never, "partner-1", {
      limit: 1,
      requireEmailOptInForKind: "initial"
    })).resolves.toEqual([{
      companyRole: "member",
      email: "member@example.test",
      userId: "user-member"
    }]);

    expect(profileQuery.limit).toHaveBeenCalledWith(25);
    expect(supabase.from).toHaveBeenCalledWith("marketplace_notification_preferences");
    expect(preferenceQuery.select).toHaveBeenCalledWith("profile_id,channel,notification_kind,enabled");
    expect(preferenceQuery.in).toHaveBeenCalledWith("profile_id", ["user-admin", "user-member"]);
    expect(preferenceQuery.eq).toHaveBeenCalledWith("channel", "email");
    expect(preferenceQuery.eq).toHaveBeenCalledWith("notification_kind", "initial");
    expect(preferenceQuery.eq).toHaveBeenCalledWith("enabled", true);
  });
});
