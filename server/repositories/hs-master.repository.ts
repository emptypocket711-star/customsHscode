import type { SupabaseClient } from "@supabase/supabase-js";
import { buildHsHierarchyPath, hsAncestorCodes, type HsHierarchyNode } from "@/lib/hs-hierarchy";
import { buildHsBriefDescription } from "@/lib/hs-summary";
import { hasSupabaseEnv, createSupabaseServerClient } from "@/lib/supabase/server";
import {
  mockHsMasterRecords,
  mockHsClassificationCases,
  mockStandardProductNames,
  type HsClassificationCaseRecord,
  type HsMasterRecord,
  type StandardProductNameRecord
} from "@/features/hs/mock-hs-data";
import { mockImportRequirements, mockTariffRates } from "@/features/import-diagnosis/mock-import-data";

type TariffRatePreviewRecord = {
  hsk_code: string;
  rate_type: string;
  duty_rate: number | null;
  unit_duty: number | null;
  country_group: string | null;
  usage_rate_type: string | null;
  source_name: string;
  source_version: string;
  effective_from: string;
  effective_to: string | null;
  status: string;
};

type ImportRequirementPreviewRecord = {
  hsk_code: string;
  requirement_type?: string;
  requirement_document_name: string;
  related_law: string;
  agency_code?: string | null;
  agency: string | null;
  agency_contact?: RequirementAgencyContact | null;
  procedure_summary?: string | null;
  playbook?: RequirementPlaybookRecord | null;
  source_name: string;
  source_version: string;
  effective_from: string;
  effective_to: string | null;
  status: string;
};

type IntegratedPublicNoticeRequirementRow = {
  hsk_code: string;
  requirement_name: string;
  related_law: string;
  agency: string | null;
  procedure_summary: string | null;
  source_name: string;
  source_version: string;
  effective_from: string;
  effective_to: string | null;
  status: string;
};

type RequirementPlaybookRecord = {
  requirement_document_name: string;
  related_law: string;
  agency: string | null;
  application_method: string | null;
  required_documents: unknown;
  expected_lead_time: string | null;
  exemption_possibility: string | null;
  common_rejection_reasons: unknown;
  customer_request_template: string | null;
  staff_checklist: unknown;
  category: string | null;
  risk_level: string | null;
  workflow_type: string | null;
  workflow_steps: unknown;
  source_name: string;
  source_url: string;
  source_version: string;
  effective_from: string;
  effective_to: string | null;
  status: string;
};

type OriginMarkingTargetRecord = {
  hsk_pattern: string;
  pattern_type: string;
  condition_text: string | null;
  is_target: boolean;
  source_name: string;
  source_url: string;
  source_version: string;
  effective_from: string;
  effective_to: string | null;
  status: string;
};

type OriginMarkingMethodRecord = {
  hsk_pattern: string;
  pattern_type: string;
  item_name: string;
  method_summary: string;
  note: string | null;
  source_name: string;
  source_url: string;
  source_version: string;
  effective_from: string;
  effective_to: string | null;
  status: string;
};

type RequirementAgencyContact = {
  agencyCode: string | null;
  agencyName: string;
  phone: string | null;
  email: string | null;
  websiteUrl: string | null;
  note: string | null;
};

export type HsDirectLookupResult = {
  hskCode: string;
  hs6: string;
  koreanName: string;
  briefDescription: string;
  englishName: string | null;
  importNatureCode: string | null;
  exportNatureCode: string | null;
  quantityUnit: string | null;
  weightUnit: string | null;
  basisDate: string;
  sourceName: string;
  sourceUrl: string;
  sourceVersion: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  publishedAt: string | null;
  retrievedAt: string;
  checksum: string | null;
  standardProductNames: Array<{
    name: string;
    requiredSpec: string;
    sourceName: string;
    sourceVersion: string;
  }>;
  classificationSiblings: Array<{
    hskCode: string;
    koreanName: string;
    isSelected: boolean;
  }>;
  tariffPreviews: Array<{
    rateType: string;
    label: string;
    rateText: string;
    countryGroup: string | null;
    usageRateType: string | null;
    sourceName: string;
    sourceVersion: string;
  }>;
  importRequirements: Array<{
    type: string;
    name: string;
    relatedLaw: string;
    agencyCode: string | null;
    agency: string | null;
    agencyContact: RequirementAgencyContact | null;
    procedureSummary: string | null;
    playbook: {
      applicationMethod: string | null;
      requiredDocuments: string[];
      expectedLeadTime: string | null;
      exemptionPossibility: string | null;
      commonRejectionReasons: string[];
      customerRequestTemplate: string | null;
      staffChecklist: string[];
      category: string | null;
      riskLevel: string | null;
      workflowType: string | null;
      workflowSteps: string[];
      sourceName: string;
      sourceUrl: string;
      sourceVersion: string;
    } | null;
    sourceName: string;
    sourceVersion: string;
  }>;
  originMarking: {
    isTarget: boolean;
    matchedPattern: string;
    patternType: string;
    conditionText: string | null;
    targetSourceName: string;
    targetSourceUrl: string;
    targetSourceVersion: string;
    method: {
      matchedPattern: string;
      itemName: string;
      methodSummary: string;
      note: string | null;
      sourceName: string;
      sourceUrl: string;
      sourceVersion: string;
    } | null;
    methods: Array<{
      matchedPattern: string;
      itemName: string;
      methodSummary: string;
      note: string | null;
      sourceName: string;
      sourceUrl: string;
      sourceVersion: string;
    }>;
  } | null;
  classificationCases: Array<{
    title: string;
    itemName: string;
    decisionDate: string;
    sourceName: string;
    sourceVersion: string;
  }>;
  hierarchyPath: HsHierarchyNode[];
};

function normalizeHskCode(value: string) {
  return value.replace(/[^0-9]/g, "");
}

function isEffective(record: { effective_from: string; effective_to: string | null; status: string }, basisDate: string) {
  return record.status === "published" && record.effective_from <= basisDate && (!record.effective_to || record.effective_to >= basisDate);
}

function matchesRequestedCode(record: { hsk_code: string; hs6: string }, normalizedCode: string) {
  if (normalizedCode.length < 6) {
    return record.hs6.startsWith(normalizedCode);
  }

  if (normalizedCode.length === 6) {
    return record.hs6 === normalizedCode;
  }

  return record.hsk_code === normalizedCode;
}

function tariffLabel(rateType: string, countryGroup?: string | null) {
  if (countryGroup && !/^[0-9]+$/.test(countryGroup)) return countryGroup;
  const normalized = rateType.toLowerCase();
  if (normalized === "basic" || normalized === "a") return "기본세율";
  if (normalized === "wto" || normalized === "c") return "WTO 협정세율";
  return `관세율구분 ${rateType}`;
}

function tariffRateText(rate: number | null, unitDuty: number | null) {
  if (rate !== null) return `${rate}%`;
  if (unitDuty !== null) return `종량세 ${unitDuty}`;
  return "-";
}

function tariffDisplayScore(item: TariffRatePreviewRecord) {
  let score = 0;

  if (item.country_group && !/^[0-9]+$/.test(item.country_group)) score += 10;
  if (item.source_version.includes("api030")) score += 5;

  return score;
}

function uniqueTariffRates(tariffRates: TariffRatePreviewRecord[]) {
  return Array.from(
    new Map(
      tariffRates
        .toSorted((a, b) => tariffDisplayScore(a) - tariffDisplayScore(b))
        .map((item) => [
          [item.hsk_code, item.rate_type, item.duty_rate ?? "", item.unit_duty ?? "", item.usage_rate_type ?? ""].join("|"),
          item
        ])
    ).values()
  );
}

function asStringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function originMarkingCandidatePatterns(hskCode: string) {
  const normalized = normalizeHskCode(hskCode);
  return Array.from(
    new Set(
      [
        normalized.length >= 10 ? normalized.slice(0, 10) : null,
        normalized.length >= 6 ? normalized.slice(0, 6) : null,
        normalized.length >= 4 ? normalized.slice(0, 4) : null,
        normalized.length >= 2 ? normalized.slice(0, 2) : null
      ].filter((value): value is string => Boolean(value))
    )
  );
}

function originMarkingSpecificity(pattern: string) {
  return pattern.length;
}

function selectBestOriginMarkingTarget(records: OriginMarkingTargetRecord[], hskCode: string) {
  const candidates = new Set(originMarkingCandidatePatterns(hskCode));
  return records
    .filter((record) => candidates.has(record.hsk_pattern) && record.is_target)
    .toSorted((a, b) => originMarkingSpecificity(b.hsk_pattern) - originMarkingSpecificity(a.hsk_pattern))[0] ?? null;
}

function selectBestOriginMarkingMethod(records: OriginMarkingMethodRecord[], hskCode: string) {
  const candidates = new Set(originMarkingCandidatePatterns(hskCode));
  return records
    .filter((record) => candidates.has(record.hsk_pattern))
    .toSorted((a, b) => originMarkingSpecificity(b.hsk_pattern) - originMarkingSpecificity(a.hsk_pattern))[0] ?? null;
}

function selectOriginMarkingMethods(records: OriginMarkingMethodRecord[], hskCode: string) {
  const candidates = new Set(originMarkingCandidatePatterns(hskCode));
  return records
    .filter((record) => candidates.has(record.hsk_pattern))
    .toSorted((a, b) => originMarkingSpecificity(b.hsk_pattern) - originMarkingSpecificity(a.hsk_pattern));
}

function buildOriginMarkingInfo(
  hskCode: string,
  targets: OriginMarkingTargetRecord[],
  methods: OriginMarkingMethodRecord[]
): HsDirectLookupResult["originMarking"] {
  const target = selectBestOriginMarkingTarget(targets, hskCode);
  if (!target) return null;

  const method = selectBestOriginMarkingMethod(methods, hskCode);
  const matchingMethods = selectOriginMarkingMethods(methods, hskCode);
  const mapMethod = (record: OriginMarkingMethodRecord) => ({
    matchedPattern: record.hsk_pattern,
    itemName: record.item_name,
    methodSummary: record.method_summary,
    note: record.note,
    sourceName: record.source_name,
    sourceUrl: record.source_url,
    sourceVersion: record.source_version
  });

  return {
    isTarget: target.is_target,
    matchedPattern: target.hsk_pattern,
    patternType: target.pattern_type,
    conditionText: target.condition_text,
    targetSourceName: target.source_name,
    targetSourceUrl: target.source_url,
    targetSourceVersion: target.source_version,
    method: method ? mapMethod(method) : null,
    methods: matchingMethods.map(mapMethod)
  };
}

function playbookKey(name: string, relatedLaw: string) {
  return `${name.trim()}|${relatedLaw.trim()}`;
}

function attachRequirementPlaybooks(
  requirements: ImportRequirementPreviewRecord[],
  playbooks: RequirementPlaybookRecord[]
) {
  const playbookMap = new Map(playbooks.map((playbook) => [playbookKey(playbook.requirement_document_name, playbook.related_law), playbook]));

  return requirements.map((requirement) => ({
    ...requirement,
    playbook: playbookMap.get(playbookKey(requirement.requirement_document_name, requirement.related_law)) ?? null
  }));
}

function mapResult(
  record: HsMasterRecord,
  basisDate: string,
  standardNames: StandardProductNameRecord[],
  siblings: HsMasterRecord[],
  tariffRates: TariffRatePreviewRecord[],
  importRequirements: ImportRequirementPreviewRecord[],
  classificationCases: HsClassificationCaseRecord[],
  hierarchyLabels: Record<string, string | null | undefined> = {},
  originMarking: HsDirectLookupResult["originMarking"] = null
): HsDirectLookupResult {
  const hierarchyPath = buildHsHierarchyPath({
    code: record.hsk_code,
    hs6: record.hs6,
    currentLabel: record.korean_name,
    labels: hierarchyLabels
  });

  return {
    hskCode: record.hsk_code,
    hs6: record.hs6,
    koreanName: record.korean_name,
    briefDescription: buildHsBriefDescription({
      hskCode: record.hsk_code,
      hs6: record.hs6,
      koreanName: record.korean_name,
      hierarchyPath
    }),
    englishName: record.english_name,
    importNatureCode: record.import_nature_code,
    exportNatureCode: record.export_nature_code,
    quantityUnit: record.quantity_unit,
    weightUnit: record.weight_unit,
    basisDate,
    sourceName: record.source_name,
    sourceUrl: record.source_url,
    sourceVersion: record.source_version,
    effectiveFrom: record.effective_from,
    effectiveTo: record.effective_to,
    publishedAt: record.published_at,
    retrievedAt: record.retrieved_at,
    checksum: record.checksum,
    standardProductNames: standardNames.map((item) => ({
      name: item.standard_name_kr,
      requiredSpec: item.required_spec_kr,
      sourceName: item.source_name,
      sourceVersion: item.source_version
    })),
    classificationSiblings: siblings.map((item) => ({
      hskCode: item.hsk_code,
      koreanName: item.korean_name,
      isSelected: item.hsk_code === record.hsk_code
    })),
    tariffPreviews: uniqueTariffRates(tariffRates).map((item) => ({
      rateType: item.rate_type,
      label: tariffLabel(item.rate_type, item.country_group),
      rateText: tariffRateText(item.duty_rate, item.unit_duty),
      countryGroup: item.country_group,
      usageRateType: item.usage_rate_type,
      sourceName: item.source_name,
      sourceVersion: item.source_version
    })),
    importRequirements: importRequirements.map((item) => ({
      type: item.requirement_type === "integrated_public_notice" ? "통합공고" : item.requirement_type === "individual_law" ? "개별법령" : "세관장확인",
      name: item.requirement_document_name,
      relatedLaw: item.related_law,
      agencyCode: item.agency_code ?? null,
      agency: item.agency,
      agencyContact: item.agency_contact ?? null,
      procedureSummary: item.procedure_summary ?? null,
      playbook: "playbook" in item && item.playbook
        ? {
            applicationMethod: item.playbook.application_method,
            requiredDocuments: asStringList(item.playbook.required_documents),
            expectedLeadTime: item.playbook.expected_lead_time,
            exemptionPossibility: item.playbook.exemption_possibility,
            commonRejectionReasons: asStringList(item.playbook.common_rejection_reasons),
            customerRequestTemplate: item.playbook.customer_request_template,
            staffChecklist: asStringList(item.playbook.staff_checklist),
            category: item.playbook.category,
            riskLevel: item.playbook.risk_level,
            workflowType: item.playbook.workflow_type,
            workflowSteps: asStringList(item.playbook.workflow_steps),
            sourceName: item.playbook.source_name,
            sourceUrl: item.playbook.source_url,
            sourceVersion: item.playbook.source_version
          }
        : null,
      sourceName: item.source_name,
      sourceVersion: item.source_version
    })),
    originMarking,
    classificationCases: classificationCases.map((item) => ({
      title: item.title,
      itemName: item.item_name,
      decisionDate: item.decision_date,
      sourceName: item.source_name,
      sourceVersion: item.source_version
    })),
    hierarchyPath
  };
}

async function findHierarchyLabels(supabase: SupabaseClient, codes: string[], basisDate: string) {
  const labels: Record<string, string> = {};
  const lookupCodes = Array.from(new Set(codes.filter((code) => code.length >= 2)));

  if (!lookupCodes.length) return labels;

  const { data: hsRows } = await supabase
    .from("hs_master")
    .select("hsk_code, korean_name")
    .in("hsk_code", lookupCodes)
    .lte("effective_from", basisDate)
    .or(`effective_to.is.null,effective_to.gte.${basisDate}`)
    .eq("status", "published")
    .order("hsk_code");

  for (const row of (hsRows ?? []) as Array<{ hsk_code: string; korean_name: string | null }>) {
    if (row.korean_name) labels[row.hsk_code] = row.korean_name;
  }

  const missingCodes = lookupCodes.filter((code) => !labels[code] && code.length >= 4);
  if (!missingCodes.length) return labels;

  const { data: tariffRows } = await supabase
    .from("export_destination_tariff_rates")
    .select("destination_hs_code, korean_name")
    .in("destination_hs_code", missingCodes)
    .lte("effective_from", basisDate)
    .or(`effective_to.is.null,effective_to.gte.${basisDate}`)
    .eq("status", "published")
    .order("destination_hs_code")
    .limit(200);

  for (const row of (tariffRows ?? []) as Array<{ destination_hs_code: string; korean_name: string | null }>) {
    if (!labels[row.destination_hs_code] && row.korean_name?.trim()) {
      labels[row.destination_hs_code] = row.korean_name.replace(/^-+\s*/, "").trim();
    }
  }

  return labels;
}

async function findRequirementAgencyContacts(
  supabase: SupabaseClient,
  requirements: ImportRequirementPreviewRecord[],
  basisDate: string
) {
  const agencyCodes = Array.from(new Set(requirements.map((item) => item.agency_code).filter((value): value is string => Boolean(value?.trim()))));
  const agencyNames = Array.from(new Set(requirements.map((item) => item.agency).filter((value): value is string => Boolean(value?.trim()))));

  if (!agencyCodes.length && !agencyNames.length) {
    return new Map<string, RequirementAgencyContact>();
  }

  const rows: Array<{
    agency_code: string | null;
    agency_name: string;
    phone: string | null;
    email: string | null;
    website_url: string | null;
    note: string | null;
  }> = [];

  if (agencyCodes.length) {
    const { data, error } = await supabase
      .from("requirement_agency_contacts")
      .select("agency_code, agency_name, phone, email, website_url, note")
      .in("agency_code", agencyCodes)
      .lte("effective_from", basisDate)
      .or(`effective_to.is.null,effective_to.gte.${basisDate}`)
      .eq("status", "published")
      .order("agency_name");

    if (!error) rows.push(...((data ?? []) as typeof rows));
  }

  if (agencyNames.length) {
    const { data, error } = await supabase
      .from("requirement_agency_contacts")
      .select("agency_code, agency_name, phone, email, website_url, note")
      .in("agency_name", agencyNames)
      .lte("effective_from", basisDate)
      .or(`effective_to.is.null,effective_to.gte.${basisDate}`)
      .eq("status", "published")
      .order("agency_name");

    if (!error) rows.push(...((data ?? []) as typeof rows));
  }

  const contacts = new Map<string, RequirementAgencyContact>();

  for (const row of rows) {
    const contact = {
      agencyCode: row.agency_code,
      agencyName: row.agency_name,
      phone: row.phone,
      email: row.email,
      websiteUrl: row.website_url,
      note: row.note
    };

    if (row.agency_code) contacts.set(`code:${row.agency_code}`, contact);
    contacts.set(`name:${row.agency_name}`, contact);
  }

  return contacts;
}

function attachRequirementAgencyContacts(
  requirements: ImportRequirementPreviewRecord[],
  contacts: Map<string, RequirementAgencyContact>
) {
  return requirements.map((requirement) => ({
    ...requirement,
    agency_contact: (requirement.agency_code ? contacts.get(`code:${requirement.agency_code}`) : undefined) ?? (requirement.agency ? contacts.get(`name:${requirement.agency}`) : undefined) ?? null
  }));
}

async function findRequirementPlaybooks(
  supabase: SupabaseClient,
  requirements: ImportRequirementPreviewRecord[],
  basisDate: string
) {
  const names = Array.from(new Set(requirements.map((item) => item.requirement_document_name).filter((value) => value.trim())));

  if (!names.length) {
    return [] as RequirementPlaybookRecord[];
  }

  const { data, error } = await supabase
    .from("requirement_playbooks")
    .select("requirement_document_name, related_law, agency, application_method, required_documents, expected_lead_time, exemption_possibility, common_rejection_reasons, customer_request_template, staff_checklist, category, risk_level, workflow_type, workflow_steps, source_name, source_url, source_version, effective_from, effective_to, status")
    .in("requirement_document_name", names)
    .lte("effective_from", basisDate)
    .or(`effective_to.is.null,effective_to.gte.${basisDate}`)
    .eq("status", "published")
    .order("requirement_document_name");

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as RequirementPlaybookRecord[];
}

async function findOriginMarkingRecords(supabase: SupabaseClient, hskCodes: string[], basisDate: string) {
  const patterns = Array.from(new Set(hskCodes.flatMap(originMarkingCandidatePatterns)));

  if (!patterns.length) {
    return {
      targets: [] as OriginMarkingTargetRecord[],
      methods: [] as OriginMarkingMethodRecord[]
    };
  }

  const { data: targetRows, error: targetError } = await supabase
    .from("origin_marking_targets")
    .select("hsk_pattern, pattern_type, condition_text, is_target, source_name, source_url, source_version, effective_from, effective_to, status")
    .in("hsk_pattern", patterns)
    .lte("effective_from", basisDate)
    .or(`effective_to.is.null,effective_to.gte.${basisDate}`)
    .eq("status", "published")
    .order("hsk_pattern");

  if (targetError) {
    throw new Error(targetError.message);
  }

  const { data: methodRows, error: methodError } = await supabase
    .from("origin_marking_methods")
    .select("hsk_pattern, pattern_type, item_name, method_summary, note, source_name, source_url, source_version, effective_from, effective_to, status")
    .in("hsk_pattern", patterns)
    .lte("effective_from", basisDate)
    .or(`effective_to.is.null,effective_to.gte.${basisDate}`)
    .eq("status", "published")
    .order("hsk_pattern");

  if (methodError) {
    throw new Error(methodError.message);
  }

  return {
    targets: (targetRows ?? []) as OriginMarkingTargetRecord[],
    methods: (methodRows ?? []) as OriginMarkingMethodRecord[]
  };
}

async function lookupWithSupabase(
  supabase: SupabaseClient,
  hskCode: string,
  basisDate: string
): Promise<HsDirectLookupResult[]> {
  const normalizedCode = normalizeHskCode(hskCode);
  const codeFilter =
    normalizedCode.length < 6
      ? `hs6.like.${normalizedCode}%`
      : normalizedCode.length === 6
      ? `hs6.eq.${normalizedCode}`
      : `hsk_code.eq.${normalizedCode}`;

  const { data: hsRows, error } = await supabase
    .from("hs_master")
    .select(
      "hsk_code, hs6, korean_name, english_name, import_nature_code, export_nature_code, quantity_unit, weight_unit, source_name, source_url, source_version, effective_from, effective_to, published_at, retrieved_at, status, checksum"
    )
    .or(codeFilter)
    .lte("effective_from", basisDate)
    .or(`effective_to.is.null,effective_to.gte.${basisDate}`)
    .eq("status", "published")
    .order("hsk_code");

  if (error) {
    throw new Error(error.message);
  }

  const records = (hsRows ?? []) as HsMasterRecord[];
  if (!records.length) {
    return [];
  }

  const summaryOnly = normalizedCode.length <= 6;
  const codes = records.map((record) => record.hsk_code);
  const hs6Codes = Array.from(new Set(records.map((record) => record.hs6)));
  const hierarchyLabelsPromise = findHierarchyLabels(
    supabase,
    records.flatMap((record) => hsAncestorCodes(record.hsk_code)),
    basisDate
  );

  const standardNamesPromise: Promise<StandardProductNameRecord[]> = summaryOnly
    ? Promise.resolve([])
    : (async () => {
        const { data: standardRows, error: standardError } = await supabase
          .from("standard_product_names")
          .select(
            "id, hsk_code, standard_name_kr, required_spec_kr, source_name, source_url, source_version, effective_from, effective_to, published_at, retrieved_at, status, checksum"
          )
          .in("hsk_code", codes)
          .lte("effective_from", basisDate)
          .or(`effective_to.is.null,effective_to.gte.${basisDate}`)
          .eq("status", "published")
          .order("standard_name_kr");

        if (standardError) {
          throw new Error(standardError.message);
        }

        return (standardRows ?? []) as StandardProductNameRecord[];
      })();

  const siblingsPromise: Promise<HsMasterRecord[]> = summaryOnly
    ? Promise.resolve([])
    : (async () => {
        const { data: siblingRows, error: siblingError } = await supabase
          .from("hs_master")
          .select(
            "hsk_code, hs6, korean_name, english_name, import_nature_code, export_nature_code, quantity_unit, weight_unit, source_name, source_url, source_version, effective_from, effective_to, published_at, retrieved_at, status, checksum"
          )
          .in("hs6", hs6Codes)
          .lte("effective_from", basisDate)
          .or(`effective_to.is.null,effective_to.gte.${basisDate}`)
          .eq("status", "published")
          .order("hsk_code")
          .limit(80);

        if (siblingError) {
          throw new Error(siblingError.message);
        }

        return (siblingRows ?? []) as HsMasterRecord[];
      })();

  const tariffRatesPromise = (async () => {
    const { data: tariffRows, error: tariffError } = await supabase
      .from("tariff_rates")
      .select("hsk_code, rate_type, duty_rate, unit_duty, country_group, usage_rate_type, source_name, source_version, effective_from, effective_to, status")
      .in("hsk_code", codes)
      .lte("effective_from", basisDate)
      .or(`effective_to.is.null,effective_to.gte.${basisDate}`)
      .eq("status", "published")
      .order("rate_type");

    if (tariffError) {
      throw new Error(tariffError.message);
    }

    return (tariffRows ?? []) as TariffRatePreviewRecord[];
  })();

  const importRequirementsPromise = (async () => {
    const { data: requirementRows, error: requirementError } = await supabase
      .from("customs_confirmation_requirements")
      .select("hsk_code, requirement_document_name, related_law, agency_code, agency, source_name, source_version, effective_from, effective_to, status")
      .in("hsk_code", codes)
      .eq("direction", "import")
      .lte("effective_from", basisDate)
      .or(`effective_to.is.null,effective_to.gte.${basisDate}`)
      .eq("status", "published")
      .order("hsk_code")
      .order("related_law");

    if (requirementError) {
      throw new Error(requirementError.message);
    }

    return (requirementRows ?? []) as ImportRequirementPreviewRecord[];
  })();

  const publicNoticeRowsPromise = (async () => {
    const { data: publicNoticeRows, error: publicNoticeError } = await supabase
      .from("integrated_public_notice_requirements")
      .select("hsk_code, requirement_name, related_law, agency, procedure_summary, source_name, source_version, effective_from, effective_to, status")
      .in("hsk_code", codes)
      .eq("direction", "import")
      .lte("effective_from", basisDate)
      .or(`effective_to.is.null,effective_to.gte.${basisDate}`)
      .eq("status", "published")
      .order("hsk_code")
      .order("related_law");

    if (publicNoticeError) {
      throw new Error(publicNoticeError.message);
    }

    return (publicNoticeRows ?? []) as IntegratedPublicNoticeRequirementRow[];
  })();

  const originMarkingRecordsPromise = summaryOnly
    ? Promise.resolve({
        targets: [] as OriginMarkingTargetRecord[],
        methods: [] as OriginMarkingMethodRecord[]
      })
    : findOriginMarkingRecords(supabase, codes, basisDate);

  const [
    hierarchyLabels,
    standardNames,
    siblings,
    tariffRates,
    importRequirements,
    publicNoticeRows,
    originMarkingRecords
  ] = await Promise.all([
    hierarchyLabelsPromise,
    standardNamesPromise,
    siblingsPromise,
    tariffRatesPromise,
    importRequirementsPromise,
    publicNoticeRowsPromise,
    originMarkingRecordsPromise
  ]);

  const publicNoticeRequirements = publicNoticeRows.map((item) => ({
    hsk_code: item.hsk_code,
    requirement_type: "integrated_public_notice",
    requirement_document_name: item.requirement_name,
    related_law: item.related_law,
    agency_code: null,
    agency: item.agency,
    agency_contact: null,
    procedure_summary: item.procedure_summary,
    source_name: item.source_name,
    source_version: item.source_version,
    effective_from: item.effective_from,
    effective_to: item.effective_to,
    status: item.status
  }));
  const allRequirements = [...importRequirements, ...publicNoticeRequirements];
  let requirementsWithContacts = allRequirements;
  if (!summaryOnly) {
    const [agencyContacts, requirementPlaybooks] = await Promise.all([
      findRequirementAgencyContacts(supabase, allRequirements, basisDate),
      findRequirementPlaybooks(supabase, allRequirements, basisDate)
    ]);
    requirementsWithContacts = attachRequirementPlaybooks(
      attachRequirementAgencyContacts(allRequirements, agencyContacts),
      requirementPlaybooks
    );
  }

  return records.map((record) =>
    mapResult(
      record,
      basisDate,
      standardNames.filter((item) => item.hsk_code === record.hsk_code),
      siblings.filter((item) => item.hs6 === record.hs6),
      tariffRates.filter((item) => item.hsk_code === record.hsk_code),
      requirementsWithContacts.filter((item) => item.hsk_code === record.hsk_code),
      [],
      hierarchyLabels,
      buildOriginMarkingInfo(record.hsk_code, originMarkingRecords.targets, originMarkingRecords.methods)
    )
  );
}

function lookupWithMockData(hskCode: string, basisDate: string): HsDirectLookupResult[] {
  const normalizedCode = normalizeHskCode(hskCode);

  return mockHsMasterRecords
    .filter((record) => isEffective(record, basisDate))
    .filter((record) => matchesRequestedCode(record, normalizedCode))
    .map((record) =>
      mapResult(
        record,
        basisDate,
        mockStandardProductNames.filter((item) => item.hsk_code === record.hsk_code && isEffective(item, basisDate)),
        mockHsMasterRecords
          .filter((item) => item.hs6 === record.hs6 && isEffective(item, basisDate))
          .sort((a, b) => a.hsk_code.localeCompare(b.hsk_code)),
        mockTariffRates
          .filter((item) => item.hsk_code === record.hsk_code && isEffective(item, basisDate))
          .map((item) => ({
            hsk_code: item.hsk_code,
            rate_type: item.rate_type,
            duty_rate: item.duty_rate,
            unit_duty: null,
            country_group: item.country_group,
            usage_rate_type: null,
            source_name: item.source_name,
            source_version: item.source_version,
            effective_from: item.effective_from,
            effective_to: item.effective_to,
            status: item.status
          })),
        mockImportRequirements
          .filter((item) => item.hsk_code === record.hsk_code && isEffective(item, basisDate))
          .map((item) => ({
            hsk_code: item.hsk_code,
            requirement_type: item.requirement_type,
            requirement_document_name: item.requirement_name,
            related_law: item.related_law,
            agency_code: null,
            agency: item.agency,
            agency_contact: null,
            procedure_summary: item.procedure_summary,
            source_name: item.source_name,
            source_version: item.source_version,
            effective_from: item.effective_from,
            effective_to: item.effective_to,
            status: item.status
          })),
        mockHsClassificationCases.filter((item) => item.hsk_code === record.hsk_code),
        {},
        null
      )
    );
}

export async function lookupHsDirect(hskCode: string, basisDate: string) {
  if (!hasSupabaseEnv()) {
    return lookupWithMockData(hskCode, basisDate);
  }

  const supabase = await createSupabaseServerClient();
  return lookupWithSupabase(supabase, hskCode, basisDate);
}

export const hsMasterRepositoryInternals = {
  normalizeHskCode,
  matchesRequestedCode,
  originMarkingCandidatePatterns,
  selectBestOriginMarkingTarget,
  selectBestOriginMarkingMethod,
  selectOriginMarkingMethods,
  buildOriginMarkingInfo,
  lookupWithMockData
};
