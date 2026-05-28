import { PageHeading } from "@/components/page-heading";
import { HjitContainerCheckPanel } from "@/features/used-car-export/hjit-container-check-panel";
import { UsedCarExportTabs } from "@/features/used-car-export/used-car-export-tabs";
import { getUsedCarExportDictionary } from "@/lib/i18n";
import { resolveCurrentUserLocale } from "@/lib/i18n/server";

export default async function UsedCarExportContainerCheckPage() {
  const dictionary = getUsedCarExportDictionary(await resolveCurrentUserLocale());

  return (
    <div className="grid gap-5">
      <PageHeading
        title={dictionary.container.pageTitle}
        description={dictionary.container.pageDescription}
      />
      <UsedCarExportTabs dictionary={dictionary} />
      <HjitContainerCheckPanel dictionary={dictionary} />
    </div>
  );
}
