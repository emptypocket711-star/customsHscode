import { notFound } from "next/navigation";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeading } from "@/components/page-heading";
import { completionReportPreviewUnavailableCopy } from "@/features/service-requests/service-request-completion-report-fallback-copy";
import { buildCompletionReportPreview } from "@/features/service-requests/service-request-completion-report-preview";
import { ServiceRequestCompletionReportPreviewDocument } from "@/features/service-requests/service-request-completion-report-preview-document";
import type { CompletionReportKind } from "@/features/service-requests/service-request-completion-report-labels";
import { canShowCompletionReportPreviewForRoute } from "@/features/service-requests/service-request-completion-report-preview-route";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  listCompletionReportDocumentsForReports,
  listOwnCompletionReportsForRequests,
  selectCompletionReportForRequest
} from "@/server/repositories/service-request-completion-report.repository";

function CompletionReportPreviewUnavailable({
  description,
  title
}: {
  description: string;
  title: string;
}) {
  const copy = completionReportPreviewUnavailableCopy();

  return (
    <div className="grid gap-5">
      <PageHeading title={title} description={description} />
      <Card>
        <CardHeader
          title={copy.title}
          description={copy.description}
        />
        <CardBody>
          <p className="text-sm leading-6 text-slate-600">
            {copy.body}
          </p>
        </CardBody>
      </Card>
    </div>
  );
}

export async function ServiceRequestCompletionReportPreviewPage({
  description,
  kind,
  requestId,
  title
}: {
  description: string;
  kind: CompletionReportKind;
  requestId: string;
  title: string;
}) {
  const supabase = await createSupabaseServerClient();
  const reports = await listOwnCompletionReportsForRequests(supabase, [requestId]);

  if (!reports.schemaReady) {
    return <CompletionReportPreviewUnavailable title={title} description={description} />;
  }

  const report = selectCompletionReportForRequest(reports.items, requestId);

  if (!canShowCompletionReportPreviewForRoute(report, kind)) notFound();

  const documents = await listCompletionReportDocumentsForReports(supabase, [report.reportId]);

  if (!documents.schemaReady) {
    return <CompletionReportPreviewUnavailable title={title} description={description} />;
  }

  const preview = buildCompletionReportPreview({
    archiveDocuments: documents.items.map((document) => ({
      documentRole: document.documentRole,
      requiredForArchive: document.requiredForArchive
    })),
    clearanceResult: report.clearanceResult,
    createdAt: report.createdAt,
    currency: report.currency,
    finalAmount: report.finalAmount,
    freightResult: report.freightResult,
    lockedAt: report.lockedAt,
    reportId: report.reportId,
    requestId: report.requestId,
    requesterCompanyId: report.requesterCompanyId,
    requestType: kind,
    selectedPartnerCompanyId: report.selectedPartnerCompanyId,
    settlementItems: report.settlementItems,
    sourceSnapshot: report.sourceSnapshot,
    status: report.status,
    submittedAt: report.submittedAt,
    summary: report.summary,
    updatedAt: report.updatedAt
  });

  return (
    <div className="grid gap-5">
      <PageHeading title={title} description={description} />
      <ServiceRequestCompletionReportPreviewDocument backHref={`/requests/${kind}/${requestId}`} preview={preview} />
    </div>
  );
}
