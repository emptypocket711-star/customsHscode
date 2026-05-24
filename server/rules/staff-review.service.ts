import { mockLegalChangeEvents } from "@/features/legal-updates/mock-legal-update-data";
import {
  mockHsConfirmationReviewItems,
  mockDocumentLineItemReviewItems,
  mockHsCandidateReviewItems
} from "@/features/staff-review/mock-staff-review-data";
import type {
  DocumentLineItemReviewItem,
  HsConfirmationReviewItem,
  HsCandidateReviewItem
} from "@/features/staff-review/mock-staff-review-data";
import { hasSupabaseEnv, createSupabaseServerClient } from "@/lib/supabase/server";
import { getStaffReviewQueueFromSupabase } from "@/server/repositories/staff-review.repository";
import { generateMockReport } from "@/server/rules/report.service";

export type ReportReviewItem = {
  id: string;
  companyName: string;
  reportType: "import" | "export" | "hs_lookup";
  title: string;
  basisDate: string;
  hskCode: string;
  customerSummary: string;
  status: "draft" | "pending_review" | "approved" | "published" | "rejected" | "source_changed_after_generation";
};

export type StaffReviewQueue = {
  hsCandidates: HsCandidateReviewItem[];
  hsConfirmationRequests: HsConfirmationReviewItem[];
  documentLineItems: DocumentLineItemReviewItem[];
  reports: ReportReviewItem[];
  legalChanges: typeof mockLegalChangeEvents;
  summary: {
    hsCandidateCount: number;
    hsConfirmationRequestCount: number;
    documentLineItemCount: number;
    reportReviewCount: number;
    legalChangeCount: number;
    blockedPublishCount: number;
  };
  permissions: {
    clientCanApprove: false;
    staffCanApprove: true;
    approvalRequiresAuditLog: true;
  };
  dataSource: "mock" | "supabase";
  loadError?: string;
};

function createSummary(queue: Pick<StaffReviewQueue, "hsCandidates" | "hsConfirmationRequests" | "documentLineItems" | "reports" | "legalChanges">) {
  const blockedPublishCount = queue.legalChanges.filter((change) => ["medium", "high", "critical"].includes(change.riskLevel)).length;

  return {
    hsCandidateCount: queue.hsCandidates.length,
    hsConfirmationRequestCount: queue.hsConfirmationRequests.length,
    documentLineItemCount: queue.documentLineItems.length,
    reportReviewCount: queue.reports.length,
    legalChangeCount: queue.legalChanges.length,
    blockedPublishCount
  };
}

export function getMockStaffReviewQueue(loadError?: string): StaffReviewQueue {
  const reports = [generateMockReport("import"), generateMockReport("export")]
    .filter((report) => report.approval.status === "pending_review")
    .map((report) => ({
      id: report.id,
      companyName: report.companyName,
      reportType: report.reportType,
      title: report.title,
      basisDate: report.basisDate,
      hskCode: report.hskCode,
      customerSummary: report.customerSummary,
      status: report.approval.status
    }));
  const legalChanges = mockLegalChangeEvents.filter((change) => change.reviewStatus === "pending");
  const hsCandidates = mockHsCandidateReviewItems.filter((candidate) => candidate.status === "suggested" || candidate.status === "selected");
  const hsConfirmationRequests = mockHsConfirmationReviewItems.filter((item) => item.status === "pending_review");
  const documentLineItems = mockDocumentLineItemReviewItems.filter((lineItem) => lineItem.status === "pending_review");

  const queue: StaffReviewQueue = {
    hsCandidates,
    hsConfirmationRequests,
    documentLineItems,
    reports,
    legalChanges,
    summary: createSummary({ hsCandidates, hsConfirmationRequests, documentLineItems, reports, legalChanges }),
    permissions: {
      clientCanApprove: false,
      staffCanApprove: true,
      approvalRequiresAuditLog: true
    },
    dataSource: "mock" as const,
    loadError
  };

  return queue;
}

export async function getStaffReviewQueue(): Promise<StaffReviewQueue> {
  if (!hasSupabaseEnv()) {
    return getMockStaffReviewQueue();
  }

  try {
    const supabase = await createSupabaseServerClient();
    const queue = await getStaffReviewQueueFromSupabase(supabase);
    return {
      ...queue,
      summary: createSummary(queue),
      permissions: {
        clientCanApprove: false,
        staffCanApprove: true,
        approvalRequiresAuditLog: true
      },
      dataSource: "supabase"
    };
  } catch (error) {
    return getMockStaffReviewQueue(error instanceof Error ? error.message : "Supabase 검토 큐 조회 중 오류가 발생했습니다.");
  }
}

export function assertStaffCanApprove(role: "developer" | "admin" | "customs_staff" | "client") {
  if (role !== "developer" && role !== "admin" && role !== "customs_staff") {
    throw new Error("개발자 운영 계정만 승인할 수 있습니다.");
  }

  return true;
}
