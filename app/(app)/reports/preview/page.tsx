import { PageHeading } from "@/components/page-heading";
import { ReportPreview } from "@/features/reports/report-preview";
import { getReportPreviewDictionary } from "@/lib/i18n";
import { resolveCurrentUserLocale } from "@/lib/i18n/server";
import { generateMockReport } from "@/server/rules/report.service";

export default async function ReportPreviewPage({
  searchParams
}: {
  searchParams: Promise<{ type?: "import" | "export" }>;
}) {
  const params = await searchParams;
  const dictionary = getReportPreviewDictionary(await resolveCurrentUserLocale());
  const report = generateMockReport(params.type === "export" ? "export" : "import");

  return (
    <>
      <PageHeading
        title={dictionary.page.title}
        description={dictionary.page.description}
      />
      <ReportPreview dictionary={dictionary} report={report} />
    </>
  );
}
