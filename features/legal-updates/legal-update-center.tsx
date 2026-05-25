import { AlertTriangle, CheckCircle2, Clock, FileWarning } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { SourceFooter } from "@/components/ui/source-footer";
import { DestinationCoverageTable } from "@/features/dashboard/destination-coverage-table";
import { CustomsApiConnectorPanel } from "@/features/legal-updates/customs-api-connector-panel";
import { OperationsRefreshPanel } from "@/features/legal-updates/operations-refresh-panel";
import { SourcePublishPanel } from "@/features/legal-updates/source-publish-panel";
import { getSeoulDateString } from "@/lib/utils";
import { loadDestinationCoverage } from "@/server/rules/dashboard-metrics.service";
import { getLegalUpdateDashboard } from "@/server/rules/legal-update.service";
import { getSourceVersionInventory, type SourceVersionInventoryDiagnosticSeverity } from "@/server/rules/source-inventory.service";

function riskTone(riskLevel: string): "warning" | "info" | "neutral" {
  if (riskLevel === "critical" || riskLevel === "high") {
    return "warning";
  }

  if (riskLevel === "medium") {
    return "info";
  }

  return "neutral";
}

function reviewText(reviewStatus: string) {
  if (reviewStatus === "approved") {
    return "검토 승인";
  }

  if (reviewStatus === "rejected") {
    return "반려";
  }

  return "검토 대기";
}

function sourceStatusTone(status: string): "success" | "warning" | "info" | "neutral" {
  if (status === "published") return "success";
  if (status === "staged" || status === "reviewed") return "warning";
  if (status === "draft") return "info";
  return "neutral";
}

function sourceDiagnosticTone(severity: SourceVersionInventoryDiagnosticSeverity): "success" | "warning" | "neutral" {
  if (severity === "ok") return "success";
  if (severity === "danger") return "warning";
  return "neutral";
}

function coverageTone(missingCount: number, warningCount = 0): "success" | "warning" | "neutral" {
  if (missingCount > 0) return "warning";
  if (warningCount > 0) return "neutral";
  return "success";
}

const updateRunbook = [
  {
    target: "국내 HS/관세율/표준품명",
    source: "관세청 엑셀 다운로드",
    command: "python3 scripts/generate_customs_excel_seed.py --only all",
    check: "HS CODE, 표준품명, 관세율 행 수와 source_version 확인"
  },
  {
    target: "세관장확인 수입요건",
    source: "MYC OpenAPI API029",
    command: "scripts/apply_lookup_seed_bundle.sh",
    check: "customs_confirmation_requirements published 상태 확인"
  },
  {
    target: "수출 목적국 관세율",
    source: "국가별 관세율표/각국 공식 tariff API",
    command: "국가별 generate_*_seed.py 재실행",
    check: "export_destination_country_coverage 관세율/내국세/요건 count 확인"
  },
  {
    target: "중국 세번/내국세/수입요건",
    source: "중국 해관총서/세무총국 자료",
    command: "china_* seed generator 재실행",
    check: "8자리 tariff와 10자리 신고상품번호 매칭 확인"
  },
  {
    target: "관세환율",
    source: "관세청 API012",
    command: "CUSTOMS_API_EXCHANGE_RATE_* 환경변수 확인 후 fetch job 실행",
    check: "기준일·수입/수출 구분별 환율 응답 확인"
  }
];

export async function LegalUpdateCenter() {
  const dashboard = getLegalUpdateDashboard();
  const basisDate = getSeoulDateString();
  const [inventory, destinationCoverageRows] = await Promise.all([
    getSourceVersionInventory(),
    loadDestinationCoverage()
  ]);

  return (
    <div className="grid gap-5">
      <CustomsApiConnectorPanel />
      <OperationsRefreshPanel basisDate={basisDate} />
      <SourcePublishPanel />

      <Card>
        <CardHeader
          title="목적국 데이터 커버리지"
          description="수출 목적국 조회에 사용되는 관세율, 내국세, 수입요건, 추가관세 적재 현황입니다."
          action={<Badge tone="info">coverage</Badge>}
        />
        <CardBody>
          <DestinationCoverageTable rows={destinationCoverageRows} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="관세청 source inventory"
          description="공식 엑셀/API 원천이 테이블과 source_version 단위로 몇 건 적재되었는지 확인합니다."
          action={<Badge tone={inventory.dataSource === "supabase" ? "success" : "warning"}>{inventory.dataSource}</Badge>}
        />
        <CardBody>
          <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-blue-950">국내 수입 10자리 조회 스냅샷</p>
                <p className="mt-1 text-xs text-blue-800">
                  HSK 10자리 기준으로 품명, 관세율, 수입요건, 통합공고, 내국세 후보를 미리 묶은 읽기 모델입니다.
                </p>
              </div>
              <Badge tone={inventory.domesticLookupCoverage.missingTariffRates === 0 ? "success" : "warning"}>
                관세율 누락 {inventory.domesticLookupCoverage.missingTariffRates.toLocaleString("ko-KR")}
              </Badge>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-6">
              <div>
                <p className="text-xs font-medium text-blue-700">HSK10</p>
                <p className="text-lg font-semibold text-blue-950">{inventory.domesticLookupCoverage.totalHsk10.toLocaleString("ko-KR")}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-blue-700">관세율 보유</p>
                <p className="text-lg font-semibold text-blue-950">{inventory.domesticLookupCoverage.withTariffRates.toLocaleString("ko-KR")}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-blue-700">세관장확인</p>
                <p className="text-lg font-semibold text-blue-950">{inventory.domesticLookupCoverage.withCustomsRequirements.toLocaleString("ko-KR")}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-blue-700">통합공고</p>
                <p className="text-lg font-semibold text-blue-950">{inventory.domesticLookupCoverage.withPublicNoticeRequirements.toLocaleString("ko-KR")}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-blue-700">내국세 후보</p>
                <p className="text-lg font-semibold text-blue-950">{inventory.domesticLookupCoverage.withInternalTaxes.toLocaleString("ko-KR")}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-blue-700">기준일</p>
                <p className="text-sm font-semibold text-blue-950">{inventory.domesticLookupCoverage.snapshotBasisDate ?? "-"}</p>
              </div>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-6">
            <div className="rounded-md border border-slate-200 p-4">
              <p className="text-sm font-medium text-slate-600">staged source</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{inventory.summary.stagedCount}</p>
            </div>
            <div className="rounded-md border border-slate-200 p-4">
              <p className="text-sm font-medium text-slate-600">published source</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{inventory.summary.publishedCount}</p>
            </div>
            <div className="rounded-md border border-slate-200 p-4">
              <p className="text-sm font-medium text-slate-600">총 행 수</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{inventory.summary.totalRows.toLocaleString("ko-KR")}</p>
            </div>
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm font-medium text-emerald-800">사용 가능</p>
              <p className="mt-2 text-2xl font-semibold text-emerald-950">{inventory.summary.diagnosticCounts.ok}</p>
            </div>
            <div className="rounded-md border border-slate-200 p-4">
              <p className="text-sm font-medium text-slate-600">확인 필요</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{inventory.summary.diagnosticCounts.warning}</p>
            </div>
            <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-medium text-amber-800">적재 문제</p>
              <p className="mt-2 text-2xl font-semibold text-amber-950">{inventory.summary.diagnosticCounts.danger}</p>
            </div>
          </div>
          {inventory.loadError ? <p className="mt-3 text-sm text-amber-800">조회 오류: {inventory.loadError}</p> : null}

          <div className="mt-4 rounded-lg border border-indigo-100 bg-indigo-50 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-indigo-950">원산지표시 데이터 커버리지</p>
                <p className="mt-1 text-xs text-indigo-800">
                  원산지표시대상 HS 패턴과 물품별 표시방법 연결 상태를 점검합니다.
                </p>
              </div>
              <Badge tone={coverageTone(inventory.originMarkingCoverage.targetsMissingMethod)}>
                표시방법 연결률 {inventory.originMarkingCoverage.methodCoverageRate}%
              </Badge>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-5">
              <div>
                <p className="text-xs font-medium text-indigo-700">대상 HS 패턴</p>
                <p className="text-lg font-semibold text-indigo-950">{inventory.originMarkingCoverage.targetPatterns.toLocaleString("ko-KR")}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-indigo-700">표시방법 패턴</p>
                <p className="text-lg font-semibold text-indigo-950">{inventory.originMarkingCoverage.methodPatterns.toLocaleString("ko-KR")}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-indigo-700">표시방법 연결</p>
                <p className="text-lg font-semibold text-indigo-950">{inventory.originMarkingCoverage.targetsWithMethod.toLocaleString("ko-KR")}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-indigo-700">표시방법 미연결</p>
                <p className={inventory.originMarkingCoverage.targetsMissingMethod ? "text-lg font-semibold text-amber-800" : "text-lg font-semibold text-indigo-950"}>
                  {inventory.originMarkingCoverage.targetsMissingMethod.toLocaleString("ko-KR")}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-indigo-700">점검 상태</p>
                <p className="text-sm font-semibold text-indigo-950">{inventory.originMarkingCoverage.targetsMissingMethod ? "보완 필요" : "사용 가능"}</p>
              </div>
            </div>
            {inventory.originMarkingCoverage.missingMethodPatterns.length ? (
              <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                <p className="font-semibold">표시방법 미연결 HS 패턴</p>
                <p className="mt-1 font-mono text-xs leading-5">
                  {inventory.originMarkingCoverage.missingMethodPatterns.join(", ")}
                </p>
              </div>
            ) : null}
          </div>

          <div className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-emerald-950">수입요건 상세 playbook 커버리지</p>
                <p className="mt-1 text-xs text-emerald-800">
                  세관장확인 수입요건 조합과 법령 상세 playbook 연결 상태를 점검합니다.
                </p>
              </div>
              <Badge tone={coverageTone(inventory.requirementPlaybookCoverage.missingPlaybook, inventory.requirementPlaybookCoverage.invalidSourceUrls.length)}>
                연결률 {inventory.requirementPlaybookCoverage.coverageRate}%
              </Badge>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-5">
              <div>
                <p className="text-xs font-medium text-emerald-700">전체 요건 조합</p>
                <p className="text-lg font-semibold text-emerald-950">{inventory.requirementPlaybookCoverage.totalRequirementPairs.toLocaleString("ko-KR")}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-emerald-700">상세 연결</p>
                <p className="text-lg font-semibold text-emerald-950">{inventory.requirementPlaybookCoverage.withPlaybook.toLocaleString("ko-KR")}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-emerald-700">미연결</p>
                <p className={inventory.requirementPlaybookCoverage.missingPlaybook ? "text-lg font-semibold text-amber-800" : "text-lg font-semibold text-emerald-950"}>
                  {inventory.requirementPlaybookCoverage.missingPlaybook.toLocaleString("ko-KR")}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-emerald-700">URL 점검</p>
                <p className={inventory.requirementPlaybookCoverage.invalidSourceUrls.length ? "text-lg font-semibold text-amber-800" : "text-lg font-semibold text-emerald-950"}>
                  {inventory.requirementPlaybookCoverage.invalidSourceUrls.length.toLocaleString("ko-KR")}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-emerald-700">오래된 항목</p>
                <p className={inventory.requirementPlaybookCoverage.stalePlaybooks.length ? "text-lg font-semibold text-amber-800" : "text-lg font-semibold text-emerald-950"}>
                  {inventory.requirementPlaybookCoverage.stalePlaybooks.length.toLocaleString("ko-KR")}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              <div className="rounded-md border border-emerald-200 bg-white p-3">
                <p className="text-xs font-semibold text-slate-500">source_version별 playbook</p>
                <div className="mt-2 grid gap-2">
                  {inventory.requirementPlaybookCoverage.sourceVersions.map((source) => (
                    <div className="flex items-center justify-between gap-3 rounded border border-slate-100 px-2 py-1.5" key={source.sourceVersion}>
                      <span className="font-mono text-xs text-slate-700">{source.sourceVersion}</span>
                      <span className="text-sm font-semibold text-slate-950">{source.rowCount.toLocaleString("ko-KR")}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-md border border-emerald-200 bg-white p-3">
                <p className="text-xs font-semibold text-slate-500">미연결 요건</p>
                {inventory.requirementPlaybookCoverage.missingRequirements.length ? (
                  <div className="mt-2 grid gap-2">
                    {inventory.requirementPlaybookCoverage.missingRequirements.slice(0, 8).map((requirement) => (
                      <div className="rounded border border-slate-100 px-2 py-1.5" key={`${requirement.requirementDocumentName}-${requirement.relatedLaw}`}>
                        <p className="text-sm font-semibold text-slate-950">{requirement.requirementDocumentName}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{requirement.relatedLaw} / {requirement.rowCount.toLocaleString("ko-KR")}건</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 rounded border border-emerald-100 bg-emerald-50 px-2 py-2 text-sm font-medium text-emerald-800">현재 미연결 요건이 없습니다.</p>
                )}
              </div>
            </div>

            {inventory.requirementPlaybookCoverage.invalidSourceUrls.length || inventory.requirementPlaybookCoverage.stalePlaybooks.length ? (
              <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                <p className="font-semibold">점검 필요</p>
                {inventory.requirementPlaybookCoverage.invalidSourceUrls.length ? (
                  <p className="mt-1">국가법령정보센터 법령 URL 형식이 아닌 playbook이 있습니다.</p>
                ) : null}
                {inventory.requirementPlaybookCoverage.stalePlaybooks.length ? (
                  <p className="mt-1">최근 수집일이 180일을 넘은 playbook이 있습니다.</p>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-5">
            {inventory.summary.groupSummaries.map((group) => (
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3" key={group.groupKey}>
                <p className="text-xs font-semibold text-slate-500">{group.label}</p>
                <p className="mt-1 text-lg font-semibold text-slate-950">{group.totalRows.toLocaleString("ko-KR")}</p>
                <p className="mt-1 text-xs text-slate-500">
                  source {group.itemCount}개 / staged {group.stagedCount} / published {group.publishedCount}
                </p>
                {group.warningCount || group.dangerCount ? (
                  <p className="mt-1 text-xs text-amber-700">
                    확인 {group.warningCount} / 적재문제 {group.dangerCount}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[920px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 pr-4 font-semibold">테이블</th>
                  <th className="py-2 pr-4 font-semibold">원천</th>
                  <th className="py-2 pr-4 font-semibold">source_version</th>
                  <th className="py-2 pr-4 font-semibold">상태</th>
                  <th className="py-2 pr-4 font-semibold">진단</th>
                  <th className="py-2 pr-4 font-semibold">행 수</th>
                  <th className="py-2 pr-4 font-semibold">최근 수집</th>
                  <th className="py-2 pr-4 font-semibold">게시시각</th>
                </tr>
              </thead>
              <tbody>
                {inventory.items.map((item) => (
                  <tr className="border-b border-slate-100 align-top" key={`${item.targetTable}-${item.sourceVersion}-${item.status}`}>
                    <td className="py-3 pr-4 font-medium text-slate-900">{item.targetTable}</td>
                    <td className="py-3 pr-4 text-slate-700">{item.sourceName}</td>
                    <td className="py-3 pr-4 font-mono text-xs text-slate-600">{item.sourceVersion}</td>
                    <td className="py-3 pr-4"><Badge tone={sourceStatusTone(item.status)}>{item.status}</Badge></td>
                    <td className="py-3 pr-4">
                      <div className="flex flex-wrap gap-1.5">
                        {item.diagnostics.map((diagnostic) => (
                          <span title={diagnostic.message} key={`${item.targetTable}-${item.sourceVersion}-${diagnostic.label}`}>
                            <Badge tone={sourceDiagnosticTone(diagnostic.severity)}>{diagnostic.label}</Badge>
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-slate-700">{item.rowCount.toLocaleString("ko-KR")}</td>
                    <td className="py-3 pr-4 text-slate-700">{item.latestRetrievedAt ?? "-"}</td>
                    <td className="py-3 pr-4 text-slate-700">{item.latestPublishedAt ?? "게시 전"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="자료 업데이트 실행 체크리스트"
          description="연도 변경 또는 공식자료 갱신 시 다시 실행할 수 있도록 원천, 스크립트, 검증 항목을 묶어 표시합니다."
          action={<Badge tone="info">update runbook</Badge>}
        />
        <CardBody>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 pr-4 font-semibold">대상</th>
                  <th className="py-2 pr-4 font-semibold">원천</th>
                  <th className="py-2 pr-4 font-semibold">실행</th>
                  <th className="py-2 pr-4 font-semibold">검증</th>
                </tr>
              </thead>
              <tbody>
                {updateRunbook.map((item) => (
                  <tr className="border-b border-slate-100 align-top" key={item.target}>
                    <td className="py-3 pr-4 font-semibold text-slate-950">{item.target}</td>
                    <td className="py-3 pr-4 text-slate-700">{item.source}</td>
                    <td className="py-3 pr-4 font-mono text-xs text-slate-700">{item.command}</td>
                    <td className="py-3 pr-4 text-slate-700">{item.check}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardBody>
            <p className="text-sm font-medium text-slate-600">검토 대기 변경</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{dashboard.summary.pendingCount}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm font-medium text-slate-600">게시 차단</p>
            <p className="mt-2 text-3xl font-semibold text-amber-700">{dashboard.summary.blockedCount}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm font-medium text-slate-600">Critical</p>
            <p className="mt-2 text-3xl font-semibold text-red-700">{dashboard.summary.criticalCount}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm font-medium text-slate-600">영향 리포트</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{dashboard.summary.impactedReportCount}</p>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="최근 원천 수집"
          description="각 원천은 checksum과 source_version으로 추적합니다. 실제 게시 전에는 snapshot diff와 담당자 검토가 필요합니다."
          action={<Badge tone="info">source snapshot</Badge>}
        />
        <CardBody>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 pr-4 font-semibold">원천</th>
                  <th className="py-2 pr-4 font-semibold">유형</th>
                  <th className="py-2 pr-4 font-semibold">버전</th>
                  <th className="py-2 pr-4 font-semibold">수집시각</th>
                  <th className="py-2 pr-4 font-semibold">상태</th>
                  <th className="py-2 pr-4 font-semibold">Checksum</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.lastSuccessfulFetches.map((snapshot) => (
                  <tr className="border-b border-slate-100" key={snapshot.sourceVersion}>
                    <td className="py-3 pr-4 font-medium text-slate-900">{snapshot.sourceName}</td>
                    <td className="py-3 pr-4 text-slate-700">{snapshot.sourceType}</td>
                    <td className="py-3 pr-4 text-slate-700">{snapshot.sourceVersion}</td>
                    <td className="py-3 pr-4 text-slate-700">{snapshot.retrievedAt}</td>
                    <td className="py-3 pr-4"><Badge tone={snapshot.status === "published" ? "success" : "warning"}>{snapshot.status}</Badge></td>
                    <td className="py-3 pr-4 font-mono text-xs text-slate-500">{snapshot.checksum}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="변경 검토 큐"
          description="medium/high/critical 변경은 담당자 승인 전 published 전환을 차단합니다."
          action={<Badge tone="warning">staff review required</Badge>}
        />
        <CardBody className="grid gap-3">
          {dashboard.pendingChanges.map((change) => (
            <article className="rounded-lg border border-slate-200 p-4" key={change.id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-md bg-amber-50 text-amber-700">
                    <AlertTriangle aria-hidden="true" size={20} />
                  </span>
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge tone={riskTone(change.riskLevel)}>{change.riskLevel}</Badge>
                      <Badge tone="neutral">{change.changeType}</Badge>
                      <Badge tone="warning">{reviewText(change.reviewStatus)}</Badge>
                    </div>
                    <h2 className="mt-3 font-semibold text-slate-950">{change.impactArea}</h2>
                    <p className="mt-1 text-sm text-slate-600">
                      {change.hskCode ?? "HSK 미지정"} / 시행일 {change.effectiveFrom}
                    </p>
                  </div>
                </div>
                <div className="text-sm font-medium text-amber-800">
                  {dashboard.blockedPublishChanges.some((blocked) => blocked.id === change.id) ? "게시 차단" : "자동 게시 가능 후보"}
                </div>
              </div>
              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                <div className="rounded-md bg-slate-50 p-3">
                  <p className="text-xs font-semibold text-slate-500">이전 값</p>
                  <p className="mt-1 text-sm text-slate-700">{change.oldValue}</p>
                </div>
                <div className="rounded-md bg-slate-50 p-3">
                  <p className="text-xs font-semibold text-slate-500">신규 값</p>
                  <p className="mt-1 text-sm text-slate-700">{change.newValue}</p>
                </div>
              </div>
            </article>
          ))}
        </CardBody>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="승인된 변경" description="승인 후 publish job이 source/version을 전환하는 대상입니다." action={<CheckCircle2 aria-hidden="true" className="text-emerald-600" size={20} />} />
          <CardBody className="grid gap-3">
            {dashboard.approvedChanges.map((change) => (
              <div className="rounded-md border border-slate-200 p-3" key={change.id}>
                <div className="flex flex-wrap gap-2">
                  <Badge tone={riskTone(change.riskLevel)}>{change.riskLevel}</Badge>
                  <Badge tone="success">{reviewText(change.reviewStatus)}</Badge>
                </div>
                <p className="mt-2 text-sm font-medium text-slate-950">{change.impactArea}</p>
                <p className="mt-1 text-sm text-slate-600">{change.oldValue} → {change.newValue}</p>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="영향 리포트" description="게시 후 변경된 원천이 과거 보고서에 영향을 줄 수 있는 큐입니다." action={<FileWarning aria-hidden="true" className="text-amber-600" size={20} />} />
          <CardBody className="grid gap-3">
            {dashboard.impactedReports.map((report) => (
              <div className="rounded-md border border-slate-200 p-3" key={report.id}>
                <div className="flex flex-wrap gap-2">
                  <Badge tone="warning">{report.status}</Badge>
                  <Badge tone="neutral">{report.reportType}</Badge>
                </div>
                <p className="mt-2 text-sm font-medium text-slate-950">{report.id}</p>
                <p className="mt-1 text-sm text-slate-600">
                  HSK {report.hskCode} / 생성일 {report.generatedAt} / 기준일 {report.basisDate}
                </p>
                <p className="mt-1 text-sm text-slate-700">{report.reason}</p>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Pipeline 상태" description="Phase 6의 실제 fetch/parser/publish job은 아직 연결 전입니다." action={<Clock aria-hidden="true" className="text-blue-700" size={20} />} />
        <CardBody>
          <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {["Fetch", "Checksum", "Parse/Staging", "Diff", "Review", "Publish", "Invalidate", "Report Impact"].map((step, index) => (
              <li className="rounded-md border border-slate-200 p-3" key={step}>
                <span className="text-xs font-semibold text-blue-700">STEP {index + 1}</span>
                <p className="mt-1 text-sm font-medium text-slate-950">{step}</p>
              </li>
            ))}
          </ol>
          <SourceFooter sourceName="legal_source_snapshots / legal_change_events" sourceVersion="mock-update-engine-2026" />
        </CardBody>
      </Card>
    </div>
  );
}
