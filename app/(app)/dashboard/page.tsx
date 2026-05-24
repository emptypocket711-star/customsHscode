import Link from "next/link";
import { ArrowRight, Calculator, FileSearch, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeading } from "@/components/page-heading";
import { SourceFooter } from "@/components/ui/source-footer";
import { destinationCountryOptions } from "@/features/export-diagnosis/country-options";
import { getSeoulDateString } from "@/lib/utils";
import { loadDashboardStats } from "@/server/rules/dashboard-metrics.service";

const workflows = [
  { href: "/hs/direct", title: "통합 조회", icon: FileSearch, note: "HS CODE 또는 품명으로 품목번호, 관세율, 수입요건, 수출상대국 관세율 확인" },
  { href: "/duty-estimator", title: "예상 납세액 계산", icon: Calculator, note: "물품가격, 환율, 관세율, 내국세율을 입력해 관세·부가세 계산" }
];

export default async function DashboardPage() {
  const basisDate = getSeoulDateString();
  const stats = await loadDashboardStats(basisDate);

  return (
    <>
      <PageHeading
        title="통관이음 AI"
        description="HS CODE, 품명, 국가 정보를 기준으로 관세율과 수출입요건을 조회합니다."
      >
        <Link className="focus-ring rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800" href="/hs/direct">
          상세 조회
        </Link>
      </PageHeading>

      <Card>
        <CardBody>
          <form action="/hs/direct" className="grid gap-3 lg:grid-cols-[minmax(240px,1fr)_120px_minmax(220px,280px)_auto]" method="get">
            <input defaultValue={basisDate} name="basisDate" type="hidden" />
            <label className="grid min-w-0 gap-1 text-sm font-medium text-slate-700">
              HS CODE 또는 품명
              <input
                className="focus-ring w-full min-w-0 rounded-md border border-slate-300 px-3 py-3 text-base"
                name="query"
                placeholder="예: 3401.30-0000 또는 입술화장품"
                type="text"
              />
            </label>
            <label className="grid min-w-0 gap-1 text-sm font-medium text-slate-700">
              구분
              <select className="focus-ring w-full min-w-0 rounded-md border border-slate-300 bg-white px-3 py-3 text-base" defaultValue="import" name="direction">
                <option value="import">수입</option>
                <option value="export">수출</option>
              </select>
            </label>
            <label className="grid min-w-0 gap-1 text-sm font-medium text-slate-700">
              수입국가/목적국
              <select className="focus-ring w-full min-w-0 rounded-md border border-slate-300 bg-white px-3 py-3 text-base" defaultValue="ALL" name="destinationCountry">
                {destinationCountryOptions.map((country) => (
                  <option key={country.code} value={country.code}>{country.label}</option>
                ))}
              </select>
            </label>
            <button className="focus-ring inline-flex items-center justify-center gap-2 self-end rounded-md bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800" type="submit">
              <Search aria-hidden="true" size={18} />
              조회
            </button>
          </form>
        </CardBody>
      </Card>

      <div className="mt-5 grid gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardBody>
              <p className="text-sm font-medium text-slate-600">{stat.label}</p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">{stat.value}</p>
              <p className="mt-1 text-xs text-slate-500">{stat.note}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader title="조회 메뉴" description="조회 유형을 선택하세요." />
          <CardBody className="grid gap-3">
            {workflows.map((workflow) => {
              const Icon = workflow.icon;
              return (
                <Link className="focus-ring flex items-center gap-4 rounded-lg border border-slate-200 p-4 hover:bg-slate-50" href={workflow.href} key={workflow.href}>
                  <span className="grid size-11 shrink-0 place-items-center rounded-md bg-slate-100 text-blue-700">
                    <Icon aria-hidden="true" size={22} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-slate-950">{workflow.title}</span>
                    <span className="block text-sm text-slate-600">{workflow.note}</span>
                  </span>
                  <ArrowRight aria-hidden="true" className="text-slate-400" size={18} />
                </Link>
              );
            })}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="데이터 기준" description="조회 화면에 함께 표시되는 기준 정보입니다." />
          <CardBody>
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-md bg-blue-50 text-blue-700">
                <FileSearch aria-hidden="true" size={22} />
              </span>
              <div>
                <Badge tone="info">조회기준일</Badge>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  HS CODE, 관세율, FTA, 수출입요건은 기준일과 출처 버전별로 표시됩니다.
                </p>
              </div>
            </div>
            <SourceFooter />
          </CardBody>
        </Card>
      </div>
    </>
  );
}
