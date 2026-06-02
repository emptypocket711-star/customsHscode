import { describe, expect, it } from "vitest";
import {
  serviceRequestPartnerInterestStatusLabel,
  serviceRequestPartnerInterestStatusTone
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
});
