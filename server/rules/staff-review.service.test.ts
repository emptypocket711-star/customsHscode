import { describe, expect, it } from "vitest";
import { assertStaffCanApprove, getMockStaffReviewQueue } from "@/server/rules/staff-review.service";

describe("staff review service", () => {
  it("aggregates review queues across hs candidates, document lines, reports, and legal changes", () => {
    const queue = getMockStaffReviewQueue();

    expect(queue.summary.hsCandidateCount).toBeGreaterThan(0);
    expect(queue.summary.documentLineItemCount).toBeGreaterThan(0);
    expect(queue.summary.reportReviewCount).toBeGreaterThan(0);
    expect(queue.summary.legalChangeCount).toBeGreaterThan(0);
    expect(queue.permissions.clientCanApprove).toBe(false);
  });

  it("prevents client role approval", () => {
    expect(() => assertStaffCanApprove("client")).toThrow("담당자 또는 관리자");
    expect(assertStaffCanApprove("customs_staff")).toBe(true);
  });
});
