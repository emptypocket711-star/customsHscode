import type { CompletionReportKind } from "@/features/service-requests/service-request-completion-report-labels";
import type {
  ServiceRequestCompletionReport,
  ServiceRequestCompletionReportStatus
} from "@/server/repositories/service-request-completion-report.repository";

type VisibleCompletionReportForRoute<
  T extends Pick<ServiceRequestCompletionReport, "requestType" | "status">,
  K extends CompletionReportKind
> =
  T & {
    requestType: K;
    status: Exclude<ServiceRequestCompletionReportStatus, "voided">;
  };

export function canShowCompletionReportPreviewForRoute<
  T extends Pick<ServiceRequestCompletionReport, "requestType" | "status">
>(
  report: T | undefined,
  kind: CompletionReportKind
): report is VisibleCompletionReportForRoute<T, typeof kind> {
  return Boolean(report && report.status !== "voided" && report.requestType === kind);
}
