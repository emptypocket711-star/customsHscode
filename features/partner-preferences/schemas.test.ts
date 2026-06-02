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

  it("normalizes match-critical country, port, and cargo tag values", () => {
    const parsed = partnerPreferenceSchema.parse({
      cargoTags: ["Used_Car", "Hazardous"],
      destinationCountryCodes: ["kr"],
      directions: ["import"],
      originCountryCodes: ["cn"],
      ports: ["busan", "incheon"],
      serviceType: "freight"
    });

    expect(parsed.originCountryCodes).toEqual(["CN"]);
    expect(parsed.destinationCountryCodes).toEqual(["KR"]);
    expect(parsed.ports).toEqual(["BUSAN", "INCHEON"]);
    expect(parsed.cargoTags).toEqual(["used_car", "hazardous"]);
  });

  it("rejects country filters that cannot match request country codes", () => {
    expect(() =>
      partnerPreferenceSchema.parse({
        destinationCountryCodes: ["KOREA"],
        directions: ["import"],
        serviceType: "clearance"
      })
    ).toThrow("국가 코드는 ISO 2자리 코드로 입력해 주세요.");
  });
});
