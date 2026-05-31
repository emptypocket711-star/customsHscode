import { formatHsCode, normalizeHsCode } from "@/lib/hs-code";

export type HsHierarchyNode = {
  code: string;
  label: string;
  level: 2 | 4 | 6 | 10;
};

export const chapterNames: Record<string, string> = {
  "01": "살아 있는 동물",
  "02": "육과 식용 설육",
  "03": "어류ㆍ갑각류ㆍ연체동물 등",
  "04": "낙농품ㆍ새의 알ㆍ천연꿀 등",
  "05": "그 밖의 동물성 생산품",
  "06": "산 수목ㆍ식물ㆍ꽃",
  "07": "식용 채소ㆍ뿌리ㆍ괴경",
  "08": "식용 과실ㆍ견과류",
  "09": "커피ㆍ차ㆍ향신료",
  "10": "곡물",
  "11": "제분공업 생산품",
  "12": "채유용 종자ㆍ공업용 식물",
  "13": "락ㆍ검ㆍ수지ㆍ식물성 수액",
  "14": "식물성 편조물용 재료",
  "15": "동식물성 유지",
  "16": "육류ㆍ어류 조제품",
  "17": "당류와 설탕과자",
  "18": "코코아와 그 조제품",
  "19": "곡물ㆍ분ㆍ전분ㆍ밀크 조제품",
  "20": "채소ㆍ과실 조제품",
  "21": "각종 조제 식료품",
  "22": "음료ㆍ주류ㆍ식초",
  "23": "식품공업 잔재물ㆍ사료",
  "24": "담배와 제조한 담배 대용물",
  "25": "소금ㆍ황ㆍ토석류ㆍ석고ㆍ석회ㆍ시멘트",
  "26": "광석ㆍ슬래그ㆍ회",
  "27": "광물성 연료ㆍ광물유",
  "28": "무기화학품",
  "29": "유기화학품",
  "30": "의료용품",
  "31": "비료",
  "32": "염료ㆍ안료ㆍ페인트",
  "33": "정유와 레지노이드ㆍ조제향료ㆍ화장품",
  "34": "비누ㆍ계면활성제ㆍ왁스",
  "35": "단백질계 물질ㆍ글루ㆍ효소",
  "36": "화약류ㆍ성냥ㆍ발화성 합금",
  "37": "사진용ㆍ영화용 재료",
  "38": "각종 화학공업 생산품",
  "39": "플라스틱과 그 제품",
  "40": "고무와 그 제품",
  "41": "원피ㆍ가죽",
  "42": "가죽제품ㆍ여행용구ㆍ가방",
  "43": "모피와 인조모피",
  "44": "목재와 목재품",
  "45": "코르크와 코르크 제품",
  "46": "짚ㆍ에스파르토 제품",
  "47": "펄프ㆍ폐지",
  "48": "종이와 판지",
  "49": "인쇄서적ㆍ신문ㆍ인쇄물",
  "50": "견",
  "51": "양모ㆍ수모ㆍ마모",
  "52": "면",
  "53": "그 밖의 식물성 방직용 섬유",
  "54": "인조필라멘트",
  "55": "인조스테이플섬유",
  "56": "워딩ㆍ펠트ㆍ부직포",
  "57": "양탄자와 바닥깔개",
  "58": "특수직물ㆍ레이스ㆍ자수포",
  "59": "침투ㆍ도포ㆍ피복 방직용 섬유",
  "60": "메리야스 편물과 뜨개질 편물",
  "61": "의류와 부속품(메리야스ㆍ뜨개질)",
  "62": "의류와 부속품(비메리야스)",
  "63": "그 밖의 섬유제품",
  "64": "신발류",
  "65": "모자류",
  "66": "우산ㆍ지팡이",
  "67": "깃털ㆍ인조꽃ㆍ인모 제품",
  "68": "석ㆍ시멘트ㆍ석면ㆍ운모 제품",
  "69": "도자제품",
  "70": "유리와 유리제품",
  "71": "귀석ㆍ귀금속ㆍ주화",
  "72": "철강",
  "73": "철강 제품",
  "74": "구리와 그 제품",
  "75": "니켈과 그 제품",
  "76": "알루미늄과 그 제품",
  "78": "납과 그 제품",
  "79": "아연과 그 제품",
  "80": "주석과 그 제품",
  "81": "그 밖의 비금속",
  "82": "공구ㆍ칼붙이",
  "83": "각종 비금속 제품",
  "84": "원자로ㆍ보일러ㆍ기계류",
  "85": "전기기기와 그 부분품",
  "86": "철도 차량과 부분품",
  "87": "차량과 부분품",
  "88": "항공기와 우주선",
  "89": "선박과 수상 구조물",
  "90": "광학ㆍ의료ㆍ측정기기",
  "91": "시계",
  "92": "악기",
  "93": "무기ㆍ총포탄",
  "94": "가구ㆍ침구ㆍ조명기구",
  "95": "완구ㆍ운동용구",
  "96": "잡품",
  "97": "예술품ㆍ수집품ㆍ골동품"
};

export function hsChapterName(code: string) {
  const normalized = normalizeHsCode(code);
  const chapter = normalized.slice(0, 2);
  return chapterNames[chapter] ?? (chapter ? `${chapter}류` : "");
}

function cleanedLabel(value?: string | null) {
  return value?.replace(/^-+\s*/, "").trim() || "";
}

export function hsAncestorCodes(value: string) {
  const normalized = normalizeHsCode(value);
  return [
    normalized.slice(0, 2),
    normalized.slice(0, 4),
    normalized.slice(0, 6),
    normalized.slice(0, 8),
    normalized
  ].filter((code, index, array) => code.length >= 2 && array.indexOf(code) === index);
}

export function buildHsHierarchyPath(input: {
  code: string;
  hs6?: string;
  currentLabel?: string | null;
  labels?: Record<string, string | null | undefined>;
}) {
  const normalized = normalizeHsCode(input.code);
  const hs6 = normalizeHsCode(input.hs6 || normalized.slice(0, 6));
  const labels = input.labels ?? {};
  const nodes: HsHierarchyNode[] = [];

  const hs2 = normalized.slice(0, 2);
  if (hs2.length === 2) {
    nodes.push({
      code: hs2,
      label: cleanedLabel(labels[hs2]) || chapterNames[hs2] || `${hs2}류`,
      level: 2
    });
  }

  const hs4 = normalized.slice(0, 4);
  if (hs4.length === 4) {
    nodes.push({
      code: hs4,
      label: cleanedLabel(labels[hs4]) || `${formatHsCode(hs4)} 호`,
      level: 4
    });
  }

  if (hs6.length === 6) {
    nodes.push({
      code: hs6,
      label: cleanedLabel(labels[hs6]) || (normalized.length === 6 ? cleanedLabel(input.currentLabel) : "") || `${formatHsCode(hs6)} 소호`,
      level: 6
    });
  }

  if (normalized.length > 6) {
    nodes.push({
      code: normalized,
      label: cleanedLabel(input.currentLabel) || cleanedLabel(labels[normalized]) || `${formatHsCode(normalized)} 품목`,
      level: 10
    });
  }

  return nodes;
}
