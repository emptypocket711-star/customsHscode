import Link from "next/link";
import { Building2, ClipboardCheck, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import type { CompanyVerificationDashboard } from "@/server/repositories/company-verification-status.repository";
import type { PartnerPreferencesDashboard } from "@/server/repositories/partner-preferences.repository";

const activeVerificationStatuses = new Set(["operator_approved", "recommended_partner", "trade_history"]);

function verificationStatusLabel(status: string) {
  if (status === "operator_approved") return "운영자 승인";
  if (status === "recommended_partner") return "추천 파트너";
  if (status === "trade_history") return "거래 이력";
  if (status === "documents_submitted") return "서류 제출";
  if (status === "email_verified") return "이메일 인증";
  if (status === "suspended") return "숨김/정지";
  if (status === "blocked") return "차단";
  return "미검증";
}

function roleLabel(role: string) {
  if (role === "forwarder") return "포워더";
  if (role === "customs_broker") return "관세사";
  if (role === "foreign_shipper" || role === "overseas_partner") return "해외 수출입 파트너";
  if (role === "domestic_shipper" || role === "exporter_importer") return "국내 수출입 화주";
  return role;
}

function nextAction(verification: CompanyVerificationDashboard, preferences: PartnerPreferencesDashboard) {
  const hasRequesterRole = preferences.partyTypes.some((role) => role === "domestic_shipper" || role === "exporter_importer" || role === "foreign_shipper" || role === "overseas_partner");
  if (verification.companyRole !== "admin") return "회사 관리자에게 검증 증빙 또는 파트너 조건 수정을 요청합니다.";
  if (!hasRequesterRole) return "플랫폼 역할 신청에서 국내 수출입 화주 또는 해외 수출입 파트너 역할을 신청하거나 승인 상태를 확인합니다.";
  if (!activeVerificationStatuses.has(verification.verificationStatus)) return "회사 검증 증빙을 제출하거나 운영자 검토 결과를 기다립니다.";
  if (preferences.preferences.some((preference) => !preference.id)) return "포워더 또는 관세사무소 역할에 맞는 관심 조건을 저장합니다.";
  return "대시보드에서 요청 공개 또는 입찰 확인으로 이동합니다.";
}

export function CompanyPlatformOverviewPanel({
  partnerPreferences,
  verification
}: {
  partnerPreferences: PartnerPreferencesDashboard;
  verification: CompanyVerificationDashboard;
}) {
  const hasActiveVerification = activeVerificationStatuses.has(verification.verificationStatus);
  const savedPreferenceCount = partnerPreferences.preferences.filter((preference) => preference.id).length;

  return (
    <Card>
      <CardHeader
        action={<Badge tone={hasActiveVerification ? "success" : "warning"}>{verificationStatusLabel(verification.verificationStatus)}</Badge>}
        description="회사 검증, 플랫폼 역할, 파트너 관심 조건을 한 번에 확인합니다."
        title="플랫폼 참여 상태"
      />
      <CardBody className="grid gap-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <Building2 aria-hidden="true" className="text-blue-700" size={20} />
            <p className="mt-2 text-sm font-semibold text-slate-950">회사 검증</p>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              {verification.companyName ?? "회사명 확인 필요"} / 신뢰 점수 {verification.trustScore}
            </p>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <ClipboardCheck aria-hidden="true" className="text-blue-700" size={20} />
            <p className="mt-2 text-sm font-semibold text-slate-950">플랫폼 역할</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {partnerPreferences.partyTypes.length ? partnerPreferences.partyTypes.map((role) => (
                <Badge key={role} tone="neutral">{roleLabel(role)}</Badge>
              )) : (
                <Badge tone="neutral">승인 역할 없음</Badge>
              )}
              {!partnerPreferences.partyTypes.length && verification.roleIntents.map((role) => (
                <Badge key={`intent-${role}`} tone="info">가입 선택: {roleLabel(role)}</Badge>
              ))}
            </div>
            {!partnerPreferences.partyTypes.length && verification.roleIntents.length ? (
              <p className="mt-2 text-xs leading-5 text-slate-600">
                가입 시 선택한 유형은 확인됩니다. 운영자 승인 전에는 입찰·요청 권한이 부여되지 않습니다.
              </p>
            ) : null}
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <SlidersHorizontal aria-hidden="true" className="text-blue-700" size={20} />
            <p className="mt-2 text-sm font-semibold text-slate-950">관심 조건</p>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              저장 {savedPreferenceCount}건 / 설정 가능 {partnerPreferences.preferences.length}건
            </p>
          </div>
        </div>

        <div className="grid gap-3 rounded-md border border-blue-100 bg-blue-50 p-3 lg:grid-cols-[1fr_auto] lg:items-center">
          <p className="text-sm leading-6 text-blue-950">
            다음 작업: <span className="font-semibold">{nextAction(verification, partnerPreferences)}</span>
          </p>
          <Link className="focus-ring inline-flex h-10 items-center justify-center rounded-md bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800" data-navigation-progress="대시보드" href="/dashboard">
            대시보드로 이동
          </Link>
        </div>
      </CardBody>
    </Card>
  );
}
