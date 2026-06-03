import Link from "next/link";
import { ArrowRight, FileText, ListChecks, Ship } from "lucide-react";
import { PageHeading } from "@/components/page-heading";
import { Badge } from "@/components/ui/badge";

const requestEntrypoints = [
  {
    description: "출발·도착 국가, 운송 방식, 품명 요약을 초안으로 저장하고 포워더 견적 요청으로 이어갑니다.",
    href: "/requests/freight",
    icon: Ship,
    label: "운송 견적",
    outcome: "포워더 견적 비교, 업체 선정, 진행 완료 관리",
    preparation: "출발지, 도착지, 운송 방식, CI·PL 등 운송 서류",
    title: "운송 견적 요청"
  },
  {
    description: "HS, FTA, 요건 확인 범위를 정리하고 관세사무소 통관 견적 요청으로 이어갑니다.",
    href: "/requests/clearance",
    icon: FileText,
    label: "통관 의뢰",
    outcome: "관세사무소 견적 비교, 신고 진행, 완료 리포트 확인",
    preparation: "품목 정보, HSK 또는 HS6, 원산지·선적국, 통관 서류",
    title: "통관 의뢰 요청"
  }
];

export default function RequestsPage() {
  return (
    <div className="grid gap-5">
      <PageHeading
        title="요청 시작"
        description="운송 견적과 통관 의뢰는 처리하는 파트너와 필요한 정보가 다릅니다. 먼저 맞는 요청을 선택하고, 초안 저장 후 서류와 공개 조건을 보완해 검증 파트너에게 공개합니다."
      />
      <section className="grid gap-4 md:grid-cols-2">
        {requestEntrypoints.map((entry) => {
          const Icon = entry.icon;

          return (
            <Link
              className="focus-ring group grid min-h-44 gap-4 rounded-lg border border-[var(--border-subtle)] bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md"
              data-navigation-progress={entry.title}
              href={entry.href}
              key={entry.href}
            >
              <span className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-3">
                  <span className="grid size-11 place-items-center rounded-md bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                    <Icon aria-hidden="true" size={20} />
                  </span>
                  <span>
                    <span className="block text-xs font-semibold text-blue-700">{entry.label}</span>
                    <span className="mt-1 block text-lg font-semibold text-[var(--text-primary)]">{entry.title}</span>
                  </span>
                </span>
                <ArrowRight aria-hidden="true" className="text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-blue-700" size={20} />
              </span>
              <span className="text-sm leading-6 text-[var(--text-secondary)]">{entry.description}</span>
              <span className="grid gap-2 text-xs leading-5 text-slate-600">
                <span className="rounded-md bg-slate-50 px-3 py-2">
                  <span className="font-semibold text-slate-900">먼저 준비</span>
                  <span className="mt-1 block">{entry.preparation}</span>
                </span>
                <span className="rounded-md bg-slate-50 px-3 py-2">
                  <span className="font-semibold text-slate-900">이후 결과</span>
                  <span className="mt-1 block">{entry.outcome}</span>
                </span>
              </span>
              <span className="flex justify-end">
                <Badge tone="info">초안 저장 후 공개</Badge>
              </span>
            </Link>
          );
        })}
      </section>
      <section className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="flex min-w-0 gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-md bg-white text-slate-700 ring-1 ring-slate-200">
              <ListChecks aria-hidden="true" size={19} />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-slate-950">이미 저장한 요청 확인</span>
              <span className="mt-1 block text-xs leading-5 text-slate-600">
                초안, 공개, 입찰, 선정, 완료 상태는 각 요청 관리 화면에서 이어서 처리합니다.
              </span>
            </span>
          </span>
          <span className="flex flex-wrap gap-2">
            <Link className="focus-ring inline-flex h-9 items-center rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50" href="/requests/freight?workspace=requester">
              내 운송 요청
            </Link>
            <Link className="focus-ring inline-flex h-9 items-center rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50" href="/requests/clearance?workspace=requester">
              내 통관 의뢰
            </Link>
          </span>
        </div>
      </section>
    </div>
  );
}
