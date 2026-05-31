import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeading } from "@/components/page-heading";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { UsedCarExportTabs } from "@/features/used-car-export/used-car-export-tabs";
import { getUsedCarExportDictionary } from "@/lib/i18n";
import { resolveCurrentUserLocale } from "@/lib/i18n/server";

export default async function UsedCarExportPage() {
  const dictionary = getUsedCarExportDictionary(await resolveCurrentUserLocale());

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
              <Link
                className="focus-ring group rounded-md border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-200 hover:bg-blue-50"
                data-navigation-progress={row.title}
                href={row.href}
                key={row.title}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-950">{row.title}</p>
                  <ArrowRight aria-hidden="true" className="text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-blue-700" size={17} />
                </div>
                <p className="mt-1 text-sm leading-6 text-slate-600">{row.description}</p>
                <span className="mt-3 inline-flex items-center text-xs font-semibold text-blue-700">{dictionary.overview.openTool}</span>
              </Link>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
