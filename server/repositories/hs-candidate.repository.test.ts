import { describe, expect, it } from "vitest";
import { mapRecommendationToCandidateInsert } from "@/server/repositories/hs-candidate.repository";
import { recommendHsCandidates } from "@/server/rules/hs-candidate.service";

describe("hs candidate repository helpers", () => {
  it("maps deterministic recommendations to review candidate rows", () => {
    const [recommendation] = recommendHsCandidates({
      productName: "Lithium-ion Battery Module",
      basisDate: "2026-05-21"
    });

    const row = mapRecommendationToCandidateInsert("00000000-0000-0000-0000-000000000001", recommendation);

    expect(row.request_id).toBe("00000000-0000-0000-0000-000000000001");
    expect(row.hsk_code).toBe("8507601000");
    expect(row.status).toBe("suggested");
    expect(row.required_questions.length).toBeGreaterThan(0);
  });
});
