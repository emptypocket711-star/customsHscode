import { normalizeHsCode } from "@/lib/hs-code";

export type HsSupplementGuidance = {
  code: string;
  level: "product" | "hs4" | "hs6" | "hsk10" | "unknown";
  title: string;
  description: string;
  questions: string[];
  recommendedMaterials: string[];
  canRequestConfirmation: boolean;
};

const genericQuestions = [
  "제품의 정확한 용도와 최종 사용처",
  "재질, 성분, 함량 또는 주요 구성품",
  "제품 사진, 카탈로그, 사양서",
  "모델명, 제조사 품번, 작동 원리",
  "완제품인지 부분품인지 여부",
  "수입 후 판매 형태와 포장 단위"
];

const genericMaterials = ["제품 카탈로그", "제품 사진", "사양서", "성분표 또는 재질표", "제조공정 설명", "사용설명서"];

const guidanceRules: Array<{
  prefix: string;
  title: string;
  questions: string[];
  recommendedMaterials?: string[];
}> = [
  {
    prefix: "3304",
    title: "화장품 하위 분류 보완",
    questions: [
      "입술용, 눈화장용, 기초화장용, 매니큐어/페디큐어용 중 어디에 해당하는지",
      "자외선차단, 미백, 주름개선 등 기능성 표시 여부",
      "의약품 또는 의약외품 효능을 표방하는지",
      "제품 형태: 크림, 로션, 세럼, 패치, 밤, 파우더 등",
      "사용 부위와 주요 기능",
      "전성분표, 제품 라벨, 용량 정보"
    ],
    recommendedMaterials: ["전성분표", "제품 라벨", "제품 사진", "기능성화장품 심사/보고 자료", "카탈로그"]
  },
  {
    prefix: "8421",
    title: "여과·정화 장치 및 부분품 보완",
    questions: [
      "어떤 액체나 기체를 여과, 정화, 분리하는 장치인지",
      "완성 장치인지 부분품인지",
      "사용되는 장비 또는 산업 분야",
      "필터 매체와 재질",
      "단독 기능이 있는지 특정 장비 전용인지",
      "작동 원리와 처리 대상 물질"
    ],
    recommendedMaterials: ["장치 사양서", "구조도", "필터 매체 자료", "사용처 설명", "제품 사진", "카탈로그"]
  },
  {
    prefix: "8507",
    title: "축전지 하위 분류 보완",
    questions: [
      "리튬이온, 납산, 니켈계 등 전지 종류",
      "셀, 모듈, 팩, 완제품 장착용 부분품 중 어디에 해당하는지",
      "정격 전압, 용량, 에너지량",
      "BMS 포함 여부",
      "최종 장착 대상 제품",
      "UN38.3, MSDS 등 운송·안전 자료 보유 여부"
    ],
    recommendedMaterials: ["배터리 사양서", "MSDS", "UN38.3", "제품 사진", "회로/구성 설명", "용도 설명"]
  },
  {
    prefix: "3926",
    title: "플라스틱 제품·부분품 보완",
    questions: [
      "플라스틱 재질 종류와 함량",
      "단독 제품인지 다른 물품의 부분품인지",
      "장착 대상 완제품과 기능",
      "제조공정: 사출, 압출, 절단, 조립 등",
      "특정 호에 더 구체적으로 분류되는 물품인지",
      "판매 형태와 포장 단위"
    ],
    recommendedMaterials: ["재질표", "도면", "장착 사진", "완제품 설명", "제조공정 설명", "카탈로그"]
  },
  {
    prefix: "2106",
    title: "조제식료품 보완",
    questions: [
      "사람 섭취용인지 동물용인지",
      "성분별 함량과 제조공정",
      "분말, 액상, 캡슐, 정제 등 제품 형태",
      "건강기능식품 또는 효능 표시 여부",
      "알코올, 당류, 유제품 등 특정 성분 포함 여부",
      "소매포장 여부와 1회 섭취 방식"
    ],
    recommendedMaterials: ["성분배합표", "제조공정도", "제품 라벨", "기능성 표시 자료", "제품 사진", "판매 페이지"]
  }
];

function supplementLevel(normalizedCode: string): HsSupplementGuidance["level"] {
  if (normalizedCode.length >= 10) return "hsk10";
  if (normalizedCode.length >= 6) return "hs6";
  if (normalizedCode.length >= 4) return "hs4";
  return "unknown";
}

export function buildHsSupplementGuidance(inputCode: string): HsSupplementGuidance {
  const normalizedCode = normalizeHsCode(inputCode);
  const level = supplementLevel(normalizedCode);
  const rule = guidanceRules
    .filter((item) => normalizedCode.startsWith(item.prefix) || item.prefix.startsWith(normalizedCode))
    .sort((a, b) => b.prefix.length - a.prefix.length)[0];
  const title = rule?.title ?? "HS 하위 분류 보완";
  const levelText = level === "hs4" ? "HS 4자리" : level === "hs6" ? "HS 6자리" : level === "hsk10" ? "HSK 10자리" : "HS CODE";

  return {
    code: normalizedCode,
    level,
    title,
    description:
      level === "hsk10"
        ? "HSK 10자리 후보가 있으므로 품명, 용도, 재질, 사양과의 충돌 여부를 확인한 뒤 상세조회로 이동할 수 있습니다."
        : `${levelText}까지 식별된 상태입니다. 하위 HSK를 좁히려면 아래 자료가 필요합니다.`,
    questions: rule?.questions ?? genericQuestions,
    recommendedMaterials: rule?.recommendedMaterials ?? genericMaterials,
    canRequestConfirmation: normalizedCode.length >= 4
  };
}

export function buildProductSupplementGuidance(productName: string): HsSupplementGuidance {
  const normalized = productName.trim();

  return {
    code: "",
    level: "product",
    title: "품명 보완 필요",
    description:
      normalized
        ? "입력한 품명만으로는 하위 HS를 확정하기 어렵습니다. 아래 항목을 보완하면 HS 4자리, 6자리, 10자리 후보를 단계적으로 좁힐 수 있습니다."
        : "품명이 비어 있습니다. 제품을 식별할 수 있는 기본 자료를 먼저 보완해 주세요.",
    questions: [
      "제품의 실제 용도와 최종 사용처",
      "재질, 성분, 함량 또는 주요 구성품",
      "완제품인지 부분품인지 여부",
      "작동 원리, 기능, 장착 대상 제품",
      "판매 형태, 포장 단위, 모델명 또는 제조사 품번",
      "인보이스에 기재된 HS CODE가 있다면 해당 코드와 기재 사유"
    ],
    recommendedMaterials: genericMaterials,
    canRequestConfirmation: false
  };
}

export function isWeakProductName(productName: string) {
  const normalized = productName.trim().toLowerCase();
  if (normalized.length < 4) return true;

  return [
    "parts",
    "part",
    "accessory",
    "accessories",
    "goods",
    "sample",
    "제품",
    "부품",
    "샘플",
    "기타"
  ].includes(normalized);
}
