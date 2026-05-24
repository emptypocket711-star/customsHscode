import { describe, expect, it } from "vitest";
import {
  destinationHsLookupCodes,
  mapExportDestinationDataSourceRow,
  mapExportDestinationImportRequirementRow,
  mapExportDestinationInternalTaxRow,
  preferMostSpecificImportRequirementRows,
  preferMostSpecificInternalTaxRows,
  preferSelectedCountryInternalTaxRows,
  preferMostSpecificTradeRemedyCaseRows
} from "@/server/repositories/export-destination-import-data.repository";

describe("export destination import data repository helpers", () => {
  it("derives exact-to-parent destination hs lookup codes", () => {
    expect(destinationHsLookupCodes("3304.99.1000")).toEqual(["3304991000", "33049910", "330499", "3304"]);
  });

  it("maps destination import requirement rows", () => {
    const item = mapExportDestinationImportRequirementRow(
      {
        country_code: "GB",
        destination_hs_code: "330499",
        requirement_type: "product_standard",
        requirement_name: "Cosmetics product safety notification",
        agency: "Office for Product Safety and Standards",
        legal_basis: "UK cosmetics regulation",
        procedure_summary: "Notify before placing on the market.",
        required_documents: ["product information file", "responsible person"],
        notes: null,
        source_name: "GOV.UK Trade Tariff API",
        source_url: "https://www.trade-tariff.service.gov.uk/uk/api",
        source_version: "hmrc-trade-tariff-20260523"
      },
      "2026-05-23"
    );

    expect(item.requiredDocuments).toEqual(["product information file", "responsible person"]);
    expect(item.basisDate).toBe("2026-05-23");
  });

  it("maps destination internal tax rows", () => {
    const item = mapExportDestinationInternalTaxRow(
      {
        country_code: "GB",
        destination_hs_code: "330499",
        tax_type: "vat",
        tax_name: "VAT",
        rate_text: "20%",
        basis: "standard rate",
        notes: null,
        source_name: "GOV.UK Trade Tariff API",
        source_url: "https://www.trade-tariff.service.gov.uk/uk/api",
        source_version: "hmrc-trade-tariff-20260523"
      },
      "2026-05-23"
    );

    expect(item.taxName).toBe("VAT");
    expect(item.rateText).toBe("20%");
  });

  it("keeps the most specific matching internal tax row per tax source", () => {
    const rows = [
      {
        countryCode: "CHN",
        destinationHsCode: "33049900",
        taxType: "vat",
        taxName: "수입 부가가치세",
        rateText: "13%",
        basis: "general",
        notes: null,
        sourceName: "VAT law",
        sourceUrl: "https://example.com",
        sourceVersion: "china-import-internal-tax-2026:vat-general-13",
        basisDate: "2026-05-23"
      },
      {
        countryCode: "CHN",
        destinationHsCode: "3304990010",
        taxType: "vat",
        taxName: "수입 부가가치세",
        rateText: "13%",
        basis: "general",
        notes: null,
        sourceName: "VAT law",
        sourceUrl: "https://example.com",
        sourceVersion: "china-import-internal-tax-2026:vat-general-13",
        basisDate: "2026-05-23"
      }
    ];

    expect(preferMostSpecificInternalTaxRows(rows)).toHaveLength(1);
    expect(preferMostSpecificInternalTaxRows(rows)[0]?.destinationHsCode).toBe("3304990010");
  });

  it("sorts positive tax rows before no VAT/GST display rows", () => {
    const rows = [
      {
        countryCode: "MYS",
        destinationHsCode: "3304100000",
        taxType: "vat",
        taxName: "수입 VAT/GST",
        rateText: "없음",
        basis: "말레이시아 일반 VAT/GST 없음",
        notes: null,
        sourceName: "Royal Malaysian Customs Department Sales Tax",
        sourceUrl: "https://example.com",
        sourceVersion: "malaysia-import-data-20260523:no-general-vat-gst",
        basisDate: "2026-05-23"
      },
      {
        countryCode: "MYS",
        destinationHsCode: "3304100000",
        taxType: "sales_tax",
        taxName: "수입 SST(판매세)",
        rateText: "5%",
        basis: "말레이시아 수입 SST 판매세 후보",
        notes: null,
        sourceName: "mySST Sales Tax Orders",
        sourceUrl: "https://example.com",
        sourceVersion: "malaysia-import-data-20260523:sales_tax",
        basisDate: "2026-05-23"
      }
    ];

    expect(preferMostSpecificInternalTaxRows(rows).map((row) => row.taxName)).toEqual(["수입 SST(판매세)", "수입 VAT/GST"]);
  });

  it("keeps member VAT instead of generic EU VAT when a member state is selected", () => {
    const rows = [
      {
        countryCode: "EEC",
        destinationHsCode: "3304990000",
        taxType: "vat",
        taxName: "수입 VAT",
        rateText: "회원국별",
        basis: "EU VAT",
        notes: null,
        sourceName: "European Commission",
        sourceUrl: "https://example.com",
        sourceVersion: "eu-import-data-20260523:eec-vat",
        basisDate: "2026-05-23"
      },
      {
        countryCode: "DEU",
        destinationHsCode: "3304990000",
        taxType: "vat",
        taxName: "수입 VAT",
        rateText: "19%",
        basis: "독일 VAT",
        notes: null,
        sourceName: "European Commission",
        sourceUrl: "https://example.com",
        sourceVersion: "eu-import-data-20260523:vat",
        basisDate: "2026-05-23"
      }
    ];

    expect(preferSelectedCountryInternalTaxRows(rows, "DEU")).toEqual([rows[1]]);
    expect(preferSelectedCountryInternalTaxRows(rows, "DE")).toEqual([rows[1]]);
    expect(preferSelectedCountryInternalTaxRows(rows, "EEC")).toEqual([rows[0]]);
  });

  it("keeps the most specific matching import requirement row per source", () => {
    const rows = [
      {
        countryCode: "CHN",
        destinationHsCode: "3304",
        requirementType: "cosmetics_registration",
        requirementName: "중국 화장품 등록/비안",
        agency: "NMPA",
        legalBasis: "Cosmetics regulation",
        procedureSummary: null,
        requiredDocuments: [],
        notes: null,
        sourceName: "NMPA",
        sourceUrl: "https://example.com",
        sourceVersion: "china-cosmetics-import-requirements-2026",
        basisDate: "2026-05-23"
      },
      {
        countryCode: "CHN",
        destinationHsCode: "33049900",
        requirementType: "cosmetics_registration",
        requirementName: "중국 화장품 등록/비안",
        agency: "NMPA",
        legalBasis: "Cosmetics regulation",
        procedureSummary: null,
        requiredDocuments: [],
        notes: null,
        sourceName: "NMPA",
        sourceUrl: "https://example.com",
        sourceVersion: "china-cosmetics-import-requirements-2026",
        basisDate: "2026-05-23"
      }
    ];

    expect(preferMostSpecificImportRequirementRows(rows)).toHaveLength(1);
    expect(preferMostSpecificImportRequirementRows(rows)[0]?.destinationHsCode).toBe("33049900");
  });

  it("keeps the most specific matching trade remedy case row per case and origin", () => {
    const rows = [
      {
        countryCode: "USA",
        destinationHsCode: "7308",
        remedyType: "AD",
        caseNumber: "A570123",
        caseTitle: "Steel article",
        originCountryCode: "CHN",
        producerExporter: null,
        rateText: "25%",
        scopeSummary: "Scope controls applicability.",
        legalBasis: "CBP ACE AD/CVD active case reference",
        notes: null,
        sourceName: "CBP ACE ES-105 Active AD/CVD Case Report",
        sourceUrl: "https://www.cbp.gov/trade/priority-issues/adcvd/data",
        sourceVersion: "us-cbp-adcvd-active-cases-test",
        basisDate: "2026-05-23"
      },
      {
        countryCode: "USA",
        destinationHsCode: "7308100000",
        remedyType: "AD",
        caseNumber: "A570123",
        caseTitle: "Steel article",
        originCountryCode: "CHN",
        producerExporter: null,
        rateText: "25%",
        scopeSummary: "Scope controls applicability.",
        legalBasis: "CBP ACE AD/CVD active case reference",
        notes: null,
        sourceName: "CBP ACE ES-105 Active AD/CVD Case Report",
        sourceUrl: "https://www.cbp.gov/trade/priority-issues/adcvd/data",
        sourceVersion: "us-cbp-adcvd-active-cases-test",
        basisDate: "2026-05-23"
      }
    ];

    expect(preferMostSpecificTradeRemedyCaseRows(rows)).toHaveLength(1);
    expect(preferMostSpecificTradeRemedyCaseRows(rows)[0]?.destinationHsCode).toBe("7308100000");
  });

  it("maps destination data source registry rows", () => {
    const item = mapExportDestinationDataSourceRow({
      country_code: "CHN",
      data_category: "tariff",
      source_name: "General Administration of Customs of China tariff search",
      source_url: "https://online.customs.gov.cn/ociswebserver/pages/jckspsl/index.html",
      source_version: "destination-source-registry-20260523",
      access_method: "html",
      connector_status: "planned",
      notes: "Official China Customs tariff search page."
    });

    expect(item.countryCode).toBe("CHN");
    expect(item.dataCategory).toBe("tariff");
  });
});
