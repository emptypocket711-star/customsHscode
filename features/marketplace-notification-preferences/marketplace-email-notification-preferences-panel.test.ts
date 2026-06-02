import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MarketplaceEmailNotificationPreferencesPanel } from "@/features/marketplace-notification-preferences/marketplace-email-notification-preferences-panel";
import type { MarketplaceEmailNotificationPreferencesDashboard } from "@/server/repositories/marketplace-notification-preferences.repository";

function dashboardFixture(
  overrides: Partial<MarketplaceEmailNotificationPreferencesDashboard> = {}
): MarketplaceEmailNotificationPreferencesDashboard {
  return {
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
    userEmail: "partner@example.test",
    ...overrides
  };
}

describe("MarketplaceEmailNotificationPreferencesPanel", () => {
  it("separates user email opt-in from company partner preferences", () => {
    const html = renderToStaticMarkup(createElement(MarketplaceEmailNotificationPreferencesPanel, {
      dashboard: dashboardFixture()
    }));

    expect(html).toContain("내 이메일 알림 수신 설정");
    expect(html).toContain("회사 관심 조건과 다른 설정입니다.");
    expect(html).toContain("신규 요청 이메일");
    expect(html).toContain("마감 임박 이메일");
    expect(html).toContain("수신 주소: partner@example.test");
  });

  it("shows a schema fallback without hiding in-app notifications", () => {
    const html = renderToStaticMarkup(createElement(MarketplaceEmailNotificationPreferencesPanel, {
      dashboard: dashboardFixture({
        schemaReady: false
      })
    }));

    expect(html).toContain("이메일 알림 수신 설정이 준비 중입니다.");
    expect(html).toContain("대시보드 인앱 알림은 계속 확인할 수 있습니다.");
  });
});
