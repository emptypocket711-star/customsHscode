import { PageHeading } from "@/components/page-heading";
import { ExportDiagnosisPanel } from "@/features/export-diagnosis/export-diagnosis-panel";
import { getDiagnosisDictionary } from "@/lib/i18n";
import { resolveCurrentUserLocale } from "@/lib/i18n/server";

export default async function ExportDiagnosisPage({
  searchParams
}: {
  searchParams: Promise<{
    hskCode?: string;
    basisDate?: string;
    destinationCountry?: string;
    finalUser?: string;
    productSpecs?: string;
    productUse?: string;
  }>;
}) {
  const params = await searchParams;
  const dictionary = getDiagnosisDictionary(await resolveCurrentUserLocale());

  return (
    <>
      <PageHeading title={dictionary.export.pageTitle} description={dictionary.export.pageDescription} />
      <ExportDiagnosisPanel dictionary={dictionary} params={params} />
    </>
  );
}
