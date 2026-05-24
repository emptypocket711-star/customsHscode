import { Search } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { formatHsCode } from "@/lib/hs-code";
import { getSeoulDateString } from "@/lib/utils";
import { getImportDiagnosis } from "@/server/rules/import-diagnosis.service";

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

const importCountryOptions = [
  { code: "KR", label: "한국 (KR)" },
  { code: "CN", label: "중국 (CN)" },
  { code: "US", label: "미국 (US)" },
  { code: "JP", label: "일본 (JP)" },
  { code: "VN", label: "베트남 (VN)" },
  { code: "DE", label: "독일 (DE)" },
  { code: "FR", label: "프랑스 (FR)" },
  { code: "GB", label: "영국 (GB)" },
  { code: "IN", label: "인도 (IN)" },
  { code: "ID", label: "인도네시아 (ID)" },
  { code: "TH", label: "태국 (TH)" },
  { code: "MX", label: "멕시코 (MX)" },
  { code: "CA", label: "캐나다 (CA)" },
  { code: "AU", label: "호주 (AU)" }
];

function CountrySelect({
  name,
  label,
  defaultValue,
  allowBlank = false
}: {
  name: string;
  label: string;
  defaultValue: string;
  allowBlank?: boolean;
}) {
  return (
    <label className="grid gap-1 text-sm font-medium text-slate-700">
      {label}
      <select className="focus-ring rounded-md border border-slate-300 bg-white px-3 py-2" defaultValue={defaultValue} name={name}>
        {allowBlank ? <option value="">선택 안 함</option> : null}
        {importCountryOptions.map((country) => (
          <option key={country.code} value={country.code}>
            {country.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export async function ImportDiagnosisPanel({
  params
}: {
  params: {
    hskCode?: string;
    basisDate?: string;
    exportCountry?: string;
    shipmentCountry?: string;
    originCountry?: string;
    manufacturingCountry?: string;
    sellerCountry?: string;
    destinationCountry?: string;
  };
}) {
  const basisDate = params.basisDate || getSeoulDateString();
  const hskCode = params.hskCode || "3304.99-1000";
  const result = params.hskCode
    ? await getImportDiagnosis({
        hskCode,
        basisDate,
        exportCountry: params.exportCountry,
        shipmentCountry: params.shipmentCountry,
        originCountry: params.originCountry,
        manufacturingCountry: params.manufacturingCountry,
        sellerCountry: params.sellerCountry,
        destinationCountry: params.destinationCountry
      })
    : null;

  return (
    <Card>
      <CardHeader title="수입 관세·요건 조회" />
      <CardBody>
        <form className="grid gap-4" method="get">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field defaultValue={hskCode} label="HSK 코드" name="hskCode" placeholder="예: 3304.99-1000" />
            <Field defaultValue={basisDate} label="조회기준일" name="basisDate" />
            <CountrySelect defaultValue={params.originCountry ?? "CN"} label="원산지" name="originCountry" />
            <CountrySelect defaultValue={params.destinationCountry ?? "KR"} label="목적국" name="destinationCountry" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <CountrySelect defaultValue={params.exportCountry ?? "CN"} label="수출국" name="exportCountry" />
            <CountrySelect defaultValue={params.shipmentCountry ?? "CN"} label="선적국" name="shipmentCountry" />
            <CountrySelect defaultValue={params.manufacturingCountry ?? "CN"} label="제조국" name="manufacturingCountry" />
            <CountrySelect allowBlank defaultValue={params.sellerCountry ?? ""} label="판매국" name="sellerCountry" />
          </div>
          <button className="focus-ring inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 sm:w-fit" type="submit">
            <Search aria-hidden="true" size={18} />
            조회
          </button>
        </form>

        {!params.hskCode ? (
          <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
            HSK와 국가 정보를 입력하면 관세율, FTA, C/O, 수입요건이 표시됩니다.
          </div>
        ) : null}

        {params.hskCode && !result ? (
          <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            조회기준일에 표시할 수 있는 수입 정보가 없습니다.
          </div>
        ) : null}

        {result ? (
          <div className="mt-5 overflow-hidden rounded-md border border-slate-200">
            <div className="bg-blue-700 px-3 py-2 text-sm font-semibold text-white">수입 조회 결과</div>
            <dl className="grid text-sm sm:grid-cols-[140px_1fr_140px_1fr]">
              <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">HSK</dt>
              <dd className="border-b border-slate-200 px-3 py-2 font-mono font-semibold text-slate-950">{formatHsCode(result.hskCode)}</dd>
              <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">HS6</dt>
              <dd className="border-b border-slate-200 px-3 py-2 font-mono text-slate-700">{formatHsCode(result.hs6)}</dd>
              <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">품명</dt>
              <dd className="border-b border-slate-200 px-3 py-2 sm:col-span-3">{result.productName}</dd>
              <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">조회기준일</dt>
              <dd className="border-b border-slate-200 px-3 py-2">{result.basisDate}</dd>
              <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">출처 버전</dt>
              <dd className="border-b border-slate-200 px-3 py-2">{result.sourceVersion}</dd>
            </dl>

            <section className="border-t border-slate-200">
              <div className="bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900">관세율</div>
              <table className="w-full text-left text-sm">
                <thead className="border-y border-slate-200 text-xs font-semibold text-slate-500">
                  <tr>
                    <th className="px-3 py-2">구분</th>
                    <th className="px-3 py-2">세율</th>
                    <th className="px-3 py-2">출처</th>
                    <th className="px-3 py-2">버전</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {result.tariffs.length ? (
                    result.tariffs.map((tariff) => (
                      <tr key={tariff.label}>
                        <td className="px-3 py-2 font-medium text-slate-900">{tariff.label}</td>
                        <td className="px-3 py-2 font-semibold text-orange-600">{tariff.rateText}</td>
                        <td className="px-3 py-2 text-slate-600">{tariff.sourceName}</td>
                        <td className="px-3 py-2 text-slate-500">{tariff.sourceVersion}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td className="px-3 py-2 text-slate-600" colSpan={4}>관세율 데이터 없음</td></tr>
                  )}
                </tbody>
              </table>
            </section>

            <section className="border-t border-slate-200">
              <div className="bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900">FTA / C/O</div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[920px] text-left text-sm">
                  <thead className="border-y border-slate-200 text-xs font-semibold text-slate-500">
                    <tr>
                      <th className="px-3 py-2">협정</th>
                      <th className="px-3 py-2">국가</th>
                      <th className="px-3 py-2">협정세율</th>
                      <th className="px-3 py-2">C/O</th>
                      <th className="px-3 py-2">발급</th>
                      <th className="px-3 py-2">직접운송</th>
                      <th className="px-3 py-2">증빙</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                {result.ftaOptions.length ? (
                  result.ftaOptions.map((fta) => (
                    <tr key={fta.agreementName}>
                      <td className="px-3 py-2 font-medium text-slate-900">{fta.agreementName}</td>
                      <td className="px-3 py-2 text-slate-700">{fta.countryName}</td>
                      <td className="px-3 py-2 font-semibold text-orange-600">{fta.preferentialRateText}</td>
                      <td className="px-3 py-2 text-slate-700">{fta.coType}</td>
                      <td className="px-3 py-2 text-slate-700">{fta.issueMethod} / {fta.issuer}</td>
                      <td className="px-3 py-2 text-slate-700">{fta.directTransportIssue}</td>
                      <td className="px-3 py-2 text-slate-600">{fta.requiredEvidence.join(", ")}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td className="px-3 py-2 text-slate-600" colSpan={7}>표시 가능한 FTA 데이터 없음</td></tr>
                )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="border-t border-slate-200">
              <div className="bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900">수입요건</div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[920px] text-left text-sm">
                  <thead className="border-y border-slate-200 text-xs font-semibold text-slate-500">
                    <tr>
                      <th className="px-3 py-2">구분</th>
                      <th className="px-3 py-2">요건명</th>
                      <th className="px-3 py-2">법령</th>
                      <th className="px-3 py-2">기관</th>
                      <th className="px-3 py-2">내용</th>
                      <th className="px-3 py-2">요청자료</th>
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
                      <td className="px-3 py-2 leading-6 text-slate-600">{requirement.playbook?.requiredDocuments.join(", ") ?? "-"}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td className="px-3 py-2 text-slate-600" colSpan={6}>표시 가능한 수입요건 데이터 없음</td></tr>
                )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="border-t border-slate-200 bg-slate-50 px-3 py-3">
              <h2 className="text-sm font-semibold text-slate-950">참고사항</h2>
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
