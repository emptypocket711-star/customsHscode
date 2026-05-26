import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildCustomsConfirmationQuery,
  buildCustomsExchangeRateQuery,
  buildCustomsHsCodeQuery,
  buildCustomsHsCodeNavigationQuery,
  buildCustomsStatisticalCodeQuery,
  buildCustomsTariffRateQuery,
  parseCustomsExchangeRatesXml,
  parseCustomsHsCodeSearchXml,
  parseCustomsHsCodeNavigationXml,
  parseCustomsStatisticalCodesXml,
  parseCustomsTariffRatesXml,
  parseCustomsConfirmationRequirementsXml,
  hasCustomsOpenApiEnv
} from "@/server/integrations/customs/customs-api";

describe("customs api query helpers", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("detects source-specific service key environment variables", () => {
    vi.stubEnv("CUSTOMS_API_HS_CODE_URL", "https://example.test/hs");
    vi.stubEnv("CUSTOMS_API_HS_CODE_SERVICE_KEY", "source-specific-key");
    vi.stubEnv("CUSTOMS_API_SERVICE_KEY", "");
    vi.stubEnv("PUBLIC_DATA_SERVICE_KEY", "");

    expect(hasCustomsOpenApiEnv("hs_code")).toBe(true);
  });

  it("detects the tariff-rate specific service key", () => {
    vi.stubEnv("CUSTOMS_API_TARIFF_RATE_URL", "https://example.test/tariff");
    vi.stubEnv("CUSTOMS_API_TARIFF_RATE_SERVICE_KEY", "tariff-specific-key");
    vi.stubEnv("CUSTOMS_API_SERVICE_KEY", "");
    vi.stubEnv("PUBLIC_DATA_SERVICE_KEY", "");

    expect(hasCustomsOpenApiEnv("tariff_rate")).toBe(true);
  });

  it("allows API012 exchange-rate lookup with the built-in endpoint and source-specific key", () => {
    vi.stubEnv("CUSTOMS_API_EXCHANGE_RATE_URL", "");
    vi.stubEnv("CUSTOMS_API_EXCHANGE_RATE_SERVICE_KEY", "exchange-specific-key");
    vi.stubEnv("CUSTOMS_API_SERVICE_KEY", "");
    vi.stubEnv("PUBLIC_DATA_SERVICE_KEY", "");

    expect(hasCustomsOpenApiEnv("exchange_rate")).toBe(true);
  });

  it("normalizes hsk and direction for customs confirmation lookup", () => {
    expect(buildCustomsConfirmationQuery({ hskCode: "3304.99-1000", direction: "import" })).toEqual({
      hsSgn: "3304991000",
      imexTp: "2"
    });
  });

  it("normalizes exchange-rate apply date", () => {
    expect(buildCustomsExchangeRateQuery({ applyStartDate: "2026-05-22", direction: "export" })).toEqual({
      qryYymmDd: "20260522",
      imexTp: "1"
    });
    expect(buildCustomsExchangeRateQuery({ applyStartDate: "2026-05-22", direction: "import" })).toEqual({
      qryYymmDd: "20260522",
      imexTp: "2"
    });
  });

  it("normalizes tariff-rate hsk query", () => {
    expect(buildCustomsTariffRateQuery({ hskCode: "3304.10-1000", tariffTypeCode: "A" })).toEqual({
      hsSgn: "3304101000",
      trrtTpcd: "A"
    });
  });

  it("builds HS code search query by code or Korean product name", () => {
    expect(buildCustomsHsCodeQuery({ hskCode: "3304.10-1000" })).toEqual({
      hsSgn: "3304101000",
      prnm: undefined,
      koenTp: "1"
    });
    expect(buildCustomsHsCodeQuery({ productName: "립밤", language: "ko" })).toEqual({
      hsSgn: undefined,
      prnm: "립밤",
      koenTp: "1"
    });
  });

  it("builds HS code navigation query with wildcard pattern", () => {
    expect(buildCustomsHsCodeNavigationQuery({ hskPattern: "01*******0" })).toEqual({
      hsSgn: "01*******0"
    });
  });

  it("builds statistical-code query", () => {
    expect(buildCustomsStatisticalCodeQuery({ codeType: "A01", codeName: "보석" })).toEqual({
      statsSgnTp: "A01",
      cdValtValNm: "보석",
      cdValtVal: undefined
    });
  });

  it("parses customs confirmation requirement XML items", () => {
    const items = parseCustomsConfirmationRequirementsXml(`
      <ccctLworCdQryRtnVo>
        <ccctLworCdQryRsltVo>
          <hsSgn>3307902000</hsSgn>
          <imexTp>2</imexTp>
          <reqApreIttCd>243</reqApreIttCd>
          <aplyEndDt/>
          <dcerCfrmLworNm>화장품법</dcerCfrmLworNm>
          <reqCfrmIstmNm>표준통관예정보고서(화장품)</reqCfrmIstmNm>
          <aplyStrtDt>20140101</aplyStrtDt>
          <reqApreIttNm>한국의약품수출입협회</reqApreIttNm>
          <dcerCfrmLworCd>70</dcerCfrmLworCd>
        </ccctLworCdQryRsltVo>
      </ccctLworCdQryRtnVo>
    `);

    expect(items).toEqual([
      {
        hskCode: "3307902000",
        direction: "import",
        lawCode: "70",
        relatedLaw: "화장품법",
        agencyCode: "243",
        agency: "한국의약품수출입협회",
        requirementDocumentName: "표준통관예정보고서(화장품)",
        effectiveFrom: "2014-01-01",
        effectiveTo: null
      }
    ]);
  });

  it("parses customs tariff-rate XML items", () => {
    const items = parseCustomsTariffRatesXml(`
      <trrtQryRtnVo>
        <trrtQryRsltVo>
          <basePrc/>
          <hsSgn>3304101000</hsSgn>
          <prutXamt/>
          <trrtTpcd>A</trrtTpcd>
          <trrtTpNm>기본세율</trrtTpNm>
          <aplyEndDt>20261231</aplyEndDt>
          <aplyStrtDt>20260101</aplyStrtDt>
          <trrt>8</trrt>
        </trrtQryRsltVo>
      </trrtQryRtnVo>
    `);

    expect(items).toEqual([
      {
        hskCode: "3304101000",
        rateTypeCode: "A",
        rateTypeName: "기본세율",
        dutyRate: "8",
        unitDuty: "",
        basePrice: "",
        effectiveFrom: "2026-01-01",
        effectiveTo: "2026-12-31"
      }
    ]);
  });

  it("parses customs HS code search XML items", () => {
    const items = parseCustomsHsCodeSearchXml(`
      <hsSgnSrchRtnVo>
        <hsSgnSrchRsltVo>
          <qtyUt/>
          <hsSgn>0302440000</hsSgn>
          <wghtUt>KG</wghtUt>
          <englPrnm/>
          <txrt>20</txrt>
          <korePrnm>고등어</korePrnm>
          <txtpSgn>A</txtpSgn>
        </hsSgnSrchRsltVo>
      </hsSgnSrchRtnVo>
    `);

    expect(items).toEqual([
      {
        hskCode: "0302440000",
        koreanName: "고등어",
        englishName: "",
        quantityUnit: "",
        weightUnit: "KG",
        rateText: "20",
        rateTypeCode: "A"
      }
    ]);
  });

  it("parses customs HS code navigation XML items", () => {
    const items = parseCustomsHsCodeNavigationXml(`
      <cmtrStatsQryRtnVo>
        <cmtrStatsQryRsltVo>
          <hs10Sgn>01*******0</hs10Sgn>
          <prlstNm>WOMENS ACCESSORIES</prlstNm>
          <acrsTcntRnk>1</acrsTcntRnk>
          <prlstLnCnt>2</prlstLnCnt>
        </cmtrStatsQryRsltVo>
      </cmtrStatsQryRtnVo>
    `);

    expect(items).toEqual([
      {
        hskCodePattern: "01*******0",
        productName: "WOMENS ACCESSORIES",
        rank: "1",
        lineCount: "2"
      }
    ]);
  });

  it("parses customs exchange-rate XML items", () => {
    const items = parseCustomsExchangeRatesXml(`
      <trifFxrtInfoQryRtnVo>
        <trifFxrtInfoQryRsltVo>
          <cntySgn>VN</cntySgn>
          <mtryUtNm>Dong</mtryUtNm>
          <fxrt>0.0509</fxrt>
          <currSgn>VND</currSgn>
          <aplyBgnDt>20141228</aplyBgnDt>
          <imexTp>1</imexTp>
        </trifFxrtInfoQryRsltVo>
      </trifFxrtInfoQryRtnVo>
    `);

    expect(items).toEqual([
      {
        countryCode: "VN",
        currencyUnitName: "Dong",
        currencyCode: "VND",
        rate: "0.0509",
        effectiveFrom: "2014-12-28",
        direction: "export"
      }
    ]);
  });

  it("parses customs statistical-code XML items", () => {
    const items = parseCustomsStatisticalCodesXml(`
      <statsSgnQryRtnVo>
        <othStatsSgnQryVo>
          <itxRt>20.00</itxRt>
          <koreBrkd>보석·진주 등과 이를 사용한 제품</koreBrkd>
          <statsSgn>A411000</statsSgn>
        </othStatsSgnQryVo>
        <statsSgnQryVo2>
          <cdValtVal>411000</cdValtVal>
          <cdValtValNm>보석·진주 등과 이를 사용한 제품</cdValtValNm>
          <englAbrtNm>JEWEL</englAbrtNm>
          <valtValEnglRmrkCn>remark</valtValEnglRmrkCn>
        </statsSgnQryVo2>
      </statsSgnQryRtnVo>
    `, "A01");

    expect(items).toEqual([
      {
        codeType: "A01",
        code: "A411000",
        koreanName: "보석·진주 등과 이를 사용한 제품",
        koreanAbbreviation: "",
        englishAbbreviation: "",
        englishNote: "",
        internalTaxRate: "20.00"
      },
      {
        codeType: "A01",
        code: "411000",
        koreanName: "보석·진주 등과 이를 사용한 제품",
        koreanAbbreviation: "",
        englishAbbreviation: "JEWEL",
        englishNote: "remark",
        internalTaxRate: ""
      }
    ]);
  });
});
