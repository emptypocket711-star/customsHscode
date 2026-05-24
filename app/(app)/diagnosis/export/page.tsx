import { PageHeading } from "@/components/page-heading";
import { ExportDiagnosisPanel } from "@/features/export-diagnosis/export-diagnosis-panel";

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

  return (
    <>
      <PageHeading title="수출·상대국 세율" description="HSK와 목적국을 기준으로 수출요건, FTA C/O, 상대국 관세율을 표시합니다." />
      <ExportDiagnosisPanel params={params} />
    </>
  );
}
