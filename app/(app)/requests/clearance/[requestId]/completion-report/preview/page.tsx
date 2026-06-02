import { ServiceRequestCompletionReportPreviewPage } from "@/features/service-requests/service-request-completion-report-preview-page";

export default async function ClearanceCompletionReportPreviewPage({
  params
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = await params;

  return (
    <ServiceRequestCompletionReportPreviewPage
      description="프린트 가능한 거래 종료 기록입니다. HS/FTA/요건은 예비 조회와 실제 신고 결과 기준을 구분합니다."
      kind="clearance"
      requestId={requestId}
      title="통관 완료 리포트 미리보기"
    />
  );
}
