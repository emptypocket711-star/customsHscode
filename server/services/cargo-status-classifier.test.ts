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
      status: "반입신고",
      statusCode: "",
      shedCode: "03077001",
      shedName: "테스트 CY",
      location: "테스트 CY"
    }, cyShed)).toEqual({
      displayStatus: "CY 반입신고",
      candidates: ["CY 반입신고", "반입신고"]
    });
  });

  it("classifies unloading place N as CFS inbound", () => {
    expect(classifyCargoEventStatus({
      status: "반입신고",
      statusCode: "",
      shedCode: "03077002",
      shedName: "테스트 CFS",
      location: "테스트 CFS"
    }, cfsShed)).toEqual({
      displayStatus: "CFS 반입신고",
      candidates: ["CFS 반입신고", "반입신고"]
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
        managementInspectionYn: "",
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
          status: "반입신고",
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
    expect(candidates.displayCurrentStatus).toBe("CFS 반입신고");
    expect(statusMatched({
      targetStatus: "cfs_inbound",
      currentStatus: candidates.currentStatus,
      eventStatuses: candidates.eventStatuses
    })).toBe(true);
  });

  it("uses the latest event by event time as the current display status", () => {
    const result: CustomsCargoProgressResult = {
      summary: {
        cargoManagementNo: "26TEST",
        masterBlNo: "",
        houseBlNo: "HBL1",
        progressStatus: "수입신고전",
        progressStatusCode: "",
        managementInspectionYn: "",
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
          status: "반입신고",
          statusCode: "",
          location: "테스트 CFS",
          shedCode: "03077002",
          shedName: "테스트 CFS",
          agency: "",
          processingDetails: ""
        },
        {
          eventTime: "2026-05-27 13:30",
          status: "반출신고",
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
    expect(candidates.currentStatus).toBe("반출신고");
    expect(candidates.displayCurrentStatus).toBe("반출신고");
    expect(statusMatched({
      targetStatus: "cfs_inbound",
      currentStatus: candidates.currentStatus,
      eventStatuses: candidates.eventStatuses
    })).toBe(true);
  });

  it("does not match broader display text unless the actual status candidate is allowed", () => {
    expect(statusMatched({
      targetStatus: "수입신고",
      currentStatus: "수입신고수리",
      eventStatuses: ["수입신고수리"]
    })).toBe(false);
    expect(statusMatched({
      targetStatus: "수입신고수리",
      currentStatus: "수입신고수리",
      eventStatuses: []
    })).toBe(true);
  });

  it("matches a target status when it already appeared in earlier history", () => {
    expect(statusMatched({
      targetStatus: "manifest_submitted",
      currentStatus: "수입신고수리",
      eventStatuses: ["적하목록 제출", "입항보고", "하선신고수리", "수입신고", "수입신고수리"]
    })).toBe(true);
  });

  it("keeps CY inbound and CFS inbound separate when shed information is available", () => {
    expect(statusMatched({
      targetStatus: "cy_inbound",
      currentStatus: "CFS 반입신고",
      eventStatuses: ["CFS 반입신고", "반입신고"]
    })).toBe(false);

    expect(statusMatched({
      targetStatus: "cfs_inbound",
      currentStatus: "CFS 반입신고",
      eventStatuses: ["CFS 반입신고", "반입신고"]
    })).toBe(true);
  });

  it("falls back to general inbound only when the user selected broad inbound", () => {
    expect(statusMatched({
      targetStatus: "inbound",
      currentStatus: "CY 반입완료",
      eventStatuses: ["CY 반입완료", "반입완료"]
    })).toBe(true);

    expect(statusMatched({
      targetStatus: "cfs_inbound",
      currentStatus: "CY 반입완료",
      eventStatuses: ["CY 반입완료", "반입완료"]
    })).toBe(false);
  });
});
