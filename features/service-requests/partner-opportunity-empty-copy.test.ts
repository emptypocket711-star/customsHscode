import { describe, expect, it } from "vitest";
import { partnerOpportunityEmptyCopy } from "@/features/service-requests/partner-opportunity-empty-copy";

describe("partner opportunity empty copy", () => {
  it("explains freight opportunities depend on verification and forwarder preferences", () => {
    expect(partnerOpportunityEmptyCopy.freight).toContain("현재 입찰 가능한 운송 요청이 없습니다");
    expect(partnerOpportunityEmptyCopy.freight).toContain("회사 검증 상태");
    expect(partnerOpportunityEmptyCopy.freight).toContain("포워더 관심 조건");
  });

  it("explains clearance opportunities depend on verification and broker preferences", () => {
    expect(partnerOpportunityEmptyCopy.clearance).toContain("현재 입찰 가능한 통관 의뢰가 없습니다");
    expect(partnerOpportunityEmptyCopy.clearance).toContain("회사 검증 상태");
    expect(partnerOpportunityEmptyCopy.clearance).toContain("관세사무소 관심 조건");
  });
});
