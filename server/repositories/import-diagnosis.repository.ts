import type { SupabaseClient } from "@supabase/supabase-js";
import type { ImportDiagnosisInput, ImportDiagnosisResult } from "@/server/rules/import-diagnosis.service";

type HsMasterRow = {
  hsk_code: string;
  hs6: string;
  korean_name: string;
  source_name: string;
  source_version: string;
};

type TariffRow = {
  rate_type: string;
  duty_rate: number | null;
  unit_duty: number | null;
  country_group: string | null;
  source_name: string;
  source_version: string;
};

type FtaAgreementRow = {
  id: string;
  agreement_name: string;
  country_code: string;
  country_name: string;
  co_issue_method: string | null;
  issuer: string | null;
  source_name: string;
  source_version: string;
};

type FtaRateRow = {
  agreement_id: string;
  preferential_rate: number | null;
  source_name: string;
  source_version: string;
};

type FtaPsrRow = {
  agreement_id: string;
  psr_description: string;
  required_documents: unknown;
};

type CustomsRequirementRow = {
  requirement_document_name: string;
  related_law: string;
  law_code: string | null;
  agency_code: string | null;
  agency: string | null;
  source_name: string;
  source_version: string;
};

type PublicNoticeRequirementRow = {
  requirement_name: string;
  related_law: string;
  agency: string | null;
  procedure_summary: string | null;
  source_name: string;
  source_version: string;
};

type PlaybookRow = {
  requirement_document_name: string;
  application_method: string | null;
  required_documents: unknown;
  expected_lead_time: string | null;
  customer_request_template: string | null;
  staff_checklist: unknown;
};

export function normalizeImportHskCode(value: string) {
  return value.replace(/[^0-9]/g, "");
}

export function getImportCountryCandidates(input: ImportDiagnosisInput) {
  return [input.originCountry, input.exportCountry, input.shipmentCountry, input.manufacturingCountry, input.sellerCountry]
    .filter(Boolean)
    .map((value) => value!.trim().toUpperCase());
}

function asStringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function rateText(rate: number | null, unitDuty: number | null) {
  if (rate !== null) return `${rate}%`;
  if (unitDuty !== null) return `종량세 ${unitDuty}`;
  return "추가 확인 필요";
}

function tariffLabel(rateType: string, rateTypeName?: string | null) {
  if (rateTypeName) return rateTypeName;
  const normalized = rateType.toLowerCase();
  if (normalized === "basic" || normalized === "a") return "기본세율";
  if (normalized === "wto" || normalized === "c") return "WTO 협정세율";
  return rateType;
}

function requirementTypeLabel(type: "customs" | "notice") {
  return type === "customs" ? "세관장확인" : "통합공고";
}

export async function diagnoseImportFromSupabase(
  supabase: SupabaseClient,
  input: ImportDiagnosisInput
): Promise<ImportDiagnosisResult | null> {
  const hskCode = normalizeImportHskCode(input.hskCode);
  const hs6 = hskCode.slice(0, 6);

  const { data: hsRecord, error: hsError } = await supabase
    .from("hs_master")
    .select("hsk_code, hs6, korean_name, source_name, source_version")
    .eq("hsk_code", hskCode)
    .lte("effective_from", input.basisDate)
    .or(`effective_to.is.null,effective_to.gte.${input.basisDate}`)
    .eq("status", "published")
    .maybeSingle();

  if (hsError) throw new Error(hsError.message);
  if (!hsRecord) return null;

  const hs = hsRecord as HsMasterRow;

  const { data: tariffRows, error: tariffError } = await supabase
    .from("tariff_rates")
    .select("rate_type, duty_rate, unit_duty, country_group, source_name, source_version")
    .eq("hsk_code", hskCode)
    .lte("effective_from", input.basisDate)
    .or(`effective_to.is.null,effective_to.gte.${input.basisDate}`)
    .eq("status", "published")
    .order("rate_type");

  if (tariffError) throw new Error(tariffError.message);

  const countries = getImportCountryCandidates(input);
  const agreementQuery = supabase
    .from("fta_agreements")
    .select("id, agreement_name, country_code, country_name, co_issue_method, issuer, source_name, source_version")
    .lte("effective_from", input.basisDate)
    .or(`effective_to.is.null,effective_to.gte.${input.basisDate}`)
    .eq("status", "published");

  const { data: agreementRows, error: agreementError } = countries.length
    ? await agreementQuery.in("country_code", countries)
    : await agreementQuery;

  if (agreementError) throw new Error(agreementError.message);

  const agreements = (agreementRows ?? []) as FtaAgreementRow[];
  const agreementIds = agreements.map((agreement) => agreement.id);

  const { data: ftaRateRows, error: ftaRateError } = agreementIds.length
    ? await supabase
        .from("fta_rates")
        .select("agreement_id, preferential_rate, source_name, source_version")
        .in("agreement_id", agreementIds)
        .or(`hsk_code.eq.${hskCode},hs6.eq.${hs6}`)
        .lte("effective_from", input.basisDate)
        .or(`effective_to.is.null,effective_to.gte.${input.basisDate}`)
        .eq("status", "published")
    : { data: [], error: null };

  if (ftaRateError) throw new Error(ftaRateError.message);

  const { data: psrRows, error: psrError } = agreementIds.length
    ? await supabase
        .from("fta_psr")
        .select("agreement_id, psr_description, required_documents")
        .in("agreement_id", agreementIds)
        .eq("hs6", hs6)
        .lte("effective_from", input.basisDate)
        .or(`effective_to.is.null,effective_to.gte.${input.basisDate}`)
        .eq("status", "published")
    : { data: [], error: null };

  if (psrError) throw new Error(psrError.message);

  const ftaRates = (ftaRateRows ?? []) as FtaRateRow[];
  const psrs = (psrRows ?? []) as FtaPsrRow[];

  const { data: customsRows, error: customsError } = await supabase
    .from("customs_confirmation_requirements")
    .select("requirement_document_name, related_law, law_code, agency_code, agency, source_name, source_version")
    .eq("hsk_code", hskCode)
    .eq("direction", "import")
    .lte("effective_from", input.basisDate)
    .or(`effective_to.is.null,effective_to.gte.${input.basisDate}`)
    .eq("status", "published");

  if (customsError) throw new Error(customsError.message);

  const { data: noticeRows, error: noticeError } = await supabase
    .from("integrated_public_notice_requirements")
    .select("requirement_name, related_law, agency, procedure_summary, source_name, source_version")
    .eq("hsk_code", hskCode)
    .eq("direction", "import")
    .lte("effective_from", input.basisDate)
    .or(`effective_to.is.null,effective_to.gte.${input.basisDate}`)
    .eq("status", "published");

  if (noticeError) throw new Error(noticeError.message);

  const requirementNames = [
    ...((customsRows ?? []) as CustomsRequirementRow[]).map((row) => row.requirement_document_name),
    ...((noticeRows ?? []) as PublicNoticeRequirementRow[]).map((row) => row.requirement_name)
  ];
  const { data: playbookRows, error: playbookError } = requirementNames.length
    ? await supabase
        .from("requirement_playbooks")
        .select("requirement_document_name, application_method, required_documents, expected_lead_time, customer_request_template, staff_checklist")
        .in("requirement_document_name", requirementNames)
        .lte("effective_from", input.basisDate)
        .or(`effective_to.is.null,effective_to.gte.${input.basisDate}`)
        .eq("status", "published")
    : { data: [], error: null };

  if (playbookError) throw new Error(playbookError.message);

  const playbooks = new Map(((playbookRows ?? []) as PlaybookRow[]).map((row) => [row.requirement_document_name, row]));
  const requirements = [
    ...((customsRows ?? []) as CustomsRequirementRow[]).map((row) => {
      const playbook = playbooks.get(row.requirement_document_name);
      return {
        type: requirementTypeLabel("customs"),
        name: row.requirement_document_name,
        relatedLaw: row.related_law,
        agency: row.agency ?? "관계기관 확인 필요",
        procedureSummary: "세관장확인 수입요건 가능성 있음.",
        playbook: playbook
          ? {
              applicationMethod: playbook.application_method ?? "추가 확인 필요",
              requiredDocuments: asStringList(playbook.required_documents),
              expectedLeadTime: playbook.expected_lead_time ?? "추가 확인 필요",
              customerRequestTemplate: playbook.customer_request_template ?? "추가 확인 필요",
              staffChecklist: asStringList(playbook.staff_checklist)
            }
          : undefined,
        sourceName: row.source_name,
        sourceVersion: row.source_version
      };
    }),
    ...((noticeRows ?? []) as PublicNoticeRequirementRow[]).map((row) => {
      const playbook = playbooks.get(row.requirement_name);
      return {
        type: requirementTypeLabel("notice"),
        name: row.requirement_name,
        relatedLaw: row.related_law,
        agency: row.agency ?? "관계기관 확인 필요",
        procedureSummary: row.procedure_summary ?? "통합공고 수입요건 가능성 있음.",
        playbook: playbook
          ? {
              applicationMethod: playbook.application_method ?? "추가 확인 필요",
              requiredDocuments: asStringList(playbook.required_documents),
              expectedLeadTime: playbook.expected_lead_time ?? "추가 확인 필요",
              customerRequestTemplate: playbook.customer_request_template ?? "추가 확인 필요",
              staffChecklist: asStringList(playbook.staff_checklist)
            }
          : undefined,
        sourceName: row.source_name,
        sourceVersion: row.source_version
      };
    })
  ];

  return {
    hskCode,
    hs6: hs.hs6,
    basisDate: input.basisDate,
    productName: hs.korean_name,
    tariffs: ((tariffRows ?? []) as TariffRow[]).map((row) => ({
      label: tariffLabel(row.rate_type, row.country_group),
      rateText: rateText(row.duty_rate, row.unit_duty),
      sourceName: row.source_name,
      sourceVersion: row.source_version
    })),
    ftaOptions: agreements
      .map((agreement) => {
        const rate = ftaRates.find((row) => row.agreement_id === agreement.id);
        const psr = psrs.find((row) => row.agreement_id === agreement.id);
        if (!rate) return null;
        return {
          agreementName: agreement.agreement_name,
          countryName: agreement.country_name,
          preferentialRateText: rate.preferential_rate === null ? "추가 확인 필요" : `${rate.preferential_rate}%`,
          coType: agreement.co_issue_method ?? "추가 확인 필요",
          issueMethod: agreement.co_issue_method ?? "추가 확인 필요",
          issuer: agreement.issuer ?? "추가 확인 필요",
          originRule: psr?.psr_description ?? "원산지결정기준 추가 확인 필요",
          directTransportIssue: "직접운송 증빙 확인 필요",
          requiredEvidence: psr ? asStringList(psr.required_documents) : ["C/O", "운송서류", "원산지 입증자료"],
          staffReviewStatus: "확인 필요" as const,
          sourceName: rate.source_name || agreement.source_name,
          sourceVersion: rate.source_version || agreement.source_version
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item)),
    requirements,
    notices: [
      "품목분류, 세율, FTA, 요건 해당 여부는 신고시점의 법령과 원문 기준으로 달라질 수 있습니다.",
      "FTA 적용은 선적국만으로 판단하지 않으며 수출국, 선적국, 원산지, 제조국, 판매국, 목적국 정보를 분리 확인해야 합니다.",
      "세관장확인대상이 아니더라도 통합공고, 개별법령, 표시·인증·유통규제 의무가 존재할 수 있습니다."
    ],
    sourceName: hs.source_name,
    sourceVersion: hs.source_version
  };
}
