import { ServiceRequestCompletionReportPreviewPage } from "@/features/service-requests/service-request-completion-report-preview-page";

export default async function FreightCompletionReportPreviewPage({
  params
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = await params;

  return (
    <ServiceRequestCompletionReportPreviewPage
      description="프린트 가능한 거래 종료 기록입니다. 법적 확정 리포트가 아니며 출처와 검토 상태를 함께 표시합니다."
      kind="freight"
      requestId={requestId}
      title="운송 완료 리포트 미리보기"
    />
  );
}
