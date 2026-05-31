export type ReportSourceLock = {
  id: string;
  sourceName: string;
  sourceUrl: string;
  sourceVersion: string;
  sourceSnapshotId: string;
  ruleVersionId: string;
  generatedAt: string;
};

export type ReportApproval = {
  status: "draft" | "pending_review" | "approved" | "published";
  reviewerName: string | null;
  reviewedAt: string | null;
  staffNotes: string[];
};

export type MockReport = {
  id: string;
  requestId: string;
  companyName: string;
  reportType: "import" | "export";
  title: string;
  basisDate: string;
  generatedAt: string;
  hskCode: string;
  hs6: string;
  productName: string;
  customerSummary: string;
  sections: Array<{
    title: string;
    status: "예비진단" | "가능성 있음" | "추가 확인 필요" | "내부 확인 필요";
    items: string[];
  }>;
  sourceLocks: ReportSourceLock[];
  approval: ReportApproval;
  disclaimer: string;
};

export const mockSourceLocks: ReportSourceLock[] = [
  {
    id: "lock-hs-master-001",
    sourceName: "관세법령정보포털 HSK 품목분류표",
    sourceUrl: "https://unipass.customs.go.kr/clip/index.do",
    sourceVersion: "mock-2026-hsk",
    sourceSnapshotId: "snapshot-hs-master-mock-2026",
    ruleVersionId: "rule-hs-direct-v0",
    generatedAt: "2026-05-21T11:00:00+09:00"
  },
  {
    id: "lock-import-rules-001",
    sourceName: "HS FINDER mock import rules",
    sourceUrl: "internal://mock/import-diagnosis",
    sourceVersion: "mock-import-rules-2026",
    sourceSnapshotId: "snapshot-import-rules-mock-2026",
    ruleVersionId: "rule-import-diagnosis-v0",
    generatedAt: "2026-05-21T11:00:00+09:00"
  },
  {
    id: "lock-export-rules-001",
    sourceName: "HS FINDER mock export rules",
    sourceUrl: "internal://mock/export-diagnosis",
    sourceVersion: "mock-export-rules-2026",
    sourceSnapshotId: "snapshot-export-rules-mock-2026",
    ruleVersionId: "rule-export-diagnosis-v0",
    generatedAt: "2026-05-21T11:00:00+09:00"
  }
];
