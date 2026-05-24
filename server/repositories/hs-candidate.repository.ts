import type { SupabaseClient } from "@supabase/supabase-js";
import type { HsCandidateRecommendation } from "@/server/rules/hs-candidate.service";
import { recommendHsCandidates } from "@/server/rules/hs-candidate.service";

type HsRequestRow = {
  id: string;
  input_product_name: string | null;
  product_usage: string | null;
  material: string | null;
  composition: string | null;
  functions: string | null;
  model_name: string | null;
  basis_date: string;
};

export function mapRecommendationToCandidateInsert(requestId: string, recommendation: HsCandidateRecommendation) {
  return {
    request_id: requestId,
    hsk_code: recommendation.hskCode,
    hs6: recommendation.hs6,
    candidate_rank: recommendation.rank,
    confidence_score: recommendation.confidenceScore,
    reason: recommendation.reason,
    required_questions: recommendation.requiredQuestions,
    risk_notes: recommendation.riskNotes,
    status: recommendation.reviewStatus
  };
}

export async function createHsCandidatesForRequest(supabase: SupabaseClient, requestId: string) {
  const { data: request, error: requestError } = await supabase
    .from("hs_search_requests")
    .select("id, input_product_name, product_usage, material, composition, functions, model_name, basis_date")
    .eq("id", requestId)
    .single();

  if (requestError) throw new Error(requestError.message);

  const row = request as HsRequestRow;
  if (!row.input_product_name) {
    return { candidateCount: 0 };
  }

  const recommendations = recommendHsCandidates({
    productName: row.input_product_name,
    productUsage: row.product_usage ?? undefined,
    material: row.material ?? undefined,
    composition: row.composition ?? undefined,
    functions: row.functions ?? undefined,
    modelName: row.model_name ?? undefined,
    basisDate: row.basis_date
  });

  const { error: deleteError } = await supabase
    .from("hs_candidates")
    .delete()
    .eq("request_id", requestId);

  if (deleteError) throw new Error(deleteError.message);

  if (!recommendations.length) {
    return { candidateCount: 0 };
  }

  const { error: insertError } = await supabase
    .from("hs_candidates")
    .insert(recommendations.map((recommendation) => mapRecommendationToCandidateInsert(requestId, recommendation)));

  if (insertError) throw new Error(insertError.message);

  return { candidateCount: recommendations.length };
}
