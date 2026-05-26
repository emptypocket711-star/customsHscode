import { describe, expect, it } from "vitest";
import {
  buildCargoStatusCandidates,
  classifyCargoEventStatus,
  statusMatched,
  type CargoShedInfo
} from "@/server/services/cargo-status-classifier";
import type { CustomsCargoProgressResult } from "@/server/integrations/customs/customs-api";

const cyShed: CargoShedInfo = {
  shedCode: "03077001",
  shedName: "테스트 CY",
  facilityType: "cy",
  unloadingPlaceBondedAreaYn: "Y"
};

const cfsShed: CargoShedInfo = {
  shedCode: "03077002",
  shedName: "테스트 CFS",
  facilityType: "cfs",
  unloadingPlaceBondedAreaYn: "N"
};

describe("cargo status classifier", () => {
  it("classifies unloading place Y as CY inbound", () => {
    expect(classifyCargoEventStatus({
      status: "반입완료",
      statusCode: "",
      shedCode: "03077001",
      shedName: "테스트 CY",
      location: "테스트 CY"
    }, cyShed)).toEqual({
      displayStatus: "CY 반입완료",
      candidates: ["CY 반입완료", "CY 반입", "반입완료"]
    });
  });

  it("classifies unloading place N as CFS inbound", () => {
    expect(classifyCargoEventStatus({
      status: "반입완료",
      statusCode: "",
      shedCode: "03077002",
      shedName: "테스트 CFS",
      location: "테스트 CFS"
    }, cfsShed)).toEqual({
      displayStatus: "CFS 반입완료",
      candidates: ["CFS 반입완료", "CFS 반입", "반입완료"]
    });
  });

  it("matches already-passed CY/CFS status candidates", () => {
    const result: CustomsCargoProgressResult = {
      summary: {
        cargoManagementNo: "26TEST",
        masterBlNo: "",
        houseBlNo: "HBL1",
        progressStatus: "수입신고전",
        progressStatusCode: "",
        declarationNo: "",
        vesselName: "",
        packageCount: "",
        grossWeight: "",
        weightUnit: "",
        portName: "",
        arrivalDate: ""
      },
      events: [
        {
          eventTime: "2026-05-27 09:00",
          status: "반입완료",
          statusCode: "",
          location: "테스트 CFS",
          shedCode: "03077002",
          shedName: "테스트 CFS",
          agency: "",
          processingDetails: ""
        }
      ]
    };

    const candidates = buildCargoStatusCandidates(result, new Map([["03077002", cfsShed]]));
    expect(candidates.displayCurrentStatus).toBe("CFS 반입완료");
    expect(statusMatched({
      targetStatus: "CFS 반입",
      currentStatus: candidates.currentStatus,
      eventStatuses: candidates.eventStatuses
    })).toBe(true);
  });
});
