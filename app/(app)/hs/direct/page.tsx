import { PageHeading } from "@/components/page-heading";
import { HsDirectLookupPanel } from "@/features/hs/hs-direct-lookup-panel";
import { createSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase/server";
import { getSeoulDateString } from "@/lib/utils";
import { recordHsLookupHistory } from "@/server/repositories/hs-lookup-history.repository";

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
  const query = params.query?.trim() || params.hskCode?.trim();

  if (query && hasSupabaseEnv()) {
    try {
      const supabase = await createSupabaseServerClient();
      await recordHsLookupHistory(supabase, {
        basisDate: params.basisDate || getSeoulDateString(),
        destinationCountry: params.destinationCountry,
        direction: params.direction,
        originCountry: params.originCountry,
        query
      });
    } catch {
      // 최근 검색 저장 실패가 조회 화면 렌더링을 막지 않도록 한다.
    }
  }

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
