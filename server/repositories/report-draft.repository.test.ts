import { describe, expect, it } from "vitest";
import { buildReportDraftJson } from "@/server/repositories/report-draft.repository";

describe("report draft repository helpers", () => {
  it("builds a source-lockable preliminary report json without final certainty", () => {
    const report = buildReportDraftJson(
      {
        id: "candidate-1",
        request_id: "request-1",
        hsk_code: "8507601000",
        hs6: "850760",
        confidence_score: 0.78,
        reason: "리튬 단서가 있어 후보로 제시합니다.",
        risk_notes: "담당자 검토 필요",
        status: "staff_confirmed"
      },
      {
        id: "request-1",
        company_id: "company-1",
        direction: "export",
        input_product_name: "Lithium-ion Battery Module",
        origin_country: "KR",
        export_country: "KR",
        shipment_country: "KR",
        destination_country: "DE",
        basis_date: "2026-05-22"
      },
      {
        hsk_code: "8507601000",
        hs6: "850760",
        korean_name: "리튬이온 축전지",
        source_name: "관세법령정보포털 HSK 품목분류표",
        source_url: "https://unipass.customs.go.kr/clip/index.do",
        source_version: "mock-2026-hsk",
        effective_from: "2026-01-01",
        effective_to: null,
        published_at: "2026-01-01T00:00:00+09:00",
        retrieved_at: "2026-05-21T00:00:00+09:00",
        checksum: "mock-hs-8507601000-2026"
      }
    );

    expect(report.hskCode).toBe("8507601000");
    expect(report.legalSafetyNotice).toContain("예비진단");
    expect(JSON.stringify(report)).toContain("담당자 검토");
  });
});
