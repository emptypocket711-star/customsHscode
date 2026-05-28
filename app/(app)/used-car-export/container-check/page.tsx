import { PageHeading } from "@/components/page-heading";
import { HjitContainerCheckPanel } from "@/features/used-car-export/hjit-container-check-panel";
import { UsedCarExportTabs } from "@/features/used-car-export/used-car-export-tabs";
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

export default async function UsedCarExportContainerCheckPage() {
  const dictionary = await resolveUsedCarExportDictionary();

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
