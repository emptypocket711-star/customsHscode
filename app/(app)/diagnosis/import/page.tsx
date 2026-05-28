import { PageHeading } from "@/components/page-heading";
import { ImportDiagnosisPanel } from "@/features/import-diagnosis/import-diagnosis-panel";
import { getDiagnosisDictionary } from "@/lib/i18n";
import { resolveCurrentUserLocale } from "@/lib/i18n/server";

export default async function ImportDiagnosisPage({
  searchParams
}: {
  searchParams: Promise<{
    hskCode?: string;
    basisDate?: string;
    exportCountry?: string;
    shipmentCountry?: string;
    originCountry?: string;
    manufacturingCountry?: string;
    sellerCountry?: string;
    destinationCountry?: string;
  }>;
}) {
  const params = await searchParams;
  const dictionary = getDiagnosisDictionary(await resolveCurrentUserLocale());

  return (
    <>
      <PageHeading title={dictionary.import.pageTitle} description={dictionary.import.pageDescription} />
      <ImportDiagnosisPanel dictionary={dictionary} params={params} />
    </>
  );
}
