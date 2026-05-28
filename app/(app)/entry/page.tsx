import Link from "next/link";
import { ArrowRight, Calculator, Globe2, PackageSearch, Search } from "lucide-react";
import { PageHeading } from "@/components/page-heading";
import { Card, CardBody } from "@/components/ui/card";
import { getEntryDictionary } from "@/lib/i18n";
import { getRequestLocale, resolveUserLocale } from "@/lib/i18n/server";
import { createSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase/server";

const entryIcons = {
  cargo: PackageSearch,
  direct: Search,
  duty: Calculator,
  export: Globe2
};

export default async function EntryPage() {
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

  const dictionary = getEntryDictionary(locale);

  return (
    <>
      <PageHeading
        title={dictionary.title}
        description={dictionary.description}
      />
      <div className="grid gap-4 md:grid-cols-2">
        {dictionary.entries.map((entry) => {
          const Icon = entryIcons[entry.key];

          return (
            <Link className="focus-ring rounded-lg" href={entry.href} key={entry.href}>
              <Card className="h-full transition hover:border-blue-300 hover:shadow-md">
                <CardBody>
                  <div className="flex items-start gap-4">
                    <span className="grid size-11 shrink-0 place-items-center rounded-md bg-blue-50 text-blue-700">
                      <Icon aria-hidden="true" size={22} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <h2 className="text-lg font-semibold text-slate-950">{entry.title}</h2>
                        <ArrowRight aria-hidden="true" className="text-slate-400" size={18} />
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{entry.description}</p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Link>
          );
        })}
      </div>
    </>
  );
}
