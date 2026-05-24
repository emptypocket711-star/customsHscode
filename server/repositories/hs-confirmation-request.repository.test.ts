import { describe, expect, it } from "vitest";
import { createHsConfirmationRequestRpcName } from "@/server/repositories/hs-confirmation-request.repository";

describe("hs confirmation request repository", () => {
  it("uses the constrained HS confirmation request RPC", () => {
    expect(createHsConfirmationRequestRpcName).toBe("create_hs_confirmation_request");
  });
});
