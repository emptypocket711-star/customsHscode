import { LockKeyhole } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";

export function AccessDenied({ message }: { message: string }) {
  return (
    <Card>
      <CardHeader title="접근 권한 필요" description="이 화면은 지정된 개발자 계정만 접근할 수 있는 운영 화면입니다." />
      <CardBody>
        <div className="flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 p-4 text-amber-900">
          <LockKeyhole aria-hidden="true" className="mt-0.5 shrink-0" size={20} />
          <p className="text-sm leading-6">{message}</p>
        </div>
      </CardBody>
    </Card>
  );
}
