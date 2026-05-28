import { PageHeading } from "@/components/page-heading";
import { UsedCarExportTabs } from "@/features/used-car-export/used-car-export-tabs";
import { VehicleSpecLookupPanel } from "@/features/vehicle-spec/vehicle-spec-lookup-panel";
import { getUsedCarExportDictionary } from "@/lib/i18n";
import { getRequestLocale, resolveUserLocale } from "@/lib/i18n/server";
import { createSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase/server";

async function resolveUsedCarExportDictionary() {
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

  return getUsedCarExportDictionary(locale);
}

export default async function UsedCarExportVehicleSpecPage() {
  const dictionary = await resolveUsedCarExportDictionary();

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
