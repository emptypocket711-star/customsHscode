import { Search } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { destinationCountryOptions, exportCountryLabel } from "@/features/export-diagnosis/country-options";
import { formatHsCode } from "@/lib/hs-code";
import type { DiagnosisDictionary } from "@/lib/i18n";
import { getSeoulDateString } from "@/lib/utils";
import { getExportDiagnosis } from "@/server/rules/export-diagnosis.service";

function Field({
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
    <label className="grid gap-1 text-sm font-medium text-slate-700">
      {label}
      <input
        className="focus-ring rounded-md border border-slate-300 px-3 py-2"
        defaultValue={defaultValue}
        name={name}
        placeholder={placeholder}
        type={name === "basisDate" ? "date" : "text"}
      />
    </label>
  );
}

function DestinationCountrySelect({ defaultValue, label }: { defaultValue: string; label: string }) {
  return (
    <label className="grid gap-1 text-sm font-medium text-slate-700">
      {label}
      <select className="focus-ring rounded-md border border-slate-300 bg-white px-3 py-2" defaultValue={defaultValue} name="destinationCountry">
        {destinationCountryOptions.map((country) => (
          <option key={country.code} value={country.code}>
            {country.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export async function ExportDiagnosisPanel({
  dictionary,
  params
}: {
  dictionary: DiagnosisDictionary;
  params: {
    hskCode?: string;
    basisDate?: string;
    destinationCountry?: string;
    finalUser?: string;
    productSpecs?: string;
    productUse?: string;
  };
}) {
  const basisDate = params.basisDate || getSeoulDateString();
  const hskCode = params.hskCode || "8507.60-1000";
  const destinationCountry = params.destinationCountry || "DEU";
  const destinationCountryLabel = exportCountryLabel(destinationCountry);
  const result = params.hskCode
    ? await getExportDiagnosis({
        hskCode,
        basisDate,
        destinationCountry,
        finalUser: params.finalUser,
        productSpecs: params.productSpecs,
        productUse: params.productUse
      })
    : null;

  return (
    <Card>
      <CardHeader title={dictionary.export.panelTitle} />
      <CardBody>
        <form className="grid gap-4" method="get">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field defaultValue={hskCode} label={dictionary.common.hskCode} name="hskCode" placeholder="예: 8507.60-1000" />
            <Field defaultValue={basisDate} label={dictionary.common.basisDate} name="basisDate" />
            <DestinationCountrySelect defaultValue={destinationCountry} label={dictionary.common.destinationCountry} />
            <Field defaultValue={params.finalUser ?? ""} label={dictionary.export.fields.finalUser} name="finalUser" placeholder={dictionary.export.fields.finalUserPlaceholder} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field defaultValue={params.productUse ?? ""} label={dictionary.export.fields.productUse} name="productUse" placeholder={dictionary.export.fields.productUsePlaceholder} />
            <Field defaultValue={params.productSpecs ?? ""} label={dictionary.export.fields.productSpecs} name="productSpecs" placeholder={dictionary.export.fields.productSpecsPlaceholder} />
          </div>
          <button className="focus-ring inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 sm:w-fit" type="submit">
            <Search aria-hidden="true" size={18} />
            {dictionary.common.search}
          </button>
        </form>

        {!params.hskCode ? (
          <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
            {dictionary.export.empty}
          </div>
        ) : null}

        {params.hskCode && !result ? (
          <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            {dictionary.export.noResult}
          </div>
        ) : null}

        {result ? (
          <div className="mt-5 overflow-hidden rounded-md border border-slate-200">
            <div className="bg-blue-700 px-3 py-2 text-sm font-semibold text-white">{dictionary.export.exportResult}</div>
            <dl className="grid text-sm sm:grid-cols-[140px_1fr_140px_1fr]">
              <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">HSK</dt>
              <dd className="border-b border-slate-200 px-3 py-2 font-mono font-semibold text-slate-950">{formatHsCode(result.hskCode)}</dd>
              <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">{dictionary.common.hs6}</dt>
              <dd className="border-b border-slate-200 px-3 py-2 font-mono text-slate-700">{formatHsCode(result.hs6)}</dd>
              <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">{dictionary.common.productName}</dt>
              <dd className="border-b border-slate-200 px-3 py-2 sm:col-span-3">{result.productName}</dd>
              <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">{dictionary.common.destinationCountry}</dt>
              <dd className="border-b border-slate-200 px-3 py-2">{destinationCountryLabel}</dd>
              <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">{dictionary.common.basisDate}</dt>
              <dd className="border-b border-slate-200 px-3 py-2">{result.basisDate}</dd>
            </dl>

            <section className="border-t border-slate-200">
              <div className="bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900">{dictionary.export.requirementSection}</div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead className="border-y border-slate-200 text-xs font-semibold text-slate-500">
                    <tr>
                      <th className="px-3 py-2">{dictionary.common.type}</th>
                      <th className="px-3 py-2">{dictionary.common.name}</th>
                      <th className="px-3 py-2">{dictionary.common.law}</th>
                      <th className="px-3 py-2">{dictionary.common.agency}</th>
                      <th className="px-3 py-2">{dictionary.import.table.procedure}</th>
                      <th className="px-3 py-2">{dictionary.common.documents}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                {result.requirements.length ? (
                  result.requirements.map((requirement) => (
                    <tr key={requirement.name}>
                      <td className="px-3 py-2 text-slate-700">{requirement.type}</td>
                      <td className="px-3 py-2 font-medium text-slate-900">{requirement.name}</td>
                      <td className="px-3 py-2 text-slate-700">{requirement.relatedLaw}</td>
                      <td className="px-3 py-2 text-slate-700">{requirement.agency}</td>
                      <td className="px-3 py-2 leading-6 text-slate-700">{requirement.procedureSummary}</td>
                      <td className="px-3 py-2 leading-6 text-slate-600">{requirement.buyerDocuments.join(", ")}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td className="px-3 py-2 text-slate-600" colSpan={6}>{dictionary.export.requirementEmpty}</td></tr>
                )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="border-t border-slate-200">
              <div className="bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900">{dictionary.export.exportControlSection}</div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] text-left text-sm">
                  <thead className="border-y border-slate-200 text-xs font-semibold text-slate-500">
                    <tr>
                      <th className="px-3 py-2">{dictionary.export.table.category}</th>
                      <th className="px-3 py-2">{dictionary.export.table.keyword}</th>
                      <th className="px-3 py-2">{dictionary.export.table.specCondition}</th>
                      <th className="px-3 py-2">{dictionary.export.table.selfClassification}</th>
                      <th className="px-3 py-2">{dictionary.export.table.expertClassification}</th>
                      <th className="px-3 py-2">{dictionary.export.table.license}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                {result.exportControls.length ? (
                  result.exportControls.map((control) => (
                    <tr key={control.keyword}>
                      <td className="px-3 py-2 text-slate-700">{control.category}</td>
                      <td className="px-3 py-2 font-medium text-slate-900">{control.keyword}</td>
                      <td className="px-3 py-2 leading-6 text-slate-700">{control.specCondition}</td>
                      <td className="px-3 py-2 text-slate-700">{control.selfClassificationNeeded ? dictionary.export.possible : "-"}</td>
                      <td className="px-3 py-2 text-slate-700">{control.expertClassificationNeeded ? dictionary.export.possible : "-"}</td>
                      <td className="px-3 py-2 text-slate-700">{control.licenseType ?? "-"}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td className="px-3 py-2 text-slate-600" colSpan={6}>{dictionary.export.exportControlEmpty}</td></tr>
                )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="border-t border-slate-200">
              <div className="bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900">{dictionary.export.ftaCoSection}</div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="border-y border-slate-200 text-xs font-semibold text-slate-500">
                    <tr>
                      <th className="px-3 py-2">{dictionary.common.agreement}</th>
                      <th className="px-3 py-2">{dictionary.common.issue}</th>
                      <th className="px-3 py-2">{dictionary.export.table.issueMethod}</th>
                      <th className="px-3 py-2">{dictionary.common.evidence}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                {result.ftaCoOptions.length ? (
                  result.ftaCoOptions.map((fta) => (
                    <tr key={fta.agreementName}>
                      <td className="px-3 py-2 font-medium text-slate-900">{fta.agreementName}</td>
                      <td className="px-3 py-2 leading-6 text-slate-700">{fta.coIssuePossibility}</td>
                      <td className="px-3 py-2 text-slate-700">{fta.issueMethod}</td>
                      <td className="px-3 py-2 leading-6 text-slate-600">{fta.originEvidence.join(", ")}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td className="px-3 py-2 text-slate-600" colSpan={4}>{dictionary.export.ftaCoEmpty}</td></tr>
                )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="border-t border-slate-200">
              <div className="bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900">{dictionary.export.destinationTariffSection}</div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[920px] text-left text-sm">
                  <thead className="border-y border-slate-200 text-xs font-semibold text-slate-500">
                    <tr>
                      <th className="px-3 py-2">{dictionary.common.country}</th>
                      <th className="px-3 py-2">{dictionary.export.table.destinationHs}</th>
                      <th className="px-3 py-2">{dictionary.export.table.destinationName}</th>
                      <th className="px-3 py-2">{dictionary.export.table.baseRate}</th>
                      <th className="px-3 py-2">{dictionary.export.table.preferentialRate}</th>
                      <th className="px-3 py-2">{dictionary.export.table.tariffYear}</th>
                      <th className="px-3 py-2">{dictionary.common.sourceVersion}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                {result.destinationTariffs.length ? (
                  result.destinationTariffs.map((tariff) => (
                    <tr key={`${tariff.countryCode}-${tariff.destinationHsCode}-${tariff.sourceVersion}`}>
                      <td className="px-3 py-2 font-medium text-slate-900">{exportCountryLabel(tariff.countryCode)}</td>
                      <td className="px-3 py-2 font-mono text-slate-700">{formatHsCode(tariff.destinationHsCode)}</td>
                      <td className="px-3 py-2 text-slate-700">{tariff.koreanName ?? tariff.englishName ?? "-"}</td>
                      <td className="px-3 py-2 font-semibold text-orange-600">{tariff.baseRateText ?? "-"}</td>
                      <td className="px-3 py-2 leading-6 text-slate-600">
                        {Object.entries(tariff.agreementRates).length
                          ? Object.entries(tariff.agreementRates).map(([agreement, rate]) => `${agreement}: ${rate}`).join(" / ")
                          : "-"}
                      </td>
                      <td className="px-3 py-2 text-slate-700">{tariff.tariffYear}</td>
                      <td className="px-3 py-2 text-slate-500">{tariff.sourceVersion}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td className="px-3 py-2 text-slate-600" colSpan={7}>{dictionary.export.destinationTariffEmpty}</td></tr>
                )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="border-t border-slate-200">
              <div className="bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900">{dictionary.export.buyerDocumentsSection}</div>
              <div className="px-3 py-3 text-sm leading-6 text-slate-700">{result.buyerDocumentList.join(", ")}</div>
            </section>

            <section className="border-t border-slate-200 bg-slate-50 px-3 py-3">
              <h2 className="text-sm font-semibold text-slate-950">{dictionary.common.notes}</h2>
              <ul className="mt-2 grid gap-1 text-xs leading-5 text-slate-600">
                {result.notices.map((notice) => (
                  <li key={notice}>{notice}</li>
                ))}
              </ul>
            </section>
          </div>
        ) : null}
      </CardBody>
    </Card>
  );
}
