import { PageHeading } from "@/components/page-heading";
import { HsDirectLookupPanel } from "@/features/hs/hs-direct-lookup-panel";
import { getHsDirectDictionary } from "@/lib/i18n";
import { getRequestLocale, resolveUserLocale } from "@/lib/i18n/server";
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
  const requestLocale = await getRequestLocale();
  let locale = requestLocale;

  if (query && hasSupabaseEnv()) {
    try {
      const supabase = await createSupabaseServerClient();
      const user = (await supabase.auth.getUser()).data.user;
      locale = user?.id ? await resolveUserLocale(user.id) : requestLocale;
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
  } else if (hasSupabaseEnv()) {
    try {
      const supabase = await createSupabaseServerClient();
      const user = (await supabase.auth.getUser()).data.user;
      locale = user?.id ? await resolveUserLocale(user.id) : requestLocale;
    } catch {
      locale = requestLocale;
    }
  }
  const dictionary = getHsDirectDictionary(locale);

  return (
    <>
      <PageHeading
        title={dictionary.page.overseasTitle}
        description={dictionary.page.overseasDescription}
      />
      <HsDirectLookupPanel
        basisDate={params.basisDate}
        defaultDirection="export"
        destinationCountry={params.destinationCountry}
        destinationHsCode={params.destinationHsCode}
        exportResultMode="destination"
        hskCode={params.hskCode}
        locale={locale}
        originCountry={params.originCountry}
        panelTitle={dictionary.page.overseasTitle}
        query={params.query}
        showDirectionSelect={false}
      />
    </>
  );
}
