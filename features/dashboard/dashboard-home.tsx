import Link from "next/link";
import {
  ArrowRight,
  Calculator,
  ClipboardList,
  FileSearch,
  Globe2,
  Layers3,
  Search,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SourceFooter } from "@/components/ui/source-footer";
import { destinationCountryOptions } from "@/features/export-diagnosis/country-options";

type DashboardStat = {
  label: string;
  value: string;
  note: string;
};

const workflowLinks = [
  {
    href: "/hs/direct",
    title: "통합 조회",
    description: "HS CODE, 품명, 관세율, 수출입요건을 한 화면에서 비교",
    icon: FileSearch,
    tone: "blue"
  },
  {
    href: "/hs/overseas",
    title: "해외 HS CODE조회",
    description: "목적국 기준 품목번호, 관세율, 내국세, 수입요건 확인",
    icon: Globe2,
    tone: "emerald"
  },
  {
    href: "/duty-estimator",
    title: "예상 납세액 계산",
    description: "HS CODE 10자리 기준 관세·부가세 계산 흐름",
    icon: Calculator,
    tone: "slate"
  }
];

const quickExamples = [
  { label: "3401.30-0000", href: "/hs/direct?query=3401.30-0000&direction=import&destinationCountry=ALL" },
  { label: "작업용 조끼", href: "/hs/direct?query=%EC%9E%91%EC%97%85%EC%9A%A9%20%EC%A1%B0%EB%81%BC&direction=import&destinationCountry=ALL" },
  { label: "graceday hand cream", href: "/hs/direct?query=graceday%20hand%20cream&direction=import&destinationCountry=ALL" }
];

const comparisonSteps = [
  { title: "후보 정리", body: "품명·모델명·오타·HS 힌트를 AI가 4자리/6자리 후보로 정규화합니다." },
  { title: "세율 비교", body: "기본·WTO·FTA·목적국 세율을 국가 선택 기준으로 좁혀 보여줍니다." },
  { title: "요건 확인", body: "세관장확인, 수출요건, 기관별 요건을 품목번호 기준으로 연결합니다." }
];

function toneClass(tone: string) {
  if (tone === "emerald") return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  if (tone === "blue") return "bg-blue-50 text-blue-700 ring-blue-100";
  return "bg-slate-100 text-slate-700 ring-slate-200";
}

export function DashboardHome({ basisDate, stats }: { basisDate: string; stats: DashboardStat[] }) {
  return (
    <div className="grid gap-5">
      <section className="overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] shadow-[var(--shadow-panel)]">
        <div className="border-b border-[var(--border-subtle)] bg-[var(--surface-raised)] px-4 py-3 sm:px-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="info">2026년형 전문 관세 SaaS</Badge>
                <span className="text-xs font-medium text-[var(--text-muted)]">기준일 {basisDate}</span>
              </div>
              <h1 className="mt-3 text-2xl font-semibold tracking-normal text-[var(--text-primary)] sm:text-3xl">
                통관이음 AI
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">
                HS CODE, 품명, 국가 정보를 기준으로 관세율과 수출입요건을 빠르게 조회하고 비교합니다.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 rounded-md border border-[var(--border-subtle)] bg-white p-2 text-center shadow-sm sm:min-w-[360px]">
              <MiniMetric label="조회 기준" value="HS/품명" />
              <MiniMetric label="국가 기준" value="수입·수출" />
              <MiniMetric label="결과 형태" value="비교형" />
            </div>
          </div>
        </div>

        <div className="grid gap-5 p-4 sm:p-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <form action="/hs/direct" className="grid gap-4" method="get">
            <input defaultValue={basisDate} name="basisDate" type="hidden" />
            <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_180px_220px_auto]">
              <label className="grid min-w-0 gap-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">HS CODE 또는 품명</span>
                <div className="relative">
                  <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    className="focus-ring h-12 w-full rounded-md border border-[var(--border-strong)] bg-white pl-10 pr-3 text-base font-medium text-[var(--text-primary)] shadow-sm placeholder:text-slate-400"
                    name="query"
                    placeholder="예: 3304.99-1000, mushroom powder, 레이니 키보드"
                    type="text"
                  />
                </div>
              </label>
              <label className="grid min-w-0 gap-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">조회 구분</span>
                <select className="focus-ring h-12 w-full rounded-md border border-[var(--border-strong)] bg-white px-3 text-base font-semibold text-[var(--text-primary)] shadow-sm" defaultValue="import" name="direction">
                  <option value="import">수입</option>
                  <option value="export">수출</option>
                </select>
              </label>
              <label className="grid min-w-0 gap-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">수입국가/목적국</span>
                <select className="focus-ring h-12 w-full rounded-md border border-[var(--border-strong)] bg-white px-3 text-base font-semibold text-[var(--text-primary)] shadow-sm" defaultValue="ALL" name="destinationCountry">
                  {destinationCountryOptions.map((country) => (
                    <option key={country.code} value={country.code}>{country.label}</option>
                  ))}
                </select>
              </label>
              <button className="focus-ring inline-flex h-12 items-center justify-center gap-2 self-end rounded-md bg-[var(--brand-solid)] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--brand-solid-hover)]" type="submit">
                <Search aria-hidden="true" size={18} />
                조회
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-[var(--text-muted)]">빠른 테스트</span>
              {quickExamples.map((item) => (
                <Link className="focus-ring rounded-full border border-[var(--border-subtle)] bg-[var(--surface-muted)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800" href={item.href} key={item.href}>
                  {item.label}
                </Link>
              ))}
            </div>
          </form>

          <aside className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-4">
            <div className="flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-md bg-white text-blue-700 shadow-sm">
                <Sparkles aria-hidden="true" size={18} />
              </span>
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">품명 검색 보조</p>
                <p className="text-xs text-[var(--text-muted)]">오타·제품코드·외국어 품명 후보화</p>
              </div>
            </div>
            <div className="mt-4 grid gap-2 text-xs leading-5 text-[var(--text-secondary)]">
              <p className="rounded-md bg-white p-3 shadow-sm">검색어가 불명확하면 후보 HS와 보완 질문을 함께 표시합니다.</p>
              <p className="rounded-md bg-white p-3 shadow-sm">HS 10자리 확정 전에는 4자리·6자리 경로를 먼저 비교합니다.</p>
            </div>
          </aside>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] p-4 shadow-[var(--shadow-panel)]" key={stat.label}>
            <p className="text-xs font-semibold text-[var(--text-muted)]">{stat.label}</p>
            <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{stat.value}</p>
            <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">{stat.note}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] shadow-[var(--shadow-panel)]">
          <div className="border-b border-[var(--border-subtle)] px-5 py-4">
            <div className="flex items-center gap-2">
              <Layers3 aria-hidden="true" className="text-blue-700" size={18} />
              <h2 className="text-base font-semibold text-[var(--text-primary)]">업무 진입</h2>
            </div>
          </div>
          <div className="grid gap-3 p-4 lg:grid-cols-3">
            {workflowLinks.map((workflow) => {
              const Icon = workflow.icon;
              return (
                <Link className="focus-ring group grid min-h-[148px] gap-3 rounded-lg border border-[var(--border-subtle)] bg-white p-4 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md" href={workflow.href} key={workflow.href}>
                  <span className={`grid size-10 place-items-center rounded-md ring-1 ${toneClass(workflow.tone)}`}>
                    <Icon aria-hidden="true" size={19} />
                  </span>
                  <span>
                    <span className="block font-semibold text-[var(--text-primary)]">{workflow.title}</span>
                    <span className="mt-1 block text-sm leading-5 text-[var(--text-secondary)]">{workflow.description}</span>
                  </span>
                  <span className="mt-auto inline-flex items-center gap-1 text-xs font-semibold text-blue-700">
                    열기
                    <ArrowRight aria-hidden="true" className="transition group-hover:translate-x-0.5" size={14} />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] shadow-[var(--shadow-panel)]">
          <div className="border-b border-[var(--border-subtle)] px-5 py-4">
            <div className="flex items-center gap-2">
              <ClipboardList aria-hidden="true" className="text-blue-700" size={18} />
              <h2 className="text-base font-semibold text-[var(--text-primary)]">결과 비교 흐름</h2>
            </div>
          </div>
          <div className="grid gap-3 p-4">
            {comparisonSteps.map((step, index) => (
              <div className="grid grid-cols-[32px_1fr] gap-3" key={step.title}>
                <span className="grid size-8 place-items-center rounded-md bg-[var(--surface-muted)] text-xs font-bold text-blue-700">{index + 1}</span>
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{step.title}</p>
                  <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">{step.body}</p>
                </div>
              </div>
            ))}
            <div className="mt-2 rounded-md border border-blue-100 bg-blue-50 p-3">
              <div className="flex items-start gap-2">
                <ShieldCheck aria-hidden="true" className="mt-0.5 shrink-0 text-blue-700" size={16} />
                <p className="text-xs leading-5 text-blue-900">사용자 화면은 조회 정보를 중심으로 표시하고, 판단이 필요한 경우에는 보완 질문과 후보 비교를 제공합니다.</p>
              </div>
            </div>
            <SourceFooter />
          </div>
        </div>
      </section>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-[var(--surface-muted)] px-2 py-2">
      <p className="text-[11px] font-semibold text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-[var(--text-primary)]">{value}</p>
    </div>
  );
}
