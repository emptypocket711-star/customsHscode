import { describe, expect, it } from "vitest";
import {
  countServiceRequestStatuses,
  filterServiceRequestsByStatus,
  serviceRequestPartnerInterestStatusLabel,
  serviceRequestPartnerInterestStatusTone,
  serviceRequestStatusFilterOptions
} from "@/features/service-requests/service-request-status";

describe("service request status helpers", () => {
  it("labels partner opportunity interest statuses", () => {
    expect(serviceRequestPartnerInterestStatusLabel("none")).toBe("미확인");
    expect(serviceRequestPartnerInterestStatusLabel("viewed")).toBe("검토중");
    expect(serviceRequestPartnerInterestStatusLabel("interested")).toBe("관심 표시");
    expect(serviceRequestPartnerInterestStatusLabel("declined")).toBe("참여 보류");
  });

  it("maps partner opportunity interest statuses to badge tones", () => {
    expect(serviceRequestPartnerInterestStatusTone("none")).toBe("neutral");
    expect(serviceRequestPartnerInterestStatusTone("viewed")).toBe("info");
    expect(serviceRequestPartnerInterestStatusTone("interested")).toBe("success");
    expect(serviceRequestPartnerInterestStatusTone("declined")).toBe("warning");
  });

  it("counts request statuses for requester and partner filters", () => {
    const counts = countServiceRequestStatuses(
      [
        { status: "draft" },
        { status: "open" },
        { status: "bids_received" },
        { status: "partner_selected" },
        { status: "in_progress" },
        { status: "completed" }
      ],
      [{ id: "match-1" }, { id: "match-2" }]
    );

    expect(counts.all).toBe(6);
    expect(counts.inProgressOrSelected).toBe(2);
    expect(counts.completed).toBe(1);
    expect(counts.opportunities).toBe(2);
    expect(serviceRequestStatusFilterOptions(counts, "requester").map((option) => option.label)).toEqual([
      "전체",
      "초안",
      "모집중",
      "견적 도착",
      "진행중",
      "완료"
    ]);
    expect(serviceRequestStatusFilterOptions(counts, "partner").map((option) => option.label)).toEqual(["전체", "입찰 가능"]);
  });

  it("filters selected partner requests as in-progress work", () => {
    const requests = [
      { id: "draft", status: "draft" },
      { id: "selected", status: "partner_selected" },
      { id: "started", status: "in_progress" },
      { id: "done", status: "completed" }
    ];

    expect(filterServiceRequestsByStatus(requests, "in_progress").map((request) => request.id)).toEqual([
      "selected",
      "started"
    ]);
    expect(filterServiceRequestsByStatus(requests, "completed").map((request) => request.id)).toEqual(["done"]);
  });
});
