import { PageHeading } from "@/components/page-heading";
import { HsDirectLookupPanel } from "@/features/hs/hs-direct-lookup-panel";
import { createSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase/server";
import { getSeoulDateString } from "@/lib/utils";
import { recordHsLookupHistory } from "@/server/repositories/hs-lookup-history.repository";

export default async function OverseasHsPage({
  searchParams
}: {
  searchParams: Promise<{ query?: string; hskCode?: string; destinationCountry?: string; originCountry?: string; basisDate?: string; destinationHsCode?: string }>;
}) {
  const params = await searchParams;
  const query = params.query?.trim() || params.hskCode?.trim() || params.destinationHsCode?.trim();

  if (query && hasSupabaseEnv()) {
    try {
      const supabase = await createSupabaseServerClient();
      await recordHsLookupHistory(supabase, {
        basisDate: params.basisDate || getSeoulDateString(),
        destinationCountry: params.destinationCountry || "CHN",
        direction: "export",
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
