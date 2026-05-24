import Link from "next/link";
import { ArrowRight, Calculator, Globe2, Search } from "lucide-react";
import { PageHeading } from "@/components/page-heading";
import { Card, CardBody } from "@/components/ui/card";

const entries = [
  { href: "/hs/direct", title: "통합 조회", description: "HS CODE 또는 품명으로 품목번호, 관세율, 수입요건", icon: Search },
  { href: "/diagnosis/export", title: "수출·상대국 세율", description: "목적국 관세율, FTA C/O, 수출요건", icon: Globe2 },
  { href: "/duty-estimator", title: "예상 납세액 계산", description: "물품가격, 환율, 관세율, 내국세 기준 납세액", icon: Calculator }
];

export default function EntryPage() {
  return (
    <>
      <PageHeading
        title="조회 시작"
        description="조회 유형을 선택하세요."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {entries.map((entry) => {
          const Icon = entry.icon;
          return (
            <Link className="focus-ring rounded-lg" href={entry.href} key={entry.href}>
              <Card className="h-full transition hover:border-blue-300 hover:shadow-md">
                <CardBody>
                  <div className="flex items-start gap-4">
                    <span className="grid size-11 shrink-0 place-items-center rounded-md bg-blue-50 text-blue-700">
                      <Icon aria-hidden="true" size={22} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <h2 className="text-lg font-semibold text-slate-950">{entry.title}</h2>
                        <ArrowRight aria-hidden="true" className="text-slate-400" size={18} />
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{entry.description}</p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Link>
          );
        })}
      </div>
    </>
  );
}
