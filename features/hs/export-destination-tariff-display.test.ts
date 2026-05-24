import { describe, expect, it } from "vitest";
import {
  destinationDisplayBaseRate,
  destinationDisplayAgreementRates,
  extractUsSpecialRateForCode,
  summarizeUsSpecialRates
} from "./export-destination-tariff-display";
import type { ExportDestinationTariffItem } from "@/server/repositories/export-destination-tariff.repository";

function tariff(overrides: Partial<ExportDestinationTariffItem>): ExportDestinationTariffItem {
  return {
    countryCode: "USA",
    tariffYear: 2026,
    destinationHsCode: "8507600010",
    matchBasis: "exact",
    matchScore: 115,
    englishName: "Lithium-ion batteries",
    koreanName: null,
    unit: null,
    baseRateText: "3.4%",
    agreementRates: {},
    sourceName: "USITC HTS REST API",
    sourceVersion: "usitc-hts-2026-rev7-20260523",
    basisDate: "2026-05-23",
    staffReviewStatus: "확인 필요",
    ...overrides
  };
}

describe("export destination tariff display", () => {
  it("extracts a US special tariff rate by special program code", () => {
    expect(extractUsSpecialRateForCode("Free (A,AU,B,BH,C,CL,CO,D,E,IL,JO,KR,MA,OM,P,PA,PE,S,SG)", "KR")).toBe("Free");
    expect(extractUsSpecialRateForCode("Free (A*,AU,BH) 1.5% (KR)", "KR")).toBe("1.5%");
  });

  it("shows Korea-origin US special tariff as Korea-US FTA", () => {
    expect(destinationDisplayAgreementRates(tariff({
      agreementRates: {
        "Column 2 duty": "40%",
        "Special / preferential duty": "Free (A,AU,B,BH,C,CL,CO,D,E,IL,JO,KR,MA,OM,P,PA,PE,S,SG)"
      }
    }), "KOR")).toBe("한-미 FTA Free");
  });

  it("hides Korea-US FTA when the selected origin is not Korea", () => {
    expect(destinationDisplayAgreementRates(tariff({
      agreementRates: {
        "Special / preferential duty": "Free (A,AU,B,BH,C,CL,CO,D,E,IL,JO,KR,MA,OM,P,PA,PE,S,SG)"
      }
    }), "CHN")).toBe("-");
  });

  it("shows other selected origin FTA rates by country-specific US special code", () => {
    expect(destinationDisplayAgreementRates(tariff({
      agreementRates: {
        "Special / preferential duty": "Free (A,AU,BH,KR,MX,SG)"
      }
    }), "AUS")).toBe("미-호주 FTA Free");

    expect(destinationDisplayAgreementRates(tariff({
      agreementRates: {
        "Special / preferential duty": "Free (A,AU,BH,KR,MX,SG)"
      }
    }), "MEX")).toBe("USMCA(멕시코) Free");
  });

  it("summarizes all-origin US special rates without leaking raw code lists", () => {
    expect(summarizeUsSpecialRates("Free (A,AU,B,BH,C,CL,CO,D,E,IL,JO,KR,MA,OM,P,PA,PE,S,SG)")).toBe(
      "특혜세율 Free (미-호주 FTA, 미-바레인 FTA, 미-칠레 FTA, 미-콜롬비아 FTA 외 8개)"
    );
  });

  it("shows Japan agreement rates for the selected origin only", () => {
    const japanTariff = tariff({
      countryCode: "JPN",
      destinationHsCode: "330410000",
      baseRateText: "5.8%",
      agreementRates: {
        Australia: "Free",
        "Korea(RCEP)": "Free",
        "China(RCEP)": "Free",
        CPTPP: "Free"
      }
    });

    expect(destinationDisplayAgreementRates(japanTariff, "KOR")).toBe("RCEP(한국) Free");
    expect(destinationDisplayAgreementRates(japanTariff, "CHN")).toBe("RCEP(중국) Free");
    expect(destinationDisplayAgreementRates(japanTariff, "AUS")).toBe("일-호주 EPA Free / CPTPP Free");
  });

  it("maps EU shared tariff preference to Korea-EU FTA only for Korea origin", () => {
    const euTariff = tariff({
      countryCode: "EEC",
      destinationHsCode: "3304100000",
      baseRateText: null,
      agreementRates: {
        "ERGA OMNES": "0.000 % - Third country duty (1999-01-01 ~ )",
        "한국협정세율": "0.000 % - Tariff preference (2011-07-01 ~ )"
      }
    });

    expect(destinationDisplayAgreementRates(euTariff, "KOR")).toBe("한-EU FTA 0.000 % - Tariff preference (2011-07-01 ~ )");
    expect(destinationDisplayAgreementRates(euTariff, "CHN")).toBe("-");
  });

  it("maps UK South Korea preference to Korea-UK FTA and hides non-preferential duty", () => {
    const ukTariff = tariff({
      countryCode: "GBR",
      destinationHsCode: "8507600010",
      baseRateText: "2.00 %",
      agreementRates: {
        "Tariff preference - South Korea": "0.00 %",
        "Tariff preference - Japan": "0.00 %",
        "Non preferential duty under authorised use\n(비특혜 기본관세율)": "0%"
      }
    });

    expect(destinationDisplayAgreementRates(ukTariff, "KOR")).toBe("한-영 FTA 0.00 %");
    expect(destinationDisplayAgreementRates(ukTariff, "JPN")).toBe("영국-일본 CEPA 0.00 %");
    expect(destinationDisplayAgreementRates(ukTariff, "CHN")).toBe("-");
  });

  it("maps Australia Korea preference and RCEP by selected origin", () => {
    const australiaTariff = tariff({
      countryCode: "AUS",
      destinationHsCode: "1905900060",
      baseRateText: "5%",
      agreementRates: {
        "대한민국\n협정세율": "Free",
        RCEP: "From 1 January 2022: 5%\nFrom 1 January 2041 Free"
      }
    });

    expect(destinationDisplayAgreementRates(australiaTariff, "KOR")).toBe("한-호주 FTA Free / RCEP From 1 January 2022: 5%\nFrom 1 January 2041 Free");
    expect(destinationDisplayAgreementRates(australiaTariff, "CHN")).toBe("RCEP From 1 January 2022: 5%\nFrom 1 January 2041 Free");
    expect(destinationDisplayAgreementRates(australiaTariff, "USA")).toBe("-");
  });

  it("maps Canada Korea preference and CPTPP by selected origin", () => {
    const canadaTariff = tariff({
      countryCode: "CAN",
      destinationHsCode: "1905901000",
      baseRateText: null,
      agreementRates: {
        최혜국: "4%",
        "대한민국\n세율": "Free",
        "포괄적, 점진적-환태평양경제동반자협정 세율": "Free",
        "미국 세율": "Free"
      }
    });

    expect(destinationDisplayAgreementRates(canadaTariff, "KOR")).toBe("한-캐나다 FTA Free");
    expect(destinationDisplayAgreementRates(canadaTariff, "JPN")).toBe("CPTPP Free");
    expect(destinationDisplayAgreementRates(canadaTariff, "USA")).toBe("CUSMA/USMCA(미국) Free");
    expect(destinationDisplayAgreementRates(canadaTariff, "CHN")).toBe("-");
  });

  it("maps India Korea preference to Korea-India CEPA only for Korea origin", () => {
    const indiaTariff = tariff({
      countryCode: "IND",
      destinationHsCode: "33041000",
      baseRateText: "20%",
      agreementRates: {
        "인도-대한민국 \n협정세율": "0.00% - All Goods"
      }
    });

    expect(destinationDisplayAgreementRates(indiaTariff, "KOR")).toBe("한-인도 CEPA 0.00% - All Goods");
    expect(destinationDisplayAgreementRates(indiaTariff, "CHN")).toBe("-");
  });

  it("maps Vietnam MFN base and Korea preference keys by selected origin", () => {
    const vietnamTariff = tariff({
      countryCode: "VNM",
      destinationHsCode: "33041000",
      baseRateText: "",
      agreementRates: {
        "Normal Import": "30%",
        "MFN\n특혜세율": "20%",
        "VKFTA\n베트남-대한민국": "5%",
        "AKFTA\n아세안-대한민국": "5%",
        "RCEP_KOR\nRECP-대한민국": "12%",
        "ACFTA\n아세안-중국": "0%",
        "RCEP_CHN\nRECP-중국": "12%"
      }
    });

    expect(destinationDisplayBaseRate(vietnamTariff)).toBe("MFN 20%");
    expect(destinationDisplayAgreementRates(vietnamTariff, "KOR")).toBe("한-베트남 FTA 5% / 한-아세안 FTA 5% / RCEP(한국) 12%");
    expect(destinationDisplayAgreementRates(vietnamTariff, "CHN")).toBe("아세안-중국 FTA 0% / RCEP(중국) 12%");
    expect(destinationDisplayAgreementRates(vietnamTariff, "USA")).toBe("-");
  });

  it("maps Thailand Korea preference and RCEP while translating exempted rates", () => {
    const thailandTariff = tariff({
      countryCode: "THA",
      destinationHsCode: "33041000",
      baseRateText: "30%",
      agreementRates: {
        상한세율: "50%",
        RECP: "21%",
        "아세안-한국\n협정세율": "Exempted"
      }
    });

    expect(destinationDisplayBaseRate(thailandTariff)).toBe("30%");
    expect(destinationDisplayAgreementRates(thailandTariff, "KOR")).toBe("한-아세안 FTA 면제 / RCEP(한국) 21%");
    expect(destinationDisplayAgreementRates(thailandTariff, "CHN")).toBe("RCEP 21%");
    expect(destinationDisplayAgreementRates(thailandTariff, "USA")).toBe("-");
  });

  it("maps Indonesia import duty base and Korea preference keys by selected origin", () => {
    const indonesiaTariff = tariff({
      countryCode: "IDN",
      destinationHsCode: "33041000",
      baseRateText: "",
      agreementRates: {
        "기본세율\nImport Duty": "15%",
        "아세안 무역협정\nATIGA": "0%",
        "RCEP협정세율-대한민국\nRCEP_KOREA": "MFN",
        "아세안-한국 협정세율\nAKFTA Import Duty": "0%",
        "한-인도네시아-포괄적경제동반자협정\nCEPA": "0%"
      }
    });

    expect(destinationDisplayBaseRate(indonesiaTariff)).toBe("15%");
    expect(destinationDisplayAgreementRates(indonesiaTariff, "KOR")).toBe("한-인도네시아 CEPA 0% / 한-아세안 FTA 0%");
    expect(destinationDisplayAgreementRates(indonesiaTariff, "THA")).toBe("ATIGA(아세안) 0%");
    expect(destinationDisplayAgreementRates(indonesiaTariff, "USA")).toBe("-");
  });

  it("maps Laos Korea preference, RCEP and APTA by selected origin", () => {
    const laosTariff = tariff({
      countryCode: "LAO",
      destinationHsCode: "19059010",
      baseRateText: "30%",
      agreementRates: {
        APTA: "24%",
        RCEP: "30%",
        협정세율: "0%"
      }
    });

    expect(destinationDisplayAgreementRates(laosTariff, "KOR")).toBe("한-아세안 FTA 0% / RCEP(한국) 30% / 아·태무역협정(APTA) 24%");
    expect(destinationDisplayAgreementRates(laosTariff, "CHN")).toBe("RCEP(해당 원산지) 30% / 아·태무역협정(APTA) 24%");
    expect(destinationDisplayAgreementRates(laosTariff, "USA")).toBe("-");
  });

  it("maps Malaysia Korea preference while hiding tax columns from agreement rates", () => {
    const malaysiaTariff = tariff({
      countryCode: "MYS",
      destinationHsCode: "3304100000",
      baseRateText: "0%",
      agreementRates: {
        AKFTA: "0%",
        ATIGA: "0%",
        RCEP: "0%",
        부가세율: "5%",
        소비세율: "10%",
        수출세율: "0%"
      }
    });

    expect(destinationDisplayAgreementRates(malaysiaTariff, "KOR")).toBe("한-아세안 FTA 0% / RCEP(한국) 0%");
    expect(destinationDisplayAgreementRates(malaysiaTariff, "THA")).toBe("ATIGA(아세안) 0% / RCEP(해당 원산지) 0%");
    expect(destinationDisplayAgreementRates(malaysiaTariff, "USA")).toBe("-");
    expect(destinationDisplayAgreementRates(malaysiaTariff, "ALL")).toBe("한-아세안 FTA 0% / ATIGA(아세안) 0% / RCEP 0%");
  });

  it("maps Philippines MFN base and Korea preference keys by selected origin", () => {
    const philippinesTariff = tariff({
      countryCode: "PHL",
      destinationHsCode: "33041000",
      baseRateText: "",
      agreementRates: {
        "최혜국\nMFN": "7%",
        "Korea-Philippines FTA": "0%",
        "한-아세안 무역협정\nAKFTA": "0%",
        "RCEP 협정세율\nRCEP KOREA": "0%",
        "아세안 무역협정\nATIGA": "0% - All."
      }
    });

    expect(destinationDisplayBaseRate(philippinesTariff)).toBe("MFN 7%");
    expect(destinationDisplayAgreementRates(philippinesTariff, "KOR")).toBe("한-필리핀 FTA 0% / 한-아세안 FTA 0% / RCEP(한국) 0%");
    expect(destinationDisplayAgreementRates(philippinesTariff, "THA")).toBe("ATIGA(아세안) 0% - All. / RCEP(해당 원산지) 0%");
    expect(destinationDisplayAgreementRates(philippinesTariff, "USA")).toBe("-");
  });

  it("maps Singapore Korea preference only for Korea origin", () => {
    const singaporeTariff = tariff({
      countryCode: "SGP",
      destinationHsCode: "33041000",
      baseRateText: "0%",
      agreementRates: {
        "한-싱가포르\n협정세율": "0%",
        소비세율: "0%"
      }
    });

    expect(destinationDisplayBaseRate(singaporeTariff)).toBe("0%");
    expect(destinationDisplayAgreementRates(singaporeTariff, "KOR")).toBe("한-싱가포르 FTA 0%");
    expect(destinationDisplayAgreementRates(singaporeTariff, "USA")).toBe("-");
    expect(destinationDisplayAgreementRates(singaporeTariff, "ALL")).toBe("한-싱가포르 FTA 0%");
  });

  it("maps Cambodia Korea preferences while hiding tax columns from agreement rates", () => {
    const cambodiaTariff = tariff({
      countryCode: "CAM",
      destinationHsCode: "19059010",
      baseRateText: "15%",
      agreementRates: {
        "한-캄보디아 FTA": "7%",
        AKFTA: "5%",
        RCEP: "7%",
        부가세: "10%",
        특별세: "0%"
      }
    });

    expect(destinationDisplayBaseRate(cambodiaTariff)).toBe("15%");
    expect(destinationDisplayAgreementRates(cambodiaTariff, "KOR")).toBe("한-캄보디아 FTA 7% / 한-아세안 FTA 5% / RCEP(한국) 7%");
    expect(destinationDisplayAgreementRates(cambodiaTariff, "CHN")).toBe("RCEP(해당 원산지) 7%");
    expect(destinationDisplayAgreementRates(cambodiaTariff, "USA")).toBe("-");
    expect(destinationDisplayAgreementRates(cambodiaTariff, "ALL")).toBe("한-캄보디아 FTA 7% / 한-아세안 FTA 5% / RCEP 7%");
  });

  it("maps Myanmar generic preference as Korea-ASEAN FTA for Korea origin", () => {
    const myanmarTariff = tariff({
      countryCode: "MYA",
      destinationHsCode: "3304100000",
      baseRateText: "20%",
      agreementRates: {
        협정세율: "0%"
      }
    });

    expect(destinationDisplayBaseRate(myanmarTariff)).toBe("20%");
    expect(destinationDisplayAgreementRates(myanmarTariff, "KOR")).toBe("한-아세안 FTA 0%");
    expect(destinationDisplayAgreementRates(myanmarTariff, "USA")).toBe("-");
    expect(destinationDisplayAgreementRates(myanmarTariff, "ALL")).toBe("한-아세안 FTA 0%");
  });

  it("maps Brunei Korea preference and RCEP by selected origin", () => {
    const bruneiTariff = tariff({
      countryCode: "BRU",
      destinationHsCode: "33041000",
      baseRateText: "5%",
      agreementRates: {
        협정세율: "0%",
        RCEP: "4%"
      }
    });

    expect(destinationDisplayBaseRate(bruneiTariff)).toBe("5%");
    expect(destinationDisplayAgreementRates(bruneiTariff, "KOR")).toBe("한-아세안 FTA 0% / RCEP(한국) 4%");
    expect(destinationDisplayAgreementRates(bruneiTariff, "CHN")).toBe("RCEP(해당 원산지) 4%");
    expect(destinationDisplayAgreementRates(bruneiTariff, "USA")).toBe("-");
    expect(destinationDisplayAgreementRates(bruneiTariff, "ALL")).toBe("한-아세안 FTA 0% / RCEP 4%");
  });

  it("maps New Zealand Korea preference and RCEP by selected origin", () => {
    const newZealandTariff = tariff({
      countryCode: "NZL",
      destinationHsCode: "3304100000C",
      baseRateText: "5%",
      agreementRates: {
        "KNZFTA\n한국-뉴질랜드 FTA": "Free",
        RCEP: "3%"
      }
    });

    expect(destinationDisplayBaseRate(newZealandTariff)).toBe("5%");
    expect(destinationDisplayAgreementRates(newZealandTariff, "KOR")).toBe("한-뉴질랜드 FTA Free / RCEP(한국) 3%");
    expect(destinationDisplayAgreementRates(newZealandTariff, "CHN")).toBe("RCEP(해당 원산지) 3%");
    expect(destinationDisplayAgreementRates(newZealandTariff, "USA")).toBe("-");
    expect(destinationDisplayAgreementRates(newZealandTariff, "ALL")).toBe("한-뉴질랜드 FTA Free / RCEP 3%");
  });

  it("maps Taiwan Column I base and Column II origin-specific preferences", () => {
    const taiwanTariff = tariff({
      countryCode: "TWN",
      destinationHsCode: "19059090006",
      baseRateText: "",
      agreementRates: {
        "Column I 과 Column II 에 \n적용되지 않는 국가또는 지역의 관세율": "35%",
        "Column I - WTO 국가 및 대만과 상호관계를\n 체결한 국가 또는 지역의 관세율": "20%",
        "Column II - 자유무역협정 체결 국가, \n저개발/개발도상 국가 또는 지역의 관세율": "0% (GT,SV,HN,NZ,SG,PY) 20% (PA,NI)"
      }
    });

    expect(destinationDisplayBaseRate(taiwanTariff)).toBe("WTO/상호관계국 20%");
    expect(destinationDisplayAgreementRates(taiwanTariff, "NZL")).toBe("대만-뉴질랜드 경제협력협정 0%");
    expect(destinationDisplayAgreementRates(taiwanTariff, "PAN")).toBe("대만-파나마 FTA 20%");
    expect(destinationDisplayAgreementRates(taiwanTariff, "KOR")).toBe("-");
    expect(destinationDisplayAgreementRates(taiwanTariff, "ALL")).toContain("대만 Column II 특혜관세 0%");
  });

  it("maps Turkey product-group duty while excluding VAT from agreement rates", () => {
    const turkeyTariff = tariff({
      countryCode: "TUR",
      destinationHsCode: "330410001000",
      baseRateText: "",
      agreementRates: {
        부가세율: "20",
        "Industrial Products(format2)": "0"
      }
    });

    expect(destinationDisplayBaseRate(turkeyTariff)).toBe("공산품 0%");
    expect(destinationDisplayAgreementRates(turkeyTariff, "KOR")).toBe("공산품 관세율 0%");
  });

  it("filters South Africa preferences by selected origin", () => {
    const southAfricaTariff = tariff({
      countryCode: "ZAF",
      destinationHsCode: "330410107",
      baseRateText: "20%",
      agreementRates: {
        "EU/UK(유럽/영국)": "free",
        "EFTA(유럽자유무역연합)": "free",
        "SADC(남아프리카 개발 공동체)": "free",
        "AfCFTA(아프리카대륙 자유무역지대)": "10%",
        "MERCOSUR(메르코수르 남미 공동 시장)": "18%"
      }
    });

    expect(destinationDisplayBaseRate(southAfricaTariff)).toBe("20%");
    expect(destinationDisplayAgreementRates(southAfricaTariff, "KOR")).toBe("-");
    expect(destinationDisplayAgreementRates(southAfricaTariff, "GBR")).toBe("남아공-EU/영국 특혜세율 free");
    expect(destinationDisplayAgreementRates(southAfricaTariff, "BRA")).toBe("남아공-MERCOSUR 특혜세율 18%");
    expect(destinationDisplayAgreementRates(southAfricaTariff, "ALL")).toContain("SADC 특혜세율 free");
  });

  it("maps Mongolia APTA preference only for APTA origins", () => {
    const mongoliaTariff = tariff({
      countryCode: "MNG",
      destinationHsCode: "03033100",
      baseRateText: "5%",
      agreementRates: {
        APTA: "3.5%"
      }
    });

    expect(destinationDisplayBaseRate(mongoliaTariff)).toBe("5%");
    expect(destinationDisplayAgreementRates(mongoliaTariff, "KOR")).toBe("아시아태평양무역협정(APTA) 3.5%");
    expect(destinationDisplayAgreementRates(mongoliaTariff, "USA")).toBe("-");
    expect(destinationDisplayAgreementRates(mongoliaTariff, "ALL")).toBe("아시아태평양무역협정(APTA) 3.5%");
  });
});
