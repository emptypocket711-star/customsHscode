import { PageHeading } from "@/components/page-heading";
import { ImportDiagnosisPanel } from "@/features/import-diagnosis/import-diagnosis-panel";

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

  return (
    <>
      <PageHeading title="수입 관세·요건" description="HSK와 국가 정보를 기준으로 관세율, FTA, C/O, 수입요건을 표시합니다." />
      <ImportDiagnosisPanel params={params} />
    </>
  );
}
