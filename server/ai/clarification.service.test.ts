import { afterEach, describe, expect, it, vi } from "vitest";
import { analyzeDocumentExtractionClarification, analyzeProductClarification } from "@/server/ai/clarification.service";
import {
  augmentProductInputWithAiTerms,
  buildProductSearchNormalizationCacheKey,
  normalizeProductSearchInput,
  prioritizePrincipalArticleHsHints
} from "@/server/ai/product-search-normalization.service";
import { aiProviderInternals, OpenAiProvider } from "@/server/ai/provider";
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

afterEach(() => {
  vi.unstubAllGlobals();
});

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

  it("keeps provisional GPT HS directions when official candidate expansion is empty", async () => {
    const result = await analyzeProductClarification({
      productName: "printer black and white",
      basisDate: "2026-05-24",
      officialCandidates: []
    });

    expect(result.provider).toBe("mock");
    expect(result.allowedCandidateCodes).toEqual([]);
    expect(result.suggestedCandidateCodes).toContain("844332");
    expect(result.riskNotes.join(" ")).toContain("예비 검토 방향");
  });
});

describe("normalizeProductSearchInput", () => {
  it("parses object-shaped GPT HS code candidates", () => {
    const parsed = aiProviderInternals.parseAiProductSearchNormalizationJson(JSON.stringify({
      normalizedProductName: "아이코스",
      candidateHsCodes: [
        { hsCode: "8543.70", description: "전기식 가열 담배 기기" },
        { hsCode: "2403.99", description: "담배 관련 제품 가능성" }
      ],
      missingQuestions: ["담배 스틱 포함 여부"]
    }), {
      provider: "openai",
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
    });

    expect(parsed.correctedProductName).toBe("아이코스");
    expect(parsed.candidateHsCodes).toEqual(["854370", "240399"]);
    expect(parsed.candidateHsCodeReasons[0]?.reason).toContain("가열");
  });

  it("builds AI cache keys from redacted input hashes instead of raw product text", () => {
    const key = buildProductSearchNormalizationCacheKey({
      provider: "openai",
      model: "gpt-test",
      basisDate: "2026-05-24",
      redactedInput: "품명: secret model ABC-123",
      userProvidedHsCodes: ["901910"]
    });

    expect(key).toContain("ai-product-normalization");
    expect(key).toContain("product-search-normalization-v21");
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

  it("asks branch questions before showing apparel candidates for unclear work vest names", async () => {
    const normalization = await normalizeProductSearchInput({
      productName: "작업용 조끼",
      basisDate: "2026-05-24"
    });

    expect(normalization.classificationState).toBe("needs_clarification");
    expect(normalization.displayMode).toBe("needs_more_info");
    expect(normalization.candidateHsCodes).toEqual([]);
    expect(normalization.missingQuestions.join(" ")).toContain("편직물");
  });

  it("keeps provisional HS6 hints when clarification is needed but the broad boundary is useful", () => {
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
      classificationState: "needs_clarification",
      displayMode: "needs_more_info",
      certainty: "medium",
      correctedProductName: "Apple Watch",
      primaryCandidate: {
        code: "8517.62",
        reason: "일반적인 스마트워치는 무선 데이터 송수신용 웨어러블 기기 계열 검토가 필요합니다.",
        requiredInfo: ["셀룰러 통신 기능 포함 여부", "블루투스 단독 모델인지"]
      },
      candidateHsCodes: ["8517.62"],
      candidateHsCodeReasons: [
        { code: "851762", reason: "무선통신 기능이 있는 스마트워치 가능성", requiredInfo: ["LTE 기능 여부"] }
      ],
      missingQuestions: ["셀룰러 기능 포함 여부"]
    }), fallback);

    expect(parsed.classificationState).toBe("needs_clarification");
    expect(parsed.candidateHsCodes).toEqual(["851762"]);
    expect(parsed.primaryCandidate?.requiredInfo).toContain("셀룰러 통신 기능 포함 여부");
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

  it("keeps GPT candidate order ahead of local context fallback hints", () => {
    const parsed = aiProviderInternals.parseAiProductSearchNormalizationJson(JSON.stringify({
      correctedProductName: "keyboard controller",
      candidateHsCodes: ["854370", "847160"],
      candidateHsCodeReasons: [
        { code: "854370", reason: "GPT 판단상 전기식 제어장치 가능성이 더 높음", requiredInfo: ["기능 확인"] },
        { code: "847160", reason: "키보드 입력장치 가능성", requiredInfo: ["완제품 여부"] }
      ],
      searchTerms: ["keyboard controller"]
    }), {
      provider: "openai",
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
    });

    expect(parsed.candidateHsCodes).toEqual(["854370", "847160"]);
  });

  it("keeps product-name GPT instructions focused on direct HS lookup", () => {
    const instructions = aiProviderInternals.aiProductSearchNormalizationInstructions();

    expect(instructions).toContain("\"검색품명\" HS CODE 알려줘");
    expect(instructions).toContain("Korean, Chinese, Japanese, English, or another language");
    expect(instructions).toContain("Use general product knowledge only");
    expect(instructions).toContain("Keep the answer short");
    expect(instructions).toContain("candidateHsCodes max 3");
    expect(instructions).toContain("Korean HSK 10-digit code");
    expect(instructions).toContain("map it to an official Korean '기타' candidate");
    expect(instructions).toContain("clear common product");
    expect(instructions).toContain("candy/sweets/confectionery");
    expect(instructions).toContain("Do not return an empty candidateHsCodes array only because the exact Korean HSK 10-digit suffix is unknown");
    expect(instructions).toContain("Do not use needs_clarification just because the exact national HS10 is uncertain");
    expect(instructions).toContain("traded finished article");
    expect(instructions).toContain("Do not use live web search");
  });

  it("parses high-certainty single primary candidates before alternatives", () => {
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
      certainty: "high",
      displayMode: "single",
      correctedProductName: "smart watch",
      primaryCandidate: {
        code: "8517.62",
        reason: "스마트폰과 통신하는 웨어러블 전자기기 가능성이 가장 높음",
        requiredInfo: ["셀룰러 통신 여부"]
      },
      candidateHsCodes: ["9102.12", "8517.62"],
      candidateHsCodeReasons: [
        { code: "910212", reason: "시계 형태 대체 가능성", requiredInfo: ["스마트 기능 범위"] }
      ],
      searchTerms: ["smart watch"]
    }), fallback);

    expect(parsed.certainty).toBe("high");
    expect(parsed.displayMode).toBe("single");
    expect(parsed.primaryCandidate?.code).toBe("851762");
    expect(parsed.candidateHsCodes[0]).toBe("851762");
    expect(parsed.candidateHsCodes).toContain("910212");
  });

  it("normalizes product searches through GPT API without enabling web search tools", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        output_text: JSON.stringify({
          correctedProductName: "smart watch",
          searchTerms: ["smart watch", "wearable device"],
          koreanTerms: ["스마트워치", "웨어러블 기기"],
          englishTerms: ["smart watch"],
          productFamilies: ["wearable electronic device"],
          candidateHsCodes: ["851762", "910212", "852589"],
          candidateHsCodeReasons: [
            { code: "851762", reason: "스마트폰과 통신하는 웨어러블 전자기기 가능성", requiredInfo: ["통신 기능", "독립 통화 가능 여부"] },
            { code: "910212", reason: "시계 형태 제품일 가능성", requiredInfo: ["스마트 기능 범위"] }
          ],
          missingQuestions: ["셀룰러 통신 가능 여부 확인"]
        })
      }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const provider = new OpenAiProvider("test-key");
    const result = await provider.normalizeProductSearch({
      task: "product_search_normalization",
      basisDate: "2026-05-24",
      redactedInput: "품명: 애플워치"
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string).tools).toBeUndefined();
    expect(result.candidateHsCodes).toEqual(["851762", "910212", "852589"]);
    expect(result.searchTerms).toEqual(expect.arrayContaining(["smart watch", "스마트워치"]));
  });

  it("accepts a direct common-product HS answer from GPT", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        output_text: JSON.stringify({
          classificationState: "single_likely_candidate",
          certainty: "medium",
          displayMode: "single",
          correctedProductName: "사탕",
          primaryCandidate: {
            code: "1704",
            reason: "사탕은 일반적으로 코코아를 함유하지 않은 설탕과자류로 검토됩니다.",
            requiredInfo: ["초콜릿 함유 여부", "껌 또는 의약품 표시 여부", "성분표"]
          },
          searchTerms: ["사탕", "캔디", "설탕과자", "sugar confectionery", "candy"],
          koreanTerms: ["사탕", "캔디", "설탕과자"],
          englishTerms: ["sugar confectionery", "candy"],
          productFamilies: ["sugar confectionery"],
          candidateHsCodes: ["1704"],
          candidateHsCodeReasons: [
            { code: "1704", reason: "코코아를 함유하지 않은 설탕과자류 가능성", requiredInfo: ["초콜릿 함유 여부", "성분표"] }
          ],
          missingQuestions: ["초콜릿 또는 코코아 함유 여부 확인이 필요합니다."]
        })
      }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const provider = new OpenAiProvider("test-key");
    const result = await provider.normalizeProductSearch({
      task: "product_search_normalization",
      basisDate: "2026-05-30",
      redactedInput: "품명: 사탕"
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.candidateHsCodes).toEqual(["1704"]);
    expect(result.primaryCandidate?.code).toBe("1704");
    expect(result.searchTerms).toEqual(expect.arrayContaining(["사탕", "sugar confectionery"]));
  });

  it("requests compact GPT product-search responses", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        output_text: JSON.stringify({
          classificationState: "single_likely_candidate",
          displayMode: "single",
          correctedProductName: "사탕",
          primaryCandidate: { code: "1704", reason: "설탕과자류 가능성", requiredInfo: ["코코아 함유 여부"] },
          searchTerms: ["사탕"],
          candidateHsCodes: ["1704"],
          candidateHsCodeReasons: [{ code: "1704", reason: "설탕과자류 가능성", requiredInfo: ["코코아 함유 여부"] }],
          missingQuestions: ["코코아 함유 여부 확인"]
        })
      }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const provider = new OpenAiProvider("test-key");
    await provider.normalizeProductSearch({
      task: "product_search_normalization",
      basisDate: "2026-05-30",
      redactedInput: "품명: 사탕"
    });

    const body = JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string);
    expect(body.max_output_tokens).toBe(900);
    expect(body.instructions).toContain("Keep the answer short");
  });

  it("runs a simple interviewer retry when a successful response still has no HS candidates", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        output_text: JSON.stringify({
          correctedProductName: "unknown product",
          searchTerms: ["unknown product"],
          candidateHsCodes: [],
          missingQuestions: ["제품 용도 확인"]
        })
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        output_text: JSON.stringify({
          classificationState: "needs_clarification",
          displayMode: "needs_more_info",
          correctedProductName: "smart watch",
          primaryCandidate: {
            code: "8517.62",
            reason: "스마트워치로 보이며 무선 데이터 송수신 기기 계열 검토가 필요합니다.",
            requiredInfo: ["셀룰러 기능 여부"]
          },
          candidateHsCodes: ["851762"],
          candidateHsCodeReasons: [
            { code: "851762", reason: "스마트워치 가능성", requiredInfo: ["셀룰러 기능 여부"] }
          ],
          missingQuestions: ["셀룰러 기능 여부"]
        })
      }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const provider = new OpenAiProvider("test-key");
    const result = await provider.normalizeProductSearch({
      task: "product_search_normalization",
      basisDate: "2026-05-24",
      redactedInput: "품명: 애플워치"
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.candidateHsCodes).toEqual(["851762"]);
    expect(result.missingQuestions).toContain("셀룰러 기능 여부");
  });

  it("keeps finished-article AI hints ahead of component or material hints generically", () => {
    const normalization = {
      provider: "openai" as const,
      model: "test",
      correctedProductName: "rechargeable desk appliance",
      searchTerms: ["rechargeable", "finished appliance"],
      koreanTerms: ["충전식 완제품"],
      englishTerms: ["finished article"],
      productFamilies: ["finished appliance"],
      candidateHsCodes: ["9405", "850760", "3926"],
      candidateHsCodeReasons: [
        { code: "9405", reason: "완제품의 주기능 후보입니다.", requiredInfo: ["용도", "구조"] },
        { code: "850760", reason: "내장 배터리 또는 배터리 모듈 가능성입니다.", requiredInfo: ["배터리 cell pack 여부"] },
        { code: "3926", reason: "플라스틱 부품 또는 케이스 가능성입니다.", requiredInfo: ["part component 여부"] }
      ],
      webSources: [],
      missingQuestions: []
    };

    expect(prioritizePrincipalArticleHsHints({
      productInput: { productName: "충전식 탁상용 완제품", basisDate: "2026-05-24" },
      normalization,
      userProvidedHsCodes: [],
      candidateHsCodes: normalization.candidateHsCodes,
      candidateHsCodeReasons: normalization.candidateHsCodeReasons
    })).toEqual(["9405"]);
  });

  it("preserves component hints when the user explicitly searches for a replacement component", () => {
    const normalization = {
      provider: "openai" as const,
      model: "test",
      correctedProductName: "replacement battery pack",
      searchTerms: ["replacement battery pack"],
      koreanTerms: ["교체용 배터리팩"],
      englishTerms: ["replacement battery"],
      productFamilies: ["battery pack"],
      candidateHsCodes: ["850760", "9405"],
      candidateHsCodeReasons: [
        { code: "850760", reason: "교체용 배터리 pack 가능성입니다.", requiredInfo: ["cell 구성"] },
        { code: "9405", reason: "장착 대상 완제품 가능성입니다.", requiredInfo: ["완제품 여부"] }
      ],
      webSources: [],
      missingQuestions: []
    };

    expect(prioritizePrincipalArticleHsHints({
      productInput: { productName: "교체용 배터리팩", basisDate: "2026-05-24" },
      normalization,
      userProvidedHsCodes: [],
      candidateHsCodes: normalization.candidateHsCodes,
      candidateHsCodeReasons: normalization.candidateHsCodeReasons
    })).toEqual(["850760", "9405"]);
  });

  it("parses multilingual GPT product candidates without requiring official-name matches", () => {
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
      correctedProductName: "초록매실",
      searchTerms: ["plum beverage", "매실 음료"],
      koreanTerms: ["매실음료", "음료"],
      englishTerms: ["non-alcoholic beverage", "plum drink"],
      productFamilies: ["retail beverage"],
      candidateHsCodes: ["2202.99", "2009"],
      candidateHsCodeReasons: [
        { code: "220299", reason: "소매용 매실향 음료 가능성", requiredInfo: ["원액인지 희석음료인지", "설탕·물 첨가 여부"] },
        { code: "2009", reason: "순수 과실주스라면 조건부 검토", requiredInfo: ["과즙 함량", "희석 여부"] }
      ],
      missingQuestions: ["제품 라벨과 성분표 확인"]
    }), fallback);

    expect(parsed.candidateHsCodes).toEqual(["220299", "2009"]);
    expect(parsed.koreanTerms).toContain("매실음료");
    expect(parsed.candidateHsCodeReasons[0]?.reason).toContain("매실");
  });

  it("accepts common GPT alias fields for Chinese and Korean HS candidates", () => {
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
      normalizedProductName: "无线键盘",
      primaryHsCandidate: {
        hs6: "847160",
        description: "중국어 품명은 무선 키보드로 해석되며 컴퓨터 입력장치 계열 가능성이 높음",
        missingInfo: ["완제품 여부", "블루투스/2.4G 여부"]
      },
      hsCandidates: [
        {
          hsCode: "8471.60",
          name: "키보드 등 입력장치",
          missingInfo: ["컴퓨터용 입력장치인지"]
        },
        {
          hsCode: "8536.50",
          description: "스위치 부품만 거래되는 경우 조건부 검토",
          requiredInfo: ["스위치 단품인지"]
        }
      ],
      searchTerms: ["wireless keyboard", "无线键盘"],
      koreanTerms: ["무선 키보드"],
      englishTerms: ["wireless keyboard"]
    }), fallback);

    expect(parsed.correctedProductName).toBe("无线键盘");
    expect(parsed.primaryCandidate?.code).toBe("847160");
    expect(parsed.candidateHsCodes).toEqual(["847160", "853650"]);
    expect(parsed.candidateHsCodeReasons[0]).toEqual({
      code: "847160",
      reason: "키보드 등 입력장치",
      requiredInfo: ["컴퓨터용 입력장치인지"]
    });
    expect(parsed.koreanTerms).toContain("무선 키보드");
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

  it("uses supported reasoning effort values for gpt-5 Responses API calls", () => {
    expect(aiProviderInternals.reasoningEffortForResponses("gpt-5.4-mini")).toBe("none");
    expect(aiProviderInternals.reasoningEffortForResponses("gpt-4.1-mini")).toBeNull();
  });

});
