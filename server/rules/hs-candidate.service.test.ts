import { afterEach, describe, expect, it, vi } from "vitest";
import { extractHsCodeHintsFromText } from "@/server/ai/product-search-normalization.service";
import { hsCandidateServiceInternals, recommendHsCandidates, recommendHsCandidatesForProduct } from "@/server/rules/hs-candidate.service";

const originalAiProvider = process.env.AI_PROVIDER;
const originalOpenAiApiKey = process.env.OPENAI_API_KEY;

afterEach(() => {
  if (originalAiProvider === undefined) {
    delete process.env.AI_PROVIDER;
  } else {
    process.env.AI_PROVIDER = originalAiProvider;
  }
  if (originalOpenAiApiKey === undefined) {
    delete process.env.OPENAI_API_KEY;
  } else {
    process.env.OPENAI_API_KEY = originalOpenAiApiKey;
  }
  vi.unstubAllGlobals();
});

describe("recommendHsCandidates", () => {
  it("returns matching published candidates with required review fields", () => {
    const candidates = recommendHsCandidates({
      productName: "리튬 배터리 모듈",
      productUsage: "전기자전거용 교체 배터리",
      material: "리튬이온 셀",
      basisDate: "2026-05-21"
    });

    expect(candidates.length).toBeGreaterThanOrEqual(1);
    expect(candidates.length).toBeLessThanOrEqual(5);
    expect(candidates[0]?.hskCode).toBe("8507601000");
    expect(candidates[0]?.reviewStatus).toBe("suggested");
    expect(candidates[0]?.requiredQuestions.length).toBeGreaterThan(0);
  });

  it("does not return unrelated fallback candidates when product terms do not match", () => {
    const candidates = recommendHsCandidates({
      productName: "검색어없음",
      basisDate: "2026-05-21"
    });

    expect(candidates).toHaveLength(0);
  });

  it("expands practical product synonyms such as lip balm", () => {
    const terms = hsCandidateServiceInternals.searchTerms({
      productName: "립밤",
      basisDate: "2026-05-21"
    });

    expect(terms).toContain("입술");
    expect(terms).not.toContain("립");
    expect(recommendHsCandidates({ productName: "립밤", basisDate: "2026-05-21" })[0]?.hskCode).toBe("3304101000");
  });

  it("returns possible meanings for ambiguous short acronyms such as ESC", () => {
    const candidates = recommendHsCandidates({
      productName: "esc",
      basisDate: "2026-05-21"
    });

    expect(candidates.map((candidate) => candidate.hskCode)).toEqual([
      "8471601020",
      "8708303000",
      "8486902030"
    ]);
    expect(candidates[0]?.reason).toContain("Escape key");
    expect(candidates[1]?.reason).toContain("Electronic Stability Control");
    expect(candidates[2]?.reason).toContain("Electrostatic Chuck");
    expect(hsCandidateServiceInternals.ambiguousRuleForProductName("E.S.C")?.query).toBe("esc");
  });

  it("tolerates narrow English typos and expands bilingual product terms", () => {
    const terms = hsCandidateServiceInternals.searchTerms({
      productName: "mushroom puder",
      basisDate: "2026-05-21"
    });

    expect(terms).toContain("powder");
    expect(terms).toContain("분말");
    expect(terms).toContain("버섯");

    const candidates = recommendHsCandidates({
      productName: "mushroom puder",
      basisDate: "2026-05-21"
    });

    expect(candidates[0]?.hskCode).toBe("0712391090");
    expect(candidates[0]?.requiredQuestions.join(" ")).toContain("조미");
  });

  it("uses AI-normalized typo hints in the async product search path", async () => {
    const candidates = await recommendHsCandidatesForProduct({
      productName: "mushroom puder",
      basisDate: "2026-05-21"
    });

    expect(candidates[0]?.hskCode).toBe("0712391090");
    expect(candidates[0]?.requiredQuestions.join(" ")).toContain("추가 가공");
    expect(candidates[0]?.scoreBreakdown.join(" ")).toMatch(/AI HS 후보 상세 조회|키워드/);
  });

  it("keeps competing acronym meanings from AI lookup hints", async () => {
    const candidates = await recommendHsCandidatesForProduct({
      productName: "esc",
      basisDate: "2026-05-21"
    });

    expect(candidates.map((candidate) => candidate.hs6)).toEqual(expect.arrayContaining([
      "847160",
      "870830",
      "848690"
    ]));
    expect(candidates.find((candidate) => candidate.hs6 === "870830")?.reason).toContain("Electronic Stability Control");
    expect(candidates.find((candidate) => candidate.hs6 === "848690")?.reason).toContain("Electrostatic Chuck");
  });

  it("asks for branch details before showing apparel HS candidates for unclear work vests", async () => {
    const candidates = await recommendHsCandidatesForProduct({
      productName: "작업용 조끼",
      basisDate: "2026-05-21"
    });

    expect(candidates).toEqual([]);
  });

  it("recommends construction machinery candidates from one-letter English omissions", () => {
    const candidates = recommendHsCandidates({
      productName: "excvation",
      basisDate: "2026-05-21"
    });

    expect(candidates[0]?.hskCode).toBe("8429521000");
    expect(candidates[0]?.koreanName).toContain("굴삭기");
  });

  it("uses AI-normalized product terms alongside original search terms", async () => {
    const candidates = await recommendHsCandidatesForProduct({
      productName: "lazer belt cs-3000",
      basisDate: "2026-05-21"
    });

    expect(candidates[0]?.hskCode).toBe("9019102000");
    expect(candidates[0]?.koreanName).toContain("마사지");
  });

  it("returns printer candidates for plain English printer descriptions", async () => {
    const candidates = await recommendHsCandidatesForProduct({
      productName: "printer black and white",
      basisDate: "2026-05-21"
    });

    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates[0]?.hs6).toBe("844332");
    expect(candidates[0]?.koreanName).toContain("프린터");
    expect(candidates[0]?.requiredQuestions.join(" ")).toContain("복사");
  });

  it("prioritizes input-device HS6 for keyboard product context", async () => {
    const candidates = await recommendHsCandidatesForProduct({
      productName: "레이니 키보드",
      basisDate: "2026-05-21"
    });

    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates[0]?.hs6).toBe("847160");
    expect(candidates[0]?.hskCode).toBe("8471601020");
    expect(candidates.map((candidate) => candidate.hskCode)).not.toContain("847130");
  });

  it("prioritizes finished electric fan candidates over internal battery headings", async () => {
    const candidates = await recommendHsCandidatesForProduct({
      productName: "손선풍기",
      basisDate: "2026-05-21"
    });

    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates[0]?.hs6).toBe("841451");
    expect(candidates.some((candidate) => candidate.hs6.startsWith("8507"))).toBe(false);
    expect(candidates[0]?.reason).toContain("전기팬");
  });

  it("uses product-family AI guardrails for brand plus generic cosmetic names", async () => {
    const candidates = await recommendHsCandidatesForProduct({
      productName: "graceday hand cream",
      basisDate: "2026-05-21"
    });

    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates[0]?.hs6).toBe("330499");
    expect(candidates[0]?.lookupBasis).toBe("ai_hs_hint");
    expect(candidates[0]?.reason).toContain("피부 적용 화장품");
    expect(candidates[0]?.riskNotes).toContain("품목분류 확정");
  });

  it("keeps GPT-only provisional HS candidates visible when no official HSK row exists", async () => {
    process.env.AI_PROVIDER = "openai";
    process.env.OPENAI_API_KEY = "test-key";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      output_text: JSON.stringify({
        classificationState: "single_likely_candidate",
        certainty: "high",
        displayMode: "single",
        correctedProductName: "smart watch",
        primaryCandidate: {
          code: "8517.62",
          reason: "스마트폰과 통신하는 웨어러블 전자기기 가능성이 높습니다.",
          requiredInfo: ["셀룰러 통신 기능 여부"]
        },
        candidateHsCodes: ["851762"],
        candidateHsCodeReasons: [
          { code: "851762", reason: "무선 데이터 송수신용 스마트워치 가능성", requiredInfo: ["셀룰러 통신 기능 여부"] }
        ],
        searchTerms: ["smart watch"],
        koreanTerms: ["스마트워치"],
        englishTerms: ["smart watch"],
        missingQuestions: ["셀룰러 통신 기능 여부 확인"]
      })
    }), { status: 200 })));

    const candidates = await recommendHsCandidatesForProduct({
      productName: "애플워치 모델 A999",
      basisDate: "2026-05-21"
    });

    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.hskCode).toBe("851762");
    expect(candidates[0]?.lookupBasis).toBe("ai_hs_hint");
    expect(candidates[0]?.riskNotes).toContain("품목분류 확정");
  });

  it("shows one broad GPT candidate with minimal questions when branch facts are missing", async () => {
    process.env.AI_PROVIDER = "openai";
    process.env.OPENAI_API_KEY = "test-key";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      output_text: JSON.stringify({
        classificationState: "needs_clarification",
        certainty: "medium",
        displayMode: "needs_more_info",
        correctedProductName: "smart watch",
        primaryCandidate: {
          code: "8517.62",
          reason: "스마트워치 제품군으로 보이나 통신 기능에 따라 하위 판단이 필요합니다.",
          requiredInfo: ["셀룰러 통신 가능 여부", "블루투스 단독 모델인지"]
        },
        candidateHsCodes: ["851762", "910212"],
        candidateHsCodeReasons: [
          { code: "851762", reason: "무선통신 기능이 있는 웨어러블 전자기기 가능성", requiredInfo: ["셀룰러 통신 가능 여부"] },
          { code: "910212", reason: "스마트 기능이 제한적인 시계형 제품이면 조건부 검토", requiredInfo: ["스마트 기능 범위"] }
        ],
        searchTerms: ["smart watch"],
        koreanTerms: ["스마트워치"],
        englishTerms: ["smart watch"],
        missingQuestions: ["셀룰러 통신 가능 여부", "스마트폰 없이 독립 통신이 가능한지"]
      })
    }), { status: 200 })));

    const candidates = await recommendHsCandidatesForProduct({
      productName: "애플워치",
      basisDate: "2026-05-21"
    });

    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.hskCode).toBe("851762");
    expect(candidates[0]?.requiredQuestions.join(" ")).toContain("셀룰러");
  });

  it("uses GPT multilingual normalization for Chinese product names through the same candidate path", async () => {
    process.env.AI_PROVIDER = "openai";
    process.env.OPENAI_API_KEY = "test-key";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      output_text: JSON.stringify({
        classificationState: "single_likely_candidate",
        certainty: "high",
        displayMode: "single",
        normalizedProductName: "无线键盘",
        primaryHsCandidate: {
          hs6: "847160",
          description: "중국어 품명은 무선 키보드로 해석되며 컴퓨터 입력장치 계열 가능성이 높습니다.",
          missingInfo: ["완제품 여부", "컴퓨터용 입력장치인지"]
        },
        hsCandidates: [
          { hsCode: "8471.60", name: "키보드 등 입력장치", missingInfo: ["컴퓨터용 입력장치인지"] },
          { hsCode: "8536.50", description: "스위치 단품이면 조건부 검토", requiredInfo: ["스위치 단품인지"] }
        ],
        searchTerms: ["wireless keyboard", "无线键盘"],
        koreanTerms: ["무선 키보드"],
        englishTerms: ["wireless keyboard"],
        missingQuestions: ["완제품 키보드인지 확인"]
      })
    }), { status: 200 })));

    const candidates = await recommendHsCandidatesForProduct({
      productName: "无线键盘",
      basisDate: "2026-05-21"
    });

    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.hs6).toBe("847160");
    expect(candidates[0]?.hskCode).toBe("8471601020");
  });

  it("keeps GPT HS6 candidates for Korean retail product names even without an exact official HSK match", async () => {
    process.env.AI_PROVIDER = "openai";
    process.env.OPENAI_API_KEY = "test-key";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      output_text: JSON.stringify({
        classificationState: "single_likely_candidate",
        certainty: "medium",
        displayMode: "single",
        correctedProductName: "매실 음료",
        primaryCandidate: {
          code: "2202.99",
          reason: "소매용 비알코올 매실 음료 가능성이 높습니다.",
          requiredInfo: ["과즙 함량", "희석음료인지 원액인지"]
        },
        candidateHsCodes: ["220299"],
        candidateHsCodeReasons: [
          { code: "220299", reason: "비알코올 음료 가능성", requiredInfo: ["성분표", "당류·물 첨가 여부"] }
        ],
        searchTerms: ["plum beverage", "매실 음료"],
        koreanTerms: ["매실 음료"],
        englishTerms: ["plum beverage"],
        missingQuestions: ["성분표와 표시사항 확인"]
      })
    }), { status: 200 })));

    const candidates = await recommendHsCandidatesForProduct({
      productName: "초록매실",
      basisDate: "2026-05-21"
    });

    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.hskCode).toBe("220299");
    expect(candidates[0]?.lookupBasis).toBe("ai_hs_hint");
    expect(candidates[0]?.requiredQuestions.join(" ")).toContain("성분표");
  });

  it("uses GPT product-family interpretation for model-code-like inputs instead of returning empty results", async () => {
    process.env.AI_PROVIDER = "openai";
    process.env.OPENAI_API_KEY = "test-key";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      output_text: JSON.stringify({
        classificationState: "single_likely_candidate",
        certainty: "medium",
        displayMode: "single",
        correctedProductName: "massage belt apparatus",
        primaryCandidate: {
          code: "9019.10",
          reason: "모델코드와 제품명 단서상 마사지용 기기 가능성이 높습니다.",
          requiredInfo: ["마사지 기능 여부", "의료기기 표시 여부"]
        },
        candidateHsCodes: ["901910"],
        candidateHsCodeReasons: [
          { code: "901910", reason: "마사지용 기기 가능성", requiredInfo: ["제품 카탈로그", "기능 설명"] }
        ],
        searchTerms: ["massage belt apparatus", "CS-3000"],
        englishTerms: ["massage belt apparatus"],
        webSources: [{ title: "Maker product page", url: "https://example.com/cs-3000" }],
        missingQuestions: ["제품 카탈로그 확인"]
      })
    }), { status: 200 })));

    const candidates = await recommendHsCandidatesForProduct({
      productName: "CS-3000",
      basisDate: "2026-05-21"
    });

    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates[0]?.hs6).toBe("901910");
    expect(candidates[0]?.lookupBasis).toBe("ai_hs_hint");
    expect(candidates[0]?.requiredQuestions.join(" ")).toContain("카탈로그");
  });

  it("removes dairy cream candidates when cosmetic skin-care context is present", () => {
    const makeCandidate = (hskCode: string, koreanName: string, confidenceScore: number) => ({
      hskCode,
      hs6: hskCode.slice(0, 6),
      rank: 1,
      confidenceScore,
      koreanName,
      reason: "test",
      requiredQuestions: [],
      riskNotes: "test",
      scoreBreakdown: [],
      reviewStatus: "suggested" as const,
      sourceName: "test",
      sourceUrl: "test",
      sourceVersion: "test",
      effectiveFrom: "2026-01-01",
      effectiveTo: null,
      basisDate: "2026-05-21"
    });

    const filtered = hsCandidateServiceInternals.filterContextConflictingCandidates(
      { productName: "toableo moisture cream", basisDate: "2026-05-21" },
      [
        makeCandidate("3304991000", "기초화장용 제품류", 0.78),
        makeCandidate("0401401000", "냉동크림", 0.51)
      ]
    );

    expect(filtered.map((candidate) => candidate.hskCode)).toEqual(["3304991000"]);
  });

  it("removes portable-computer candidates when input-device context is present", () => {
    const makeCandidate = (hskCode: string, koreanName: string, confidenceScore: number) => ({
      hskCode,
      hs6: hskCode.slice(0, 6),
      rank: 1,
      confidenceScore,
      koreanName,
      reason: "test",
      requiredQuestions: [],
      riskNotes: "test",
      scoreBreakdown: [],
      reviewStatus: "suggested" as const,
      sourceName: "test",
      sourceUrl: "test",
      sourceVersion: "test",
      effectiveFrom: "2026-01-01",
      effectiveTo: null,
      basisDate: "2026-05-21"
    });

    const filtered = hsCandidateServiceInternals.filterContextConflictingCandidates(
      { productName: "wireless mechanical keyboard", basisDate: "2026-05-21" },
      [
        makeCandidate("8471601020", "컴퓨터 키보드", 0.82),
        makeCandidate("8471300000", "휴대용 자동자료처리기계", 0.8)
      ]
    );

    expect(filtered.map((candidate) => candidate.hskCode)).toEqual(["8471601020"]);
  });

  it("maps stored Customs API018 rows as provisional product candidates", () => {
    const candidates = hsCandidateServiceInternals.mapStoredCustomsHsCodeSearchRowsToCandidates(
      {
        productName: "printer black and white",
        basisDate: "2026-05-21"
      },
      [
        {
          hsk_code: "8443321010",
          hs6: "844332",
          korean_name: "프린터",
          english_name: "Printer capable of connecting to an automatic data processing machine",
          quantity_unit: "NO",
          weight_unit: "KG",
          rate_text: "0",
          rate_type_code: "C",
          source_name: "관세청 HS부호검색",
          source_url: "https://unipass.customs.go.kr/...crkyCn=%5Bredacted%5D",
          source_version: "myc-openapi-api018-v1.0:2026-05",
          effective_from: "2026-01-01",
          effective_to: null
        },
        {
          hsk_code: "8708303000",
          hs6: "870830",
          korean_name: "제동장치",
          english_name: "Brakes",
          quantity_unit: null,
          weight_unit: null,
          rate_text: null,
          rate_type_code: null,
          source_name: "관세청 HS부호검색",
          source_url: "https://unipass.customs.go.kr/...crkyCn=%5Bredacted%5D",
          source_version: "myc-openapi-api018-v1.0:2026-05",
          effective_from: "2026-01-01",
          effective_to: null
        }
      ],
      ["printer", "프린터"]
    );

    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.hskCode).toBe("8443321010");
    expect(candidates[0]?.lookupBasis).toBe("customs_api");
    expect(candidates[0]?.reason).toContain("저장된 HS 검색 데이터");
    expect(candidates[0]?.riskNotes).toContain("확정이 아닙니다");
  });

  it("extracts user-provided HS6 or foreign HS code hints from mixed product input", () => {
    expect(extractHsCodeHintsFromText("mushroom powder 071239")).toContain("071239");
    expect(extractHsCodeHintsFromText("품명: massage belt / 해외 HS CODE 9019.10.20")).toEqual(
      expect.arrayContaining(["90191020", "901910"])
    );
    expect(extractHsCodeHintsFromText("lazer belt cs-3000")).toHaveLength(0);
  });

  it("prioritizes product input HS code hints while keeping them provisional", async () => {
    const candidates = await recommendHsCandidatesForProduct({
      productName: "mushroom powder HS 071239",
      basisDate: "2026-05-21"
    });

    expect(candidates[0]?.hs6).toBe("071239");
    expect(candidates[0]?.reason).toContain("HS CODE 힌트");
    expect(candidates[0]?.riskNotes).toContain("품목분류 확정");
  });

  it("uses a user-provided foreign hs code as an hs6 boundary for product search", async () => {
    const candidates = await recommendHsCandidatesForProduct({
      productName: "massage belt 9019.10.20",
      basisDate: "2026-05-21"
    });

    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates.every((candidate) => candidate.hs6 === "901910")).toBe(true);
    expect(candidates[0]?.hskCode).toBe("9019102000");
  });

  it("prunes weak noisy candidates when a strong product candidate exists", () => {
    const makeCandidate = (hskCode: string, confidenceScore: number) => ({
      hskCode,
      hs6: hskCode.slice(0, 6),
      rank: 1,
      confidenceScore,
      koreanName: hskCode,
      reason: "test",
      requiredQuestions: [],
      riskNotes: "test",
      scoreBreakdown: [],
      reviewStatus: "suggested" as const,
      sourceName: "test",
      sourceUrl: "test",
      sourceVersion: "test",
      effectiveFrom: "2026-01-01",
      effectiveTo: null,
      basisDate: "2026-05-21"
    });

    const candidates = hsCandidateServiceInternals.pruneWeakProductRecommendations([
      makeCandidate("9019102000", 0.78),
      makeCandidate("8703239010", 0.52),
      makeCandidate("8703239020", 0.49)
    ], { keepAmbiguousAlternatives: false });

    expect(candidates.map((candidate) => candidate.hskCode)).toEqual(["9019102000"]);
  });

  it("does not use one-syllable Korean fragments that match unrelated words", () => {
    const terms = hsCandidateServiceInternals.searchTerms({
      productName: "립스틱",
      basisDate: "2026-05-21"
    });

    expect(terms).not.toContain("립");
    expect(
      hsCandidateServiceInternals.scoreStandardName(
        {
          hsk_code: "0713319000",
          standard_name_kr: "건조녹두",
          required_spec_kr: "정립율",
          detailed_classification: "95%이상",
          source_name: "관세청 표준품명",
          source_url: "file:///Downloads/관세청_표준품명_20260101.xlsx",
          source_version: "customs-standard-product-20260101"
        },
        terms
      )
    ).toBe(0);
  });

  it("uses basis date to exclude inactive records", () => {
    const candidates = recommendHsCandidates({
      productName: "리튬 배터리 모듈",
      basisDate: "2025-05-21"
    });

    expect(candidates).toHaveLength(0);
  });

  it("uses AI HS hints against mock official data without Supabase env", async () => {
    const candidates = await recommendHsCandidatesForProduct({
      productName: "리튬 배터리 모듈",
      basisDate: "2026-05-21"
    });

    expect(candidates[0]?.hskCode).toBe("8507601000");
  });

  it("keeps any GPT HS4/HS6 hints as provisional candidates even without official HS10 rows", () => {
    const candidates = hsCandidateServiceInternals.recommendAiHsCodeHintCandidates(
      {
        productName: "임의 품명",
        basisDate: "2026-05-21"
      },
      {
        provider: "mock",
        model: "test",
        correctedProductName: null,
        searchTerms: [],
        koreanTerms: [],
        englishTerms: [],
        productFamilies: [],
        candidateHsCodes: ["190190", "190590"],
        candidateHsCodeReasons: [
          {
            code: "190190",
            reason: "제품 문맥상 제1901호 계열 확인이 필요합니다.",
            requiredInfo: ["성분표", "제조공정"]
          },
          {
            code: "190590",
            reason: "제품 문맥상 제1905호 계열 확인이 필요합니다.",
            requiredInfo: ["형태", "섭취 전 조리 여부"]
          }
        ],
        webSources: [],
        missingQuestions: ["제품 사양 확인이 필요합니다."]
      },
      []
    );

    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates.map((candidate) => candidate.hskCode)).toEqual(expect.arrayContaining(["190190", "190590"]));
    expect(candidates.every((candidate) => candidate.lookupBasis === "ai_hs_hint")).toBe(true);
    expect(candidates.find((candidate) => candidate.hskCode === "190190")?.reason).toContain("일반적인 제품 설명 기준");
    expect(candidates.every((candidate) => candidate.riskNotes.includes("품목분류 확정"))).toBe(true);
  });

  it("scores official standard name rows by matching input terms", () => {
    const terms = hsCandidateServiceInternals.searchTerms({
      productName: "리튬 배터리 모듈",
      material: "리튬이온 셀",
      basisDate: "2026-05-21"
    });

    expect(terms).toContain("리튬");
    expect(
      hsCandidateServiceInternals.scoreStandardName(
        {
          hsk_code: "8507601000",
          standard_name_kr: "리튬이온 배터리 모듈",
          required_spec_kr: "전압, 용량, 셀 구성",
          detailed_classification: null,
          source_name: "관세청 표준품명",
          source_url: "file:///Downloads/관세청_표준품명_20260101.xlsx",
          source_version: "customs-standard-product-20260101"
        },
        terms
      )
    ).toBeGreaterThan(0);
  });
});
