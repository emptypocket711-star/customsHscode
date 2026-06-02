import { describe, expect, it } from "vitest";
import { buildOperationsUsersOwnerPrompt } from "@/features/operations/operations-users-priority-panel";

describe("operations users priority panel", () => {
  it("prioritizes role requests before lower-priority user management work", () => {
    expect(buildOperationsUsersOwnerPrompt({
      attentionCompanies: 3,
      incompleteUsers: 8,
      pendingRoleRequests: 2,
      pendingVerificationDocuments: 4
    })).toContain("역할 신청 2건");
  });

  it("falls back to user support when there are no role or verification blockers", () => {
    expect(buildOperationsUsersOwnerPrompt({
      attentionCompanies: 0,
      incompleteUsers: 5,
      pendingRoleRequests: 0,
      pendingVerificationDocuments: 0
    })).toContain("가입 미완료 사용자 5명");
  });
});
