import type { ProductHsRecommendationInput } from "@/features/hs/schemas";

export type ProductCandidateHint = {
  hskCode: string;
  keywords: string[];
  baseReason: string;
  questions: string[];
  risk: string;
};

export type ProductNameSearchRow = {
  hsk_code: string;
  standard_name_kr: string;
  required_spec_kr: string | null;
  detailed_classification: string | null;
  source_name?: string;
  source_url?: string;
  source_version?: string;
};

export type ProductNameSearchAnalysis = {
  rawText: string;
  compactText: string;
  rawTerms: string[];
  terms: string[];
  spellingCorrections: Array<{ from: string; to: string }>;
  conceptLabels: string[];
  requiredConcepts: Array<{ label: string; terms: string[] }>;
};

export const productCandidateHints: ProductCandidateHint[] = [
  {
    hskCode: "3304101000",
    keywords: ["입술", "립", "립밤", "립스틱", "립글로스", "lip", "balm", "stick"],
    baseReason: "품명 또는 용도에 입술화장용 제품 단서가 있습니다.",
    questions: ["입술 직접 사용 제품", "색조·보습·자외선차단 등 기능", "의약품·의약외품 효능 표시 여부"],
    risk: "기능성화장품, 의약외품, 표시·인증 규제 가능성은 별도 확인 필요"
  },
  {
    hskCode: "3304991000",
    keywords: ["크림", "핸드크림", "화장", "피부", "스킨", "로션", "보습", "클렌저", "세안", "cosmetic", "cream", "hand cream", "moisture", "moisturizing", "moisturizer", "moisturiser", "lotion", "skin care", "cleanser"],
    baseReason: "품명 또는 용도에 피부 적용 화장품 단서가 있습니다.",
    questions: ["피부 직접 사용 제품", "의약품·의약외품 효능 표시 여부", "전성분표·용량 정보"],
    risk: "의약외품, 기능성화장품, 표시·인증 규제 가능성은 별도 확인 필요"
  },
  {
    hskCode: "8507601000",
    keywords: ["배터리", "전지", "리튬", "축전지", "battery", "cell", "module"],
    baseReason: "품명 또는 용도에 리튬이온 축전지 단서가 있습니다.",
    questions: ["셀·모듈·팩 구분", "정격 전압·용량", "최종 사용처·UN38.3 자료"],
    risk: "운송 위험물, 전기용품 안전, 수출 전략물자 관련 정보 확인 필요"
  },
  {
    hskCode: "3926909000",
    keywords: ["플라스틱", "수지", "부품", "케이스", "커버", "plastic", "resin"],
    baseReason: "품명 또는 용도에 플라스틱 제품 단서가 있습니다.",
    questions: ["장착 대상 완제품", "단독 기능 여부", "재질·제조공정"],
    risk: "부분품 분류 가능성과 재질별 분류 경합 확인 필요"
  },
  {
    hskCode: "8543709090",
    keywords: ["전기", "전자", "장치", "센서", "모듈", "device", "sensor", "electronic"],
    baseReason: "품명 또는 용도에 전기기기 단서가 있습니다.",
    questions: ["전원 방식·주요 기능", "통신·암호화 기능 여부", "회로도·제품 사양서"],
    risk: "전기용품 안전요건, 전파인증, 전략물자 관련 정보 확인 필요"
  },
  {
    hskCode: "2106909099",
    keywords: ["식품", "분말", "보충제", "음료", "섭취", "food", "powder", "supplement"],
    baseReason: "품명 또는 용도에 조제 식료품 단서가 있습니다.",
    questions: ["사람 섭취용 제품", "성분별 함량·제조공정", "건강기능식품 표시·효능 문구"],
    risk: "식품검역, 식품위생, 건강기능식품 해당 가능성은 별도 확인 필요"
  },
  {
    hskCode: "0712391090",
    keywords: ["버섯", "mushroom", "mushrooms", "분말", "가루", "powder", "dried"],
    baseReason: "품명에 버섯과 건조·분말 형태 단서가 있습니다.",
    questions: ["건조 버섯을 단순 분쇄한 것인지", "열처리·조미·혼합·추출 등 추가 가공 여부", "버섯 종류와 학명, 성분표"],
    risk: "단순 건조·분쇄품은 제0712호 가능성이 있으나 조미·혼합·추출·건강기능식품이면 제2003호·제2106호 등과 경합될 수 있습니다."
  },
  {
    hskCode: "8429521000",
    keywords: ["굴삭기", "굴착기", "excavator", "excavators", "excavation", "excavating", "backhoe", "digger"],
    baseReason: "품명에 굴착·굴삭 장비 단서가 있습니다.",
    questions: ["자주식 완성 장비인지 부분품인지", "상부구조가 360도 회전하는지", "궤도식·휠식 여부와 버킷/붐 구성"],
    risk: "굴삭기 완제품, 로더, 백호로더, 부분품은 제8429호·제8431호 등에서 경합될 수 있습니다."
  },
  {
    hskCode: "9019102000",
    keywords: ["laser belt", "massage belt", "massage", "massager", "physiotherapy", "physical therapy", "rehabilitation", "마사지", "안마", "물리치료", "재활치료"],
    baseReason: "품명에 마사지·물리치료용 기기 단서가 있습니다.",
    questions: ["마사지·물리치료용 기기인지", "레이저 조사 기능만 있는지, 진동·압박·온열 등 마사지 기능이 있는지", "의료기기 허가 대상 표시·사용 목적"],
    risk: "레이저 장치, 벨트형 착용품, 마사지기, 의료기기는 기능과 표시 목적에 따라 제9019호·제9013호·제6307호 등과 경합될 수 있습니다."
  },
  {
    hskCode: "8443321010",
    keywords: ["printer", "printers", "laser printer", "black and white printer", "monochrome printer", "프린터", "레이저 프린터", "흑백 프린터", "단색 프린터", "인쇄기"],
    baseReason: "품명에 프린터 또는 인쇄 기능 단서가 있습니다.",
    questions: ["프린터 단독 기능인지, 복사·팩스·스캔 기능이 함께 있는지", "레이저·잉크젯·도트매트릭스 등 인쇄 방식", "흑백 전용인지 컬러 출력 가능 모델인지", "컴퓨터나 네트워크에 연결 가능한 출력장치인지"],
    risk: "프린터 단독기, 복합기, 산업용 인쇄기, 프린터 부분품은 제8443호 내에서 하위 세번이 달라질 수 있습니다."
  }
];

const synonymGroups = [
  ["립밤", "립스틱", "립글로스", "립", "입술", "입술화장"],
  ["폼클렌저", "클렌저", "세안제", "세정제", "피부세척", "피부세정", "세척"],
  ["핸드크림", "hand cream", "handcream", "moisture cream", "moisturizing cream", "moisture", "moisturizing", "moisturizer", "moisturiser", "lotion", "스킨케어", "피부", "보습", "크림", "화장품", "cosmetic", "skin care"],
  ["선크림", "선스크린", "자외선차단", "썬크림"],
  ["핸드백", "가방", "백", "파우치", "지갑"],
  ["리튬이온", "리튬", "배터리", "전지", "축전지", "셀", "모듈", "팩"],
  ["영양제", "보충제", "건강기능식품", "섭취", "식품"],
  ["분말", "가루", "powder", "powders"],
  ["버섯", "mushroom", "mushrooms", "fungi"],
  ["플라스틱", "수지", "합성수지", "케이스", "커버"],
  ["센서", "모듈", "전자장치", "전기기기", "전자기기"],
  ["굴삭기", "굴착기", "excavator", "excavators", "excavation", "excavating", "backhoe", "digger"],
  ["마사지", "안마", "물리치료", "재활치료", "massage", "massager", "physiotherapy", "physical therapy", "rehabilitation", "laser belt", "massage belt"],
  ["printer", "printers", "laser printer", "black and white printer", "monochrome printer", "프린터", "레이저 프린터", "흑백 프린터", "단색 프린터", "인쇄기", "출력장치"]
];

const conceptGroups = [
  { label: "버섯", terms: ["mushroom", "mushrooms", "버섯", "fungi"] },
  { label: "분말/가루", terms: ["powder", "powders", "분말", "가루"] },
  { label: "식품/섭취", terms: ["food", "식품", "섭취", "보충제", "supplement"] },
  { label: "화장품", terms: ["cosmetic", "화장품", "화장", "피부", "입술", "크림", "핸드크림", "hand cream", "handcream", "moisture cream", "moisturizing cream", "moisture", "moisturizing", "moisturizer", "moisturiser", "lotion", "skin care"] },
  { label: "전기/전자", terms: ["electronic", "device", "전기", "전자", "장치", "센서", "모듈"] },
  { label: "배터리", terms: ["battery", "리튬", "배터리", "전지", "축전지"] },
  { label: "굴착 장비", terms: ["excavator", "excavators", "excavation", "excavating", "굴삭기", "굴착기", "backhoe", "digger"] },
  { label: "마사지/물리치료", terms: ["massage", "massager", "physiotherapy", "physical therapy", "rehabilitation", "마사지", "안마", "물리치료", "재활치료"] },
  { label: "프린터/인쇄", terms: ["printer", "printers", "laser printer", "black and white printer", "monochrome printer", "프린터", "레이저 프린터", "흑백 프린터", "단색 프린터", "인쇄기"] }
];

const typoCorrectionVocabulary = Array.from(new Set([
  ...productCandidateHints.flatMap((hint) => hint.keywords),
  ...synonymGroups.flat(),
  ...conceptGroups.flatMap((group) => group.terms)
].map((term) => term.toLowerCase()).filter((term) => /^[a-z]+$/.test(term) && term.length >= 5)));

const knownTypoCorrections: Record<string, string[]> = {
  puder: ["powder"]
};

export function normalizeProductInputText(input: ProductHsRecommendationInput) {
  return [
    input.productName,
    input.productUsage,
    input.material,
    input.composition,
    input.functions,
    input.modelName
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function editDistanceWithinLimit(left: string, right: string, limit: number) {
  if (Math.abs(left.length - right.length) > limit) return limit + 1;

  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = [leftIndex];
    let rowMin = current[0]!;

    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const cost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;
      const value = Math.min(
        previous[rightIndex]! + 1,
        current[rightIndex - 1]! + 1,
        previous[rightIndex - 1]! + cost
      );
      current[rightIndex] = value;
      rowMin = Math.min(rowMin, value);
    }

    if (rowMin > limit) return limit + 1;
    previous = current;
  }

  return previous[right.length]!;
}

export function spellingCorrectionsForTerm(term: string) {
  const normalized = term.toLowerCase();
  if (!/^[a-z]+$/.test(normalized) || normalized.length < 5) return [];
  const knownCorrections = knownTypoCorrections[normalized] ?? [];
  const limit = normalized.length >= 8 ? 2 : 1;

  return Array.from(new Set([
    ...knownCorrections,
    ...typoCorrectionVocabulary
      .filter((candidate) => candidate !== normalized)
      .filter((candidate) => editDistanceWithinLimit(normalized, candidate, limit) <= limit)
  ])).slice(0, 3);
}

export function analyzeProductNameInput(input: ProductHsRecommendationInput): ProductNameSearchAnalysis {
  const rawText = normalizeProductInputText(input);
  const rawTerms = rawText
    .split(/[\s,./()_-]+/)
    .map((term) => term.trim())
    .filter((term) => term.length >= 2)
    .slice(0, 10);
  const expanded = new Set(rawTerms);
  const spellingCorrections = rawTerms.flatMap((term) =>
    spellingCorrectionsForTerm(term).map((correction) => ({ from: term, to: correction }))
  );

  spellingCorrections.forEach((correction) => expanded.add(correction.to));
  const termPool = [...expanded];
  const compactText = `${termPool.join(" ")} ${rawText.replace(/\s+/g, "")}`;

  for (const group of synonymGroups) {
    if (group.some((term) => compactText.includes(term.toLowerCase()) || termPool.includes(term.toLowerCase()))) {
      group.forEach((term) => expanded.add(term.toLowerCase()));
    }
  }

  const terms = [...expanded].filter((term) => term.length >= 2).slice(0, 24);
  const conceptLabels = conceptGroups
    .filter((group) => group.terms.some((term) => terms.includes(term) || compactText.includes(term)))
    .map((group) => group.label);
  const requiredConcepts = requiredStandardNameConcepts(terms);

  return {
    rawText,
    compactText,
    rawTerms,
    terms,
    spellingCorrections,
    conceptLabels,
    requiredConcepts
  };
}

function requiredStandardNameConcepts(terms: string[]) {
  const normalizedTerms = new Set(terms.map((term) => term.toLowerCase()));
  const requiredConcepts: Array<{ label: string; terms: string[] }> = [];
  const hasMushroomConcept = ["mushroom", "mushrooms", "버섯", "fungi"].some((term) => normalizedTerms.has(term));
  const hasPowderConcept = ["powder", "powders", "분말", "가루"].some((term) => normalizedTerms.has(term));

  if (hasMushroomConcept && hasPowderConcept) {
    requiredConcepts.push({ label: "버섯", terms: ["mushroom", "mushrooms", "버섯", "fungi"] });
    requiredConcepts.push({ label: "분말/가루", terms: ["powder", "powders", "분말", "가루"] });
  }

  return requiredConcepts;
}

export function scoreProductHint(analysis: ProductNameSearchAnalysis, hint: ProductCandidateHint) {
  const termSet = new Set(analysis.terms);
  const matched = hint.keywords.filter((keyword) => {
    const normalized = keyword.toLowerCase();
    return termSet.has(normalized) || analysis.rawText.includes(normalized) || analysis.compactText.includes(normalized);
  });

  return {
    matched,
    score: matched.length,
    breakdown: matched.map((term) => `키워드 ${term}`)
  };
}

export function scoreStandardName(row: ProductNameSearchRow, analysis: ProductNameSearchAnalysis) {
  const haystack = `${row.standard_name_kr} ${row.required_spec_kr ?? ""} ${row.detailed_classification ?? ""}`.toLowerCase();
  const missingConcept = analysis.requiredConcepts.find((concept) => !concept.terms.some((term) => haystack.includes(term)));
  if (missingConcept) {
    return {
      score: 0,
      matchedTerms: [],
      breakdown: [`필수 개념 불일치: ${missingConcept.label}`]
    };
  }

  const matchedTerms = analysis.terms.filter((term) => haystack.includes(term.toLowerCase()));
  const conceptBonus = analysis.requiredConcepts.length ? analysis.requiredConcepts.length : 0;

  return {
    score: matchedTerms.length + conceptBonus,
    matchedTerms,
    breakdown: [
      ...matchedTerms.slice(0, 6).map((term) => `표준품명 단서 ${term}`),
      ...analysis.requiredConcepts.map((concept) => `핵심개념 ${concept.label}`)
    ]
  };
}

export function scoreStandardNameWithTerms(row: ProductNameSearchRow, terms: string[]) {
  return scoreStandardName(row, {
    rawText: terms.join(" "),
    compactText: terms.join(""),
    rawTerms: terms,
    terms,
    spellingCorrections: [],
    conceptLabels: [],
    requiredConcepts: requiredStandardNameConcepts(terms)
  }).score;
}

export function productSearchTerms(input: ProductHsRecommendationInput) {
  return analyzeProductNameInput(input).terms;
}
