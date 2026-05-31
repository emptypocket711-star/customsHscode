import { CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { getBillingDashboard } from "@/server/rules/billing.service";

function UsageBar({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="text-slate-500">{detail}</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-blue-700" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export function BillingDashboard() {
  const dashboard = getBillingDashboard();

  return (
    <div className="grid gap-5">
      <Card>
        <CardHeader
          title="현재 이용 범위"
          description="케이스와 리포트 생성량 사용 현황만 표시합니다."
          action={<Badge tone="info">{dashboard.subscription.status}</Badge>}
        />
        <CardBody>
          <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
            <div className="rounded-lg border border-slate-200 p-4">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-md bg-blue-50 text-blue-700">
                  <CreditCard aria-hidden="true" size={20} />
                </span>
                <div>
                  <p className="text-sm text-slate-500">{dashboard.subscription.companyName}</p>
                  <h2 className="text-xl font-semibold text-slate-950">{dashboard.currentPlan.name}</h2>
                </div>
              </div>
              <p className="mt-4 text-sm font-semibold text-slate-500">이용 기간</p>
              <p className="mt-1 text-sm text-slate-600">
                {dashboard.subscription.currentPeriodStart} - {dashboard.subscription.currentPeriodEnd}
              </p>
            </div>

            <div className="grid gap-4">
              <UsageBar
                detail={`${dashboard.subscription.usedCases}/${dashboard.currentPlan.caseLimit}`}
                label="케이스 한도"
                value={dashboard.usage.caseUsagePercent}
              />
              <UsageBar
                detail={`${dashboard.subscription.usedReportCredits}/${dashboard.currentPlan.reportCredits}`}
                label="리포트 생성량"
                value={dashboard.usage.reportCreditUsagePercent}
              />
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="사용량 안내" description="사용량 한도는 서비스 이용 범위 관리용이며 법률적 확정이나 승인 우회를 의미하지 않습니다." />
        <CardBody>
          <ul className="grid gap-3">
            {dashboard.policyNotes.map((note) => (
              <li className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-900" key={note}>
                {note}
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
