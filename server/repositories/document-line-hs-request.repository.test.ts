import { describe, expect, it } from "vitest";
import { createHsRequestFromDocumentLineItemRpcName } from "@/server/repositories/document-line-hs-request.repository";

describe("document line hs request repository", () => {
  it("uses the staff-only document promotion RPC", () => {
    expect(createHsRequestFromDocumentLineItemRpcName).toBe("create_hs_request_from_document_line_item");
  });
});
