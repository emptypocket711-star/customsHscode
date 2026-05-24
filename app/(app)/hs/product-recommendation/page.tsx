import { redirect } from "next/navigation";

export default async function ProductRecommendationPage({
  searchParams
}: {
  searchParams: Promise<{ productName?: string; basisDate?: string }>;
}) {
  const params = await searchParams;
  const query = params.productName?.trim();
  const target = new URLSearchParams();

  if (query) target.set("query", query);
  if (params.basisDate) target.set("basisDate", params.basisDate);

  redirect(`/hs/direct${target.size ? `?${target.toString()}` : ""}`);
}
