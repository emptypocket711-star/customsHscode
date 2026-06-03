import { Building2, ClipboardCheck, FileCheck2, Route, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import type {
  CompanyOperationsCompanyList,
  CompanyRoleRequestReviewQueue,
  CompanyVerificationReviewQueue
} from "@/server/repositories/company-verification-review.repository";
import type { PlatformRequestOperationsSummary } from "@/server/repositories/platform-operations.repository";
import type { ManagedUser } from "@/server/rules/developer-users.service";

function attentionCompanyCount(companies: CompanyOperationsCompanyList) {
  return companies.items.filter((company) => (
    company.verificationStatus === "documents_submitted" ||
    company.verificationStatus === "email_verified" ||
    company.verificationStatus === "unverified" ||
    company.verificationStatus === "suspended" ||
    company.verificationStatus === "blocked"
  )).length;
}

function operationsTone(count: number): "neutral" | "warning" | "info" | "success" {
  return count > 0 ? "warning" : "success";
}

export function platformRequestAttentionCount(summary: PlatformRequestOperationsSummary) {
  if (!summary.schemaReady) return 1;

  return [
    summary.unansweredQuestions,
    summary.bidsReceived,
    summary.staleInProgress,
    summary.lowFeedbacks,
    summary.completedWithoutReport,
    summary.completionReportsSubmitted,
    summary.completionReportsAcknowledged,
    summary.completionReportsReadyToLock,
    summary.completedWithoutFeedback,
    summary.openWithoutMatches,
    summary.notifiedWithoutBids,
    summary.openWithoutBids,
    summary.staleDrafts,
    summary.staleOpen
  ].reduce((total, count) => total + count, 0);
}

export function buildOperationsUsersOwnerPrompt(input: {
  attentionCompanies: number;
  incompleteUsers: number;
  pendingRoleRequests: number;
  pendingVerificationDocuments: number;
  platformAttention: number;
}) {
  if (input.pendingRoleRequests > 0) {
    return `사용자 관리 화면에서 역할 신청 ${input.pendingRoleRequests}건을 우선 확인하고, 승인/반려 기준이 헷갈리는 항목을 더 쉽게 판단할 수 있게 고쳐줘.`;
  }

  if (input.pendingVerificationDocuments > 0) {
    return `사용자 관리 화면에서 회사 검증 증빙 ${input.pendingVerificationDocuments}건을 우선 확인하고, 검증 처리에 필요한 정보만 먼저 보이게 고쳐줘.`;
  }

  if (input.attentionCompanies > 0) {
    return `사용자 관리 화면에서 상태 확인이 필요한 업체 ${input.attentionCompanies}건을 우선 분석하고, 정지/차단/미검증 업체를 더 쉽게 구분하게 고쳐줘.`;
  }

  if (input.platformAttention > 0) {
    return `운영 관리 홈에서 플랫폼 요청 병목 ${input.platformAttention}건을 우선 확인하고, 요청·입찰·완료 흐름 중 오늘 맡길 작업만 더 선명하게 고쳐줘.`;
  }

  if (input.incompleteUsers > 0) {
    return `사용자 관리 화면에서 가입 미완료 사용자 ${input.incompleteUsers}명을 확인하고, 실제 문의 대응에 필요한 검색과 상태 표시를 더 쉽게 고쳐줘.`;
  }

  return "사용자 관리 화면은 오늘 급한 처리 건이 없습니다. 다음 개선 작업으로 운영 화면의 불필요한 정보 노출을 더 줄여줘.";
}

export function OperationsUsersPriorityPanel({
  companies,
  platformRequestSummary,
  roleRequests,
  users,
  verificationQueue
}: {
  companies: CompanyOperationsCompanyList;
  platformRequestSummary: PlatformRequestOperationsSummary;
  roleRequests: CompanyRoleRequestReviewQueue;
  users: ManagedUser[];
  verificationQueue: CompanyVerificationReviewQueue;
}) {
  const pendingRoleRequests = roleRequests.items.filter((item) => item.status === "submitted").length;
  const pendingVerificationDocuments = verificationQueue.items.filter((item) => item.status === "submitted").length;
  const attentionCompanies = attentionCompanyCount(companies);
  const incompleteUsers = users.filter((user) => !user.onboardingCompletedAt).length;
  const platformAttention = platformRequestAttentionCount(platformRequestSummary);
  const ownerPrompt = buildOperationsUsersOwnerPrompt({
    attentionCompanies,
    incompleteUsers,
    pendingRoleRequests,
    pendingVerificationDocuments,
    platformAttention
  });

  const primaryAction = pendingRoleRequests > 0
    ? "역할 신청을 먼저 승인·반려합니다."
    : pendingVerificationDocuments > 0
      ? "회사 검증 증빙을 먼저 검토합니다."
      : attentionCompanies > 0
        ? "상태 이상 업체를 확인합니다."
        : platformAttention > 0
          ? "플랫폼 요청 병목을 확인합니다."
          : "오늘 급한 운영 처리 건은 없습니다.";

  const items = [
    {
      count: pendingRoleRequests,
      description: "승인 시 입찰·요청 권한에 영향을 줍니다.",
      href: "#role-requests",
      icon: ClipboardCheck,
      label: "역할 신청",
      tone: operationsTone(pendingRoleRequests)
    },
    {
      count: pendingVerificationDocuments,
      description: "회사 검증 상태를 바꾸는 증빙입니다.",
      href: "#verification-documents",
      icon: FileCheck2,
      label: "검증 증빙",
      tone: operationsTone(pendingVerificationDocuments)
    },
    {
      count: attentionCompanies,
      description: "미검증, 정지, 차단 업체를 확인합니다.",
      href: "#company-status",
      icon: Building2,
      label: "업체 상태",
      tone: operationsTone(attentionCompanies)
    },
    {
      count: platformAttention,
      description: "요청·입찰·완료 흐름에서 오늘 맡길 병목입니다.",
      href: "#platform-request-operations",
      icon: Route,
      label: "플랫폼 병목",
      tone: operationsTone(platformAttention)
    },
    {
      count: incompleteUsers,
      description: "문의가 있을 때만 상세 계정을 펼칩니다.",
      href: "#user-management",
      icon: UserRound,
      label: "사용자 상세",
      tone: incompleteUsers > 0 ? "info" as const : "neutral" as const
    }
  ];

  return (
    <Card>
      <CardHeader
        action={<Badge tone={pendingRoleRequests + pendingVerificationDocuments + attentionCompanies > 0 ? "warning" : "success"}>{primaryAction}</Badge>}
        description="운영자는 아래 순서대로 보면 됩니다. 사용자 상세 관리는 문의가 들어온 계정이 있을 때만 확인합니다."
        title="오늘 먼저 볼 일"
      />
      <CardBody className="grid gap-4">
        <div className="rounded-md border border-blue-100 bg-blue-50 px-4 py-3">
          <p className="text-sm font-semibold text-blue-950">대표 판단 기준</p>
          <p className="mt-1 text-sm leading-6 text-blue-900">{primaryAction}</p>
          <p className="mt-3 rounded-md bg-white px-3 py-2 text-xs font-semibold leading-5 text-blue-800 ring-1 ring-blue-100">
            나에게 요청할 문구: {ownerPrompt}
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <a
                className="focus-ring grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm transition hover:border-blue-200 hover:bg-blue-50"
                href={item.href}
                key={item.label}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-2 font-semibold text-slate-950">
                    <Icon aria-hidden="true" className="text-blue-700" size={18} />
                    {item.label}
                  </span>
                  <Badge tone={item.tone}>{item.count}건</Badge>
                </span>
                <span className="text-xs leading-5 text-slate-600">{item.description}</span>
              </a>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}
