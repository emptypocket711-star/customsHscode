export type SourceVersionInventoryItem = {
  targetTable: string;
  sourceName: string;
  sourceVersion: string;
  status: "draft" | "staged" | "reviewed" | "published" | "rejected" | "archived";
  rowCount: number;
  latestRetrievedAt: string | null;
  latestPublishedAt: string | null;
};

export const mockSourceVersionInventory: SourceVersionInventoryItem[] = [
  {
    targetTable: "hs_master",
    sourceName: "관세청 HS부호",
    sourceVersion: "customs-hs-20260101",
    status: "staged",
    rowCount: 12469,
    latestRetrievedAt: "2026-05-22T19:42:00+09:00",
    latestPublishedAt: null
  },
  {
    targetTable: "standard_product_names",
    sourceName: "관세청 표준품명",
    sourceVersion: "customs-standard-product-20260101",
    status: "staged",
    rowCount: 26873,
    latestRetrievedAt: "2026-05-22T19:42:00+09:00",
    latestPublishedAt: null
  },
  {
    targetTable: "customs_hs_code_search_items",
    sourceName: "관세청 HS부호검색",
    sourceVersion: "myc-openapi-api018-v1.0:2026-05",
    status: "staged",
    rowCount: 0,
    latestRetrievedAt: null,
    latestPublishedAt: null
  },
  {
    targetTable: "tariff_rates",
    sourceName: "관세청 품목번호별 관세율표",
    sourceVersion: "customs-domestic-tariff-20260211",
    status: "staged",
    rowCount: 760428,
    latestRetrievedAt: "2026-05-22T19:42:00+09:00",
    latestPublishedAt: null
  },
  {
    targetTable: "tariff_rates",
    sourceName: "관세청 관세율 조회",
    sourceVersion: "myc-openapi-api030-v1.0",
    status: "staged",
    rowCount: 0,
    latestRetrievedAt: null,
    latestPublishedAt: null
  },
  {
    targetTable: "export_destination_tariff_rates",
    sourceName: "관세청 국가별 관세율표",
    sourceVersion: "customs-country-tariff-20251231:*",
    status: "staged",
    rowCount: 665657,
    latestRetrievedAt: "2026-05-22T19:42:00+09:00",
    latestPublishedAt: null
  },
  {
    targetTable: "customs_confirmation_requirements",
    sourceName: "관세청 세관장확인대상 법령코드 조회",
    sourceVersion: "myc-openapi-api029-v1.0",
    status: "staged",
    rowCount: 0,
    latestRetrievedAt: null,
    latestPublishedAt: null
  },
  {
    targetTable: "origin_marking_targets",
    sourceName: "대외무역관리규정 별표 8 원산지표시대상물품",
    sourceVersion: "origin-marking-targets-law-20260525",
    status: "published",
    rowCount: 687,
    latestRetrievedAt: "2026-05-25T00:00:00+09:00",
    latestPublishedAt: "2026-05-25T00:00:00+09:00"
  },
  {
    targetTable: "origin_marking_methods",
    sourceName: "원산지제도 운영에 관한 고시 별표 3",
    sourceVersion: "origin-marking-methods-law-20260525",
    status: "published",
    rowCount: 907,
    latestRetrievedAt: "2026-05-25T00:00:00+09:00",
    latestPublishedAt: "2026-05-25T00:00:00+09:00"
  },
  {
    targetTable: "internal_tax_law_rules",
    sourceName: "내국세 법령 테스트 룰",
    sourceVersion: "internal-tax-law-test-rules-20260524",
    status: "published",
    rowCount: 5,
    latestRetrievedAt: "2026-05-24T00:00:00+09:00",
    latestPublishedAt: "2026-05-24T00:00:00+09:00"
  },
  {
    targetTable: "export_destination_data_sources",
    sourceName: "상대국 수입 데이터 출처 레지스트리",
    sourceVersion: "destination-source-registry-20260523",
    status: "staged",
    rowCount: 20,
    latestRetrievedAt: "2026-05-23T00:00:00+09:00",
    latestPublishedAt: null
  }
];
