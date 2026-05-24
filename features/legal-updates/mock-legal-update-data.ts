export type LegalSourceSnapshot = {
  id: string;
  sourceType: string;
  sourceName: string;
  sourceUrl: string;
  sourceVersion: string;
  publishedAt: string;
  retrievedAt: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  checksum: string;
  rawFilePath: string;
  status: "fetched" | "parsed" | "reviewed" | "published" | "rejected";
};

export type LegalChangeEvent = {
  id: string;
  snapshotId: string;
  sourceType: string;
  lawName: string | null;
  articleNo: string | null;
  noticeName: string | null;
  hskCode: string | null;
  changeType: string;
  oldValue: string;
  newValue: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  impactArea: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  reviewStatus: "pending" | "approved" | "rejected";
  createdAt: string;
};

export type ImpactedReport = {
  id: string;
  hskCode: string;
  reportType: "import" | "export" | "hs_lookup";
  generatedAt: string;
  basisDate: string;
  status: "source_changed_after_generation";
  reason: string;
};

export const mockLegalSourceSnapshots: LegalSourceSnapshot[] = [
  {
    id: "snapshot-tariff-2026-05-20",
    sourceType: "tariff_rates",
    sourceName: "관세법령정보포털 세율표",
    sourceUrl: "https://unipass.customs.go.kr/clip/index.do",
    sourceVersion: "mock-tariff-2026-05-20",
    publishedAt: "2026-05-20T09:00:00+09:00",
    retrievedAt: "2026-05-21T02:15:00+09:00",
    effectiveFrom: "2026-06-01",
    effectiveTo: null,
    checksum: "mock-checksum-tariff-20260520",
    rawFilePath: "legal-snapshots/tariff/2026-05-20/raw.csv",
    status: "parsed"
  },
  {
    id: "snapshot-export-control-2026-05-18",
    sourceType: "export_control",
    sourceName: "전략물자 수출입고시",
    sourceUrl: "https://www.law.go.kr/",
    sourceVersion: "mock-export-control-2026-05-18",
    publishedAt: "2026-05-18T09:00:00+09:00",
    retrievedAt: "2026-05-21T03:10:00+09:00",
    effectiveFrom: "2026-05-25",
    effectiveTo: null,
    checksum: "mock-checksum-export-control-20260518",
    rawFilePath: "legal-snapshots/export-control/2026-05-18/raw.pdf",
    status: "parsed"
  },
  {
    id: "snapshot-cosmetic-2026-05-12",
    sourceType: "import_requirements",
    sourceName: "통합공고 화장품 수입요건",
    sourceUrl: "https://www.law.go.kr/",
    sourceVersion: "mock-cosmetic-notice-2026-05-12",
    publishedAt: "2026-05-12T09:00:00+09:00",
    retrievedAt: "2026-05-21T04:00:00+09:00",
    effectiveFrom: "2026-05-12",
    effectiveTo: null,
    checksum: "mock-checksum-cosmetic-20260512",
    rawFilePath: "legal-snapshots/requirements/2026-05-12/raw.html",
    status: "published"
  }
];

export const mockLegalChangeEvents: LegalChangeEvent[] = [
  {
    id: "change-tariff-8507601000",
    snapshotId: "snapshot-tariff-2026-05-20",
    sourceType: "tariff_rates",
    lawName: null,
    articleNo: null,
    noticeName: "관세율표",
    hskCode: "8507601000",
    changeType: "tariff_rate_changed",
    oldValue: "기본세율 8%",
    newValue: "기본세율 6.5%",
    effectiveFrom: "2026-06-01",
    effectiveTo: null,
    impactArea: "수입 관세율",
    riskLevel: "critical",
    reviewStatus: "pending",
    createdAt: "2026-05-21T02:20:00+09:00"
  },
  {
    id: "change-export-control-8543709090",
    snapshotId: "snapshot-export-control-2026-05-18",
    sourceType: "export_control",
    lawName: "전략물자 수출입고시",
    articleNo: "별표 2",
    noticeName: null,
    hskCode: "8543709090",
    changeType: "export_control_condition_changed",
    oldValue: "통신 기능 사양 검토",
    newValue: "암호 기능 및 최종사용자 조건 추가",
    effectiveFrom: "2026-05-25",
    effectiveTo: null,
    impactArea: "수출통제 예비 리스크",
    riskLevel: "critical",
    reviewStatus: "pending",
    createdAt: "2026-05-21T03:20:00+09:00"
  },
  {
    id: "change-cosmetic-agency",
    snapshotId: "snapshot-cosmetic-2026-05-12",
    sourceType: "import_requirements",
    lawName: "화장품법",
    articleNo: null,
    noticeName: "통합공고",
    hskCode: "3304991000",
    changeType: "agency_name_changed",
    oldValue: "식약처",
    newValue: "식품의약품안전처",
    effectiveFrom: "2026-05-12",
    effectiveTo: null,
    impactArea: "수입요건 안내문",
    riskLevel: "medium",
    reviewStatus: "approved",
    createdAt: "2026-05-21T04:10:00+09:00"
  },
  {
    id: "change-formatting-3926909000",
    snapshotId: "snapshot-cosmetic-2026-05-12",
    sourceType: "standard_product_names",
    lawName: null,
    articleNo: null,
    noticeName: "표준품명",
    hskCode: "3926909000",
    changeType: "formatting_only",
    oldValue: "플라스틱부품",
    newValue: "플라스틱 부품",
    effectiveFrom: "2026-05-12",
    effectiveTo: null,
    impactArea: "표준품명 표시",
    riskLevel: "low",
    reviewStatus: "pending",
    createdAt: "2026-05-21T04:15:00+09:00"
  }
];

export const mockImpactedReports: ImpactedReport[] = [
  {
    id: "report-import-850760-001",
    hskCode: "8507601000",
    reportType: "import",
    generatedAt: "2026-05-10T11:30:00+09:00",
    basisDate: "2026-05-10",
    status: "source_changed_after_generation",
    reason: "관세율 변경 이벤트 발생"
  },
  {
    id: "report-export-854370-002",
    hskCode: "8543709090",
    reportType: "export",
    generatedAt: "2026-05-19T16:45:00+09:00",
    basisDate: "2026-05-19",
    status: "source_changed_after_generation",
    reason: "수출통제 조건 변경 이벤트 발생"
  }
];
