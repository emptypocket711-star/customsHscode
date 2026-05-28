import { PageHeading } from "@/components/page-heading";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
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

export default async function UsedCarExportPage() {
  const dictionary = await resolveUsedCarExportDictionary();

  return (
    <div className="grid gap-5">
      <PageHeading
        title={dictionary.overview.title}
        description={dictionary.overview.description}
      />
      <UsedCarExportTabs dictionary={dictionary} />
      <Card>
        <CardHeader title={dictionary.overview.featureTitle} description={dictionary.overview.featureDescription} />
        <CardBody>
          <div className="grid gap-3 md:grid-cols-2">
            {dictionary.overview.rows.map((row) => (
              <div className="rounded-md border border-slate-200 bg-slate-50 p-4" key={row.title}>
                <p className="text-sm font-semibold text-slate-950">{row.title}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">{row.description}</p>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
