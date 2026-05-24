import { CheckCircle2, FileSearch, Gavel, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import {
  DocumentLineCorrectionForm,
  DocumentLineHsRequestActions,
  StaffReviewActions
} from "@/features/staff-review/staff-review-actions";
import { getSeoulDateString } from "@/lib/utils";
import { getStaffReviewQueue } from "@/server/rules/staff-review.service";

function riskTone(riskLevel: string): "warning" | "info" | "neutral" {
  if (riskLevel === "critical" || riskLevel === "high") return "warning";
  if (riskLevel === "medium") return "info";
  return "neutral";
}

export async function StaffReviewCenter() {
  const queue = await getStaffReviewQueue();
  const actionDisabled = queue.dataSource !== "supabase";
  const basisDate = getSeoulDateString();

  return (
    <div className="grid gap-5">
      <Card>
        <CardBody>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-950">검토 큐 데이터 소스</p>
              <p className="mt-1 text-sm text-slate-600">
                {queue.dataSource === "supabase" ? "Supabase RLS 정책을 통과한 검토 대기 데이터를 표시합니다." : "Supabase 연결 전이거나 조회 실패로 mock 검토 큐를 표시합니다."}
              </p>
              {queue.loadError ? <p className="mt-1 text-sm text-amber-800">조회 오류: {queue.loadError}</p> : null}
            </div>
            <Badge tone={queue.dataSource === "supabase" ? "success" : "warning"}>{queue.dataSource}</Badge>
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-4 md:grid-cols-6">
        <Card>
          <CardBody>
            <p className="text-sm font-medium text-slate-600">HS 후보 검토</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{queue.summary.hsCandidateCount}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm font-medium text-slate-600">HS 확정 요청</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{queue.summary.hsConfirmationRequestCount}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm font-medium text-slate-600">문서 추출 보정</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{queue.summary.documentLineItemCount}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm font-medium text-slate-600">리포트 승인 대기</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{queue.summary.reportReviewCount}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm font-medium text-slate-600">법령 변경 검토</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{queue.summary.legalChangeCount}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm font-medium text-slate-600">게시 차단</p>
            <p className="mt-2 text-3xl font-semibold text-amber-700">{queue.summary.blockedPublishCount}</p>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="권한 정책"
          description="클라이언트 사용자는 HS 확정, 리포트 승인, 법령 publish를 수행할 수 없습니다."
          action={<Badge tone="warning">staff/admin only</Badge>}
        />
        <CardBody>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-md border border-slate-200 p-4">
              <ShieldCheck aria-hidden="true" className="text-blue-700" size={22} />
              <p className="mt-2 text-sm font-semibold text-slate-950">Client approval</p>
              <p className="mt-1 text-sm text-slate-600">{queue.permissions.clientCanApprove ? "가능" : "불가"}</p>
            </div>
            <div className="rounded-md border border-slate-200 p-4">
              <Gavel aria-hidden="true" className="text-blue-700" size={22} />
              <p className="mt-2 text-sm font-semibold text-slate-950">Staff approval</p>
              <p className="mt-1 text-sm text-slate-600">{queue.permissions.staffCanApprove ? "가능" : "불가"}</p>
            </div>
            <div className="rounded-md border border-slate-200 p-4">
              <CheckCircle2 aria-hidden="true" className="text-blue-700" size={22} />
              <p className="mt-2 text-sm font-semibold text-slate-950">Audit log</p>
              <p className="mt-1 text-sm text-slate-600">{queue.permissions.approvalRequiresAuditLog ? "필수" : "선택"}</p>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="HS 후보 검토" description="AI 후보는 확정이 아니며 담당자가 선택, 반려, staff_confirmed 처리를 해야 합니다." action={<Badge tone="warning">HSK 확정 후 재조회 필요</Badge>} />
        <CardBody className="grid gap-3">
          {queue.hsCandidates.map((candidate) => (
            <article className="rounded-lg border border-slate-200 p-4" key={candidate.id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <Badge tone="info">Rank {candidate.rank}</Badge>
                    <Badge tone="warning">{candidate.status}</Badge>
                    <Badge tone="neutral">신뢰도 {(candidate.confidenceScore * 100).toFixed(0)}%</Badge>
                  </div>
                  <h2 className="mt-3 font-semibold text-slate-950">{candidate.hskCode} / {candidate.productName}</h2>
                  <p className="mt-1 text-sm text-slate-600">{candidate.companyName} / {candidate.requestId}</p>
                </div>
                <FileSearch aria-hidden="true" className="text-slate-400" size={22} />
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-700">{candidate.reason}</p>
              <p className="mt-2 rounded-md bg-amber-50 p-3 text-sm leading-6 text-amber-900">{candidate.riskNotes}</p>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {candidate.requiredQuestions.map((question) => (
                  <li className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700" key={question}>{question}</li>
                ))}
              </ul>
              <StaffReviewActions disabled={actionDisabled} targetId={candidate.id} targetType="hs_candidate" />
            </article>
          ))}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="HS 확정 요청" description="사용자가 특정 HS CODE로 확정 요청한 건입니다. 보완자료와 코드 적합성을 확인한 뒤 승인 또는 반려합니다." action={<Badge tone="warning">사용자 요청</Badge>} />
        <CardBody className="grid gap-3">
          {queue.hsConfirmationRequests.map((request) => (
            <article className="rounded-lg border border-slate-200 p-4" key={request.id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <Badge tone="warning">{request.status}</Badge>
                    <Badge tone="info">HS {request.hskCode}</Badge>
                    <Badge tone="neutral">기준일 {request.basisDate}</Badge>
                  </div>
                  <h2 className="mt-3 font-semibold text-slate-950">{request.productName ?? "품명 확인 필요"}</h2>
                  <p className="mt-1 text-sm text-slate-600">{request.companyName} / {request.id}</p>
                </div>
                <FileSearch aria-hidden="true" className="text-slate-400" size={22} />
              </div>
              {request.userNote ? <p className="mt-3 rounded-md bg-slate-50 p-3 text-sm leading-6 text-slate-700">{request.userNote}</p> : null}
              {request.supplementQuestions.length ? (
                <div className="mt-3 grid gap-3 lg:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold text-slate-500">보완 질문</p>
                    <ul className="mt-2 grid gap-2">
                      {request.supplementQuestions.map((question) => (
                        <li className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700" key={question}>{question}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500">첨부자료</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {request.recommendedMaterials.map((material) => (
                        <Badge tone="neutral" key={material}>{material}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
              <StaffReviewActions disabled={actionDisabled} targetId={request.id} targetType="hs_confirmation_request" />
            </article>
          ))}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="문서 추출 보정 큐" description="Invoice, Packing List, B/L에서 추출된 라인아이템 후보를 확인하고 HS 추천 전 보정합니다." action={<Badge tone="warning">예비 추출값</Badge>} />
        <CardBody className="grid gap-3">
          {queue.documentLineItems.map((lineItem) => (
            <article className="rounded-lg border border-slate-200 p-4" key={lineItem.id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <Badge tone="warning">{lineItem.status}</Badge>
                    <Badge tone="info">Line {lineItem.lineNo}</Badge>
                    <Badge tone="neutral">신뢰도 {(lineItem.confidenceScore * 100).toFixed(0)}%</Badge>
                  </div>
                  <h2 className="mt-3 font-semibold text-slate-950">{lineItem.productName}</h2>
                  <p className="mt-1 text-sm text-slate-600">{lineItem.companyName} / {lineItem.requestId}</p>
                </div>
                <FileSearch aria-hidden="true" className="text-slate-400" size={22} />
              </div>
              <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <div><dt className="font-semibold text-slate-500">모델</dt><dd>{lineItem.modelName ?? "추가 확인 필요"}</dd></div>
                <div><dt className="font-semibold text-slate-500">국가</dt><dd>{lineItem.originCountry ?? "-"} / {lineItem.shipmentCountry ?? "-"} / {lineItem.destinationCountry ?? "-"}</dd></div>
                <div><dt className="font-semibold text-slate-500">Incoterms</dt><dd>{lineItem.incoterms ?? "추가 확인 필요"}</dd></div>
                <div><dt className="font-semibold text-slate-500">금액</dt><dd>{lineItem.amountLabel}</dd></div>
              </dl>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {lineItem.requiredCorrections.map((correction) => (
                  <li className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900" key={correction}>{correction}</li>
                ))}
              </ul>
              {lineItem.evidence.length ? (
                <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold text-slate-500">추출 근거</p>
                  <ul className="mt-2 grid gap-1 text-xs leading-5 text-slate-600">
                    {lineItem.evidence.map((evidence) => (
                      <li key={`${lineItem.id}-${evidence.field}-${evidence.sourceText}`}>
                        <span className="font-semibold text-slate-800">{evidence.field}</span>
                        <span className="mx-1 text-slate-400">=</span>
                        <span>{evidence.value}</span>
                        <span className="mx-1 text-slate-400">/</span>
                        <span>{evidence.sourceText}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <DocumentLineCorrectionForm disabled={actionDisabled} lineItem={lineItem} />
              <DocumentLineHsRequestActions basisDate={basisDate} correctionCount={lineItem.requiredCorrections.length} disabled={actionDisabled} lineItemId={lineItem.id} />
            </article>
          ))}
        </CardBody>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="리포트 승인 대기" description="고객 게시 전 source lock과 담당자 메모를 확인해야 합니다." action={<Badge tone="warning">pending_review</Badge>} />
          <CardBody className="grid gap-3">
            {queue.reports.map((report) => (
              <article className="rounded-md border border-slate-200 p-3" key={report.id}>
                <div className="flex flex-wrap gap-2">
                  <Badge tone="warning">{report.status}</Badge>
                  <Badge tone="neutral">{report.reportType}</Badge>
                </div>
                <h2 className="mt-3 text-sm font-semibold text-slate-950">{report.title}</h2>
                <p className="mt-1 text-sm text-slate-600">{report.companyName} / HSK {report.hskCode} / 기준일 {report.basisDate}</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">{report.customerSummary}</p>
                <StaffReviewActions disabled={actionDisabled} targetId={report.id} targetType="report" />
              </article>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="법령 변경 검토" description="medium 이상 변경은 승인 전 publish 차단 상태입니다." action={<Badge tone="warning">publish blocked</Badge>} />
          <CardBody className="grid gap-3">
            {queue.legalChanges.map((change) => (
              <article className="rounded-md border border-slate-200 p-3" key={change.id}>
                <div className="flex flex-wrap gap-2">
                  <Badge tone={riskTone(change.riskLevel)}>{change.riskLevel}</Badge>
                  <Badge tone="warning">{change.reviewStatus}</Badge>
                </div>
                <h2 className="mt-3 text-sm font-semibold text-slate-950">{change.impactArea}</h2>
                <p className="mt-1 text-sm text-slate-600">{change.hskCode ?? "HSK 미지정"} / 시행일 {change.effectiveFrom}</p>
                <div className="mt-3 grid gap-2 text-sm lg:grid-cols-2">
                  <p className="rounded-md bg-slate-50 p-2 text-slate-700">이전: {change.oldValue}</p>
                  <p className="rounded-md bg-slate-50 p-2 text-slate-700">신규: {change.newValue}</p>
                </div>
                <StaffReviewActions disabled={actionDisabled} targetId={change.id} targetType="legal_change" />
              </article>
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
