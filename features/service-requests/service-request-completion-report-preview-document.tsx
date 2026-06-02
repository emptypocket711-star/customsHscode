"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { completionReportDocumentRoleLabel } from "@/features/service-requests/service-request-completion-report-labels";
import type { CompletionReportPreview } from "@/features/service-requests/service-request-completion-report-preview";
import { safeCompletionReportSourceHref } from "@/features/service-requests/service-request-completion-report-source-url";

function statusLabel(status: CompletionReportPreview["status"]) {
  if (status === "draft") return "초안";
  if (status === "submitted") return "확인 대기";
  if (status === "requester_acknowledged") return "화주 확인";
  if (status === "partner_acknowledged") return "파트너 확인";
  if (status === "operator_reviewed") return "운영 검토";
  if (status === "locked") return "잠금 완료";
  return status;
}

function reportTypeLabel(type: CompletionReportPreview["requestType"]) {
  return type === "freight" ? "운송 완료 리포트" : "통관 완료 리포트";
}

function requestTypeLabel(type: CompletionReportPreview["requestType"]) {
  return type === "freight" ? "운송" : "통관";
}

function directionLabel(direction: CompletionReportPreview["requestBasis"]["direction"]) {
  if (direction === "export") return "수출";
  if (direction === "import") return "수입";
  return "-";
}

function requestLifecycleStatusLabel(status: string | null) {
  if (status === "draft") return "초안";
  if (status === "open") return "공개";
  if (status === "bids_received") return "견적 도착";
  if (status === "partner_selected") return "업체 선정";
  if (status === "in_progress") return "진행 중";
  if (status === "completed") return "완료";
  if (status === "cancelled") return "취소";
  return status ?? "-";
}

function lockNotice(preview: CompletionReportPreview) {
  if (preview.status === "locked") return "잠금 완료된 정식 보관본입니다. 출처 잠금과 최종 보관 서류 연결 상태를 함께 확인하십시오.";
  if (preview.status === "operator_reviewed") return "운영 검토는 완료되었지만 아직 잠금 전입니다. 보관본으로 사용하기 전 잠금 처리가 필요합니다.";
  return "잠금 전 미리보기입니다. 상대방 확인과 운영 검토가 끝나기 전에는 보관본으로 사용하지 마십시오.";
}

export function ServiceRequestCompletionReportPreviewDocument({
  backHref,
  preview
}: {
  backHref: string;
  preview: CompletionReportPreview;
}) {
  return (
    <div className="grid gap-5 print:gap-3">
      <div className="flex flex-wrap items-start justify-between gap-3 print:hidden">
        <Link
          className="focus-ring inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          href={backHref}
        >
          요청 상세로
        </Link>
        <button
          className="focus-ring inline-flex h-10 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800"
          onClick={() => window.print()}
          type="button"
        >
          프린트
        </button>
      </div>

      <Card className="print:border-0 print:shadow-none">
        <CardHeader
          action={<Badge tone={preview.status === "locked" ? "success" : "warning"}>{statusLabel(preview.status)}</Badge>}
          description={`요청 ${preview.requestId} / 리포트 ${preview.reportId}`}
          title={`HS FINDER ${reportTypeLabel(preview.requestType)}`}
        />
        <CardBody className="grid gap-4">
          <div className="grid gap-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950 print:border-slate-300 print:bg-white">
            <p className="font-semibold">{preview.watermark}</p>
            <p>{lockNotice(preview)}</p>
          </div>
          <div className="grid gap-2 text-sm text-slate-600 md:grid-cols-4">
            <span>생성 {preview.generatedAt.slice(0, 10)}</span>
            <span>잠금 {preview.lockedAt ? preview.lockedAt.slice(0, 10) : "-"}</span>
            <span>기준일 {preview.requestBasis.basisDate ?? "-"}</span>
            <span>방향 {directionLabel(preview.requestBasis.direction)}</span>
          </div>
          <div className="grid gap-2 rounded-md bg-slate-50 p-3 text-xs leading-5 text-slate-600 print:bg-white md:grid-cols-2">
            <span className="break-all">요청 ID {preview.requestId}</span>
            <span className="break-all">리포트 ID {preview.reportId}</span>
          </div>
        </CardBody>
      </Card>

      <Card className="print:border-slate-300 print:shadow-none">
        <CardHeader description="요청과 선정 견적을 기준으로 완료 리포트의 기준을 고정합니다." title="거래 기준" />
        <CardBody className="grid gap-2 text-sm text-slate-600 md:grid-cols-2">
          <span>요청 유형 {requestTypeLabel(preview.requestType)}</span>
          <span>요청 상태 snapshot {requestLifecycleStatusLabel(preview.requestBasis.requestStatus)}</span>
          <span>출처 snapshot 버전 {preview.sourceSnapshotVersion ?? "-"}</span>
          <span>조회 snapshot {preview.requestBasis.hasSourceLookupSnapshot ? "있음" : "없음"}</span>
          <span className="break-all">선정 견적 {preview.selectedBidBasis.selectedBidId ?? "-"}</span>
          <span>선정일 {preview.selectedBidBasis.selectedAt ? preview.selectedBidBasis.selectedAt.slice(0, 10) : "-"}</span>
        </CardBody>
      </Card>

      <Card className="print:border-slate-300 print:shadow-none">
        <CardHeader description="민감 원문 없이 정산과 완료 요약만 표시합니다." title="완료 요약" />
        <CardBody className="grid gap-3">
          <p className="rounded-md bg-slate-50 p-3 text-sm leading-6 text-slate-700 print:bg-white">
            {preview.summary.text ?? "완료 요약이 입력되지 않았습니다."}
          </p>
          <div className="grid gap-2 text-sm text-slate-600 md:grid-cols-3">
            <span>통화 {preview.summary.currency ?? "-"}</span>
            <span>최종 금액 {preview.summary.finalAmount !== null ? preview.summary.finalAmount.toLocaleString("ko-KR") : "-"}</span>
            <span>정산 항목 {preview.summary.settlementItems.length}건</span>
          </div>
          {preview.summary.settlementItems.length ? (
            <div className="grid gap-2">
              {preview.summary.settlementItems.map((item) => (
                <p className="rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-600" key={`${item.label}-${item.amount ?? "empty"}`}>
                  <span className="font-semibold text-slate-950">{item.label}</span>
                  {" / "}
                  {item.amount !== undefined ? item.amount.toLocaleString("ko-KR") : "-"} {item.currency ?? preview.summary.currency ?? ""}
                </p>
              ))}
            </div>
          ) : null}
        </CardBody>
      </Card>

      {preview.freightResult ? (
        <Card className="print:border-slate-300 print:shadow-none">
          <CardHeader description="운송 결과 기준으로 표시합니다." title="운송 결과" />
          <CardBody className="grid gap-3">
            <div className="grid gap-2 text-sm text-slate-600 md:grid-cols-3">
              <span className="break-all">선사/운송사 {preview.freightResult.carrier ?? "-"}</span>
              <span className="break-all">B/L 또는 AWB {preview.freightResult.blOrAwbNo ?? "-"}</span>
              <span>출발 {preview.freightResult.departureDate ?? "-"}</span>
              <span>도착 {preview.freightResult.arrivalDate ?? "-"}</span>
              <span>출발항 {preview.freightResult.originPort ?? "-"}</span>
              <span>도착항 {preview.freightResult.destinationPort ?? "-"}</span>
            </div>
            {preview.freightResult.exceptions.length ? (
              <div className="grid gap-2">
                {preview.freightResult.exceptions.map((exception) => (
                  <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900 print:bg-white" key={exception}>
                    {exception}
                  </p>
                ))}
              </div>
            ) : null}
          </CardBody>
        </Card>
      ) : null}

      {preview.clearanceResult ? (
        <Card className="print:border-slate-300 print:shadow-none">
          <CardHeader description="통관 항목은 실제 신고 결과 기준으로만 표시합니다." title="통관 결과" />
          <CardBody className="grid gap-3">
            <div className="grid gap-2 text-sm text-slate-600 md:grid-cols-3">
              <span className="break-all">신고번호 {preview.clearanceResult.declarationNo ?? "-"}</span>
              <span className="break-all">신고 결과 HSK {preview.clearanceResult.declaredHskCode ?? "-"}</span>
              <span>원산지 {preview.clearanceResult.originCountryCode ?? "-"}</span>
              <span>신고일 {preview.clearanceResult.acceptedAt ?? "-"}</span>
              <span>수리일 {preview.clearanceResult.releasedAt ?? "-"}</span>
              <span>FTA {preview.clearanceResult.ftaAgreementName ?? "-"}</span>
            </div>
            {preview.clearanceResult.taxSummary.length ? (
              <div className="grid gap-2">
                {preview.clearanceResult.taxSummary.map((tax) => (
                  <p className="rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-600" key={`${tax.label}-${tax.amount}`}>
                    <span className="font-semibold text-slate-950">{tax.label}</span>
                    {" / "}
                    {tax.amount.toLocaleString("ko-KR")} {tax.currency}
                  </p>
                ))}
              </div>
            ) : null}
            {preview.clearanceResult.cautions.length ? (
              <div className="grid gap-2">
                {preview.clearanceResult.cautions.map((caution) => (
                  <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900 print:bg-white" key={caution}>
                    {caution}
                  </p>
                ))}
              </div>
            ) : null}
          </CardBody>
        </Card>
      ) : null}

      <Card className="print:border-slate-300 print:shadow-none">
        <CardHeader action={<Badge tone={preview.archiveDocuments.length > 0 ? "info" : "neutral"}>{preview.archiveDocuments.length}건</Badge>} description="파일명과 원문 링크는 표시하지 않습니다." title="최종 보관 서류" />
        <CardBody className="grid gap-2">
          {preview.archiveDocuments.length ? preview.archiveDocuments.map((document) => (
            <p className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600 print:bg-white" key={document.documentRole}>
              <span className="font-semibold text-slate-950">
                {completionReportDocumentRoleLabel(preview.requestType, document.documentRole)}
              </span>
              {" / "}
              {document.requiredForArchive ? "필수" : "선택"}
            </p>
          )) : (
            <p className="text-sm text-slate-600">연결된 최종 보관 서류가 없습니다.</p>
          )}
        </CardBody>
      </Card>

      <Card className="print:border-slate-300 print:shadow-none">
        <CardHeader action={<Badge tone={preview.sourceLocks.length > 0 ? "info" : "warning"}>{preview.sourceLocks.length}건</Badge>} description="공식 출처 metadata가 있는 경우에만 표시합니다." title="출처 잠금" />
        <CardBody className="grid gap-2">
          {preview.sourceLocks.length ? preview.sourceLocks.map((source) => {
            const sourceHref = safeCompletionReportSourceHref(source.sourceUrl);

            return (
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-600 print:bg-white" key={`${source.sourceName}-${source.retrievedAt ?? ""}`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="font-semibold text-slate-950">{source.sourceName}</p>
                  {sourceHref ? (
                    <a
                      className="focus-ring inline-flex h-8 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 print:hidden"
                      href={sourceHref}
                      rel="noreferrer"
                      target="_blank"
                    >
                      출처 열기
                    </a>
                  ) : null}
                </div>
                <div className="mt-2 grid gap-1 text-xs leading-5 text-slate-600 md:grid-cols-2">
                  <span>자료 버전 {source.sourceVersion ?? "-"}</span>
                  <span>수집시각 {source.retrievedAt ?? "-"}</span>
                  <span>공표시각 {source.publishedAt ?? "-"}</span>
                  <span>적용시작 {source.effectiveFrom ?? "-"}</span>
                  <span>적용종료 {source.effectiveTo ?? "-"}</span>
                  <span className="break-all md:col-span-2">출처 URL {sourceHref ?? "-"}</span>
                  <span className="break-all md:col-span-2">체크섬 {source.checksum ?? "-"}</span>
                </div>
              </div>
            );
          }) : (
            <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900 print:bg-white">
              요청 생성 시점의 예비 조회 snapshot은 있으나 공식 출처 잠금 metadata는 없습니다.
            </p>
          )}
        </CardBody>
      </Card>

      <Card className="print:border-slate-300 print:shadow-none">
        <CardHeader description="본 리포트는 법적 확정 판정 도구가 아닙니다." title="안전 고지" />
        <CardBody className="grid gap-2">
          {preview.safetyNotices.map((notice) => (
            <p className="rounded-md bg-slate-50 p-3 text-sm leading-6 text-slate-700 print:bg-white" key={notice}>
              {notice}
            </p>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
