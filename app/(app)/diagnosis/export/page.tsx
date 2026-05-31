import { redirect } from "next/navigation";

export default async function ExportDiagnosisPage({
  searchParams
}: {
  searchParams: Promise<{
    hskCode?: string;
    basisDate?: string;
    destinationCountry?: string;
    finalUser?: string;
    productSpecs?: string;
    productUse?: string;
  }>;
}) {
  const params = await searchParams;
  const target = new URLSearchParams();

  if (params.hskCode) target.set("query", params.hskCode);
  target.set("direction", "export");
  target.set("destinationCountry", params.destinationCountry || "US");
  if (params.basisDate) target.set("basisDate", params.basisDate);

  redirect(`/hs/overseas?${target.toString()}`);
}
