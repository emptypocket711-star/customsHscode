import { redirect } from "next/navigation";

export default async function ImportDiagnosisPage({
  searchParams
}: {
  searchParams: Promise<{
    hskCode?: string;
    basisDate?: string;
    exportCountry?: string;
    shipmentCountry?: string;
    originCountry?: string;
    manufacturingCountry?: string;
    sellerCountry?: string;
    destinationCountry?: string;
  }>;
}) {
  const params = await searchParams;
  const target = new URLSearchParams();

  if (params.hskCode) target.set("query", params.hskCode);
  target.set("direction", "import");
  target.set("destinationCountry", params.destinationCountry || "ALL");
  if (params.originCountry) target.set("originCountry", params.originCountry);
  if (params.basisDate) target.set("basisDate", params.basisDate);

  redirect(`/hs/direct?${target.toString()}`);
}
