import { PageHeading } from "@/components/page-heading";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { UsedCarExportTabs } from "@/features/used-car-export/used-car-export-tabs";

const featureRows = [
  {
    title: "제원정보 조회",
    description: "제원관리번호로 자동차 제원 정보를 확인합니다."
  },
  {
    title: "컨테이너 반입 확인",
    description: "컨테이너 번호로 터미널 반입 정보를 확인합니다."
  }
];

export default function UsedCarExportPage() {
  return (
    <div className="grid gap-5">
      <PageHeading
        title="중고차 수출"
        description="중고차 수출 실무에서 자주 확인하는 제원, 컨테이너 반입, 터미널 조회 기능을 모아두는 작업 공간입니다."
      />
      <UsedCarExportTabs />
      <Card>
        <CardHeader title="지원 기능" description="필요한 업무를 선택해서 조회를 시작합니다." />
        <CardBody>
          <div className="grid gap-3 md:grid-cols-2">
            {featureRows.map((row) => (
              <div className="rounded-md border border-slate-200 bg-slate-50 p-4" key={row.title}>
                <p className="text-sm font-semibold text-slate-950">{row.title}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">{row.description}</p>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
