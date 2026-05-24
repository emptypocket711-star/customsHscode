import { describe, expect, it } from "vitest";
import { analyzeDocumentExtractionClarification, analyzeProductClarification } from "@/server/ai/clarification.service";
import {
  augmentProductInputWithAiTerms,
  buildProductSearchNormalizationCacheKey,
  normalizeProductSearchInput
} from "@/server/ai/product-search-normalization.service";
import { aiProviderInternals } from "@/server/ai/provider";
import { redactSensitiveText } from "@/server/ai/redaction";
import { extractShipmentDocument } from "@/server/rules/document-extraction.service";
import type { HsCandidateRecommendation } from "@/server/rules/hs-candidate.service";

const baseCandidate: HsCandidateRecommendation = {
  hskCode: "3304991000",
  hs6: "330499",
  rank: 1,
  confidenceScore: 0.7,
  koreanName: "기초화장용 제품류",
  reason: "품명에 화장품 단서가 있습니다.",
  requiredQuestions: ["전성분표 확인", "사용 부위 확인"],
  riskNotes: "기능성화장품 여부 확인 필요",
  scoreBreakdown: ["키워드 cream"],
  reviewStatus: "suggested",
  sourceName: "mock",
  sourceUrl: "https://example.test",
  sourceVersion: "test",
  effectiveFrom: "2026-01-01",
  effectiveTo: null,
  basisDate: "2026-05-24"
};

describe("redactSensitiveText", () => {
  it("redacts private contact and amount-like values", () => {
    const result = redactSensitiveText("seller test@example.com tel 010-1234-5678 amount USD 1,200 invoice 123456789");

    expect(result.redactedText).toContain("[EMAIL]");
    expect(result.redactedText).toContain("[PHONE]");
    expect(result.redactedText).toContain("[MONEY]");
    expect(result.redactedText).toContain("[NUMBER]");
  });
});

describe("analyzeProductClarification", () => {
  it("keeps AI suggested candidate codes inside the official candidate set", async () => {
    const result = await analyzeProductClarification({
      productName: "cream",
      basisDate: "2026-05-24",
      officialCandidates: [baseCandidate]
    });

    expect(result.provider).toBe("mock");
    expect(result.allowedCandidateCodes).toEqual(["3304991000"]);
    expect(result.suggestedCandidateCodes).toEqual(["3304991000"]);
    expect(result.missingQuestions.length).toBeGreaterThan(0);
  });
});

describe("normalizeProductSearchInput", () => {
  it("builds AI cache keys from redacted input hashes instead of raw product text", () => {
    const key = buildProductSearchNormalizationCacheKey({
      provider: "openai",
      model: "gpt-test",
      basisDate: "2026-05-24",
      redactedInput: "품명: secret model ABC-123",
      userProvidedHsCodes: ["901910"]
    });

    expect(key).toContain("ai-product-normalization");
    expect(key).toContain("901910");
    expect(key).not.toContain("secret");
    expect(key).not.toContain("ABC-123");
  });

  it("uses AI normalization as search-term and official lookup-hint expansion", async () => {
    const normalization = await normalizeProductSearchInput({
      productName: "excvation",
      basisDate: "2026-05-24"
    });
    const augmented = augmentProductInputWithAiTerms({
      productName: "excvation",
      basisDate: "2026-05-24"
    }, normalization);

    expect(normalization.searchTerms).toEqual(expect.arrayContaining(["excavation", "excavator", "굴삭기"]));
    expect(normalization.candidateHsCodes).toContain("842952");
    expect(augmented.productName).toContain("excavator");
    expect(JSON.stringify(normalization)).not.toContain("8429521000");
  });

  it("normalizes model-like misspelled product names into search terms only", async () => {
    const normalization = await normalizeProductSearchInput({
      productName: "lazer belt cs-3000",
      basisDate: "2026-05-24"
    });

    expect(normalization.searchTerms).toEqual(expect.arrayContaining(["laser belt", "massage apparatus", "마사지용 기기"]));
    expect(normalization.candidateHsCodes).toContain("901910");
    expect(normalization.missingQuestions.join(" ")).toContain("마사지");
    expect(JSON.stringify(normalization)).not.toContain("9019102000");
  });

  it("can return HS prefixes only as official lookup hints", () => {
    const fallback = {
      provider: "openai" as const,
      model: "test",
      correctedProductName: null,
      searchTerms: [],
      koreanTerms: [],
      englishTerms: [],
      productFamilies: [],
      candidateHsCodes: [],
      candidateHsCodeReasons: [],
      webSources: [],
      missingQuestions: []
    };
    const parsed = aiProviderInternals.parseAiProductSearchNormalizationJson(JSON.stringify({
      correctedProductName: "black and white printer",
      searchTerms: ["printer"],
      koreanTerms: ["프린터"],
      englishTerms: ["printer"],
      productFamilies: ["office machine"],
      candidateHsCodes: ["8443.31", "844332", "bad-code"],
      candidateHsCodeReasons: [
        { code: "8443.32", reason: "프린터 단독기 가능성", requiredInfo: ["복합기 여부"] },
        { code: "bad-code", reason: "bad", requiredInfo: ["bad"] }
      ],
      webSources: [{ title: "Maker page", url: "https://example.com/product" }],
      missingQuestions: ["인쇄 방식 확인"]
    }), fallback);

    expect(parsed.candidateHsCodes).toEqual(["844331", "844332"]);
    expect(parsed.candidateHsCodeReasons).toEqual([
      { code: "844332", reason: "프린터 단독기 가능성", requiredInfo: ["복합기 여부"] }
    ]);
    expect(parsed.webSources).toEqual([{ title: "Maker page", url: "https://example.com/product" }]);
  });
});

describe("analyzeDocumentExtractionClarification", () => {
  it("creates missing-information questions from extracted document lines without candidate creation", async () => {
    const document = extractShipmentDocument(`
Commercial Invoice
Invoice No: CI-77
Country of Origin: Korea
Description | Model | Qty | Unit | Unit Price | Amount
PARTS | P-100 | 3 | EA | USD 10 | USD 30
`);
    const result = await analyzeDocumentExtractionClarification(document, "2026-05-24");

    expect(result.documentType).toBe("commercial_invoice");
    expect(result.lineCount).toBe(1);
    expect(result.suggestedCandidateCodes).toEqual([]);
    expect(result.missingQuestions.length).toBeGreaterThan(0);
  });
});

describe("OpenAI provider parsing", () => {
  it("extracts output text from Responses API payload shape", () => {
    const text = aiProviderInternals.outputTextFromOpenAiResponse({
      output: [
        {
          content: [
            {
              type: "output_text",
              text: "{\"summary\":\"ok\"}"
            }
          ]
        }
      ]
    });

    expect(text).toBe("{\"summary\":\"ok\"}");
  });

  it("falls back safely when model output is not JSON", () => {
    const fallback = {
      provider: "openai" as const,
      model: "test",
      confidence: "low" as const,
      summary: "fallback",
      missingQuestions: ["question"],
      suggestedCandidateCodes: ["3304991000"],
      riskNotes: ["risk"]
    };
    const parsed = aiProviderInternals.parseAiClarificationJson("not-json", fallback);

    expect(parsed).toEqual(fallback);
  });

  it("extracts web search sources from Responses API payload", () => {
    const sources = aiProviderInternals.webSourcesFromOpenAiResponse({
      output: [
        {
          type: "web_search_call",
          action: {
            sources: [
              { title: "Product page", url: "https://example.com/product" }
            ]
          }
        }
      ]
    });

    expect(sources).toEqual([{ title: "Product page", url: "https://example.com/product" }]);
  });
});
