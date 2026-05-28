import { mockHsMasterRecords } from "@/features/hs/mock-hs-data";
import {
  mockFtaRates,
  mockImportRequirements,
  mockRequirementPlaybooks,
  mockTariffRates,
  type EffectiveRecord
} from "@/features/import-diagnosis/mock-import-data";
import { createSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase/server";
import { diagnoseImportFromSupabase } from "@/server/repositories/import-diagnosis.repository";
import { allowLegalMockFallback } from "@/server/rules/legal-mock-policy";

export type ImportDiagnosisInput = {
  hskCode: string;
  basisDate: string;
  exportCountry?: string;
  shipmentCountry?: string;
  originCountry?: string;
  manufacturingCountry?: string;
  sellerCountry?: string;
  destinationCountry?: string;
};

export type ImportDiagnosisResult = {
  hskCode: string;
  hs6: string;
  basisDate: string;
  productName: string;
  tariffs: Array<{
    label: string;
    rateText: string;
    sourceName: string;
    sourceVersion: string;
  }>;
  ftaOptions: Array<{
    agreementName: string;
    countryName: string;
    preferentialRateText: string;
    coType: string;
    issueMethod: string;
    issuer: string;
    originRule: string;
    directTransportIssue: string;
    requiredEvidence: string[];
    staffReviewStatus: "확인 필요";
    sourceName: string;
    sourceVersion: string;
  }>;
  requirements: Array<{
    type: string;
    name: string;
    relatedLaw: string;
    agency: string;
    procedureSummary: string;
    playbook?: {
      applicationMethod: string;
      requiredDocuments: string[];
      expectedLeadTime: string;
      customerRequestTemplate: string;
      staffChecklist: string[];
    };
    sourceName: string;
    sourceVersion: string;
  }>;
  notices: string[];
  sourceName: string;
  sourceVersion: string;
};

function normalizeCode(value: string) {
  return value.replace(/[^0-9]/g, "");
}

function isEffective(record: EffectiveRecord, basisDate: string) {
  return record.status === "published" && record.effective_from <= basisDate && (!record.effective_to || record.effective_to >= basisDate);
}

function countryCandidates(input: ImportDiagnosisInput) {
  return [input.originCountry, input.exportCountry, input.shipmentCountry, input.manufacturingCountry, input.sellerCountry]
    .filter(Boolean)
    .map((value) => value!.trim().toUpperCase());
}

export function diagnoseImport(input: ImportDiagnosisInput): ImportDiagnosisResult | null {
  const hskCode = normalizeCode(input.hskCode);
  const hsRecord = mockHsMasterRecords.find(
    (record) => record.hsk_code === hskCode && record.status === "published" && record.effective_from <= input.basisDate && (!record.effective_to || record.effective_to >= input.basisDate)
  );

  if (!hsRecord) {
    return null;
  }

  const tariffs = mockTariffRates
    .filter((record) => record.hsk_code === hskCode && isEffective(record, input.basisDate))
    .map((record) => ({
      label: record.rate_type === "basic" ? "기본세율" : record.rate_type === "wto" ? "WTO 협정세율" : record.country_group ?? record.rate_type,
      rateText: `${record.duty_rate}%`,
      sourceName: record.source_name,
      sourceVersion: record.source_version
    }));

  const countries = countryCandidates(input);
  const ftaOptions = mockFtaRates
    .filter((record) => record.hsk_code === hskCode && isEffective(record, input.basisDate))
    .filter((record) => countries.length === 0 || countries.includes(record.country_code))
    .map((record) => ({
      agreementName: record.agreement_name,
      countryName: record.country_name,
      preferentialRateText: record.preferential_rate === null ? "추가 확인 필요" : `${record.preferential_rate}%`,
      coType: record.co_type,
      issueMethod: record.issue_method,
      issuer: record.issuer,
      originRule: record.origin_rule,
      directTransportIssue: record.direct_transport_issue,
      requiredEvidence: record.required_evidence,
      staffReviewStatus: "확인 필요" as const,
      sourceName: record.source_name,
      sourceVersion: record.source_version
    }));

  const requirements = mockImportRequirements
    .filter((record) => record.hsk_code === hskCode && isEffective(record, input.basisDate))
    .map((record) => {
      const playbook = mockRequirementPlaybooks.find((item) => item.requirement_name === record.requirement_name && isEffective(item, input.basisDate));
      return {
        type:
          record.requirement_type === "customs_confirmation"
            ? "세관장확인"
            : record.requirement_type === "integrated_public_notice"
              ? "통합공고"
              : "개별법령",
        name: record.requirement_name,
        relatedLaw: record.related_law,
        agency: record.agency,
        procedureSummary: record.procedure_summary,
        playbook: playbook
          ? {
              applicationMethod: playbook.application_method,
              requiredDocuments: playbook.required_documents,
              expectedLeadTime: playbook.expected_lead_time,
              customerRequestTemplate: playbook.customer_request_template,
              staffChecklist: playbook.staff_checklist
            }
          : undefined,
        sourceName: record.source_name,
        sourceVersion: record.source_version
      };
    });

  return {
    hskCode,
    hs6: hsRecord.hs6,
    basisDate: input.basisDate,
    productName: hsRecord.korean_name,
    tariffs,
    ftaOptions,
    requirements,
    notices: [
      "품목분류, 세율, FTA, 요건 해당 여부는 신고시점의 법령과 원문 기준으로 달라질 수 있습니다.",
      "FTA 적용은 선적국만으로 판단하지 않으며 수출국, 선적국, 원산지, 제조국, 판매국, 목적국 정보를 분리 확인해야 합니다.",
      "세관장확인대상이 아니더라도 통합공고, 개별법령, 표시·인증·유통규제 의무가 존재할 수 있습니다."
    ],
    sourceName: hsRecord.source_name,
    sourceVersion: hsRecord.source_version
  };
}

export async function getImportDiagnosis(input: ImportDiagnosisInput): Promise<ImportDiagnosisResult | null> {
  if (!hasSupabaseEnv()) {
    return diagnoseImport(input);
  }

  try {
    const supabase = await createSupabaseServerClient();
    return await diagnoseImportFromSupabase(supabase, input);
  } catch {
    return allowLegalMockFallback() ? diagnoseImport(input) : null;
  }
}

export const importDiagnosisInternals = {
  normalizeCode,
  countryCandidates,
  isEffective
};
