import type { ExportDestinationTariffItem } from "@/server/repositories/export-destination-tariff.repository";

const US_SPECIAL_PROGRAMS: Record<string, string> = {
  AU: "미-호주 FTA",
  BH: "미-바레인 FTA",
  CA: "USMCA(캐나다)",
  CL: "미-칠레 FTA",
  CO: "미-콜롬비아 FTA",
  IL: "미-이스라엘 FTA",
  JO: "미-요르단 FTA",
  KR: "한-미 FTA",
  MA: "미-모로코 FTA",
  MX: "USMCA(멕시코)",
  OM: "미-오만 FTA",
  PA: "미-파나마 FTA",
  PE: "미-페루 FTA",
  SG: "미-싱가포르 FTA"
};

const ORIGIN_COUNTRY_TO_US_SPECIAL_CODE: Record<string, string> = {
  AUS: "AU",
  AU: "AU",
  BHR: "BH",
  BH: "BH",
  CAN: "CA",
  CA: "CA",
  CHL: "CL",
  CL: "CL",
  COL: "CO",
  CO: "CO",
  ISR: "IL",
  IL: "IL",
  JOR: "JO",
  JO: "JO",
  KOR: "KR",
  KR: "KR",
  MAR: "MA",
  MA: "MA",
  MEX: "MX",
  MX: "MX",
  OMN: "OM",
  OM: "OM",
  PAN: "PA",
  PA: "PA",
  PER: "PE",
  PE: "PE",
  SGP: "SG",
  SG: "SG"
};

const JPN_AGREEMENT_LABELS: Record<string, string> = {
  "ASEAN/Australia/New Zealand(RCEP)": "RCEP(ASEAN·호주·뉴질랜드)",
  "China(RCEP)": "RCEP(중국)",
  "Korea(RCEP)": "RCEP(한국)",
  "JP-US Trade Agreement **1": "일-미 무역협정",
  ASEAN: "일-ASEAN EPA",
  Australia: "일-호주 EPA",
  Brunei: "일-브루나이 EPA",
  CPTPP: "CPTPP",
  Chile: "일-칠레 EPA",
  EU: "일-EU EPA",
  India: "일-인도 CEPA",
  Indonesia: "일-인도네시아 EPA",
  Malaysia: "일-말레이시아 EPA",
  Mexico: "일-멕시코 EPA",
  Mongolia: "일-몽골 EPA",
  Peru: "일-페루 EPA",
  Philippines: "일-필리핀 EPA",
  Singapore: "일-싱가포르 EPA",
  Switzerland: "일-스위스 EPA",
  Thailand: "일-태국 EPA",
  UK: "일-영국 EPA",
  "Viet Nam": "일-베트남 EPA"
};

const JPN_ORIGIN_TO_AGREEMENT_KEYS: Record<string, string[]> = {
  AUS: ["Australia", "CPTPP", "ASEAN/Australia/New Zealand(RCEP)"],
  AU: ["Australia", "CPTPP", "ASEAN/Australia/New Zealand(RCEP)"],
  BRN: ["Brunei", "ASEAN", "CPTPP", "ASEAN/Australia/New Zealand(RCEP)"],
  BN: ["Brunei", "ASEAN", "CPTPP", "ASEAN/Australia/New Zealand(RCEP)"],
  CAN: ["CPTPP"],
  CA: ["CPTPP"],
  CHL: ["Chile", "CPTPP"],
  CL: ["Chile", "CPTPP"],
  CHN: ["China(RCEP)"],
  CN: ["China(RCEP)"],
  EU: ["EU"],
  EEC: ["EU"],
  IDN: ["Indonesia", "ASEAN", "ASEAN/Australia/New Zealand(RCEP)"],
  ID: ["Indonesia", "ASEAN", "ASEAN/Australia/New Zealand(RCEP)"],
  IND: ["India"],
  IN: ["India"],
  KOR: ["Korea(RCEP)"],
  KR: ["Korea(RCEP)"],
  MEX: ["Mexico", "CPTPP"],
  MX: ["Mexico", "CPTPP"],
  MMR: ["ASEAN", "ASEAN/Australia/New Zealand(RCEP)"],
  MM: ["ASEAN", "ASEAN/Australia/New Zealand(RCEP)"],
  MNG: ["Mongolia"],
  MN: ["Mongolia"],
  MYS: ["Malaysia", "ASEAN", "CPTPP", "ASEAN/Australia/New Zealand(RCEP)"],
  MY: ["Malaysia", "ASEAN", "CPTPP", "ASEAN/Australia/New Zealand(RCEP)"],
  NZL: ["CPTPP", "ASEAN/Australia/New Zealand(RCEP)"],
  NZ: ["CPTPP", "ASEAN/Australia/New Zealand(RCEP)"],
  PER: ["Peru", "CPTPP"],
  PE: ["Peru", "CPTPP"],
  PHL: ["Philippines", "ASEAN", "ASEAN/Australia/New Zealand(RCEP)"],
  PH: ["Philippines", "ASEAN", "ASEAN/Australia/New Zealand(RCEP)"],
  SGP: ["Singapore", "ASEAN", "CPTPP", "ASEAN/Australia/New Zealand(RCEP)"],
  SG: ["Singapore", "ASEAN", "CPTPP", "ASEAN/Australia/New Zealand(RCEP)"],
  CHE: ["Switzerland"],
  CH: ["Switzerland"],
  THA: ["Thailand", "ASEAN", "ASEAN/Australia/New Zealand(RCEP)"],
  TH: ["Thailand", "ASEAN", "ASEAN/Australia/New Zealand(RCEP)"],
  GBR: ["UK", "CPTPP"],
  GB: ["UK", "CPTPP"],
  USA: ["JP-US Trade Agreement **1"],
  US: ["JP-US Trade Agreement **1"],
  VNM: ["Viet Nam", "ASEAN", "CPTPP", "ASEAN/Australia/New Zealand(RCEP)"],
  VN: ["Viet Nam", "ASEAN", "CPTPP", "ASEAN/Australia/New Zealand(RCEP)"]
};

const UK_AGREEMENT_LABELS: Record<string, string> = {
  "Tariff preference - South Korea": "한-영 FTA",
  "한국협정세율": "한-영 FTA",
  "Tariff preference - CPTPP All Members": "CPTPP",
  "Tariff preference - European Union": "영국-EU TCA",
  "Tariff preference - Japan": "영국-일본 CEPA",
  "Tariff preference - Australia": "영국-호주 FTA",
  "Tariff preference - New Zealand": "영국-뉴질랜드 FTA",
  "Tariff preference - Singapore": "영국-싱가포르 FTA",
  "Tariff preference - Vietnam": "영국-베트남 FTA",
  "Tariff preference - Canada": "영국-캐나다 FTA",
  "Tariff preference - Mexico": "영국-멕시코 FTA",
  "Tariff preference - Chile": "영국-칠레 FTA",
  "Tariff preference - Peru": "영국-페루 FTA",
  "Tariff preference - Colombia": "영국-콜롬비아 FTA",
  "Tariff preference - Turkey": "영국-튀르키예 FTA",
  "Tariff preference - Israel": "영국-이스라엘 FTA",
  "Tariff preference - Norway": "영국-노르웨이 FTA",
  "Tariff preference - Iceland": "영국-아이슬란드 FTA",
  "Tariff preference - Switzerland": "영국-스위스 FTA"
};

const UK_ORIGIN_TO_AGREEMENT_KEYS: Record<string, string[]> = {
  KOR: ["Tariff preference - South Korea", "한국협정세율"],
  KR: ["Tariff preference - South Korea", "한국협정세율"],
  JPN: ["Tariff preference - Japan"],
  JP: ["Tariff preference - Japan"],
  AUS: ["Tariff preference - Australia", "Tariff preference - CPTPP All Members"],
  AU: ["Tariff preference - Australia", "Tariff preference - CPTPP All Members"],
  NZL: ["Tariff preference - New Zealand", "Tariff preference - CPTPP All Members"],
  NZ: ["Tariff preference - New Zealand", "Tariff preference - CPTPP All Members"],
  SGP: ["Tariff preference - Singapore", "Tariff preference - CPTPP All Members"],
  SG: ["Tariff preference - Singapore", "Tariff preference - CPTPP All Members"],
  VNM: ["Tariff preference - Vietnam", "Tariff preference - CPTPP All Members"],
  VN: ["Tariff preference - Vietnam", "Tariff preference - CPTPP All Members"],
  CAN: ["Tariff preference - Canada", "Tariff preference - CPTPP All Members"],
  CA: ["Tariff preference - Canada", "Tariff preference - CPTPP All Members"],
  MEX: ["Tariff preference - Mexico", "Tariff preference - CPTPP All Members"],
  MX: ["Tariff preference - Mexico", "Tariff preference - CPTPP All Members"],
  CHL: ["Tariff preference - Chile"],
  CL: ["Tariff preference - Chile"],
  PER: ["Tariff preference - Peru"],
  PE: ["Tariff preference - Peru"],
  COL: ["Tariff preference - Colombia"],
  CO: ["Tariff preference - Colombia"],
  TUR: ["Tariff preference - Turkey"],
  TR: ["Tariff preference - Turkey"],
  ISR: ["Tariff preference - Israel"],
  IL: ["Tariff preference - Israel"],
  NOR: ["Tariff preference - Norway"],
  NO: ["Tariff preference - Norway"],
  ISL: ["Tariff preference - Iceland"],
  IS: ["Tariff preference - Iceland"],
  CHE: ["Tariff preference - Switzerland"],
  CH: ["Tariff preference - Switzerland"],
  EU: ["Tariff preference - European Union"],
  EEC: ["Tariff preference - European Union"]
};

const AUS_AGREEMENT_LABELS: Record<string, string> = {
  "대한민국\n협정세율": "한-호주 FTA",
  한국협정세율: "한-호주 FTA",
  RCEP: "RCEP"
};

const AUS_ORIGIN_TO_AGREEMENT_KEYS: Record<string, string[]> = {
  KOR: ["대한민국\n협정세율", "한국협정세율", "RCEP"],
  KR: ["대한민국\n협정세율", "한국협정세율", "RCEP"],
  CHN: ["RCEP"],
  CN: ["RCEP"],
  JPN: ["RCEP"],
  JP: ["RCEP"],
  NZL: ["RCEP"],
  NZ: ["RCEP"],
  BRN: ["RCEP"],
  BN: ["RCEP"],
  KHM: ["RCEP"],
  KH: ["RCEP"],
  IDN: ["RCEP"],
  ID: ["RCEP"],
  LAO: ["RCEP"],
  LA: ["RCEP"],
  MYS: ["RCEP"],
  MY: ["RCEP"],
  MMR: ["RCEP"],
  MM: ["RCEP"],
  PHL: ["RCEP"],
  PH: ["RCEP"],
  SGP: ["RCEP"],
  SG: ["RCEP"],
  THA: ["RCEP"],
  TH: ["RCEP"],
  VNM: ["RCEP"],
  VN: ["RCEP"]
};

const CAN_AGREEMENT_LABELS: Record<string, string> = {
  "대한민국\n세율": "한-캐나다 FTA",
  대한민국세율: "한-캐나다 FTA",
  "미국 세율": "CUSMA/USMCA(미국)",
  "멕시코 세율": "CUSMA/USMCA(멕시코)",
  "유럽연합 세율": "캐나다-EU CETA",
  영국세율: "캐나다-영국 TCA",
  "포괄적, 점진적-환태평양경제동반자협정 세율": "CPTPP",
  "칠레 세율": "캐나다-칠레 FTA",
  "페루 세율": "캐나다-페루 FTA",
  "콜롬비아 세율": "캐나다-콜롬비아 FTA",
  "코스타리카 세율": "캐나다-코스타리카 FTA",
  "파나마 세율": "캐나다-파나마 FTA",
  "온두라스 세율": "캐나다-온두라스 FTA",
  "요르단 세율": "캐나다-요르단 FTA",
  "우크라이나 세율": "캐나다-우크라이나 FTA",
  "캐나다-이스라엘\n협정세율": "캐나다-이스라엘 FTA",
  "노르웨이 세율": "캐나다-EFTA(노르웨이)",
  "아이슬랜드 세율": "캐나다-EFTA(아이슬란드)",
  "스위스 \n리히텐슈타인 세율": "캐나다-EFTA(스위스·리히텐슈타인)",
  "일반적\n특혜 세율": "GPT 일반특혜관세",
  "저개발국가\n 세율": "LDCT 저개발국 특혜관세"
};

const CAN_ORIGIN_TO_AGREEMENT_KEYS: Record<string, string[]> = {
  KOR: ["대한민국\n세율", "대한민국세율"],
  KR: ["대한민국\n세율", "대한민국세율"],
  USA: ["미국 세율"],
  US: ["미국 세율"],
  MEX: ["멕시코 세율"],
  MX: ["멕시코 세율"],
  EU: ["유럽연합 세율"],
  EEC: ["유럽연합 세율"],
  GBR: ["영국세율"],
  GB: ["영국세율"],
  CHL: ["칠레 세율", "포괄적, 점진적-환태평양경제동반자협정 세율"],
  CL: ["칠레 세율", "포괄적, 점진적-환태평양경제동반자협정 세율"],
  PER: ["페루 세율", "포괄적, 점진적-환태평양경제동반자협정 세율"],
  PE: ["페루 세율", "포괄적, 점진적-환태평양경제동반자협정 세율"],
  COL: ["콜롬비아 세율"],
  CO: ["콜롬비아 세율"],
  CRI: ["코스타리카 세율"],
  CR: ["코스타리카 세율"],
  PAN: ["파나마 세율"],
  PA: ["파나마 세율"],
  HND: ["온두라스 세율"],
  HN: ["온두라스 세율"],
  JOR: ["요르단 세율"],
  JO: ["요르단 세율"],
  UKR: ["우크라이나 세율"],
  UA: ["우크라이나 세율"],
  ISR: ["캐나다-이스라엘\n협정세율"],
  IL: ["캐나다-이스라엘\n협정세율"],
  NOR: ["노르웨이 세율"],
  NO: ["노르웨이 세율"],
  ISL: ["아이슬랜드 세율"],
  IS: ["아이슬랜드 세율"],
  CHE: ["스위스 \n리히텐슈타인 세율"],
  CH: ["스위스 \n리히텐슈타인 세율"],
  LIE: ["스위스 \n리히텐슈타인 세율"],
  LI: ["스위스 \n리히텐슈타인 세율"],
  JPN: ["포괄적, 점진적-환태평양경제동반자협정 세율"],
  JP: ["포괄적, 점진적-환태평양경제동반자협정 세율"],
  AUS: ["포괄적, 점진적-환태평양경제동반자협정 세율"],
  AU: ["포괄적, 점진적-환태평양경제동반자협정 세율"],
  NZL: ["포괄적, 점진적-환태평양경제동반자협정 세율"],
  NZ: ["포괄적, 점진적-환태평양경제동반자협정 세율"],
  SGP: ["포괄적, 점진적-환태평양경제동반자협정 세율"],
  SG: ["포괄적, 점진적-환태평양경제동반자협정 세율"],
  VNM: ["포괄적, 점진적-환태평양경제동반자협정 세율"],
  VN: ["포괄적, 점진적-환태평양경제동반자협정 세율"],
  MYS: ["포괄적, 점진적-환태평양경제동반자협정 세율"],
  MY: ["포괄적, 점진적-환태평양경제동반자협정 세율"],
  BRN: ["포괄적, 점진적-환태평양경제동반자협정 세율"],
  BN: ["포괄적, 점진적-환태평양경제동반자협정 세율"]
};

const IND_AGREEMENT_LABELS: Record<string, string> = {
  "인도-대한민국 \n협정세율": "한-인도 CEPA",
  "인도-대한민국\n협정세율": "한-인도 CEPA",
  "인도-대한민국 협정세율": "한-인도 CEPA",
  한국협정세율: "한-인도 CEPA"
};

const IND_ORIGIN_TO_AGREEMENT_KEYS: Record<string, string[]> = {
  KOR: ["인도-대한민국 \n협정세율", "인도-대한민국\n협정세율", "인도-대한민국 협정세율", "한국협정세율"],
  KR: ["인도-대한민국 \n협정세율", "인도-대한민국\n협정세율", "인도-대한민국 협정세율", "한국협정세율"]
};

const VNM_AGREEMENT_LABELS: Record<string, string> = {
  "Normal Import": "일반관세",
  "MFN\n특혜세율": "MFN 세율",
  "VKFTA\n베트남-대한민국": "한-베트남 FTA",
  "AKFTA\n아세안-대한민국": "한-아세안 FTA",
  "RCEP_KOR\nRECP-대한민국": "RCEP(한국)",
  "ATIGA\n아세안": "ATIGA(아세안)",
  "RCEP_ASEAN\nRECP-아세안": "RCEP(아세안)",
  "ACFTA\n아세안-중국": "아세안-중국 FTA",
  "RCEP_CHN\nRECP-중국": "RCEP(중국)",
  "AIFTA\n아세안-인도": "아세안-인도 FTA",
  "AJCEP\n아세안-일본": "아세안-일본 EPA",
  "VJEPA\n베트남-일본": "베트남-일본 EPA",
  "RCEP_JPN\nRECP-일본": "RCEP(일본)",
  "AANZFTA\n아세안-호주, 뉴질랜드": "아세안-호주·뉴질랜드 FTA",
  "RCEP_AUS\nRECP-호주": "RCEP(호주)",
  "RCEP_NZL\nRECP-뉴질랜드": "RCEP(뉴질랜드)",
  "VCFTA\n베트남-칠레": "베트남-칠레 FTA"
};

const VNM_ORIGIN_TO_AGREEMENT_KEYS: Record<string, string[]> = {
  KOR: ["VKFTA\n베트남-대한민국", "AKFTA\n아세안-대한민국", "RCEP_KOR\nRECP-대한민국"],
  KR: ["VKFTA\n베트남-대한민국", "AKFTA\n아세안-대한민국", "RCEP_KOR\nRECP-대한민국"],
  CHN: ["ACFTA\n아세안-중국", "RCEP_CHN\nRECP-중국"],
  CN: ["ACFTA\n아세안-중국", "RCEP_CHN\nRECP-중국"],
  JPN: ["VJEPA\n베트남-일본", "AJCEP\n아세안-일본", "RCEP_JPN\nRECP-일본"],
  JP: ["VJEPA\n베트남-일본", "AJCEP\n아세안-일본", "RCEP_JPN\nRECP-일본"],
  AUS: ["AANZFTA\n아세안-호주, 뉴질랜드", "RCEP_AUS\nRECP-호주"],
  AU: ["AANZFTA\n아세안-호주, 뉴질랜드", "RCEP_AUS\nRECP-호주"],
  NZL: ["AANZFTA\n아세안-호주, 뉴질랜드", "RCEP_NZL\nRECP-뉴질랜드"],
  NZ: ["AANZFTA\n아세안-호주, 뉴질랜드", "RCEP_NZL\nRECP-뉴질랜드"],
  IND: ["AIFTA\n아세안-인도"],
  IN: ["AIFTA\n아세안-인도"],
  CHL: ["VCFTA\n베트남-칠레"],
  CL: ["VCFTA\n베트남-칠레"],
  BRN: ["ATIGA\n아세안", "RCEP_ASEAN\nRECP-아세안"],
  BN: ["ATIGA\n아세안", "RCEP_ASEAN\nRECP-아세안"],
  KHM: ["ATIGA\n아세안", "RCEP_ASEAN\nRECP-아세안"],
  KH: ["ATIGA\n아세안", "RCEP_ASEAN\nRECP-아세안"],
  IDN: ["ATIGA\n아세안", "RCEP_ASEAN\nRECP-아세안"],
  ID: ["ATIGA\n아세안", "RCEP_ASEAN\nRECP-아세안"],
  LAO: ["ATIGA\n아세안", "RCEP_ASEAN\nRECP-아세안"],
  LA: ["ATIGA\n아세안", "RCEP_ASEAN\nRECP-아세안"],
  MYS: ["ATIGA\n아세안", "RCEP_ASEAN\nRECP-아세안"],
  MY: ["ATIGA\n아세안", "RCEP_ASEAN\nRECP-아세안"],
  MMR: ["ATIGA\n아세안", "RCEP_ASEAN\nRECP-아세안"],
  MM: ["ATIGA\n아세안", "RCEP_ASEAN\nRECP-아세안"],
  PHL: ["ATIGA\n아세안", "RCEP_ASEAN\nRECP-아세안"],
  PH: ["ATIGA\n아세안", "RCEP_ASEAN\nRECP-아세안"],
  SGP: ["ATIGA\n아세안", "RCEP_ASEAN\nRECP-아세안"],
  SG: ["ATIGA\n아세안", "RCEP_ASEAN\nRECP-아세안"],
  THA: ["ATIGA\n아세안", "RCEP_ASEAN\nRECP-아세안"],
  TH: ["ATIGA\n아세안", "RCEP_ASEAN\nRECP-아세안"]
};

const THA_AGREEMENT_LABELS: Record<string, string> = {
  "아세안-한국\n협정세율": "한-아세안 FTA",
  RECP: "RCEP",
  상한세율: "상한세율"
};

const THA_ORIGIN_TO_AGREEMENT_KEYS: Record<string, string[]> = {
  KOR: ["아세안-한국\n협정세율", "RECP"],
  KR: ["아세안-한국\n협정세율", "RECP"],
  CHN: ["RECP"],
  CN: ["RECP"],
  JPN: ["RECP"],
  JP: ["RECP"],
  AUS: ["RECP"],
  AU: ["RECP"],
  NZL: ["RECP"],
  NZ: ["RECP"],
  BRN: ["RECP"],
  BN: ["RECP"],
  KHM: ["RECP"],
  KH: ["RECP"],
  IDN: ["RECP"],
  ID: ["RECP"],
  LAO: ["RECP"],
  LA: ["RECP"],
  MYS: ["RECP"],
  MY: ["RECP"],
  MMR: ["RECP"],
  MM: ["RECP"],
  PHL: ["RECP"],
  PH: ["RECP"],
  SGP: ["RECP"],
  SG: ["RECP"],
  VNM: ["RECP"],
  VN: ["RECP"]
};

const LAO_AGREEMENT_LABELS: Record<string, string> = {
  협정세율: "한-아세안 FTA",
  RCEP: "RCEP(한국)",
  APTA: "아·태무역협정(APTA)"
};

const LAO_ORIGIN_TO_AGREEMENT_KEYS: Record<string, string[]> = {
  KOR: ["협정세율", "RCEP", "APTA"],
  KR: ["협정세율", "RCEP", "APTA"],
  CHN: ["RCEP", "APTA"],
  CN: ["RCEP", "APTA"],
  IND: ["APTA"],
  IN: ["APTA"],
  BGD: ["APTA"],
  BD: ["APTA"],
  LKA: ["APTA"],
  LK: ["APTA"],
  JPN: ["RCEP"],
  JP: ["RCEP"],
  AUS: ["RCEP"],
  AU: ["RCEP"],
  NZL: ["RCEP"],
  NZ: ["RCEP"],
  BRN: ["RCEP"],
  BN: ["RCEP"],
  KHM: ["RCEP"],
  KH: ["RCEP"],
  IDN: ["RCEP"],
  ID: ["RCEP"],
  MYS: ["RCEP"],
  MY: ["RCEP"],
  MMR: ["RCEP"],
  MM: ["RCEP"],
  PHL: ["RCEP"],
  PH: ["RCEP"],
  SGP: ["RCEP"],
  SG: ["RCEP"],
  THA: ["RCEP"],
  TH: ["RCEP"],
  VNM: ["RCEP"],
  VN: ["RCEP"]
};

const MYS_TAX_RATE_KEYS = new Set(["부가세율", "소비세율", "수출세율", "과세 1", "과세 2", "과세 3", "관세할당"]);

const MYS_AGREEMENT_LABELS: Record<string, string> = {
  AKFTA: "한-아세안 FTA",
  RCEP: "RCEP(한국)",
  ATIGA: "ATIGA(아세안)"
};

const MYS_ORIGIN_TO_AGREEMENT_KEYS: Record<string, string[]> = {
  KOR: ["AKFTA", "RCEP"],
  KR: ["AKFTA", "RCEP"],
  CHN: ["RCEP"],
  CN: ["RCEP"],
  JPN: ["RCEP"],
  JP: ["RCEP"],
  AUS: ["RCEP"],
  AU: ["RCEP"],
  NZL: ["RCEP"],
  NZ: ["RCEP"],
  BRN: ["ATIGA", "RCEP"],
  BN: ["ATIGA", "RCEP"],
  KHM: ["ATIGA", "RCEP"],
  KH: ["ATIGA", "RCEP"],
  IDN: ["ATIGA", "RCEP"],
  ID: ["ATIGA", "RCEP"],
  LAO: ["ATIGA", "RCEP"],
  LA: ["ATIGA", "RCEP"],
  MMR: ["ATIGA", "RCEP"],
  MM: ["ATIGA", "RCEP"],
  PHL: ["ATIGA", "RCEP"],
  PH: ["ATIGA", "RCEP"],
  SGP: ["ATIGA", "RCEP"],
  SG: ["ATIGA", "RCEP"],
  THA: ["ATIGA", "RCEP"],
  TH: ["ATIGA", "RCEP"],
  VNM: ["ATIGA", "RCEP"],
  VN: ["ATIGA", "RCEP"]
};

const PHL_MFN_RATE_KEY = "최혜국\nMFN";

const PHL_AGREEMENT_LABELS: Record<string, string> = {
  "Korea-Philippines FTA": "한-필리핀 FTA",
  "한-아세안 무역협정\nAKFTA": "한-아세안 FTA",
  "RCEP 협정세율\nRCEP KOREA": "RCEP(한국)",
  "아세안 무역협정\nATIGA": "ATIGA(아세안)"
};

const PHL_ORIGIN_TO_AGREEMENT_KEYS: Record<string, string[]> = {
  KOR: ["Korea-Philippines FTA", "한-아세안 무역협정\nAKFTA", "RCEP 협정세율\nRCEP KOREA"],
  KR: ["Korea-Philippines FTA", "한-아세안 무역협정\nAKFTA", "RCEP 협정세율\nRCEP KOREA"],
  CHN: ["RCEP 협정세율\nRCEP KOREA"],
  CN: ["RCEP 협정세율\nRCEP KOREA"],
  JPN: ["RCEP 협정세율\nRCEP KOREA"],
  JP: ["RCEP 협정세율\nRCEP KOREA"],
  AUS: ["RCEP 협정세율\nRCEP KOREA"],
  AU: ["RCEP 협정세율\nRCEP KOREA"],
  NZL: ["RCEP 협정세율\nRCEP KOREA"],
  NZ: ["RCEP 협정세율\nRCEP KOREA"],
  BRN: ["아세안 무역협정\nATIGA", "RCEP 협정세율\nRCEP KOREA"],
  BN: ["아세안 무역협정\nATIGA", "RCEP 협정세율\nRCEP KOREA"],
  KHM: ["아세안 무역협정\nATIGA", "RCEP 협정세율\nRCEP KOREA"],
  KH: ["아세안 무역협정\nATIGA", "RCEP 협정세율\nRCEP KOREA"],
  IDN: ["아세안 무역협정\nATIGA", "RCEP 협정세율\nRCEP KOREA"],
  ID: ["아세안 무역협정\nATIGA", "RCEP 협정세율\nRCEP KOREA"],
  LAO: ["아세안 무역협정\nATIGA", "RCEP 협정세율\nRCEP KOREA"],
  LA: ["아세안 무역협정\nATIGA", "RCEP 협정세율\nRCEP KOREA"],
  MYS: ["아세안 무역협정\nATIGA", "RCEP 협정세율\nRCEP KOREA"],
  MY: ["아세안 무역협정\nATIGA", "RCEP 협정세율\nRCEP KOREA"],
  MMR: ["아세안 무역협정\nATIGA", "RCEP 협정세율\nRCEP KOREA"],
  MM: ["아세안 무역협정\nATIGA", "RCEP 협정세율\nRCEP KOREA"],
  SGP: ["아세안 무역협정\nATIGA", "RCEP 협정세율\nRCEP KOREA"],
  SG: ["아세안 무역협정\nATIGA", "RCEP 협정세율\nRCEP KOREA"],
  THA: ["아세안 무역협정\nATIGA", "RCEP 협정세율\nRCEP KOREA"],
  TH: ["아세안 무역협정\nATIGA", "RCEP 협정세율\nRCEP KOREA"],
  VNM: ["아세안 무역협정\nATIGA", "RCEP 협정세율\nRCEP KOREA"],
  VN: ["아세안 무역협정\nATIGA", "RCEP 협정세율\nRCEP KOREA"]
};

const SGP_AGREEMENT_LABELS: Record<string, string> = {
  "한-싱가포르\n협정세율": "한-싱가포르 FTA",
  특혜세율: "특혜세율"
};

const SGP_ORIGIN_TO_AGREEMENT_KEYS: Record<string, string[]> = {
  KOR: ["한-싱가포르\n협정세율"],
  KR: ["한-싱가포르\n협정세율"]
};

const CAM_TAX_RATE_KEYS = new Set(["부가세", "특별세"]);

const CAM_AGREEMENT_LABELS: Record<string, string> = {
  "한-캄보디아 FTA": "한-캄보디아 FTA",
  AKFTA: "한-아세안 FTA",
  RCEP: "RCEP(한국)"
};

const CAM_ORIGIN_TO_AGREEMENT_KEYS: Record<string, string[]> = {
  KOR: ["한-캄보디아 FTA", "AKFTA", "RCEP"],
  KR: ["한-캄보디아 FTA", "AKFTA", "RCEP"],
  CHN: ["RCEP"],
  CN: ["RCEP"],
  JPN: ["RCEP"],
  JP: ["RCEP"],
  AUS: ["RCEP"],
  AU: ["RCEP"],
  NZL: ["RCEP"],
  NZ: ["RCEP"],
  BRN: ["RCEP"],
  BN: ["RCEP"],
  IDN: ["RCEP"],
  ID: ["RCEP"],
  LAO: ["RCEP"],
  LA: ["RCEP"],
  MYS: ["RCEP"],
  MY: ["RCEP"],
  MMR: ["RCEP"],
  MM: ["RCEP"],
  PHL: ["RCEP"],
  PH: ["RCEP"],
  SGP: ["RCEP"],
  SG: ["RCEP"],
  THA: ["RCEP"],
  TH: ["RCEP"],
  VNM: ["RCEP"],
  VN: ["RCEP"]
};

const MYA_AGREEMENT_LABELS: Record<string, string> = {
  협정세율: "한-아세안 FTA"
};

const MYA_ORIGIN_TO_AGREEMENT_KEYS: Record<string, string[]> = {
  KOR: ["협정세율"],
  KR: ["협정세율"]
};

const BRU_AGREEMENT_LABELS: Record<string, string> = {
  협정세율: "한-아세안 FTA",
  RCEP: "RCEP(한국)"
};

const BRU_ORIGIN_TO_AGREEMENT_KEYS: Record<string, string[]> = {
  KOR: ["협정세율", "RCEP"],
  KR: ["협정세율", "RCEP"],
  CHN: ["RCEP"],
  CN: ["RCEP"],
  JPN: ["RCEP"],
  JP: ["RCEP"],
  AUS: ["RCEP"],
  AU: ["RCEP"],
  NZL: ["RCEP"],
  NZ: ["RCEP"],
  KHM: ["RCEP"],
  KH: ["RCEP"],
  IDN: ["RCEP"],
  ID: ["RCEP"],
  LAO: ["RCEP"],
  LA: ["RCEP"],
  MYS: ["RCEP"],
  MY: ["RCEP"],
  MMR: ["RCEP"],
  MM: ["RCEP"],
  PHL: ["RCEP"],
  PH: ["RCEP"],
  SGP: ["RCEP"],
  SG: ["RCEP"],
  THA: ["RCEP"],
  TH: ["RCEP"],
  VNM: ["RCEP"],
  VN: ["RCEP"]
};

const NZL_AGREEMENT_LABELS: Record<string, string> = {
  "KNZFTA\n한국-뉴질랜드 FTA": "한-뉴질랜드 FTA",
  RCEP: "RCEP(한국)"
};

const NZL_ORIGIN_TO_AGREEMENT_KEYS: Record<string, string[]> = {
  KOR: ["KNZFTA\n한국-뉴질랜드 FTA", "RCEP"],
  KR: ["KNZFTA\n한국-뉴질랜드 FTA", "RCEP"],
  CHN: ["RCEP"],
  CN: ["RCEP"],
  JPN: ["RCEP"],
  JP: ["RCEP"],
  AUS: ["RCEP"],
  AU: ["RCEP"],
  BRN: ["RCEP"],
  BN: ["RCEP"],
  KHM: ["RCEP"],
  KH: ["RCEP"],
  IDN: ["RCEP"],
  ID: ["RCEP"],
  LAO: ["RCEP"],
  LA: ["RCEP"],
  MYS: ["RCEP"],
  MY: ["RCEP"],
  MMR: ["RCEP"],
  MM: ["RCEP"],
  PHL: ["RCEP"],
  PH: ["RCEP"],
  SGP: ["RCEP"],
  SG: ["RCEP"],
  THA: ["RCEP"],
  TH: ["RCEP"],
  VNM: ["RCEP"],
  VN: ["RCEP"]
};

const TWN_COLUMN_I_RATE_KEY = "Column I - WTO 국가 및 대만과 상호관계를\n 체결한 국가 또는 지역의 관세율";
const TWN_COLUMN_II_RATE_KEY = "Column II - 자유무역협정 체결 국가, \n저개발/개발도상 국가 또는 지역의 관세율";

const TWN_COLUMN_II_COUNTRY_LABELS: Record<string, string> = {
  GT: "대만-과테말라 FTA",
  HN: "대만-온두라스 FTA",
  MH: "대만 특혜관세(마셜제도)",
  NI: "대만-니카라과 FTA",
  NZ: "대만-뉴질랜드 경제협력협정",
  PA: "대만-파나마 FTA",
  PY: "대만-파라과이 경제협력협정",
  SG: "대만-싱가포르 경제동반자협정",
  SV: "대만-엘살바도르 FTA"
};

const ORIGIN_COUNTRY_TO_TWN_COLUMN_II_CODE: Record<string, string> = {
  GTM: "GT",
  GT: "GT",
  HND: "HN",
  HN: "HN",
  MHL: "MH",
  MH: "MH",
  NIC: "NI",
  NI: "NI",
  NZL: "NZ",
  NZ: "NZ",
  PAN: "PA",
  PA: "PA",
  PRY: "PY",
  PY: "PY",
  SGP: "SG",
  SG: "SG",
  SLV: "SV",
  SV: "SV"
};

const TUR_BASE_RATE_KEYS: Array<[string, string]> = [
  ["Industrial Products(format2)", "공산품"],
  ["Industrial Products(format1)", "공산품"],
  ["Processed Agricultural Products", "가공농산물"],
  ["Agricultural Products", "농산물"],
  ["Fish and Fishery Products", "수산물"]
];

const ZAF_AGREEMENT_LABELS: Record<string, string> = {
  "EU/UK(유럽/영국)": "남아공-EU/영국 특혜세율",
  "EFTA(유럽자유무역연합)": "남아공-EFTA 특혜세율",
  "SADC(남아프리카 개발 공동체)": "SADC 특혜세율",
  "AfCFTA(아프리카대륙 자유무역지대)": "AfCFTA 특혜세율",
  "MERCOSUR(메르코수르 남미 공동 시장)": "남아공-MERCOSUR 특혜세율"
};

const ZAF_AGREEMENT_ORIGINS: Record<string, Set<string>> = {
  "EU/UK(유럽/영국)": new Set(["EEC", "EU", "GBR", "GB", "DEU", "DE", "FRA", "FR", "ITA", "IT", "ESP", "ES", "NLD", "NL"]),
  "EFTA(유럽자유무역연합)": new Set(["CHE", "CH", "ISL", "IS", "LIE", "LI", "NOR", "NO"]),
  "SADC(남아프리카 개발 공동체)": new Set(["AGO", "AO", "BWA", "BW", "COM", "KM", "COD", "CD", "LSO", "LS", "MDG", "MG", "MWI", "MW", "MUS", "MU", "MOZ", "MZ", "NAM", "NA", "SYC", "SC", "SWZ", "SZ", "TZA", "TZ", "ZMB", "ZM", "ZWE", "ZW"]),
  "AfCFTA(아프리카대륙 자유무역지대)": new Set(["DZA", "DZ", "AGO", "AO", "BWA", "BW", "CMR", "CM", "EGY", "EG", "ETH", "ET", "GHA", "GH", "KEN", "KE", "MAR", "MA", "MUS", "MU", "MOZ", "MZ", "NAM", "NA", "NGA", "NG", "RWA", "RW", "TZA", "TZ", "UGA", "UG", "ZMB", "ZM", "ZWE", "ZW"]),
  "MERCOSUR(메르코수르 남미 공동 시장)": new Set(["ARG", "AR", "BRA", "BR", "PRY", "PY", "URY", "UY"])
};

const APTA_ORIGIN_CODES = new Set(["BGD", "BD", "CHN", "CN", "IND", "IN", "KOR", "KR", "LAO", "LA", "LKA", "LK", "MNG", "MN"]);

const IDN_BASE_RATE_KEY = "기본세율\nImport Duty";

const IDN_AGREEMENT_LABELS: Record<string, string> = {
  "아세안 무역협정\nATIGA": "ATIGA(아세안)",
  "RCEP협정세율-대한민국\nRCEP_KOREA": "RCEP(한국)",
  "아세안-한국 협정세율\nAKFTA Import Duty": "한-아세안 FTA",
  "한-인도네시아-포괄적경제동반자협정\nCEPA": "한-인도네시아 CEPA"
};

const IDN_ORIGIN_TO_AGREEMENT_KEYS: Record<string, string[]> = {
  KOR: [
    "한-인도네시아-포괄적경제동반자협정\nCEPA",
    "아세안-한국 협정세율\nAKFTA Import Duty",
    "RCEP협정세율-대한민국\nRCEP_KOREA"
  ],
  KR: [
    "한-인도네시아-포괄적경제동반자협정\nCEPA",
    "아세안-한국 협정세율\nAKFTA Import Duty",
    "RCEP협정세율-대한민국\nRCEP_KOREA"
  ],
  BRN: ["아세안 무역협정\nATIGA"],
  BN: ["아세안 무역협정\nATIGA"],
  KHM: ["아세안 무역협정\nATIGA"],
  KH: ["아세안 무역협정\nATIGA"],
  LAO: ["아세안 무역협정\nATIGA"],
  LA: ["아세안 무역협정\nATIGA"],
  MYS: ["아세안 무역협정\nATIGA"],
  MY: ["아세안 무역협정\nATIGA"],
  MMR: ["아세안 무역협정\nATIGA"],
  MM: ["아세안 무역협정\nATIGA"],
  PHL: ["아세안 무역협정\nATIGA"],
  PH: ["아세안 무역협정\nATIGA"],
  SGP: ["아세안 무역협정\nATIGA"],
  SG: ["아세안 무역협정\nATIGA"],
  THA: ["아세안 무역협정\nATIGA"],
  TH: ["아세안 무역협정\nATIGA"],
  VNM: ["아세안 무역협정\nATIGA"],
  VN: ["아세안 무역협정\nATIGA"]
};

export type DestinationAgreementRateDisplayItem = {
  label: string;
  rateText: string;
  targetSummary: string;
  conditionSummary: string;
  sourceKey: string;
};

export function agreementRateText(agreementRates: Record<string, string>) {
  const entries = Object.entries(agreementRates);

  if (!entries.length) return "-";

  return entries.map(([name, rate]) => `${name}: ${rate}`).join(" / ");
}

export function isDestinationAdditionalTariff(name: string) {
  return name.includes("추가관세") || name.includes("Chapter 99");
}

export function isDestinationDisplayAgreement(name: string) {
  if (isDestinationAdditionalTariff(name)) return false;
  if (name === "미국 HTS 주석") return false;
  if (name === "Column 2 duty") return false;
  if (name.startsWith("Non preferential duty")) return false;
  return true;
}

export function destinationDisplayBaseRate(row: ExportDestinationTariffItem) {
  const mfnRate = row.agreementRates["최혜국"];
  if (mfnRate) return `최혜국 ${mfnRate}`;

  const euThirdCountryDuty = row.countryCode === "EEC" ? row.agreementRates["ERGA OMNES"] : null;
  if (euThirdCountryDuty) return euThirdCountryDuty;

  if (row.countryCode === "GBR") {
    const nonPreferentialRate = Object.entries(row.agreementRates)
      .find(([name]) => name.startsWith("Non preferential duty"))?.[1];
    if (nonPreferentialRate) return nonPreferentialRate;
  }

  if (row.countryCode === "VNM" || row.countryCode === "VN") {
    const mfnRate = row.agreementRates["MFN\n특혜세율"];
    const normalRate = row.agreementRates["Normal Import"];
    if (mfnRate) return `MFN ${mfnRate}`;
    if (normalRate) return `일반관세 ${normalRate}`;
  }

  if (row.countryCode === "IDN" || row.countryCode === "ID") {
    const importDuty = row.agreementRates[IDN_BASE_RATE_KEY];
    if (importDuty) return importDuty;
  }

  if (row.countryCode === "PHL" || row.countryCode === "PH") {
    const mfnRate = row.agreementRates[PHL_MFN_RATE_KEY];
    if (mfnRate) return `MFN ${mfnRate}`;
  }

  if (row.countryCode === "TWN" || row.countryCode === "TW") {
    const columnIRate = row.agreementRates[TWN_COLUMN_I_RATE_KEY];
    if (columnIRate) return `WTO/상호관계국 ${columnIRate}`;
  }

  if (row.countryCode === "TUR" || row.countryCode === "TR") {
    const baseRate = TUR_BASE_RATE_KEYS
      .map(([key, label]) => {
        const rate = row.agreementRates[key];
        return rate ? `${label} ${friendlyDestinationRateText(rate)}%` : null;
      })
      .find(Boolean);
    if (baseRate) return baseRate;
  }

  const baseRate = row.baseRateText?.trim();
  return baseRate || "-";
}

function friendlyDestinationRateText(rateText: string) {
  const normalized = rateText.trim();
  if (normalized.toLowerCase() === "exempted") return "면제";
  return normalized || "-";
}

function originCountryToUsSpecialCode(originCountry?: string) {
  const normalized = originCountry?.trim().toUpperCase();

  return normalized ? ORIGIN_COUNTRY_TO_US_SPECIAL_CODE[normalized] ?? null : null;
}

export function parseUsSpecialRateClauses(specialRateText: string) {
  const clauses: Array<{ rateText: string; codes: string[] }> = [];
  const clausePattern = /([^;]+?)\s*\(([^)]*)\)/g;
  let match: RegExpExecArray | null;

  while ((match = clausePattern.exec(specialRateText)) !== null) {
    const rateText = match[1]?.trim();
    const codes = (match[2] ?? "")
      .split(",")
      .map((value) => value.trim().replace(/\*/g, "").toUpperCase())
      .filter(Boolean);

    if (rateText && codes.length) {
      clauses.push({ rateText, codes });
    }
  }

  return clauses;
}

export function extractUsSpecialRateForCode(specialRateText: string, code: string) {
  const targetCode = code.toUpperCase();

  for (const clause of parseUsSpecialRateClauses(specialRateText)) {
    if (clause.codes.includes(targetCode)) {
      return clause.rateText;
    }
  }

  return null;
}

export function summarizeUsSpecialRates(specialRateText: string) {
  const summaries = parseUsSpecialRateClauses(specialRateText).map((clause) => {
    const labels = clause.codes
      .map((code) => US_SPECIAL_PROGRAMS[code])
      .filter(Boolean);

    if (!labels.length) return null;

    const visibleLabels = labels.slice(0, 4).join(", ");
    const extraCount = labels.length - 4;

    return `${clause.rateText} (${visibleLabels}${extraCount > 0 ? ` 외 ${extraCount}개` : ""})`;
  }).filter(Boolean);

  return summaries.length ? `특혜세율 ${summaries.join(" / ")}` : "특혜세율 있음";
}

function usSpecialRateItems(specialRateText: string, originCountry?: string): DestinationAgreementRateDisplayItem[] {
  const specialCode = originCountryToUsSpecialCode(originCountry);
  if (specialCode) {
    const rate = extractUsSpecialRateForCode(specialRateText, specialCode);
    const programLabel = US_SPECIAL_PROGRAMS[specialCode] ?? `${specialCode} 특혜`;

    return rate
      ? [{
          label: programLabel,
          rateText: rate,
          targetSummary: `${programLabel} 대상 원산지`,
          conditionSummary: "해당 특혜세율은 미국 HTS Special 컬럼의 원산지·프로그램 코드와 원산지 요건을 함께 확인해 적용을 검토합니다.",
          sourceKey: specialCode
        }]
      : [];
  }

  if (originCountry && originCountry !== "ALL") return [];

  return parseUsSpecialRateClauses(specialRateText).map((clause, index) => {
    const labels = clause.codes
      .map((code) => US_SPECIAL_PROGRAMS[code])
      .filter(Boolean);
    const targetSummary = labels.length ? labels.join(", ") : "미국 HTS Special 코드 대상";

    return {
      label: "특혜세율",
      rateText: clause.rateText,
      targetSummary,
      conditionSummary: "원산지를 선택하면 해당 원산지와 연결된 특혜세율만 좁혀 표시합니다. 실제 적용은 각 협정·프로그램의 원산지 요건과 증빙요건을 함께 확인합니다.",
      sourceKey: `us-special-${index}`
    };
  });
}

function japanAgreementRateItems(row: ExportDestinationTariffItem, originCountry?: string): DestinationAgreementRateDisplayItem[] {
  const normalized = originCountry?.trim().toUpperCase();
  const agreementKeys = normalized && normalized !== "ALL"
    ? JPN_ORIGIN_TO_AGREEMENT_KEYS[normalized] ?? []
    : Object.keys(row.agreementRates).filter((name) => isDestinationDisplayAgreement(name));

  return agreementKeys
    .filter((key, index, keys) => keys.indexOf(key) === index)
    .map((key) => {
      const rate = row.agreementRates[key];
      if (!rate) return null;

      const label = JPN_AGREEMENT_LABELS[key] ?? key;
      return {
        label,
        rateText: rate,
        targetSummary: normalized && normalized !== "ALL" ? `${label} 대상 원산지` : "일본 세율표의 협정·특혜세율 항목",
        conditionSummary: "일본 수입 시 해당 협정·특혜세율 후보입니다. 원산지 기준, 직접운송, 원산지증명 또는 신고 요건을 함께 확인합니다.",
        sourceKey: `jpn-${key}`
      };
    })
    .filter((item): item is DestinationAgreementRateDisplayItem => Boolean(item));
}

function ukAgreementRateItems(row: ExportDestinationTariffItem, originCountry?: string): DestinationAgreementRateDisplayItem[] {
  const normalized = originCountry?.trim().toUpperCase();
  const agreementKeys = normalized && normalized !== "ALL"
    ? UK_ORIGIN_TO_AGREEMENT_KEYS[normalized] ?? []
    : Object.keys(row.agreementRates).filter((name) => name.startsWith("Tariff preference -") || name === "한국협정세율");

  return agreementKeys
    .filter((key, index, keys) => keys.indexOf(key) === index)
    .map((key) => {
      const rate = row.agreementRates[key];
      if (!rate) return null;

      const label = UK_AGREEMENT_LABELS[key] ?? key.replace(/^Tariff preference - /, "영국 특혜관세 ");
      return {
        label,
        rateText: rate,
        targetSummary: normalized && normalized !== "ALL" ? `${label} 대상 원산지` : "영국 세율표의 협정·특혜세율 항목",
        conditionSummary: "영국 수입 시 해당 협정·특혜세율 후보입니다. 원산지 기준, 직접운송, 원산지증명 또는 신고 요건을 함께 확인합니다.",
        sourceKey: `gbr-${key}`
      };
    })
    .filter((item): item is DestinationAgreementRateDisplayItem => Boolean(item));
}

function australiaAgreementRateItems(row: ExportDestinationTariffItem, originCountry?: string): DestinationAgreementRateDisplayItem[] {
  const normalized = originCountry?.trim().toUpperCase();
  const agreementKeys = normalized && normalized !== "ALL"
    ? AUS_ORIGIN_TO_AGREEMENT_KEYS[normalized] ?? []
    : Object.keys(row.agreementRates).filter((name) => isDestinationDisplayAgreement(name));

  return agreementKeys
    .filter((key, index, keys) => keys.indexOf(key) === index)
    .map((key) => {
      const rate = row.agreementRates[key];
      if (!rate) return null;

      const label = AUS_AGREEMENT_LABELS[key] ?? key;
      return {
        label,
        rateText: rate,
        targetSummary: normalized && normalized !== "ALL" ? `${label} 대상 원산지` : "호주 세율표의 협정·특혜세율 항목",
        conditionSummary: "호주 수입 시 해당 협정·특혜세율 후보입니다. 원산지 기준, 직접운송, 원산지증명 또는 신고 요건을 함께 확인합니다.",
        sourceKey: `aus-${key}`
      };
    })
    .filter((item): item is DestinationAgreementRateDisplayItem => Boolean(item));
}

function canadaAgreementRateItems(row: ExportDestinationTariffItem, originCountry?: string): DestinationAgreementRateDisplayItem[] {
  const normalized = originCountry?.trim().toUpperCase();
  const agreementKeys = normalized && normalized !== "ALL"
    ? CAN_ORIGIN_TO_AGREEMENT_KEYS[normalized] ?? []
    : Object.keys(row.agreementRates).filter((name) => isDestinationDisplayAgreement(name) && name !== "일반세율" && name !== "최혜국");

  return agreementKeys
    .filter((key, index, keys) => keys.indexOf(key) === index)
    .map((key) => {
      const rate = row.agreementRates[key];
      if (!rate) return null;

      const label = CAN_AGREEMENT_LABELS[key] ?? key;
      return {
        label,
        rateText: rate,
        targetSummary: normalized && normalized !== "ALL" ? `${label} 대상 원산지` : "캐나다 세율표의 협정·특혜세율 항목",
        conditionSummary: "캐나다 수입 시 해당 협정·특혜세율 후보입니다. 원산지 기준, 직접운송, 원산지증명 또는 신고 요건을 함께 확인합니다.",
        sourceKey: `can-${key}`
      };
    })
    .filter((item): item is DestinationAgreementRateDisplayItem => Boolean(item));
}

function indiaAgreementRateItems(row: ExportDestinationTariffItem, originCountry?: string): DestinationAgreementRateDisplayItem[] {
  const normalized = originCountry?.trim().toUpperCase();
  const agreementKeys = normalized && normalized !== "ALL"
    ? IND_ORIGIN_TO_AGREEMENT_KEYS[normalized] ?? []
    : Object.keys(row.agreementRates).filter((name) => isDestinationDisplayAgreement(name));

  return agreementKeys
    .filter((key, index, keys) => keys.indexOf(key) === index)
    .map((key) => {
      const rate = row.agreementRates[key];
      if (!rate) return null;

      const label = IND_AGREEMENT_LABELS[key] ?? key;
      return {
        label,
        rateText: rate,
        targetSummary: normalized && normalized !== "ALL" ? `${label} 대상 원산지` : "인도 세율표의 협정·특혜세율 항목",
        conditionSummary: "인도 수입 시 해당 협정·특혜세율 후보입니다. 원산지 기준, 직접운송, 원산지증명서, 인도 측 통관서류 요건을 함께 확인합니다.",
        sourceKey: `ind-${key}`
      };
    })
    .filter((item): item is DestinationAgreementRateDisplayItem => Boolean(item));
}

function vietnamAgreementRateItems(row: ExportDestinationTariffItem, originCountry?: string): DestinationAgreementRateDisplayItem[] {
  const normalized = originCountry?.trim().toUpperCase();
  const agreementKeys = normalized && normalized !== "ALL"
    ? VNM_ORIGIN_TO_AGREEMENT_KEYS[normalized] ?? []
    : Object.keys(row.agreementRates).filter((name) => isDestinationDisplayAgreement(name) && name !== "Normal Import" && name !== "MFN\n특혜세율");

  return agreementKeys
    .filter((key, index, keys) => keys.indexOf(key) === index)
    .map((key) => {
      const rate = row.agreementRates[key];
      if (!rate) return null;

      const label = VNM_AGREEMENT_LABELS[key] ?? key;
      return {
        label,
        rateText: rate,
        targetSummary: normalized && normalized !== "ALL" ? `${label} 대상 원산지` : "베트남 세율표의 협정·특혜세율 항목",
        conditionSummary: "베트남 수입 시 해당 협정·특혜세율 후보입니다. 원산지 기준, 직접운송, 원산지증명서, 협정별 예외국가 표기를 함께 확인합니다.",
        sourceKey: `vnm-${key}`
      };
    })
    .filter((item): item is DestinationAgreementRateDisplayItem => Boolean(item));
}

function thailandAgreementRateItems(row: ExportDestinationTariffItem, originCountry?: string): DestinationAgreementRateDisplayItem[] {
  const normalized = originCountry?.trim().toUpperCase();
  const agreementKeys = normalized && normalized !== "ALL"
    ? THA_ORIGIN_TO_AGREEMENT_KEYS[normalized] ?? []
    : Object.keys(row.agreementRates).filter((name) => isDestinationDisplayAgreement(name) && name !== "상한세율");

  return agreementKeys
    .filter((key, index, keys) => keys.indexOf(key) === index)
    .map((key) => {
      const rate = row.agreementRates[key];
      if (!rate) return null;

      const label = key === "RECP" && (normalized === "KOR" || normalized === "KR")
        ? "RCEP(한국)"
        : THA_AGREEMENT_LABELS[key] ?? key;
      return {
        label,
        rateText: friendlyDestinationRateText(rate),
        targetSummary: normalized && normalized !== "ALL" ? `${label} 대상 원산지` : "태국 세율표의 협정·특혜세율 항목",
        conditionSummary: "태국 수입 시 해당 협정·특혜세율 후보입니다. 원산지 기준, 직접운송, 원산지증명서, 협정별 적용 조건을 함께 확인합니다.",
        sourceKey: `tha-${key}`
      };
    })
    .filter((item): item is DestinationAgreementRateDisplayItem => Boolean(item));
}

function indonesiaAgreementRateItems(row: ExportDestinationTariffItem, originCountry?: string): DestinationAgreementRateDisplayItem[] {
  const normalized = originCountry?.trim().toUpperCase();
  const agreementKeys = normalized && normalized !== "ALL"
    ? IDN_ORIGIN_TO_AGREEMENT_KEYS[normalized] ?? []
    : Object.keys(row.agreementRates).filter((name) => isDestinationDisplayAgreement(name) && name !== IDN_BASE_RATE_KEY);

  return agreementKeys
    .filter((key, index, keys) => keys.indexOf(key) === index)
    .map((key) => {
      const rate = row.agreementRates[key];
      if (!rate || rate === "MFN") return null;

      const label = IDN_AGREEMENT_LABELS[key] ?? key;
      return {
        label,
        rateText: friendlyDestinationRateText(rate),
        targetSummary: normalized && normalized !== "ALL" ? `${label} 대상 원산지` : "인도네시아 세율표의 협정·특혜세율 항목",
        conditionSummary: "인도네시아 수입 시 해당 협정·특혜세율 후보입니다. 원산지 기준, 직접운송, 원산지증명서, 협정별 적용 조건을 함께 확인합니다.",
        sourceKey: `idn-${key}`
      };
    })
    .filter((item): item is DestinationAgreementRateDisplayItem => Boolean(item));
}

function laosAgreementRateItems(row: ExportDestinationTariffItem, originCountry?: string): DestinationAgreementRateDisplayItem[] {
  const normalized = originCountry?.trim().toUpperCase();
  const agreementKeys = normalized && normalized !== "ALL"
    ? LAO_ORIGIN_TO_AGREEMENT_KEYS[normalized] ?? []
    : Object.keys(row.agreementRates).filter((name) => isDestinationDisplayAgreement(name));

  return agreementKeys
    .filter((key, index, keys) => keys.indexOf(key) === index)
    .map((key) => {
      const rate = row.agreementRates[key];
      if (!rate) return null;

      const label = key === "RCEP"
        ? normalized && normalized !== "ALL"
          ? `RCEP(${normalized === "KOR" || normalized === "KR" ? "한국" : "해당 원산지"})`
          : "RCEP"
        : LAO_AGREEMENT_LABELS[key] ?? key;

      return {
        label,
        rateText: friendlyDestinationRateText(rate),
        targetSummary: normalized && normalized !== "ALL" ? `${label} 대상 원산지` : "라오스 세율표의 협정·특혜세율 항목",
        conditionSummary: "라오스 수입 시 해당 협정·특혜세율 후보입니다. 원산지 기준, 직접운송, 원산지증명서, Lao Trade Portal 상품별 조건을 함께 확인합니다.",
        sourceKey: `lao-${key}`
      };
    })
    .filter((item): item is DestinationAgreementRateDisplayItem => Boolean(item));
}

function malaysiaAgreementRateItems(row: ExportDestinationTariffItem, originCountry?: string): DestinationAgreementRateDisplayItem[] {
  const normalized = originCountry?.trim().toUpperCase();
  const agreementKeys = normalized && normalized !== "ALL"
    ? MYS_ORIGIN_TO_AGREEMENT_KEYS[normalized] ?? []
    : Object.keys(row.agreementRates).filter((name) => isDestinationDisplayAgreement(name) && !MYS_TAX_RATE_KEYS.has(name));

  return agreementKeys
    .filter((key, index, keys) => keys.indexOf(key) === index)
    .map((key) => {
      const rate = row.agreementRates[key];
      if (!rate) return null;

      const label = key === "RCEP"
        ? normalized && normalized !== "ALL"
          ? `RCEP(${normalized === "KOR" || normalized === "KR" ? "한국" : "해당 원산지"})`
          : "RCEP"
        : MYS_AGREEMENT_LABELS[key] ?? key;

      return {
        label,
        rateText: friendlyDestinationRateText(rate),
        targetSummary: normalized && normalized !== "ALL" ? `${label} 대상 원산지` : "말레이시아 세율표의 협정·특혜세율 항목",
        conditionSummary: "말레이시아 수입 시 해당 협정·특혜세율 후보입니다. 원산지 기준, 직접운송, 원산지증명서, permit issuing agency 조건을 함께 확인합니다.",
        sourceKey: `mys-${key}`
      };
    })
    .filter((item): item is DestinationAgreementRateDisplayItem => Boolean(item));
}

function philippinesAgreementRateItems(row: ExportDestinationTariffItem, originCountry?: string): DestinationAgreementRateDisplayItem[] {
  const normalized = originCountry?.trim().toUpperCase();
  const agreementKeys = normalized && normalized !== "ALL"
    ? PHL_ORIGIN_TO_AGREEMENT_KEYS[normalized] ?? []
    : Object.keys(row.agreementRates).filter((name) => isDestinationDisplayAgreement(name) && name !== PHL_MFN_RATE_KEY);

  return agreementKeys
    .filter((key, index, keys) => keys.indexOf(key) === index)
    .map((key) => {
      const rate = row.agreementRates[key];
      if (!rate) return null;

      const label = key === "RCEP 협정세율\nRCEP KOREA"
        ? normalized && normalized !== "ALL"
          ? `RCEP(${normalized === "KOR" || normalized === "KR" ? "한국" : "해당 원산지"})`
          : "RCEP"
        : PHL_AGREEMENT_LABELS[key] ?? key;

      return {
        label,
        rateText: friendlyDestinationRateText(rate),
        targetSummary: normalized && normalized !== "ALL" ? `${label} 대상 원산지` : "필리핀 세율표의 협정·특혜세율 항목",
        conditionSummary: "필리핀 수입 시 해당 협정·특혜세율 후보입니다. 원산지 기준, 직접운송, 원산지증명서, 필리핀 Tariff Finder의 적용연도 조건을 함께 확인합니다.",
        sourceKey: `phl-${key}`
      };
    })
    .filter((item): item is DestinationAgreementRateDisplayItem => Boolean(item));
}

function singaporeAgreementRateItems(row: ExportDestinationTariffItem, originCountry?: string): DestinationAgreementRateDisplayItem[] {
  const normalized = originCountry?.trim().toUpperCase();
  const agreementKeys = normalized && normalized !== "ALL"
    ? SGP_ORIGIN_TO_AGREEMENT_KEYS[normalized] ?? []
    : Object.keys(row.agreementRates).filter((name) => isDestinationDisplayAgreement(name) && name !== "소비세율");

  return agreementKeys
    .filter((key, index, keys) => keys.indexOf(key) === index)
    .map((key) => {
      const rate = row.agreementRates[key];
      if (!rate) return null;

      const label = SGP_AGREEMENT_LABELS[key] ?? key;
      return {
        label,
        rateText: friendlyDestinationRateText(rate),
        targetSummary: normalized && normalized !== "ALL" ? `${label} 대상 원산지` : "싱가포르 세율표의 협정·특혜세율 항목",
        conditionSummary: "싱가포르 수입 시 해당 협정·특혜세율 후보입니다. 원산지 기준, 직접운송, 원산지증명서, TradeNet 허가 조건을 함께 확인합니다.",
        sourceKey: `sgp-${key}`
      };
    })
    .filter((item): item is DestinationAgreementRateDisplayItem => Boolean(item));
}

function cambodiaAgreementRateItems(row: ExportDestinationTariffItem, originCountry?: string): DestinationAgreementRateDisplayItem[] {
  const normalized = originCountry?.trim().toUpperCase();
  const agreementKeys = normalized && normalized !== "ALL"
    ? CAM_ORIGIN_TO_AGREEMENT_KEYS[normalized] ?? []
    : Object.keys(row.agreementRates).filter((name) => isDestinationDisplayAgreement(name) && !CAM_TAX_RATE_KEYS.has(name));

  return agreementKeys
    .filter((key, index, keys) => keys.indexOf(key) === index)
    .map((key) => {
      const rate = row.agreementRates[key];
      if (!rate) return null;

      const label = key === "RCEP"
        ? normalized && normalized !== "ALL"
          ? `RCEP(${normalized === "KOR" || normalized === "KR" ? "한국" : "해당 원산지"})`
          : "RCEP"
        : CAM_AGREEMENT_LABELS[key] ?? key;

      return {
        label,
        rateText: friendlyDestinationRateText(rate),
        targetSummary: normalized && normalized !== "ALL" ? `${label} 대상 원산지` : "캄보디아 세율표의 협정·특혜세율 항목",
        conditionSummary: "캄보디아 수입 시 해당 협정·특혜세율 후보입니다. 원산지 기준, 직접운송, 원산지증명서, GDCE/캄보디아 NTR의 품목별 조건을 함께 확인합니다.",
        sourceKey: `cam-${key}`
      };
    })
    .filter((item): item is DestinationAgreementRateDisplayItem => Boolean(item));
}

function myanmarAgreementRateItems(row: ExportDestinationTariffItem, originCountry?: string): DestinationAgreementRateDisplayItem[] {
  const normalized = originCountry?.trim().toUpperCase();
  const agreementKeys = normalized && normalized !== "ALL"
    ? MYA_ORIGIN_TO_AGREEMENT_KEYS[normalized] ?? []
    : Object.keys(row.agreementRates).filter((name) => isDestinationDisplayAgreement(name));

  return agreementKeys
    .filter((key, index, keys) => keys.indexOf(key) === index)
    .map((key) => {
      const rate = row.agreementRates[key];
      if (!rate) return null;

      const label = MYA_AGREEMENT_LABELS[key] ?? key;
      return {
        label,
        rateText: friendlyDestinationRateText(rate),
        targetSummary: normalized && normalized !== "ALL" ? `${label} 대상 원산지` : "미얀마 세율표의 협정·특혜세율 항목",
        conditionSummary: "미얀마 수입 시 해당 협정·특혜세율 후보입니다. 원산지 기준, 직접운송, 원산지증명서, Myanmar Trade Portal의 품목별 수입허가 조건을 함께 확인합니다.",
        sourceKey: `mya-${key}`
      };
    })
    .filter((item): item is DestinationAgreementRateDisplayItem => Boolean(item));
}

function bruneiAgreementRateItems(row: ExportDestinationTariffItem, originCountry?: string): DestinationAgreementRateDisplayItem[] {
  const normalized = originCountry?.trim().toUpperCase();
  const agreementKeys = normalized && normalized !== "ALL"
    ? BRU_ORIGIN_TO_AGREEMENT_KEYS[normalized] ?? []
    : Object.keys(row.agreementRates).filter((name) => isDestinationDisplayAgreement(name));

  return agreementKeys
    .filter((key, index, keys) => keys.indexOf(key) === index)
    .map((key) => {
      const rate = row.agreementRates[key];
      if (!rate) return null;

      const label = key === "RCEP"
        ? normalized && normalized !== "ALL"
          ? `RCEP(${normalized === "KOR" || normalized === "KR" ? "한국" : "해당 원산지"})`
          : "RCEP"
        : BRU_AGREEMENT_LABELS[key] ?? key;

      return {
        label,
        rateText: friendlyDestinationRateText(rate),
        targetSummary: normalized && normalized !== "ALL" ? `${label} 대상 원산지` : "브루나이 세율표의 협정·특혜세율 항목",
        conditionSummary: "브루나이 수입 시 해당 협정·특혜세율 후보입니다. 원산지 기준, 직접운송, 원산지증명서, BDNSW/관할기관 수입허가 조건을 함께 확인합니다.",
        sourceKey: `bru-${key}`
      };
    })
    .filter((item): item is DestinationAgreementRateDisplayItem => Boolean(item));
}

function newZealandAgreementRateItems(row: ExportDestinationTariffItem, originCountry?: string): DestinationAgreementRateDisplayItem[] {
  const normalized = originCountry?.trim().toUpperCase();
  const agreementKeys = normalized && normalized !== "ALL"
    ? NZL_ORIGIN_TO_AGREEMENT_KEYS[normalized] ?? []
    : Object.keys(row.agreementRates).filter((name) => isDestinationDisplayAgreement(name));

  return agreementKeys
    .filter((key, index, keys) => keys.indexOf(key) === index)
    .map((key) => {
      const rate = row.agreementRates[key];
      if (!rate) return null;

      const label = key === "RCEP"
        ? normalized && normalized !== "ALL"
          ? `RCEP(${normalized === "KOR" || normalized === "KR" ? "한국" : "해당 원산지"})`
          : "RCEP"
        : NZL_AGREEMENT_LABELS[key] ?? key;

      return {
        label,
        rateText: friendlyDestinationRateText(rate),
        targetSummary: normalized && normalized !== "ALL" ? `${label} 대상 원산지` : "뉴질랜드 세율표의 협정·특혜세율 항목",
        conditionSummary: "뉴질랜드 수입 시 해당 협정·특혜세율 후보입니다. 원산지 기준, 직접운송, 원산지증명서, Trade Single Window 및 MPI/Customs 조건을 함께 확인합니다.",
        sourceKey: `nzl-${key}`
      };
    })
    .filter((item): item is DestinationAgreementRateDisplayItem => Boolean(item));
}

function parseTaiwanColumnIIRates(columnIIRateText: string): Array<{ rateText: string; codes: string[] }> {
  const clauses: Array<{ rateText: string; codes: string[] }> = [];
  const clausePattern = /([^()]+?)\s*\(([^)]*)\)/g;
  let match: RegExpExecArray | null;

  while ((match = clausePattern.exec(columnIIRateText)) !== null) {
    const rateText = match[1]?.trim();
    const codes = (match[2] ?? "")
      .split(",")
      .map((code) => code.trim().toUpperCase())
      .filter(Boolean);

    if (rateText && codes.length) clauses.push({ rateText, codes });
  }

  return clauses;
}

function taiwanColumnIIRateItems(row: ExportDestinationTariffItem, originCountry?: string): DestinationAgreementRateDisplayItem[] {
  const columnIIRateText = row.agreementRates[TWN_COLUMN_II_RATE_KEY];
  if (!columnIIRateText) return [];

  const normalized = originCountry?.trim().toUpperCase();
  const clauses = parseTaiwanColumnIIRates(columnIIRateText);

  if (normalized && normalized !== "ALL") {
    const countryCode = ORIGIN_COUNTRY_TO_TWN_COLUMN_II_CODE[normalized];
    if (!countryCode) return [];

    const clause = clauses.find((item) => item.codes.includes(countryCode));
    if (!clause) return [];

    const label = TWN_COLUMN_II_COUNTRY_LABELS[countryCode] ?? `대만 Column II 특혜관세(${countryCode})`;
    return [{
      label,
      rateText: friendlyDestinationRateText(clause.rateText),
      targetSummary: `${label} 대상 원산지`,
      conditionSummary: "대만 수입 시 Column II 협정·특혜세율 후보입니다. 원산지 기준, 직접운송, 원산지증명서, 대만 수입규정 코드를 함께 확인합니다.",
      sourceKey: `twn-column-ii-${countryCode}`
    }];
  }

  return clauses.map((clause, index) => {
    const labels = clause.codes.map((code) => TWN_COLUMN_II_COUNTRY_LABELS[code] ?? code);
    return {
      label: "대만 Column II 특혜관세",
      rateText: friendlyDestinationRateText(clause.rateText),
      targetSummary: labels.join(", "),
      conditionSummary: "원산지를 선택하면 해당 원산지와 연결된 대만 Column II 협정·특혜세율만 좁혀 표시합니다. 실제 적용은 원산지 요건과 증빙요건을 함께 확인합니다.",
      sourceKey: `twn-column-ii-${index}`
    };
  });
}

function turkeyAgreementRateItems(row: ExportDestinationTariffItem): DestinationAgreementRateDisplayItem[] {
  return TUR_BASE_RATE_KEYS
    .map(([key, label]) => {
      const rate = row.agreementRates[key];
      if (!rate) return null;

      return {
        label: `${label} 관세율`,
        rateText: `${friendlyDestinationRateText(rate)}%`,
        targetSummary: "튀르키예 품목군별 관세율",
        conditionSummary: "튀르키예 수입 시 품목군별 관세율 후보입니다. 한-튀르키예 FTA, EU 관세동맹, 원산지증명, 직접운송, 추가재정의무와 TAREKS/관할기관 수입조건을 함께 확인합니다.",
        sourceKey: `tur-${key}`
      };
    })
    .filter((item): item is DestinationAgreementRateDisplayItem => Boolean(item));
}

function southAfricaAgreementRateItems(row: ExportDestinationTariffItem, originCountry?: string): DestinationAgreementRateDisplayItem[] {
  const normalized = originCountry?.trim().toUpperCase();

  return Object.entries(row.agreementRates)
    .filter(([key]) => {
      if (!ZAF_AGREEMENT_LABELS[key]) return false;
      if (!normalized || normalized === "ALL") return true;
      return ZAF_AGREEMENT_ORIGINS[key]?.has(normalized) ?? false;
    })
    .map(([key, rate]) => ({
      label: ZAF_AGREEMENT_LABELS[key] ?? key,
      rateText: rate,
      targetSummary: normalized && normalized !== "ALL" ? `${originCountry} 원산지 후보` : "해당 협정권 원산지 후보",
      conditionSummary: "남아프리카공화국 수입 시 해당 협정 원산지, 직접운송, 원산지증명과 적용 기간을 함께 확인합니다. 한국 원산지는 현재 이 특혜세율 후보에 포함하지 않습니다.",
      sourceKey: `zaf-${key}`
    }));
}

function mongoliaAgreementRateItems(row: ExportDestinationTariffItem, originCountry?: string): DestinationAgreementRateDisplayItem[] {
  const aptaRate = row.agreementRates.APTA;
  if (!aptaRate) return [];

  const normalized = originCountry?.trim().toUpperCase();
  if (normalized && normalized !== "ALL" && !APTA_ORIGIN_CODES.has(normalized)) {
    return [];
  }

  return [{
    label: "아시아태평양무역협정(APTA)",
    rateText: aptaRate,
    targetSummary: normalized && normalized !== "ALL" ? `${originCountry} 원산지 후보` : "APTA 회원국 원산지 후보",
    conditionSummary: "몽골 수입 시 APTA 원산지 기준, 직접운송, 원산지증명 등 협정 적용 요건을 함께 확인합니다.",
    sourceKey: "mng-apta"
  }];
}

export function destinationDisplayAgreementRates(row: ExportDestinationTariffItem, originCountry?: string) {
  return destinationAgreementRateDisplayItems(row, originCountry).map((item) => `${item.label} ${item.rateText}`).join(" / ") || "-";
}

export function destinationAgreementRateDisplayItems(row: ExportDestinationTariffItem, originCountry?: string): DestinationAgreementRateDisplayItem[] {
  if (row.countryCode === "CHN") {
    return [
      row.agreementRates["대한민국"]
        ? {
            label: "한-중 FTA",
            rateText: row.agreementRates["대한민국"],
            targetSummary: "한국 원산지",
            conditionSummary: "한-중 FTA 원산지 기준, 직접운송, 원산지증명서 등 협정 적용 요건을 함께 확인합니다.",
            sourceKey: "chn-korea-fta"
          }
        : null,
      row.agreementRates["대한민국_RCEP"]
        ? {
            label: "RCEP(한국)",
            rateText: row.agreementRates["대한민국_RCEP"],
            targetSummary: "한국 원산지",
            conditionSummary: "RCEP 원산지 기준, 직접운송, 누적 적용 여부, 원산지증명 또는 원산지신고 요건을 함께 확인합니다.",
            sourceKey: "chn-korea-rcep"
          }
        : null
    ].filter((item): item is DestinationAgreementRateDisplayItem => Boolean(item));
  }

  if (row.countryCode === "USA") {
    const specialRate = row.agreementRates["Special / preferential duty"];
    return specialRate ? usSpecialRateItems(specialRate, originCountry) : [];
  }

  if (row.countryCode === "JPN") {
    return japanAgreementRateItems(row, originCountry);
  }

  if (row.countryCode === "GBR") {
    return ukAgreementRateItems(row, originCountry);
  }

  if (row.countryCode === "AUS" || row.countryCode === "AU") {
    return australiaAgreementRateItems(row, originCountry);
  }

  if (row.countryCode === "CAN" || row.countryCode === "CA") {
    return canadaAgreementRateItems(row, originCountry);
  }

  if (row.countryCode === "IND" || row.countryCode === "IN") {
    return indiaAgreementRateItems(row, originCountry);
  }

  if (row.countryCode === "VNM" || row.countryCode === "VN") {
    return vietnamAgreementRateItems(row, originCountry);
  }

  if (row.countryCode === "THA" || row.countryCode === "TH") {
    return thailandAgreementRateItems(row, originCountry);
  }

  if (row.countryCode === "IDN" || row.countryCode === "ID") {
    return indonesiaAgreementRateItems(row, originCountry);
  }

  if (row.countryCode === "LAO" || row.countryCode === "LA") {
    return laosAgreementRateItems(row, originCountry);
  }

  if (row.countryCode === "MYS" || row.countryCode === "MY") {
    return malaysiaAgreementRateItems(row, originCountry);
  }

  if (row.countryCode === "PHL" || row.countryCode === "PH") {
    return philippinesAgreementRateItems(row, originCountry);
  }

  if (row.countryCode === "SGP" || row.countryCode === "SG") {
    return singaporeAgreementRateItems(row, originCountry);
  }

  if (row.countryCode === "CAM" || row.countryCode === "KH" || row.countryCode === "KHM") {
    return cambodiaAgreementRateItems(row, originCountry);
  }

  if (row.countryCode === "MYA" || row.countryCode === "MM" || row.countryCode === "MMR") {
    return myanmarAgreementRateItems(row, originCountry);
  }

  if (row.countryCode === "BRU" || row.countryCode === "BN" || row.countryCode === "BRN") {
    return bruneiAgreementRateItems(row, originCountry);
  }

  if (row.countryCode === "NZL" || row.countryCode === "NZ") {
    return newZealandAgreementRateItems(row, originCountry);
  }

  if (row.countryCode === "TWN" || row.countryCode === "TW") {
    return taiwanColumnIIRateItems(row, originCountry);
  }

  if (row.countryCode === "TUR" || row.countryCode === "TR") {
    return turkeyAgreementRateItems(row);
  }

  if (row.countryCode === "ZAF" || row.countryCode === "ZA") {
    return southAfricaAgreementRateItems(row, originCountry);
  }

  if (row.countryCode === "MNG" || row.countryCode === "MN") {
    return mongoliaAgreementRateItems(row, originCountry);
  }

  if (row.countryCode === "EEC") {
    const koreaPreference = row.agreementRates["한국협정세율"];
    if (originCountry && originCountry !== "ALL") {
      return isKoreaOriginForEu(originCountry) && koreaPreference
        ? [{
            label: "한-EU FTA",
            rateText: koreaPreference,
            targetSummary: "한국 원산지",
            conditionSummary: "EU 수입 시 한-EU FTA 특혜세율 후보입니다. 원산지신고 문안, 인증수출자 번호, 직접운송 등 협정 적용 요건을 함께 확인합니다.",
            sourceKey: "eec-korea-fta"
          }]
        : [];
    }

    return [
      koreaPreference
        ? {
            label: "한-EU FTA",
            rateText: koreaPreference,
            targetSummary: "한국 원산지",
            conditionSummary: "원산지를 한국으로 선택하면 한-EU FTA 특혜세율만 좁혀 표시합니다. 실제 적용은 원산지 요건과 증빙요건을 함께 확인합니다.",
            sourceKey: "eec-korea-fta"
          }
        : null
    ].filter((item): item is DestinationAgreementRateDisplayItem => Boolean(item));
  }

  return Object.entries(row.agreementRates)
    .filter(([name]) => isDestinationDisplayAgreement(name))
    .map(([name, rate]) => ({
      label: name,
      rateText: rate,
      targetSummary: "목적국 세율표의 협정·특혜세율 항목",
      conditionSummary: "원산지, 증빙서류, 직접운송, 적용 기간 등 해당 세율의 적용요건을 함께 확인합니다.",
      sourceKey: name
    }));
}

function isKoreaOriginForEu(originCountry?: string) {
  const normalized = originCountry?.trim().toUpperCase();
  return normalized === "KOR" || normalized === "KR";
}
