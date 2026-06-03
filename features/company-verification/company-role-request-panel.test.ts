import { describe, expect, it } from "vitest";
import { companyRoleRequestDisabledMessage } from "@/features/company-verification/company-role-request-panel";

describe("companyRoleRequestDisabledMessage", () => {
  it("explains when role request schema is not ready", () => {
    expect(companyRoleRequestDisabledMessage({
      companyRole: "admin",
      schemaReady: false
    })).toContain("역할 신청 데이터가 준비되지 않아 신청할 수 없습니다");
  });

  it("explains when the user is not the company admin", () => {
    expect(companyRoleRequestDisabledMessage({
      companyRole: "member",
      schemaReady: true
    })).toContain("회사 관리자에게 국내 수출입 화주 또는 필요한 플랫폼 역할 신청을 요청");
  });

  it("returns no disabled copy when a company admin can request roles", () => {
    expect(companyRoleRequestDisabledMessage({
      companyRole: "admin",
      schemaReady: true
    })).toBeNull();
  });
});
