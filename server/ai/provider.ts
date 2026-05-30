export type AiProviderName = "mock" | "openai" | "gemini";

export type AiClarificationCandidate = {
  hskCode: string;
  hs6: string;
  koreanName: string;
  confidenceScore: number;
  reason: string;
  requiredQuestions: string[];
};

export type AiClarificationPrompt = {
  task: "product_clarification" | "document_line_clarification";
  basisDate: string;
  redactedInput: string;
  candidates: AiClarificationCandidate[];
};

export type AiProductSearchNormalizationPrompt = {
  task: "product_search_normalization";
  basisDate: string;
  redactedInput: string;
};

export type AiProductSearchNormalizationResult = {
  provider: AiProviderName;
  model: string;
  classificationState?: "needs_clarification" | "single_likely_candidate" | "ambiguous_multiple_meanings";
  certainty?: "low" | "medium" | "high";
  displayMode?: "single" | "multiple" | "needs_more_info";
  userMessage?: string | null;
  correctedProductName: string | null;
  primaryCandidate?: {
    code: string;
    reason: string;
    requiredInfo: string[];
  } | null;
  searchTerms: string[];
  koreanTerms: string[];
  englishTerms: string[];
  productFamilies: string[];
  candidateHsCodes: string[];
  candidateHsCodeReasons: Array<{
    code: string;
    reason: string;
    requiredInfo: string[];
  }>;
  webSources: Array<{ title: string; url: string }>;
  missingQuestions: string[];
};

export type AiClarificationResult = {
  provider: AiProviderName;
  model: string;
  confidence: "low" | "medium" | "high";
  summary: string;
  missingQuestions: string[];
  suggestedCandidateCodes: string[];
  riskNotes: string[];
};

export interface AiProvider {
  name: AiProviderName;
  model: string;
  clarify(prompt: AiClarificationPrompt): Promise<AiClarificationResult>;
  normalizeProductSearch(prompt: AiProductSearchNormalizationPrompt): Promise<AiProductSearchNormalizationResult>;
}

const weakTerms = ["part", "parts", "sample", "goods", "item", "accessory", "제품", "부품", "샘플", "기타"];

function isWeakInput(input: string) {
  const normalized = input.trim().toLowerCase();
  return normalized.length < 8 || weakTerms.some((term) => normalized === term || normalized.includes(` ${term} `));
}

function reasoningEffortForResponses(model: string) {
  if (!model.startsWith("gpt-5")) return null;
  return "none";
}

function envNumber(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export class MockAiProvider implements AiProvider {
  name: AiProviderName = "mock";
  model = "mock-clarification-v1";

  async clarify(prompt: AiClarificationPrompt): Promise<AiClarificationResult> {
    const weakInput = isWeakInput(prompt.redactedInput);
    const sortedCandidates = [...prompt.candidates].sort((a, b) => b.confidenceScore - a.confidenceScore);
    const suggestedCandidateCodes = sortedCandidates.slice(0, weakInput ? 2 : 4).map((candidate) => candidate.hskCode);
    const candidateQuestions = sortedCandidates.flatMap((candidate) => candidate.requiredQuestions).slice(0, 4);

    return {
      provider: this.name,
      model: this.model,
      confidence: weakInput ? "low" : prompt.candidates.length ? "medium" : "low",
      summary: weakInput
        ? "입력 정보가 짧거나 포괄적이어서 HS 후보를 좁히려면 제품 용도, 재질, 성분, 완제품/부분품 여부 확인이 필요합니다."
        : "입력 단서와 공식 데이터 후보를 비교해 보완 질문과 우선 검토 후보를 정리했습니다.",
      missingQuestions: [
        "제품의 정확한 용도와 최종 사용처는 무엇입니까?",
        "재질, 성분, 함량 또는 주요 구성품은 무엇입니까?",
        "완제품인지 부분품인지, 부분품이면 장착 대상 완제품은 무엇입니까?",
        ...candidateQuestions
      ].filter((question, index, questions) => questions.indexOf(question) === index).slice(0, 6),
      suggestedCandidateCodes,
      riskNotes: [
        "AI 보조 분석은 공식 HS 후보를 확정하지 않으며 담당자 검토 전 예비 단서로만 사용합니다.",
        "관세율, 수입요건, FTA 적용 여부는 공식 데이터 조회 결과를 기준으로 별도 판단해야 합니다."
      ]
    };
  }

  async normalizeProductSearch(prompt: AiProductSearchNormalizationPrompt): Promise<AiProductSearchNormalizationResult> {
    const input = prompt.redactedInput.toLowerCase();
    const escLike = /\besc\b|e\.s\.c/i.test(input);
    const mushroomPowderLike = /mushroom|mushr?om|버섯|puder|powder|분말|가루/.test(input) && /mushroom|mushr?om|버섯/.test(input);
    const excavatorLike = /exca?v?ation|excavator|굴삭|굴착/.test(input);
    const laserBeltLike = /la[sz]er/.test(input) && /belt|벨트|cs-?\d+/i.test(input);
    const printerLike = /printer|printing|print\s+machine|프린터|인쇄기/.test(input);
    const batteryLike = /battery|batteries|lithium|배터리|전지|리튬/.test(input);
    const electricFanLike = /electric\s*fan|portable\s*fan|handheld\s*fan|desk\s*fan|usb\s*fan|rechargeable\s*fan|선풍기|손\s*선풍기|휴대용\s*선풍기|탁상용\s*선풍기|미니\s*팬|전기\s*팬/.test(input);
    const workVestLike = /작업\s*용?\s*조끼|안전\s*조끼|반사\s*조끼|형광\s*조끼|work\s*vest|safety\s*vest|reflective\s*vest|hi-?vis|high\s*visibility|waistcoat|vest/.test(input);
    const searchTerms = [
      ...(escLike ? ["esc", "escape key", "keyboard", "electronic stability control", "electrostatic chuck", "키보드", "제동장치", "정전척"] : []),
      ...(mushroomPowderLike ? ["mushroom powder", "dried mushroom", "mushroom", "powder", "버섯", "건조 버섯", "분말", "가루"] : []),
      ...(excavatorLike ? ["excavation", "excavator", "excavating", "굴삭기", "굴착기"] : []),
      ...(laserBeltLike ? ["laser belt", "massage belt", "massage apparatus", "massager", "physiotherapy", "물리치료", "마사지용 기기"] : []),
      ...(printerLike ? ["printer", "laser printer", "black and white printer", "monochrome printer", "프린터", "레이저 프린터", "인쇄기"] : []),
      ...(batteryLike ? ["battery", "lithium battery", "lithium ion battery", "battery module", "배터리", "리튬이온", "축전지"] : []),
      ...(electricFanLike ? ["electric fan", "portable fan", "handheld fan", "desk fan", "선풍기", "휴대용 선풍기", "전기 팬"] : []),
      ...(workVestLike ? ["work vest", "safety vest", "reflective vest", "waistcoat", "작업용 조끼", "안전 조끼", "반사 조끼", "직물제 의류", "편직물 의류"] : [])
    ];

    return {
      provider: this.name,
      model: this.model,
      classificationState: escLike ? "ambiguous_multiple_meanings" : workVestLike ? "needs_clarification" : "single_likely_candidate",
      certainty: escLike || workVestLike ? "low" : "medium",
      displayMode: escLike ? "multiple" : workVestLike ? "needs_more_info" : "single",
      userMessage: escLike
        ? "입력어 ESC는 여러 제품 의미로 해석될 수 있어 먼저 제품 종류 확인이 필요합니다."
        : workVestLike
        ? "작업용 조끼는 재질, 직물 구조, 안전 기능에 따라 세번이 갈릴 수 있어 추가 정보가 필요합니다."
        : "일반적인 제품 설명 기준으로 우선 검토 가능한 HS 방향을 정리했습니다.",
      correctedProductName: escLike ? "ESC abbreviation"
        : mushroomPowderLike ? "mushroom powder"
        : printerLike ? "black and white printer"
        : laserBeltLike ? "laser belt massage apparatus"
        : excavatorLike ? "excavation equipment / excavator"
        : batteryLike ? "lithium ion battery module"
        : electricFanLike ? "portable electric fan"
        : workVestLike ? "work or safety vest"
        : null,
      primaryCandidate: escLike ? null
        : mushroomPowderLike ? {
          code: "071239",
          reason: "건조 버섯을 단순 분쇄한 분말로 해석될 가능성이 가장 높습니다.",
          requiredInfo: ["건조 버섯 단순 분쇄품인지", "조미·혼합·추출·열처리 등 추가 가공 여부"]
        }
        : printerLike ? {
          code: "844332",
          reason: "컴퓨터나 네트워크에 연결 가능한 프린터 단독기로 해석될 가능성이 높습니다.",
          requiredInfo: ["복사·팩스·스캔 기능 포함 여부", "인쇄 방식"]
        }
        : laserBeltLike ? {
          code: "901910",
          reason: "마사지·물리치료용 기기로 해석될 가능성이 높습니다.",
          requiredInfo: ["마사지·물리치료 기능 여부", "의료기기 표시 목적"]
        }
        : excavatorLike ? {
          code: "842952",
          reason: "굴착·굴삭 장비로 해석될 가능성이 높습니다.",
          requiredInfo: ["완제품/부분품 여부", "상부구조 360도 회전 여부"]
        }
        : batteryLike ? {
          code: "850760",
          reason: "리튬이온 축전지 또는 배터리 모듈로 해석될 가능성이 높습니다.",
          requiredInfo: ["셀·모듈·팩 형태", "정격 전압·용량"]
        }
        : electricFanLike ? {
          code: "841451",
          reason: "전동기를 내장한 휴대용·탁상용 전기팬 완제품으로 해석될 가능성이 높습니다.",
          requiredInfo: ["전동기 내장 여부", "출력과 설치 형태"]
        }
        : workVestLike ? null
        : null,
      searchTerms,
      koreanTerms: [
        ...(escLike ? ["키보드", "제동장치", "정전척"] : []),
        ...(mushroomPowderLike ? ["버섯", "건조 버섯", "분말", "가루"] : []),
        ...(excavatorLike ? ["굴삭기", "굴착기"] : []),
        ...(laserBeltLike ? ["마사지용 기기", "물리치료", "안마"] : []),
        ...(printerLike ? ["프린터", "레이저 프린터", "인쇄기"] : []),
        ...(batteryLike ? ["배터리", "리튬이온", "축전지"] : []),
        ...(electricFanLike ? ["선풍기", "휴대용 선풍기", "전기 팬"] : []),
        ...(workVestLike ? ["작업용 조끼", "안전 조끼", "반사 조끼", "직물제 의류", "편직물 의류"] : [])
      ],
      englishTerms: [
        ...(escLike ? ["escape key", "keyboard", "electronic stability control", "electrostatic chuck"] : []),
        ...(mushroomPowderLike ? ["mushroom powder", "dried mushroom", "mushroom", "powder"] : []),
        ...(excavatorLike ? ["excavation", "excavator", "excavating"] : []),
        ...(laserBeltLike ? ["laser belt", "massage belt", "massage apparatus", "massager", "physiotherapy"] : []),
        ...(printerLike ? ["printer", "laser printer", "black and white printer", "monochrome printer"] : []),
        ...(batteryLike ? ["battery", "lithium battery", "lithium ion battery", "battery module"] : []),
        ...(electricFanLike ? ["electric fan", "portable fan", "handheld fan", "desk fan"] : []),
        ...(workVestLike ? ["work vest", "safety vest", "reflective vest", "waistcoat", "woven apparel", "knitted apparel"] : [])
      ],
      productFamilies: [
        ...(escLike ? ["computer input device", "automotive braking control", "semiconductor manufacturing parts"] : []),
        ...(mushroomPowderLike ? ["dried vegetables", "prepared food"] : []),
        ...(excavatorLike ? ["construction machinery"] : []),
        ...(laserBeltLike ? ["medical or massage apparatus"] : []),
        ...(printerLike ? ["office machine", "printing machinery"] : []),
        ...(batteryLike ? ["accumulator", "electrical battery"] : []),
        ...(electricFanLike ? ["air pump or fan", "household electric appliance"] : []),
        ...(workVestLike ? ["workwear", "apparel", "protective clothing"] : [])
      ],
      candidateHsCodes: [
        ...(escLike ? ["847160", "870830", "848690"] : []),
        ...(mushroomPowderLike ? ["071239", "200390", "210690"] : []),
        ...(excavatorLike ? ["842952"] : []),
        ...(laserBeltLike ? ["901910"] : []),
        ...(printerLike ? ["844332", "844331", "844339"] : []),
        ...(batteryLike ? ["850760"] : []),
        ...(electricFanLike ? ["841451", "841459"] : []),
        ...(workVestLike ? [] : [])
      ],
      candidateHsCodeReasons: [
        ...(escLike ? [
          {
            code: "847160",
            reason: "ESC가 컴퓨터 키보드의 Escape key 또는 키 입력장치 관련 약어일 가능성이 있습니다.",
            requiredInfo: ["키보드 완제품인지 키캡·스위치 등 부분품인지", "컴퓨터용 입력장치인지", "유선·무선 및 인터페이스"]
          },
          {
            code: "870830",
            reason: "ESC가 차량의 Electronic Stability Control 관련 제동 제어장치를 의미할 가능성이 있습니다.",
            requiredInfo: ["차량용 완성 제어장치인지 부분품인지", "ABS/ESC 모듈 포함 여부", "장착 대상 차종과 부품번호"]
          },
          {
            code: "848690",
            reason: "ESC가 반도체 제조 공정의 Electrostatic Chuck을 의미할 가능성이 있습니다.",
            requiredInfo: ["반도체 웨이퍼 고정용 정전척인지", "사용 장비와 공정", "제8486호 장비 전용 부분품인지"]
          }
        ] : []),
        ...(mushroomPowderLike ? [
          {
            code: "071239",
            reason: "건조 버섯을 단순 분쇄한 분말로 해석될 가능성이 있어 제0712호 계열 확인이 필요합니다.",
            requiredInfo: ["건조 버섯 단순 분쇄품인지", "조미·혼합·추출·열처리 등 추가 가공 여부", "버섯 종류와 성분표"]
          },
          {
            code: "210690",
            reason: "섭취용 조제품·보충제 형태라면 조제 식료품 계열과 경합될 수 있습니다.",
            requiredInfo: ["사람 섭취용 완제품인지", "다른 성분 혼합 여부", "건강기능식품 또는 효능 표시 여부"]
          }
        ] : []),
        ...(excavatorLike ? [{
          code: "842952",
          reason: "굴착·굴삭 장비로 해석될 가능성이 있어 제8429호 계열 확인이 필요합니다.",
          requiredInfo: ["자주식 완제품인지 부분품인지", "상부구조가 360도 회전하는지", "궤도식·휠식 여부"]
        }] : []),
        ...(laserBeltLike ? [{
          code: "901910",
          reason: "마사지·물리치료용 기기로 해석될 가능성이 있어 제9019호 계열 확인이 필요합니다.",
          requiredInfo: ["마사지·물리치료 기능 여부", "레이저 조사 외 진동·압박·온열 기능 여부", "의료기기 표시 목적"]
        }] : []),
        ...(printerLike ? [
          {
            code: "844332",
            reason: "컴퓨터나 네트워크에 연결 가능한 프린터 단독기로 해석될 가능성이 있습니다.",
            requiredInfo: ["프린터 단독 기능인지", "복사·팩스·스캔 기능 포함 여부", "레이저·잉크젯 등 인쇄 방식"]
          },
          {
            code: "844331",
            reason: "복사·팩스 등 복합 기능이 있는 프린터일 가능성도 함께 확인해야 합니다.",
            requiredInfo: ["복사·팩스 기능 포함 여부", "스캔 기능 포함 여부", "출력 방식"]
          }
        ] : []),
        ...(batteryLike ? [{
          code: "850760",
          reason: "리튬이온 축전지 또는 배터리 모듈로 해석될 가능성이 있어 제8507호 계열 확인이 필요합니다.",
          requiredInfo: ["셀·모듈·팩 형태", "리튬이온 축전지 여부", "정격 전압·용량과 최종 사용처"]
        }] : []),
        ...(electricFanLike ? [
          {
            code: "841451",
            reason: "전동기를 내장한 휴대용·탁상용 전기팬 완제품으로 해석될 가능성이 있습니다.",
            requiredInfo: ["전동기를 내장한 팬 완제품인지", "출력", "휴대용·탁상용·천장용 등 설치 형태", "배터리 별도 판매 여부"]
          },
          {
            code: "841459",
            reason: "제8414.51호에 해당하지 않는 기타 팬 구조라면 제8414.59호 계열도 함께 확인해야 합니다.",
            requiredInfo: ["팬 종류와 설치 형태", "모터 내장 여부", "산업용·가정용 구분"]
          }
        ] : []),
        ...(workVestLike ? [
          {
            code: "621133",
            reason: "작업용·안전·반사 조끼가 직물제 인조섬유 의류일 가능성이 있습니다.",
            requiredInfo: ["편직물/직물 구분", "섬유 조성", "반사띠·형광색 등 안전 기능", "남성용·여성용·공용 구분"]
          },
          {
            code: "611030",
            reason: "니트·편직물 조끼라면 제6110.30호 계열과 경합될 수 있습니다.",
            requiredInfo: ["니트·편직물 여부", "섬유 조성", "일반 의류인지 보호·안전 기능이 있는지"]
          }
        ] : [])
      ],
      webSources: [],
      missingQuestions: escLike
        ? ["ESC가 키보드 키, 차량 자세 제어장치, 반도체 정전척 중 무엇을 의미하는지 확인이 필요합니다.", "완제품인지 부분품인지, 장착 대상과 제품 사양서 확인이 필요합니다."]
        : mushroomPowderLike
        ? ["버섯 종류와 학명, 단순 건조·분쇄품인지 확인이 필요합니다.", "조미·혼합·추출·열처리 등 추가 가공 여부 확인이 필요합니다.", "섭취용 조제품 또는 건강기능식품 표시 여부 확인이 필요합니다."]
        : printerLike
        ? ["프린터 단독 기능인지, 복사·팩스·스캔 기능이 함께 있는지 확인이 필요합니다.", "레이저·잉크젯·도트매트릭스 등 인쇄 방식 확인이 필요합니다.", "흑백 전용인지 컬러 출력 가능 모델인지 확인이 필요합니다."]
        : excavatorLike
        ? ["굴삭기 완제품인지 부분품인지 확인이 필요합니다.", "상부구조가 360도 회전하는지 확인이 필요합니다."]
        : laserBeltLike
        ? ["마사지·물리치료용 기기인지, 단순 벨트류인지 확인이 필요합니다.", "레이저 조사 기능 외 진동·압박·온열 등 마사지 기능이 있는지 확인이 필요합니다.", "의료기기 허가·표시 목적이 있는지 확인이 필요합니다."]
        : batteryLike
        ? ["셀·모듈·팩 중 어느 형태인지 확인이 필요합니다.", "리튬이온 축전지인지, 일차전지인지 확인이 필요합니다.", "정격 전압·용량과 최종 사용처 확인이 필요합니다."]
        : electricFanLike
        ? ["전동기를 내장한 팬 완제품인지 확인이 필요합니다.", "출력과 설치 형태(휴대용·탁상용·천장용 등)를 확인해야 합니다.", "내장 배터리인지 별도 배터리 판매품인지 확인이 필요합니다."]
        : workVestLike
        ? ["편직물/뜨개질 제품인지 직물제 제품인지 확인이 필요합니다.", "겉감 재질과 섬유 조성 확인이 필요합니다.", "반사띠·형광색 등 안전용 기능 여부와 성별 구분 확인이 필요합니다."]
        : ["제품의 정확한 용도, 재질, 구성, 완제품/부분품 여부 확인이 필요합니다."]
    };
  }
}

function aiClarificationInstructions() {
  return [
    "You are an assistant inside a Korean customs SaaS.",
    "Return JSON only.",
    "Do not provide final HS classification, legal certainty, tariff applicability, or import/export requirement conclusions.",
    "Only suggest candidate codes that are present in the provided candidates array.",
    "Write Korean business SaaS copy.",
    "Focus on missing information questions, ambiguity, conflict risks, and staff-review handoff.",
    "JSON shape: {\"confidence\":\"low|medium|high\",\"summary\":\"string\",\"missingQuestions\":[\"string\"],\"suggestedCandidateCodes\":[\"string\"],\"riskNotes\":[\"string\"]}"
  ].join("\n");
}

function aiProductSearchNormalizationInstructions() {
  return [
    "You are an assistant inside a Korean customs SaaS.",
    "Return JSON only.",
    "Do not final-confirm HS classification, tariff applicability, or legal requirements.",
    "Answer this practical question first: \"검색품명\" HS CODE 알려줘.",
    "Use the product name and visible context to infer the most likely product family, then return Korean HSK lookup candidates.",
    "The input may be Korean, Chinese, Japanese, English, or another language. Translate and interpret the product name before producing HS lookup hints.",
    "Use general product knowledge only. Do not use live web search.",
    "Keep the answer short. Return only the minimum JSON fields requested below, with concise Korean text.",
    "Limits: candidateHsCodes max 3, candidateHsCodeReasons max 3, searchTerms max 5, koreanTerms max 3, englishTerms max 3, productFamilies max 2, missingQuestions max 3, requiredInfo max 3 per candidate.",
    "Default behavior: give the user the best HS CODE result immediately. Do not block the result with questions when a likely product family can be inferred.",
    "If a Korean HSK 10-digit code is commonly known for the product, return that 10-digit HSK first. If the 10-digit suffix is uncertain, return the best HS6/HS4 boundary and include any uncertainty only as short follow-up check points.",
    "If the product name is a clear common product, return one best Korean HSK 10-digit candidate when possible. Example: candy/sweets/confectionery should prefer the Korean sugar confectionery HSK path unless the input says chocolate, medicine, gum, or another specific product.",
    "Do not invent an exact Korean 10-digit suffix when uncertain. The app will validate candidateHsCodes against current Korean HSK data; if a 10-digit suffix is not current, the app may map it to an official Korean '기타' candidate under the same HS heading.",
    "Do not return an empty candidateHsCodes array only because the exact Korean HSK 10-digit suffix is unknown. Use HS4/HS6 as lookup hints and put exact 10-digit uncertainty in missingQuestions as non-blocking check points.",
    "If one product category is clearly dominant, set classificationState=single_likely_candidate, displayMode=single, provide one primaryCandidate, and put that code first in candidateHsCodes.",
    "If the same input can mean materially different products, set classificationState=ambiguous_multiple_meanings, displayMode=multiple, and return only the materially different HS directions.",
    "Use classificationState=needs_clarification only when even a broad HS4/HS6 product family cannot be inferred from the visible words. Otherwise always return at least one candidateHsCodes item.",
    "Do not use needs_clarification just because the exact national HS10 is uncertain. If HS4/HS6 is reasonably inferable, return it as a provisional candidateHsCodes item.",
    "Classify lookup intent by the traded finished article, principal function, and use before material or internal components.",
    "For rechargeable finished articles, do not prioritize battery headings only because the article contains an internal battery. Use battery headings only when the traded good is the battery, cell, module, pack, or spare battery itself.",
    "If the user input already includes an HS/HSK code hint, preserve it as a lookup hint. If it appears to be a foreign import code longer than HS6, include the shared HS6 prefix and do not assume the foreign national suffix equals Korean HSK.",
    "For every candidateHsCodes item, also provide candidateHsCodeReasons with {code, reason, requiredInfo}. The code must match one of candidateHsCodes after removing punctuation.",
    "candidateHsCodes are lookup hints only. They are not final classifications.",
    "Write Korean business SaaS copy for missingQuestions.",
    "Accepted aliases are tolerated but prefer the exact JSON keys. Do not use markdown.",
    "JSON shape: {\"classificationState\":\"needs_clarification|single_likely_candidate|ambiguous_multiple_meanings\",\"certainty\":\"high|medium|low\",\"displayMode\":\"single|multiple|needs_more_info\",\"userMessage\":\"string|null\",\"correctedProductName\":\"string|null\",\"primaryCandidate\":{\"code\":\"string\",\"reason\":\"string\",\"requiredInfo\":[\"string\"]}|null,\"searchTerms\":[\"string\"],\"koreanTerms\":[\"string\"],\"englishTerms\":[\"string\"],\"productFamilies\":[\"string\"],\"candidateHsCodes\":[\"string\"],\"candidateHsCodeReasons\":[{\"code\":\"string\",\"reason\":\"string\",\"requiredInfo\":[\"string\"]}],\"webSources\":[{\"title\":\"string\",\"url\":\"string\"}],\"missingQuestions\":[\"string\"]}"
  ].join("\n");
}

function outputTextFromOpenAiResponse(payload: unknown) {
  if (typeof payload !== "object" || !payload) return "";
  const data = payload as {
    output_text?: string;
    output?: Array<{
      content?: Array<{
        type?: string;
        text?: string;
      }>;
    }>;
  };

  if (typeof data.output_text === "string") return data.output_text;

  return (data.output ?? [])
    .flatMap((item) => item.content ?? [])
    .map((content) => content.text ?? "")
    .join("\n")
    .trim();
}

function webSourcesFromOpenAiResponse(payload: unknown) {
  if (typeof payload !== "object" || !payload) return [];
  const data = payload as {
    output?: Array<{
      type?: string;
      action?: {
        sources?: Array<{
          title?: string;
          url?: string;
        }>;
      };
    }>;
  };

  return (data.output ?? [])
    .filter((item) => item.type === "web_search_call")
    .flatMap((item) => item.action?.sources ?? [])
    .map((source) => typeof source.url === "string" && source.url.startsWith("http")
      ? { title: typeof source.title === "string" && source.title.trim() ? source.title.trim() : source.url, url: source.url }
      : null
    )
    .filter((source): source is { title: string; url: string } => source !== null)
    .slice(0, 5);
}

function parseAiClarificationJson(text: string, fallback: AiClarificationResult): AiClarificationResult {
  try {
    const parsed = JSON.parse(text) as Partial<AiClarificationResult>;
    const confidence = parsed.confidence === "high" || parsed.confidence === "medium" || parsed.confidence === "low"
      ? parsed.confidence
      : fallback.confidence;

    return {
      provider: fallback.provider,
      model: fallback.model,
      confidence,
      summary: typeof parsed.summary === "string" && parsed.summary.trim() ? parsed.summary.trim() : fallback.summary,
      missingQuestions: Array.isArray(parsed.missingQuestions)
        ? parsed.missingQuestions.filter((item): item is string => typeof item === "string").slice(0, 8)
        : fallback.missingQuestions,
      suggestedCandidateCodes: Array.isArray(parsed.suggestedCandidateCodes)
        ? parsed.suggestedCandidateCodes.filter((item): item is string => typeof item === "string").slice(0, 5)
        : fallback.suggestedCandidateCodes,
      riskNotes: Array.isArray(parsed.riskNotes)
        ? parsed.riskNotes.filter((item): item is string => typeof item === "string").slice(0, 6)
        : fallback.riskNotes
    };
  } catch {
    return fallback;
  }
}

function stringArray(value: unknown, limit: number) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim())).map((item) => item.trim()).slice(0, limit)
    : [];
}

function hsCodeArray(value: unknown, limit: number) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (typeof item === "string") return item;
      if (!item || typeof item !== "object") return "";
      const candidate = item as { code?: unknown; hsCode?: unknown; hs_code?: unknown; hskCode?: unknown; hsk_code?: unknown };
      return [candidate.code, candidate.hsCode, candidate.hs_code, candidate.hskCode, candidate.hsk_code]
        .find((field): field is string => typeof field === "string") ?? "";
    })
    .map((code) => code.replace(/[^0-9]/g, ""))
    .filter((code) => code.length >= 4 && code.length <= 10)
    .slice(0, limit);
}

function firstArray(...values: unknown[]) {
  return values.find((value) => Array.isArray(value));
}

function stringValueFromObject(value: unknown, keys: string[]) {
  if (!value || typeof value !== "object") return "";
  const record = value as Record<string, unknown>;
  return keys.map((key) => record[key]).find((field): field is string => typeof field === "string") ?? "";
}

function parseAiProductSearchNormalizationJson(text: string, fallback: AiProductSearchNormalizationResult): AiProductSearchNormalizationResult {
  try {
    const parsed = JSON.parse(text) as Partial<AiProductSearchNormalizationResult>;
    const rawParsed = parsed as Partial<AiProductSearchNormalizationResult> & {
      normalizedProductName?: unknown;
      hsCodes?: unknown;
      hsCodeCandidates?: unknown;
      hsCandidates?: unknown;
      candidates?: unknown;
      suggestedHsCodes?: unknown;
      candidateCodes?: unknown;
      primaryHsCode?: unknown;
      primaryHsCandidate?: unknown;
    };
    const classificationState = parsed.classificationState === "needs_clarification"
      || parsed.classificationState === "single_likely_candidate"
      || parsed.classificationState === "ambiguous_multiple_meanings"
      ? parsed.classificationState
      : fallback.classificationState;
    const certainty = parsed.certainty === "high" || parsed.certainty === "medium" || parsed.certainty === "low"
      ? parsed.certainty
      : fallback.certainty;
    const displayMode = parsed.displayMode === "single" || parsed.displayMode === "multiple" || parsed.displayMode === "needs_more_info"
      ? parsed.displayMode
      : fallback.displayMode;
    const rawPrimarySource = parsed.primaryCandidate ?? rawParsed.primaryHsCandidate ?? rawParsed.primaryHsCode;
    const rawPrimaryCandidate = rawPrimarySource && typeof rawPrimarySource === "object"
      ? rawPrimarySource as { code?: unknown; hsCode?: unknown; hs_code?: unknown; hskCode?: unknown; hsk_code?: unknown; hs?: unknown; hs6?: unknown; reason?: unknown; description?: unknown; requiredInfo?: unknown; missingInfo?: unknown }
      : null;
    const primaryCodeSource = rawPrimaryCandidate
      ? [rawPrimaryCandidate.code, rawPrimaryCandidate.hsCode, rawPrimaryCandidate.hs_code, rawPrimaryCandidate.hskCode, rawPrimaryCandidate.hsk_code, rawPrimaryCandidate.hs, rawPrimaryCandidate.hs6]
        .find((field): field is string => typeof field === "string") ?? ""
      : typeof rawPrimarySource === "string" ? rawPrimarySource : "";
    const primaryCode = primaryCodeSource.replace(/[^0-9]/g, "");
    const primaryReason = rawPrimaryCandidate && typeof rawPrimaryCandidate.reason === "string" && rawPrimaryCandidate.reason.trim()
      ? rawPrimaryCandidate.reason.trim()
      : rawPrimaryCandidate && typeof rawPrimaryCandidate.description === "string" && rawPrimaryCandidate.description.trim()
      ? rawPrimaryCandidate.description.trim()
      : "";
    const primaryCandidate = primaryCode.length >= 4 && primaryCode.length <= 10 && primaryReason
      ? {
        code: primaryCode,
        reason: primaryReason,
        requiredInfo: stringArray(rawPrimaryCandidate?.requiredInfo ?? rawPrimaryCandidate?.missingInfo, 5)
      }
      : fallback.primaryCandidate ?? null;
    const rawCandidateHsCodes = firstArray(
      parsed.candidateHsCodes,
      rawParsed.hsCodes,
      rawParsed.hsCodeCandidates,
      rawParsed.hsCandidates,
      rawParsed.candidates,
      rawParsed.suggestedHsCodes,
      rawParsed.candidateCodes
    );
    const candidateHsCodes = Array.from(new Set([
      ...(primaryCandidate ? [primaryCandidate.code] : []),
      ...hsCodeArray(rawCandidateHsCodes, 8)
    ])).slice(0, 8);
    const rawCandidateReasons = firstArray(parsed.candidateHsCodeReasons, rawParsed.hsCodeCandidates, rawParsed.hsCandidates, rawParsed.candidates);

    return {
      provider: fallback.provider,
      model: fallback.model,
      classificationState,
      certainty,
      displayMode,
      userMessage: typeof parsed.userMessage === "string" && parsed.userMessage.trim()
        ? parsed.userMessage.trim()
        : fallback.userMessage ?? null,
      correctedProductName: typeof parsed.correctedProductName === "string" && parsed.correctedProductName.trim()
        ? parsed.correctedProductName.trim()
        : typeof rawParsed.normalizedProductName === "string" && rawParsed.normalizedProductName.trim()
        ? rawParsed.normalizedProductName.trim()
        : fallback.correctedProductName,
      primaryCandidate,
      searchTerms: stringArray(parsed.searchTerms, 12),
      koreanTerms: stringArray(parsed.koreanTerms, 8),
      englishTerms: stringArray(parsed.englishTerms, 8),
      productFamilies: stringArray(parsed.productFamilies, 6),
      candidateHsCodes,
      candidateHsCodeReasons: Array.isArray(rawCandidateReasons)
        ? rawCandidateReasons
          .map((item) => {
            if (!item || typeof item !== "object") return null;
            const reason = item as { code?: unknown; hsCode?: unknown; hs_code?: unknown; hskCode?: unknown; hsk_code?: unknown; hs?: unknown; hs6?: unknown; reason?: unknown; description?: unknown; name?: unknown; product?: unknown; requiredInfo?: unknown; missingInfo?: unknown };
            const code = stringValueFromObject(reason, ["code", "hsCode", "hs_code", "hskCode", "hsk_code", "hs", "hs6"]).replace(/[^0-9]/g, "");
            const reasonText = stringValueFromObject(reason, ["reason", "description", "name", "product"]).trim();
            if (code.length < 4 || code.length > 10 || !reasonText) return null;
            return {
              code,
              reason: reasonText,
              requiredInfo: stringArray(reason.requiredInfo ?? reason.missingInfo, 5)
            };
          })
          .filter((item): item is { code: string; reason: string; requiredInfo: string[] } => item !== null)
          .slice(0, 8)
        : Array.isArray(rawCandidateHsCodes)
        ? rawCandidateHsCodes
          .map((item) => {
            if (!item || typeof item !== "object") return null;
            const candidate = item as { code?: unknown; hsCode?: unknown; hs_code?: unknown; hskCode?: unknown; hsk_code?: unknown; hs?: unknown; hs6?: unknown; description?: unknown; reason?: unknown; name?: unknown; product?: unknown; requiredInfo?: unknown; missingInfo?: unknown };
            const codeSource = [candidate.code, candidate.hsCode, candidate.hs_code, candidate.hskCode, candidate.hsk_code, candidate.hs, candidate.hs6]
              .find((field): field is string => typeof field === "string") ?? "";
            const code = codeSource.replace(/[^0-9]/g, "");
            const reason = stringValueFromObject(candidate, ["reason", "description", "name", "product"]).trim();
            if (code.length < 4 || code.length > 10 || !reason) return null;
            return {
              code,
              reason,
              requiredInfo: stringArray(candidate.requiredInfo ?? candidate.missingInfo, 5)
            };
          })
          .filter((item): item is { code: string; reason: string; requiredInfo: string[] } => item !== null)
          .slice(0, 8)
        : fallback.candidateHsCodeReasons,
      webSources: Array.isArray(parsed.webSources)
        ? parsed.webSources
          .map((item) => {
            if (!item || typeof item !== "object") return null;
            const source = item as { title?: unknown; url?: unknown };
            return typeof source.url === "string" && source.url.startsWith("http")
              ? { title: typeof source.title === "string" ? source.title : source.url, url: source.url }
              : null;
          })
          .filter((item): item is { title: string; url: string } => item !== null)
          .slice(0, 5)
        : fallback.webSources,
      missingQuestions: stringArray(parsed.missingQuestions, 8)
    };
  } catch {
    return fallback;
  }
}

export class OpenAiProvider implements AiProvider {
  name: AiProviderName = "openai";
  model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
  private readonly apiKey: string | undefined;
  private readonly timeoutMs = envNumber("OPENAI_TIMEOUT_MS", 15_000);
  private readonly clarificationTimeoutMs = envNumber("OPENAI_CLARIFICATION_TIMEOUT_MS", 2_000);
  private readonly productSearchTimeoutMs = envNumber("OPENAI_PRODUCT_SEARCH_TIMEOUT_MS", 30_000);
  private readonly productSearchRetryTimeoutMs = envNumber("OPENAI_PRODUCT_SEARCH_RETRY_TIMEOUT_MS", 8_000);

  constructor(apiKey = process.env.OPENAI_API_KEY) {
    this.apiKey = apiKey;
  }

  private responseBody(input: unknown, instructions: string, maxOutputTokens: number) {
    return {
      model: this.model,
      instructions,
      input: typeof input === "string" ? input : JSON.stringify(input),
      store: false,
      max_output_tokens: maxOutputTokens,
      ...(reasoningEffortForResponses(this.model) ? { reasoning: { effort: reasoningEffortForResponses(this.model) } } : {})
    };
  }

  private async requestResponsesApi(body: unknown, timeoutMs = this.timeoutMs) {
    if (!this.apiKey) return null;

    const controller = new AbortController();
    const shouldTimeout = Number.isFinite(timeoutMs) && timeoutMs > 0;
    const timeout = shouldTimeout ? setTimeout(() => controller.abort(), timeoutMs) : null;

    try {
      const request = fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body),
        signal: shouldTimeout ? controller.signal : undefined
      });
      const response = shouldTimeout
        ? await Promise.race([
          request,
          new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs))
        ])
        : await request;

      if (response?.ok) return response;
      if (process.env.OPENAI_PRODUCT_SEARCH_DEBUG === "1" || process.env.OPENAI_PRODUCT_SEARCH_DEBUG === "true") {
        const status = response instanceof Response ? `${response.status} ${response.statusText}` : "timeout";
        const text = response instanceof Response ? await response.text().catch(() => "") : "";
        console.info("[openai-response-error]", { status, text: text.slice(0, 2000) });
      }
      return null;
    } catch (error) {
      if (process.env.OPENAI_PRODUCT_SEARCH_DEBUG === "1" || process.env.OPENAI_PRODUCT_SEARCH_DEBUG === "true") {
        console.info("[openai-response-error]", { error: error instanceof Error ? error.message : String(error) });
      }
      return null;
    } finally {
      if (timeout) clearTimeout(timeout);
    }
  }

  async clarify(prompt: AiClarificationPrompt): Promise<AiClarificationResult> {
    if (!this.apiKey) {
      return new MockAiProvider().clarify(prompt);
    }

    const mockFallback = await new MockAiProvider().clarify(prompt);
    const fallback: AiClarificationResult = {
      ...mockFallback,
      provider: this.name,
      model: this.model
    };
    const response = await this.requestResponsesApi(
      this.responseBody(prompt, aiClarificationInstructions(), 2000),
      this.clarificationTimeoutMs
    );

    if (!response) return fallback;

    const payload = await response.json() as unknown;
    const outputText = outputTextFromOpenAiResponse(payload);
    const parsed = parseAiClarificationJson(outputText, fallback);
    const allowedCodes = new Set(prompt.candidates.map((candidate) => candidate.hskCode));

    return {
      ...parsed,
      suggestedCandidateCodes: parsed.suggestedCandidateCodes.filter((code) => allowedCodes.has(code))
    };
  }

  async normalizeProductSearch(prompt: AiProductSearchNormalizationPrompt): Promise<AiProductSearchNormalizationResult> {
    const mockFallback = await new MockAiProvider().normalizeProductSearch(prompt);
    const fallback: AiProductSearchNormalizationResult = {
      ...mockFallback,
      provider: this.name,
      model: this.model
    };

    if (!this.apiKey) return fallback;
    const response = await this.requestResponsesApi(
      this.responseBody(
        prompt,
        aiProductSearchNormalizationInstructions(),
        900
      ),
      this.productSearchTimeoutMs
    );

    if (!response) return fallback;

    const payload = await response.json() as unknown;
    const outputText = outputTextFromOpenAiResponse(payload);
    if (process.env.OPENAI_PRODUCT_SEARCH_DEBUG === "1" || process.env.OPENAI_PRODUCT_SEARCH_DEBUG === "true") {
      console.info("[openai-product-search]", {
        outputText: outputText.slice(0, 2000),
        payload: JSON.stringify(payload).slice(0, 2000)
      });
    }
    const parsed = parseAiProductSearchNormalizationJson(outputText, fallback);
    const responseWebSources = webSourcesFromOpenAiResponse(payload);
    const parsedWithRetry = parsed.candidateHsCodes.length
      ? parsed
      : await this.retryProductSearchAsSimpleInterviewer(prompt, fallback);

    return {
      ...parsedWithRetry,
      webSources: parsedWithRetry.webSources.length ? parsedWithRetry.webSources : responseWebSources,
      searchTerms: Array.from(new Set([
        ...(parsedWithRetry.correctedProductName ? [parsedWithRetry.correctedProductName] : []),
        ...parsedWithRetry.searchTerms,
        ...parsedWithRetry.koreanTerms,
        ...parsedWithRetry.englishTerms
      ].map((term) => term.toLowerCase()).filter((term) => term.length >= 2))).slice(0, 14)
    };
  }

  private async retryProductSearchAsSimpleInterviewer(
    prompt: AiProductSearchNormalizationPrompt,
    fallback: AiProductSearchNormalizationResult
  ) {
    const response = await this.requestResponsesApi(
      this.responseBody(
        {
          ...prompt,
          fallbackInstruction: [
            "Answer the practical question: 이 품명 HS CODE가 뭘까?",
            "Use general product knowledge when exact product identification is unavailable.",
            "If one product category is clearly dominant, return one primaryCandidate and one candidateHsCodes item.",
            "If one broad HS4/HS6 is clearly useful, return it as the first candidateHsCodes item.",
            "If exact classification needs facts, keep the code provisional and put the facts in missingQuestions.",
            "If the product family is recognizable but branch facts are missing, do not answer with many unrelated candidates. Ask the minimum branch questions and keep at most one broad HS4/HS6 direction.",
            "Do not return an empty candidateHsCodes array for a recognizable product family."
          ].join(" ")
        },
        aiProductSearchNormalizationInstructions(),
        800
      ),
      this.productSearchRetryTimeoutMs
    );

    if (!response) return fallback;
    const payload = await response.json() as unknown;
    return parseAiProductSearchNormalizationJson(outputTextFromOpenAiResponse(payload), fallback);
  }
}

export function getAiProvider(): AiProvider {
  if (process.env.NODE_ENV === "test" && process.env.AI_PROVIDER !== "openai") {
    return new MockAiProvider();
  }

  if (process.env.OPENAI_API_KEY && process.env.AI_PROVIDER !== "mock") {
    return new OpenAiProvider();
  }

  return new MockAiProvider();
}

export const aiProviderInternals = {
  aiProductSearchNormalizationInstructions,
  outputTextFromOpenAiResponse,
  webSourcesFromOpenAiResponse,
  parseAiClarificationJson,
  parseAiProductSearchNormalizationJson,
  reasoningEffortForResponses
};
