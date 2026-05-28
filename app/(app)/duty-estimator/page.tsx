import { Suspense } from "react";
import { PageHeading } from "@/components/page-heading";
import { DutyEstimatorPanel } from "@/features/duty-estimator/duty-estimator-panel";
import { getDutyEstimatorDictionary } from "@/lib/i18n";
import { resolveCurrentUserLocale } from "@/lib/i18n/server";

export default async function DutyEstimatorPage() {
  const locale = await resolveCurrentUserLocale();
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
