import { Suspense } from "react";
import { PageHeading } from "@/components/page-heading";
import { DutyEstimatorPanel } from "@/features/duty-estimator/duty-estimator-panel";
import { getDutyEstimatorDictionary } from "@/lib/i18n";
import { getRequestLocale, resolveUserLocale } from "@/lib/i18n/server";
import { createSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase/server";

export default async function DutyEstimatorPage() {
  const requestLocale = await getRequestLocale();
  let locale = requestLocale;

  if (hasSupabaseEnv()) {
    try {
      const supabase = await createSupabaseServerClient();
      const user = (await supabase.auth.getUser()).data.user;
      locale = user?.id ? await resolveUserLocale(user.id) : requestLocale;
    } catch {
      locale = requestLocale;
    }
  }

  const dictionary = getDutyEstimatorDictionary(locale);

  return (
    <>
      <PageHeading
        title={dictionary.page.title}
        description={dictionary.page.description}
      />
      <Suspense>
        <DutyEstimatorPanel dictionary={dictionary} />
      </Suspense>
    </>
  );
}
