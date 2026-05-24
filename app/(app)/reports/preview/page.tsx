import { PageHeading } from "@/components/page-heading";
import { ReportPreview } from "@/features/reports/report-preview";
import { generateMockReport } from "@/server/rules/report.service";

export default async function ReportPreviewPage({
  searchParams
}: {
  searchParams: Promise<{ type?: "import" | "export" }>;
}) {
  const params = await searchParams;
  const report = generateMockReport(params.type === "export" ? "export" : "import");

  return (
    <>
      <PageHeading
        title="리포트 미리보기"
        description="보고서 생성 시점의 source snapshot과 rule version을 잠그고, 담당자 검토 상태를 고객 표시와 분리합니다."
      />
      <ReportPreview report={report} />
    </>
  );
}
