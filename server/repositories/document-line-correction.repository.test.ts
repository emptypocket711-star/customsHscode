import { describe, expect, it } from "vitest";
import {
  correctDocumentLineItemRpcName,
  parseCorrectionsText
} from "@/server/repositories/document-line-correction.repository";

describe("document line correction repository helpers", () => {
  it("uses the staff-only correction RPC", () => {
    expect(correctDocumentLineItemRpcName).toBe("correct_document_line_item");
  });

  it("parses correction text into review checklist items", () => {
    expect(parseCorrectionsText("HSK 후보 선택 필요\n원산지 확인 필요, 단가 확인 필요")).toEqual([
      "HSK 후보 선택 필요",
      "원산지 확인 필요",
      "단가 확인 필요"
    ]);
  });
});
