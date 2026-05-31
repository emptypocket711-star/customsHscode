import { describe, expect, it } from "vitest";
import { hsMasterRepositoryInternals } from "@/server/repositories/hs-master.repository";

describe("hs master repository mock lookup", () => {
  it("maps HSK lookup snapshot rows to direct lookup results", () => {
    const result = hsMasterRepositoryInternals.mapSnapshotRowToResult({
      hsk_code: "3926909000",
      hs6: "392690",
      hs4: "3926",
      hs2: "39",
      korean_name: "기타",
      english_name: "Other",
      quantity_unit: "KG",
      weight_unit: "KG",
      tariff_rates: [
        {
          rateType: "A",
          dutyRate: 8,
          unitDuty: null,
          countryGroup: "1",
          usageRateType: null,
          sourceName: "관세청 품목번호별 관세율표",
          sourceVersion: "tariff-v1"
        }
      ],
      customs_confirmation_requirements: [
        {
          documentName: "수입승인",
          relatedLaw: "예시법",
          sourceName: "요건",
          sourceVersion: "requirement-v1"
        }
      ],
      integrated_public_notice_requirements: [],
      source_snapshot: {
        hsMaster: {
          sourceName: "관세청 HSK",
          sourceUrl: "https://example.com",
          sourceVersion: "hsk-v1",
          effectiveFrom: "2026-01-01",
          effectiveTo: null,
          publishedAt: null,
          retrievedAt: "2026-05-31T00:00:00.000Z",
          checksum: "abc"
        }
      },
      standardNames: [{ name: "기타 플라스틱 제품", requiredSpec: "재질", sourceName: "표준품명", sourceVersion: "standard-v1" }],
      importRequirements: [
        {
          type: "세관장확인",
          name: "수입승인",
          relatedLaw: "예시법",
          agencyCode: "MOCK",
          agency: "예시기관",
          agencyContact: {
            agencyCode: "MOCK",
            agencyName: "예시기관",
            phone: "02-0000-0000",
            email: null,
            websiteUrl: "https://example.com/agency",
            note: null
          },
          procedureSummary: null,
          playbook: {
            applicationMethod: "전자민원",
            requiredDocuments: ["신청서"],
            expectedLeadTime: "3영업일",
            exemptionPossibility: null,
            commonRejectionReasons: [],
            customerRequestTemplate: null,
            staffChecklist: ["서류 확인"],
            category: "approval",
            riskLevel: "medium",
            workflowType: "document",
            workflowSteps: ["신청"],
            sourceName: "내부 요건 플레이북",
            sourceUrl: "internal://requirement_playbooks",
            sourceVersion: "playbook-v1"
          },
          sourceName: "요건",
          sourceVersion: "requirement-v1"
        }
      ],
      originMarking: {
        isTarget: true,
        matchedPattern: "3926",
        patternType: "hs4",
        conditionText: null,
        targetSourceName: "원산지표시 대상",
        targetSourceUrl: "https://example.com/origin-target",
        targetSourceVersion: "origin-target-v1",
        method: {
          matchedPattern: "3926",
          itemName: "플라스틱 제품",
          methodSummary: "현품에 원산지 표시",
          note: null,
          sourceName: "원산지표시 방법",
          sourceUrl: "https://example.com/origin-method",
          sourceVersion: "origin-method-v1"
        },
        methods: []
      },
      siblings: [{ hskCode: "3926909000", koreanName: "기타", isSelected: true }]
    }, "2026-05-31");

    expect(result.hskCode).toBe("3926909000");
    expect(result.briefDescription).toBe("플라스틱으로 만든 기타 제품");
    expect(result.tariffPreviews[0]?.label).toBe("기본세율");
    expect(result.tariffPreviews[0]?.rateText).toBe("8%");
    expect(result.importRequirements[0]?.type).toBe("세관장확인");
    expect(result.importRequirements[0]?.agencyContact?.agencyName).toBe("예시기관");
    expect(result.importRequirements[0]?.playbook?.sourceVersion).toBe("playbook-v1");
    expect(result.originMarking?.method?.methodSummary).toBe("현품에 원산지 표시");
    expect(result.standardProductNames[0]?.sourceVersion).toBe("standard-v1");
    expect(result.classificationSiblings[0]?.isSelected).toBe(true);
  });

  it("extracts children from HS4 and HS6 snapshot payloads", () => {
    const hs6Rows = hsMasterRepositoryInternals.snapshotRowsFromPayload({
      lookupMode: "hs6_explorer",
      rows: [{ hs6: "392690", children_json: [{ hsk_code: "3926909000" }] }]
    }, "392690");
    const hs4Rows = hsMasterRepositoryInternals.snapshotRowsFromPayload({
      lookupMode: "hs4_explorer",
      rows: [{ hs4: "3926", hs6_groups_json: [{ hs6: "392690", children: [{ hsk_code: "3926909000" }] }] }]
    }, "3926");

    expect(hs6Rows.map((row) => row.hsk_code)).toEqual(["3926909000"]);
    expect(hs4Rows.map((row) => row.hsk_code)).toEqual(["3926909000"]);
  });

  it("normalizes hsk punctuation and returns published basis-date records", () => {
    const results = hsMasterRepositoryInternals.lookupWithMockData("3304.99-1000", "2026-05-21");

    expect(results).toHaveLength(1);
    expect(results[0]?.hskCode).toBe("3304991000");
    expect(results[0]?.sourceVersion).toBe("mock-2026-hsk");
    expect(results[0]?.standardProductNames[0]?.sourceVersion).toBe("mock-standard-product-2026");
    expect(results[0]?.classificationSiblings[0]?.isSelected).toBe(true);
    expect(results[0]?.tariffPreviews.map((item) => item.label)).toContain("기본세율");
    expect(results[0]?.tariffPreviews.some((item) => item.label.includes("WTO"))).toBe(true);
    expect(results[0]?.tariffPreviews.some((item) => item.label.includes("한ㆍ중국 FTA"))).toBe(true);
    expect(results[0]?.importRequirements[0]?.relatedLaw).toBe("화장품법");
    expect(results[0]?.classificationCases).toHaveLength(3);
    expect(results[0]?.classificationCases[0]?.title).toContain("Skin care cosmetics");
    expect(results[0]?.hierarchyPath.map((node) => node.code)).toEqual(["33", "3304", "330499", "3304991000"]);
  });

  it("excludes records outside the basis date range", () => {
    const results = hsMasterRepositoryInternals.lookupWithMockData("3304999900", "2026-05-21");

    expect(results).toHaveLength(0);
  });

  it("supports hs6 lookup without final classification language", () => {
    const results = hsMasterRepositoryInternals.lookupWithMockData("3304.99", "2026-05-21");

    expect(results).toHaveLength(4);
    expect(results[0]?.hs6).toBe("330499");
    expect(results.map((result) => result.hskCode)).toContain("3304999000");
  });

  it("supports hs4 prefix lookup for overseas tariff workflows", () => {
    const results = hsMasterRepositoryInternals.lookupWithMockData("3304", "2026-05-21");

    expect(results).toHaveLength(5);
    expect(new Set(results.map((result) => result.hs6))).toEqual(new Set(["330410", "330499"]));
  });

  it("supports hs6 lookup for lip make-up preparations", () => {
    const results = hsMasterRepositoryInternals.lookupWithMockData("330410", "2026-05-21");

    expect(results).toHaveLength(1);
    expect(results[0]?.hskCode).toBe("3304101000");
    expect(results[0]?.koreanName).toContain("입술화장");
    expect(results[0]?.importRequirements[0]?.name).toContain("화장품");
    expect(results[0]?.classificationCases).toHaveLength(2);
    expect(results[0]?.hierarchyPath[0]?.label).toContain("화장품");
  });

  it("matches origin marking rules by the most specific available HS prefix", () => {
    const originMarking = hsMasterRepositoryInternals.buildOriginMarkingInfo(
      "3923500000",
      [
        {
          hsk_pattern: "39",
          pattern_type: "hs2",
          condition_text: null,
          is_target: true,
          source_name: "source",
          source_url: "https://example.com/target",
          source_version: "target-v1",
          effective_from: "2026-01-01",
          effective_to: null,
          status: "published"
        },
        {
          hsk_pattern: "3923",
          pattern_type: "hs4",
          condition_text: null,
          is_target: true,
          source_name: "source",
          source_url: "https://example.com/target",
          source_version: "target-v1",
          effective_from: "2026-01-01",
          effective_to: null,
          status: "published"
        }
      ],
      [
        {
          hsk_pattern: "3923",
          pattern_type: "hs4",
          item_name: "플라스틱제 포장용기",
          method_summary: "현품에 원산지표시",
          note: null,
          source_name: "method",
          source_url: "https://example.com/method",
          source_version: "method-v1",
          effective_from: "2026-01-01",
          effective_to: null,
          status: "published"
        },
        {
          hsk_pattern: "3923",
          pattern_type: "hs4",
          item_name: "플라스틱제 포장상자",
          method_summary: "소매용 최소포장에 원산지표시",
          note: "포장상태 확인 필요",
          source_name: "method",
          source_url: "https://example.com/method",
          source_version: "method-v1",
          effective_from: "2026-01-01",
          effective_to: null,
          status: "published"
        }
      ]
    );

    expect(originMarking?.matchedPattern).toBe("3923");
    expect(originMarking?.method?.methodSummary).toBe("현품에 원산지표시");
    expect(originMarking?.methods.map((item) => item.methodSummary)).toEqual([
      "현품에 원산지표시",
      "소매용 최소포장에 원산지표시"
    ]);
  });
});
