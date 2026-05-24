import { describe, expect, it } from "vitest";
import { documentLineEvidenceFromRawExtraction } from "@/server/repositories/staff-review.repository";

describe("staff review repository helpers", () => {
  it("extracts short evidence summaries from raw document extraction", () => {
    expect(
      documentLineEvidenceFromRawExtraction({
        evidence: [
          {
            field: "originCountry",
            value: "KR",
            source_text: "Country of Origin: KR"
          },
          {
            field: "destinationCountry",
            value: "CN",
            source_text: "Destination Country: China"
          }
        ]
      })
    ).toEqual([
      {
        field: "originCountry",
        value: "KR",
        sourceText: "Country of Origin: KR"
      },
      {
        field: "destinationCountry",
        value: "CN",
        sourceText: "Destination Country: China"
      }
    ]);
  });

  it("ignores malformed evidence values", () => {
    expect(documentLineEvidenceFromRawExtraction({ evidence: [{ field: "invoiceNo" }, null] })).toEqual([]);
    expect(documentLineEvidenceFromRawExtraction(null)).toEqual([]);
  });
});
