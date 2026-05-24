import {
  mockImpactedReports,
  mockLegalChangeEvents,
  mockLegalSourceSnapshots,
  type LegalChangeEvent
} from "@/features/legal-updates/mock-legal-update-data";

export type LegalUpdateDashboard = {
  lastSuccessfulFetches: Array<{
    sourceType: string;
    sourceName: string;
    sourceVersion: string;
    retrievedAt: string;
    checksum: string;
    status: string;
  }>;
  pendingChanges: LegalChangeEvent[];
  approvedChanges: LegalChangeEvent[];
  autoPublishableChanges: LegalChangeEvent[];
  blockedPublishChanges: LegalChangeEvent[];
  impactedHsCodes: string[];
  impactedReports: typeof mockImpactedReports;
  summary: {
    pendingCount: number;
    blockedCount: number;
    impactedReportCount: number;
    criticalCount: number;
  };
};

function riskRank(riskLevel: LegalChangeEvent["riskLevel"]) {
  return { critical: 4, high: 3, medium: 2, low: 1 }[riskLevel];
}

function requiresStaffReview(change: LegalChangeEvent) {
  return ["medium", "high", "critical"].includes(change.riskLevel);
}

export function getLegalUpdateDashboard(): LegalUpdateDashboard {
  const sortedChanges = [...mockLegalChangeEvents].sort((a, b) => {
    const riskDelta = riskRank(b.riskLevel) - riskRank(a.riskLevel);
    if (riskDelta !== 0) {
      return riskDelta;
    }

    return b.createdAt.localeCompare(a.createdAt);
  });

  const pendingChanges = sortedChanges.filter((change) => change.reviewStatus === "pending");
  const approvedChanges = sortedChanges.filter((change) => change.reviewStatus === "approved");
  const autoPublishableChanges = pendingChanges.filter((change) => !requiresStaffReview(change));
  const blockedPublishChanges = pendingChanges.filter(requiresStaffReview);
  const impactedHsCodes = Array.from(
    new Set(sortedChanges.map((change) => change.hskCode).filter((hskCode): hskCode is string => Boolean(hskCode)))
  );

  return {
    lastSuccessfulFetches: mockLegalSourceSnapshots.map((snapshot) => ({
      sourceType: snapshot.sourceType,
      sourceName: snapshot.sourceName,
      sourceVersion: snapshot.sourceVersion,
      retrievedAt: snapshot.retrievedAt,
      checksum: snapshot.checksum,
      status: snapshot.status
    })),
    pendingChanges,
    approvedChanges,
    autoPublishableChanges,
    blockedPublishChanges,
    impactedHsCodes,
    impactedReports: mockImpactedReports,
    summary: {
      pendingCount: pendingChanges.length,
      blockedCount: blockedPublishChanges.length,
      impactedReportCount: mockImpactedReports.length,
      criticalCount: sortedChanges.filter((change) => change.riskLevel === "critical").length
    }
  };
}

export const legalUpdateInternals = {
  requiresStaffReview,
  riskRank
};
