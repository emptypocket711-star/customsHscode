import { FileText, Lock, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { DocumentUploadForm } from "@/features/documents/document-upload-form";
import { destinationCountryOptions } from "@/features/export-diagnosis/country-options";
import { getSeoulDateString } from "@/lib/utils";
import { getSampleExtractionBundle } from "@/server/rules/document-extraction.service";
import { getMockDocumentDiagnosisWorkflow } from "@/server/rules/document-diagnosis.service";
import { analyzeDocumentExtractionClarification } from "@/server/ai/clarification.service";
import { createSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase/server";

function statusTone(status: string): "success" | "warning" | "info" | "neutral" {
  if (status === "done" || status === "extracted") {
    return "success";
  }

  if (status === "needs_review" || status === "needs_correction") {
    return "warning";
  }

  if (status === "pending" || status === "extracting") {
    return "info";
  }

  return "neutral";
}

function comparisonStatusText(status: string) {
  if (status === "matched") return "연결";
  if (status === "missing_invoice") return "Invoice 누락";
  if (status === "missing_packing") return "Packing 누락";
  return "대조 필요";
}

function hsLookupHref(productName: string, direction: "import" | "export", destinationCountry: string | null | undefined, basisDate: string) {
  const normalizedCountry = destinationCountry?.trim().toUpperCase();
  const country = destinationCountryOptions.find((option) => option.code === normalizedCountry || option.alias === normalizedCountry)?.code ?? normalizedCountry ?? "CHN";
  const params = new URLSearchParams({
    query: productName,
    direction,
    destinationCountry: country,
    basisDate
  });

  return `/hs/direct?${params.toString()}`;
}

const normalizedDocumentFields = [
  { field: "shipper / seller", invoice: "Seller, Exporter, Shipper", packing: "Exporter, Shipper", transport: "Shipper" },
  { field: "buyer / consignee", invoice: "Buyer, Sold to, Consignee", packing: "Consignee", transport: "Consignee, Notify party" },
  { field: "product name", invoice: "Description, Commodity", packing: "Item description, Goods", transport: "Description of goods" },
  { field: "model / spec", invoice: "Model, Part No., Specification", packing: "Model, SKU, Mark", transport: "Marks and numbers" },
  { field: "quantity / unit", invoice: "Qty, Unit", packing: "Ctns, PCS, Net/Gross weight", transport: "Packages, Weight" },
  { field: "price / amount", invoice: "Unit price, Amount, Currency", packing: "보통 없음", transport: "보통 없음" },
  { field: "origin / shipment / destination", invoice: "Origin, Country of supply", packing: "Origin, Loading", transport: "POL, POD, Place of delivery" },
  { field: "incoterms", invoice: "Incoterms, Trade terms", packing: "간헐적 기재", transport: "Freight prepaid/collect 단서" }
];

async function hasAuthenticatedUser() {
  if (!hasSupabaseEnv()) return true;

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    return Boolean(user);
  } catch {
    return false;
  }
}

export async function DocumentUploadPanel() {
  const workflow = getMockDocumentDiagnosisWorkflow();
  const extractionBundle = getSampleExtractionBundle();
  const basisDate = getSeoulDateString();
  const authenticated = await hasAuthenticatedUser();
  const documentAiAnalysis = await Promise.all(
    extractionBundle.map((document) => analyzeDocumentExtractionClarification(document, basisDate).catch(() => null))
  );
  const extractionBundleWithAnalysis = extractionBundle.map((document, index) => ({
    document,
    aiAnalysis: documentAiAnalysis[index]
  }));

  return (
    <div className="grid gap-5">
      <Card>
        <CardHeader
          title="문서 업로드 보안 정책"
          description="실제 파일 업로드는 Supabase Auth와 private storage bucket 연결 후 활성화합니다."
          action={<Badge tone="info">case-documents private bucket</Badge>}
        />
        <CardBody>
          <div className="grid gap-3 md:grid-cols-3">
            {workflow.privacyNotices.map((notice) => (
              <div className="rounded-md border border-slate-200 p-4" key={notice}>
                <div className="flex items-start gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-md bg-blue-50 text-blue-700">
                    <Lock aria-hidden="true" size={18} />
                  </span>
                  <p className="text-sm leading-6 text-slate-700">{notice}</p>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="실제 문서 업로드"
          description="로그인된 회사 사용자 기준으로 private storage path와 case document metadata를 생성합니다."
          action={<Badge tone={authenticated ? "success" : "warning"}>{authenticated ? "업로드 가능" : "로그인 필요"}</Badge>}
        />
        <CardBody>
          {!authenticated ? (
            <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
              선적서류는 회사별 private bucket에 저장되므로 로그인 후 업로드할 수 있습니다.
              <Link className="ml-2 font-semibold text-blue-700 underline-offset-2 hover:underline" href="/login">
                로그인 페이지로 이동
              </Link>
            </div>
          ) : null}
          <DocumentUploadForm basisDate={basisDate} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Mock 업로드 문서" description="파일명과 checksum 등 metadata만 표시합니다. 원문 내용은 화면이나 로그에 노출하지 않는 전제입니다." />
        <CardBody>
          <div className="grid gap-3">
            {workflow.documents.map((document) => (
              <article className="rounded-lg border border-slate-200 p-4" key={document.id}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-md bg-slate-100 text-slate-700">
                      <FileText aria-hidden="true" size={20} />
                    </span>
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <Badge tone={statusTone(document.status)}>{document.status}</Badge>
                        <Badge tone="neutral">{document.documentType}</Badge>
                      </div>
                      <h2 className="mt-3 font-semibold text-slate-950">{document.fileName}</h2>
                      <p className="mt-1 text-sm text-slate-600">{document.storagePath}</p>
                    </div>
                  </div>
                  <div className="text-sm text-slate-600">
                    <p>{Math.round(document.fileSize / 1024)} KB</p>
                    <p className="font-mono text-xs">{document.checksum}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="서류 추출 흐름" description="문서에서 품명, 국가, Incoterms, 수량, 단가, 금액 정보를 추출합니다." />
        <CardBody>
          <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {workflow.workflowSteps.map((step, index) => (
              <li className="rounded-md border border-slate-200 p-3" key={step.label}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-blue-700">STEP {index + 1}</span>
                  <Badge tone={statusTone(step.status)}>{step.status}</Badge>
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-950">{step.label}</p>
                <p className="mt-1 text-xs leading-5 text-slate-600">{step.note}</p>
              </li>
            ))}
          </ol>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="서류 양식 정규화 기준"
          description="Invoice, Packing List, B/L·AWB의 서로 다른 명칭을 공통 shipment field로 맞춘 뒤 라인아이템을 생성합니다."
          action={<Badge tone="info">normalized schema</Badge>}
        />
        <CardBody>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 pr-4 font-semibold">공통 필드</th>
                  <th className="py-2 pr-4 font-semibold">Commercial Invoice</th>
                  <th className="py-2 pr-4 font-semibold">Packing List</th>
                  <th className="py-2 pr-4 font-semibold">B/L · AWB</th>
                </tr>
              </thead>
              <tbody>
                {normalizedDocumentFields.map((row) => (
                  <tr className="border-b border-slate-100 align-top" key={row.field}>
                    <td className="py-3 pr-4 font-mono text-xs font-semibold text-slate-950">{row.field}</td>
                    <td className="py-3 pr-4 text-slate-700">{row.invoice}</td>
                    <td className="py-3 pr-4 text-slate-700">{row.packing}</td>
                    <td className="py-3 pr-4 text-slate-700">{row.transport}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Invoice · Packing List 대조"
          description="품명과 모델 기준으로 서류 간 라인을 연결하고 수량 단위 차이를 표시합니다."
          action={<Badge tone="warning">line reconciliation</Badge>}
        />
        <CardBody>
          {workflow.lineComparisons.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2 pr-4 font-semibold">상태</th>
                    <th className="py-2 pr-4 font-semibold">Invoice line</th>
                    <th className="py-2 pr-4 font-semibold">Packing line</th>
                    <th className="py-2 pr-4 font-semibold">품명</th>
                    <th className="py-2 pr-4 font-semibold">모델</th>
                    <th className="py-2 pr-4 font-semibold">대조 메모</th>
                  </tr>
                </thead>
                <tbody>
                  {workflow.lineComparisons.map((comparison) => (
                    <tr className="border-b border-slate-100 align-top" key={`${comparison.invoiceLineNo ?? "none"}-${comparison.packingLineNo ?? "none"}-${comparison.productName}`}>
                      <td className="py-3 pr-4">
                        <Badge tone={comparison.status === "matched" ? "success" : "warning"}>{comparisonStatusText(comparison.status)}</Badge>
                      </td>
                      <td className="py-3 pr-4 text-slate-700">{comparison.invoiceLineNo ?? "-"}</td>
                      <td className="py-3 pr-4 text-slate-700">{comparison.packingLineNo ?? "-"}</td>
                      <td className="py-3 pr-4 font-medium text-slate-950">{comparison.productName}</td>
                      <td className="py-3 pr-4 text-slate-700">{comparison.modelName ?? "-"}</td>
                      <td className="py-3 pr-4 leading-6 text-slate-700">{comparison.notes.join(" / ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-500">대조할 라인 데이터가 없습니다.</p>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="추출 라인아이템" description="품명, 국가, Incoterms, 수량, 단가, 총액은 보정 가능한 예비 추출값입니다." />
        <CardBody>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[940px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 pr-4 font-semibold">Line</th>
                  <th className="py-2 pr-4 font-semibold">품명</th>
                  <th className="py-2 pr-4 font-semibold">모델</th>
                  <th className="py-2 pr-4 font-semibold">국가</th>
                  <th className="py-2 pr-4 font-semibold">Incoterms</th>
                  <th className="py-2 pr-4 font-semibold">수량</th>
                  <th className="py-2 pr-4 font-semibold">금액</th>
                  <th className="py-2 pr-4 font-semibold">신뢰도</th>
                  <th className="py-2 pr-4 font-semibold">조회</th>
                </tr>
              </thead>
              <tbody>
                {workflow.extractedLineItems.map((line) => (
                  <tr className="border-b border-slate-100 align-top" key={line.lineNo}>
                    <td className="py-3 pr-4 font-medium text-slate-900">{line.lineNo}</td>
                    <td className="py-3 pr-4 text-slate-700">{line.productName}</td>
                    <td className="py-3 pr-4 text-slate-700">{line.modelName ?? "추가 확인 필요"}</td>
                    <td className="py-3 pr-4 text-slate-700">
                      원산지 {line.originCountry ?? "-"} / 선적 {line.shipmentCountry ?? "-"} / 목적 {line.destinationCountry ?? "-"}
                    </td>
                    <td className="py-3 pr-4 text-slate-700">{line.incoterms ?? "추가 확인 필요"}</td>
                    <td className="py-3 pr-4 text-slate-700">{line.quantity} {line.unit}</td>
                    <td className="py-3 pr-4 text-slate-700">{line.currency} {line.totalAmount}</td>
                    <td className="py-3 pr-4 text-slate-700">{(line.confidenceScore * 100).toFixed(0)}%</td>
                    <td className="py-3 pr-4">
                      <Link
                        className="font-semibold text-blue-700 underline-offset-2 hover:underline"
                        href={hsLookupHref(line.productName, "export", line.destinationCountry, basisDate)}
                      >
                        통합조회
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 grid gap-3">
            {workflow.extractedLineItems.map((line) => (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3" key={`correction-${line.lineNo}`}>
                <div className="flex items-start gap-3">
                  <ShieldAlert aria-hidden="true" className="mt-0.5 shrink-0 text-amber-700" size={18} />
                  <div>
                    <p className="text-sm font-semibold text-amber-950">Line {line.lineNo} 보정 필요</p>
                    <p className="mt-1 text-sm leading-6 text-amber-900">{line.requiredCorrections.join(", ")}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="양식 대응 Extraction Adapter"
          description="서로 다른 Invoice, Packing List, B/L 문구를 같은 normalized shipment schema로 매핑하는 adapter preview입니다."
          action={<Badge tone="warning">수동 보정 필요</Badge>}
        />
        <CardBody>
          <div className="grid gap-4">
            {extractionBundleWithAnalysis.map(({ document, aiAnalysis }) => (
              <article className="rounded-lg border border-slate-200 p-4" key={document.documentType}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge tone="info">{document.documentType}</Badge>
                      <Badge tone={document.requiredCorrections.length ? "warning" : "success"}>
                        {document.requiredCorrections.length ? "needs_correction" : "extracted"}
                      </Badge>
                    </div>
                    <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                      <div><dt className="font-semibold text-slate-500">Invoice</dt><dd>{document.invoiceNo ?? "-"}</dd></div>
                      <div><dt className="font-semibold text-slate-500">B/L</dt><dd>{document.blNo ?? "-"}</dd></div>
                      <div><dt className="font-semibold text-slate-500">POL/POD</dt><dd>{document.portOfLoading ?? "-"} / {document.portOfDischarge ?? "-"}</dd></div>
                      <div><dt className="font-semibold text-slate-500">Incoterms</dt><dd>{document.incoterms ?? "-"}</dd></div>
                    </dl>
                  </div>
                </div>

                {document.lineItems.length ? (
                  <div className="mt-4 rounded-md bg-slate-50 p-3">
                    <h3 className="text-sm font-semibold text-slate-950">Line item candidates</h3>
                    <ul className="mt-2 grid gap-2">
                      {document.lineItems.map((line) => (
                        <li className="text-sm leading-6 text-slate-700" key={line.lineNo}>
                          {line.lineNo}. {line.productName} / {line.modelName ?? "모델 확인 필요"} / {line.quantity} {line.unit} / {line.currency} {line.totalAmount}
                          <Link
                            className="ml-2 font-semibold text-blue-700 underline-offset-2 hover:underline"
                            href={hsLookupHref(line.productName, "export", document.destinationCountry, basisDate)}
                          >
                            통합조회
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  {aiAnalysis ? (
                    <div className="rounded-md border border-violet-200 bg-violet-50 p-3 lg:col-span-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold text-violet-950">AI 보조 보완질문</h3>
                        <Badge tone="info">{aiAnalysis.provider}</Badge>
                      </div>
                      <p className="mt-2 text-xs leading-5 text-violet-800">{aiAnalysis.summary}</p>
                      <ul className="mt-2 grid gap-1 text-xs leading-5 text-slate-700">
                        {aiAnalysis.missingQuestions.slice(0, 5).map((question) => (
                          <li key={`${document.documentType}-${question}`}>{question}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  <div className="rounded-md border border-slate-200 p-3">
                    <h3 className="text-sm font-semibold text-slate-950">Evidence</h3>
                    <ul className="mt-2 grid gap-1 text-xs leading-5 text-slate-600">
                      {document.evidence.slice(0, 6).map((evidence) => (
                        <li key={`${document.documentType}-${evidence.field}`}>
                          {evidence.field}: {evidence.sourceText}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
                    <h3 className="text-sm font-semibold text-amber-950">Correction queue</h3>
                    <ul className="mt-2 grid gap-1 text-xs leading-5 text-amber-900">
                      {(document.requiredCorrections.length ? document.requiredCorrections : ["추가 보정 항목 없음"]).map((item) => (
                        <li key={`${document.documentType}-${item}`}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
