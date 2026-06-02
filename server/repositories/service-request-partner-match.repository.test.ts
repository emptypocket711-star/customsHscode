import { describe, expect, it, vi } from "vitest";
import { markServiceRequestPartnerMatchViewed } from "@/server/repositories/service-request-partner-match.repository";

describe("service request partner match repository", () => {
  it("marks none interest matches as viewed through the guarded RPC", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: "match-1", error: null });

    await expect(markServiceRequestPartnerMatchViewed(
      { rpc } as never,
      { currentInterestStatus: "none", matchId: "match-1" }
    )).resolves.toEqual({ marked: true, schemaReady: true });

    expect(rpc).toHaveBeenCalledWith("set_service_request_partner_interest", {
      p_interest_status: "viewed",
      p_match_id: "match-1"
    });
  });

  it("does not downgrade already handled interest states", async () => {
    const rpc = vi.fn();

    await expect(markServiceRequestPartnerMatchViewed(
      { rpc } as never,
      { currentInterestStatus: "interested", matchId: "match-1" }
    )).resolves.toEqual({ marked: false, schemaReady: true });

    expect(rpc).not.toHaveBeenCalled();
  });

  it("returns schemaReady false when the marketplace RPC is not available", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { code: "PGRST205", message: "Could not find the function in the schema cache" }
    });

    await expect(markServiceRequestPartnerMatchViewed(
      { rpc } as never,
      { currentInterestStatus: "none", matchId: "match-1" }
    )).resolves.toEqual({ marked: false, schemaReady: false });
  });

  it("throws unexpected RPC errors", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { code: "42501", message: "permission denied" }
    });

    await expect(markServiceRequestPartnerMatchViewed(
      { rpc } as never,
      { currentInterestStatus: "none", matchId: "match-1" }
    )).rejects.toThrow("permission denied");
  });
});
