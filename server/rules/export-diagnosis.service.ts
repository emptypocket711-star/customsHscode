import { mockHsMasterRecords } from "@/features/hs/mock-hs-data";
import {
  mockExportControlChecks,
  mockExportDestinationTariffRates,
  mockExportFtaCoRecords,
  mockExportRequirements,
  type EffectiveRecord
} from "@/features/export-diagnosis/mock-export-data";
import { countryCodeAliases } from "@/features/export-diagnosis/country-options";
import { createSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase/server";
import {
  findExportDestinationTariffs,
  type ExportDestinationTariffItem
} from "@/server/repositories/export-destination-tariff.repository";

export type ExportDiagnosisInput = {
  hskCode: string;
  basisDate: string;
  destinationCountry?: string;
  finalUser?: string;
  productSpecs?: string;
  productUse?: string;
};

export type ExportDiagnosisResult = {
  hskCode: string;
  hs6: string;
  productName: string;
  basisDate: string;
  requirements: Array<{
    type: string;
    name: string;
    relatedLaw: string;
    agency: string;
    procedureSummary: string;
    buyerDocuments: string[];
    sourceName: string;
    sourceVersion: string;
  }>;
  exportControls: Array<{
    category: string;
    controlNumber: string | null;
    keyword: string;
    specCondition: string;
    selfClassificationNeeded: boolean;
    expertClassificationNeeded: boolean;
    licenseType: string | null;
    staffReviewStatus: "확인 필요";
    sourceName: string;
    sourceVersion: string;
  }>;
  ftaCoOptions: Array<{
    agreementName: string;
    coIssuePossibility: string;
    issueMethod: string;
    originEvidence: string[];
    buyerDocuments: string[];
    staffReviewStatus: "확인 필요";
    sourceName: string;
    sourceVersion: string;
  }>;
  destinationTariffs: ExportDestinationTariffItem[];
  buyerDocumentList: string[];
  notices: string[];
  sourceName: string;
  sourceVersion: string;
};

function normalizeCode(value: string) {
  return value.replace(/[^0-9]/g, "");
}

function normalizeCountry(value?: string) {
  return value?.trim().toUpperCase();
}

function countryMatches(recordCountry: string, selectedCountry?: string) {
  if (!selectedCountry) return true;
  return countryCodeAliases(selectedCountry).includes(recordCountry);
}

function isEffective(record: EffectiveRecord, basisDate: string) {
  return record.status === "published" && record.effective_from <= basisDate && (!record.effective_to || record.effective_to >= basisDate);
}

function requirementTypeLabel(type: string) {
  if (type === "customs_confirmation") {
    return "세관장확인";
  }

  if (type === "integrated_public_notice") {
    return "통합공고";
  }

  return "개별법령";
}

export function diagnoseExport(input: ExportDiagnosisInput): ExportDiagnosisResult | null {
  const hskCode = normalizeCode(input.hskCode);
  const destinationCountry = normalizeCountry(input.destinationCountry);
  const hsRecord = mockHsMasterRecords.find(
    (record) => record.hsk_code === hskCode && record.status === "published" && record.effective_from <= input.basisDate && (!record.effective_to || record.effective_to >= input.basisDate)
  );

  if (!hsRecord) {
    return null;
  }

  const requirements = mockExportRequirements
    .filter((record) => record.hsk_code === hskCode && isEffective(record, input.basisDate))
    .map((record) => ({
      type: requirementTypeLabel(record.requirement_type),
      name: record.requirement_name,
      relatedLaw: record.related_law,
      agency: record.agency,
      procedureSummary: record.procedure_summary,
      buyerDocuments: record.buyer_documents,
      sourceName: record.source_name,
      sourceVersion: record.source_version
    }));

  const exportControls = mockExportControlChecks
    .filter((record) => record.hsk_code === hskCode && isEffective(record, input.basisDate))
    .map((record) => ({
      category: record.control_category,
      controlNumber: record.control_number,
      keyword: record.keyword,
      specCondition: record.spec_condition,
      selfClassificationNeeded: record.self_classification_needed,
      expertClassificationNeeded: record.expert_classification_needed,
      licenseType: record.license_type,
      staffReviewStatus: "확인 필요" as const,
      sourceName: record.source_name,
      sourceVersion: record.source_version
    }));

  const ftaCoOptions = mockExportFtaCoRecords
    .filter((record) => record.hsk_code === hskCode && isEffective(record, input.basisDate))
    .filter((record) => countryMatches(record.destination_country, destinationCountry))
    .map((record) => ({
      agreementName: record.agreement_name,
      coIssuePossibility: record.co_issue_possibility,
      issueMethod: record.issue_method,
      originEvidence: record.origin_evidence,
      buyerDocuments: record.buyer_documents,
      staffReviewStatus: "확인 필요" as const,
      sourceName: record.source_name,
      sourceVersion: record.source_version
    }));
  const destinationTariffs = mockExportDestinationTariffRates
    .filter((record) => countryMatches(record.countryCode, destinationCountry) && record.basisDate === input.basisDate)
    .filter((record) => record.destinationHsCode.startsWith(hskCode.slice(0, 6)))
    .slice(0, 5);

  const buyerDocumentList = Array.from(
    new Set([
      "Commercial Invoice",
      "Packing List",
      ...requirements.flatMap((requirement) => requirement.buyerDocuments),
      ...ftaCoOptions.flatMap((fta) => fta.buyerDocuments)
    ])
  );

  return {
    hskCode,
    hs6: hsRecord.hs6,
    productName: hsRecord.korean_name,
    basisDate: input.basisDate,
    requirements,
    exportControls,
    ftaCoOptions,
    destinationTariffs,
    buyerDocumentList,
    notices: [
      "전략물자 자가판정, 전문판정, 수출허가 또는 법률검토가 필요한 품목일 수 있습니다.",
      "최종사용자, 최종용도, 제품 스펙, 거래상대방 제재 여부 확인이 필요합니다.",
      "FTA C/O 발급 가능성은 한국산 충족 여부와 원산지증빙 확보 여부에 따라 달라질 수 있습니다."
    ],
    sourceName: hsRecord.source_name,
    sourceVersion: hsRecord.source_version
  };
}

export async function getExportDiagnosis(input: ExportDiagnosisInput): Promise<ExportDiagnosisResult | null> {
  const mockResult = diagnoseExport(input);
  if (!mockResult) return null;

  if (!hasSupabaseEnv() || !input.destinationCountry) {
    return mockResult;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const tariffs = await findExportDestinationTariffs(supabase, {
      hskCode: input.hskCode,
      destinationCountry: input.destinationCountry,
      basisDate: input.basisDate
    });

    return {
      ...mockResult,
      destinationTariffs: tariffs.length ? tariffs : mockResult.destinationTariffs
    };
  } catch {
    return mockResult;
  }
}

export const exportDiagnosisInternals = {
  normalizeCode,
  normalizeCountry,
  countryMatches,
  isEffective
};
