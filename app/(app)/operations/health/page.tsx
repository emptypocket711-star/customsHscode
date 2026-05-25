import { AccessDenied } from "@/components/access-denied";
import { PageHeading } from "@/components/page-heading";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { requireDeveloperRole } from "@/server/auth/role-guard";
import { getEnvironmentHealthGroups, type EnvironmentHealthItem } from "@/server/operations/environment-health.service";

function statusLabel(status: EnvironmentHealthItem["status"]) {
  if (status === "ok") return "정상";
  if (status === "missing") return "필수 누락";
  return "선택 미설정";
}

function statusTone(status: EnvironmentHealthItem["status"]) {
  if (status === "ok") return "success";
  if (status === "missing") return "warning";
  return "neutral";
}

export default async function OperationsHealthPage() {
  const guard = await requireDeveloperRole();

  if (!guard.allowed) {
    return <AccessDenied message={guard.message} />;
  }

  const groups = getEnvironmentHealthGroups();
  const items = groups.flatMap((group) => group.items);
  const missingRequiredCount = items.filter((item) => item.status === "missing").length;
  const configuredCount = items.filter((item) => item.status === "ok").length;

  return (
    <div className="grid gap-5">
      <PageHeading
        title="운영 점검"
        description="배포 환경에서 필요한 연결값과 운영 보호 설정을 확인합니다. 키 원문은 표시하지 않습니다."
      />

      <div className="grid gap-3 md:grid-cols-3">
        <Card>
          <CardBody>
            <p className="text-xs font-semibold text-slate-500">설정된 항목</p>
            <p className="mt-1 text-2xl font-semibold text-slate-950">{configuredCount}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs font-semibold text-slate-500">필수 누락</p>
            <p className={missingRequiredCount > 0 ? "mt-1 text-2xl font-semibold text-amber-700" : "mt-1 text-2xl font-semibold text-emerald-700"}>
              {missingRequiredCount}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs font-semibold text-slate-500">배포 판정</p>
            <p className="mt-2">
              <Badge tone={missingRequiredCount > 0 ? "warning" : "success"}>
                {missingRequiredCount > 0 ? "필수 환경변수 확인 필요" : "필수 환경변수 준비됨"}
              </Badge>
            </p>
          </CardBody>
        </Card>
      </div>

      {groups.map((group) => (
        <Card key={group.title}>
          <CardHeader title={group.title} description={group.description} />
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500">
                  <tr>
                    <th className="px-5 py-3">항목</th>
                    <th className="px-5 py-3">상태</th>
                    <th className="px-5 py-3">값</th>
                    <th className="px-5 py-3">설명</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {group.items.map((item) => (
                    <tr key={item.key}>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-950">{item.label}</p>
                        <p className="mt-1 font-mono text-xs text-slate-500">{item.key}</p>
                      </td>
                      <td className="px-5 py-4">
                        <Badge tone={statusTone(item.status)}>{statusLabel(item.status)}</Badge>
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-700">{item.valuePreview}</td>
                      <td className="max-w-xl px-5 py-4 text-slate-600">{item.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
