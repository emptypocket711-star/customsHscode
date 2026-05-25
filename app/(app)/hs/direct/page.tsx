import { PageHeading } from "@/components/page-heading";
import { HsDirectLookupPanel } from "@/features/hs/hs-direct-lookup-panel";

export default async function HsDirectPage({
  searchParams
}: {
  searchParams: Promise<{
    query?: string;
    hskCode?: string;
    direction?: string;
    destinationCountry?: string;
    originCountry?: string;
    basisDate?: string;
    destinationHsCode?: string;
    favoriteStatus?: string;
  }>;
}) {
  const params = await searchParams;

  return (
    <>
      <PageHeading
        title="통합 조회"
        description="HS CODE 또는 품명을 입력하면 수입 기준 관세율·수입요건 또는 한국 수출 기준 수출요건을 표시합니다."
      />
      <HsDirectLookupPanel
        basisDate={params.basisDate}
        destinationCountry={params.destinationCountry}
        direction={params.direction}
        destinationHsCode={params.destinationHsCode}
        favoriteStatus={params.favoriteStatus}
        hskCode={params.hskCode}
        originCountry={params.originCountry}
        query={params.query}
      />
    </>
  );
}
