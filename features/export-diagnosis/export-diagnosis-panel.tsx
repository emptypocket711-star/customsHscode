import { Search } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { destinationCountryOptions, exportCountryLabel } from "@/features/export-diagnosis/country-options";
import { formatHsCode } from "@/lib/hs-code";
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

function DestinationCountrySelect({ defaultValue }: { defaultValue: string }) {
  return (
    <label className="grid gap-1 text-sm font-medium text-slate-700">
      목적국
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
  params
}: {
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
      <CardHeader title="수출·상대국 관세율 조회" />
      <CardBody>
        <form className="grid gap-4" method="get">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field defaultValue={hskCode} label="HSK 코드" name="hskCode" placeholder="예: 8507.60-1000" />
            <Field defaultValue={basisDate} label="조회기준일" name="basisDate" />
            <DestinationCountrySelect defaultValue={destinationCountry} />
            <Field defaultValue={params.finalUser ?? ""} label="최종사용자" name="finalUser" placeholder="해외 유통사 또는 제조사" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field defaultValue={params.productUse ?? ""} label="최종 용도" name="productUse" placeholder="예: 전기자전거 교체용" />
            <Field defaultValue={params.productSpecs ?? ""} label="제품 스펙" name="productSpecs" placeholder="전압, 용량, 통신/암호 기능 등" />
          </div>
          <button className="focus-ring inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 sm:w-fit" type="submit">
            <Search aria-hidden="true" size={18} />
            조회
          </button>
        </form>

        {!params.hskCode ? (
          <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
            HSK와 목적국을 입력하면 수출요건, FTA C/O, 바이어 제출서류, 상대국 관세율이 표시됩니다.
          </div>
        ) : null}

        {params.hskCode && !result ? (
          <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            조회기준일에 표시할 수 있는 수출 정보가 없습니다.
          </div>
        ) : null}

        {result ? (
          <div className="mt-5 overflow-hidden rounded-md border border-slate-200">
            <div className="bg-blue-700 px-3 py-2 text-sm font-semibold text-white">수출 조회 결과</div>
            <dl className="grid text-sm sm:grid-cols-[140px_1fr_140px_1fr]">
              <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">HSK</dt>
              <dd className="border-b border-slate-200 px-3 py-2 font-mono font-semibold text-slate-950">{formatHsCode(result.hskCode)}</dd>
              <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">HS6</dt>
              <dd className="border-b border-slate-200 px-3 py-2 font-mono text-slate-700">{formatHsCode(result.hs6)}</dd>
              <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">품명</dt>
              <dd className="border-b border-slate-200 px-3 py-2 sm:col-span-3">{result.productName}</dd>
              <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">목적국</dt>
              <dd className="border-b border-slate-200 px-3 py-2">{destinationCountryLabel}</dd>
              <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">조회기준일</dt>
              <dd className="border-b border-slate-200 px-3 py-2">{result.basisDate}</dd>
            </dl>

            <section className="border-t border-slate-200">
              <div className="bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900">수출요건</div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead className="border-y border-slate-200 text-xs font-semibold text-slate-500">
                    <tr>
                      <th className="px-3 py-2">구분</th>
                      <th className="px-3 py-2">요건명</th>
                      <th className="px-3 py-2">법령</th>
                      <th className="px-3 py-2">기관</th>
                      <th className="px-3 py-2">내용</th>
                      <th className="px-3 py-2">제출서류</th>
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
                  <tr><td className="px-3 py-2 text-slate-600" colSpan={6}>표시 가능한 수출요건 데이터 없음</td></tr>
                )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="border-t border-slate-200">
              <div className="bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900">전략물자 / 수출통제</div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] text-left text-sm">
                  <thead className="border-y border-slate-200 text-xs font-semibold text-slate-500">
                    <tr>
                      <th className="px-3 py-2">분류</th>
                      <th className="px-3 py-2">키워드</th>
                      <th className="px-3 py-2">조건</th>
                      <th className="px-3 py-2">자가판정</th>
                      <th className="px-3 py-2">전문판정</th>
                      <th className="px-3 py-2">허가</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                {result.exportControls.length ? (
                  result.exportControls.map((control) => (
                    <tr key={control.keyword}>
                      <td className="px-3 py-2 text-slate-700">{control.category}</td>
                      <td className="px-3 py-2 font-medium text-slate-900">{control.keyword}</td>
                      <td className="px-3 py-2 leading-6 text-slate-700">{control.specCondition}</td>
                      <td className="px-3 py-2 text-slate-700">{control.selfClassificationNeeded ? "필요 가능성 있음" : "-"}</td>
                      <td className="px-3 py-2 text-slate-700">{control.expertClassificationNeeded ? "필요 가능성 있음" : "-"}</td>
                      <td className="px-3 py-2 text-slate-700">{control.licenseType ?? "-"}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td className="px-3 py-2 text-slate-600" colSpan={6}>표시 가능한 수출통제 데이터 없음</td></tr>
                )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="border-t border-slate-200">
              <div className="bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900">FTA C/O 및 원산지증빙</div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="border-y border-slate-200 text-xs font-semibold text-slate-500">
                    <tr>
                      <th className="px-3 py-2">협정</th>
                      <th className="px-3 py-2">발급 가능성</th>
                      <th className="px-3 py-2">발급방식</th>
                      <th className="px-3 py-2">원산지증빙</th>
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
                  <tr><td className="px-3 py-2 text-slate-600" colSpan={4}>표시 가능한 FTA C/O 데이터 없음</td></tr>
                )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="border-t border-slate-200">
              <div className="bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900">수출상대국 관세율</div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[920px] text-left text-sm">
                  <thead className="border-y border-slate-200 text-xs font-semibold text-slate-500">
                    <tr>
                      <th className="px-3 py-2">국가</th>
                      <th className="px-3 py-2">상대국 HS</th>
                      <th className="px-3 py-2">품명</th>
                      <th className="px-3 py-2">기본세율</th>
                      <th className="px-3 py-2">협정세율</th>
                      <th className="px-3 py-2">연도</th>
                      <th className="px-3 py-2">출처 버전</th>
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
                  <tr><td className="px-3 py-2 text-slate-600" colSpan={7}>목적국 관세율 데이터 없음</td></tr>
                )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="border-t border-slate-200">
              <div className="bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900">바이어 제출서류</div>
              <div className="px-3 py-3 text-sm leading-6 text-slate-700">{result.buyerDocumentList.join(", ")}</div>
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
