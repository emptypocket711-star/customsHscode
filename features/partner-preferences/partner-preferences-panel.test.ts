import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PartnerPreferencesPanel } from "@/features/partner-preferences/partner-preferences-panel";
import type { PartnerPreferencesDashboard } from "@/server/repositories/partner-preferences.repository";

function dashboardFixture(overrides: Partial<PartnerPreferencesDashboard> = {}): PartnerPreferencesDashboard {
  return {
    companyId: "company-1",
    companyRole: "admin",
    partyTypes: ["forwarder"],
    preferences: [{
      cargoTags: [],
      destinationCountryCodes: [],
      digestEnabled: false,
      directions: ["export"],
      id: null,
      notificationEnabled: true,
      originCountryCodes: [],
      ports: [],
      serviceType: "freight",
      transportModes: [],
      updatedAt: null,
      urgentAvailable: false
    }],
    schemaReady: true,
    ...overrides
  };
}

describe("PartnerPreferencesPanel", () => {
  it("shows match diagnostics for freight partner preferences", () => {
    const html = renderToStaticMarkup(createElement(PartnerPreferencesPanel, {
      dashboard: dashboardFixture()
    }));

    expect(html).toContain("매칭 범위 진단 기준");
    expect(html).toContain("국가, 운송 방식, 항구, 화물 태그는 모두 매칭 조건에 사용됩니다.");
    expect(html).toContain("used_car, hazardous, temperature_controlled");
  });

  it("shows urgent matching guidance for clearance partner preferences", () => {
    const html = renderToStaticMarkup(createElement(PartnerPreferencesPanel, {
      dashboard: dashboardFixture({
        partyTypes: ["customs_broker"],
        preferences: [{
          cargoTags: [],
          destinationCountryCodes: [],
          digestEnabled: false,
          directions: ["import"],
          id: null,
          notificationEnabled: true,
          originCountryCodes: [],
          ports: [],
          serviceType: "clearance",
          transportModes: [],
          updatedAt: null,
          urgentAvailable: false
        }]
      })
    }));

    expect(html).toContain("긴급 건 대응 가능을 끄면 긴급 통관 의뢰는 매칭되지 않습니다.");
  });
});
