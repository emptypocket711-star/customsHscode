import { PageHeading } from "@/components/page-heading";
import { UsedCarExportTabs } from "@/features/used-car-export/used-car-export-tabs";
import { VehicleSpecLookupPanel } from "@/features/vehicle-spec/vehicle-spec-lookup-panel";
import { getUsedCarExportDictionary } from "@/lib/i18n";
import { resolveCurrentUserLocale } from "@/lib/i18n/server";

export default async function UsedCarExportVehicleSpecPage() {
  const dictionary = getUsedCarExportDictionary(await resolveCurrentUserLocale());

  return (
    <div className="grid gap-5">
      <PageHeading
        title={dictionary.vehicleSpec.pageTitle}
        description={dictionary.vehicleSpec.pageDescription}
      />
      <UsedCarExportTabs dictionary={dictionary} />
      <VehicleSpecLookupPanel dictionary={dictionary} />
    </div>
  );
}
