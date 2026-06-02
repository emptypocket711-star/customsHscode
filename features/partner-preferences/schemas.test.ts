import { describe, expect, it } from "vitest";
import { partnerPreferenceSchema } from "@/features/partner-preferences/schemas";

describe("partner preference schemas", () => {
  it("accepts a freight partner preference", () => {
    const parsed = partnerPreferenceSchema.parse({
      cargoTags: ["used_car"],
      destinationCountryCodes: ["US"],
      digestEnabled: false,
      directions: ["export"],
      notificationEnabled: true,
      originCountryCodes: ["KR"],
      ports: ["BUSAN"],
      serviceType: "freight",
      transportModes: ["sea"],
      urgentAvailable: true
    });

    expect(parsed.serviceType).toBe("freight");
    expect(parsed.directions).toEqual(["export"]);
  });

  it("requires at least one direction", () => {
    expect(() =>
      partnerPreferenceSchema.parse({
        directions: [],
        serviceType: "clearance"
      })
    ).toThrow("수입 또는 수출 방향을 1개 이상 선택해 주세요.");
  });
});
