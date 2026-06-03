import { CheckCircle2, ChevronDown, ExternalLink, FileText, Folder, PackagePlus } from "lucide-react";
import Link from "next/link";
import { Fragment } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { SourceFooter } from "@/components/ui/source-footer";
import { buildDutyEstimatorHref } from "@/features/duty-estimator/url-params";
import { countryCodeAliases, destinationCountryOptions, exportCountryLabel, exportCountryOptions } from "@/features/export-diagnosis/country-options";
import { mockExportDestinationTariffRates } from "@/features/export-diagnosis/mock-export-data";
import { CountryComboboxField } from "@/features/hs/country-combobox-field";
import { DestinationCountryPicker } from "@/features/hs/destination-country-picker";
import { HsCopySummaryButton, type HsCopyGuideLanguage, type HsCopyGuideVariant, type HsCopySummaryTexts } from "@/features/hs/hs-copy-summary-button";
import { HsDirectSubmitStatus } from "@/features/hs/hs-direct-submit-status";
import { ProductSupplementResearchForm } from "@/features/hs/product-supplement-research-form";
import { buildMarketplaceRequestHref } from "@/features/service-requests/marketplace-request-prefill";
import { destinationAgreementRateDisplayItems, destinationDisplayAgreementRates, destinationDisplayBaseRate } from "@/features/hs/export-destination-tariff-display";
import { DestinationAgreementRateDialog } from "@/features/hs/destination-agreement-rate-dialog";
import { displayImportTariffLabel, filterImportTariffsForCountry, importTariffApplicationPriority, isCommonImportTariff } from "@/features/hs/import-tariff-display";
import { ImportTariffCountryFilter } from "@/features/hs/import-tariff-country-filter";
import { importRequirementSummaryText } from "@/features/hs/import-requirement-summary";
import { preferentialDutySummaryText } from "@/features/hs/preferential-duty-summary";
import { DestinationAdditionalTariffDialog } from "@/features/hs/destination-additional-tariff-dialog";
import { DestinationImportRequirementDialog } from "@/features/hs/destination-import-requirement-dialog";
import { DestinationInternalTaxDialog, destinationInternalTaxText } from "@/features/hs/destination-internal-tax-dialog";
import { DestinationTradeRemedyDialog } from "@/features/hs/destination-trade-remedy-dialog";
import { ImportRequirementDetailDialog } from "@/features/hs/import-requirement-detail-dialog";
import { HsNavigationStatsLazySection } from "@/features/hs/hs-navigation-stats-lazy-section";
import { OriginMarkingLinks } from "@/features/hs/origin-marking-dialogs";
import { hsDirectLookupSchema } from "@/features/hs/schemas";
import {
  buildHsSupplementGuidance,
  type HsSupplementGuidance
} from "@/features/hs/hs-supplement-guidance";
import { formatHsCode, normalizeHsCode } from "@/lib/hs-code";
import { buildHsHierarchyPath, type HsHierarchyNode } from "@/lib/hs-hierarchy";
import { buildHsBriefDescription } from "@/lib/hs-summary";
import { defaultLocale, getHsDirectDictionary, type AppLocale, type HsDirectDictionary } from "@/lib/i18n";
import { createSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase/server";
import { cn, getSeoulDateString } from "@/lib/utils";
import { cachedLookup, lookupCacheKey } from "@/server/cache/lookup-cache";
import { logLookupTelemetry } from "@/server/observability/lookup-telemetry";
import { HsFavoriteToggleButton } from "@/features/hs/hs-favorite-toggle-button";
import { favoriteCodeSet } from "@/server/repositories/hs-favorite.repository";
import {
  findExportDestinationCustomsCodes,
  findExportDestinationTariffsByDestinationCode,
  findExportDestinationTariffs,
  type ExportDestinationCustomsCodeItem,
  type ExportDestinationTariffItem
} from "@/server/repositories/export-destination-tariff.repository";
import {
  findExportDestinationAdditionalTariffs,
  findExportDestinationImportRequirements,
  findExportDestinationInternalTaxes,
  findExportDestinationTradeRemedyCases,
  type ExportDestinationAdditionalTariffItem,
  type ExportDestinationImportRequirementItem,
  type ExportDestinationInternalTaxItem,
  type ExportDestinationTradeRemedyCaseItem
} from "@/server/repositories/export-destination-import-data.repository";
import {
  findInternalTaxLawRuleMatches,
  matchInternalTaxCodes,
  type CustomsStatisticalCodeRecord,
  type InternalTaxCodeMatch
} from "@/server/repositories/customs-statistical-code.repository";
import { analyzeProductClarification, type ProductClarificationResult } from "@/server/ai/clarification.service";
import { lookupHsDirect, lookupHsFamilyLabels, type HsDirectLookupResult } from "@/server/repositories/hs-master.repository";
import { recommendHsCandidatesForProduct, type HsCandidateRecommendation } from "@/server/rules/hs-candidate.service";
import { getExportDiagnosis, type ExportDiagnosisResult } from "@/server/rules/export-diagnosis.service";

function normalizeHsInput(value?: string) {
  return value ? normalizeHsCode(value) : "";
}

function isHsCodeLike(value: string) {
  return /^[0-9.\-\s]+$/.test(value) && normalizeHsInput(value).length >= 2;
}

type ProductSupplementEntry = {
  answer: string;
  question: string;
};

function parseProductSupplementQuery(value: string) {
  const marker = "\n보완정보:";
  const markerIndex = value.indexOf(marker);

  if (markerIndex < 0) {
    return {
      baseProductName: value.trim(),
      supplementEntries: [] as ProductSupplementEntry[]
    };
  }

  const baseProductName = value.slice(0, markerIndex).trim();
  const supplementText = value.slice(markerIndex + marker.length).trim();
  const supplementEntries = supplementText
    .split("\n")
    .map((line) => line.trim().replace(/^-\s*/, ""))
    .map((line) => {
      const separatorIndex = line.indexOf(":");
      if (separatorIndex < 0) return null;

      const question = line.slice(0, separatorIndex).trim();
      const answer = line.slice(separatorIndex + 1).trim();
      if (!question || !answer) return null;

      return { question, answer };
    })
    .filter((entry): entry is ProductSupplementEntry => Boolean(entry));

  return {
    baseProductName: baseProductName || value.trim(),
    supplementEntries
  };
}

const lookupCacheTtlMs = 5 * 60 * 1000;
const hsPrefixLookupCacheTtlMs = 15 * 60 * 1000;

function cachedHsDirectLookup(hskCode: string, basisDate: string) {
  const normalizedCode = normalizeHsInput(hskCode);

  return cachedLookup({
    key: lookupCacheKey("hs-direct", { hskCode: normalizedCode, basisDate }),
    ttlMs: lookupCacheTtlMs,
    load: () => lookupHsDirect(hskCode, basisDate),
    valueTtlMs: () => normalizedCode.length > 0 && normalizedCode.length <= 6 ? hsPrefixLookupCacheTtlMs : lookupCacheTtlMs
  });
}

function cachedHsFamilyLabels(hskCodes: string[], basisDate: string) {
  const codes = Array.from(new Set(hskCodes.map((code) => normalizeHsInput(code)).filter(Boolean))).sort();

  return cachedLookup({
    key: lookupCacheKey("hs-family-labels", { hskCodes: codes, basisDate }),
    ttlMs: hsPrefixLookupCacheTtlMs,
    load: () => lookupHsFamilyLabels(codes, basisDate)
  });
}

function QueryField({
  name,
  label,
  defaultValue,
  placeholder
}: {
  name: string;
  label: string;
  defaultValue: string;
  placeholder?: string;
}) {
  return (
    <label className="grid min-w-0 gap-1 text-sm font-medium text-slate-700">
      {label}
      <input
        className="focus-ring w-full min-w-0 rounded-md border border-slate-300 px-3 py-2"
        defaultValue={defaultValue}
        name={name}
        placeholder={placeholder}
        type={name === "basisDate" ? "date" : "text"}
      />
    </label>
  );
}

function DirectionSelect({
  defaultValue,
  dictionary
}: {
  defaultValue: "import" | "export";
  dictionary: HsDirectDictionary;
}) {
  return (
    <label className="grid min-w-0 gap-1 text-sm font-medium text-slate-700">
      {dictionary.form.direction}
      <select className="focus-ring w-full min-w-0 rounded-md border border-slate-300 px-3 py-2" defaultValue={defaultValue} name="direction">
        <option value="import">{dictionary.form.import}</option>
        <option value="export">{dictionary.form.export}</option>
      </select>
    </label>
  );
}

function DirectionHiddenField({ value }: { value: "import" | "export" }) {
  return <input name="direction" type="hidden" value={value} />;
}

function DestinationCountrySelect({ defaultValue, direction }: { defaultValue: string; direction: "import" | "export" }) {
  return (
    <CountryComboboxField defaultValue={defaultValue} direction={direction} />
  );
}

function OriginCountrySelect({
  defaultValue,
  dictionary,
  direction
}: {
  defaultValue: string;
  dictionary: HsDirectDictionary;
  direction: "import" | "export";
}) {
  if (direction !== "export") return null;

  return (
    <label className="grid min-w-0 gap-1 text-sm font-medium text-slate-700">
      {dictionary.form.originCountry}
      <select className="focus-ring w-full min-w-0 rounded-md border border-slate-300 px-3 py-2" defaultValue={defaultValue} name="originCountry">
        <option value="ALL">{dictionary.form.destinationAllOrigins}</option>
        {exportCountryOptions.filter((country) => country.code !== "ALL").map((country) => (
          <option key={country.code} value={country.code}>
            {country.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function BasisDateOptions({
  defaultValue,
  dictionary
}: {
  defaultValue: string;
  dictionary: HsDirectDictionary;
}) {
  return (
    <details className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 lg:col-span-full">
      <summary className="cursor-pointer text-sm font-semibold text-slate-700">
        {dictionary.form.options}
        <span className="ml-2 text-xs font-medium text-slate-500">{dictionary.form.basisDate} {defaultValue}</span>
      </summary>
      <label className="mt-3 grid max-w-xs gap-1 text-sm font-medium text-slate-700">
        {dictionary.form.basisDate}
        <input
          className="focus-ring w-full rounded-md border border-slate-300 bg-white px-3 py-2"
          defaultValue={defaultValue}
          name="basisDate"
          type="date"
        />
      </label>
      <p className="mt-2 text-xs leading-5 text-slate-500">
        {dictionary.form.basisDateDescription}
      </p>
    </details>
  );
}

function RequirementSummary({
  requirements
}: {
  requirements: Array<{ name: string; relatedLaw: string; agency: string | null; type?: string }>;
}) {
  if (!requirements.length) {
    return <span className="text-slate-400">-</span>;
  }

  const uniqueRequirements = Array.from(new Map(requirements.map((requirement) => [requirement.relatedLaw, requirement])).values());

  return (
    <div className="flex flex-wrap gap-1.5">
      {uniqueRequirements.map((requirement) => (
        <span className="rounded bg-lime-100 px-1.5 py-0.5 text-xs font-semibold text-lime-800" key={requirement.relatedLaw}>
          {requirement.relatedLaw}
        </span>
      ))}
    </div>
  );
}

type ImportRequirementDisplayItem = {
  type: string;
  name: string;
  relatedLaw: string;
  agencyCode: string | null;
  agency: string | null;
  agencyContact: {
    phone: string | null;
    email: string | null;
    websiteUrl: string | null;
    note: string | null;
  } | null;
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
};

type GroupedImportRequirement = {
  type: string;
  name: string;
  relatedLaw: string;
  procedureSummary: string | null;
  playbook: ImportRequirementDisplayItem["playbook"];
  agencies: Array<{
    code: string | null;
    name: string;
    contact: ImportRequirementDisplayItem["agencyContact"];
  }>;
};

const requirementBadgeStyles: Record<string, string> = {
  검역: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  인증: "bg-blue-50 text-blue-700 ring-blue-200",
  허가: "bg-rose-50 text-rose-700 ring-rose-200",
  신고: "bg-amber-50 text-amber-800 ring-amber-200",
  승인: "bg-purple-50 text-purple-700 ring-purple-200",
  확인: "bg-slate-100 text-slate-700 ring-slate-200",
  검사: "bg-cyan-50 text-cyan-700 ring-cyan-200",
  CITES: "bg-lime-50 text-lime-700 ring-lime-200",
  화학물질: "bg-orange-50 text-orange-700 ring-orange-200",
  방사선: "bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200",
  안전: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  식품: "bg-green-50 text-green-700 ring-green-200",
  의약: "bg-violet-50 text-violet-700 ring-violet-200"
};

function requirementKindLabels(requirement: Pick<GroupedImportRequirement, "name" | "relatedLaw">) {
  const text = `${requirement.name} ${requirement.relatedLaw}`;
  const labels: string[] = [];

  if (/검역/.test(text)) labels.push("검역");
  if (/인증|형식승인|적합성평가/.test(text)) labels.push("인증");
  if (/허가/.test(text)) labels.push("허가");
  if (/신고/.test(text)) labels.push("신고");
  if (/승인/.test(text)) labels.push("승인");
  if (/확인|요건/.test(text)) labels.push("확인");
  if (/검사/.test(text)) labels.push("검사");
  if (/국제적멸종위기|CITES/.test(text)) labels.push("CITES");
  if (/화학|화학물질|농약|비료|오존층|석면/.test(text)) labels.push("화학물질");
  if (/방사|원자력/.test(text)) labels.push("방사선");
  if (/안전|전기용품|어린이제품|고압가스|액화석유가스|산업안전/.test(text)) labels.push("안전");
  if (/식품|먹는물|위생용품|사료/.test(text)) labels.push("식품");
  if (/의약|의료기기|마약|인체조직/.test(text)) labels.push("의약");

  return Array.from(new Set(labels)).slice(0, 3);
}

function RequirementKindBadges({ requirement }: { requirement: GroupedImportRequirement }) {
  const labels = requirementKindLabels(requirement);
  if (!labels.length) return <span className="text-slate-400">-</span>;

  return (
    <div className="flex flex-wrap gap-1">
      {labels.map((label) => (
        <span
          className={[
            "inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-semibold ring-1",
            requirementBadgeStyles[label] ?? "bg-slate-100 text-slate-700 ring-slate-200"
          ].join(" ")}
          key={label}
        >
          {label}
        </span>
      ))}
    </div>
  );
}

function PlaybookStatusBadge({ dictionary, hasPlaybook }: { dictionary: HsDirectDictionary; hasPlaybook: boolean }) {
  return (
    <span className={[
      "inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-semibold ring-1",
      hasPlaybook ? "bg-blue-50 text-blue-700 ring-blue-200" : "bg-slate-100 text-slate-600 ring-slate-200"
    ].join(" ")}>
      {hasPlaybook ? dictionary.result.playbookReady : dictionary.result.playbookPending}
    </span>
  );
}

function AgencyCell({ agencies }: { agencies: GroupedImportRequirement["agencies"] }) {
  if (!agencies.length) return "-";
  if (agencies.length > 1) return `${agencies.length}개 기관`;

  const agency = agencies[0]!;
  const websiteUrl = agency.contact?.websiteUrl?.trim();
  if (websiteUrl) {
    return (
      <a className="font-medium text-blue-700 underline-offset-2 hover:underline" href={websiteUrl} rel="noreferrer" target="_blank">
        {websiteUrl}
      </a>
    );
  }

  return agency.name;
}

function groupedImportRequirements(requirements: ImportRequirementDisplayItem[]) {
  return Array.from(
    requirements.reduce((groups, requirement) => {
      const key = [requirement.type, requirement.name, requirement.relatedLaw, requirement.procedureSummary ?? ""].join("|");
      const group = groups.get(key) ?? {
        type: requirement.type,
        name: requirement.name,
        relatedLaw: requirement.relatedLaw,
        procedureSummary: requirement.procedureSummary,
        playbook: requirement.playbook,
        agencies: [] as GroupedImportRequirement["agencies"]
      };

      const agencyName = requirement.agency?.trim();
      if (agencyName && !group.agencies.some((agency) => agency.name === agencyName && agency.code === requirement.agencyCode)) {
        group.agencies.push({
          code: requirement.agencyCode,
          name: agencyName,
          contact: requirement.agencyContact
        });
      }

      groups.set(key, group);
      return groups;
    }, new Map<string, GroupedImportRequirement>()).values()
  ).map((group) => ({
    ...group,
    agencies: group.agencies.sort((a, b) => a.name.localeCompare(b.name, "ko"))
  }));
}

function requirementRequestHints(requirements: GroupedImportRequirement[], limit = 5) {
  const hints = new Set<string>();

  for (const requirement of requirements) {
    for (const document of requirement.playbook?.requiredDocuments ?? []) {
      const normalized = document.replace(/^필요 시\s*/, "").trim();
      if (normalized) hints.add(normalized);
      if (hints.size >= limit) return Array.from(hints);
    }

    for (const checkItem of requirement.playbook?.staffChecklist ?? []) {
      const normalized = checkItem.replace(/ 여부$/, "").replace(/ 확인$/, "").trim();
      if (normalized) hints.add(normalized);
      if (hints.size >= limit) return Array.from(hints);
    }
  }

  return Array.from(hints);
}

const copyGuideLabels: Record<HsCopyGuideLanguage, {
  appliedDutyRate: string;
  additionalTariff: string;
  adCvd: string;
  candidateIntroDetailed: string;
  candidateIntroSingleDetailed: string;
  hsCode: string;
  hsPath: string;
  importRequirements: string;
  internalTax: string;
  noDestinationInternalTax: string;
  noImportRequirements: string;
  noImportRequirementsCaution: string;
  noOriginMarking: string;
  noOriginMarkingCaution: string;
  noTariffData: string;
  originMarking: string;
  originMarkingCondition: string;
  originMarkingMethod: string;
  originMarkingReviewNote: string;
  originMarkingTarget: string;
  productCodeHelp: string;
  productDetailReview: string;
  productInfoInsufficient: string;
  productInfoInsufficientDetail: string;
  productName: string;
  provisionalHsDirections: string;
  preliminaryNotice: string;
  requestHints: string;
  requirementsNeedReview: string;
  finalReviewNote: string;
  standardVat: string;
  ftaRate: string;
  ftaReviewNote: string;
}> = {
  ko: {
    appliedDutyRate: "적용 관세율",
    additionalTariff: "추가관세",
    adCvd: "AD/CVD",
    candidateIntroDetailed: "예상 가능한 내역은 아래와 같습니다. 정확한 제품 설명, 사진, 카탈로그, 재질/구성, 용도, 모델명, 장착 대상 정보를 주시면 다시 확인하겠습니다.",
    candidateIntroSingleDetailed: "일반적인 제품 설명 기준으로 우선 검토 가능한 내역은 아래와 같습니다. 정확한 제품 설명, 사진, 카탈로그, 재질/구성, 용도, 모델명, 장착 대상 정보를 주시면 다시 확인하겠습니다.",
    hsCode: "HS CODE",
    hsPath: "HS CODE 경로",
    importRequirements: "수입요건",
    internalTax: "내국세",
    noDestinationInternalTax: "표시할 수입국 내국세 데이터가 없습니다.",
    noImportRequirements: "세관장확인 조회 결과 없음",
    noImportRequirementsCaution: "다만 통합공고, 개별법령, 표시·인증·유통규제 의무가 존재할 수 있으므로 제품 상세자료 기준 확인이 필요합니다.",
    noOriginMarking: "원산지표시대상으로 조회되는 항목은 확인되지 않았습니다.",
    noOriginMarkingCaution: "다만 표시방법, 개별법령, 거래조건에 따라 별도 표시·증빙 의무가 존재할 수 있으므로 제품 상세자료 기준 확인이 필요합니다.",
    noTariffData: "표시할 관세율 데이터가 없습니다.",
    originMarking: "원산지 표시",
    originMarkingCondition: "조건",
    originMarkingMethod: "표시방법",
    originMarkingReviewNote: "표시방법과 예외는 물품 상태, 포장, 거래조건 기준으로 확인이 필요합니다.",
    originMarkingTarget: "표시대상 조회됨(Y)",
    productCodeHelp: "제품코드나 모델명만 있는 경우 제조사 카탈로그, 제품 URL, 사양서, 사진 중 하나를 함께 보내 주세요.",
    productDetailReview: "정확한 정보를 주시면 해당 내용 기준으로 다시 확인하겠습니다.",
    productInfoInsufficient: "현재 제공된 품명만으로는 HS CODE 후보를 충분히 특정하기 어렵습니다.",
    productInfoInsufficientDetail: "아래 정보가 보완되면 HS CODE 후보, 관세율, 내국세, 수입요건을 다시 확인하겠습니다.",
    productName: "품명",
    provisionalHsDirections: "검토 가능한 HS 방향",
    preliminaryNotice: "아래 내용은 제공된 정보 기준의 예비 안내입니다. 실제 수입신고 전에는 제품 상세자료와 원산지, 거래조건 기준으로 재확인이 필요합니다.",
    requestHints: "확인 요청자료",
    requirementsNeedReview: "수입요건 해당 여부와 제출서류는 제품 상세자료 확인 후 검토가 필요합니다.",
    finalReviewNote: "정확한 적용 여부는 제품 상세자료, 원산지, 선적 경로, 실제 신고 시점 기준으로 다시 확인해 주세요.",
    standardVat: "부가세 : 10%",
    ftaRate: "FTA 관세율",
    ftaReviewNote: "FTA 세율은 자동 적용이 아니며 원산지증명, 직접운송, 협정 요건 충족 여부를 함께 확인해야 합니다."
  },
  en: {
    appliedDutyRate: "Applicable duty rate",
    additionalTariff: "Additional tariff",
    adCvd: "AD/CVD",
    candidateIntroDetailed: "Possible HS candidates are listed below. Please provide the exact product description, photo, catalog, material/composition, use, model name, and mounting/installation target for a further review.",
    candidateIntroSingleDetailed: "Based on the general product description, the following item may be reviewed first. Please provide the exact product description, photo, catalog, material/composition, use, model name, and mounting/installation target for a further review.",
    hsCode: "HS code",
    hsPath: "HS code path",
    importRequirements: "Import requirements",
    internalTax: "Internal taxes",
    noDestinationInternalTax: "No destination-country internal tax data is available.",
    noImportRequirements: "No customs-confirmation import requirement was found in the current lookup result.",
    noImportRequirementsCaution: "However, integrated notices, individual laws, labeling, certification, or distribution obligations may still apply and should be reviewed based on detailed product data.",
    noOriginMarking: "No origin marking target item was found in the current lookup.",
    noOriginMarkingCaution: "However, marking method, individual laws, and transaction conditions may still require separate marking or evidence review.",
    noTariffData: "No tariff data is available for display.",
    originMarking: "Origin marking",
    originMarkingCondition: "Condition",
    originMarkingMethod: "Marking method",
    originMarkingReviewNote: "Marking method and exceptions should be reviewed based on product condition, packaging, and transaction terms.",
    originMarkingTarget: "Origin marking target found (Y)",
    productCodeHelp: "If only a product code or model name is available, please also provide a manufacturer catalog, product URL, specification sheet, or photo.",
    productDetailReview: "Once accurate information is provided, the item can be reviewed again based on those details.",
    productInfoInsufficient: "The provided product name is not enough to narrow down an HS code candidate.",
    productInfoInsufficientDetail: "If the information below is provided, HS candidates, duty rates, internal taxes, and import requirements can be reviewed again.",
    productName: "Product",
    provisionalHsDirections: "Provisional HS directions for review",
    preliminaryNotice: "The information below is a preliminary guide based on the details provided. Please re-check using the final product specifications, origin, and transaction details before import declaration.",
    requestHints: "Information/documents to request",
    requirementsNeedReview: "Applicability and required documents should be reviewed after checking detailed product information.",
    finalReviewNote: "Please re-check applicability based on detailed product data, origin, shipping route, and the actual declaration date.",
    standardVat: "VAT: 10%",
    ftaRate: "FTA preferential rate",
    ftaReviewNote: "FTA rates are not applied automatically and require review of origin proof, direct transport, and agreement conditions."
  },
  zh: {
    appliedDutyRate: "适用关税税率",
    additionalTariff: "附加关税",
    adCvd: "反倾销/反补贴",
    candidateIntroDetailed: "以下为可能的 HS 编码候选。请提供准确的产品说明、照片、目录、材质/成分、用途、型号、安装或使用对象后再确认。",
    candidateIntroSingleDetailed: "根据一般产品说明，可优先参考以下候选。请提供准确的产品说明、照片、目录、材质/成分、用途、型号、安装或使用对象后再确认。",
    hsCode: "HS 编码",
    hsPath: "HS 编码路径",
    importRequirements: "进口要求",
    internalTax: "国内税/内国税",
    noDestinationInternalTax: "暂无可显示的进口国国内税数据。",
    noImportRequirements: "当前查询结果未发现海关确认对象进口要求。",
    noImportRequirementsCaution: "但综合公告、个别法规、标签、认证或流通监管义务仍可能适用，应根据产品详细资料确认。",
    noOriginMarking: "当前查询未发现原产地标示对象。",
    noOriginMarkingCaution: "但标示方法、个别法规、交易条件可能仍要求另行标示或提供证明。",
    noTariffData: "暂无可显示的关税数据。",
    originMarking: "原产地标示",
    originMarkingCondition: "条件",
    originMarkingMethod: "标示方法",
    originMarkingReviewNote: "标示方法和例外情形需根据货物状态、包装及交易条件另行确认。",
    originMarkingTarget: "已查询到原产地标示对象(Y)",
    productCodeHelp: "如果只有产品代码或型号，请同时提供制造商目录、产品链接、规格书或照片。",
    productDetailReview: "提供准确信息后，可根据该资料重新确认。",
    productInfoInsufficient: "仅凭当前产品名称，难以充分确定 HS 编码候选。",
    productInfoInsufficientDetail: "补充以下资料后，可重新确认 HS 候选、关税、国内税和进口要求。",
    productName: "产品名称",
    provisionalHsDirections: "可供初步参考的 HS 方向",
    preliminaryNotice: "以下内容为根据已提供信息作出的初步提示。实际进口申报前，应根据产品详细资料、原产地和交易条件重新确认。",
    requestHints: "需确认/请求的资料",
    requirementsNeedReview: "进口要求适用性和提交资料需根据产品详细资料进一步确认。",
    finalReviewNote: "请根据产品详细资料、原产地、运输路径及实际申报日期重新确认适用性。",
    standardVat: "增值税: 10%",
    ftaRate: "FTA 优惠税率",
    ftaReviewNote: "FTA 税率不会自动适用，需一并确认原产地证明、直接运输及协定适用条件。"
  }
};

function copyLabels(language: HsCopyGuideLanguage) {
  return copyGuideLabels[language];
}

function buildCopyTextSet(builder: (language: HsCopyGuideLanguage, variant: HsCopyGuideVariant) => string): HsCopySummaryTexts {
  return {
    ko: {
      brief: builder("ko", "brief"),
      detailed: builder("ko", "detailed")
    },
    en: {
      brief: builder("en", "brief"),
      detailed: builder("en", "detailed")
    },
    zh: {
      brief: builder("zh", "brief"),
      detailed: builder("zh", "detailed")
    }
  };
}

function defaultProductClarificationQuestions(language: HsCopyGuideLanguage) {
  if (language === "en") {
    return [
      "Exact generic product name and commercial name",
      "Actual use and final application",
      "Whether it is a finished product or a part; if a part, the finished product it is used with",
      "Main material, composition, content, or components",
      "Operating method, function, specifications, or catalog URL",
      "Manufacturer, model name, product photo, or detailed description"
    ];
  }

  if (language === "zh") {
    return [
      "准确的一般品名和商品名",
      "实际用途和最终使用场景",
      "是否为成品或零部件；如为零部件，请说明装配对象",
      "主要材质、成分、含量或构成部件",
      "工作方式、功能、规格书或产品目录链接",
      "制造商、型号、产品照片或详细说明"
    ];
  }

  return [
    "제품의 정확한 일반 품명과 상업명",
    "제품의 실제 용도와 최종 사용처",
    "완제품인지 부분품인지, 부분품이면 장착 대상 완제품",
    "주요 재질, 성분, 함량 또는 구성품",
    "작동 방식, 기능, 사양서 또는 카탈로그 URL",
    "제조사, 모델명, 제품 사진 또는 상세 설명"
  ];
}

function appendRequirementCopyLines(
  lines: string[],
  requirements: GroupedImportRequirement[],
  language: HsCopyGuideLanguage,
  variant: HsCopyGuideVariant
) {
  const labels = copyLabels(language);

  lines.push(labels.importRequirements);

  if (requirements.length) {
    for (const requirement of requirements) {
      lines.push(`- ${requirement.name} (${requirement.relatedLaw})`);
    }

    if (variant === "brief") return;

    const requestHints = requirementRequestHints(requirements);
    if (requestHints.length) {
      lines.push("");
      lines.push(labels.requestHints);
      for (const hint of requestHints) {
        lines.push(`- ${hint}`);
      }
    }

    lines.push(labels.requirementsNeedReview);
  } else {
    appendNoRequirementCopyLines(lines, language);
  }
}

function appendNoRequirementCopyLines(lines: string[], language: HsCopyGuideLanguage) {
  const labels = copyLabels(language);

  lines.push(labels.noImportRequirements);
  lines.push(labels.noImportRequirementsCaution);
}

function appendOriginMarkingCopyLines(
  lines: string[],
  originMarking: HsDirectLookupResult["originMarking"] | null | undefined,
  language: HsCopyGuideLanguage,
  variant: HsCopyGuideVariant
) {
  const labels = copyLabels(language);

  lines.push(labels.originMarking);

  if (!originMarking?.isTarget) {
    lines.push(labels.noOriginMarking);
    if (variant === "detailed") lines.push(labels.noOriginMarkingCaution);
    return;
  }

  const method = originMarking.method?.methodSummary ? ` / ${labels.originMarkingMethod}: ${originMarking.method.methodSummary}` : "";
  const condition = originMarking.conditionText ? ` / ${labels.originMarkingCondition}: ${originMarking.conditionText}` : "";
  lines.push(`${labels.originMarkingTarget}${method}${condition}`);
  if (variant === "detailed") lines.push(labels.originMarkingReviewNote);
}

function isBasicTariffLabel(label: string) {
  return label.includes("기본세율") || label.includes("기본관세");
}

function compactTariffLabel(label: string) {
  return label
    .replace("관세율", "")
    .replace("세율", "")
    .replace("관세", "")
    .trim();
}

function preferentialTariffSummary(
  tariffs: Array<{ rateType: string; label: string; rateText: string; countryGroup: string | null; usageRateType: string | null }>,
  countryCode: string
) {
  const rows = tariffs
    .map((tariff) => ({
      ...tariff,
      displayLabel: displayImportTariffLabel(tariff, countryCode)
    }))
    .filter((tariff) => !isBasicTariffLabel(tariff.displayLabel))
    .sort((a, b) => importTariffApplicationPriority(a).localeCompare(importTariffApplicationPriority(b)) || a.rateType.localeCompare(b.rateType));

  if (!rows.length) return "-";

  return rows.slice(0, 3).map((tariff) => `${compactTariffLabel(tariff.displayLabel)} ${tariff.rateText}`).join(" / ");
}

function tariffNumericValue(rateText: string) {
  if (/^(무세|free)$/i.test(rateText.trim())) return 0;

  const percent = rateText.match(/-?\d+(?:\.\d+)?(?=\s*%)/);
  if (percent) return Number(percent[0]);

  const numeric = rateText.match(/-?\d+(?:\.\d+)?/);
  return numeric ? Number(numeric[0]) : Number.POSITIVE_INFINITY;
}

function isFtaTariffRate(rateType: string) {
  return rateType.trim().toUpperCase().startsWith("F");
}

function tariffSummaryText(tariff: { rateType: string; label: string; rateText: string }, countryCode: string) {
  return `${displayImportTariffLabel(tariff, countryCode)} ${tariff.rateText}`;
}

function lowestTariff<T extends { rateType: string; label: string; rateText: string }>(tariffs: T[]) {
  return tariffs
    .toSorted((a, b) => tariffNumericValue(a.rateText) - tariffNumericValue(b.rateText) || a.rateType.localeCompare(b.rateType))
    .at(0);
}

function isBaselineCopyTariff(tariff: { rateType: string; label: string; rateText: string }, countryCode: string) {
  const label = displayImportTariffLabel(tariff, countryCode);
  return label.includes("기본") || (label.includes("WTO") && !label.includes("양허"));
}

function baselineCopyTariff<T extends { rateType: string; label: string; rateText: string }>(tariffs: T[], countryCode: string) {
  return lowestTariff(tariffs.filter((tariff) => isBaselineCopyTariff(tariff, countryCode)))
    ?? lowestTariff(tariffs.filter((tariff) => isCommonImportTariff(tariff)));
}

function hsCopySummaryTexts({
  result,
  displayTariffs,
  internalTaxRows,
  importRequirements,
  countryCode
}: {
  result: {
    hskCode: string;
    koreanName: string;
    originMarking?: HsDirectLookupResult["originMarking"];
  };
  displayTariffs: Array<{
    rateType: string;
    label: string;
    rateText: string;
    countryGroup: string | null;
    usageRateType: string | null;
    sourceName: string;
    sourceVersion: string;
  }>;
  internalTaxRows: InternalTaxCodeMatch[];
  importRequirements: ImportRequirementDisplayItem[];
  countryCode: string;
}) {
  const commonTariff = baselineCopyTariff(displayTariffs, countryCode);
  const ftaTariffs = countryCode === "ALL" ? [] : displayTariffs.filter((tariff) => isFtaTariffRate(tariff.rateType));
  const groupedRequirements = groupedImportRequirements(importRequirements);

  return buildCopyTextSet((language, variant) => {
    const labels = copyLabels(language);
    const lines = [
      `${labels.productName} / ${labels.hsCode}`,
      `${result.koreanName} / ${formatHsCode(result.hskCode)}`
    ];

    if (variant === "brief") {
      lines.push(labels.importRequirements);
      if (groupedRequirements.length) {
        for (const requirement of groupedRequirements) {
          lines.push(`- ${requirement.name} (${requirement.relatedLaw})`);
        }
      } else {
        appendNoRequirementCopyLines(lines, language);
      }
      return lines.join("\n");
    }

    lines.push("");
    lines.push(labels.preliminaryNotice);
    lines.push("");
    lines.push(`${labels.appliedDutyRate} : ${commonTariff ? tariffSummaryText(commonTariff, countryCode) : "-"}`);

    if (ftaTariffs.length) {
      lines.push(`${labels.ftaRate} : ${ftaTariffs.map((tariff) => tariffSummaryText(tariff, countryCode)).join(" / ")}`);
      lines.push(labels.ftaReviewNote);
    }

    lines.push(labels.internalTax);
    if (internalTaxRows.length) {
      for (const row of internalTaxRows) {
        const basis = [row.lawName, row.articleRef, row.matchBasis].filter(Boolean).join(" / ");
        lines.push(`${row.name} : ${row.rateText}${basis ? ` (${basis})` : ""}`);
      }
    } else {
      lines.push(labels.standardVat);
    }

    appendRequirementCopyLines(lines, groupedRequirements, language, variant);
    appendOriginMarkingCopyLines(lines, result.originMarking, language, variant);
    lines.push("");
    lines.push(labels.finalReviewNote);

    return lines.join("\n");
  });
}

function hierarchyLevelLabel(level: HsHierarchyNode["level"]) {
  if (level === 2) return "류";
  if (level === 4) return "호";
  if (level === 6) return "6자리 분류";
  return "HSK";
}

function productCandidateHierarchyNodes(candidate: HsCandidateRecommendation, lookup?: HsDirectLookupResult) {
  if (lookup?.hierarchyPath.length) return lookup.hierarchyPath;

  return buildHsHierarchyPath({
    code: candidate.hskCode,
    hs6: candidate.hs6,
    currentLabel: candidate.koreanName
  });
}

function productCandidateHierarchyLines(candidate: HsCandidateRecommendation, lookup?: HsDirectLookupResult) {
  return productCandidateHierarchyNodes(candidate, lookup).map((node) => `${hierarchyLevelLabel(node.level)} ${formatHsCode(node.code)} ${node.label}`);
}

function productCandidateLookupBasisLabel(candidate: HsCandidateRecommendation) {
  if (candidate.lookupBasis === "user_hs_hint") return "입력 HS 힌트";
  if (candidate.lookupBasis === "ai_hs_hint") return "AI 추천";
  if (candidate.lookupBasis === "ai_term_match") return "AI 품명 단서";
  if (candidate.lookupBasis === "official_name_match") return "품명/제품 단서";
  if (candidate.lookupBasis === "customs_api") return "저장 HS 데이터";
  if (candidate.lookupBasis === "internal_tax_rule") return "내국세 단서";
  if (candidate.lookupBasis === "ambiguous_abbreviation") return "여러 의미 가능";
  return "추천 검색";
}

function productCandidateEvidenceText(candidate: HsCandidateRecommendation) {
  const evidence = candidate.scoreBreakdown
    .filter((item) => !item.includes("표준품명"))
    .slice(0, 3);

  if (evidence.length) return evidence.join(" / ");
  return candidate.lookupBasis === "ai_hs_hint"
    ? "AI가 제품 성격을 기준으로 추천한 HS CODE입니다."
    : "입력 품명과 제품 단서를 기준으로 추천한 HS CODE입니다.";
}

function productCandidateRouteSummary(candidate: HsCandidateRecommendation, lookup?: HsDirectLookupResult) {
  const hierarchy = productCandidateHierarchyNodes(candidate, lookup);
  const hs4 = hierarchy.find((node) => node.level === 4);
  const hs6 = hierarchy.find((node) => node.level === 6);
  const current = hierarchy[hierarchy.length - 1];

  return [
    hs4 ? `호 ${formatHsCode(hs4.code)} ${hs4.label}` : null,
    hs6 ? `6자리 ${formatHsCode(hs6.code)} ${hs6.label}` : null,
    current ? `10자리 ${formatHsCode(candidate.hskCode)} ${candidate.koreanName}` : null
  ].filter((item): item is string => Boolean(item));
}

function productCandidateBranchNotes(candidate: HsCandidateRecommendation) {
  const notes = [
    ...candidate.requiredQuestions,
    candidate.riskNotes
  ].map((note) => note.trim()).filter(Boolean);

  return Array.from(new Set(notes)).slice(0, 2);
}

function productCandidateCodeLevelLabel(candidate: HsCandidateRecommendation) {
  const codeLength = normalizeHsInput(candidate.hskCode).length;
  if (codeLength >= 10) return "HSK 10자리";
  if (codeLength === 8) return "HS8";
  if (codeLength === 6) return "HS6";
  if (codeLength === 4) return "HS4";
  return "HS";
}

function productCandidateScoreLabel(candidate: HsCandidateRecommendation) {
  return `점수 ${Math.round(candidate.confidenceScore * 100)}점`;
}

function inferredProductFamilyLabel(candidate: HsCandidateRecommendation) {
  const text = [
    candidate.reason,
    ...candidate.scoreBreakdown,
    ...candidate.requiredQuestions
  ].join(" ");
  const labels = text.match(/[가-힣ㆍ·A-Za-z0-9]+류/g) ?? [];

  return labels
    .map((label) => label.trim())
    .find((label) => label && label !== "제품류" && !/(품목분류|분류|종류|서류|오류)$/.test(label)) ?? "";
}

function productCandidateBriefDescription(
  candidate: HsCandidateRecommendation,
  lookup?: HsDirectLookupResult,
  familyLabels?: Record<string, string | null | undefined>
) {
  const fallback = buildHsBriefDescription({
    hskCode: candidate.hskCode,
    hs6: candidate.hs6,
    koreanName: candidate.koreanName,
    hierarchyPath: productCandidateHierarchyNodes(candidate, lookup),
    familyLabels
  });
  const description = lookup?.briefDescription ?? fallback;
  const familyLabel = inferredProductFamilyLabel(candidate);

  if (familyLabel && candidate.koreanName.trim() === "기타" && description.includes("관련 품목 중 기타 품목")) {
    return `${familyLabel} 중 기타 품목`;
  }

  return description;
}

function productCandidateDetailButtonText(candidate: HsCandidateRecommendation) {
  return normalizeHsInput(candidate.hskCode).length >= 10 ? "상세 조회" : "10자리 코드 더 보기";
}

function uniqueProductQuestions(candidates: HsCandidateRecommendation[], clarification?: ProductClarificationResult | null) {
  return Array.from(
    new Set([
      ...(clarification?.missingQuestions ?? []),
      ...candidates.flatMap((candidate) => candidate.requiredQuestions)
    ].map((question) => question.trim()).filter(Boolean))
  );
}

function productSearchPresentationState(candidates: HsCandidateRecommendation[], clarification?: ProductClarificationResult | null) {
  const primary = candidates[0];
  const questions = uniqueProductQuestions(candidates, clarification);

  if (!primary) {
    return {
      tone: "warning" as const,
      badge: "추가정보 필요",
      title: "HS CODE 특정 정보가 부족합니다",
      description: "입력 품명만으로는 의미가 좁혀지지 않았습니다. 제품의 용도, 재질, 구성, 모델명 중 확인 가능한 정보를 보완해 주세요.",
      questions
    };
  }

  const isLowConfidence = clarification?.confidence === "low" || primary.confidenceScore < 0.72;
  const hasMultipleDirections = candidates.length > 1;
  const needsClarification = isLowConfidence || (hasMultipleDirections && questions.length > 0);

  if (needsClarification) {
    return {
      tone: "warning" as const,
      badge: "추가정보 필요",
      title: "제품 정보 보완 후 좁혀야 합니다",
      description: "현재 입력값으로 가까운 코드를 찾았습니다. 아래 질문에 답하면 더 정확하게 좁힐 수 있습니다.",
      questions
    };
  }

  if (hasMultipleDirections) {
    return {
      tone: "info" as const,
      badge: "복수 가능성",
      title: "의미가 갈릴 수 있는 품명입니다",
      description: "입력 품명이 여러 제품군으로 해석될 수 있어 함께 볼 수 있는 코드를 표시했습니다. 실제 기능과 사용처가 확인되면 더 정확히 좁힐 수 있습니다.",
      questions
    };
  }

  return {
    tone: "info" as const,
    badge: "가장 유력",
    title: "가장 유력한 HS CODE입니다",
    description: "입력 품명 기준으로 우선 검토할 HS 방향을 하나로 정리했습니다. 실제 재질, 용도, 구성 확인 후 하위 세번을 검토하세요.",
    questions
  };
}

function ProductClassificationFlowPanel({
  productName,
  candidates
}: {
  productName: string;
  candidates: HsCandidateRecommendation[];
}) {
  const hasCandidates = candidates.length > 0;
  const primary = candidates[0];
  const summaryText = primary
    ? `"${productName}" 기준 가장 가까운 코드: ${formatHsCode(primary.hskCode)} ${primary.koreanName}`
    : `"${productName}" 기준 보완정보가 더 필요합니다.`;

  return (
    <details className="mt-4 rounded-md border border-blue-100 bg-blue-50">
      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm font-semibold text-blue-950">
        <span className="inline-flex items-center gap-2">
          <CheckCircle2 aria-hidden="true" size={17} />
          AI 분류 흐름 요약
          <Badge tone={hasCandidates ? "success" : "warning"}>{hasCandidates ? "완료" : "보완 필요"}</Badge>
        </span>
        <span className="text-xs font-medium text-blue-800">{productName}</span>
      </summary>
      <div className="border-t border-blue-100 bg-white p-3 text-sm leading-6 text-slate-700">
        {summaryText}
      </div>
    </details>
  );
}

function ProductSupplementSummaryPanel({ entries }: { entries: ProductSupplementEntry[] }) {
  if (!entries.length) return null;

  return (
    <section className="mt-4 rounded-md border border-blue-100 bg-blue-50 px-3 py-3 text-sm leading-6 text-blue-950">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold">이번 재조회에 반영된 보완사항</p>
          <p className="mt-1 text-xs text-blue-900">
            아래 답변을 반영해 다시 조회했습니다.
          </p>
        </div>
        <Badge tone="info">{entries.length}개 반영</Badge>
      </div>
      <dl className="mt-3 grid gap-2 md:grid-cols-2">
        {entries.map((entry) => (
          <div className="rounded-md border border-blue-100 bg-white px-3 py-2" key={`${entry.question}-${entry.answer}`}>
            <dt className="text-xs font-semibold text-blue-800">{entry.question}</dt>
            <dd className="mt-1 text-sm text-slate-700">{entry.answer}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

type ProductCandidateGroup = {
  representative: HsCandidateRecommendation;
  related: HsCandidateRecommendation[];
};

function ProductCandidateCard({
  candidateGroup,
  destinationCountry,
  direction,
  displaySearchQuery,
  hs6Label,
  isPrimary,
  lookup,
  familyLabels,
  originCountry,
  showSingleScore
}: {
  candidateGroup: ProductCandidateGroup;
  destinationCountry: string;
  direction: "import" | "export";
  displaySearchQuery: string;
  hs6Label: string;
  isPrimary?: boolean;
  lookup?: HsDirectLookupResult;
  familyLabels?: Record<string, string | null | undefined>;
  originCountry: string;
  showSingleScore?: boolean;
}) {
  const candidate = candidateGroup.representative;
  const routeSummary = productCandidateRouteSummary(candidate, lookup);
  const branchNotes = productCandidateBranchNotes(candidate);
  const detailHref = hsLookupHref({
    hskCode: candidate.hskCode,
    direction,
    destinationCountry,
    originCountry,
    basisDate: candidate.basisDate,
    source: "product_search",
    sourceCandidateRank: candidate.rank,
    sourceProductName: displaySearchQuery
  });
  const hs6Href = hsLookupHref({
    hskCode: candidate.hs6,
    direction,
    destinationCountry,
    originCountry,
    basisDate: candidate.basisDate,
    source: "product_search",
    sourceCandidateRank: candidate.rank,
    sourceProductName: displaySearchQuery
  });
  const freightRequestHref = buildMarketplaceRequestHref("freight", {
    basisDate: candidate.basisDate,
    destinationCountry,
    direction,
    hskCode: candidate.hskCode,
    hs6: candidate.hs6,
    originCountry,
    productName: displaySearchQuery
  });
  const clearanceRequestHref = buildMarketplaceRequestHref("clearance", {
    basisDate: candidate.basisDate,
    destinationCountry,
    direction,
    hskCode: candidate.hskCode,
    hs6: candidate.hs6,
    originCountry,
    productName: displaySearchQuery
  });

  return (
    <article
      className={cn(
        "rounded-md border bg-white p-4",
        isPrimary ? "border-blue-300 shadow-sm lg:col-span-2 lg:p-5" : "border-slate-200"
      )}
      key={candidate.hskCode}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className={cn("text-xs font-semibold", isPrimary ? "text-blue-700" : "text-slate-500")}>
            {isPrimary ? "가장 가까운 HS CODE" : `비교 후보 ${candidate.rank}순위`}
          </div>
          <Link
            className={cn(
              "mt-1 block font-mono font-semibold text-blue-700 underline-offset-2 hover:underline",
              isPrimary ? "text-2xl" : "text-lg"
            )}
            data-navigation-progress="상세조회"
            href={detailHref}
          >
            {formatHsCode(candidate.hskCode)}
          </Link>
        </div>
        <div className="flex items-center gap-2">
          {showSingleScore ? null : <Badge tone="info">{productCandidateScoreLabel(candidate)}</Badge>}
          <Badge tone={normalizeHsInput(candidate.hskCode).length >= 10 ? "success" : "warning"}>
            {productCandidateCodeLevelLabel(candidate)}
          </Badge>
          <Badge tone={candidate.lookupBasis === "user_hs_hint" ? "info" : candidate.lookupBasis === "ambiguous_abbreviation" ? "warning" : "neutral"}>
            {productCandidateLookupBasisLabel(candidate)}
          </Badge>
          {showSingleScore ? (
            <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
              {productCandidateScoreLabel(candidate)}
            </span>
          ) : null}
        </div>
      </div>

      <h3 className="mt-3 text-base font-semibold text-slate-950">{candidate.koreanName}</h3>
      <div className="mt-2 grid gap-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-700">
        <div><span className="font-semibold text-slate-500">간략 정보</span> {productCandidateBriefDescription(candidate, lookup, familyLabels)}</div>
      </div>

      <Link
        className="focus-ring mt-4 inline-flex w-full items-center justify-center rounded-md bg-blue-700 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800"
        data-navigation-progress="상세조회"
        href={detailHref}
      >
        {normalizeHsInput(candidate.hskCode).length >= 10 ? "이 코드로 조회" : productCandidateDetailButtonText(candidate)}
      </Link>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <Link
          className="focus-ring inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          data-navigation-progress="운송 견적 요청"
          href={freightRequestHref}
        >
          <PackagePlus aria-hidden="true" size={16} />
          이 후보로 운송 초안 만들기
        </Link>
        <Link
          className="focus-ring inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          data-navigation-progress="통관 의뢰 요청"
          href={clearanceRequestHref}
        >
          <FileText aria-hidden="true" size={16} />
          이 후보로 통관 초안 만들기
        </Link>
      </div>
      <p className="mt-2 text-xs leading-5 text-slate-500">
        요청 초안에는 HSK 확정 전 예비값으로만 전달됩니다.
      </p>

      <details className="mt-3 rounded-md border border-slate-200 bg-slate-50">
        <summary className="cursor-pointer px-3 py-2 text-xs font-semibold text-slate-700">
          분류 근거 보기
        </summary>
        <div className="grid gap-3 border-t border-slate-200 p-3 text-sm lg:grid-cols-2">
          <div>
            <div className="text-xs font-semibold text-blue-900">분류 요약</div>
            <ol className="mt-2 grid gap-1 text-xs leading-5 text-blue-950">
              {routeSummary.map((line, stepIndex) => (
                <li className="flex gap-2" key={line}>
                  <span className="font-mono font-semibold text-blue-700">{stepIndex + 1}</span>
                  <span>{line}</span>
                </li>
              ))}
            </ol>
            <div className="mt-3 text-xs font-semibold text-slate-500">주요 근거</div>
            <p className="mt-1 text-xs leading-5 text-slate-700">{productCandidateEvidenceText(candidate)}</p>
          </div>

          <div>
            <div className="text-xs font-semibold text-amber-900">확인하면 더 정확해지는 정보</div>
            {branchNotes.length ? (
              <ul className="mt-1 grid gap-1 leading-6 text-slate-700">
                {branchNotes.map((question) => (
                  <li key={question}>- {question}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 leading-6 text-slate-700">
                추가 보완 없이 조회 가능한 코드입니다.
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-xs font-semibold text-slate-500">{hs6Label}</span>
              <Link className="font-mono font-semibold text-blue-700 underline-offset-2 hover:underline" data-navigation-progress="상세조회" href={hs6Href}>
                {formatHsCode(candidate.hs6)}
              </Link>
            </div>
          </div>
        </div>
        {candidateGroup.related.length ? (
          <div className="border-t border-slate-200 px-3 py-3">
            <p className="text-xs font-semibold text-slate-600">비슷한 세부 코드</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {candidateGroup.related.map((relatedCandidate) => (
                <Link
                  className="rounded-md border border-slate-200 bg-white px-2 py-1 font-mono text-xs font-semibold text-blue-700 hover:bg-blue-50"
                  data-navigation-progress="상세조회"
                  href={hsLookupHref({
                    hskCode: relatedCandidate.hskCode,
                    direction,
                    destinationCountry,
                    originCountry,
                    basisDate: relatedCandidate.basisDate,
                    source: "product_search",
                    sourceCandidateRank: relatedCandidate.rank,
                    sourceProductName: displaySearchQuery
                  })}
                  key={relatedCandidate.hskCode}
                >
                  {formatHsCode(relatedCandidate.hskCode)} · {productCandidateScoreLabel(relatedCandidate)}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </details>
    </article>
  );
}

function productCandidateCopySummaryTexts({
  productName,
  candidates,
  lookupByHsk,
  internalTaxByHsk,
  countryCode,
  clarification
}: {
  productName: string;
  candidates: HsCandidateRecommendation[];
  lookupByHsk: Map<string, HsDirectLookupResult>;
  internalTaxByHsk: Map<string, InternalTaxCodeMatch[]>;
  countryCode: string;
  clarification: ProductClarificationResult | null;
}) {
  const missingQuestions = Array.from(
    new Set([
      ...(clarification?.missingQuestions ?? []),
      ...candidates.flatMap((candidate) => candidate.requiredQuestions)
    ])
  ).slice(0, 8);

  return buildCopyTextSet((language, variant) => {
    const labels = copyLabels(language);
    const lines = [
      clarification?.summary ?? `${labels.productName} "${productName}" - ${labels.productInfoInsufficient}`,
      variant === "brief" ? labels.productInfoInsufficient : labels.productInfoInsufficientDetail
    ];

    if (variant === "detailed" && missingQuestions.length) {
      lines.push("");
      lines.push(labels.requestHints);
      for (const question of missingQuestions) {
        lines.push(`- ${question}`);
      }
    }

    if (variant === "detailed") {
      lines.push("");
      lines.push(labels.preliminaryNotice);
      lines.push("");
      lines.push(candidates.length === 1 ? labels.candidateIntroSingleDetailed : labels.candidateIntroDetailed);
    }

    candidates.forEach((candidate, index) => {
      const lookup = lookupByHsk.get(candidate.hskCode);
      const displayTariffs = lookup ? filterImportTariffsForCountry(lookup.tariffPreviews, countryCode) : [];
      const commonTariff = baselineCopyTariff(displayTariffs, countryCode);
      const ftaTariffs = countryCode === "ALL" ? [] : displayTariffs.filter((tariff) => isFtaTariffRate(tariff.rateType));
      const internalTaxes = internalTaxByHsk.get(candidate.hskCode) ?? [];
      const requirements = groupedImportRequirements(lookup?.importRequirements ?? []);
      const hierarchyLines = productCandidateHierarchyLines(candidate, lookup);

      lines.push("");
      lines.push(`${index + 1}. ${candidate.koreanName}`);
      lines.push(`${labels.hsCode} : ${formatHsCode(candidate.hskCode)}`);
      lines.push(labels.importRequirements);
      if (requirements.length) {
        for (const requirement of requirements) {
          lines.push(`- ${requirement.name} (${requirement.relatedLaw})`);
        }
      } else {
        appendNoRequirementCopyLines(lines, language);
      }

      if (variant === "brief") return;

      if (hierarchyLines.length) {
        lines.push(labels.hsPath);
        for (const line of hierarchyLines) {
          lines.push(`- ${line}`);
        }
      }
      lines.push(`${labels.appliedDutyRate} : ${commonTariff ? tariffSummaryText(commonTariff, countryCode) : labels.noTariffData}`);

      if (ftaTariffs.length) {
        lines.push(`${labels.ftaRate} : ${ftaTariffs.map((tariff) => tariffSummaryText(tariff, countryCode)).join(" / ")}`);
        lines.push(labels.ftaReviewNote);
      }

      lines.push(labels.internalTax);
      if (internalTaxes.length) {
        for (const row of internalTaxes) {
          const basis = [row.lawName, row.articleRef, row.matchBasis].filter(Boolean).join(" / ");
          lines.push(`${row.name} : ${row.rateText}${basis ? ` (${basis})` : ""}`);
        }
      } else {
        lines.push(labels.standardVat);
      }

      appendOriginMarkingCopyLines(lines, lookup?.originMarking, language, variant);
    });

    if (variant === "detailed") {
      lines.push("");
      lines.push(labels.finalReviewNote);
    }

    return lines.join("\n");
  });
}

function productNoResultCopySummaryTexts({
  productName,
  clarification
}: {
  productName: string;
  clarification: ProductClarificationResult | null;
}) {
  return buildCopyTextSet((language, variant) => {
    const labels = copyLabels(language);
    const questions = clarification?.missingQuestions.length
      ? clarification.missingQuestions
      : defaultProductClarificationQuestions(language);
    const lines = [
      `${labels.productName} : ${productName}`,
      "",
      labels.productInfoInsufficient
    ];

    if (variant === "detailed") lines.push(labels.productInfoInsufficientDetail);

    if (clarification?.suggestedCandidateCodes.length) {
      lines.push("");
      lines.push(labels.provisionalHsDirections);
      lines.push(...clarification.suggestedCandidateCodes.slice(0, 6).map((code, index) => `${index + 1}. ${formatHsCode(code)}`));
    }

    lines.push("");
    lines.push(labels.requestHints);
    lines.push(...questions.slice(0, variant === "brief" ? 3 : 8).map((question, index) => `${index + 1}. ${question}`));
    if (variant === "brief") return lines.join("\n");

    lines.push("");
    lines.push(labels.productCodeHelp);
    lines.push(labels.productDetailReview);

    return lines.join("\n");
  });
}

function displayValue(value?: string | null) {
  return value?.trim() ? value : "-";
}

function hsLookupHref({
  hskCode,
  basisDate,
  direction,
  destinationCountry,
  originCountry,
  destinationHsCode,
  source,
  sourceCandidateRank,
  sourceProductName
}: {
  hskCode: string;
  basisDate: string;
  direction: "import" | "export";
  destinationCountry: string;
  originCountry?: string;
  destinationHsCode?: string;
  source?: string;
  sourceCandidateRank?: number;
  sourceProductName?: string;
}) {
  const params = new URLSearchParams({
    query: hskCode,
    direction,
    destinationCountry,
    basisDate
  });

  if (destinationHsCode) {
    params.set("destinationHsCode", destinationHsCode);
  }

  if (originCountry && originCountry !== "ALL") {
    params.set("originCountry", originCountry);
  }

  if (source) params.set("source", source);
  if (sourceProductName) params.set("sourceProductName", sourceProductName);
  if (sourceCandidateRank) params.set("sourceCandidateRank", String(sourceCandidateRank));

  const path = direction === "export" && destinationHsCode ? "/hs/overseas" : "/hs/direct";
  return `${path}?${params.toString()}`;
}

function currentHsDirectReturnTo({
  basisDate,
  destinationCountry,
  destinationHsCode,
  direction,
  originCountry,
  query
}: {
  basisDate: string;
  destinationCountry: string;
  destinationHsCode?: string;
  direction: "import" | "export";
  originCountry: string;
  query: string;
}) {
  const params = new URLSearchParams({
    query,
    direction,
    destinationCountry,
    basisDate
  });

  if (destinationHsCode) params.set("destinationHsCode", destinationHsCode);
  if (originCountry && originCountry !== "ALL") params.set("originCountry", originCountry);
  return `/hs/direct?${params.toString()}`;
}

function ProductSearchSourceBanner({
  candidateRank,
  productName
}: {
  candidateRank?: string;
  productName?: string;
}) {
  if (!productName) return null;

  return (
    <section className="mt-4 rounded-md border border-blue-200 bg-blue-50 px-3 py-3 text-sm leading-6 text-blue-950">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold">품명검색에서 선택한 HS CODE입니다.</p>
          <p className="mt-1 text-xs leading-5 text-blue-900">
            입력 품명 `{productName}` 기준으로 추천된 HS CODE를 상세 조회하고 있습니다. 아래 관세율, FTA, 수입요건, 원산지표시는 이 HS CODE 기준 조회입니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone="info">품명검색 연결</Badge>
          {candidateRank ? <Badge tone="neutral">{candidateRank}순위 후보</Badge> : null}
        </div>
      </div>
    </section>
  );
}

function HsHierarchyTrail({
  nodes,
  currentCode,
  basisDate,
  direction,
  destinationCountry
}: {
  nodes: HsHierarchyNode[];
  currentCode: string;
  basisDate: string;
  direction: "import" | "export";
  destinationCountry: string;
}) {
  if (!nodes.length) return null;

  const normalizedCurrent = normalizeHsInput(currentCode);

  return (
    <nav className="flex flex-wrap items-center gap-1.5 text-sm" aria-label="HS CODE 경로">
      {nodes.map((node, index) => {
        const isCurrent = normalizeHsInput(node.code) === normalizedCurrent;

        return (
          <Fragment key={`${node.level}-${node.code}`}>
            {index > 0 ? <span className="text-slate-300">/</span> : null}
            {isCurrent ? (
              <span className="rounded bg-slate-100 px-2 py-1 font-semibold text-slate-900">
                <span className="font-mono">{formatHsCode(node.code)}</span>
                <span className="ml-1 text-slate-600">{node.label}</span>
              </span>
            ) : (
              <Link
                className="rounded px-2 py-1 font-medium text-blue-700 underline-offset-2 hover:bg-blue-50 hover:underline"
                data-navigation-progress="상위 HS 조회"
                href={hsLookupHref({
                  hskCode: node.code,
                  direction,
                  destinationCountry,
                  basisDate
                })}
              >
                <span className="font-mono">{formatHsCode(node.code)}</span>
                <span className="ml-1 text-slate-600">{node.label}</span>
              </Link>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}

function destinationHsPathItems(row: ExportDestinationTariffItem & { hskCode?: string }) {
  const displayCode = normalizeHsInput(row.destinationHsCode);
  const tariffCode = normalizeHsInput(row.destinationTariffCode);
  const codes = [displayCode.slice(0, 4), displayCode.slice(0, 6)];

  if (tariffCode && tariffCode !== displayCode) {
    codes.push(tariffCode);
  } else if (displayCode.length > 8) {
    codes.push(displayCode.slice(0, 8));
  }

  codes.push(displayCode);

  return Array.from(new Set(codes.filter((code) => code.length >= 4))).map((code) => {
    const isCurrent = code === displayCode;
    const isTariffCode = tariffCode ? code === tariffCode : code.length === 8 && displayCode.length > 8;
    const label = isCurrent
      ? (row.destinationCustomsName ?? row.koreanName ?? row.englishName ?? "현재 코드")
      : isTariffCode
        ? "관세율 기준 세번"
        : code.length === 4
          ? "4자리 호"
          : code.length === 6
            ? "6자리 소호"
            : "상위 세번";

    return { code, label, isCurrent };
  });
}

function DestinationHsHierarchyTrail({
  row,
  destinationCountry,
  originCountry
}: {
  row: ExportDestinationTariffItem & { hskCode?: string };
  destinationCountry: string;
  originCountry: string;
}) {
  const items = destinationHsPathItems(row);

  if (items.length <= 1) return null;

  return (
    <nav className="flex flex-wrap items-center gap-1.5 text-sm" aria-label="수입국 HS CODE 경로">
      {items.map((item, index) => (
        <Fragment key={item.code}>
          {index > 0 ? <span className="text-slate-300">/</span> : null}
          {item.isCurrent ? (
            <span className="rounded bg-slate-100 px-2 py-1 font-semibold text-slate-900">
              <span className="font-mono">{formatHsCode(item.code)}</span>
              <span className="ml-1 text-slate-600">{item.label}</span>
            </span>
          ) : (
            <Link
              className="rounded px-2 py-1 font-medium text-blue-700 underline-offset-2 hover:bg-blue-50 hover:underline"
              data-navigation-progress="수입국 HS 계층 조회"
              href={hsLookupHref({
                hskCode: row.hskCode ?? item.code,
                direction: "export",
                destinationCountry,
                originCountry,
                basisDate: row.basisDate,
                destinationHsCode: item.code
              })}
            >
              <span className="font-mono">{formatHsCode(item.code)}</span>
              <span className="ml-1 text-slate-600">{item.label}</span>
            </Link>
          )}
        </Fragment>
      ))}
    </nav>
  );
}

function hs8GroupKey(value: string) {
  const normalized = normalizeHsInput(value);

  return normalized.length >= 8 ? normalized.slice(0, 8) : "";
}

function startsHs8Group(value: string, previousValue?: string) {
  const key = hs8GroupKey(value);
  if (!key) return false;

  return key !== hs8GroupKey(previousValue ?? "");
}

function hsNavigatorRowClass({ isCurrent, startsGroup }: { isCurrent: boolean; startsGroup: boolean }) {
  return cn(
    startsGroup ? "border-t-2 border-slate-300" : "border-t border-slate-100",
    isCurrent ? "bg-slate-100 font-semibold text-slate-950" : "text-slate-800 hover:bg-slate-50"
  );
}

function HsCodeSideNavigator({
  result,
  destinationCountry,
  direction
}: {
  result: HsDirectLookupResult;
  destinationCountry: string;
  direction: "import" | "export";
}) {
  const currentCode = normalizeHsInput(result.hskCode);
  const visibleSiblings = result.classificationSiblings.filter((sibling) => normalizeHsInput(sibling.hskCode) !== currentCode);
  const hierarchyCodes = result.hierarchyPath.map((node) => node.code);

  return (
    <aside className="border-b border-slate-200 bg-white lg:border-b-0 lg:border-r">
      <div>
        <div className="grid h-10 grid-cols-[144px_minmax(0,1fr)] items-center bg-slate-900 text-sm font-semibold text-white">
          <div className="border-r border-slate-700 px-3 py-2 text-center">HSK</div>
          <div className="px-3 py-2 text-center">품명</div>
        </div>
        <div className="max-h-[calc(100vh-150px)] overflow-auto">
          <table className="w-full table-fixed border-collapse text-left text-xs">
            <colgroup>
              <col className="w-28" />
              <col />
            </colgroup>
            <tbody>
              {result.hierarchyPath.map((node, index) => {
                const normalized = normalizeHsInput(node.code);
                const isCurrent = normalized === currentCode;
                const startsGroup = startsHs8Group(normalized, hierarchyCodes[index - 1]);
                const rowClass = hsNavigatorRowClass({ isCurrent, startsGroup });
                const labelClass = node.level <= 4 ? "font-semibold" : "font-medium";
                const href = hsLookupHref({
                  hskCode: node.code,
                  direction,
                  destinationCountry,
                  basisDate: result.basisDate
                });

                return (
                  <tr className={rowClass} key={`${node.level}-${node.code}`}>
                    <td className="border-r border-slate-200 px-2 py-1.5 text-right align-top font-mono font-semibold text-slate-800">
                      <Link className="block h-full w-full underline-offset-2 hover:underline" href={href}>
                        {formatHsCode(node.code)}
                      </Link>
                    </td>
                    <td className={`px-2 py-1.5 align-top leading-5 ${labelClass}`}>
                      <Link
                        className="block truncate"
                        href={href}
                      >
                        {node.label}
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {visibleSiblings.map((sibling, index) => {
                const normalized = normalizeHsInput(sibling.hskCode);
                const previousCode = index > 0 ? visibleSiblings[index - 1]?.hskCode : result.hierarchyPath.at(-1)?.code;
                const startsGroup = startsHs8Group(normalized, previousCode);
                const rowClass = hsNavigatorRowClass({ isCurrent: sibling.isSelected, startsGroup });
                const href = hsLookupHref({
                  hskCode: sibling.hskCode,
                  direction,
                  destinationCountry,
                  basisDate: result.basisDate
                });

                return (
                  <tr className={rowClass} key={sibling.hskCode}>
                    <td className="border-r border-slate-200 px-2 py-1.5 text-right align-top font-mono font-medium text-slate-700">
                      <Link className="block h-full w-full underline-offset-2 hover:underline" href={href}>
                        {formatHsCode(sibling.hskCode)}
                      </Link>
                    </td>
                    <td className="px-2 py-1.5 align-top font-medium leading-5">
                      <Link
                        className="block truncate"
                        href={href}
                      >
                        {sibling.koreanName}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </aside>
  );
}

type Hs6NavigationSource = {
  hs6: string;
  koreanName: string;
  hierarchyPath: HsHierarchyNode[];
  hskCode: string;
};

type HsPrefixTreeItem = {
  hs4: string;
  label: string;
  count: number;
  hs6Items: Array<{
    hs6: string;
    label: string;
    count: number;
    children: Array<{
      hskCode: string;
      koreanName: string;
    }>;
  }>;
};

type ExportLookupSource = {
  hskCode: string;
  hs6?: string;
};

type HsLookupMode = "none" | "hs4_explorer" | "hs6_explorer" | "hsk_detail";

function hsLookupModeForCode(value: string): HsLookupMode {
  const normalized = normalizeHsInput(value);

  if (!normalized) return "none";
  if (normalized.length < 6) return "hs4_explorer";
  if (normalized.length === 6) return "hs6_explorer";
  return "hsk_detail";
}

function hsExplorerModeLabel(mode: HsLookupMode) {
  if (mode === "hs4_explorer") return "HS 4자리 호 탐색";
  if (mode === "hs6_explorer") return "HS 6자리 소호 탐색";
  return "HSK 10자리 상세조회";
}

function FavoriteStatusMessage({ status }: { status?: string }) {
  if (!status) return null;

  const message =
    status === "added"
      ? "즐겨찾기에 저장했습니다."
      : status === "removed"
        ? "즐겨찾기에서 해제했습니다."
        : "즐겨찾기 처리 중 오류가 발생했습니다. 다시 시도해 주세요.";

  return (
    <p
      className={
        status === "error"
          ? "mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800"
          : "mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800"
      }
    >
      {message}
    </p>
  );
}

function isGenericHsLabel(label?: string | null) {
  const normalized = (label ?? "").replace(/[\s.:-]/g, "").toLowerCase();

  return !normalized || normalized === "기타" || normalized === "other" || normalized.endsWith("소호");
}

function hs6NavigationLabel(group: Hs6NavigationSource[]) {
  const hierarchyLabel = group[0]?.hierarchyPath.find((node) => normalizeHsInput(node.code) === normalizeHsInput(group[0]?.hs6))?.label;

  if (!isGenericHsLabel(hierarchyLabel)) {
    return hierarchyLabel ?? "-";
  }

  const childNames = Array.from(new Set(group.map((item) => item.koreanName).filter((name) => !isGenericHsLabel(name))));

  if (childNames.length) {
    return `${childNames.slice(0, 2).join(" / ")}${childNames.length > 2 ? " 외" : ""}`;
  }

  return hierarchyLabel || group[0]?.koreanName || "-";
}

function hs4NavigationLabel(group: Hs6NavigationSource[]) {
  const hs4 = normalizeHsInput(group[0]?.hskCode).slice(0, 4);
  const hierarchyLabel = group[0]?.hierarchyPath.find((node) => normalizeHsInput(node.code) === hs4)?.label;

  if (!isGenericHsLabel(hierarchyLabel)) {
    return hierarchyLabel ?? "-";
  }

  return hierarchyLabel || group[0]?.koreanName || "-";
}

function buildHsPrefixTreeItems(results: Hs6NavigationSource[]): HsPrefixTreeItem[] {
  const hs4Groups = results.reduce((groups, result) => {
    const hs4 = normalizeHsInput(result.hskCode).slice(0, 4);
    const group = groups.get(hs4) ?? [];

    group.push(result);
    groups.set(hs4, group);

    return groups;
  }, new Map<string, Hs6NavigationSource[]>());

  return Array.from(hs4Groups.entries())
    .map(([hs4, hs4Group]) => {
      const hs6Groups = hs4Group.reduce((groups, result) => {
        const group = groups.get(result.hs6) ?? [];

        group.push(result);
        groups.set(result.hs6, group);

        return groups;
      }, new Map<string, Hs6NavigationSource[]>());

      return {
        hs4,
        label: hs4NavigationLabel(hs4Group),
        count: hs4Group.length,
        hs6Items: Array.from(hs6Groups.entries())
          .map(([hs6, hs6Group]) => ({
            hs6,
            label: hs6NavigationLabel(hs6Group),
            count: hs6Group.length,
            children: hs6Group
              .map((result) => ({
                hskCode: result.hskCode,
                koreanName: result.koreanName
              }))
              .sort((a, b) => normalizeHsInput(a.hskCode).localeCompare(normalizeHsInput(b.hskCode)))
          }))
          .sort((a, b) => a.hs6.localeCompare(b.hs6))
      };
    })
    .sort((a, b) => a.hs4.localeCompare(b.hs4));
}

function HsPrefixExplorerSummary({
  activeHs6,
  hs6Count,
  mode,
  normalizedQuery,
  resultCount
}: {
  activeHs6: string;
  hs6Count: number;
  mode: HsLookupMode;
  normalizedQuery: string;
  resultCount: number;
}) {
  const label = hsExplorerModeLabel(mode);
  const queryLabel = formatHsCode(normalizedQuery);

  return (
    <div className="grid gap-3 border-b border-slate-200 bg-slate-50 px-3 py-3 text-sm lg:grid-cols-[1fr_1fr_1fr]">
      <div>
        <div className="text-xs font-semibold text-slate-500">조회 모드</div>
        <div className="mt-1 font-semibold text-slate-950">{label}</div>
      </div>
      <div>
        <div className="text-xs font-semibold text-slate-500">입력 코드</div>
        <div className="mt-1 font-mono font-semibold text-slate-950">{queryLabel}</div>
      </div>
      <div>
        <div className="text-xs font-semibold text-slate-500">표시 범위</div>
        <div className="mt-1 text-slate-700">
          {mode === "hs4_explorer"
            ? `하위 HS6 ${hs6Count}개 / HSK ${resultCount}개`
            : `선택 HS6 ${formatHsCode(activeHs6)} / HSK ${resultCount}개`}
        </div>
      </div>
      <p className="rounded-md border border-slate-200 bg-white px-3 py-2 leading-6 text-slate-700 lg:col-span-3">
        {mode === "hs4_explorer"
          ? "4자리 호는 최종 신고 세번이 아니므로, 하위 6자리 소호와 10자리 HSK를 좁혀 선택하는 탐색 화면으로 표시합니다."
          : "6자리 소호는 국제 공통 기준입니다. 실제 국내 신고에는 하위 10자리 HSK 선택이 필요하므로 아래 목록에서 실제 품명과 가장 가까운 항목을 선택해 상세조회합니다."}
      </p>
    </div>
  );
}

function DestinationAdditionalTariffSummary({ rows }: { rows: ExportDestinationAdditionalTariffItem[] }) {
  if (!rows.length) return <span>-</span>;

  return (
    <ul className="grid gap-1.5">
      {rows.map((row) => (
        <li key={`${row.countryCode}-${row.destinationHsCode}-${row.additionalTariffCode}-${row.originCountryCode ?? ""}-${row.sourceVersion}`}>
          <DestinationAdditionalTariffDialog tariff={row} />
        </li>
      ))}
    </ul>
  );
}

function DestinationTradeRemedySummary({ rows }: { rows: ExportDestinationTradeRemedyCaseItem[] }) {
  if (!rows.length) return <span>-</span>;

  return (
    <ul className="grid gap-1.5">
      {rows.map((row) => (
        <li key={`${row.countryCode}-${row.destinationHsCode}-${row.caseNumber}-${row.originCountryCode ?? ""}-${row.sourceVersion}`}>
          <DestinationTradeRemedyDialog tradeRemedyCase={row} />
        </li>
      ))}
    </ul>
  );
}

function matchesDestinationCountry(recordCountry: string, selectedCountry: string) {
  return countryCodeAliases(selectedCountry).includes(recordCountry);
}

function mockDestinationTariffsForHsk(hskCode: string, destinationCountry: string, basisDate: string) {
  const hs6 = normalizeHsInput(hskCode).slice(0, 6);

  return mockExportDestinationTariffRates
    .filter((rate) => matchesDestinationCountry(rate.countryCode, destinationCountry))
    .filter((rate) => rate.basisDate === basisDate)
    .filter((rate) => {
      const destinationHs = normalizeHsInput(rate.destinationHsCode);

      return destinationHs.startsWith(hs6);
    })
    .slice(0, 5);
}

async function destinationTariffsForResults({
  results,
  direction,
  destinationCountry,
  basisDate
}: {
  results: ExportLookupSource[];
  direction: "import" | "export";
  destinationCountry: string;
  basisDate: string;
}) {
  return cachedLookup({
    key: lookupCacheKey("destination-tariffs-for-results", {
      codes: results.map((result) => normalizeHsInput(result.hskCode)).sort(),
      direction,
      destinationCountry,
      basisDate
    }),
    ttlMs: lookupCacheTtlMs,
    load: () => uncachedDestinationTariffsForResults({ results, direction, destinationCountry, basisDate })
  });
}

async function uncachedDestinationTariffsForResults({
  results,
  direction,
  destinationCountry,
  basisDate
}: {
  results: ExportLookupSource[];
  direction: "import" | "export";
  destinationCountry: string;
  basisDate: string;
}) {
  const tariffsByHsk = new Map<string, ExportDestinationTariffItem[]>();

  if (direction !== "export" || results.length === 0) {
    return tariffsByHsk;
  }

  if (hasSupabaseEnv()) {
    try {
      const supabase = await createSupabaseServerClient();
      const resultsByHs6 = new Map<string, ExportLookupSource[]>();

      for (const result of results) {
        const hs6 = result.hs6 || normalizeHsInput(result.hskCode).slice(0, 6);
        if (!hs6) continue;
        resultsByHs6.set(hs6, [...(resultsByHs6.get(hs6) ?? []), result]);
      }

      const tariffResults = await Promise.all(
        Array.from(resultsByHs6.entries()).map(async ([hs6, groupedResults]) => [
          groupedResults,
          await findExportDestinationTariffs(supabase, {
            hskCode: hs6,
            destinationCountry,
            basisDate,
            limit: destinationCountry === "ALL" ? 120 : 20
          })
        ] as const)
      );

      for (const [groupedResults, tariffs] of tariffResults) {
        for (const result of groupedResults) {
          tariffsByHsk.set(result.hskCode, tariffs);
        }
      }

      return tariffsByHsk;
    } catch {
      // Local development can run without Supabase credentials; fall back to bundled examples.
    }
  }

  for (const result of results) {
    tariffsByHsk.set(result.hskCode, mockDestinationTariffsForHsk(result.hskCode, destinationCountry, basisDate));
  }

  return tariffsByHsk;
}

async function destinationTariffsForDestinationCode({
  queryCode,
  direction,
  destinationCountry,
  basisDate
}: {
  queryCode: string;
  direction: "import" | "export";
  destinationCountry: string;
  basisDate: string;
}) {
  return cachedLookup({
    key: lookupCacheKey("destination-tariffs-by-destination-code", {
      queryCode: normalizeHsInput(queryCode),
      direction,
      destinationCountry,
      basisDate
    }),
    ttlMs: lookupCacheTtlMs,
    load: () => uncachedDestinationTariffsForDestinationCode({ queryCode, direction, destinationCountry, basisDate })
  });
}

async function uncachedDestinationTariffsForDestinationCode({
  queryCode,
  direction,
  destinationCountry,
  basisDate
}: {
  queryCode: string;
  direction: "import" | "export";
  destinationCountry: string;
  basisDate: string;
}) {
  if (direction !== "export" || normalizeHsInput(queryCode).length < 4 || destinationCountry === "ALL" || !hasSupabaseEnv()) {
    return [];
  }

  try {
    const supabase = await createSupabaseServerClient();
    return await findExportDestinationTariffsByDestinationCode(supabase, {
      destinationHsCode: queryCode,
      destinationCountry,
      basisDate,
      limit: 80
    });
  } catch {
    return [];
  }
}

async function destinationCustomsCodesForTariffs({
  tariffs,
  basisDate
}: {
  tariffs: ExportDestinationTariffItem[];
  basisDate: string;
  originCountryCode?: string;
}) {
  return cachedLookup({
    key: lookupCacheKey("destination-customs-codes-for-tariffs", {
      tariffs: tariffs.map((tariff) => ({
        countryCode: tariff.countryCode,
        code: normalizeHsInput(tariff.destinationTariffCode ?? tariff.destinationHsCode)
      })).sort((a, b) => `${a.countryCode}:${a.code}`.localeCompare(`${b.countryCode}:${b.code}`)),
      basisDate
    }),
    ttlMs: lookupCacheTtlMs,
    load: () => uncachedDestinationCustomsCodesForTariffs({ tariffs, basisDate })
  });
}

async function uncachedDestinationCustomsCodesForTariffs({
  tariffs,
  basisDate
}: {
  tariffs: ExportDestinationTariffItem[];
  basisDate: string;
}) {
  const codesByTariffKey = new Map<string, ExportDestinationCustomsCodeItem[]>();

  if (!hasSupabaseEnv() || tariffs.length === 0) {
    return codesByTariffKey;
  }

  const uniqueTariffs = Array.from(
    new Map(tariffs.map((tariff) => [
      `${tariff.countryCode}:${tariff.destinationTariffCode ?? tariff.destinationHsCode}`,
      tariff
    ])).values()
  );

  try {
    const supabase = await createSupabaseServerClient();
    const rows = await Promise.all(
      uniqueTariffs.map(async (tariff) => {
        const tariffCode = tariff.destinationTariffCode ?? tariff.destinationHsCode;
        const key = `${tariff.countryCode}:${normalizeHsInput(tariffCode)}`;
        const customsCodes = await findExportDestinationCustomsCodes(supabase, {
          countryCode: tariff.countryCode,
          queryCode: tariffCode,
          basisDate,
          limit: 40
        });
        return { key, customsCodes };
      })
    );

    for (const row of rows) {
      codesByTariffKey.set(row.key, row.customsCodes);
    }
  } catch {
    // Destination-country customs-code collectors are optional while each country connector is added.
  }

  return codesByTariffKey;
}

function destinationImportDataKey(countryCode: string, destinationHsCode: string) {
  return `${countryCode}:${normalizeHsInput(destinationHsCode)}`;
}

async function destinationImportDataForTariffs({
  tariffs,
  basisDate,
  originCountryCode,
  selectedDestinationCountry
}: {
  tariffs: ExportDestinationTariffItem[];
  basisDate: string;
  originCountryCode?: string;
  selectedDestinationCountry?: string;
}) {
  return cachedLookup({
    key: lookupCacheKey("destination-import-data-for-tariffs", {
      tariffs: tariffs.map((tariff) => ({
        countryCode: tariff.countryCode,
        destinationHsCode: normalizeHsInput(tariff.destinationHsCode)
      })).sort((a, b) => `${a.countryCode}:${a.destinationHsCode}`.localeCompare(`${b.countryCode}:${b.destinationHsCode}`)),
      basisDate,
      originCountryCode,
      selectedDestinationCountry
    }),
    ttlMs: lookupCacheTtlMs,
    load: () => uncachedDestinationImportDataForTariffs({ tariffs, basisDate, originCountryCode, selectedDestinationCountry })
  });
}

async function uncachedDestinationImportDataForTariffs({
  tariffs,
  basisDate,
  originCountryCode,
  selectedDestinationCountry
}: {
  tariffs: ExportDestinationTariffItem[];
  basisDate: string;
  originCountryCode?: string;
  selectedDestinationCountry?: string;
}) {
  const requirementsByKey = new Map<string, ExportDestinationImportRequirementItem[]>();
  const internalTaxesByKey = new Map<string, ExportDestinationInternalTaxItem[]>();
  const additionalTariffsByKey = new Map<string, ExportDestinationAdditionalTariffItem[]>();
  const tradeRemedyCasesByKey = new Map<string, ExportDestinationTradeRemedyCaseItem[]>();

  if (!hasSupabaseEnv() || tariffs.length === 0) {
    return { requirementsByKey, internalTaxesByKey, additionalTariffsByKey, tradeRemedyCasesByKey };
  }

  const uniqueTariffs = Array.from(
    new Map(tariffs.map((tariff) => [
      destinationImportDataKey(tariff.countryCode, tariff.destinationHsCode),
      tariff
    ])).values()
  );

  try {
    const supabase = await createSupabaseServerClient();
    const rows = await Promise.all(
      uniqueTariffs.map(async (tariff) => {
        const key = destinationImportDataKey(tariff.countryCode, tariff.destinationHsCode);
        const lookupCountryCode = selectedDestinationCountry && selectedDestinationCountry !== "ALL"
          ? selectedDestinationCountry
          : tariff.countryCode;
        const [requirements, internalTaxes, additionalTariffs, tradeRemedyCases] = await Promise.all([
          findExportDestinationImportRequirements(supabase, {
            countryCode: lookupCountryCode,
            destinationHsCode: tariff.destinationHsCode,
            basisDate,
            limit: 50
          }),
          findExportDestinationInternalTaxes(supabase, {
            countryCode: lookupCountryCode,
            destinationHsCode: tariff.destinationHsCode,
            basisDate,
            limit: 50
          }),
          findExportDestinationAdditionalTariffs(supabase, {
            countryCode: lookupCountryCode,
            destinationHsCode: tariff.destinationHsCode,
            basisDate,
            originCountryCode,
            limit: 50
          }),
          findExportDestinationTradeRemedyCases(supabase, {
            countryCode: lookupCountryCode,
            destinationHsCode: tariff.destinationHsCode,
            basisDate,
            originCountryCode,
            limit: 50
          })
        ]);

        return { key, requirements, internalTaxes, additionalTariffs, tradeRemedyCases };
      })
    );

    for (const row of rows) {
      requirementsByKey.set(row.key, row.requirements);
      internalTaxesByKey.set(row.key, row.internalTaxes);
      additionalTariffsByKey.set(row.key, row.additionalTariffs);
      tradeRemedyCasesByKey.set(row.key, row.tradeRemedyCases);
    }
  } catch {
    // Destination-country requirement collectors are optional while each country connector is added.
  }

  return { requirementsByKey, internalTaxesByKey, additionalTariffsByKey, tradeRemedyCasesByKey };
}

async function internalTaxCodesForResults({
  results,
  basisDate
}: {
  results: Array<{ hskCode: string; koreanName: string }>;
  basisDate: string;
}) {
  return cachedLookup({
    key: lookupCacheKey("internal-tax-codes-for-results", {
      results: results.map((result) => ({
        hskCode: normalizeHsInput(result.hskCode),
        koreanName: result.koreanName
      })).sort((a, b) => a.hskCode.localeCompare(b.hskCode)),
      basisDate
    }),
    ttlMs: lookupCacheTtlMs,
    load: () => uncachedInternalTaxCodesForResults({ results, basisDate })
  });
}

async function uncachedInternalTaxCodesForResults({
  results,
  basisDate
}: {
  results: Array<{ hskCode: string; koreanName: string }>;
  basisDate: string;
}) {
  const rowsByHsk = new Map<string, InternalTaxCodeMatch[]>();

  if (!hasSupabaseEnv() || results.length === 0) {
    return rowsByHsk;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const statisticalCodes = await cachedInternalTaxStatisticalCodes(basisDate);
    const codeResults = await Promise.all(
      results.map(async (result) => {
        const lawRules = await findInternalTaxLawRuleMatches(supabase, {
          hskCode: result.hskCode,
          query: result.koreanName,
          basisDate,
          limit: 8
        });
        const statisticalCodeMatches = matchInternalTaxCodes(statisticalCodes, result.koreanName, 5);

        return [
          result.hskCode,
          [...lawRules, ...statisticalCodeMatches]
        ] as const;
      })
    );

    for (const [hskCode, rows] of codeResults) {
      rowsByHsk.set(hskCode, [...rows]);
    }
  } catch {
    // Keep HS lookup usable when the local legal-data database is unavailable.
  }

  return rowsByHsk;
}

function cachedInternalTaxStatisticalCodes(basisDate: string) {
  return cachedLookup({
    key: lookupCacheKey("internal-tax-statistical-codes", { basisDate }),
    ttlMs: hsPrefixLookupCacheTtlMs,
    load: async () => {
      if (!hasSupabaseEnv()) return [] as CustomsStatisticalCodeRecord[];

      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase
        .from("customs_statistical_codes")
        .select("code_type, code, korean_name, korean_abbreviation, english_abbreviation, english_note, internal_tax_rate, source_name, source_version, effective_from, effective_to, status")
        .eq("code_type", "A01")
        .lte("effective_from", basisDate)
        .or(`effective_to.is.null,effective_to.gte.${basisDate}`)
        .eq("status", "published")
        .order("code");

      if (error) throw new Error(error.message);

      return (data ?? []) as CustomsStatisticalCodeRecord[];
    }
  });
}

function EmptyDestinationTariffState({ dictionary }: { dictionary: HsDirectDictionary }) {
  return (
    <div className="px-3 py-4 text-sm text-slate-500">
      {dictionary.destination.noDestinationData}
    </div>
  );
}

function destinationCountrySubjectLabel(countryCode: string) {
  const label = exportCountryLabel(countryCode);
  if (countryCode === "ALL") return "모든국가";
  if (!label) return "수입국";

  return label.replace(/\s*\([A-Z]{2,3}\)\s*$/, "");
}

function destinationMatchLabel(matchBasis: ExportDestinationTariffItem["matchBasis"], dictionary: HsDirectDictionary) {
  if (matchBasis === "exact") return dictionary.destination.matchExact;
  if (matchBasis === "prefix") return dictionary.destination.matchPrefix;
  if (matchBasis === "hs6") return dictionary.destination.matchHs6;
  return dictionary.destination.matchHs4;
}

function destinationMatchDisplay(row: ExportDestinationTariffItem, dictionary: HsDirectDictionary) {
  return `${destinationMatchLabel(row.matchBasis, dictionary)} · ${row.matchScore}${dictionary.destination.points}`;
}

function destinationTariffKey(row: ExportDestinationTariffItem) {
  return `${row.countryCode}:${normalizeHsInput(row.destinationTariffCode ?? row.destinationHsCode)}`;
}

function hasSameDestinationCode(row: ExportDestinationTariffItem, sourceCode: string) {
  const normalizedSource = normalizeHsInput(sourceCode);

  return normalizedSource.length >= 10 && normalizeHsInput(row.destinationHsCode) === normalizedSource;
}

function destinationCodeRoleLabel(role: string) {
  if (role === "vat_9_non_full_item") return "9% VAT 신고번호";
  if (role === "vat_policy_item") return "VAT 특례 신고번호";
  if (role === "consumption_tax_policy_item") return "소비세 대상 신고번호";
  return "신고상품번호";
}

function DestinationCountryResultTable({
  rows,
  destinationCountry,
  requirementsByKey,
  internalTaxesByKey,
  additionalTariffsByKey,
  tradeRemedyCasesByKey,
  customsCodesByTariffKey,
  basisDate,
  sourceQuery,
  sourceHs6,
  originCountry,
  dictionary
}: {
  rows: Array<ExportDestinationTariffItem & { hskCode?: string }>;
  destinationCountry: string;
  requirementsByKey: Map<string, ExportDestinationImportRequirementItem[]>;
  internalTaxesByKey: Map<string, ExportDestinationInternalTaxItem[]>;
  additionalTariffsByKey: Map<string, ExportDestinationAdditionalTariffItem[]>;
  tradeRemedyCasesByKey: Map<string, ExportDestinationTradeRemedyCaseItem[]>;
  customsCodesByTariffKey: Map<string, ExportDestinationCustomsCodeItem[]>;
  basisDate: string;
  sourceQuery: string;
  sourceHs6?: string;
  originCountry: string;
  dictionary: HsDirectDictionary;
}) {
  if (!rows.length) return <EmptyDestinationTariffState dictionary={dictionary} />;

  const showCountryColumn = destinationCountry === "ALL";
  const countryLabel = showCountryColumn ? dictionary.destination.destinationCountry : destinationCountrySubjectLabel(destinationCountry);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1120px] text-left text-sm">
        <thead className="border-y border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500">
          <tr>
            {showCountryColumn ? <th className="px-3 py-2">{dictionary.destination.destinationCountry}</th> : null}
            <th className="px-3 py-2">{countryLabel} HS CODE</th>
            <th className="px-3 py-2">{dictionary.destination.customsCodeCandidates}</th>
            <th className="px-3 py-2">{dictionary.destination.destinationProductName}</th>
            <th className="px-3 py-2">{dictionary.destination.baseRate}</th>
            <th className="px-3 py-2">{dictionary.destination.agreementRate}</th>
            <th className="px-3 py-2">{dictionary.destination.additionalTariff}</th>
            <th className="px-3 py-2">{dictionary.destination.adCvd}</th>
            <th className="px-3 py-2">{dictionary.destination.internalTaxes}</th>
            <th className="px-3 py-2">{dictionary.destination.importRequirements}</th>
            <th className="px-3 py-2">{dictionary.destination.dataYear}</th>
            <th className="px-3 py-2">{dictionary.destination.match}</th>
            <th className="px-3 py-2">{dictionary.destination.koreaHs6}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => {
            const rowDestinationCountry = showCountryColumn ? row.countryCode : destinationCountry;
            const importDataKey = destinationImportDataKey(row.countryCode, row.destinationHsCode);
            const internalTaxes = internalTaxesByKey.get(importDataKey) ?? [];
            const requirements = requirementsByKey.get(importDataKey) ?? [];
            const additionalTariffs = additionalTariffsByKey.get(importDataKey) ?? [];
            const tradeRemedyCases = tradeRemedyCasesByKey.get(importDataKey) ?? [];
            const customsCodes = customsCodesByTariffKey.get(destinationTariffKey(row)) ?? [];
            const productName = row.koreanName ?? row.englishName ?? "-";
            const koreanHs6 = sourceHs6 ?? (row.hskCode ? normalizeHsInput(row.hskCode).slice(0, 6) : "");
            const agreementRateItems = destinationAgreementRateDisplayItems(row, originCountry);
            const agreementRateLabel = destinationDisplayAgreementRates(row, originCountry);

            return (
              <tr key={`${row.hskCode ?? ""}-${row.countryCode}-${row.destinationHsCode}-${row.sourceVersion}`}>
                {showCountryColumn ? (
                  <td className="whitespace-nowrap px-3 py-2 font-semibold text-slate-800">{exportCountryLabel(row.countryCode)}</td>
                ) : null}
                <td className="whitespace-nowrap px-3 py-2 font-mono font-semibold">
                  <Link
                    className="text-blue-700 underline-offset-2 hover:underline"
                    href={hsLookupHref({
                      hskCode: sourceQuery,
                      direction: "export",
                      destinationCountry: rowDestinationCountry,
                      originCountry,
                      basisDate,
                      destinationHsCode: row.destinationHsCode
                    })}
                  >
                    {formatHsCode(row.destinationHsCode)}
                  </Link>
                </td>
                <td className="px-3 py-2 text-slate-700">
                  {customsCodes.length ? (
                    <div className="flex max-w-[360px] flex-wrap gap-1">
                      {customsCodes.slice(0, 6).map((code) => (
                        <Link
                          className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-xs text-blue-700 hover:bg-blue-50"
                          href={hsLookupHref({
                            hskCode: sourceQuery,
                            direction: "export",
                            destinationCountry: rowDestinationCountry,
                            originCountry,
                            basisDate,
                            destinationHsCode: code.customsCode
                          })}
                          key={`${code.customsCode}-${code.sourceVersion}`}
                          title={code.koreanName ?? code.englishName ?? ""}
                        >
                          {formatHsCode(code.customsCode)}
                        </Link>
                      ))}
                      {customsCodes.length > 6 ? <span className="text-xs text-slate-500">+{customsCodes.length - 6}</span> : null}
                    </div>
                  ) : "-"}
                </td>
                <td className="px-3 py-2 font-medium text-slate-900">{productName}</td>
                <td className="px-3 py-2 font-semibold text-orange-600">{destinationDisplayBaseRate(row)}</td>
                <td className="px-3 py-2 leading-6 text-slate-700">
                  <DestinationAgreementRateDialog items={agreementRateItems} label={agreementRateLabel} />
                </td>
                <td className="px-3 py-2 leading-6 text-rose-700">
                  <DestinationAdditionalTariffSummary rows={additionalTariffs} />
                </td>
                <td className="px-3 py-2 leading-6 text-rose-700">
                  <DestinationTradeRemedySummary rows={tradeRemedyCases} />
                </td>
                <td className="px-3 py-2 text-slate-700">
                  <DestinationInternalTaxSummary rows={internalTaxes} />
                </td>
                <td className="px-3 py-2 text-slate-700">
                  {requirements.length ? `${requirements.length}건` : "-"}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-slate-600">{row.tariffYear}년</td>
                <td className="whitespace-nowrap px-3 py-2 text-slate-600">{destinationMatchDisplay(row, dictionary)}</td>
                <td className="whitespace-nowrap px-3 py-2 font-mono text-slate-500">{koreanHs6 ? formatHsCode(koreanHs6) : "-"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function destinationCopySummaryTexts({
  row,
  productName,
  agreementRateLabel,
  internalTaxes,
  requirements,
  additionalTariffs,
  tradeRemedyCases
}: {
  row: ExportDestinationTariffItem & { hskCode?: string };
  productName: string;
  agreementRateLabel: string;
  internalTaxes: ExportDestinationInternalTaxItem[];
  requirements: ExportDestinationImportRequirementItem[];
  additionalTariffs: ExportDestinationAdditionalTariffItem[];
  tradeRemedyCases: ExportDestinationTradeRemedyCaseItem[];
}) {
  return buildCopyTextSet((language, variant) => {
    const labels = copyLabels(language);
    const lines = [
      `${labels.productName} / ${labels.hsCode}`,
      `${productName} / ${formatHsCode(row.destinationHsCode)}`,
      labels.importRequirements
    ];

    if (requirements.length) {
      for (const requirement of requirements) {
        lines.push(`- ${requirement.requirementName}${requirement.agency ? ` / ${requirement.agency}` : ""}`);
      }
    } else {
      appendNoRequirementCopyLines(lines, language);
    }

    if (variant === "brief") return lines.join("\n");

    lines.push("");
    lines.push(labels.preliminaryNotice);
    lines.push("");
    lines.push(`${labels.appliedDutyRate} : ${destinationDisplayBaseRate(row)}`);

    if (agreementRateLabel !== "-") {
      lines.push(`${labels.ftaRate} : ${agreementRateLabel}`);
    }

    if (additionalTariffs.length) {
      lines.push(`${labels.additionalTariff} : ${additionalTariffs.map((tariff) => `${tariff.tariffProgram} ${tariff.rateText ?? "-"}`).join(" / ")}`);
    }

    if (tradeRemedyCases.length) {
      lines.push(`${labels.adCvd} : ${tradeRemedyCases.map((item) => `${item.caseNumber} ${item.rateText ?? "-"}`).join(" / ")}`);
    }

    lines.push(labels.internalTax);
    if (internalTaxes.length) {
      for (const tax of internalTaxes) {
        lines.push(`${destinationInternalTaxText(tax)}${tax.basis ? ` / ${tax.basis}` : ""}`);
      }
    } else {
      lines.push(labels.noDestinationInternalTax);
    }

    lines.push("");
    lines.push(labels.finalReviewNote);

    return lines.join("\n");
  });
}

function DestinationInternalTaxSummary({ rows }: { rows: ExportDestinationInternalTaxItem[] }) {
  if (!rows.length) return <>-</>;

  return (
    <span className="inline-flex flex-wrap gap-x-2 gap-y-1">
      {rows.map((tax, index) => (
        <Fragment key={`${tax.countryCode}-${tax.destinationHsCode}-${tax.taxType}-${tax.taxName}-${tax.rateText ?? ""}-${tax.sourceVersion}`}>
          {index > 0 ? <span className="text-slate-400">/</span> : null}
          <DestinationInternalTaxDialog tax={tax} />
        </Fragment>
      ))}
    </span>
  );
}

function DestinationCountryDetailPage({
  row,
  destinationCountry,
  requirements,
  internalTaxes,
  additionalTariffs,
  tradeRemedyCases,
  customsCodes,
  sourceHs6,
  originCountry,
  dictionary
}: {
  row: ExportDestinationTariffItem & { hskCode?: string };
  destinationCountry: string;
  requirements: ExportDestinationImportRequirementItem[];
  internalTaxes: ExportDestinationInternalTaxItem[];
  additionalTariffs: ExportDestinationAdditionalTariffItem[];
  tradeRemedyCases: ExportDestinationTradeRemedyCaseItem[];
  customsCodes: ExportDestinationCustomsCodeItem[];
  sourceHs6?: string;
  originCountry: string;
  dictionary: HsDirectDictionary;
}) {
  const productName = row.koreanName ?? row.englishName ?? "-";
  const koreanHs6 = sourceHs6 ?? (row.hskCode ? normalizeHsInput(row.hskCode).slice(0, 6) : "");
  const tariffCode = row.destinationTariffCode ?? row.destinationHsCode;
  const selectedCustomsCode = row.destinationCustomsCode;
  const agreementRateItems = destinationAgreementRateDisplayItems(row, originCountry);
  const agreementRateLabel = destinationDisplayAgreementRates(row, originCountry);
  const detailCountry = destinationCountry === "ALL" ? row.countryCode : destinationCountry;

  return (
    <section className="border-b border-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
        <span>{dictionary.destination.destinationHsDetail}</span>
        <HsCopySummaryButton
          texts={destinationCopySummaryTexts({
            row,
            productName,
            agreementRateLabel,
            internalTaxes,
            requirements,
            additionalTariffs,
            tradeRemedyCases
          })}
        />
      </div>
      <dl className="grid text-sm sm:grid-cols-[160px_1fr]">
        <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">{dictionary.destination.destinationCountry}</dt>
        <dd className="border-b border-slate-200 px-3 py-2">{exportCountryLabel(detailCountry)}</dd>
        <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">{dictionary.destination.destinationHsCode}</dt>
        <dd className="border-b border-slate-200 px-3 py-2 font-mono font-semibold text-slate-950">{formatHsCode(row.destinationHsCode)}</dd>
        <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">{dictionary.destination.destinationHsPath}</dt>
        <dd className="border-b border-slate-200 px-3 py-2">
          <DestinationHsHierarchyTrail
            destinationCountry={detailCountry}
            originCountry={originCountry}
            row={row}
          />
        </dd>
        {selectedCustomsCode ? (
          <>
            <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">{dictionary.destination.tariffBasisCode}</dt>
            <dd className="border-b border-slate-200 px-3 py-2">
              <span className="font-mono font-semibold">{formatHsCode(tariffCode)}</span>
              <span className="ml-2 text-slate-600">중국 2026 세칙 8자리 기준</span>
            </dd>
          </>
        ) : null}
        <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">{dictionary.destination.destinationProductName}</dt>
        <dd className="border-b border-slate-200 px-3 py-2">{productName}</dd>
        <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">{dictionary.destination.baseRate}</dt>
        <dd className="border-b border-slate-200 px-3 py-2 font-semibold text-orange-600">{destinationDisplayBaseRate(row)}</dd>
        <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">{dictionary.destination.agreementRate}</dt>
        <dd className="border-b border-slate-200 px-3 py-2 leading-6">
          <DestinationAgreementRateDialog items={agreementRateItems} label={agreementRateLabel} />
        </dd>
        <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">{dictionary.destination.additionalTariff}</dt>
        <dd className="border-b border-slate-200 px-3 py-2 leading-6 text-rose-700">
          <DestinationAdditionalTariffSummary rows={additionalTariffs} />
        </dd>
        <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">{dictionary.destination.adCvd}</dt>
        <dd className="border-b border-slate-200 px-3 py-2 leading-6 text-rose-700">
          <DestinationTradeRemedySummary rows={tradeRemedyCases} />
        </dd>
        <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">{dictionary.destination.generalRate}</dt>
        <dd className="border-b border-slate-200 px-3 py-2 text-slate-700">{row.baseRateText ?? "-"}</dd>
        <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">{dictionary.destination.internalTaxes}</dt>
        <dd className="border-b border-slate-200 px-3 py-2">
          {internalTaxes.length ? <DestinationInternalTaxSummary rows={internalTaxes} /> : dictionary.destination.noInternalTaxData}
        </dd>
        <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">{dictionary.destination.importRequirements}</dt>
        <dd className="border-b border-slate-200 px-3 py-2">
          {requirements.length ? (
            <ul className="grid gap-2">
              {requirements.map((requirement) => (
                <li key={`${requirement.countryCode}-${requirement.destinationHsCode}-${requirement.requirementType}-${requirement.requirementName}`}>
                  <DestinationImportRequirementDialog requirement={requirement} />
                  <div className="text-slate-600">{[requirement.agency, requirement.legalBasis].filter(Boolean).join(" / ")}</div>
                </li>
              ))}
            </ul>
          ) : dictionary.destination.noRequirementData}
        </dd>
        <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">{dictionary.destination.dataYear}</dt>
        <dd className="border-b border-slate-200 px-3 py-2">{row.tariffYear}년</dd>
        {customsCodes.length ? (
          <>
            <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">{dictionary.destination.customsCodeCandidates}</dt>
            <dd className="border-b border-slate-200 px-3 py-2">
              <div className="grid gap-2">
                {customsCodes.slice(0, 20).map((code) => (
                  <Link
                    className={`rounded-md border px-3 py-2 hover:bg-blue-50 ${code.customsCode === selectedCustomsCode ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white"}`}
                    href={hsLookupHref({
                      hskCode: row.hskCode ?? koreanHs6 ?? row.destinationHsCode,
                      direction: "export",
                      destinationCountry: detailCountry,
                      originCountry,
                      basisDate: row.basisDate,
                      destinationHsCode: code.customsCode
                    })}
                    key={`${code.customsCode}-${code.sourceVersion}`}
                  >
                    <span className="font-mono font-semibold text-blue-700">{formatHsCode(code.customsCode)}</span>
                    <span className="ml-2 text-slate-700">{code.koreanName ?? code.englishName ?? "-"}</span>
                    <span className="ml-2 text-xs text-slate-500">{destinationCodeRoleLabel(code.codeRole)}</span>
                  </Link>
                ))}
              </div>
            </dd>
          </>
        ) : null}
        <dt className="bg-slate-50 px-3 py-2 font-semibold text-slate-600">{dictionary.destination.hs6Connection}</dt>
        <dd className="px-3 py-2 font-mono">{koreanHs6 ? formatHsCode(koreanHs6) : "-"}</dd>
      </dl>
    </section>
  );
}

function InternalTaxSection({ dictionary, rows }: { dictionary: HsDirectDictionary; rows: InternalTaxCodeMatch[] }) {
  const hasVatRule = rows.some((row) => row.name.includes("부가가치세"));

  return (
    <div className="border-t border-slate-200">
      <div className="bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900">{dictionary.destination.internalTaxes}</div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-y border-slate-200 text-xs font-semibold text-slate-500">
            <tr>
              <th className="px-3 py-2">{dictionary.result.taxType}</th>
              <th className="px-3 py-2">{dictionary.result.code}</th>
              <th className="px-3 py-2">{dictionary.result.content}</th>
              <th className="px-3 py-2">{dictionary.result.taxRate}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {!hasVatRule ? (
              <tr>
                <td className="px-3 py-2 font-medium text-slate-900">부가가치세</td>
                <td className="px-3 py-2 text-slate-500">{dictionary.result.vatDefault}</td>
                <td className="px-3 py-2 text-slate-700">{dictionary.result.vatGeneralImport}</td>
                <td className="px-3 py-2 font-semibold text-orange-600">10%</td>
              </tr>
            ) : null}
            {rows.map((row) => (
              <tr key={`${row.codeType}-${row.code}-${row.name}`}>
                <td className="px-3 py-2 font-medium text-slate-900">{row.lawName ?? "개별소비세 등"}</td>
                <td className="whitespace-nowrap px-3 py-2 font-mono text-slate-700">{row.code}</td>
                <td className="px-3 py-2 text-slate-700">
                  <div className="font-medium text-slate-900">{row.name}</div>
                  {row.conditionText || row.matchBasis ? (
                    <div className="mt-1 text-xs leading-5 text-slate-500">
                      {[row.articleRef, row.matchBasis, row.conditionText].filter(Boolean).join(" / ")}
                    </div>
                  ) : null}
                </td>
                <td className="px-3 py-2 font-semibold text-orange-600">{row.rateText}</td>
              </tr>
            ))}
            {!rows.length ? (
              <tr>
                <td className="px-3 py-3 text-slate-500" colSpan={4}>
                  {dictionary.result.additionalInternalTaxEmpty}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EmptySectionState({ children }: { children: string }) {
  return <div className="px-3 py-4 text-sm text-slate-500">{children}</div>;
}

function HsSupplementGuidancePanel({
  basisDate,
  destinationCountry,
  guidance,
  originCountry,
  direction
}: {
  basisDate: string;
  destinationCountry: string;
  guidance: HsSupplementGuidance;
  originCountry: string;
  direction: "import" | "export";
}) {
  if (guidance.level === "unknown") return null;

  return (
    <section className="mt-5 overflow-hidden rounded-md border border-blue-200 bg-blue-50">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-200 px-3 py-2">
        <div>
          <h2 className="text-sm font-semibold text-blue-950">{guidance.title}</h2>
          <p className="mt-1 text-xs leading-5 text-blue-800">{guidance.description}</p>
        </div>
        <Badge tone="info">{guidance.level.toUpperCase()}</Badge>
      </div>
      <div className="grid gap-4 p-3 lg:grid-cols-[1.25fr_0.75fr]">
        <div>
          <p className="text-xs font-semibold text-blue-900">보완 질문</p>
          <ol className="mt-2 grid gap-2">
            {guidance.questions.map((question, index) => (
              <li className="rounded-md border border-blue-100 bg-white px-3 py-2 text-sm leading-6 text-slate-700" key={question}>
                <span className="mr-2 font-mono text-xs font-semibold text-blue-700">{index + 1}</span>
                {question}
              </li>
            ))}
          </ol>
        </div>
        <div>
          <p className="text-xs font-semibold text-blue-900">첨부하면 좋은 자료</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {guidance.recommendedMaterials.map((material) => (
              <span className="rounded-full border border-blue-100 bg-white px-2.5 py-1 text-xs font-semibold text-blue-800" key={material}>
                {material}
              </span>
            ))}
          </div>
          {guidance.canRequestConfirmation ? (
            <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3">
              <p className="text-xs leading-5 text-amber-900">
                이 코드를 기준으로 관세율, 내국세, 수입요건 또는 수출요건 상세 화면을 조회할 수 있습니다.
              </p>
              <Link
                className="focus-ring mt-3 inline-flex items-center justify-center rounded-md bg-blue-700 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800"
                data-navigation-progress="상세조회"
                href={hsLookupHref({
                  hskCode: guidance.code,
                  direction,
                  destinationCountry,
                  originCountry,
                  basisDate
                })}
              >
                이 코드로 상세조회
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function ExportDomesticDiagnosisSection({
  dictionary,
  results,
  destinationCountry,
  originCountry
}: {
  dictionary: HsDirectDictionary;
  results: ExportDiagnosisResult[];
  destinationCountry: string;
  originCountry: string;
}) {
  if (!results.length) {
    return (
      <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        {dictionary.exportDomestic.noKoreaExportData}
      </div>
    );
  }

  return (
    <div className="mt-5 grid gap-4">
      {results.map((result) => (
        <article className="overflow-hidden rounded-md border border-slate-200" key={result.hskCode}>
          <div className="bg-blue-700 px-3 py-2 text-sm font-semibold text-white">{dictionary.exportDomestic.hskResultTitle}</div>
          <dl className="grid text-sm sm:grid-cols-[140px_1fr_140px_1fr]">
            <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">HSK</dt>
            <dd className="border-b border-slate-200 px-3 py-2 font-mono font-semibold text-slate-950">{formatHsCode(result.hskCode)}</dd>
            <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">{dictionary.product.hs6}</dt>
            <dd className="border-b border-slate-200 px-3 py-2 font-mono text-slate-700">{formatHsCode(result.hs6)}</dd>
            <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">{dictionary.exportDomestic.productName}</dt>
            <dd className="border-b border-slate-200 px-3 py-2 sm:col-span-3">{result.productName}</dd>
            <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">{dictionary.exportDomestic.destinationCountry}</dt>
            <dd className="border-b border-slate-200 px-3 py-2">{exportCountryLabel(destinationCountry)}</dd>
            <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">{dictionary.result.basisDatePrefix}</dt>
            <dd className="border-b border-slate-200 px-3 py-2">{result.basisDate}</dd>
          </dl>
          <div className="grid gap-2 border-b border-slate-200 bg-blue-50 px-3 py-3 sm:grid-cols-2">
            <Link
              className="focus-ring inline-flex items-center justify-center gap-2 rounded-md border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-blue-800 hover:bg-blue-50"
              data-navigation-progress="운송 견적 요청"
              href={buildMarketplaceRequestHref("freight", {
                basisDate: result.basisDate,
                destinationCountry,
                direction: "export",
                hskCode: result.hskCode,
                hs6: result.hs6,
                originCountry,
                productName: result.productName
              })}
            >
              <PackagePlus aria-hidden="true" size={16} />
              이 코드로 운송 초안 만들기
            </Link>
            <Link
              className="focus-ring inline-flex items-center justify-center gap-2 rounded-md border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-blue-800 hover:bg-blue-50"
              data-navigation-progress="통관 의뢰 요청"
              href={buildMarketplaceRequestHref("clearance", {
                basisDate: result.basisDate,
                destinationCountry,
                direction: "export",
                hskCode: result.hskCode,
                hs6: result.hs6,
                originCountry,
                productName: result.productName
              })}
            >
              <FileText aria-hidden="true" size={16} />
              이 코드로 통관 초안 만들기
            </Link>
            <p className="text-xs leading-5 text-blue-900 sm:col-span-2">
              수출요건, 전략물자, FTA C/O 검토는 예비진단이며 담당자 검토가 필요합니다.
            </p>
          </div>

          <form action="/hs/overseas" className="grid gap-3 border-t border-slate-200 bg-slate-50 px-3 py-3 sm:grid-cols-[220px_1fr_auto] sm:items-end" method="get">
            <input name="query" type="hidden" value={result.hskCode} />
            <input name="originCountry" type="hidden" value={originCountry} />
            <input name="basisDate" type="hidden" value={result.basisDate} />
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              {dictionary.exportDomestic.destinationLabel}
              <select className="focus-ring rounded-md border border-slate-300 bg-white px-3 py-2" defaultValue={destinationCountry} name="destinationCountry">
                {destinationCountryOptions.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="text-xs leading-5 text-slate-500">
              {dictionary.exportDomestic.destinationHelp}
            </div>
            <button className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800" type="submit">
              <ExternalLink aria-hidden="true" size={16} />
              {dictionary.exportDomestic.showDestinationResult}
            </button>
          </form>

          <section className="border-t border-slate-200">
            <div className="bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900">{dictionary.exportDomestic.exportRequirement}</div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="border-y border-slate-200 text-xs font-semibold text-slate-500">
                  <tr>
                    <th className="px-3 py-2">{dictionary.result.taxType}</th>
                    <th className="px-3 py-2">{dictionary.exportDomestic.requirementName}</th>
                    <th className="px-3 py-2">{dictionary.exportDomestic.relatedLaw}</th>
                    <th className="px-3 py-2">{dictionary.result.agency}</th>
                    <th className="px-3 py-2">{dictionary.result.content}</th>
                    <th className="px-3 py-2">{dictionary.exportDomestic.buyerDocuments}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {result.requirements.length ? result.requirements.map((requirement) => (
                    <tr key={`${requirement.type}-${requirement.name}-${requirement.relatedLaw}`}>
                      <td className="px-3 py-2 text-slate-700">{requirement.type}</td>
                      <td className="px-3 py-2 font-medium text-slate-900">{requirement.name}</td>
                      <td className="px-3 py-2 text-slate-700">{requirement.relatedLaw}</td>
                      <td className="px-3 py-2 text-slate-700">{requirement.agency}</td>
                      <td className="px-3 py-2 leading-6 text-slate-700">{requirement.procedureSummary}</td>
                      <td className="px-3 py-2 leading-6 text-slate-600">{requirement.buyerDocuments.join(", ")}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td className="px-3 py-2 text-slate-600" colSpan={6}>{dictionary.exportDomestic.noExportRequirementData}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="border-t border-slate-200">
            <div className="bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900">{dictionary.exportDomestic.exportControl}</div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead className="border-y border-slate-200 text-xs font-semibold text-slate-500">
                  <tr>
                    <th className="px-3 py-2">{dictionary.exportDomestic.category}</th>
                    <th className="px-3 py-2">{dictionary.exportDomestic.keyword}</th>
                    <th className="px-3 py-2">{dictionary.exportDomestic.condition}</th>
                    <th className="px-3 py-2">{dictionary.exportDomestic.selfClassification}</th>
                    <th className="px-3 py-2">{dictionary.exportDomestic.expertClassification}</th>
                    <th className="px-3 py-2">{dictionary.exportDomestic.license}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {result.exportControls.length ? result.exportControls.map((control) => (
                    <tr key={`${control.category}-${control.keyword}-${control.controlNumber ?? ""}`}>
                      <td className="px-3 py-2 text-slate-700">{control.category}</td>
                      <td className="px-3 py-2 font-medium text-slate-900">{control.keyword}</td>
                      <td className="px-3 py-2 leading-6 text-slate-700">{control.specCondition}</td>
                      <td className="px-3 py-2 text-slate-700">{control.selfClassificationNeeded ? dictionary.exportDomestic.reviewPossibility : "-"}</td>
                      <td className="px-3 py-2 text-slate-700">{control.expertClassificationNeeded ? dictionary.exportDomestic.reviewPossibility : "-"}</td>
                      <td className="px-3 py-2 text-slate-700">{control.licenseType ?? "-"}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td className="px-3 py-2 text-slate-600" colSpan={6}>{dictionary.exportDomestic.noExportControlData}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="border-t border-slate-200">
            <div className="bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900">{dictionary.exportDomestic.ftaCo}</div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-y border-slate-200 text-xs font-semibold text-slate-500">
                  <tr>
                    <th className="px-3 py-2">{dictionary.destination.agreementRate}</th>
                    <th className="px-3 py-2">{dictionary.exportDomestic.availablePossibility}</th>
                    <th className="px-3 py-2">{dictionary.exportDomestic.issueMethod}</th>
                    <th className="px-3 py-2">{dictionary.exportDomestic.originEvidence}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {result.ftaCoOptions.length ? result.ftaCoOptions.map((fta) => (
                    <tr key={`${fta.agreementName}-${fta.issueMethod}`}>
                      <td className="px-3 py-2 font-medium text-slate-900">{fta.agreementName}</td>
                      <td className="px-3 py-2 leading-6 text-slate-700">{fta.coIssuePossibility}</td>
                      <td className="px-3 py-2 text-slate-700">{fta.issueMethod}</td>
                      <td className="px-3 py-2 leading-6 text-slate-600">{fta.originEvidence.join(", ")}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td className="px-3 py-2 text-slate-600" colSpan={4}>{dictionary.exportDomestic.noFtaCoData}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <div className="border-t border-slate-200 bg-slate-50 px-3 py-3 text-xs leading-5 text-slate-600">
            {result.notices.map((notice) => <p key={notice}>{notice}</p>)}
          </div>
        </article>
      ))}
    </div>
  );
}

function AiClarificationPanel({
  analysis,
  basisDate,
  candidates,
  direction,
  destinationCountry,
  originCountry,
  productName
}: {
  analysis: ProductClarificationResult;
  basisDate: string;
  candidates: HsCandidateRecommendation[];
  direction: "import" | "export";
  destinationCountry: string;
  originCountry: string;
  productName: string;
}) {
  const presentation = productSearchPresentationState(candidates, analysis);
  const retryQuestions = presentation.questions.slice(0, 3);

  return (
    <section className={cn(
      "mt-5 overflow-hidden rounded-md border",
      presentation.tone === "warning" ? "border-amber-200 bg-amber-50" : "border-blue-200 bg-blue-50"
    )}>
      <div className={cn(
        "flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2",
        presentation.tone === "warning" ? "border-amber-200" : "border-blue-200"
      )}>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className={cn(
              "text-sm font-semibold",
              presentation.tone === "warning" ? "text-amber-950" : "text-blue-950"
            )}>{presentation.title}</h2>
            <Badge tone={presentation.tone}>{presentation.badge}</Badge>
          </div>
          <p className={cn(
            "mt-1 text-xs leading-5",
            presentation.tone === "warning" ? "text-amber-900" : "text-blue-900"
          )}>답변 후 재조회합니다.</p>
        </div>
        <Badge tone={analysis.confidence === "low" ? "warning" : "info"}>
          {analysis.confidence === "low" ? "검토 필요" : "검토"}
        </Badge>
      </div>
      <div className="grid gap-3 p-3">
        <div>
          <p className={cn(
            "mb-2 text-xs leading-5",
            presentation.tone === "warning" ? "text-amber-900" : "text-blue-900"
          )}>
            확인 가능한 보완사항만 입력하면 같은 품명으로 다시 조회합니다.
          </p>
          <ProductSupplementResearchForm
            basisDate={basisDate}
            destinationCountry={destinationCountry}
            direction={direction}
            originCountry={originCountry}
            productName={productName}
            questions={retryQuestions}
            tone={presentation.tone === "warning" ? "amber" : "blue"}
          />
        </div>
        {analysis.riskNotes.length ? (
          <details className="rounded-md border border-slate-200 bg-white">
            <summary className="cursor-pointer px-3 py-2 text-xs font-semibold text-slate-700">
              주의사항 보기
            </summary>
            <ul className="grid gap-1 border-t border-slate-200 p-3 text-xs leading-5 text-slate-600">
              {analysis.riskNotes.map((note) => <li key={note}>{note}</li>)}
            </ul>
          </details>
        ) : null}
      </div>
    </section>
  );
}

function ProductNoResultPanel({
  productName,
  clarification,
  basisDate,
  direction,
  destinationCountry,
  originCountry
}: {
  productName: string;
  clarification: ProductClarificationResult | null;
  basisDate: string;
  direction: "import" | "export";
  destinationCountry: string;
  originCountry: string;
}) {
  const questions = clarification?.missingQuestions.length
    ? clarification.missingQuestions
    : [
      "제품의 정확한 일반 품명과 상업명",
      "제품의 실제 용도와 최종 사용처",
      "완제품인지 부분품인지, 부분품이면 장착 대상 완제품",
      "주요 재질, 성분, 함량 또는 구성품",
      "작동 방식, 기능, 사양서 또는 카탈로그 URL",
      "제조사, 모델명, 제품 사진 또는 상세 설명"
    ];
  const suggestedCodes = clarification?.suggestedCandidateCodes.slice(0, 6) ?? [];
  const hasSuggestedCodes = suggestedCodes.length > 0;

  return (
    <section className="mt-4 overflow-hidden rounded-md border border-amber-200 bg-amber-50">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200 px-3 py-2">
        <div>
          <h2 className="text-sm font-semibold text-amber-950">
            {hasSuggestedCodes ? "HS 방향 확인 필요" : "HS CODE 특정 정보 부족"}
          </h2>
          <p className="mt-1 text-xs leading-5 text-amber-900">
            {clarification?.summary ?? "입력한 품명만으로는 표시 가능한 HS CODE를 만들기 어렵습니다. 제품코드, 약어, 짧은 품명은 실제 제품 정보 보완이 필요할 수 있습니다."}
          </p>
        </div>
        <HsCopySummaryButton texts={productNoResultCopySummaryTexts({ productName, clarification })} />
      </div>
      <div className="grid gap-3 p-3 lg:grid-cols-[1fr_0.85fr]">
        <div className="rounded-md border border-amber-100 bg-white p-3">
          <p className="text-xs font-semibold text-amber-900">보완 요청 항목</p>
          <ol className="mt-2 grid gap-2">
            {questions.slice(0, 8).map((question, index) => (
              <li className="text-sm leading-6 text-slate-700" key={question}>
                <span className="mr-2 font-mono text-xs font-semibold text-amber-700">{index + 1}</span>
                {question}
              </li>
            ))}
          </ol>
          <div className="mt-3">
            <ProductSupplementResearchForm
              basisDate={basisDate}
              destinationCountry={destinationCountry}
              direction={direction}
              originCountry={originCountry}
              productName={productName}
              questions={questions}
              tone="amber"
            />
          </div>
        </div>
        <div className="grid gap-3">
          {hasSuggestedCodes ? (
            <div className="rounded-md border border-amber-100 bg-white p-3">
              <p className="text-xs font-semibold text-amber-900">AI가 제시한 HS 방향</p>
              <div className="mt-2 grid gap-2">
                {suggestedCodes.map((code) => (
                  <Link
                    className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm hover:border-blue-200 hover:bg-blue-50"
                    data-navigation-progress="HS 조회"
                    href={hsLookupHref({
                      hskCode: code,
                      basisDate,
                      direction,
                      destinationCountry,
                      originCountry
                    })}
                    key={code}
                  >
                    <span className="font-mono font-semibold text-blue-700">{formatHsCode(code)}</span>
                    <span className="text-xs font-medium text-slate-500">조회</span>
                  </Link>
                ))}
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-600">
                위 코드는 신고 확정값이 아니라 조회를 이어가기 위한 HS 방향입니다. 상세 화면에서 하위 10자리와 수입요건을 다시 확인하세요.
              </p>
            </div>
          ) : null}
          <div className="rounded-md border border-amber-100 bg-white p-3 text-sm leading-6 text-slate-700">
            <p className="font-semibold text-slate-900">제품코드 또는 모델명 검색 시</p>
            <p className="mt-2">
              제조사명, 제품 URL, 카탈로그, 사진, 사양서 중 하나가 있으면 실제 제품군을 더 좁힐 수 있습니다.
            </p>
            <p className="mt-2">
              해외 HS CODE나 6자리 HS CODE를 알고 있다면 품명과 함께 입력하면 해당 코드가 강한 조회 단서로 사용됩니다.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function HsPrefixFolderNavigation({
  items,
  activeHs6,
  basisDate,
  direction,
  destinationCountry
}: {
  items: HsPrefixTreeItem[];
  activeHs6: string;
  basisDate: string;
  direction: "import" | "export";
  destinationCountry: string;
}) {
  if (!items.length) return null;

  return (
    <aside className="border-b border-slate-200 bg-white lg:border-b-0 lg:border-r">
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2">
        <span className="text-xs font-semibold text-slate-600">HS CODE 계층 탐색</span>
        <span className="text-[11px] font-medium text-slate-500">{items.length}개 HS4 그룹</span>
      </div>
      <div className="grid grid-cols-[144px_minmax(0,1fr)] border-b border-blue-800 bg-blue-700 text-sm font-semibold text-white">
        <div className="border-r border-blue-500 px-3 py-2 text-center">HSK</div>
        <div className="px-3 py-2 text-center">품명</div>
      </div>
      <div className="max-h-[560px] overflow-auto text-xs">
        {items.map((hs4Item) => {
          const hs4Href = hsLookupHref({
            hskCode: hs4Item.hs4,
            direction,
            destinationCountry,
            basisDate
          });

          return (
            <div className="border-b border-slate-100" key={hs4Item.hs4}>
              <Link className="flex items-start gap-2 bg-slate-50 px-3 py-2 font-semibold text-slate-900 hover:bg-blue-50" data-navigation-progress="상세조회" href={hs4Href}>
                <ChevronDown className="mt-0.5 size-3.5 shrink-0 text-slate-500" />
                <Folder className="mt-0.5 size-4 shrink-0 text-blue-700" />
                <span className="min-w-16 font-mono">{formatHsCode(hs4Item.hs4)}</span>
                <span className="min-w-0 flex-1 truncate">{hs4Item.label}</span>
                <span className="shrink-0 text-[11px] font-medium text-slate-500">{hs4Item.count}</span>
              </Link>
              <div>
                {hs4Item.hs6Items.map((hs6Item) => {
                  const isActive = hs6Item.hs6 === activeHs6;
                  const hs6Href = hsLookupHref({
                    hskCode: hs6Item.hs6,
                    direction,
                    destinationCountry,
                    basisDate
                  });

                  return (
                    <div key={hs6Item.hs6}>
                      <Link
                        className={`flex items-start gap-2 px-3 py-1.5 pl-8 font-medium hover:bg-blue-50 ${isActive ? "bg-red-50 text-red-600" : "text-slate-800"}`}
                        data-navigation-progress="상세조회"
                        href={hs6Href}
                      >
                        <ChevronDown className="mt-0.5 size-3.5 shrink-0 text-slate-400" />
                        <Folder className={`mt-0.5 size-4 shrink-0 ${isActive ? "text-red-500" : "text-blue-500"}`} />
                        <span className="min-w-16 font-mono">{formatHsCode(hs6Item.hs6)}</span>
                        <span className="min-w-0 flex-1 truncate">{hs6Item.label}</span>
                        <span className="shrink-0 text-[11px] text-slate-500">{hs6Item.count}</span>
                      </Link>
                      <div>
                        {hs6Item.children.map((child) => {
                          const normalized = normalizeHsInput(child.hskCode);
                          const isHs8Range = normalized.length === 8;

                          return (
                            <Link
                              className={cn(
                                "flex items-start gap-2 px-3 py-1.5 text-slate-700 hover:bg-blue-50",
                                normalized.length >= 10 ? "pl-20" : "pl-16",
                                isHs8Range && "font-semibold"
                              )}
                              data-navigation-progress="상세조회"
                              href={hsLookupHref({
                                hskCode: child.hskCode,
                                direction,
                                destinationCountry,
                                basisDate
                              })}
                              key={child.hskCode}
                            >
                              <FileText className={cn("mt-0.5 size-3.5 shrink-0 text-slate-400", isHs8Range && "text-slate-600")} />
                              <span className="min-w-24 rounded px-1 font-mono font-semibold text-slate-700">
                                {formatHsCode(child.hskCode)}
                              </span>
                              <span className="min-w-0 flex-1 truncate">{child.koreanName}</span>
                              {isHs8Range ? (
                                <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                                  8자리 범위
                                </span>
                              ) : null}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

export async function HsDirectLookupPanel({
  query,
  hskCode,
  basisDate,
  direction,
  destinationCountry,
  originCountry,
  destinationHsCode,
  favoriteStatus,
  source,
  sourceCandidateRank,
  sourceProductName,
  defaultDirection = "import",
  exportResultMode = "domestic",
  locale = defaultLocale,
  panelTitle,
  showDirectionSelect = true
}: {
  query?: string;
  hskCode?: string;
  basisDate?: string;
  direction?: string;
  destinationCountry?: string;
  originCountry?: string;
  destinationHsCode?: string;
  favoriteStatus?: string;
  source?: string;
  sourceCandidateRank?: string;
  sourceProductName?: string;
  defaultDirection?: "import" | "export";
  exportResultMode?: "domestic" | "destination";
  locale?: AppLocale;
  panelTitle?: string;
  showDirectionSelect?: boolean;
}) {
  const dictionary = getHsDirectDictionary(locale);
  const resolvedPanelTitle = panelTitle ?? dictionary.page.directTitle;
  const resolvedBasisDate = basisDate || getSeoulDateString();
  const lookupDirection = direction === "export" || (!direction && defaultDirection === "export") ? "export" : "import";
  const selectedDestinationCountry = destinationCountry || (exportResultMode === "destination" ? "CHN" : "ALL");
  const selectedOriginCountry = lookupDirection === "export" ? (originCountry || "KOR") : "ALL";
  const showDestinationExportResults = lookupDirection === "export" && exportResultMode === "destination";
  const showDomesticExportResults = lookupDirection === "export" && exportResultMode === "domestic";
  const searchQuery = (query ?? hskCode ?? "").trim();
  const productSupplementQuery = parseProductSupplementQuery(searchQuery);
  const displaySearchQuery = productSupplementQuery.baseProductName;
  const productSupplementEntries = productSupplementQuery.supplementEntries;
  const hasQuery = Boolean(searchQuery);
  const shouldShowDestinationMap = showDestinationExportResults && !hasQuery && !destinationHsCode;
  const shouldLookupHs = hasQuery && isHsCodeLike(searchQuery);
  const shouldLookupProduct = hasQuery && !shouldLookupHs;
  const productTimingStartedAt = process.hrtime.bigint();
  const logProductTiming = (step: string, extra: Record<string, unknown> = {}) => {
    if (!shouldLookupProduct) return;
    logLookupTelemetry("hs_direct_product_render_timing", {
      step,
      route: "hs_direct",
      status: "success",
      sourceMode: "server_render",
      elapsedMs: Number((process.hrtime.bigint() - productTimingStartedAt) / BigInt(1_000_000)),
      inputLength: searchQuery.length,
      direction: lookupDirection,
      destinationCountry: selectedDestinationCountry,
      ...extra
    });
  };
  const parsed = shouldLookupHs
    ? hsDirectLookupSchema.safeParse({
        hskCode: searchQuery,
        basisDate: resolvedBasisDate
      })
    : null;
  const [results, productCandidates] = await Promise.all([
    parsed?.success ? cachedHsDirectLookup(parsed.data.hskCode, parsed.data.basisDate) : Promise.resolve([]),
    shouldLookupProduct
      ? recommendHsCandidatesForProduct({
          productName: searchQuery,
          basisDate: resolvedBasisDate
        })
      : Promise.resolve([])
  ]);
  logProductTiming("candidates", {
    candidateCount: productCandidates.length,
    hsResultCount: results.length
  });
  const [productCandidateLookupResults, aiClarification, productCandidateFamilyLabels] = await Promise.all([
    shouldLookupProduct
      ? Promise.resolve([])
      : productCandidates.length
        ? Promise.all(productCandidates.map((candidate) => cachedHsDirectLookup(candidate.hskCode, resolvedBasisDate).catch(() => []))).then((rows) => rows.flat())
        : Promise.resolve([]),
    shouldLookupProduct
      ? analyzeProductClarification({
          productName: searchQuery,
          basisDate: resolvedBasisDate,
          officialCandidates: productCandidates
        }).catch(() => null)
      : Promise.resolve(null),
    shouldLookupProduct && productCandidates.length
      ? cachedHsFamilyLabels(productCandidates.map((candidate) => candidate.hskCode), resolvedBasisDate).catch(() => ({}))
      : Promise.resolve({})
  ]);
  logProductTiming("clarification", {
    candidateLookupCount: productCandidateLookupResults.length,
    hasClarification: Boolean(aiClarification)
  });
  const productCandidateLookupByHsk = new Map(productCandidateLookupResults.map((result) => [result.hskCode, result]));
  const productCandidateInternalTaxByHskPromise = lookupDirection === "import" && productCandidateLookupResults.length ? internalTaxCodesForResults({
    results: productCandidateLookupResults,
    basisDate: resolvedBasisDate
  }) : Promise.resolve(new Map<string, InternalTaxCodeMatch[]>());
  const exportLookupSources: ExportLookupSource[] = shouldLookupProduct && productCandidates.length
    ? []
    : results.map((result) => ({
      hskCode: result.hskCode,
      hs6: result.hs6
    }));
  const normalizedQuery = normalizeHsInput(parsed?.success ? parsed.data.hskCode : searchQuery);
  const hsLookupMode = hsLookupModeForCode(normalizedQuery);
  const isHsPrefixExplorer = hsLookupMode === "hs4_explorer" || hsLookupMode === "hs6_explorer";
  const shouldLoadImportDetailData = lookupDirection === "import" && hsLookupMode === "hsk_detail" && results.length > 0;
  const [
    productCandidateInternalTaxByHsk,
    exportDomesticResults,
    destinationTariffsByHsk,
    internalTaxCodesByHsk,
    directDestinationTariffs,
    favoriteCodes
  ] = await Promise.all([
    productCandidateInternalTaxByHskPromise,
    showDomesticExportResults && hasQuery
      ? Promise.all(
          exportLookupSources
            .filter((source) => normalizeHsInput(source.hskCode).length === 10)
            .slice(0, 12)
            .map((source) => getExportDiagnosis({
              hskCode: source.hskCode,
              basisDate: resolvedBasisDate,
              destinationCountry: selectedDestinationCountry
            }).catch(() => null))
        ).then((rows) => rows.filter((result): result is ExportDiagnosisResult => Boolean(result)))
      : Promise.resolve([]),
    showDestinationExportResults && exportLookupSources.length
      ? destinationTariffsForResults({
          results: exportLookupSources,
          direction: "export",
          destinationCountry: selectedDestinationCountry,
          basisDate: resolvedBasisDate
        })
      : Promise.resolve(new Map<string, ExportDestinationTariffItem[]>()),
    shouldLoadImportDetailData ? internalTaxCodesForResults({
      results,
      basisDate: resolvedBasisDate
    }) : Promise.resolve(new Map<string, InternalTaxCodeMatch[]>()),
    showDestinationExportResults ? destinationTariffsForDestinationCode({
      queryCode: normalizedQuery,
      direction: showDestinationExportResults ? "export" : "import",
      destinationCountry: selectedDestinationCountry,
      basisDate: resolvedBasisDate
    }) : Promise.resolve([]),
    shouldLoadImportDetailData && hasSupabaseEnv()
      ? createSupabaseServerClient()
        .then((client) => favoriteCodeSet(client, results.map((result) => result.hskCode)))
        .catch(() => new Set<string>())
      : Promise.resolve(new Set<string>())
  ]);
  logProductTiming("detail-data", {
    destinationTariffGroups: destinationTariffsByHsk.size,
    productInternalTaxGroups: productCandidateInternalTaxByHsk.size
  });
  const hs6DestinationTariffs = Array.from(
    new Map(
      exportLookupSources.flatMap((source) =>
        (destinationTariffsByHsk.get(source.hskCode) ?? []).map((tariff) => [
          `${source.hskCode}-${tariff.countryCode}-${tariff.destinationHsCode}-${tariff.sourceVersion}`,
          { ...tariff, hskCode: source.hskCode }
        ])
      )
    ).values()
  );
  const exportDestinationRows = Array.from(
    new Map(
      [...hs6DestinationTariffs, ...directDestinationTariffs].map((tariff) => [
        `${tariff.countryCode}-${tariff.destinationHsCode}-${tariff.sourceVersion}`,
        tariff
      ])
    ).values()
  );
  const shouldLoadDestinationImportData = showDestinationExportResults && exportDestinationRows.length > 0;
  const emptyDestinationImportData = {
    requirementsByKey: new Map<string, ExportDestinationImportRequirementItem[]>(),
    internalTaxesByKey: new Map<string, ExportDestinationInternalTaxItem[]>(),
    additionalTariffsByKey: new Map<string, ExportDestinationAdditionalTariffItem[]>(),
    tradeRemedyCasesByKey: new Map<string, ExportDestinationTradeRemedyCaseItem[]>()
  };
  const [destinationImportData, destinationCustomsCodesByTariffKey] = await Promise.all([
    shouldLoadDestinationImportData ? destinationImportDataForTariffs({
      tariffs: exportDestinationRows,
      basisDate: resolvedBasisDate,
      originCountryCode: selectedOriginCountry,
      selectedDestinationCountry
    }) : Promise.resolve(emptyDestinationImportData),
    shouldLoadDestinationImportData ? destinationCustomsCodesForTariffs({
      tariffs: exportDestinationRows,
      basisDate: resolvedBasisDate
    }) : Promise.resolve(new Map<string, ExportDestinationCustomsCodeItem[]>())
  ]);
  logProductTiming("destination-import-data", {
    destinationRowCount: exportDestinationRows.length,
    destinationCustomsCodeGroups: destinationCustomsCodesByTariffKey.size
  });
  const selectedDestinationHsCode = normalizeHsInput(destinationHsCode);
  const selectedDestinationRowByParam = selectedDestinationHsCode
    ? exportDestinationRows.find((row) => normalizeHsInput(row.destinationHsCode) === selectedDestinationHsCode)
    : undefined;
  const sameDestinationRow = !selectedDestinationRowByParam && selectedDestinationCountry !== "ALL"
    ? exportDestinationRows.find((row) => hasSameDestinationCode(row, normalizedQuery))
    : undefined;
  const selectedDestinationRow = selectedDestinationRowByParam ?? sameDestinationRow;
  const shouldShowHs6DestinationSelectionNotice = showDestinationExportResults
    && selectedDestinationCountry !== "ALL"
    && normalizedQuery.length >= 10
    && !destinationHsCode
    && !sameDestinationRow;
  const hs6Groups = results.reduce((groups, result) => {
    const group = groups.get(result.hs6) ?? [];

    group.push(result);
    groups.set(result.hs6, group);

    return groups;
  }, new Map<string, typeof results>());
  const hs6NavigationItems = Array.from(hs6Groups.entries())
    .map(([hs6, group]) => ({
      hs6,
      label: hs6NavigationLabel(group),
      count: group.length
    }))
    .sort((a, b) => a.hs6.localeCompare(b.hs6));
  const hsPrefixTreeItems = buildHsPrefixTreeItems(results);
  const hs6NavigationLabelByCode = new Map(hs6NavigationItems.map((item) => [item.hs6, item.label]));
  const hs6NavigationCountByCode = new Map(hs6NavigationItems.map((item) => [item.hs6, item.count]));
  const activeHs6 = normalizedQuery.length === 6 ? normalizedQuery : hs6NavigationItems[0]?.hs6 ?? "";
  const lookupHierarchyPath = results[0]?.hierarchyPath.filter((node) => normalizeHsInput(node.code).length <= normalizedQuery.length) ?? [];
  const supplementGuidance = shouldLookupHs && normalizedQuery.length >= 4 && normalizedQuery.length < 10
    ? buildHsSupplementGuidance(normalizedQuery)
    : null;
  const favoriteReturnTo = currentHsDirectReturnTo({
    query: searchQuery,
    direction: lookupDirection,
    destinationCountry: selectedDestinationCountry,
    originCountry: selectedOriginCountry,
    basisDate: resolvedBasisDate,
    destinationHsCode
  });
  const productCandidateGroups = Array.from(productCandidates.reduce((groups, candidate) => {
    const groupKey = candidate.hs6 || normalizeHsInput(candidate.hskCode).slice(0, 6) || candidate.hskCode;
    const group = groups.get(groupKey) ?? [];

    group.push(candidate);
    groups.set(groupKey, group);
    return groups;
  }, new Map<string, HsCandidateRecommendation[]>()).values()).map((group) => ({
    representative: group[0],
    related: group.slice(1)
  }));
  const primaryProductCandidateGroup = productCandidateGroups[0];
  const initiallyVisibleProductCandidateGroups = productCandidateGroups.slice(1, 3);
  const additionalProductCandidateGroups = productCandidateGroups.slice(3);
  const additionalProductCandidateCount = additionalProductCandidateGroups.reduce((count, group) => count + 1 + group.related.length, 0);

  return (
    <Card>
      <CardHeader title={resolvedPanelTitle} />
      <CardBody>
        <FavoriteStatusMessage status={favoriteStatus} />
        <form className={`grid gap-4 ${showDirectionSelect ? "lg:grid-cols-[minmax(240px,1fr)_130px_minmax(220px,260px)_minmax(180px,230px)_auto]" : "lg:grid-cols-[minmax(260px,1fr)_minmax(240px,300px)_minmax(180px,230px)_auto]"}`} method="get">
          <QueryField defaultValue={shouldLookupProduct ? displaySearchQuery : searchQuery} label={dictionary.form.query} name="query" placeholder={dictionary.form.queryPlaceholder} />
          {showDirectionSelect ? <DirectionSelect defaultValue={lookupDirection} dictionary={dictionary} /> : <DirectionHiddenField value={lookupDirection} />}
          {showDestinationExportResults ? (
            <DestinationCountryPicker defaultValue={selectedDestinationCountry} direction={lookupDirection} showMap={shouldShowDestinationMap} />
          ) : (
            <DestinationCountrySelect defaultValue={selectedDestinationCountry} direction={lookupDirection} />
          )}
          <OriginCountrySelect defaultValue={selectedOriginCountry} dictionary={dictionary} direction={lookupDirection} />
          <HsDirectSubmitStatus submitLabel={dictionary.form.submit} />
          <BasisDateOptions defaultValue={resolvedBasisDate} dictionary={dictionary} />
        </form>

        {parsed && !parsed.success ? (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {parsed.error.issues[0]?.message ?? dictionary.empty.invalidInput}
          </div>
        ) : null}

        {shouldLookupProduct ? <ProductSupplementSummaryPanel entries={productSupplementEntries} /> : null}

        {shouldLookupHs && source === "product_search" ? (
          <ProductSearchSourceBanner candidateRank={sourceCandidateRank} productName={sourceProductName} />
        ) : null}

        {parsed?.success && results.length === 0 && !(lookupDirection === "export" && exportDestinationRows.length) ? (
          <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            {dictionary.empty.noHsData}
          </div>
        ) : null}

        {productCandidates.length ? (
          <div className="mt-5 overflow-hidden rounded-md border border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-2 bg-blue-700 px-3 py-2 text-sm font-semibold text-white">
              <span>{dictionary.product.productResult}</span>
              {lookupDirection === "import" ? (
                <HsCopySummaryButton
                  texts={productCandidateCopySummaryTexts({
                    productName: displaySearchQuery,
                    candidates: productCandidates,
                    lookupByHsk: productCandidateLookupByHsk,
                    internalTaxByHsk: productCandidateInternalTaxByHsk,
                    countryCode: selectedDestinationCountry,
                    clarification: aiClarification
                  })}
                />
              ) : null}
            </div>
            <div className="grid gap-3 bg-slate-50 p-3">
              {primaryProductCandidateGroup ? (
                <ProductCandidateCard
                  candidateGroup={primaryProductCandidateGroup}
                  destinationCountry={selectedDestinationCountry}
                  direction={lookupDirection}
                  displaySearchQuery={displaySearchQuery}
                  hs6Label={dictionary.product.hs6}
                  isPrimary
                  key={primaryProductCandidateGroup.representative.hskCode}
                  lookup={productCandidateLookupByHsk.get(primaryProductCandidateGroup.representative.hskCode)}
                  familyLabels={productCandidateFamilyLabels}
                  originCountry={selectedOriginCountry}
                  showSingleScore={productCandidates.length === 1}
                />
              ) : null}
              {initiallyVisibleProductCandidateGroups.length ? (
                <section className="rounded-md border border-slate-200 bg-white">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
                    <div>
                      <h2 className="text-sm font-semibold text-slate-950">비교 후보</h2>
                      <p className="mt-1 text-xs text-slate-500">GPT 점수순으로 함께 확인할 코드를 표시합니다.</p>
                    </div>
                    <Badge tone="info">{initiallyVisibleProductCandidateGroups.length}개 표시</Badge>
                  </div>
                  <div className="grid gap-3 bg-slate-50 p-3 lg:grid-cols-2">
                    {initiallyVisibleProductCandidateGroups.map((candidateGroup) => (
                      <ProductCandidateCard
                        candidateGroup={candidateGroup}
                        destinationCountry={selectedDestinationCountry}
                        direction={lookupDirection}
                        displaySearchQuery={displaySearchQuery}
                        hs6Label={dictionary.product.hs6}
                        key={candidateGroup.representative.hskCode}
                        lookup={productCandidateLookupByHsk.get(candidateGroup.representative.hskCode)}
                        familyLabels={productCandidateFamilyLabels}
                        originCountry={selectedOriginCountry}
                      />
                    ))}
                  </div>
                </section>
              ) : null}
              {additionalProductCandidateGroups.length ? (
                <details className="rounded-md border border-slate-200 bg-white">
                  <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-slate-700">
                    함께 볼 수 있는 코드 {additionalProductCandidateCount}개 더 보기
                  </summary>
                  <div className="grid gap-3 border-t border-slate-200 bg-slate-50 p-3 lg:grid-cols-2">
                    {additionalProductCandidateGroups.map((candidateGroup) => (
                      <ProductCandidateCard
                        candidateGroup={candidateGroup}
                        destinationCountry={selectedDestinationCountry}
                        direction={lookupDirection}
                        displaySearchQuery={displaySearchQuery}
                        hs6Label={dictionary.product.hs6}
                        key={candidateGroup.representative.hskCode}
                        lookup={productCandidateLookupByHsk.get(candidateGroup.representative.hskCode)}
                        familyLabels={productCandidateFamilyLabels}
                        originCountry={selectedOriginCountry}
                      />
                    ))}
                  </div>
                </details>
              ) : null}
            </div>
          </div>
        ) : null}

        {shouldLookupProduct ? (
          <ProductClassificationFlowPanel
            candidates={productCandidates}
            productName={displaySearchQuery}
          />
        ) : null}

        {shouldLookupProduct && productCandidates.length === 0 ? (
          <ProductNoResultPanel
            basisDate={resolvedBasisDate}
            clarification={aiClarification}
            destinationCountry={selectedDestinationCountry}
            direction={lookupDirection}
            originCountry={selectedOriginCountry}
            productName={displaySearchQuery}
          />
        ) : null}

        {supplementGuidance ? (
          <HsSupplementGuidancePanel
            basisDate={resolvedBasisDate}
            destinationCountry={selectedDestinationCountry}
            direction={lookupDirection}
            guidance={supplementGuidance}
            originCountry={selectedOriginCountry}
          />
        ) : null}

        {aiClarification && productCandidates.length ? (
          <AiClarificationPanel
            analysis={aiClarification}
            basisDate={resolvedBasisDate}
            candidates={productCandidates}
            destinationCountry={selectedDestinationCountry}
            direction={lookupDirection}
            originCountry={selectedOriginCountry}
            productName={displaySearchQuery}
          />
        ) : null}

        {showDomesticExportResults && hasQuery ? (
          <ExportDomesticDiagnosisSection
            destinationCountry={selectedDestinationCountry}
            dictionary={dictionary}
            originCountry={selectedOriginCountry}
            results={exportDomesticResults}
          />
        ) : null}

        {showDestinationExportResults && hasQuery ? (
          <div className="mt-5 overflow-hidden rounded-md border border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-2 bg-blue-700 px-3 py-2 text-sm font-semibold text-white">
              <span>{destinationCountrySubjectLabel(selectedDestinationCountry)} 수입 기준 조회 결과</span>
              <span className="text-xs font-medium text-blue-100">
                {exportDestinationRows.length ? `${exportDestinationRows.length}개 상대국 HS` : "상대국 HS 데이터 없음"}
              </span>
            </div>
            <div className="grid gap-4 border-b border-slate-200 bg-slate-50 px-3 py-3 text-sm lg:grid-cols-[1fr_1fr_1fr_1.5fr]">
              <div>
                <div className="text-xs font-semibold text-slate-500">입력값</div>
                <div className="mt-1 font-mono font-semibold text-slate-900">{searchQuery}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500">수입국</div>
                <div className="mt-1 font-semibold text-slate-900">{exportCountryLabel(selectedDestinationCountry)}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500">원산지</div>
                <div className="mt-1 font-semibold text-slate-900">{selectedOriginCountry === "ALL" ? "모든 원산지" : exportCountryLabel(selectedOriginCountry)}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500">기준</div>
                <div className="mt-1 text-slate-700">수입국 HS CODE, 수입국 품명, 수입국 세율 기준</div>
              </div>
            </div>

            {results.length ? (
              <div className="border-b border-slate-200 px-3 py-3">
                <div className="mb-2 text-xs font-semibold text-slate-500">한국 HS 연결 기준</div>
                <div className="flex flex-wrap gap-2">
                  {Array.from(new Map(results.map((result) => [result.hs6, result])).values()).map((result) => (
                    <Link
                      className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-blue-50"
                      href={hsLookupHref({
                        hskCode: result.hs6,
                        direction: lookupDirection,
                        destinationCountry: selectedDestinationCountry,
                        originCountry: selectedOriginCountry,
                        basisDate: result.basisDate
                      })}
                      key={result.hs6}
                    >
                      <span className="font-mono font-semibold text-blue-700">{formatHsCode(result.hs6)}</span>
                      <span className="ml-2 text-slate-700">{hs6NavigationLabelByCode.get(result.hs6) ?? result.koreanName}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}

            {selectedDestinationRow ? (
              <DestinationCountryDetailPage
                additionalTariffs={destinationImportData.additionalTariffsByKey.get(destinationImportDataKey(selectedDestinationRow.countryCode, selectedDestinationRow.destinationHsCode)) ?? []}
                customsCodes={destinationCustomsCodesByTariffKey.get(destinationTariffKey(selectedDestinationRow)) ?? []}
                destinationCountry={selectedDestinationCountry}
                dictionary={dictionary}
                internalTaxes={destinationImportData.internalTaxesByKey.get(destinationImportDataKey(selectedDestinationRow.countryCode, selectedDestinationRow.destinationHsCode)) ?? []}
                originCountry={selectedOriginCountry}
                requirements={destinationImportData.requirementsByKey.get(destinationImportDataKey(selectedDestinationRow.countryCode, selectedDestinationRow.destinationHsCode)) ?? []}
                row={selectedDestinationRow}
                sourceHs6={(selectedDestinationRow as { hskCode?: string }).hskCode ? normalizeHsInput((selectedDestinationRow as { hskCode?: string }).hskCode).slice(0, 6) : undefined}
                tradeRemedyCases={destinationImportData.tradeRemedyCasesByKey.get(destinationImportDataKey(selectedDestinationRow.countryCode, selectedDestinationRow.destinationHsCode)) ?? []}
              />
            ) : null}

            {shouldShowHs6DestinationSelectionNotice ? (
              <div className="border-b border-slate-200 bg-amber-50 px-3 py-3 text-sm leading-6 text-amber-900">
                <div className="font-semibold">동일한 10자리 수입국 HS CODE가 확인되지 않았습니다.</div>
                <p className="mt-1">
                  HS 6자리는 국제 공통 기준이므로 {formatHsCode(normalizedQuery.slice(0, 6))} 기준의 수입국 후보를 표시합니다.
                  수입국 HS CODE 또는 10자리 후보를 선택하면 해당 수입국 기준 상세 화면으로 이동합니다.
                </p>
              </div>
            ) : null}

            <DestinationCountryResultTable
              basisDate={resolvedBasisDate}
              additionalTariffsByKey={destinationImportData.additionalTariffsByKey}
              customsCodesByTariffKey={destinationCustomsCodesByTariffKey}
              destinationCountry={selectedDestinationCountry}
              dictionary={dictionary}
              internalTaxesByKey={destinationImportData.internalTaxesByKey}
              originCountry={selectedOriginCountry}
              requirementsByKey={destinationImportData.requirementsByKey}
              rows={exportDestinationRows}
              sourceHs6={normalizedQuery.slice(0, 6)}
              sourceQuery={searchQuery}
              tradeRemedyCasesByKey={destinationImportData.tradeRemedyCasesByKey}
            />
          </div>
        ) : null}

        {lookupDirection === "import" && isHsPrefixExplorer && results.length ? (
          <div className="mt-5 overflow-hidden rounded-md border border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
              <span>{formatHsCode(normalizedQuery)} 하위 HSK 탐색 결과</span>
              <span className="text-xs font-medium text-slate-200">
                {hsLookupMode === "hs4_explorer" ? `HS6 ${hs6NavigationItems.length}개 / ` : ""}HSK {results.length}개
              </span>
            </div>
            <HsPrefixExplorerSummary
              activeHs6={activeHs6}
              hs6Count={hs6NavigationItems.length}
              mode={hsLookupMode}
              normalizedQuery={normalizedQuery}
              resultCount={results.length}
            />
            {lookupHierarchyPath.length ? (
              <div className="grid gap-1 border-b border-slate-200 bg-white px-3 py-2">
                <div className="text-xs font-semibold text-slate-500">상위 HS CODE</div>
                <HsHierarchyTrail
                  basisDate={resolvedBasisDate}
                  currentCode={normalizedQuery}
                  destinationCountry={selectedDestinationCountry}
                  direction={lookupDirection}
                  nodes={lookupHierarchyPath}
                />
              </div>
            ) : null}
            <div className="grid lg:grid-cols-[360px_minmax(0,1fr)]">
              <HsPrefixFolderNavigation
                activeHs6={activeHs6}
                basisDate={resolvedBasisDate}
                destinationCountry={selectedDestinationCountry}
                direction={lookupDirection}
                items={hsPrefixTreeItems}
              />
              <div className="overflow-x-auto">
                <table className="w-full min-w-[940px] text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500">
                    <tr>
                      <th className="px-3 py-2">HSK</th>
                      <th className="px-3 py-2">품명</th>
                      <th className="px-3 py-2">기본</th>
                      <th className="px-3 py-2">탄력·양허</th>
                      <th className="px-3 py-2">요건</th>
                      <th className="px-3 py-2">Description</th>
                      <th className="px-3 py-2">조회</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {results.map((result, index) => {
                      const importTariffs = filterImportTariffsForCountry(result.tariffPreviews, selectedDestinationCountry);
                      const basicRate = importTariffs.find((tariff) => isBasicTariffLabel(displayImportTariffLabel(tariff, selectedDestinationCountry)))?.rateText ?? "-";
                      const preferentialSummary = preferentialTariffSummary(importTariffs, selectedDestinationCountry);
                      const startsHs6Group = hsLookupMode === "hs4_explorer" && result.hs6 !== results[index - 1]?.hs6;
                      const hs6Count = startsHs6Group ? hs6NavigationCountByCode.get(result.hs6) ?? 0 : 0;
                      const hs6Label = hs6NavigationLabelByCode.get(result.hs6) ?? result.koreanName;

                      return (
                        <Fragment key={result.hskCode}>
                          {startsHs6Group ? (
                            <tr className="bg-slate-100">
                              <td className="px-3 py-2 font-mono text-xs font-semibold text-slate-700" colSpan={7}>
                                <Link className="text-blue-700 underline-offset-2 hover:underline" data-navigation-progress="상세조회" href={hsLookupHref({
                                  hskCode: result.hs6,
                                  direction: lookupDirection,
                                  destinationCountry: selectedDestinationCountry,
                                  basisDate: result.basisDate
                                })}>
                                  {formatHsCode(result.hs6)}
                                </Link>
                                <span className="ml-2 font-sans text-slate-700">{hs6Label}</span>
                                <span className="ml-2 text-slate-500">{hs6Count}개 하위 HSK</span>
                              </td>
                            </tr>
                          ) : null}
                          <tr className={result.hs6 === activeHs6 ? "bg-blue-50/50" : undefined}>
                            <td className="whitespace-nowrap px-3 py-2 font-mono font-semibold">
                              <Link className="text-blue-700 underline-offset-2 hover:underline" data-navigation-progress="상세조회" href={hsLookupHref({
                                hskCode: result.hskCode,
                                direction: lookupDirection,
                                destinationCountry: selectedDestinationCountry,
                                basisDate: result.basisDate
                              })}>
                                {formatHsCode(result.hskCode)}
                              </Link>
                            </td>
                            <td className="px-3 py-2 font-medium text-slate-900">{result.koreanName}</td>
                            <td className="px-3 py-2 font-semibold text-orange-600">{basicRate}</td>
                            <td className="px-3 py-2 text-slate-700">{preferentialSummary}</td>
                            <td className="px-3 py-2 text-slate-700">
                              <RequirementSummary requirements={result.importRequirements} />
                            </td>
                            <td className="px-3 py-2 text-slate-700">{result.englishName ?? "-"}</td>
                            <td className="whitespace-nowrap px-3 py-2">
                              <Link className="font-semibold text-blue-700 underline-offset-2 hover:underline" data-navigation-progress="상세조회" href={hsLookupHref({
                                hskCode: result.hskCode,
                                direction: lookupDirection,
                                destinationCountry: selectedDestinationCountry,
                                basisDate: result.basisDate
                              })}>
                                상세
                              </Link>
                            </td>
                          </tr>
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-3 pb-3">
              <SourceFooter basisDate={results[0].basisDate} showVersion={false} sourceName={results[0].sourceName} sourceVersion={results[0].sourceVersion} />
            </div>
          </div>
        ) : null}

        {lookupDirection === "import" && !isHsPrefixExplorer && results.length ? (
          <div className="mt-5 grid gap-4">
            {results.map((result) => {
              const countryFilteredTariffs = filterImportTariffsForCountry(result.tariffPreviews, selectedDestinationCountry);
              const estimatorDutyTariff = baselineCopyTariff(countryFilteredTariffs, selectedDestinationCountry);
              const estimatorPreferentialTariff = selectedDestinationCountry === "ALL"
                ? undefined
                : lowestTariff(countryFilteredTariffs.filter((tariff) => isFtaTariffRate(tariff.rateType)));
              const groupedRequirements = groupedImportRequirements(result.importRequirements);
              const dutySummary = estimatorDutyTariff
                ? tariffSummaryText(estimatorDutyTariff, selectedDestinationCountry)
                : "표시할 관세율 데이터 없음";
              const preferentialDutySummary = preferentialDutySummaryText({
                countryCode: selectedDestinationCountry,
                preferentialTariffText: estimatorPreferentialTariff
                  ? tariffSummaryText(estimatorPreferentialTariff, selectedDestinationCountry)
                  : undefined
              });
              const requirementSummary = importRequirementSummaryText(groupedRequirements.length);

              return (
              <article className="overflow-hidden rounded-md border border-slate-200" key={result.hskCode}>
                <div className="grid lg:grid-cols-[430px_minmax(0,1fr)]">
                  <HsCodeSideNavigator
                    destinationCountry={selectedDestinationCountry}
                    direction={lookupDirection}
                    result={result}
                  />

                  <div className="min-w-0">
                  <section className="overflow-hidden border-b border-slate-200">
                    <div className="flex min-h-10 flex-col items-stretch gap-2 bg-blue-700 px-3 py-2 text-sm font-semibold text-white lg:flex-row lg:items-center lg:justify-between lg:py-0">
                      <span className="shrink-0">{dictionary.result.itemDetail}</span>
                      <div className="flex flex-wrap gap-2 lg:shrink-0 lg:justify-end">
                        <HsFavoriteToggleButton
                          basisDate={result.basisDate}
                          displayName={result.koreanName}
                          hskCode={result.hskCode}
                          isFavorite={favoriteCodes.has(result.hskCode)}
                          returnTo={favoriteReturnTo}
                        />
                        <Link
                          className="focus-ring inline-flex items-center justify-center rounded-md bg-white/15 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/25"
                          data-navigation-progress="예상 납세액 계산"
                          href={buildDutyEstimatorHref({
                            hskCode: result.hskCode,
                            basisDate: result.basisDate,
                            dutyRate: estimatorDutyTariff?.rateText,
                            preferentialRate: estimatorPreferentialTariff?.rateText,
                            preferentialRateLabel: estimatorPreferentialTariff
                              ? displayImportTariffLabel(estimatorPreferentialTariff, selectedDestinationCountry)
                              : undefined,
                            countryCode: selectedDestinationCountry,
                            internalTaxRows: (internalTaxCodesByHsk.get(result.hskCode) ?? []).map((row) => ({
                              name: row.name,
                              lawName: row.lawName,
                              rateText: row.rateText,
                              baseType: row.taxBaseType
                            }))
                          })}
                        >
                          {dictionary.result.dutyEstimate}
                        </Link>
                        <Link
                          className="focus-ring inline-flex items-center justify-center gap-1 rounded-md bg-white/15 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/25"
                          data-navigation-progress="운송 견적 요청"
                          href={buildMarketplaceRequestHref("freight", {
                            basisDate: result.basisDate,
                            destinationCountry: selectedDestinationCountry,
                            direction: lookupDirection,
                            hskCode: result.hskCode,
                            hs6: result.hs6,
                            originCountry: selectedOriginCountry,
                            productName: sourceProductName ?? result.koreanName
                          })}
                        >
                          <PackagePlus aria-hidden="true" size={14} />
                          운송 초안
                        </Link>
                        <Link
                          className="focus-ring inline-flex items-center justify-center gap-1 rounded-md bg-white/15 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/25"
                          data-navigation-progress="통관 의뢰 요청"
                          href={buildMarketplaceRequestHref("clearance", {
                            basisDate: result.basisDate,
                            destinationCountry: selectedDestinationCountry,
                            direction: lookupDirection,
                            hskCode: result.hskCode,
                            hs6: result.hs6,
                            originCountry: selectedOriginCountry,
                            productName: sourceProductName ?? result.koreanName
                          })}
                        >
                          <FileText aria-hidden="true" size={14} />
                          통관 초안
                        </Link>
                        <HsCopySummaryButton
                          texts={hsCopySummaryTexts({
                            result,
                            displayTariffs: filterImportTariffsForCountry(result.tariffPreviews, selectedDestinationCountry),
                            internalTaxRows: internalTaxCodesByHsk.get(result.hskCode) ?? [],
                            importRequirements: result.importRequirements,
                            countryCode: selectedDestinationCountry
                          })}
                        />
                      </div>
                    </div>
                    <div className="border-b border-slate-200 bg-blue-50 px-3 py-3">
                      <p className="text-xs font-semibold text-blue-800">10자리 요약</p>
                      <p className="mt-1 text-base font-semibold leading-6 text-slate-950">
                        {formatHsCode(result.hskCode)} {result.briefDescription}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-blue-900">
                        아래 세율, 내국세, 수입요건은 이 10자리 HSK 기준으로 조회한 예비 정보입니다.
                      </p>
                      <div className="mt-3 grid gap-2 md:grid-cols-3">
                        <div className="rounded-md border border-blue-100 bg-white px-3 py-2">
                          <p className="text-xs font-semibold text-slate-500">기준 세율</p>
                          <p className="mt-1 text-sm font-semibold text-slate-950">{dutySummary}</p>
                        </div>
                        <div className="rounded-md border border-blue-100 bg-white px-3 py-2">
                          <p className="text-xs font-semibold text-slate-500">FTA/특혜 세율</p>
                          <p className="mt-1 text-sm font-semibold text-slate-950">{preferentialDutySummary.summary}</p>
                          <p className="mt-1 text-xs leading-5 text-slate-500">{preferentialDutySummary.note}</p>
                        </div>
                        <div className="rounded-md border border-blue-100 bg-white px-3 py-2">
                          <p className="text-xs font-semibold text-slate-500">수입요건</p>
                          <p className="mt-1 text-sm font-semibold text-slate-950">{requirementSummary.summary}</p>
                          <p className="mt-1 text-xs leading-5 text-slate-500">{requirementSummary.note}</p>
                        </div>
                      </div>
                    </div>
                    <dl className="grid text-sm sm:grid-cols-[140px_1fr]">
                      <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">{dictionary.result.hsk}</dt>
                      <dd
                        className="select-all border-b border-slate-200 px-3 py-2 font-mono font-semibold text-slate-950"
                        title={dictionary.result.favoriteTitle}
                      >
                          {formatHsCode(result.hskCode)}
                      </dd>
                      <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">{dictionary.result.koreanName}</dt>
                      <dd className="border-b border-slate-200 px-3 py-2">{result.koreanName}</dd>
                      <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">{dictionary.result.englishName}</dt>
                      <dd className="border-b border-slate-200 px-3 py-2">{displayValue(result.englishName)}</dd>
                      <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">{dictionary.result.unit}</dt>
                      <dd className="border-b border-slate-200 px-3 py-2">
                        {dictionary.result.quantityUnit} {displayValue(result.quantityUnit)} / {dictionary.result.weightUnit} {displayValue(result.weightUnit)}
                      </dd>
                      <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">{dictionary.result.originMarking}</dt>
                      <dd className="border-b border-slate-200 px-3 py-2">
                        <OriginMarkingLinks hskCode={result.hskCode} itemName={result.koreanName} originMarking={result.originMarking} />
                      </dd>
                      <dt className="bg-slate-50 px-3 py-2 font-semibold text-slate-600">{dictionary.result.basisDate}</dt>
                      <dd className="px-3 py-2">{dictionary.result.basisDatePrefix} {result.basisDate}</dd>
                    </dl>

                    <ImportTariffCountryFilter
                      initialCountryCode={selectedDestinationCountry}
                      tariffs={result.tariffPreviews}
                    />
                  </section>

                <InternalTaxSection dictionary={dictionary} rows={internalTaxCodesByHsk.get(result.hskCode) ?? []} />

                <details className="border-t border-slate-200">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-2 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900">
                    <span>{dictionary.result.standardProduct}</span>
                    <span className="text-xs font-medium text-slate-500">{result.standardProductNames.length}건</span>
                  </summary>
                  {result.standardProductNames.length ? (
                    <div className="overflow-x-auto border-t border-slate-200">
                      <table className="w-full min-w-[720px] text-left text-sm">
                        <thead className="border-b border-slate-200 text-xs font-semibold text-slate-500">
                          <tr>
                            <th className="px-3 py-2">{dictionary.result.standardProductName}</th>
                            <th className="px-3 py-2">{dictionary.result.requiredSpec}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {result.standardProductNames.map((item) => (
                            <tr key={item.name}>
                              <td className="px-3 py-2 font-medium text-slate-900">{item.name}</td>
                              <td className="px-3 py-2 text-slate-700">{item.requiredSpec}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <EmptySectionState>{dictionary.result.standardProductEmpty}</EmptySectionState>
                  )}
                </details>

                <div className="border-t border-slate-200">
                    <div className="bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900">{dictionary.result.importRequirement}</div>
                    {result.importRequirements.length ? (
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[860px] text-left text-sm">
                          <thead className="border-y border-slate-200 text-xs font-semibold text-slate-500">
                            <tr>
                              <th className="px-3 py-2">{dictionary.result.requirementKind}</th>
                              <th className="px-3 py-2">{dictionary.result.requirement}</th>
                              <th className="px-3 py-2">{dictionary.result.law}</th>
                              <th className="px-3 py-2">{dictionary.result.agency}</th>
                              <th className="px-3 py-2">{dictionary.result.playbook}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {groupedRequirements.map((item) => (
                              <tr key={`${item.type}-${item.name}-${item.relatedLaw}`}>
                                <td className="px-3 py-2"><RequirementKindBadges requirement={item} /></td>
                                <td className="px-3 py-2">
                                  <ImportRequirementDetailDialog
                                    agencies={item.agencies}
                                    name={item.name}
                                    playbook={item.playbook}
                                    procedureSummary={item.procedureSummary}
                                    relatedLaw={item.relatedLaw}
                                    type={item.type}
                                  />
                                </td>
                                <td className="px-3 py-2 text-slate-700">{item.relatedLaw}</td>
                                <td className="px-3 py-2 text-slate-700"><AgencyCell agencies={item.agencies} /></td>
                                <td className="px-3 py-2"><PlaybookStatusBadge dictionary={dictionary} hasPlaybook={Boolean(item.playbook)} /></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <EmptySectionState>{dictionary.result.importRequirementEmpty}</EmptySectionState>
                    )}
                </div>

                <details className="border-t border-slate-200">
                  <summary className="cursor-pointer list-none bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900">
                    {dictionary.result.statisticTitle}
                  </summary>
                  <div className="border-t border-slate-200">
                    <HsNavigationStatsLazySection
                      hskCode={result.hskCode}
                      labels={{
                        count: dictionary.result.statisticCount,
                        empty: dictionary.result.statisticEmpty,
                        loading: dictionary.result.statisticLoading,
                        productName: dictionary.result.statisticProductName,
                        rank: dictionary.result.statisticRank,
                        title: dictionary.result.statisticTitle
                      }}
                    />
                  </div>
                </details>

                <div className="px-3 pb-3">
                  <SourceFooter basisDate={result.basisDate} showVersion={false} sourceName={result.sourceName} sourceVersion={result.sourceVersion} />
                </div>
                  </div>
                </div>
              </article>
              );
            })}
          </div>
        ) : null}
      </CardBody>
    </Card>
  );
}
