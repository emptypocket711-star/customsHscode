import { FileDown, LockKeyhole, Stamp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import type { MockReport } from "@/features/reports/mock-report-data";
import { formatHsCode } from "@/lib/hs-code";
import type { ReportPreviewDictionary } from "@/lib/i18n";

function approvalLabel(status: MockReport["approval"]["status"], dictionary: ReportPreviewDictionary) {
  if (status === "approved") return dictionary.approval.approved;
  if (status === "published") return dictionary.approval.published;
  if (status === "pending_review") return dictionary.approval.pendingReview;
  return dictionary.approval.draft;
}

function statusTone(status: string): "warning" | "info" | "neutral" | "success" {
  if (status.includes("검토") || status.includes("내부 확인") || status === "추가 확인 필요") return "warning";
  if (status === "가능성 있음") return "info";
  if (status === "예비진단") return "neutral";
  return "success";
}

export function ReportPreview({ dictionary, report }: { dictionary: ReportPreviewDictionary; report: MockReport }) {
  return (
    <div className="grid gap-5">
      <Card className="print:border-0 print:shadow-none">
        <CardBody>
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap gap-2">
                <Badge tone="warning">{dictionary.labels.autoPreliminary}</Badge>
                <Badge tone={report.reportType === "import" ? "info" : "neutral"}>{report.reportType === "import" ? dictionary.labels.import : dictionary.labels.export}</Badge>
              </div>
              <h1 className="mt-4 text-2xl font-semibold text-slate-950">{report.title}</h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">{report.companyName} / {dictionary.labels.requestId} {report.requestId}</p>
            </div>
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <div className="flex items-center gap-2 font-semibold">
                <Stamp aria-hidden="true" size={18} />
                {approvalLabel(report.approval.status, dictionary)}
              </div>
              <p className="mt-1">{dictionary.approval.reviewer}: {report.approval.reviewerName ?? dictionary.approval.unassigned}</p>
              <p>{dictionary.approval.reviewedAt}: {report.approval.reviewedAt ?? dictionary.approval.unreviewed}</p>
            </div>
          </div>

          <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-4">
            <div className="rounded-md bg-slate-50 p-3"><dt className="font-semibold text-slate-500">{dictionary.labels.basisDate}</dt><dd className="mt-1 text-slate-900">{report.basisDate}</dd></div>
            <div className="rounded-md bg-slate-50 p-3"><dt className="font-semibold text-slate-500">{dictionary.labels.generatedAt}</dt><dd className="mt-1 text-slate-900">{report.generatedAt}</dd></div>
            <div className="rounded-md bg-slate-50 p-3"><dt className="font-semibold text-slate-500">HSK</dt><dd className="mt-1 text-slate-900">{formatHsCode(report.hskCode)}</dd></div>
            <div className="rounded-md bg-slate-50 p-3"><dt className="font-semibold text-slate-500">HS6</dt><dd className="mt-1 text-slate-900">{formatHsCode(report.hs6)}</dd></div>
          </dl>

          <section className="mt-5 rounded-lg border border-slate-200 p-4">
            <h2 className="font-semibold text-slate-950">{report.productName}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">{report.customerSummary}</p>
          </section>
        </CardBody>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="grid gap-5">
          {report.sections.map((section) => (
            <Card className="print:border-slate-300 print:shadow-none" key={section.title}>
              <CardHeader title={section.title} action={<Badge tone={statusTone(section.status)}>{section.status}</Badge>} />
              <CardBody>
                <ul className="grid gap-2">
                  {section.items.map((item) => (
                    <li className="rounded-md border border-slate-200 px-3 py-2 text-sm leading-6 text-slate-700" key={item}>{item}</li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          ))}
        </div>

        <aside className="grid gap-5 self-start">
          <Card>
            <CardHeader title={dictionary.sections.sourceLocksTitle} description={dictionary.sections.sourceLocksDescription} action={<LockKeyhole aria-hidden="true" className="text-blue-700" size={18} />} />
            <CardBody className="grid gap-3">
              {report.sourceLocks.map((lock) => (
                <div className="rounded-md border border-slate-200 p-3" key={lock.id}>
                  <p className="text-sm font-semibold text-slate-950">{lock.sourceName}</p>
                  <p className="mt-1 text-xs text-slate-500">{lock.sourceVersion}</p>
                  <p className="mt-1 text-xs text-slate-500">snapshot: {lock.sourceSnapshotId}</p>
                  <p className="mt-1 text-xs text-slate-500">rule: {lock.ruleVersionId}</p>
                </div>
              ))}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={dictionary.sections.staffNotes} />
            <CardBody>
              <ul className="grid gap-2">
                {report.approval.staffNotes.map((note) => (
                  <li className="rounded-md bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-900" key={note}>{note}</li>
                ))}
              </ul>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={dictionary.sections.pdfTitle} action={<FileDown aria-hidden="true" className="text-slate-500" size={18} />} />
            <CardBody>
              <p className="text-sm leading-6 text-slate-700">{dictionary.sections.pdfDescription}</p>
            </CardBody>
          </Card>
        </aside>
      </div>

      <Card className="print:border-slate-300 print:shadow-none">
        <CardHeader title={dictionary.sections.disclaimer} />
        <CardBody>
          <p className="text-sm leading-6 text-slate-700">{report.disclaimer}</p>
        </CardBody>
      </Card>
    </div>
  );
}
