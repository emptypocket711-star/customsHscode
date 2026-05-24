import { PageHeading } from "@/components/page-heading";
import { HsDirectLookupPanel } from "@/features/hs/hs-direct-lookup-panel";

export default async function OverseasHsPage({
  searchParams
}: {
  searchParams: Promise<{ query?: string; hskCode?: string; destinationCountry?: string; originCountry?: string; basisDate?: string; destinationHsCode?: string }>;
}) {
  const params = await searchParams;

  return (
    <>
      <PageHeading
        title="해외 HS CODE조회"
        description="한국 HS CODE 또는 품명으로 수출 목적국의 HS CODE, 현지 품명, 관세율, 내국세, 수입요건을 조회합니다."
      />
      <HsDirectLookupPanel
        basisDate={params.basisDate}
        defaultDirection="export"
        destinationCountry={params.destinationCountry}
        destinationHsCode={params.destinationHsCode}
        exportResultMode="destination"
        hskCode={params.hskCode}
        originCountry={params.originCountry}
        panelTitle="해외 HS CODE조회"
        query={params.query}
        showDirectionSelect={false}
      />
    </>
  );
}
