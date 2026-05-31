import { CreditCard, FileCheck2, ReceiptText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { getBillingDashboard } from "@/server/rules/billing.service";

function formatKrw(value: number) {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0
  }).format(value);
}

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
          title="현재 구독"
          description="케이스, 리포트 생성량, 일괄 조회 사용량을 표시합니다. 결제 상태는 예비진단 결과와 분리됩니다."
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
              <p className="mt-4 text-2xl font-semibold text-slate-950">{formatKrw(dashboard.currentPlan.monthlyPriceKrw)}</p>
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

      <div className="grid gap-4 lg:grid-cols-3">
        {dashboard.plans.map((plan) => (
          <Card className={plan.id === dashboard.currentPlan.id ? "border-blue-300" : undefined} key={plan.id}>
            <CardHeader
              title={plan.name}
              description={plan.recommendedFor}
              action={plan.id === dashboard.currentPlan.id ? <Badge tone="success">현재 플랜</Badge> : <Badge tone="neutral">선택 가능</Badge>}
            />
            <CardBody>
              <p className="text-2xl font-semibold text-slate-950">{formatKrw(plan.monthlyPriceKrw)}</p>
              <dl className="mt-4 grid gap-2 text-sm">
                <div className="flex justify-between gap-3"><dt className="text-slate-500">케이스</dt><dd className="font-medium">{plan.caseLimit}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-slate-500">리포트</dt><dd className="font-medium">{plan.reportCredits}</dd></div>
              </dl>
              <ul className="mt-4 grid gap-2">
                {plan.features.map((feature) => (
                  <li className="flex items-start gap-2 text-sm text-slate-700" key={feature}>
                    <FileCheck2 aria-hidden="true" className="mt-0.5 shrink-0 text-blue-700" size={16} />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader title="사용량 정책" description="사용량 한도는 서비스 이용 범위 관리용이며 법률적 확정이나 승인 우회를 의미하지 않습니다." />
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

        <Card>
          <CardHeader title="Checkout Intent" action={<ReceiptText aria-hidden="true" className="text-slate-500" size={18} />} />
          <CardBody>
            {dashboard.checkoutIntent ? (
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between gap-3"><span className="text-slate-500">ID</span><span className="font-medium">{dashboard.checkoutIntent.id}</span></div>
                <div className="flex justify-between gap-3"><span className="text-slate-500">상태</span><Badge tone="warning">{dashboard.checkoutIntent.status}</Badge></div>
                <div className="flex justify-between gap-3"><span className="text-slate-500">금액</span><span className="font-medium">{formatKrw(dashboard.checkoutIntent.amountKrw)}</span></div>
                <p className="mt-3 rounded-md bg-slate-50 p-3 leading-6 text-slate-700">{dashboard.checkoutIntent.note}</p>
              </div>
            ) : (
              <p className="text-sm text-slate-600">진행 중인 결제 intent가 없습니다.</p>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
